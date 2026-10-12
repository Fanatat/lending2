import RevealOnScroll from "@/components/effects/RevealOnScroll";
import {
  STUDIO_COPY,
  STUDIO_NODES,
  STUDIO_SERVICES,
  type Lang,
  type StudioNode,
} from "@/lib/studio";

function NodeCard({ node }: { node: StudioNode }) {
  const gateway = node.key === "gateway";
  return (
    <div className={`min-w-0 border bg-panel p-4 ${gateway ? "border-accent" : "border-line"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={`text-sm ${gateway ? "text-accent" : "text-fg-primary"}`}>{node.name}</span>
        <span className="text-[10px] uppercase tracking-widest text-fg-muted">{node.role}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-fg-primary/75">{node.text}</p>
    </div>
  );
}

/** A short vertical link between two boxes of the scheme. */
function Wire() {
  return <div aria-hidden="true" className="mx-auto h-5 w-px bg-line" />;
}

/**
 * The studio's four servers as a scheme — outside world → gateway → the
 * workshop, the payments-and-hosting server and the proxy — plus the services
 * the games run on. Sits right after the games block: it's what stands
 * behind them.
 */
export default function StudioSection({ lang = "ru" }: { lang?: Lang }) {
  const copy = STUDIO_COPY[lang];
  const [gateway, ...inner] = STUDIO_NODES[lang];

  return (
    <section
      id="studio"
      className="border-t border-line px-4 py-14 sm:px-6 sm:py-20 md:px-10 lg:px-16"
    >
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0">
          <RevealOnScroll index={0}>
            <div className="text-xs tracking-widest text-fg-muted">{copy.eyebrow}</div>
          </RevealOnScroll>
          <RevealOnScroll index={1}>
            <h2 className="mt-2 max-w-xl text-2xl text-fg-primary sm:text-3xl">{copy.title}</h2>
          </RevealOnScroll>
          <RevealOnScroll index={2}>
            <p className="mt-4 max-w-xl text-sm text-fg-primary/90 sm:text-base">{copy.line}</p>
          </RevealOnScroll>
        </div>

        <RevealOnScroll index={2} className="min-w-0">
          <div className="mx-auto w-fit border border-dashed border-line px-3 py-1 text-[10px] uppercase tracking-widest text-fg-muted">
            {copy.internet}
          </div>
          <Wire />
          {gateway && <NodeCard node={gateway} />}
          <Wire />
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {inner.map((n) => (
              <div key={n.key} className="min-w-0 sm:last:odd:col-span-2">
                <NodeCard node={n} />
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>

      <RevealOnScroll index={3} className="mt-12">
        <h3 className="text-xs tracking-widest text-fg-muted">{copy.servicesTitle.toUpperCase()}</h3>
        <ul className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STUDIO_SERVICES[lang].map((s) => (
            <li key={s.name} className="min-w-0 border border-line bg-panel p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-fg-primary">{s.name}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#3ddc6a]">
                  <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[#3ddc6a]" />
                  {copy.working}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-fg-primary/75">{s.text}</p>
            </li>
          ))}
        </ul>
      </RevealOnScroll>
    </section>
  );
}
