import React from "react";
import { PenTool, LogOut, ArrowRight, FileText } from "lucide-react";

export default function Header({ currentPage, setCurrentPage, user, setUser }) {
  return (
    <header style={{
      borderBottom: "1px solid var(--border-muted)",
      backgroundColor: "var(--bg-dark)",
      position: "sticky",
      top: 0,
      zIndex: 50
    }}>
      <div className="app-container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px"
      }}>
        {/* Brand / Logo */}
        <div
          onClick={() => setCurrentPage("landing")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            userSelect: "none"
          }}
        >
          <div style={{
            width: "32px",
            height: "32px",
            backgroundColor: "var(--acid-green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000"
          }}>
            <PenTool size={18} strokeWidth={2.5} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", leading: 1 }}>
            <span className="font-serif" style={{ fontSize: "1.25rem", fontWeight: "600", color: "#fff" }}>
              AutoSign
            </span>
            <span style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--acid-green)", letterSpacing: "0.15em", marginTop: "-3px" }}>
              AI
            </span>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {user ? (
            <>
              <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <button
                  onClick={() => setCurrentPage("dashboard")}
                  style={{
                    background: "none",
                    border: "none",
                    color: currentPage === "dashboard" ? "var(--acid-green)" : "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    textTransform: "uppercase"
                  }}
                >
                  DASHBOARD
                </button>
                <button
                  onClick={() => setCurrentPage("history")}
                  style={{
                    background: "none",
                    border: "none",
                    color: currentPage === "history" ? "var(--acid-green)" : "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    textTransform: "uppercase"
                  }}
                >
                  HISTORY
                </button>
              </nav>

              <div style={{ height: "16px", width: "1px", backgroundColor: "var(--border-muted)" }} />

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                  {user.email?.toUpperCase()}
                </span>
                <button
                  onClick={() => {
                    setUser(null);
                    setCurrentPage("landing");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer"
                  }}
                  title="Logout"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                onClick={() => setCurrentPage("login")}
                className="btn-ghost"
                style={{ fontSize: "0.8rem" }}
              >
                I have an account
              </button>
              <button
                onClick={() => setCurrentPage("register")}
                className="btn-acid"
                style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
              >
                <span>Start Signing</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
