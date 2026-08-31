"use client";

import { useEffect, useState } from "react";
import { useTypewriter } from "@/lib/useTypewriter";

interface TypewriterLineProps {
  text: string;
  start: boolean;
  speedMs?: number;
  sound?: boolean;
  onDone?: () => void;
  className?: string;
  as?: "p" | "span";
}

/** Renders `text` character by character with a blinking cursor at the tail. */
export default function TypewriterLine({
  text,
  start,
  speedMs,
  sound,
  onDone,
  className,
  as = "p",
}: TypewriterLineProps) {
  const { output, done } = useTypewriter(text, { start, speedMs, sound, onDone });
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (start) setShowCursor(true);
  }, [start]);

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setShowCursor(false), 900);
    return () => window.clearTimeout(t);
  }, [done]);

  const Comp = as;

  if (!start) return null;

  return (
    <Comp className={className}>
      {output}
      {showCursor && (
        <span className="typing-cursor" aria-hidden="true">
          |
        </span>
      )}
    </Comp>
  );
}
