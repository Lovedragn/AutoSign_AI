import { useState, useEffect, useRef } from "react";
import { PenTool } from "lucide-react";
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
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
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
          setAuthError("Google authentication failed. Could not retrieve account information.");
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
      setAuthError("Google authentication was cancelled or blocked.");
      setLoadingGoogle(false);
    }
  });

  return (
    <div className="min-h-screen bg-black text-white grid grid-cols-1 lg:grid-cols-2">
      {/* Art Column */}
      <div className="relative hidden lg:flex flex-col justify-end p-12 overflow-hidden bg-black border-r border-white/10">
        <img
          src="https://images.unsplash.com/photo-1526289034009-0240ddb68ce3?q=80&w=1200&auto=format&fit=crop"
          alt="Auth Visual"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

        <div className="relative z-10 max-w-md text-left">
          <div className="text-[#CCFF00] text-xs font-mono tracking-[0.3em] uppercase mb-2">
            // SECURE AUTHENTICATION
          </div>
          <h2 className="font-serif text-4xl text-white font-normal leading-tight">
            Your documents. Faster.
          </h2>
        </div>
      </div>

      {/* Form Column */}
      <div className="flex items-center justify-center px-8 py-12">
        <div ref={formRef} className="w-full max-w-md">
          {/* Top Brand Tag */}
          <div
            onClick={() => setCurrentPage("landing")}
            className="flex items-center gap-2 mb-10 cursor-pointer"
          >
            <div className="w-6 h-6 bg-[#CCFF00] flex items-center justify-center text-black">
              <PenTool size={14} strokeWidth={2.5} />
            </div>
            <span className="font-serif text-lg text-white">AutoSign</span>
            <span className="font-mono text-[9px] text-[#CCFF00] tracking-widest uppercase">
              AI
            </span>
          </div>

          <div className="mb-8">
            <div className="text-[#CCFF00] text-xs font-mono tracking-[0.3em] uppercase mb-2">
              // SIGN IN WITH GOOGLE
            </div>
            <h1 className="font-serif text-4xl font-normal text-white mb-2">
              Welcome to AutoSign.
            </h1>
            <p className="font-mono text-xs text-white/50">
              Sign in securely using your official Google Account to access your workspace.
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              {authError}
            </div>
          )}

          {/* Google Auth Button */}
          <button
            type="button"
            disabled={loadingGoogle}
            onClick={() => googleLogin()}
            className="w-full py-4 px-6 bg-white text-black font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-3 hover:bg-[#CCFF00] transition-all duration-200 cursor-pointer disabled:opacity-50 font-bold shadow-lg shadow-white/5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
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
            <span>{loadingGoogle ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>
          <p className="mt-8 font-mono text-[10px] text-white/30 text-center leading-relaxed">
            By signing in, you agree to secure document processing and encrypted PDF storage.
          </p>
        </div>
      </div>
    </div>
  );
}
