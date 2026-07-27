const items = [
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
]

export function Workflow() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">03 · Workflow</p>
          <h2 className="mt-6 font-serif text-4xl leading-tight md:text-5xl">
            Four steps.
            <br />
            <span className="italic text-muted-foreground">Ten seconds.</span>
          </h2>
        </div>

        <div>
          {items.map((item) => (
            <div key={item.num} className="grid grid-cols-[auto_1fr] gap-6 border-b border-border py-6">
              <span className="font-mono text-xs text-primary">{item.num}</span>
              <div>
                <h3 className="font-serif text-lg">{item.title}</h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
