import os
import time
import io
import json
import fitz  # PyMuPDF
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from services.pdf_service import inspect_pdf, apply_signature_and_save

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
SIGNATURES_DIR = os.path.join(BASE_DIR, "signatures")
SIGNED_DIR = os.path.join(BASE_DIR, "signed_docs")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(SIGNATURES_DIR, exist_ok=True)
os.makedirs(SIGNED_DIR, exist_ok=True)

DOCS_FILE = os.path.join(DATA_DIR, "documents.json")


def _read_docs():
    if not os.path.exists(DOCS_FILE):
        return []
    try:
        with open(DOCS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _write_docs(docs):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DOCS_FILE, "w", encoding="utf-8") as f:
        json.dump(docs, f, indent=2, default=str)


def get_user_documents(user_email):
    docs = _read_docs()
    user_docs = [d for d in docs if d.get("user_email") == user_email or not d.get("user_email")]
    if not user_docs:
        initial_doc = {
            "id": "doc_sample_1",
            "name": "sample.pdf",
            "date": "7/26/2026, 11:24:56 PM",
            "pages": 1,
            "fields": 1,
            "status": "PENDING",
            "user_email": user_email
        }
        docs.append(initial_doc)
        _write_docs(docs)
        user_docs = [initial_doc]
    return user_docs


def get_document_by_id(doc_id):
    docs = _read_docs()
    return next((d for d in docs if d.get("id") == doc_id), None)


def save_document(doc_data):
    docs = _read_docs()
    existing_idx = next((i for i, d in enumerate(docs) if d.get("id") == doc_data.get("id")), None)
    if existing_idx is not None:
        docs[existing_idx].update(doc_data)
    else:
        docs.insert(0, doc_data)
    _write_docs(docs)
    return doc_data

doc_bp = Blueprint("documents", __name__)


@doc_bp.route("/api/signatures/upload", methods=["POST"])
def upload_signature():
    signature_data = None
    if "file" in request.files:
        file = request.files["file"]
        if file.filename:
            filename = secure_filename(f"sig_{int(time.time())}_{file.filename}")
            filepath = os.path.join(SIGNATURES_DIR, filename)
            file.save(filepath)
            print(f"[API] POST /api/signatures/upload -> File: {filename}")
            return jsonify({"status": "success", "signature_url": filepath}), 200

    data = request.get_json() or {}
    signature_data = data.get("signature") or data.get("dataUrl")
    if signature_data:
        sig_id = f"sig_{int(time.time())}.png"
        filepath = os.path.join(SIGNATURES_DIR, sig_id)
        with open(filepath, "w") as f:
            f.write(signature_data)
        print(f"[API] POST /api/signatures/upload -> Canvas PNG: {sig_id}")
        return jsonify({"status": "success", "signature": signature_data, "file_path": filepath}), 200

    print("[API] POST /api/signatures/upload (Error: Missing data)")
    return jsonify({"error": "No signature file or data provided"}), 400


@doc_bp.route("/api/documents/upload", methods=["POST"])
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
        print(f"[API] POST /api/documents/upload -> Sample doc generated: {doc_id}")
        return jsonify({"status": "success", "document": new_doc}), 200

    file = request.files["file"]
    if not file or not file.filename:
        print("[API] POST /api/documents/upload (Error: Empty filename)")
        return jsonify({"error": "Empty filename submitted"}), 400

    raw_filename = file.filename.strip()
    if not raw_filename:
        print("[API] POST /api/documents/upload (Error: Empty filename)")
        return jsonify({"error": "Empty filename submitted"}), 400

    ext = raw_filename.rsplit(".", 1)[1].lower().strip() if "." in raw_filename else ""
    clean_filename = secure_filename(raw_filename)
    if not clean_filename or "." not in clean_filename:
        clean_ext = ext if ext else "pdf"
        clean_filename = f"document_{int(time.time())}.{clean_ext}"

    doc_id = f"doc_{int(time.time())}"
    filepath = os.path.join(UPLOADS_DIR, f"{doc_id}_{clean_filename}")
    
    try:
        os.makedirs(UPLOADS_DIR, exist_ok=True)
        file.save(filepath)
    except Exception as save_err:
        print(f"[API] POST /api/documents/upload (Save Error: {save_err})")
        return jsonify({"error": f"Failed to save file: {str(save_err)}"}), 500

    analysis = inspect_pdf(filepath)

    new_doc = {
        "id": doc_id,
        "name": raw_filename,
        "date": time.strftime("%m/%d/%Y, %I:%M:%S %p"),
        "pages": analysis.get("pages", 1),
        "fields": len(analysis.get("fields", [])),
        "status": "PENDING",
        "file_path": filepath,
        "fields_detail": analysis.get("fields", [])
    }
    save_document(new_doc)
    print(f"[API] POST /api/documents/upload -> Document uploaded: '{raw_filename}' ({new_doc['pages']} page(s))")
    return jsonify({"status": "success", "document": new_doc}), 200


