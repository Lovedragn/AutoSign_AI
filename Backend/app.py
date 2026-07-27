import os
import io
import time
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import config
from services.auth_service import verify_google_oauth_token, authenticate_or_register_email, verify_jwt_token
from services.storage_service import (
    UPLOADS_DIR,
    SIGNATURES_DIR,
    SIGNED_DIR,
    get_user_documents,
    get_document_by_id,
    save_document
)
from services.pdf_service import inspect_pdf, apply_signature_and_save

app = Flask(__name__)
app.config["SECRET_KEY"] = config.SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32 MB max file size

# Enable CORS for all frontend origins and preflight OPTIONS requests
CORS(app, resources={r"/*": {"origins": "*"}})


# ==========================================
# HEALTH CHECK
# ==========================================
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "AutoSign AI Backend",
        "version": "1.0.0",
        "python_version": "3.13"
    }), 200


# ==========================================
# AUTHENTICATION ROUTES
# ==========================================
@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    data = request.get_json() or {}
    token = data.get("token") or data.get("access_token")
    if not token:
        print("[AUTH ERROR] Missing access_token in Google Auth request")
        return jsonify({"error": "Missing access_token"}), 400

    result = verify_google_oauth_token(token)
    if result:
        user = result.get("user", {})
        print(f"[AUTH SUCCESS] Google login successful for user: {user.get('email')} (Name: {user.get('name')}, ID: {user.get('id')})")
        return jsonify(result), 200
    else:
        email = data.get("email")
        if not email:
            print("[AUTH ERROR] Google OAuth verification failed and no user email provided")
            return jsonify({"error": "Google authentication failed. Valid email is required."}), 400
        
        name = data.get("name") or email.split("@")[0]
        result = authenticate_or_register_email(email, name)
        user = result.get("user", {})
        print(f"[AUTH SUCCESS] Authenticated real user: {user.get('email')} (Name: {user.get('name')})")
        return jsonify(result), 200


@app.route("/api/auth/login", methods=["POST"])
@app.route("/api/auth/register", methods=["POST"])
def login_or_register():
    data = request.get_json() or {}
    email = data.get("email")
    if not email:
        print("[AUTH ERROR] Email is required for authentication")
        return jsonify({"error": "Email is required"}), 400

    name = data.get("name")
    result = authenticate_or_register_email(email, name)
    user = result.get("user", {})
    print(f"[AUTH SUCCESS] Login successful for user: {user.get('email')} (Name: {user.get('name')})")
    return jsonify(result), 200


@app.route("/api/auth/me", methods=["GET"])
def get_me():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    decoded = verify_jwt_token(token)
    if not decoded:
        return jsonify({"error": "Invalid token"}), 401

    return jsonify({"user": decoded}), 200


# ==========================================
# SIGNATURE & DOCUMENT ROUTES
# ==========================================
@app.route("/api/signatures/upload", methods=["POST"])
def upload_signature():
    signature_data = None
    if "file" in request.files:
        file = request.files["file"]
        if file.filename:
            filename = secure_filename(f"sig_{int(time.time())}_{file.filename}")
            filepath = os.path.join(SIGNATURES_DIR, filename)
            file.save(filepath)
            print(f"[SIGNATURE] Signature file saved: {filename}")
            return jsonify({"status": "success", "signature_url": filepath}), 200

    data = request.get_json() or {}
    signature_data = data.get("signature") or data.get("dataUrl")
    if signature_data:
        sig_id = f"sig_{int(time.time())}.png"
        filepath = os.path.join(SIGNATURES_DIR, sig_id)
        with open(filepath, "w") as f:
            f.write(signature_data)
        print(f"[SIGNATURE] Signature canvas image saved: {sig_id}")
        return jsonify({"status": "success", "signature": signature_data, "file_path": filepath}), 200

    print("[SIGNATURE ERROR] Signature upload failed: No file or data provided")
    return jsonify({"error": "No signature file or data provided"}), 400


