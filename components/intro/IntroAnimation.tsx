"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import IntroCosmos from "./IntroCosmos";
import IntroMark, { type MarkStage } from "./IntroMark";
import IntroWelcome, { type WelcomeStage } from "./IntroWelcome";
import {
  INTRO_COPY,
  INTRO_EXIT_MS,
  INTRO_SHOW_MARK,
  INTRO_SKIP_DELAY_MS,
  INTRO_SKIP_EXIT_MS,
  INTRO_T,
  MOBILE_BREAKPOINT_PX,
} from "@/lib/introConfig";

/**
 * The boot intro, staged after reference.mp4: planet ring → starfield →
 * mark (off for now, see INTRO_SHOW_MARK) → nebula + planet → "Добро пожаловать" + "Начать". One clock
 * (`origin`, a performance.now() value) drives everything: the canvases
 * read it every frame, the DOM stages below are flipped by timers set
 * against it.
 *
 * Like the reference, the last scene waits for the visitor: "Начать" blooms
 * the planet over the screen and the site shows through. Skip / Esc leave
 * straight away at any point.
 */

type Exit = null | { kind: "start" | "skip"; at: number };

interface Stages {
  cosmos: boolean;
  mark: MarkStage;
  welcome: WelcomeStage | null;
}

const INITIAL: Stages = { cosmos: true, mark: "hidden", welcome: null };

export default function IntroAnimation({
  onReveal,
  onComplete,
}: {
  onReveal: () => void;
  onComplete: () => void;
}) {
  const copy = INTRO_COPY[usePathname()?.startsWith("/en") ? "en" : "ru"];
  const [origin, setOrigin] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const [stages, setStages] = useState<Stages>(INITIAL);
  const [showSkip, setShowSkip] = useState(false);
  const [exit, setExit] = useState<Exit>(null);
  const [fading, setFading] = useState(false);

  const timersRef = useRef<number[]>([]);
  const exitRef = useRef<Exit>(null);
  const callbacksRef = useRef({ onReveal, onComplete });
  callbacksRef.current = { onReveal, onComplete };

  // The clock starts at hydration; until then the overlay is plain black,
  // which is also how the reference opens.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    // Reduced motion: no spinning ring / flying point — open on the calm
    // last scene (nebula → planet → text) instead.
    const offset = reduced ? INTRO_T.nebula - 400 : 0;
    const t0 = performance.now() - offset;
    setOrigin(t0);

    const at = (ms: number, fn: () => void) => {
      timersRef.current.push(window.setTimeout(fn, Math.max(0, ms - offset)));
    };
    const patch = (p: Partial<Stages>) => setStages((s) => ({ ...s, ...p }));

    if (reduced) {
      setStages({ cosmos: false, mark: "hidden", welcome: null });
    } else {
      if (INTRO_SHOW_MARK) {
        at(INTRO_T.dot, () => patch({ mark: "ball" }));
        at(INTRO_T.mark, () => patch({ mark: "mark" }));
        at(INTRO_T.cosmosOut, () => patch({ mark: "out" }));
      }
      at(INTRO_T.cosmosGone + 200, () => patch({ cosmos: false }));
    }
    at(INTRO_T.nebula - 300, () => patch({ welcome: "nebula" }));
    at(INTRO_T.chrome, () => patch({ welcome: "chrome" }));
    at(INTRO_T.title, () => patch({ welcome: "title" }));
    at(INTRO_T.button, () => patch({ welcome: "ready" }));
    at(INTRO_T.button + 400, () => setShowSkip(false));
    timersRef.current.push(window.setTimeout(() => setShowSkip(true), INTRO_SKIP_DELAY_MS));

    const timers = timersRef.current;
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  function leave(kind: "start" | "skip") {
    if (exitRef.current) return;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    const next = { kind, at: performance.now() };
    exitRef.current = next;
    setExit(next);
    setShowSkip(false);

    // "Начать" lets the planet swell over the screen first; skip just fades.
    const fadeAt = kind === "start" ? INTRO_EXIT_MS - 650 : 0;
    const total = kind === "start" ? INTRO_EXIT_MS : INTRO_SKIP_EXIT_MS;
    const later = (ms: number, fn: () => void) => timersRef.current.push(window.setTimeout(fn, ms));
    later(fadeAt, () => {
      setFading(true);
      callbacksRef.current.onReveal();
    });
    later(total, () => callbacksRef.current.onComplete());
  }

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") leave("skip");
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlayClass = ["intro-overlay", fading && "intro-overlay--fade"].filter(Boolean).join(" ");
  const fadeMs = exit?.kind === "start" ? 650 : INTRO_SKIP_EXIT_MS;

  return (
    <div
      id="intro-overlay"
      className={overlayClass}
      style={{ "--intro-fade-ms": `${fadeMs}ms` } as CSSProperties}
    >
      {origin !== null && stages.cosmos && <IntroCosmos origin={origin} mobile={mobile} />}
      {INTRO_SHOW_MARK && origin !== null && stages.cosmos && <IntroMark stage={stages.mark} />}
      {origin !== null && stages.welcome && (
        <IntroWelcome
          origin={origin}
          mobile={mobile}
          stage={stages.welcome}
          copy={copy}
          exitStart={exit?.kind === "start" ? exit.at : null}
          onStart={() => leave("start")}
        />
      )}

      {showSkip && !exit && (
        <button
          type="button"
          data-cursor="interactive"
          className="intro-skip"
          onClick={() => leave("skip")}
        >
          {copy.skip} <span className="intro-skip-key" aria-hidden="true">esc</span>
        </button>
      )}
    </div>
  );
}
