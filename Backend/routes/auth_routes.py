from flask import Blueprint, request, jsonify
from services.auth_service import verify_google_oauth_token, authenticate_or_register_email, verify_jwt_token

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/google", methods=["POST"])
def google_auth():
    data = request.get_json() or {}
    token = data.get("token") or data.get("access_token")
    if not token:
        print("[API] POST /api/auth/google (Error: Missing token)")
        return jsonify({"error": "Missing access_token"}), 400

    result = verify_google_oauth_token(token)
    if result:
        user = result.get("user", {})
        print(f"[API] POST /api/auth/google -> User: {user.get('email')}")
        return jsonify(result), 200
    else:
        email = data.get("email")
        if not email:
            print("[API] POST /api/auth/google (Error: Invalid token & email)")
            return jsonify({"error": "Google authentication failed. Valid email is required."}), 400
        
        name = data.get("name") or email.split("@")[0]
        result = authenticate_or_register_email(email, name)
        user = result.get("user", {})
        print(f"[API] POST /api/auth/google -> User: {user.get('email')}")
        return jsonify(result), 200


@auth_bp.route("/api/auth/login", methods=["POST"])
@auth_bp.route("/api/auth/register", methods=["POST"])
def login_or_register():
    data = request.get_json() or {}
    email = data.get("email")
    if not email:
        print("[API] POST /api/auth/login (Error: Missing email)")
        return jsonify({"error": "Email is required"}), 400

    name = data.get("name")
    result = authenticate_or_register_email(email, name)
    user = result.get("user", {})
    print(f"[API] POST /api/auth/login -> User: {user.get('email')}")
    return jsonify(result), 200


@auth_bp.route("/api/auth/me", methods=["GET"])
def get_me():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        print("[API] GET /api/auth/me (Unauthorized)")
        return jsonify({"error": "Unauthorized"}), 401

    decoded = verify_jwt_token(token)
    if not decoded:
        print("[API] GET /api/auth/me (Invalid token)")
        return jsonify({"error": "Invalid token"}), 401

    print(f"[API] GET /api/auth/me -> Session verified: {decoded.get('email')}")
    return jsonify({"user": decoded}), 200