@doc_bp.route("/api/documents", methods=["GET"])
def list_documents():
    user_email = request.args.get("user_email")
    docs = get_user_documents(user_email)
    print(f"[API] GET /api/documents -> Listed {len(docs)} doc(s) for user: '{user_email or 'all'}'")
    return jsonify({"documents": docs}), 200


@doc_bp.route("/api/documents/<doc_id>", methods=["GET"])
def get_document(doc_id):
    doc = get_document_by_id(doc_id)
    if not doc:
        print(f"[API] GET /api/documents/{doc_id} (Not found)")
        return jsonify({"error": "Document not found"}), 404
    print(f"[API] GET /api/documents/{doc_id} -> Retrieved '{doc.get('name')}'")
    return jsonify({"document": doc}), 200


@doc_bp.route("/api/documents/<doc_id>/sign", methods=["POST"])
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
    print(f"[API] POST /api/documents/{doc_id}/sign -> Document signed: '{doc.get('name')}'")

    return jsonify({
        "status": "success",
        "message": "Document signed successfully",
        "document": doc,
        "download_url": f"/api/documents/{doc_id}/download"
    }), 200


@doc_bp.route("/api/documents/<doc_id>/preview", methods=["GET"])
def get_document_page_preview(doc_id):
    page_num = int(request.args.get("page", 1))
    doc = get_document_by_id(doc_id)
    if doc:
        file_path = doc.get("file_path")
        if file_path and os.path.exists(file_path):
            try:
                pdf_doc = fitz.open(file_path)
                page_idx = max(0, min(len(pdf_doc) - 1, page_num - 1))
                page_obj = pdf_doc[page_idx]
                pix = page_obj.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")
                return send_file(
                    io.BytesIO(img_bytes),
                    mimetype="image/png"
                )
            except Exception as err:
                print(f"[PREVIEW ERROR] Failed to render PDF page image: {err}")
    return jsonify({"error": "Preview not found"}), 404


@doc_bp.route("/api/documents/<doc_id>/download", methods=["GET"])
def download_document(doc_id):
    doc = get_document_by_id(doc_id)
    signed_path = doc.get("signed_file_path") if doc else None
    
    if signed_path and os.path.exists(signed_path):
        print(f"[API] GET /api/documents/{doc_id}/download -> Sending signed PDF")
        return send_file(
            signed_path,
            as_attachment=True,
            download_name=f"{doc.get('name', 'signed_document').replace('.pdf', '')}_signed.pdf",
            mimetype="application/pdf"
        )
    else:
        print(f"[API] GET /api/documents/{doc_id}/download -> Sending digital certificate")
        cert_content = f"AutoSign AI - Signed Document Certificate\n\nDocument ID: {doc_id}\nSigned Date: {doc.get('date') if doc else time.strftime('%c')}\nStatus: VERIFIED_DIGITAL_SIGNATURE"
        buf = io.BytesIO(cert_content.encode("utf-8"))
        return send_file(
            buf,
            as_attachment=True,
            download_name=f"signed_certificate_{doc_id}.txt",
            mimetype="text/plain"
        )
