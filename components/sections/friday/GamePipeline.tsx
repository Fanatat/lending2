import { GAME_PIPELINE, type Lang } from "@/lib/studio";

const CAPTION = {
  ru: "Конвейер игр студии",
  en: "The studio's game pipeline",
};

/**
 * The game pipeline as four counters, idea → live. Games that aren't out
 * yet stay numbers on purpose: no titles to promise before release.
 */
export default function GamePipeline({ lang = "ru" }: { lang?: Lang }) {
  return (
    <figure className="w-full">
      <figcaption className="text-[10px] uppercase tracking-widest text-fg-muted">
        {CAPTION[lang]}
      </figcaption>
      <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GAME_PIPELINE.map((stage, i) => {
          const live = stage.key === "live";
          return (
            <li
              key={stage.key}
              className={`relative border px-3 py-2 ${live ? "border-accent" : "border-line"} bg-panel`}
            >
              <span
                className={`block text-xl tabular-nums ${live ? "text-accent" : "text-fg-primary"}`}
              >
                {stage.count}
              </span>
              <span className="block text-[11px] leading-tight text-fg-muted">
                {stage.label[lang]}
              </span>
              {i < GAME_PIPELINE.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-xs text-fg-muted sm:block"
                >
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
