"use client";

import { useLabStore } from "@/lib/store";

/**
 * Small, unobtrusive mute control for the Hero typing-click sound. Fixed
 * bottom-left, out of the way of the content grid.
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
      {soundEnabled ? "SND: ON" : "SND: OFF"}
    </button>
  );
}
