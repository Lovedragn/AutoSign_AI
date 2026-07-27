import { useState, useEffect, useRef } from "react";
import { PenTool, Lock, Zap, CheckCircle2 } from "lucide-react";
import gsap from "gsap";
import { useGoogleLogin } from "@react-oauth/google";
import { authGoogle } from "../api/client";

export default function AuthPage({ mode, setCurrentPage, setUser }) {
  const formRef = useRef(null);
  const [authError, setAuthError] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, scale: 0.96, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [mode]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoadingGoogle(true);
      setAuthError("");
      try {
        // Authenticate via Python Flask backend API
        const backendResult = await authGoogle(tokenResponse);
        let googleUser = backendResult?.user;

        if (!googleUser) {
          // Direct Google UserInfo API fallback
          const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`
            }
          });
          if (res.ok) {
            const profile = await res.json();
            googleUser = {
              id: profile.sub,
              name: profile.name || profile.given_name || "Google User",
              email: profile.email,
              picture: profile.picture || null,
              authType: "google"
            };
          }
        }

        if (backendResult?.token) {
          localStorage.setItem("autosign_token", backendResult.token);
        }

        if (googleUser && googleUser.email) {
          setUser(googleUser);
          localStorage.setItem("autosign_user", JSON.stringify(googleUser));
          setCurrentPage("dashboard");
        } else {
          setAuthError("Google authentication failed. Could not retrieve account profile.");
        }
      } catch (err) {
        console.error("Google authentication error:", err);
        setAuthError("Google authentication failed. Please try again.");
      } finally {
        setLoadingGoogle(false);
      }
    },
    onError: (errorResponse) => {
      console.error("Google Auth error or popup closed:", errorResponse);
      setAuthError("Google sign-in popup was cancelled or blocked.");
      setLoadingGoogle(false);
    }
  });

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12 grain">
      <div
        ref={formRef}
        className="w-full max-w-lg bg-black border border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl relative z-10"
      >
        {/* Top Brand Logo - Centered */}
        <div
          onClick={() => setCurrentPage("landing")}
          className="flex w-full items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-14 h-14 bg-[#CCFF00] flex items-center justify-center text-black group-hover:scale-105 transition-transform p-3">
            <PenTool size={26} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-center">
            <span className="font-serif text-5xl text-white leading-none">AutoSign</span>
            <span className="font-mono text-[9px] text-[#CCFF00] tracking-[0.3em] uppercase mt-2">
              AI DOCUMENT SIGNER
            </span>
          </div>
        </div>

        {/* Headline & Description - Centered */}
        <div className="space-y-3 max-w-md mx-auto text-center">
          <h1 className="font-serif text-4xl font-normal text-white leading-tight">
            Welcome to AutoSign.
          </h1>
          <p className="font-mono text-xs text-white/50 leading-relaxed">
            Sign in securely with your Google Account to access your signatures, smart PDF uploads, and signed document history.
          </p>
        </div>

        {authError && (
          <div className="w-full p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center justify-center gap-3">
            <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Google Auth Primary Button - Centered */}
        <button
          type="button"
          disabled={loadingGoogle}
          onClick={() => googleLogin()}
          className="w-full h-14 bg-white text-black font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-4 hover:bg-[#CCFF00] transition-all duration-200 cursor-pointer disabled:opacity-50 font-bold shadow-xl shadow-white/5 group border border-white"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
            />
          </svg>
        </button>

        {/* Feature Highlights - Centered Cards */}
        <div className="w-full space-y-3 text-left">
          <div className="p-4 bg-white/5 border border-white/10 flex items-start gap-4 hover:border-white/20 transition-colors">
            <Zap size={18} className="text-[#CCFF00] mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="font-mono text-xs text-white font-semibold">Instant Passwordless Access</div>
              <div className="font-mono text-[10px] text-white/40 leading-relaxed">Zero password management required. Authenticate directly via Google.</div>
            </div>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 flex items-start gap-4 hover:border-white/20 transition-colors">
            <Lock size={18} className="text-[#CCFF00] mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="font-mono text-xs text-white font-semibold">PyMuPDF Document Security</div>
              <div className="font-mono text-[10px] text-white/40 leading-relaxed">Documents are processed using Python 3.13 backend encryption.</div>
            </div>
          </div>
        </div>

        {/* Security Badges Footer - Centered */}
        <div className="w-full pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-white/40 text-[10px] font-mono">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#CCFF00]" /> OAuth 2.0 Verified</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#CCFF00]" /> Privacy Protected</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#CCFF00]" /> JWT Session Auth</span>
        </div>
      </div>
    </div>
  );
}
