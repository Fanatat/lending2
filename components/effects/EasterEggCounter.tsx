"use client";

import { useLabStore, ALL_EASTER_EGGS } from "@/lib/store";

/**
 * Fixed top-right tally of discovered easter eggs ("found/total"), so
 * hunting for the rest has a visible target. Mirrors SoundToggle's
 * fixed-corner chrome on the opposite side of the header. Once every egg is
 * found, a "МАТРИЦА ВКЛ/ВЫКЛ" toggle unlocks here — a reward for full
 * completion, not just another way to trigger the five-click gesture.
 */
export default function EasterEggCounter() {
  const found = useLabStore((s) => s.foundEasterEggs.length);
  const total = ALL_EASTER_EGGS.length;
  const matrixMode = useLabStore((s) => s.matrixMode);
  const setMatrixMode = useLabStore((s) => s.setMatrixMode);
  const allFound = found >= total;

  return (
    <div
      role="status"
      aria-label={`Найдено пасхалок: ${found} из ${total}`}
      className="fixed right-4 top-4 z-40 flex items-center gap-2 border border-line bg-void px-2 py-1 text-[10px] tracking-widest text-fg-muted"
    >
      <span>
        Пасхалки: {found}/{total}
      </span>
      {allFound && (
        <button
          type="button"
          data-cursor="interactive"
          onClick={() => setMatrixMode(!matrixMode)}
          className="border-l border-line pl-2 text-accent"
        >
          {matrixMode ? "МАТРИЦА: ВЫКЛ" : "МАТРИЦА ВКЛ"}
        </button>
      )}
    </div>
  );
}
