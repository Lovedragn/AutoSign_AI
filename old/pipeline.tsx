import { FileText, Sparkles, ScanSearch, ShieldCheck } from "lucide-react"

const steps = [
  {
    icon: FileText,
    num: "01",
    title: "Digital PDF",
    desc: "PyMuPDF extracts text, fonts and coordinates from vector PDFs.",
  },
  {
    icon: Sparkles,
    num: "02",
    title: "OCR + Vision",
    desc: "Scanned PDFs go through Google Cloud Vision for OCR + object detection.",
  },
  {
    icon: ScanSearch,
    num: "03",
    title: "OpenCV Fallback",
    desc: "Detects blank signature lines and empty writing regions.",
  },
  {
    icon: ShieldCheck,
    num: "04",
    title: "You Confirm",
    desc: "Never signs automatically. You review, drag, resize and confirm.",
  },
]

export function Pipeline() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">02 · Pipeline</p>
      <h2 className="mt-6 max-w-2xl font-serif text-4xl leading-tight text-balance md:text-5xl">
        A hybrid detection pipeline built for real documents.
      </h2>

      <div className="mt-16 grid grid-cols-1 border border-border sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`flex flex-col p-8 ${
              i !== steps.length - 1 ? "border-b border-border sm:border-b-0 lg:border-r" : ""
            } ${i % 2 === 0 ? "sm:border-r sm:border-border" : ""} ${
              i < 2 ? "sm:border-b sm:border-border lg:border-b-0" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <step.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              <span className="font-mono text-xs text-muted-foreground">{step.num}</span>
            </div>
            <h3 className="mt-16 font-serif text-xl">{step.title}</h3>
            <p className="mt-4 font-mono text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
