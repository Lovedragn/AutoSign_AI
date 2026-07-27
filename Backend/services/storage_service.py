import json
import os
import time

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
SIGNATURES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "signatures")
SIGNED_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "signed_docs")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(SIGNATURES_DIR, exist_ok=True)
os.makedirs(SIGNED_DIR, exist_ok=True)

USERS_FILE = os.path.join(DATA_DIR, "users.json")
DOCS_FILE = os.path.join(DATA_DIR, "documents.json")


def _read_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def _write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def get_user_by_email(email):
    users = _read_json(USERS_FILE, [])
    return next((u for u in users if u.get("email") == email), None)


def save_user(user_data):
    users = _read_json(USERS_FILE, [])
    existing_idx = next((i for i, u in enumerate(users) if u.get("email") == user_data.get("email")), None)
    if existing_idx is not None:
        users[existing_idx].update(user_data)
    else:
        users.append(user_data)
    _write_json(USERS_FILE, users)
    return user_data


def get_user_documents(user_email):
    docs = _read_json(DOCS_FILE, [])
    # Return documents matching user_email or initial sample docs
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
        _write_json(DOCS_FILE, docs)
        user_docs = [initial_doc]
    return user_docs


def get_document_by_id(doc_id):
    docs = _read_json(DOCS_FILE, [])
    return next((d for d in docs if d.get("id") == doc_id), None)


def save_document(doc_data):
    docs = _read_json(DOCS_FILE, [])
    existing_idx = next((i for i, d in enumerate(docs) if d.get("id") == doc_data.get("id")), None)
    if existing_idx is not None:
        docs[existing_idx].update(doc_data)
    else:
        docs.insert(0, doc_data)
    _write_json(DOCS_FILE, docs)
    return doc_data
