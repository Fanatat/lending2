import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { OPERATOR_COPY } from "@/lib/operator";
import type { Lang } from "@/lib/studio";

/**
 * Recruiter-facing "who is behind this" block — the page otherwise shows
 * systems, not a candidate. Sits right after Hero, before the systems start:
 * what to bring, how the work goes, and the one case that isn't a section
 * of its own (Linda). Kept short on purpose: the systems below are the
 * résumé.
 */
export default function OperatorSection({ lang = "ru" }: { lang?: Lang }) {
  const t = OPERATOR_COPY[lang];
  return (
    <section
      id="operator"
      className="border-t border-line px-4 py-14 sm:px-6 sm:py-20 md:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-4xl">
        <RevealOnScroll index={0}>
          <div className="text-xs tracking-widest text-fg-muted">{t.eyebrow}</div>
        </RevealOnScroll>
        <RevealOnScroll index={1}>
          <h2 className="mt-2 text-2xl text-fg-primary sm:text-3xl">{t.name}</h2>
          <p className="mt-2 max-w-2xl text-base text-accent sm:text-lg">{t.role}</p>
        </RevealOnScroll>
        <RevealOnScroll index={2}>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-primary/90 sm:text-base">
            {t.lead}
          </p>
          <p className="mt-2 text-xs text-fg-muted">{t.where}</p>
          <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
            {t.stats.map((s) => (
              <li key={s.label} className="min-w-0">
                <span className="block text-2xl tabular-nums text-accent">{s.value}</span>
                <span className="mt-1 block text-xs text-fg-primary/80">{s.label}</span>
              </li>
            ))}
          </ul>
        </RevealOnScroll>

        <RevealOnScroll index={3}>
          <div className="mt-10 grid min-w-0 gap-8 md:grid-cols-2">
            <div className="min-w-0">
              <h3 className="text-xs tracking-widest text-fg-muted">{t.tasksTitle.toUpperCase()}</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-fg-primary/90">
                {t.tasks.map((task) => (
                  <li key={task} className="flex gap-2">
                    <span aria-hidden="true" className="text-accent">›</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <h3 className="text-xs tracking-widest text-fg-muted">{t.howTitle.toUpperCase()}</h3>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-fg-primary/90">
                {t.how.map((step, i) => (
                  <li key={step} className="flex gap-2">
                    <span aria-hidden="true" className="tabular-nums text-accent">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll index={4}>
          <div className="mt-10 border border-line bg-panel p-5">
            <h3 className="text-sm text-fg-primary">{t.caseTitle}</h3>
            <p className="mt-2 text-xs leading-relaxed text-fg-primary/80 sm:text-sm">{t.caseText}</p>
            <p className="mt-3 text-xs leading-relaxed text-accent">{t.caseBusiness}</p>
          </div>
          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-fg-muted">{t.honest}</p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
