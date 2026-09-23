"use client";

import { useEffect, useState } from "react";
import { useTypewriter } from "@/lib/useTypewriter";
import {
  INTRO_NAME,
  INTRO_STATUS_LINE,
  INTRO_STATUS_OUTPUT,
} from "@/lib/introConfig";

interface IntroLogoProps {
  /** True once the logo phase has started. */
  active: boolean;
  /** Reduced motion: plain fades, no bounce/blur/glitch. */
  gentle: boolean;
}

// Offsets from the start of the logo phase, ms. The name itself bursts out
// immediately (it rises out of the collapse flash); the rest follows.
const STATUS_START_MS = 700;
const OUTPUT_GAP_MS = 140;

/**
 * ТЗ phase 4 in the site's terminal key: the name emerges from the center
 * (scale/rotateY/blur, then a short glitch), an accent underline draws out
 * under it, and a `status` command types the site's own tagline (the
 * <meta description> in app/layout.tsx) — reusing useTypewriter/
 * .typing-cursor from the Hero rather than a generic subtitle fade.
 */
export default function IntroLogo({ active, gentle }: IntroLogoProps) {
  const [statusStart, setStatusStart] = useState(false);
  const [outputStart, setOutputStart] = useState(false);

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setStatusStart(true), STATUS_START_MS);
    return () => window.clearTimeout(t);
  }, [active]);

  const { output: statusLine, done: statusDone } = useTypewriter(
    INTRO_STATUS_LINE,
    { start: statusStart, speedMs: 22, sound: true }
  );

  useEffect(() => {
    if (!statusDone) return;
    const t = window.setTimeout(() => setOutputStart(true), OUTPUT_GAP_MS);
    return () => window.clearTimeout(t);
  }, [statusDone]);

  const { output: outputLine } = useTypewriter(INTRO_STATUS_OUTPUT, {
    start: outputStart,
    speedMs: 12,
  });

  const cls = (base: string) =>
    [base, active && `${base}--visible`, gentle && `${base}--gentle`]
      .filter(Boolean)
      .join(" ");

  // Lines keep their height (&nbsp;) from the start so the name doesn't
  // shift upwards as they fill in.
  return (
    <div className="intro-logo">
      <p className={cls("intro-name")} data-text={INTRO_NAME}>
        {INTRO_NAME}
      </p>
      <div className={cls("intro-underline")} aria-hidden="true" />
      <p className="intro-logo-line intro-logo-line--muted">
        {statusLine}
        {statusStart && !statusDone && (
          <span className="typing-cursor" aria-hidden="true">
            |
          </span>
        )}
        {" "}
      </p>
      <p className="intro-logo-line intro-logo-line--output">
        {outputLine}
        {outputStart && (
          <span className="typing-cursor" aria-hidden="true">
            |
          </span>
        )}
        {" "}
      </p>
    </div>
  );
}
