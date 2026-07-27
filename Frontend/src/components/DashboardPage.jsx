import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Check, PenTool, Trash2, ArrowRight, RefreshCw } from "lucide-react";
import gsap from "gsap";
import { uploadSignatureApi, uploadDocumentApi, fetchDocumentsApi } from "../api/client";

export default function DashboardPage({ user, signature, setSignature, documents, setDocuments, setCurrentPage, setSelectedDoc }) {
  const [activeTab, setActiveTab] = useState("draw"); // "draw" | "upload"
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }

    // Refresh documents from backend
    if (user?.email) {
      fetchDocumentsApi(user.email).then((remoteDocs) => {
        if (remoteDocs && remoteDocs.length > 0) {
          setDocuments(remoteDocs);
          localStorage.setItem("autosign_docs", JSON.stringify(remoteDocs));
        }
      });
    }
  }, [user, setDocuments]);

  // Initialize Canvas
  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && !signature) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      const ctx = canvas.getContext("2d");
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#ffffff";
    }
  }, [activeTab, signature]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      const dataUrl = canvasRef.current.toDataURL("image/png");
      setSignature(dataUrl);
      localStorage.setItem("autosign_signature", dataUrl);
      uploadSignatureApi(dataUrl);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignature(null);
    localStorage.removeItem("autosign_signature");
  };

  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      clearCanvas();
      setActiveTab(newTab);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        setSignature(result);
        localStorage.setItem("autosign_signature", result);
        uploadSignatureApi(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (signature && !uploadingPdf) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!signature || uploadingPdf) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handlePDFUpload(file);
    }
  };

  const handlePDFUpload = async (fileOrName) => {
    if (!signature || uploadingPdf) return;
    setUploadingPdf(true);

    try {
      // Call backend API for upload & AI field inspection
      const uploadResult = await uploadDocumentApi(fileOrName);
      const fileName = typeof fileOrName === "string" ? fileOrName : fileOrName?.name || "document.pdf";

      const newDoc = uploadResult?.document || {
        id: "doc_" + Date.now(),
        name: fileName,
        date: new Date().toLocaleString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        }),
        pages: 1,
        fields: 1,
        status: "PENDING"
      };

      const updated = [newDoc, ...documents.filter((d) => d.id !== newDoc.id)];
      setDocuments(updated);
      localStorage.setItem("autosign_docs", JSON.stringify(updated));
      setSelectedDoc(newDoc);
      setCurrentPage("preview");
    } finally {
      setUploadingPdf(false);
    }
  };

  const userName = user?.name ? user.name.split(" ")[0] : "Test";

  return (
    <div ref={containerRef} className="app-container" style={{ padding: "3rem 1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ color: "var(--acid-green)", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
          // DASHBOARD
        </div>
        <h1 className="font-serif" style={{ fontSize: "clamp(2.5rem, 5vw, 3.75rem)", fontWeight: "400", color: "#fff" }}>
          Hello, <span style={{ fontStyle: "italic", color: "#a0a0a0" }}>{userName}.</span>
        </h1>
      </div>

      {/* Grid: 01 Your Signature + 02 Upload PDF */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "2rem",
        marginBottom: "4rem"
      }}>
        {/* Step 01: Your Signature */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-muted)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--acid-green)", fontWeight: "600", letterSpacing: "0.1em" }}>
                01 · YOUR SIGNATURE
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => handleTabChange("draw")}
                  style={{
                    background: "none",
                    border: "none",
                    color: activeTab === "draw" ? "var(--acid-green)" : "var(--text-dim)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                >
                  Draw
                </button>
                <span style={{ color: "var(--border-muted)" }}>|</span>
                <button
                  type="button"
                  onClick={() => handleTabChange("upload")}
                  style={{
                    background: "none",
                    border: "none",
                    color: activeTab === "upload" ? "var(--acid-green)" : "var(--text-dim)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                >
                  Upload File
                </button>
              </div>
            </div>

            {/* Signature Area */}
            <div style={{
              height: "180px",
              border: "1px dashed var(--border-bright)",
              backgroundColor: "#000",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem"
            }}>
              {activeTab === "draw" ? (
                <>
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={170}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ cursor: "crosshair", width: "100%", height: "100%", touchAction: "none" }}
                  />
                  {!signature && (
                    <div style={{ position: "absolute", bottom: "10px", pointerEvents: "none", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-dim)", fontSize: "0.75rem" }}>
                      <PenTool size={13} />
                      <span>Draw signature above</span>
                    </div>
                  )}
                  {signature && (
                    <button
                      onClick={clearCanvas}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(255,255,255,0.15)",
                        border: "none",
                        color: "#fff",
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        borderRadius: "4px"
                      }}
                      title="Clear & Redraw"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              ) : signature ? (
                <div style={{ position: "relative", width: "100%", height: "100%", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={signature} alt="Signature Preview" style={{ maxHeight: "140px", maxWidth: "90%", filter: "brightness(0) invert(1)" }} />
                  <button
                    onClick={clearCanvas}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      color: "#fff",
                      padding: "4px 8px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      borderRadius: "4px"
                    }}
                    title="Clear Signature"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <label style={{ cursor: "pointer", textAlign: "center", padding: "2rem", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={24} color="var(--text-dim)" style={{ marginBottom: "0.75rem" }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Click to browse signature image</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textAlign: "center", marginBottom: "1rem" }}>
              Transparent PNG recommended
            </div>

            {activeTab === "draw" ? (
              signature ? (
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="btn-outline-acid"
                  style={{ width: "100%", padding: "0.875rem" }}
                >
                  <Trash2 size={16} />
                  <span>Clear & Redraw Signature</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-acid"
                  disabled
                  style={{ width: "100%", padding: "0.875rem", opacity: 0.6 }}
                >
                  <PenTool size={16} />
                  <span>Draw Your Signature Above</span>
                </button>
              )
            ) : (
              <label style={{ display: "block", width: "100%" }}>
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                <button
                  type="button"
                  className={signature ? "btn-outline-acid" : "btn-acid"}
                  style={{ width: "100%", padding: "0.875rem" }}
                >
                  {signature ? <Check size={16} /> : <Upload size={16} />}
                  <span>{signature ? "Signature Uploaded" : "Upload signature"}</span>
                </button>
              </label>
            )}
          </div>
        </div>

        {/* Step 02: Upload PDF */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-muted)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--acid-green)", fontWeight: "600", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>
              02 · UPLOAD PDF
            </div>

            {/* Dropzone Container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (signature && pdfInputRef.current) {
                  pdfInputRef.current.click();
                }
              }}
              style={{
                height: "240px",
                border: isDragging ? "2px dashed var(--acid-green)" : "1px dashed var(--border-bright)",
                backgroundColor: isDragging ? "rgba(204, 255, 0, 0.05)" : signature ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.4)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                textAlign: "center",
                position: "relative",
                cursor: signature ? "pointer" : "default"
              }}
            >
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePDFUpload(f);
                }}
                style={{ display: "none" }}
              />

              {uploadingPdf ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", pointerEvents: "none" }}>
                  <RefreshCw size={36} className="animate-spin text-[#CCFF00]" />
                  <div style={{ textAlign: "center" }}>
                    <h3 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: "400", color: "#fff", marginBottom: "0.25rem" }}>
                      Analyzing PDF structure...
                    </h3>
                    <p style={{ color: "var(--acid-green)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", letterSpacing: "0.15em", textTransform: "uppercase" }} className="animate-pulse">
                      Analyzing
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <FileText size={36} color={signature ? "var(--acid-green)" : "var(--text-dim)"} style={{ marginBottom: "1rem" }} />

                  <h3 className="font-serif" style={{ fontSize: "1.75rem", fontWeight: "400", color: "#fff", marginBottom: "0.5rem" }}>
                    {isDragging ? "Drop your PDF here" : "Drop your PDF here"}
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
                    or click anywhere inside to browse
                  </p>

                  {!signature ? (
                    <div style={{ color: "var(--acid-green)", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.08em" }}>
                      ← UPLOAD YOUR SIGNATURE FIRST
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "0.75rem" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="btn-acid"
                        style={{ padding: "0.6rem 1.25rem", fontSize: "0.8rem" }}
                      >
                        Select PDF File
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePDFUpload("sample.pdf")}
                        className="btn-outline-acid"
                        style={{ padding: "0.6rem 1.25rem", fontSize: "0.8rem" }}
                      >
                        Try sample.pdf
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textAlign: "center", marginTop: "1rem" }}>
            Supports vector digital PDFs and scanned images up to 20 MB
          </div>
        </div>
      </div>

      {/* Step 03: Recent Documents */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ color: "var(--acid-green)", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.15em", marginBottom: "0.35rem" }}>
              03 · RECENT
            </div>
            <h2 className="font-serif" style={{ fontSize: "2rem", fontWeight: "400", color: "#fff" }}>
              Latest documents
            </h2>
          </div>

          <button
            onClick={() => setCurrentPage("history")}
            style={{
              background: "none",
              border: "none",
              color: "var(--acid-green)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>VIEW ALL</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {documents.length === 0 ? (
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-muted)",
            padding: "3rem",
            textAlign: "center",
            color: "var(--text-muted)"
          }}>
            <p>No documents signed yet. Upload your signature and drop a PDF to get started.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-muted)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-muted)", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>File</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pages</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>Fields</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.slice(0, 5).map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoc(doc);
                      setCurrentPage("preview");
                    }}
                    style={{ borderBottom: "1px solid var(--border-muted)", cursor: "pointer" }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                      <FileText size={18} color="var(--text-muted)" />
                      <div>
                        <div style={{ color: "#fff", fontWeight: "500" }}>{doc.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "2px" }}>{doc.date}</div>
                      </div>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem", color: "#fff" }}>{doc.pages}</td>
                    <td style={{ padding: "1.25rem 1.5rem", color: "var(--acid-green)", fontWeight: "600" }}>{doc.fields}</td>
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        fontSize: "0.7rem",
                        fontFamily: "var(--font-mono)",
                        border: "1px solid var(--border-bright)",
                        color: doc.status === "SIGNED" ? "var(--acid-green)" : "var(--text-muted)",
                        borderColor: doc.status === "SIGNED" ? "var(--acid-green)" : "var(--border-muted)"
                      }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                          setCurrentPage("preview");
                        }}
                        className="btn-ghost"
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                      >
                        Open Editor
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
