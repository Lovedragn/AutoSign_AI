import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import DashboardPage from "./components/DashboardPage";
import PreviewPage from "./components/PreviewPage";
import HistoryPage from "./components/HistoryPage";

const GOOGLE_CLIENT_ID = "102938475610-autosign-demo.apps.googleusercontent.com";

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing"); // "landing" | "login" | "register" | "dashboard" | "preview" | "history"
  const [user, setUser] = useState(null);
  const [signature, setSignature] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Restore state from localStorage on load
  useEffect(() => {
    const savedUser = localStorage.getItem("autosign_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) { }
    }

    const savedSig = localStorage.getItem("autosign_signature");
    if (savedSig) {
      setSignature(savedSig);
    }

    const savedDocs = localStorage.getItem("autosign_docs");
    if (savedDocs) {
      try {
        setDocuments(JSON.parse(savedDocs));
      } catch (e) { }
    } else {
      // Default initial mock doc for demo experience
      const initialDoc = {
        id: "doc_sample_1",
        name: "sample.pdf",
        date: "7/26/2026, 11:24:56 PM",
        pages: 1,
        fields: 1,
        status: "PENDING"
      };
      setDocuments([initialDoc]);
    }
  }, []);

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
