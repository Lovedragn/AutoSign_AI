import os
import time
import jwt
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from services.storage_service import get_user_by_email, save_user
import config

SECRET_KEY = config.SECRET_KEY
GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID


def generate_token(user):
    payload = {
        "sub": user.get("email"),
        "name": user.get("name"),
        "email": user.get("email"),
        "picture": user.get("picture"),
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400 * 30  # 30 days
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def verify_jwt_token(token):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded
    except Exception:
        return None


def verify_google_oauth_token(token_str):
    """
    Verifies Google ID Token or Access Token and returns user profile + JWT session.
    """
    if not token_str:
        return None

    # 1. Try Google ID Token verification (JWT format credential)
    try:
        req = google_requests.Request()
        id_info = id_token.verify_oauth2_token(
            token_str,
            req,
            audience=GOOGLE_CLIENT_ID if GOOGLE_CLIENT_ID else None,
            clock_skew_in_seconds=10
        )
        user_data = {
            "id": id_info.get("sub"),
            "name": id_info.get("name") or id_info.get("given_name") or "Google User",
            "email": id_info.get("email"),
            "picture": id_info.get("picture"),
            "authType": "google",
            "verified": id_info.get("email_verified", True)
        }
        save_user(user_data)
        auth_token = generate_token(user_data)
        return {"user": user_data, "token": auth_token}
    except Exception as id_token_err:
        pass  # Token is not an ID Token; proceed to Access Token verification

    # 2. Try Google Access Token verification via userinfo endpoint
    try:
        res = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_str}"},
            timeout=10
        )
        if res.status_code == 200:
            profile = res.json()
            user_data = {
                "id": profile.get("sub"),
                "name": profile.get("name") or profile.get("given_name") or "Google User",
                "email": profile.get("email"),
                "picture": profile.get("picture"),
                "authType": "google",
                "verified": profile.get("email_verified", True)
            }
            save_user(user_data)
            auth_token = generate_token(user_data)
            return {"user": user_data, "token": auth_token}
    except Exception as access_token_err:
        print("Google Access Token verification error:", access_token_err)

    return None


def authenticate_or_register_email(email, name=None):
    user = get_user_by_email(email)
    if not user:
        user_name = name or email.split("@")[0]
        user = {
            "email": email,
            "name": user_name,
            "picture": None,
            "authType": "email"
        }
        save_user(user)
    token = generate_token(user)
    return {"user": user, "token": token}
