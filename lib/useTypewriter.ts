"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import { useLabStore } from "@/lib/store";
import { playTypingClick } from "@/lib/sound";

interface UseTypewriterOptions {
  /** Begin typing once this flips to true. */
  start: boolean;
  speedMs?: number;
  /** Play a soft mechanical click per character (gated by the sound toggle). */
  sound?: boolean;
  onDone?: () => void;
}

/**
 * Reveals `text` one character at a time. Under prefers-reduced-motion the
 * full text is shown immediately (still fires onDone) instead of animating.
 */
export function useTypewriter(text: string, opts: UseTypewriterOptions) {
  const { start, speedMs = 50, sound = false } = opts;
  const [output, setOutput] = useState("");
  const [done, setDone] = useState(false);
  const reducedMotion = useReducedMotion();
  const soundEnabled = useLabStore((s) => s.soundEnabled);
  const onDoneRef = useRef(opts.onDone);
  onDoneRef.current = opts.onDone;

  useEffect(() => {
    if (!start) return;

    if (reducedMotion) {
      setOutput(text);
      setDone(true);
      onDoneRef.current?.();
      return;
    }

    let i = 0;
    setOutput("");
    setDone(false);
    const id = window.setInterval(() => {
      i += 1;
      setOutput(text.slice(0, i));
      if (sound && soundEnabled) playTypingClick();
      if (i >= text.length) {
        window.clearInterval(id);
        setDone(true);
        onDoneRef.current?.();
      }
    }, speedMs);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, text, speedMs, sound, soundEnabled, reducedMotion]);

  return { output, done };
}
