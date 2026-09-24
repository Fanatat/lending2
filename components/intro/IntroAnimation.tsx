"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import IntroCosmos from "./IntroCosmos";
import IntroMark, { type MarkStage } from "./IntroMark";
import IntroWelcome, { type WelcomeStage } from "./IntroWelcome";
import IntroSoundGate from "./IntroSoundGate";
import { loadCosmosAssets } from "@/lib/cosmosAssets";
import { playLoop, playSfx, preloadSfx, unlockAudio, type LoopHandle } from "@/lib/sfx";
import { useLabStore } from "@/lib/store";
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
 * The boot intro: sound gate → planet parade (IntroCosmos) → mark (off for
 * now, see INTRO_SHOW_MARK) → nebula + planet → "Добро пожаловать" +
 * "Начать". One clock (`origin`, a performance.now() value) drives
 * everything: the canvases read it every frame, the DOM stages and the
 * sound cues are fired by timers set against it.
 *
 * The clock only starts once the visitor picks "со звуком / без звука" on
 * the gate: browsers won't play audio before a gesture, and the gate's few
 * seconds are also when the planet textures download.
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

const INTRO_SFX = ["intro_ambient", "flyby", "riser", "impact", "shimmer", "start"] as const;
/** After the gate click, wait at most this long for the textures. */
const ASSET_WAIT_MS = 4000;
/** Length of public/sounds/riser.mp3 — it's timed to end on the impact. */
const RISER_MS = 2600;

export default function IntroAnimation({
  onReveal,
  onComplete,
}: {
  onReveal: () => void;
  onComplete: () => void;
}) {
  const copy = INTRO_COPY[usePathname()?.startsWith("/en") ? "en" : "ru"];
  const [gate, setGate] = useState(true);
  const [origin, setOrigin] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const [stages, setStages] = useState<Stages>(INITIAL);
  const [showSkip, setShowSkip] = useState(false);
  const [exit, setExit] = useState<Exit>(null);
  const [fading, setFading] = useState(false);
  const setSound = useLabStore((s) => s.setSound);

  const timersRef = useRef<number[]>([]);
  const exitRef = useRef<Exit>(null);
  const startedRef = useRef(false);
  const ambientRef = useRef<LoopHandle | null>(null);
  const callbacksRef = useRef({ onReveal, onComplete });
  callbacksRef.current = { onReveal, onComplete };

  useEffect(() => {
    setMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    void loadCosmosAssets();
    // Dev shortcut for screenshots: ?introT=<ms> skips the gate, silently.
    if (
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("introT")
    ) {
      begin(false);
    }
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      ambientRef.current?.stop(0.3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Gate choice → wait (bounded) for the textures → start the clock. */
  function begin(withSound: boolean) {
    if (startedRef.current) return;
    startedRef.current = true;
    setSound(withSound);
    if (withSound) {
      unlockAudio();
      preloadSfx([...INTRO_SFX]);
    }
    const ready = Promise.race([
      loadCosmosAssets(),
      new Promise((resolve) => window.setTimeout(resolve, ASSET_WAIT_MS)),
    ]);
    void ready.then(() => {
      if (exitRef.current) return;
      setGate(false);
      startClock(withSound);
    });
  }

  function startClock(withSound: boolean) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Reduced motion: no flight through the planets — open on the calm
    // last scene (nebula → planet → text) instead.
    const offset = reduced ? INTRO_T.nebula - 400 : 0;
    setOrigin(performance.now() - offset);

    const at = (ms: number, fn: () => void) => {
      if (ms < offset) return;
      timersRef.current.push(window.setTimeout(fn, ms - offset));
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

    if (!withSound) return;
    // Sound, on the same clock as the picture. The planets pass on the left
    // of the frame, so their whooshes sit a little to the left too.
    void playLoop("intro_ambient", { fadeIn: 1.2 }).then((h) => {
      if (exitRef.current) h?.stop(0.4);
      else ambientRef.current = h;
    });
    at(700, () => playSfx("flyby", { pan: -0.35, volume: 0.8 })); // Earth + Moon
    at(1900, () => playSfx("flyby", { pan: -0.5, rate: 0.85 })); // Jupiter: bigger, lower
    at(2900, () => playSfx("flyby", { pan: -0.45, rate: 0.95, volume: 0.9 })); // Saturn
    at(INTRO_T.nebula - RISER_MS, () => playSfx("riser"));
    at(INTRO_T.nebula, () => playSfx("impact"));
    at(INTRO_T.title, () => playSfx("shimmer"));
  }

  function leave(kind: "start" | "skip") {
    if (exitRef.current) return;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    const next = { kind, at: performance.now() };
    exitRef.current = next;
    setExit(next);
    setShowSkip(false);
    if (kind === "start") playSfx("start");
    ambientRef.current?.stop(kind === "start" ? 2.5 : 0.8);

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
      {gate && !exit && <IntroSoundGate copy={copy} onChoose={begin} onSkip={() => leave("skip")} />}
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
