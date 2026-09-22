"use client";

import { useEffect, useState } from "react";
import { useTypewriter } from "@/lib/useTypewriter";
import {
  INTRO_BOOT_LINE,
  INTRO_NAME,
  INTRO_STATUS_LINE,
  INTRO_STATUS_OUTPUT,
} from "@/lib/introConfig";

interface IntroLogoProps {
  /** True once the logo phase has started. */
  active: boolean;
  /** Reduced-motion: no stagger, everything lands together. */
  instant: boolean;
}

/**
 * Terminal-boot variant of the ТЗ's "logo reveal" phase: `whoami` types
 * out, the name lands, then a `status` line echoes the site's own tagline
 * (the <meta description> in app/layout.tsx) — reusing useTypewriter/
 * .typing-cursor from the Hero instead of inventing a generic wordmark
 * animation that wouldn't match the rest of the site.
 */
export default function IntroLogo({ active, instant }: IntroLogoProps) {
  const [nameVisible, setNameVisible] = useState(false);
  const [line2Start, setLine2Start] = useState(false);
  const [outputStart, setOutputStart] = useState(false);

  const { output: line1, done: line1Done } = useTypewriter(INTRO_BOOT_LINE, {
    start: active,
    speedMs: instant ? 1 : 32,
    sound: true,
  });

  useEffect(() => {
    if (!line1Done) return;
    const t = window.setTimeout(
      () => setNameVisible(true),
      instant ? 0 : 150
    );
    return () => window.clearTimeout(t);
  }, [line1Done, instant]);

  useEffect(() => {
    if (!nameVisible) return;
    const t = window.setTimeout(() => setLine2Start(true), instant ? 0 : 550);
    return () => window.clearTimeout(t);
  }, [nameVisible, instant]);

  const { output: line2, done: line2Done } = useTypewriter(INTRO_STATUS_LINE, {
    start: line2Start,
    speedMs: instant ? 1 : 28,
    sound: true,
  });

  useEffect(() => {
    if (!line2Done) return;
    const t = window.setTimeout(() => setOutputStart(true), instant ? 0 : 120);
    return () => window.clearTimeout(t);
  }, [line2Done, instant]);

  const { output: outputLine } = useTypewriter(INTRO_STATUS_OUTPUT, {
    start: outputStart,
    speedMs: instant ? 1 : 16,
  });

  return (
    <div className="intro-logo">
      <p className="intro-logo-line">
        {line1}
        {active && !line1Done && (
          <span className="typing-cursor" aria-hidden="true">
            |
          </span>
        )}
      </p>
      <h1
        className={
          nameVisible ? "intro-name intro-name--visible" : "intro-name"
        }
      >
        {INTRO_NAME}
      </h1>
      {nameVisible && (
        <p className="intro-logo-line intro-logo-line--muted">
          {line2}
          {line2Start && !line2Done && (
            <span className="typing-cursor" aria-hidden="true">
              |
            </span>
          )}
        </p>
      )}
      {outputStart && (
        <p className="intro-logo-line intro-logo-line--output">
          {outputLine}
        </p>
      )}
    </div>
  );
}
