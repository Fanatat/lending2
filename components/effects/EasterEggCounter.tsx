"use client";

import { useLabStore, ALL_EASTER_EGGS } from "@/lib/store";

/**
 * Fixed top-right tally of discovered easter eggs ("found/total"), so
 * hunting for the rest has a visible target. Mirrors SoundToggle's
 * fixed-corner chrome on the opposite side of the header.
 */
export default function EasterEggCounter() {
  const found = useLabStore((s) => s.foundEasterEggs.length);
  const total = ALL_EASTER_EGGS.length;

  return (
    <div
      role="status"
      aria-label={`Найдено пасхалок: ${found} из ${total}`}
      className="fixed right-4 top-4 z-40 border border-line px-2 py-1 text-[10px] tracking-widest text-fg-muted"
    >
      EGG {found}/{total}
    </div>
  );
}
