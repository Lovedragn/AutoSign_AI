import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, PenTool } from "lucide-react";
import gsap from "gsap";
import { useGoogleLogin } from "@react-oauth/google";

export default function AuthPage({ mode, setCurrentPage, setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    const userName = name || email.split("@")[0];
    const userObj = {
      email,
      name: userName,
      picture: null
    };
    setUser(userObj);
    localStorage.setItem("autosign_user", JSON.stringify(userObj));
    setCurrentPage("dashboard");
  };

  const [authError, setAuthError] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoadingGoogle(true);
      setAuthError("");
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch user profile from Google");
        }

        const profile = await res.json();
        const googleUser = {
          id: profile.sub,
          name: profile.name || profile.given_name || "Google User",
          email: profile.email || "user.google@gmail.com",
          picture: profile.picture || null,
          authType: "google",
          verified: profile.email_verified ?? true
        };

        setUser(googleUser);
        localStorage.setItem("autosign_user", JSON.stringify(googleUser));
        setCurrentPage("dashboard");
      } catch (err) {
        console.warn("Google userinfo error, falling back to basic Google session:", err);
        // Fallback user object if userinfo fetch fails
        const fallbackUser = {
          name: "Google Authenticated User",
          email: "user.google@gmail.com",
          picture: null,
          authType: "google"
        };
        setUser(fallbackUser);
        localStorage.setItem("autosign_user", JSON.stringify(fallbackUser));
        setCurrentPage("dashboard");
      } finally {
        setLoadingGoogle(false);
      }
    },
    onError: (errorResponse) => {
      console.error("Google Auth error:", errorResponse);
      setAuthError("Google authentication failed or was cancelled. Please try again.");
      setLoadingGoogle(false);
    }
  });

  const isRegister = mode === "register";

  return (
    <div className="min-h-screen bg-black text-white grid grid-cols-1 lg:grid-cols-2">
      {/* Art Column */}
      <div
        className={`relative hidden lg:flex flex-col justify-end p-12 overflow-hidden bg-black ${
          isRegister
            ? "order-1 lg:order-2 border-l border-white/10"
            : "order-2 lg:order-1 border-r border-white/10"
        }`}
      >
        <img
          src={
            isRegister
              ? "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?q=80&w=1200&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1526289034009-0240ddb68ce3?q=80&w=1200&auto=format&fit=crop"
          }
          alt="Auth Visual"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

        <div
          className={`relative z-10 max-w-md ${
            isRegister ? "ml-auto text-right" : "text-left"
          }`}
        >
          <div className="text-[#CCFF00] text-xs font-mono tracking-[0.3em] uppercase mb-2">
            {isRegister ? "02 // JOIN" : "// SIGN IN"}
          </div>
          <h2 className="font-serif text-4xl text-white font-normal leading-tight">
            {isRegister ? "Sign once. Everywhere." : "Your documents. Faster."}
          </h2>
        </div>
      </div>

      {/* Form Column */}
      <div
        className={`flex items-center justify-center px-8 py-12 ${
          isRegister ? "order-2 lg:order-1" : "order-1 lg:order-2"
        }`}
      >
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
              {isRegister ? "// CREATE ACCOUNT" : "// SIGN IN"}
            </div>
            <h1 className="font-serif text-4xl font-normal text-white mb-2">
              {isRegister ? (
                <>
                  Start signing <br />
                  <span className="italic text-white/60">smarter.</span>
                </>
              ) : (
                "Welcome back."
              )}
            </h1>
            <p className="font-mono text-xs text-white/50">
              {isRegister
                ? "Create an account to start signing documents automatically."
                : "Sign in to continue signing."}
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              {authError}
            </div>
          )}

          {/* Google Auth Button */}
          <button
            type="button"
            disabled={loadingGoogle}
            onClick={() => googleLogin()}
            className="w-full py-3 px-4 bg-white/5 border border-white/15 text-white font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/30 transition-all mb-6 cursor-pointer disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
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
            <span>{loadingGoogle ? "Authenticating with Google..." : "Continue with Google"}</span>
          </button>

          <div className="flex items-center gap-4 my-6 text-white/30 text-[10px] font-mono tracking-widest uppercase">
            <div className="flex-1 h-px bg-white/10" />
            <span>OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  className="w-full bg-transparent border border-white/15 px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#CCFF00] transition-colors"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                className="w-full bg-transparent border border-white/15 px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#CCFF00] transition-colors"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">
                PASSWORD
              </label>
              <input
                type="password"
                className="w-full bg-transparent border border-white/15 px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#CCFF00] transition-colors"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-acid w-full inline-flex items-center justify-center gap-2 mt-4 py-3 cursor-pointer"
            >
              <span>{isRegister ? "Create account" : "Sign in"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-8 text-center font-mono text-xs text-white/50">
            {isRegister ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setCurrentPage("login")}
                  className="text-[#CCFF00] hover:underline bg-transparent border-none cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => setCurrentPage("register")}
                  className="text-[#CCFF00] hover:underline bg-transparent border-none cursor-pointer"
                >
                  Create one
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
