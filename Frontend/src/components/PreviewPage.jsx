import { useState, useRef } from "react";
import { ArrowLeft, Plus, Check, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { signDocumentApi, getDownloadUrl } from "../api/client";

export default function PreviewPage({ doc, signature, setCurrentPage, setDocuments, documents }) {
  const [fields, setFields] = useState([
    { id: "field_1", type: "SIGNATURE", confidence: "40%", page: 1, x: 420, y: 440, width: 220, height: 90 }
  ]);
  const [activeFieldId, setActiveFieldId] = useState("field_1");
  const [isSigning, setIsSigning] = useState(false);
  const [signedDone, setSignedDone] = useState(false);
  const [page, setPage] = useState(1);

  const pdfContainerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const addManualField = () => {
    const newField = {
      id: "field_" + Date.now(),
      type: "SIGNATURE",
      confidence: "MANUAL",
      page: page,
      x: 180 + fields.length * 30,
      y: 220 + fields.length * 30,
      width: 200,
      height: 80
    };
    setFields([...fields, newField]);
    setActiveFieldId(newField.id);
  };

  // Dragging logic for signature fields
  const handleMouseDown = (e, fieldId) => {
    e.stopPropagation();
    setActiveFieldId(fieldId);
    isDraggingRef.current = true;
    const field = fields.find((f) => f.id === fieldId);
    if (field) {
      dragOffsetRef.current = {
        x: e.clientX - field.x,
        y: e.clientY - field.y
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !activeFieldId || !pdfContainerRef.current) return;
    const containerRect = pdfContainerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(containerRect.width - 100, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(0, Math.min(containerRect.height - 50, e.clientY - dragOffsetRef.current.y));

    setFields((prev) =>
      prev.map((f) => (f.id === activeFieldId ? { ...f, x: newX, y: newY } : f))
    );
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleSignAndDownload = async () => {
    setIsSigning(true);
    const docId = doc?.id || "doc_sample_1";
    
    // Call Python Flask backend to stamp signature on PDF
    await signDocumentApi(docId, signature, fields);
    
    setIsSigning(false);
    setSignedDone(true);

    if (doc) {
      const updatedDocs = documents.map((d) =>
        d.id === doc.id ? { ...d, status: "SIGNED" } : d
      );
      setDocuments(updatedDocs);
      localStorage.setItem("autosign_docs", JSON.stringify(updatedDocs));
    }

    // Trigger download from Python Flask backend
    const downloadLink = document.createElement("a");
    downloadLink.href = getDownloadUrl(docId);
    downloadLink.download = `${doc?.name ? doc.name.replace(".pdf", "") : "signed_document"}_signed.pdf`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        display: "flex",
        height: "calc(100vh - 64px)",
        backgroundColor: "var(--bg-dark)",
        overflow: "hidden"
      }}
    >
      {/* Left Sidebar */}
      <div style={{
        width: "320px",
        backgroundColor: "#000",
        borderRight: "1px solid var(--border-muted)",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        zIndex: 10
      }}>
        <div>
          {/* Back button */}
          <button
            onClick={() => setCurrentPage("dashboard")}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              marginBottom: "2rem"
            }}
          >
            <ArrowLeft size={16} />
            <span>BACK TO DASHBOARD</span>
          </button>

          {/* Document metadata info */}
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-muted)",
            padding: "1.25rem",
            marginBottom: "2rem"
          }}>
            <div style={{ fontSize: "0.75rem", color: "var(--acid-green)", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
              DOCUMENT
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "#fff", marginBottom: "1rem" }} className="font-serif">
              {doc?.name || "sample.pdf"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <div>
                <span style={{ color: "var(--text-dim)", display: "block" }}>PAGES</span>
                <span>{doc?.pages || 1}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)", display: "block" }}>FIELDS</span>
                <span>{fields.length}</span>
              </div>
            </div>
          </div>

          {/* Detected Fields list */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", letterSpacing: "0.08em", marginBottom: "0.75rem", textTransform: "uppercase" }}>
              DETECTED FIELDS ({fields.length})
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {fields.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setActiveFieldId(f.id)}
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: activeFieldId === f.id ? "rgba(204, 255, 0, 0.08)" : "var(--bg-card)",
                    border: `1px solid ${activeFieldId === f.id ? "var(--acid-green)" : "var(--border-muted)"}`,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#fff", fontWeight: "600" }}>{f.type}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Confidence: {f.confidence}</div>
                  </div>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: activeFieldId === f.id ? "var(--acid-green)" : "var(--border-muted)"
                  }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            onClick={addManualField}
            className="btn-outline-acid"
            style={{ width: "100%", padding: "0.875rem" }}
          >
            <Plus size={16} />
            <span>Add field manually</span>
          </button>

          <button
            onClick={handleSignAndDownload}
            disabled={isSigning}
            className="btn-acid"
            style={{ width: "100%", padding: "0.875rem" }}
          >
            {isSigning ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Processing PDF...</span>
              </>
            ) : signedDone ? (
              <>
                <Check size={16} />
                <span>Downloaded Signed PDF</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Sign & Download</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main PDF Viewport */}
      <div style={{
        flex: 1,
        backgroundColor: "#0d0d0d",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Pagination bar */}
        <div style={{
          height: "44px",
          backgroundColor: "#111",
          borderBottom: "1px solid var(--border-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontSize: "0.75rem",
          color: "var(--text-muted)"
        }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <ChevronLeft size={16} />
          </button>
          <span>PAGE {page} / 1</span>
          <button
            onClick={() => setPage((p) => Math.min(1, p + 1))}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* PDF Document Viewer Container */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          overflow: "auto"
        }}>
          <div
            ref={pdfContainerRef}
            style={{
              width: "720px",
              height: "900px",
              backgroundColor: "#f9f9fb",
              boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
              position: "relative",
              color: "#1a1a1a",
              padding: "4rem",
              fontFamily: "serif",
              userSelect: "none"
            }}
          >
            {/* Mock Legal Document Header & Text */}
            <div style={{ borderBottom: "2px solid #333", paddingBottom: "1rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#111" }}>
                  MUTUAL NON-DISCLOSURE AGREEMENT
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "sans-serif", marginTop: "4px" }}>
                  DOCUMENT REF: #AUTOSIGN-2026-0726
                </p>
              </div>
              <div style={{ fontSize: "0.8rem", fontFamily: "sans-serif", color: "#555" }}>CONFIDENTIAL</div>
            </div>

            <div style={{ fontSize: "0.95rem", lineHeight: "1.8", color: "#222", marginBottom: "2rem" }}>
              <p style={{ marginBottom: "1.25rem" }}>
                This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the date signed below by and between the Receiving Party and the Disclosing Party for the purpose of preventing the unauthorized disclosure of Confidential Information.
              </p>
              <p style={{ marginBottom: "1.25rem" }}>
                1. <strong>Confidential Information.</strong> Confidential information includes all proprietary information, trade secrets, software algorithms, document field coordinates, and machine learning models disclosed under this agreement.
              </p>
              <p style={{ marginBottom: "1.25rem" }}>
                2. <strong>Term & Termination.</strong> The obligations of confidentiality shall remain in effect for a period of five (5) years from the effective execution date of this instrument.
              </p>
            </div>

            {/* Signature Line Section on Page */}
            <div style={{ position: "absolute", bottom: "140px", left: "60px", right: "60px", display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", paddingTop: "1.5rem" }}>
              <div style={{ width: "260px" }}>
                <div style={{ borderBottom: "1px solid #444", height: "40px", marginBottom: "6px" }} />
                <div style={{ fontSize: "0.8rem", fontFamily: "sans-serif", color: "#444" }}>Authorized Representative Signature</div>
                <div style={{ fontSize: "0.75rem", fontFamily: "sans-serif", color: "#777" }}>Date: July 26, 2026</div>
              </div>

              <div style={{ width: "260px" }}>
                <div style={{ borderBottom: "1px solid #444", height: "40px", marginBottom: "6px" }} />
                <div style={{ fontSize: "0.8rem", fontFamily: "sans-serif", color: "#444" }}>Countersignature / Recipient</div>
                <div style={{ fontSize: "0.75rem", fontFamily: "sans-serif", color: "#777" }}>AutoSign AI Verified</div>
              </div>
            </div>

            {/* Render Draggable Bounding Box overlays */}
            {fields.map((f) => (
              <div
                key={f.id}
                onMouseDown={(e) => handleMouseDown(e, f.id)}
                className={`sig-field ${activeFieldId === f.id ? "active" : ""}`}
                style={{
                  left: `${f.x}px`,
                  top: `${f.y}px`,
                  width: `${f.width}px`,
                  height: `${f.height}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <div className="field-label">
                  {f.type} · {f.confidence}
                </div>

                {signature ? (
                  <img
                    src={signature}
                    alt="Signature Overlay"
                    style={{
                      maxHeight: "85%",
                      maxWidth: "90%",
                      filter: "contrast(200%) brightness(0.2)",
                      pointerEvents: "none"
                    }}
                  />
                ) : (
                  <div style={{ color: "var(--acid-green)", fontSize: "0.75rem", fontWeight: "600", pointerEvents: "none" }}>
                    ✦ SIGNATURE HERE
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
