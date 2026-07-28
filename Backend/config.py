import os
from dotenv import load_dotenv

# Directory paths
base_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(base_dir, ".env")
root_env_path = os.path.join(os.path.dirname(base_dir), ".env")

# Priority: Backend/.env > root/.env
if os.path.exists(env_path):
    print("[CONFIG] Loading environment from Backend/.env")
    load_dotenv(env_path, override=True)
elif os.path.exists(root_env_path):
    print("[CONFIG] Loading environment from root .env")
    load_dotenv(root_env_path, override=True)
else:
    print("[CONFIG] No .env file found, using system environment variables")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID") or ""
SECRET_KEY = os.getenv("SECRET_KEY", "autosign-secret-key-2026")
PORT = int(os.getenv("PORT", 5000))
ENV = os.getenv("ENV", "development")
OCR_SPACE_API_KEY = os.getenv("OCR_SPACE_API_KEY", "K85199466988957")
