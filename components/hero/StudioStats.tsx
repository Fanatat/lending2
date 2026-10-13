import { STUDIO_STATS, type Lang } from "@/lib/studio";

/**
 * The studio in three numbers, under the hero's buttons. Static on purpose:
 * the hero above already types itself out, and figures that count up from
 * zero read as decoration rather than as facts with a source.
 */
export default function StudioStats({ lang = "ru" }: { lang?: Lang }) {
  return (
    <ul className="grid max-w-3xl grid-cols-1 gap-x-8 gap-y-4 border-t border-line pt-6 sm:grid-cols-3">
      {STUDIO_STATS[lang].map((s) => (
        <li key={s.label} className="min-w-0">
          <span className="block text-2xl tabular-nums text-accent sm:text-3xl">
            {s.value}
          </span>
          <span className="mt-1 block text-sm text-fg-primary">{s.label}</span>
          {s.note && (
            <span className="mt-1 block text-xs leading-relaxed text-fg-muted">
              {s.note}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
