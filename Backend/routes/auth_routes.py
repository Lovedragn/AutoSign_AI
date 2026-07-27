from flask import Blueprint, request, jsonify
from services.auth_service import verify_google_oauth_token, authenticate_or_register_email, verify_jwt_token

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/google", methods=["POST"])
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


@auth_bp.route("/api/auth/login", methods=["POST"])
@auth_bp.route("/api/auth/register", methods=["POST"])
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


@auth_bp.route("/api/auth/me", methods=["GET"])
def get_me():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    decoded = verify_jwt_token(token)
    if not decoded:
        return jsonify({"error": "Invalid token"}), 401

    return jsonify({"user": decoded}), 200
