import RevealOnScroll from "@/components/effects/RevealOnScroll";
import type { FlowLane } from "@/lib/projects";

/**
 * "Как устроено": each lane is a numbered chain of steps joined by a rail,
 * lanes sit side by side on wide screens. Rules follow as a plain list —
 * they're the constraints the pipeline is built around, not steps in it.
 */
export default function ProjectFlow({
  lanes,
  rules,
}: {
  lanes: FlowLane[];
  rules: string[];
}) {
  return (
    <div>
      <div className={`grid gap-8 ${lanes.length > 1 ? "md:grid-cols-2" : ""}`}>
        {lanes.map((lane, li) => (
          <div key={li} className="min-w-0">
            {lane.label && (
              <div className="mb-3 text-[10px] uppercase tracking-widest text-accent">
                {lane.label}
              </div>
            )}
            <ol className="relative">
              {lane.steps.map((step, i) => (
                <RevealOnScroll key={i} as="li" index={i} className="relative flex gap-4 pb-4 last:pb-0">
                  {i < lane.steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[15px] top-8 bottom-0 w-px bg-line"
                    />
                  )}
                  <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center border border-line bg-panel text-[10px] text-fg-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="pt-1.5 text-sm leading-relaxed text-fg-primary/90">
                    {step}
                  </span>
                </RevealOnScroll>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {rules.length > 0 && (
        <ul className="mt-8 space-y-2 border-t border-line pt-6">
          {rules.map((rule, i) => (
            <li key={i} className="flex gap-3 text-xs leading-relaxed text-fg-muted">
              <span aria-hidden="true" className="text-accent">
                ▸
              </span>
              {rule}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
