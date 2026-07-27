import { ArrowRight, Sparkle } from "lucide-react"

export function Cta() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 text-center md:py-32">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Ready?</p>
      <h2 className="mx-auto mt-8 max-w-3xl font-serif text-5xl leading-[1.05] text-balance md:text-6xl">
        Stop clicking on fields.
        <br />
        <span className="italic text-muted-foreground">Start signing.</span>
      </h2>

      <a
        href="#"
        className="mt-12 inline-flex items-center gap-2 bg-primary px-8 py-4 font-mono text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Create free account <ArrowRight className="h-4 w-4" />
      </a>

      <div className="mt-16 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        <Sparkle className="h-3.5 w-3.5" />
        Powered by Google Cloud Vision
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 font-mono text-xs text-muted-foreground sm:flex-row">
        <span>© 2026 AutoSign AI — Sign smarter.</span>
        <span>v1.0 · MVP</span>
      </div>
    </footer>
  )
}
