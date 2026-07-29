import { API_BASE_URL } from "../config";

const rawUrl = (API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE = rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;

export async function pingBackend() {
  try {
    const rootUrl = rawUrl.replace(/\/api$/, "");
    const res = await fetch(`${rootUrl}/`, { method: "GET" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.log("[AutoSign] Backend cold-start pinging...");
    return null;
  }
}

export async function authGoogle(tokenResponse, extraData = {}) {
  try {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokenResponse?.access_token || tokenResponse,
        ...extraData
      })
    });
    if (!res.ok) throw new Error("Google auth request failed");
    return await res.json();
  } catch (err) {
    console.warn("Backend auth failed, using local session:", err);
    return null;
  }
}

export async function authLogin(email, name = "") {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name })
    });
    if (!res.ok) throw new Error("Login request failed");
    return await res.json();
  } catch (err) {
    console.warn("Backend login failed, using local session:", err);
    return null;
  }
}

export async function uploadSignatureApi(signatureData) {
  try {
    const res = await fetch(`${API_BASE}/signatures/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature: signatureData })
    });
    if (!res.ok) throw new Error("Signature upload failed");
    return await res.json();
  } catch (err) {
    console.warn("Backend signature upload failed:", err);
    return null;
  }
}

export async function uploadDocumentApi(file) {
  try {
    const formData = new FormData();
    if (file && typeof file !== "string") {
      formData.append("file", file);
    }
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      const errDetails = await res.json().catch(() => ({}));
      console.warn("Backend document upload HTTP error:", res.status, errDetails);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("Backend document upload failed:", err);
    return null;
  }
}

export async function fetchDocumentsApi(userEmail = "") {
  try {
    const res = await fetch(`${API_BASE}/documents?user_email=${encodeURIComponent(userEmail)}`);
    if (!res.ok) throw new Error("Fetch documents failed");
    const data = await res.json();
    return data.documents || [];
  } catch (err) {
    console.warn("Backend fetch documents failed:", err);
    return null;
  }
}

export async function signDocumentApi(docId, signatureData, fields) {
  try {
    const res = await fetch(`${API_BASE}/documents/${docId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature: signatureData, fields })
    });
    if (!res.ok) throw new Error("Sign document failed");
    return await res.json();
  } catch (err) {
    console.warn("Backend sign document failed:", err);
    return null;
  }
}

export function getDownloadUrl(docId) {
  return `${API_BASE}/documents/${docId}/download`;
}

export function getDocumentFileUrl(docId) {
  return `${API_BASE}/documents/${docId}/file`;
}

export function getDocumentPagePreviewUrl(docId, page = 1) {
  return `${API_BASE}/documents/${docId}/preview?page=${page}`;
}
