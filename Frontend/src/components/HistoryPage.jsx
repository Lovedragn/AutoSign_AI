import React from "react";
import { FileText, Trash2, ChevronRight, Download } from "lucide-react";

export default function HistoryPage({ documents, setDocuments, setCurrentPage, setSelectedDoc }) {
  const handleDelete = (id) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    localStorage.setItem("autosign_docs", JSON.stringify(updated));
  };

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ color: "var(--acid-green)", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
          // ARCHIVE
        </div>
        <h1 className="font-serif" style={{ fontSize: "clamp(2.5rem, 5vw, 3.75rem)", fontWeight: "400", color: "#fff" }}>
          Document history.
        </h1>
      </div>

      {documents.length === 0 ? (
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-muted)",
          padding: "4rem 2rem",
          textAlign: "center",
          color: "var(--text-muted)"
        }}>
          <FileText size={40} color="var(--text-dim)" style={{ marginBottom: "1rem" }} />
          <h3 className="font-serif" style={{ fontSize: "1.5rem", color: "#fff", marginBottom: "0.5rem" }}>
            No documents archived
          </h3>
          <p style={{ fontSize: "0.85rem", maxWidth: "400px", margin: "0 auto 1.5rem auto" }}>
            Uploaded documents and signed PDFs will appear in your archive history.
          </p>
          <button onClick={() => setCurrentPage("dashboard")} className="btn-acid">
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-muted)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-muted)", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                <th style={{ padding: "1.25rem 1.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>FILE</th>
                <th style={{ padding: "1.25rem 1.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>PAGES</th>
                <th style={{ padding: "1.25rem 1.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>FIELDS</th>
                <th style={{ padding: "1.25rem 1.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>STATUS</th>
                <th style={{ padding: "1.25rem 1.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    setCurrentPage("preview");
                  }}
                  style={{ borderBottom: "1px solid var(--border-muted)", cursor: "pointer" }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <FileText size={20} color="var(--text-muted)" />
                      <div>
                        <div style={{ color: "#fff", fontWeight: "600", fontSize: "0.95rem" }}>{doc.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "2px" }}>{doc.date}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem", color: "#fff", fontSize: "0.9rem" }}>{doc.pages}</td>
                  <td style={{ padding: "1.25rem 1.5rem", color: "var(--acid-green)", fontWeight: "600", fontSize: "0.9rem" }}>
                    {doc.fields}
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      fontSize: "0.7rem",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.05em",
                      border: "1px solid var(--border-bright)",
                      color: doc.status === "SIGNED" ? "var(--acid-green)" : "var(--text-muted)",
                      borderColor: doc.status === "SIGNED" ? "var(--acid-green)" : "var(--border-muted)"
                    }}>
                      {doc.status}
                    </span>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-dim)",
                          cursor: "pointer",
                          padding: "6px"
                        }}
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setCurrentPage("preview");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--acid-green)",
                          cursor: "pointer",
                          padding: "6px"
                        }}
                        title="Open Document"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
