"use client";

import { useTypewriter } from "@/lib/useTypewriter";

interface TypewriterLineProps {
  text: string;
  start: boolean;
  speedMs?: number;
  sound?: boolean;
  onDone?: () => void;
  className?: string;
  as?: "p" | "span";
  /**
   * Force the cursor off even though this line is done typing — set once
   * the next line down starts, so the cursor reads as moving down with the
   * typing action instead of blinking in two places at once. Leave unset
   * on the last line on the page, where nothing follows it.
   */
  forceHideCursor?: boolean;
}

/**
 * Renders `text` character by character with a blinking cursor at the tail.
 * The cursor keeps blinking in place once typing finishes (rather than
 * disappearing) until `forceHideCursor` is set — see that prop.
 */
export default function TypewriterLine({
  text,
  start,
  speedMs,
  sound,
  onDone,
  className,
  as = "p",
  forceHideCursor,
}: TypewriterLineProps) {
  const { output } = useTypewriter(text, { start, speedMs, sound, onDone });

  const Comp = as;
  const showCursor = start && !forceHideCursor;

  return (
    <div className={`relative ${className ?? ""}`}>
      <Comp aria-hidden="true" className="invisible">
        {text}
      </Comp>
      {start && (
        <Comp className="absolute inset-0">
          {output}
          {showCursor && (
            <span className="typing-cursor" aria-hidden="true">
              |
            </span>
          )}
        </Comp>
      )}
    </div>
  );
}
