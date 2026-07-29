import { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import DashboardPage from "./components/DashboardPage";
import PreviewPage from "./components/PreviewPage";
import HistoryPage from "./components/HistoryPage";
import { GOOGLE_CLIENT_ID } from "./config";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("autosign_user");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed && parsed.email ? parsed : null;
    } catch {
      return null;
    }
  });

  const [currentPage, setCurrentPageState] = useState(() => {
    const savedUser = localStorage.getItem("autosign_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          const savedPage = localStorage.getItem("autosign_page");
          return savedPage && ["dashboard", "history", "preview"].includes(savedPage)
            ? savedPage
            : "dashboard";
        }
      } catch {
        // Fallback below
      }
    }
    return "landing";
  });

  const setCurrentPage = (page) => {
    setCurrentPageState(page);
    if (page && page !== "login" && page !== "register") {
      localStorage.setItem("autosign_page", page);
    }
  };
  const [signature, setSignature] = useState(() => {
    return localStorage.getItem("autosign_signature") || null;
  });
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem("autosign_docs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const map = new Map();
          parsed.forEach((d) => { if (d && d.id) map.set(d.id, d); });
          return Array.from(map.values());
        }
      } catch {
        // Fallback below
      }
    }
    return [];
  });
  const [selectedDoc, setSelectedDoc] = useState(null);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-black text-white">
        {currentPage !== "landing" && currentPage !== "login" && currentPage !== "register" && (
          <Header
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            user={user}
            setUser={setUser}
          />
        )}

        <main>
          {currentPage === "landing" && (
            <LandingPage
              setCurrentPage={setCurrentPage}
              setUser={setUser}
            />
          )}

          {(currentPage === "login" || currentPage === "register") && (
            <AuthPage
              mode={currentPage}
              setCurrentPage={setCurrentPage}
              setUser={setUser}
            />
          )}

          {currentPage === "dashboard" && (
            <DashboardPage
              user={user}
              signature={signature}
              setSignature={setSignature}
              documents={documents}
              setDocuments={setDocuments}
              setCurrentPage={setCurrentPage}
              setSelectedDoc={setSelectedDoc}
            />
          )}

          {currentPage === "preview" && (
            <PreviewPage
              doc={selectedDoc || documents[0]}
              signature={signature}
              setCurrentPage={setCurrentPage}
              setDocuments={setDocuments}
              documents={documents}
            />
          )}

          {currentPage === "history" && (
            <HistoryPage
              documents={documents}
              setDocuments={setDocuments}
              setCurrentPage={setCurrentPage}
              setSelectedDoc={setSelectedDoc}
            />
          )}
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}