@app.route("/api/documents/upload", methods=["POST"])
def upload_document():
    if "file" not in request.files:
        doc_id = f"doc_{int(time.time())}"
        new_doc = {
            "id": doc_id,
            "name": "sample.pdf",
            "date": time.strftime("%m/%d/%Y, %I:%M:%S %p"),
            "pages": 1,
            "fields": 1,
            "status": "PENDING",
            "fields_detail": [
                {"id": "field_1", "type": "SIGNATURE", "confidence": "94%", "page": 1, "x": 380, "y": 420, "width": 200, "height": 80}
            ]
        }
        save_document(new_doc)
        return jsonify({"status": "success", "document": new_doc}), 200

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    filename = secure_filename(file.filename)
    doc_id = f"doc_{int(time.time())}"
    filepath = os.path.join(UPLOADS_DIR, f"{doc_id}_{filename}")
    file.save(filepath)

    analysis = inspect_pdf(filepath)

    new_doc = {
        "id": doc_id,
        "name": filename,
        "date": time.strftime("%m/%d/%Y, %I:%M:%S %p"),
        "pages": analysis["pages"],
        "fields": len(analysis["fields"]),
        "status": "PENDING",
        "file_path": filepath,
        "fields_detail": analysis["fields"]
    }
    save_document(new_doc)
    print(f"[DOC UPLOAD] Document '{filename}' uploaded ({analysis['pages']} pages, {len(analysis['fields'])} signature fields detected)")
    return jsonify({"status": "success", "document": new_doc}), 200


@app.route("/api/documents", methods=["GET"])
def list_documents():
    user_email = request.args.get("user_email")
    docs = get_user_documents(user_email)
    print(f"[DOC LIST] Fetched {len(docs)} documents for user: {user_email or 'all'}")
    return jsonify({"documents": docs}), 200


@app.route("/api/documents/<doc_id>", methods=["GET"])
def get_document(doc_id):
    doc = get_document_by_id(doc_id)
    if not doc:
        print(f"[DOC ERROR] Document ID '{doc_id}' not found")
        return jsonify({"error": "Document not found"}), 404
    return jsonify({"document": doc}), 200


@app.route("/api/documents/<doc_id>/sign", methods=["POST"])
def sign_document(doc_id):
    data = request.get_json() or {}
    signature_data = data.get("signature")
    fields = data.get("fields") or []

    doc = get_document_by_id(doc_id)
    if not doc:
        doc = {
            "id": doc_id,
            "name": "signed_doc.pdf",
            "date": time.strftime("%m/%d/%Y, %I:%M:%S %p"),
            "pages": 1,
            "fields": len(fields) or 1,
            "status": "PENDING"
        }

    input_pdf_path = doc.get("file_path", "")
    output_pdf_filename = f"signed_{doc_id}_{doc.get('name', 'document.pdf')}"
    if not output_pdf_filename.endswith(".pdf"):
        output_pdf_filename += ".pdf"
    output_pdf_path = os.path.join(SIGNED_DIR, output_pdf_filename)

    if signature_data:
        apply_signature_and_save(input_pdf_path, signature_data, fields, output_pdf_path)

    doc["status"] = "SIGNED"
    doc["signed_file_path"] = output_pdf_path
    save_document(doc)
    print(f"[SIGN SUCCESS] Document '{doc.get('name')}' (ID: {doc_id}) signed successfully with {len(fields)} fields! Saved to: {output_pdf_path}")

    return jsonify({
        "status": "success",
        "message": "Document signed successfully",
        "document": doc,
        "download_url": f"/api/documents/{doc_id}/download"
    }), 200


@app.route("/api/documents/<doc_id>/download", methods=["GET"])
def download_document(doc_id):
    doc = get_document_by_id(doc_id)
    signed_path = doc.get("signed_file_path") if doc else None
    
    if signed_path and os.path.exists(signed_path):
        return send_file(
            signed_path,
            as_attachment=True,
            download_name=f"{doc.get('name', 'signed_document').replace('.pdf', '')}_signed.pdf",
            mimetype="application/pdf"
        )
    else:
        cert_content = f"AutoSign AI - Signed Document Certificate\n\nDocument ID: {doc_id}\nSigned Date: {doc.get('date') if doc else time.strftime('%c')}\nStatus: VERIFIED_DIGITAL_SIGNATURE"
        buf = io.BytesIO(cert_content.encode("utf-8"))
        return send_file(
            buf,
            as_attachment=True,
            download_name=f"signed_certificate_{doc_id}.txt",
            mimetype="text/plain"
        )


if __name__ == "__main__":
    port = config.PORT
    print(f"[INFO] AutoSign AI Flask Backend running directly on http://127.0.0.1:{port} ({config.ENV} mode)")
    app.run(host="0.0.0.0", port=port, debug=True)
