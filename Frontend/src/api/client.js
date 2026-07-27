import { API_BASE_URL } from "../config";

export async function authGoogle(tokenResponse, extraData = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
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
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
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
    const res = await fetch(`${API_BASE_URL}/api/signatures/upload`, {
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

export async function uploadDocumentApi(fileOrName) {
  try {
    const formData = new FormData();
    if (fileOrName && typeof fileOrName !== "string") {
      formData.append("file", fileOrName);
    }
    const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Document upload failed");
    return await res.json();
  } catch (err) {
    console.warn("Backend document upload failed:", err);
    return null;
  }
}

export async function fetchDocumentsApi(userEmail = "") {
  try {
    const res = await fetch(`${API_BASE_URL}/documents?user_email=${encodeURIComponent(userEmail)}`);
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
    const res = await fetch(`${API_BASE_URL}/documents/${docId}/sign`, {
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
  return `${API_BASE_URL}/documents/${docId}/download`;
}
