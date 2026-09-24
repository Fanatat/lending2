"use client";

import { useLabStore } from "@/lib/store";

/**
 * Site-wide mute (lib/sfx.ts follows it): typing, egg finds, the bridge
 * crowd, the intro. Its initial state is whatever the visitor picked on the
 * intro's sound gate. Fixed bottom-left, out of the way of the content grid.
 */
export default function SoundToggle() {
  const soundEnabled = useLabStore((s) => s.soundEnabled);
  const toggleSound = useLabStore((s) => s.toggleSound);

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? "Выключить звук" : "Включить звук"}
      className="fixed bottom-4 left-4 z-40 border border-line px-2 py-1 text-[10px] tracking-widest text-fg-muted transition-colors hover:border-accent hover:text-accent"
    >
      {soundEnabled ? "Звук: вкл" : "Звук: выкл"}
    </button>
  );
}
