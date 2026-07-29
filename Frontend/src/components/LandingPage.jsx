import { useEffect, useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import { pingBackend } from "../api/client";
const WORKFLOW_ITEMS = [
  {
    num: "01",
    title: "Upload your signature",
    desc: "A single transparent PNG. Used across every document.",
  },
  {
    num: "02",
    title: "Upload a PDF",
    desc: "Any digital or scanned document up to 20 MB.",
  },
  {
    num: "03",
    title: "AI finds every field",
    desc: "Signature, initial and date fields — with coordinates and confidence.",
  },
  {
    num: "04",
    title: "Preview → Confirm → Download",
    desc: "Move, resize and confirm placement. Then download the signed PDF.",
  },
];

export default function LandingPage({ setCurrentPage, setUser }) {
  const heroTitleRef = useRef(null);
  const heroSubRef = useRef(null);
  const mockupRef = useRef(null);
  const pipelineRef = useRef(null);
  const box1Ref = useRef(null);
  const box2Ref = useRef(null);
  const box3Ref = useRef(null);
  useEffect(() => {
    pingBackend();
  }, []);
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (heroSubRef.current) {
      tl.fromTo(heroSubRef.current, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6 });
    }

    if (heroTitleRef.current) {
      tl.fromTo(heroTitleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.3");
    }

    if (mockupRef.current) {
      tl.fromTo(mockupRef.current, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.8 }, "-=0.6");
    }

    if (box1Ref.current && box2Ref.current && box3Ref.current) {
      gsap.to(box1Ref.current, { y: -5, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(box2Ref.current, { y: 5, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.4 });
      gsap.to(box3Ref.current, { y: -4, duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.8 });
    }

    if (pipelineRef.current) {
      const cards = pipelineRef.current.children;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power2.out",
        }
      );
    }
  }, []);


  const handleStart = () => {
    const savedUser = localStorage.getItem("autosign_user");
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        if (userObj && userObj.email) {
          setUser(userObj);
          setCurrentPage("dashboard");
          return;
        }
      } catch {
        // Ignore parse error and navigate to login
      }
    }
    setCurrentPage("login");
  };

  return (
    <div className="w-full bg-black text-white grain">
      {/* HERO SECTION */}
      <section className="w-full min-h-screen px-6 md:px-12 lg:px-16 py-12 border-b border-white/10 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center justify-center max-w-[1400px] mx-auto w-full my-auto">

          {/* Left Column: Headline & Content */}
          <div className="flex flex-col lg:col-span-7 text-left gap-6 lg:gap-7">

            {/* Sub-badge */}
            <div ref={heroSubRef} className="text-[11px] tracking-[0.3em] text-[#CCFF00] mb-0 flex items-center gap-3">
              <span className="h-px w-8 bg-[#CCFF00]" />
              INTELLIGENT DOCUMENT SIGNING
            </div>

            {/* Main Headline */}
            <h1 ref={heroTitleRef} className="font-serif text-left text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl leading-[0.95] tracking-tight mb-0">
              Sign PDFs<br />
              <span className="italic text-white/60">without</span><br />
              placing fields.
            </h1>

            {/* Paragraph */}
            <p className="font-mono text-white/60 text-sm sm:text-base max-w-xl mb-0 leading-relaxed text-left">
              AutoSign AI reads your document, finds every signature line, and drops your signature exactly where it belongs. No clicking. No dragging. No mistakes.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleStart}
                className="btn-acid inline-flex items-center gap-2 cursor-pointer"
              >
                Start Signing <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage("login")}
                className="btn-outline-acid inline-flex items-center gap-2 cursor-pointer"
              >
                I have an account
              </button>
            </div>

          </div>

          {/* Right Column: AI Document Bounding Box Frame */}
          <div ref={mockupRef} className="lg:col-span-5 relative w-full">
            <div className="aspect-[3/4] w-full relative border border-white/10 overflow-hidden bg-black">
              {/* Document Background Image */}
              <img
                src="https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
                alt="Document Mockup"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Bounding Box 1: Signature */}
              <div
                ref={box1Ref}
                className="absolute top-[42%] left-[12%] w-[45%] h-[6%] border-2 border-[#CCFF00] bg-[#CCFF00]/10 acid-pulse flex items-center"
              >
                <div className="absolute -top-5 left-0 text-[9px] text-[#CCFF00] bg-black px-2 tracking-widest font-mono border border-[#CCFF00]/30">
                  SIGNATURE · 0.92
                </div>
              </div>

              {/* Bounding Box 2: Date */}
              <div
                ref={box2Ref}
                className="absolute top-[68%] left-[14%] w-[35%] h-[5%] border-2 border-[#CCFF00] bg-[#CCFF00]/10 flex items-center"
              >
                <div className="absolute -top-5 left-0 text-[9px] text-[#CCFF00] bg-black px-2 tracking-widest font-mono border border-[#CCFF00]/30">
                  DATE · 0.88
                </div>
              </div>

              {/* Bounding Box 3: Initial */}
              <div
                ref={box3Ref}
                className="absolute top-[81%] left-[55%] w-[32%] h-[5%] border-2 border-[#CCFF00] bg-[#CCFF00]/10 flex items-center"
              >
                <div className="absolute -top-5 left-0 text-[9px] text-[#CCFF00] bg-black px-2 tracking-widest font-mono border border-[#CCFF00]/30">
                  INITIAL · 0.79
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* WORKFLOW SECTION */}
      <section className="w-full min-h-[80vh] px-6 md:px-12 lg:px-16 py-12 border-b border-white/10 flex flex-col items-center justify-center">
        <div className="max-w-7xl mx-auto w-full my-auto flex flex-col">
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-20">
            <div className="flex flex-col lg:w-1/3">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#CCFF00] mb-4">02 · Workflow</p>
              <h2 className="mt-0 font-serif text-4xl md:text-5xl lg:text-[60px] leading-[1.05] text-white font-normal">
                Four steps.
                <br />
                <span className="italic text-white/60">Ten seconds.</span>
              </h2>
            </div>

            <div className="flex flex-col lg:w-2/3 gap-12 h-full">
              {WORKFLOW_ITEMS.map((item) => (
                <div key={item.num} className="flex gap-8 mb-10 border-b border-white/15 last:border-b-0">
                  <span className="font-mono text-xs sm:text-sm text-[#CCFF00]">{item.num}</span>
                  <div className="flex flex-col">
                    <h3 className="font-serif text-xl sm:text-2xl text-white">{item.title}</h3>
                    <p className="mt-2 font-mono text-xs sm:text-sm leading-relaxed text-white/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="w-full min-h-[80vh] px-6 md:px-12 lg:px-16 py-12 border-b border-white/10 flex flex-col items-center gap-8 justify-center text-center">
        <div className="max-w-3xl mx-auto w-full my-auto flex flex-col items-center justify-center gap-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#CCFF00] mb-4">Ready?</p>
          <h2 className="mx-auto mt-0 mb-12 md:mb-16 max-w-3xl font-serif text-5xl md:text-5xl lg:text-[60px] leading-[1.05] text-white font-normal">
            Stop clicking on fields.
            <br />
            <span className="italic text-white/60 ">Start signing.</span>
          </h2>

          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 btn-acid px-8 py-4 font-mono text-sm font-medium transition-all hover:opacity-90 cursor-pointer"
          >
            Create free account <ArrowRight className="h-4 w-4" />
          </button>

        </div>
        <div className=" flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-white/60">
          <Sparkles className="h-3.5 w-3.5 text-[#CCFF00]" />
          Powered by Render & Python
        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black px-6 md:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-white/40">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="AutoSign AI" className="w-7 h-7 object-contain" />
          <div className="flex items-center gap-1.5 font-serif text-sm text-white font-semibold">
            AutoSign <span className="font-mono text-[9px] text-[#CCFF00] tracking-widest uppercase">AI</span>
          </div>
        </div>
        <span>© 2026 AutoSign AI — Sign smarter.</span>
        <span>v1.0 · MVP</span>
      </footer>
    </div>

  );
}
