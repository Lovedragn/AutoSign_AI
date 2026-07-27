import os
from dotenv import load_dotenv

# Directory paths
base_dir = os.path.dirname(os.path.abspath(__file__))
dev_env_path = os.path.join(base_dir, ".dev.env")
prod_env_path = os.path.join(base_dir, ".prod.env")
env_path = os.path.join(base_dir, ".env")

# Priority: .dev.env > .prod.env > .env
if os.path.exists(dev_env_path):
    print("[CONFIG] Loading environment from .dev.env")
    load_dotenv(dev_env_path, override=True)
elif os.path.exists(prod_env_path):
    print("[CONFIG] Loading environment from .prod.env")
    load_dotenv(prod_env_path, override=True)
elif os.path.exists(env_path):
    print("[CONFIG] Loading environment from .env")
    load_dotenv(env_path, override=True)
else:
    print("[CONFIG] No env file found, using system default environment variables")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID") or ""
SECRET_KEY = os.getenv("SECRET_KEY", "autosign-secret-key-2026")
PORT = int(os.getenv("PORT", 5000))
ENV = os.getenv("ENV", "development")
