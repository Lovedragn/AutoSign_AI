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
  const [currentPage, setCurrentPage] = useState("landing");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("autosign_user");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [signature, setSignature] = useState(() => {
    return localStorage.getItem("autosign_signature") || null;
  });
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem("autosign_docs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback below
      }
    }
    return [
      {
        id: "doc_sample_1",
        name: "sample.pdf",
        date: "7/26/2026, 11:24:56 PM",
        pages: 1,
        fields: 1,
        status: "PENDING"
      }
    ];
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
