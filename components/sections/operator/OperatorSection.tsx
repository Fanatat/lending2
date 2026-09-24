import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { GITHUB_URL } from "@/lib/site";

/**
 * Recruiter-facing "who is behind this" block — the page otherwise shows
 * systems, not a candidate. Sits right after Hero, before the systems start.
 * Kept to a couple of lines on purpose: the systems below are the résumé,
 * and the code behind them is one click away on GitHub.
 */
export default function OperatorSection() {
  return (
    <section
      id="operator"
      className="border-t border-line px-4 py-14 sm:px-6 sm:py-20 md:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-4xl">
        <RevealOnScroll index={0}>
          <div className="text-xs tracking-widest text-fg-muted">
            КТО ЗА ПУЛЬТОМ
          </div>
        </RevealOnScroll>
        <RevealOnScroll index={1}>
          <h2 className="mt-2 text-2xl text-fg-primary sm:text-3xl">
            Валерий
          </h2>
        </RevealOnScroll>
        <RevealOnScroll index={2}>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-primary/90 sm:text-base">
            Продюсер систем на ИИ-агентах: ставлю задачу, принимаю результат
            фактами и довожу до продакшна. Код пишут агенты — он лежит на{" "}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="interactive"
              className="text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
            >
              GitHub
            </a>
            .
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
