"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "@/lib/motion";
import IntroStarfield from "./IntroStarfield";
import IntroOrbs from "./IntroOrbs";
import IntroCore from "./IntroCore";
import IntroParticles from "./IntroParticles";
import IntroFloatingShapes from "./IntroFloatingShapes";
import IntroLogo from "./IntroLogo";
import {
  INTRO_ORBS_DESKTOP,
  INTRO_ORBS_MOBILE,
  INTRO_PARTICLES_DESKTOP,
  INTRO_PARTICLES_MOBILE,
  INTRO_SKIP_DELAY_MS,
  INTRO_STARS_DESKTOP,
  INTRO_STARS_MOBILE,
  INTRO_TIMING,
  MOBILE_BREAKPOINT_PX,
} from "@/lib/introConfig";

type Phase = "voyage" | "core" | "particles" | "collapse" | "logo" | "hold";

const PHASE_ORDER: Phase[] = ["voyage", "core", "particles", "collapse", "logo", "hold"];

function phaseStarts() {
  const t = INTRO_TIMING;
  const starts: Record<Phase, number> = {
    voyage: 0,
    core: t.voyage,
    particles: t.voyage + t.core,
    collapse: t.voyage + t.core + t.particles,
    logo: t.voyage + t.core + t.particles + t.collapse,
    hold: t.voyage + t.core + t.particles + t.collapse + t.logo,
  };
  const exitAt = starts.hold + t.hold;
  return { starts, exitAt, completeAt: exitAt + t.exit };
}

// Where in the collapse the particles hit the core — flash + shockwave fire
// here, and the name bursts out of it when the logo phase starts.
const FLASH_AT = 0.78;

/**
 * Orchestrates the ~15 s boot intro (ТЗ phases 0-7, prefixed by a deep-space
 * orb flythrough/voyage phase): one setTimeout schedule drives `phase`;
 * everything else (canvas, CSS animations) keys off it. `exiting` is
 * separate from `phase` so a skip mid-way just fades out whatever is on
 * screen instead of jumping ahead to the flash/logo.
 *
 * `onReveal` fires when the exit starts so the site can fade in underneath
 * the lifting curtain; `onComplete` fires once the overlay is fully gone.
 */
export default function IntroAnimation({
  onReveal,
  onComplete,
}: {
  onReveal: () => void;
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [mobile, setMobile] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("voyage");
  const [exiting, setExiting] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [exitMs, setExitMs] = useState(INTRO_TIMING.exit);

  const overlayRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);
  const exitingRef = useRef(false);
  const callbacksRef = useRef({ onReveal, onComplete });
  callbacksRef.current = { onReveal, onComplete };

  function startExit(exitMs: number) {
    if (exitingRef.current) return;
    exitingRef.current = true;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    setExitMs(exitMs);
    setExiting(true);
    callbacksRef.current.onReveal();
    timersRef.current = [
      window.setTimeout(() => callbacksRef.current.onComplete(), exitMs),
    ];
  }

  // The timeline starts on the client (hydration), not at SSR paint — until
  // then the overlay is plain black, which is exactly ТЗ phase 0.
  useEffect(() => {
    setMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    const { starts, exitAt, completeAt } = phaseStarts();
    const timers = PHASE_ORDER.slice(1).map((p) =>
      window.setTimeout(() => setPhase(p), starts[p])
    );
    timers.push(
      window.setTimeout(() => startExit(completeAt - exitAt), exitAt),
      window.setTimeout(() => setShowSkip(true), INTRO_SKIP_DELAY_MS)
    );
    timersRef.current = timers;
    return () => timersRef.current.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function skip() {
    // A shorter exit than the scheduled one — the visitor asked to leave.
    startExit(650);
  }

  // Only Escape skips — a stray click to focus the window or an arbitrary
  // key press shouldn't throw away the whole intro.
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mouse parallax for the floating shapes / name (ТЗ phase 5). Written
  // straight into CSS vars so pointer moves never re-render React.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || reducedMotion) return;
    let raf = 0;
    function onMove(e: PointerEvent) {
      if (raf) return;
      const { clientX, clientY } = e;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el!.style.setProperty("--mx", ((clientX / window.innerWidth) * 2 - 1).toFixed(3));
        el!.style.setProperty("--my", ((clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  const started = mobile !== null;
  const at = (p: Phase) => PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p);
  const showVoyage = started && phase === "voyage";
  const showCore = started && (phase === "core" || phase === "particles" || phase === "collapse");
  const showParticles = started && (phase === "particles" || phase === "collapse");
  const showLogo = at("logo");
  const { exitAt } = phaseStarts();

  const overlayClass = [
    "intro-overlay",
    reducedMotion && "intro-overlay--gentle",
    exiting && "intro-overlay--exit",
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    "--intro-particles-ms": `${INTRO_TIMING.particles}ms`,
    "--intro-collapse-ms": `${INTRO_TIMING.collapse}ms`,
    "--intro-flash-delay": `${Math.round(INTRO_TIMING.collapse * FLASH_AT) - 60}ms`,
    "--intro-progress-ms": `${exitAt}ms`,
    "--intro-exit-ms": `${exitMs}ms`,
  } as CSSProperties;

  return (
    <div
      id="intro-overlay"
      ref={overlayRef}
      className={overlayClass}
      style={style}
    >
      <div aria-hidden="true" className={at("collapse") ? "intro-bg-warm intro-bg-warm--on" : "intro-bg-warm"} />
      {started && (
        <IntroStarfield
          count={mobile ? INTRO_STARS_MOBILE : INTRO_STARS_DESKTOP}
          gentle={reducedMotion}
          mobile={!!mobile}
          voyageMs={INTRO_TIMING.voyage}
        />
      )}
      {showVoyage && (
        <IntroOrbs
          count={mobile ? INTRO_ORBS_MOBILE : INTRO_ORBS_DESKTOP}
          durationMs={INTRO_TIMING.voyage}
          gentle={reducedMotion}
        />
      )}
      <IntroFloatingShapes visible={showLogo} />

      {showParticles && (
        <IntroParticles
          orbitMs={INTRO_TIMING.particles}
          collapseMs={INTRO_TIMING.collapse}
          counts={mobile ? INTRO_PARTICLES_MOBILE : INTRO_PARTICLES_DESKTOP}
          gentle={reducedMotion}
        />
      )}

      {showCore && (
        <IntroCore stage={phase === "collapse" ? "collapse" : phase === "particles" ? "charged" : "born"} />
      )}

      {/* Stays mounted from the collapse on, so its CSS animation runs to the
          end even though the collapse phase itself is over by then. */}
      {!reducedMotion && at("collapse") && (
        <>
          <div className="intro-flash" aria-hidden="true" />
          <div className="intro-shockwave" aria-hidden="true" />
        </>
      )}

      <div className="intro-logo-stage">
        <IntroLogo active={showLogo} gentle={reducedMotion} />
      </div>

      {started && <div className="intro-progress" aria-hidden="true" />}

      {showSkip && !exiting && (
        <button
          type="button"
          data-cursor="interactive"
          className="intro-skip"
          onClick={skip}
        >
          ПРОПУСТИТЬ <span className="intro-skip-key" aria-hidden="true">[esc]</span>
        </button>
      )}
    </div>
  );
}
