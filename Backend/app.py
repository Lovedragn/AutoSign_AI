from flask import Flask, jsonify
from flask_cors import CORS
import config

app = Flask(__name__)
app.config["SECRET_KEY"] = config.SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32 MB max file size

# Enable CORS for frontend Vite app
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register blueprints
from routes.auth_routes import auth_bp
from routes.doc_routes import doc_bp

app.register_blueprint(auth_bp)
app.register_blueprint(doc_bp)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "AutoSign AI Backend",
        "version": "1.0.0",
        "python_version": "3.13"
    }), 200


if __name__ == "__main__":
    port = config.PORT
    print(f"[INFO] AutoSign AI Flask Backend running on http://127.0.0.1:{port} ({config.ENV} mode)")
    app.run(host="0.0.0.0", port=port, debug=True)
