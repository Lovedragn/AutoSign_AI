import sys
import os
import builtins

# Force unbuffered output so print statements display instantly in the terminal
os.environ["PYTHONUNBUFFERED"] = "1"

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(line_buffering=True, encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(line_buffering=True, encoding="utf-8", errors="replace")
    except Exception:
        pass

# Global print wrapper to force immediate flushing to terminal
_original_print = builtins.print
def print(*args, **kwargs):
    kwargs.setdefault("flush", True)
    _original_print(*args, **kwargs)

from flask import Flask, jsonify
from flask_cors import CORS
import config

from routes.auth_routes import auth_bp
from routes.doc_routes import doc_bp

app = Flask(__name__)
app.config["SECRET_KEY"] = config.SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32 MB max file size

# Enable CORS for all frontend origins and preflight OPTIONS requests
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    return response

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"[API ERROR] Unhandled Exception: {e}")
    response = jsonify({"error": str(e), "message": "An internal server error occurred"})
    response.status_code = 500
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

# Register Controller Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(doc_bp)


# ==========================================
# HEALTH CHECK
# ==========================================
@app.route("/", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "AutoSign AI Backend",
        "version": "1.0.0",
        "python_version": "3.13"
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", config.PORT))
    print(f"[INFO] AutoSign AI Backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)