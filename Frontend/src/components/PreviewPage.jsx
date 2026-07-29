import { useState, useRef } from "react";
import { ArrowLeft, Plus, Check, ChevronLeft, ChevronRight, RefreshCw, FileText, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { signDocumentApi, getDownloadUrl, getDocumentFileUrl, getDocumentPagePreviewUrl } from "../api/client";

export default function PreviewPage({ doc, signature, setCurrentPage, setDocuments, documents }) {
  const defaultFields = doc?.fields_detail && doc.fields_detail.length > 0
    ? doc.fields_detail
    : [
        {
          id: "field_auto_1",
          type: "SIGNATURE",
          confidence: "94%",
          page: 1,
          x: 260,
          y: 520,
          width: 220,
          height: 80
        }
      ];

  const [fields, setFields] = useState(defaultFields);
  const [activeFieldId, setActiveFieldId] = useState(defaultFields[0]?.id || null);
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
      x: 180 + (fields.length % 5) * 20,
      y: 220 + (fields.length % 5) * 20,
      width: 200,
      height: 80
    };
    setFields([...fields, newField]);
    setActiveFieldId(newField.id);
  };

  const handleDeleteField = (e, fieldId) => {
    if (e) e.stopPropagation();
    const updated = fields.filter((f) => f.id !== fieldId);
    setFields(updated);
    if (activeFieldId === fieldId) {
      setActiveFieldId(updated[0]?.id || null);
    }
  };

  const handleResizeField = (e, fieldId, dw, dh) => {
    if (e) e.stopPropagation();
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              width: Math.max(80, Math.min(400, f.width + dw)),
              height: Math.max(35, Math.min(180, f.height + dh))
            }
          : f
      )
    );
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
    const newX = Math.max(0, Math.min(containerRect.width - 80, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(0, Math.min(containerRect.height - 40, e.clientY - dragOffsetRef.current.y));

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

  const isSamplePdf = !doc?.name || doc.name.toLowerCase() === "sample.pdf";

  return (
    <div
      className="no-scrollbar"
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
      <div
        className="no-scrollbar"
        style={{
          width: "320px",
          backgroundColor: "#000",
          borderRight: "1px solid var(--border-muted)",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflowY: "auto",
          zIndex: 10
        }}
      >
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
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "#fff", marginBottom: "1rem", wordBreak: "break-all" }} className="font-serif">
              {doc?.name || "document.pdf"}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
              {fields.map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    setActiveFieldId(f.id);
                    if (f.page) setPage(f.page);
                  }}
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
                    <div style={{ fontSize: "0.8rem", color: "#fff", fontWeight: "600" }}>
                      {f.type} · Page {f.page || 1}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Confidence: {f.confidence || "94%"}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {fields.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteField(e, f.id)}
                        style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", padding: "2px" }}
                        title="Delete Field"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <div style={{
                      width: "8px",
                      height: "8px",
                      backgroundColor: activeFieldId === f.id ? "var(--acid-green)" : "var(--border-muted)"
                    }} />
                  </div>
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
            disabled={isSigning || fields.length === 0}
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
                <span>Confirm & Sign PDF</span>
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
          color: "var(--text-muted)",
          zIndex: 20
        }}>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              background: "none",
              border: "none",
              color: page <= 1 ? "rgba(255, 255, 255, 0.2)" : "var(--text-muted)",
              cursor: page <= 1 ? "not-allowed" : "pointer"
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span>PAGE {page} / {doc?.pages || 1}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(doc?.pages || 1, p + 1))}
            disabled={page >= (doc?.pages || 1)}
            style={{
              background: "none",
              border: "none",
              color: page >= (doc?.pages || 1) ? "rgba(255, 255, 255, 0.2)" : "var(--text-muted)",
              cursor: page >= (doc?.pages || 1) ? "not-allowed" : "pointer"
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* PDF Document Viewer Container - Scrollbars hidden */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.25rem",
          overflow: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}>
          <div
            ref={pdfContainerRef}
            style={{
              height: "100%",
              maxHeight: "calc(100vh - 130px)",
              aspectRatio: "1 / 1.35",
              width: "auto",
              maxWidth: "100%",
              backgroundColor: "#ffffff",
              boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
              position: "relative",
              color: "#1a1a1a",
              padding: "2.5rem 3rem",
              fontFamily: "serif",
              userSelect: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden"
            }}
          >
            {/* Real Uploaded PDF Page Image Canvas - 0 SCROLLBARS */}
            {doc?.id && doc?.id !== "doc_sample_1" ? (
              <img
                key={`pdf_page_img_${doc.id}_${page}`}
                src={getDocumentPagePreviewUrl(doc.id, page)}
                alt={`PDF Document Page ${page}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  border: "none",
                  zIndex: 1,
                  pointerEvents: "none",
                  backgroundColor: "#fff"
                }}
              />
            ) : isSamplePdf ? (
              <>
                {/* Sample NDA Document Layout */}
                <div style={{ borderBottom: "2px solid #333", paddingBottom: "1rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 2 }}>
                  <div>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#111" }}>
                      MUTUAL NON-DISCLOSURE AGREEMENT
                    </h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "sans-serif", marginTop: "4px" }}>
                      DOCUMENT REF: #AUTOSIGN-SAMPLE
                    </p>
                  </div>
                  <div style={{ fontSize: "0.8rem", fontFamily: "sans-serif", color: "#555" }}>CONFIDENTIAL</div>
                </div>

                <div style={{ fontSize: "0.95rem", lineHeight: "1.8", color: "#222", marginBottom: "2rem", position: "relative", zIndex: 2 }}>
                  <p style={{ marginBottom: "1.25rem" }}>
                    This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the date signed below by and between the Receiving Party and the Disclosing Party.
                  </p>
                  <p style={{ marginBottom: "1.25rem" }}>
                    1. <strong>Confidential Information.</strong> Confidential information includes all proprietary information, trade secrets, software algorithms, document field coordinates, and machine learning models disclosed under this agreement.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* User Real Uploaded Document Layout */}
                <div style={{ borderBottom: "2px solid #111", paddingBottom: "1rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 2 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--acid-green)", fontSize: "0.8rem", fontFamily: "sans-serif", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" }}>
                      <FileText size={16} />
                      <span>UPLOADED DOCUMENT</span>
                    </div>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#111", wordBreak: "break-all" }}>
                      {doc?.name || "UPLOADED_DOCUMENT.PDF"}
                    </h2>
                    <p style={{ fontSize: "0.85rem", color: "#666", fontFamily: "sans-serif", marginTop: "4px" }}>
                      UPLOADED DATE: {doc?.date || new Date().toLocaleString()} · {doc?.pages || 1} PAGE(S)
                    </p>
                  </div>
                  <div style={{ fontSize: "0.8rem", fontFamily: "sans-serif", color: "#333", border: "1px solid #ccc", padding: "4px 8px" }}>
                    OFFICIAL PDF
                  </div>
                </div>
              </>
            )}

            {/* Signature Line Section on Page */}
            {(!doc?.id || doc?.id === "doc_sample_1") && (
              <div style={{ position: "absolute", bottom: "140px", left: "60px", right: "60px", display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", paddingTop: "1.5rem", zIndex: 2 }}>
                <div style={{ width: "260px" }}>
                  <div style={{ borderBottom: "1px solid #444", height: "40px", marginBottom: "6px" }} />
                  <div style={{ fontSize: "0.8rem", fontFamily: "sans-serif", color: "#444" }}>Authorized Representative Signature</div>
                  <div style={{ fontSize: "0.75rem", fontFamily: "sans-serif", color: "#777" }}>Date: {new Date().toLocaleDateString()}</div>
                </div>

                <div style={{ width: "260px" }}>
                  <div style={{ borderBottom: "1px solid #444", height: "40px", marginBottom: "6px" }} />
                  <div style={{ fontSize: "0.8rem", fontFamily: "sans-serif", color: "#444" }}>Countersignature / Recipient</div>
                  <div style={{ fontSize: "0.75rem", fontFamily: "sans-serif", color: "#777" }}>AutoSign AI Verified</div>
                </div>
              </div>
            )}

            {/* Render Draggable & Resizable Virtual Bounding Box Overlays per Page */}
            {fields
              .filter((f) => (f.page || 1) === page)
              .map((f) => (
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
                  justifyContent: "center",
                  position: "absolute",
                  zIndex: 10
                }}
              >
                {/* Field Header Label with Actions */}
                <div className="field-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{f.type} · {f.confidence || "94%"}</span>
                  <button
                    onClick={(e) => handleResizeField(e, f.id, -20, -10)}
                    style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "0 2px" }}
                    title="Shrink Field"
                  >
                    <Minimize2 size={10} />
                  </button>
                  <button
                    onClick={(e) => handleResizeField(e, f.id, 20, 10)}
                    style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "0 2px" }}
                    title="Expand Field"
                  >
                    <Maximize2 size={10} />
                  </button>
                  {fields.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteField(e, f.id)}
                      style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", padding: "0 2px" }}
                      title="Delete Field"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
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
