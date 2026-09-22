"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import IntroCore from "./IntroCore";
import IntroParticles from "./IntroParticles";
import IntroFloatingShapes from "./IntroFloatingShapes";
import IntroLogo from "./IntroLogo";
import {
  INTRO_TIMING_DESKTOP,
  INTRO_TIMING_MOBILE,
  INTRO_TIMING_REDUCED,
  MOBILE_BREAKPOINT_PX,
  type IntroTiming,
} from "@/lib/introConfig";

type Phase = "core" | "particles" | "collapse" | "logo" | "exit";

interface Config {
  timing: IntroTiming;
  mobile: boolean;
}

function buildSchedule(t: IntroTiming) {
  let elapsed = 0;
  const schedule: { phase: Phase; at: number }[] = [{ phase: "core", at: 0 }];
  elapsed += t.core;
  if (t.particles > 0) {
    schedule.push({ phase: "particles", at: elapsed });
    elapsed += t.particles;
  }
  if (t.collapse > 0) {
    schedule.push({ phase: "collapse", at: elapsed });
    elapsed += t.collapse;
  }
  schedule.push({ phase: "logo", at: elapsed });
  elapsed += t.logo + t.hold;
  schedule.push({ phase: "exit", at: elapsed });
  const completeAt = elapsed + t.exit;
  return { schedule, completeAt };
}

const SKIP_HINT_DELAY_MS = 1400;

/**
 * Orchestrates the boot intro (ТЗ phases 0-7): a state machine over `Phase`
 * driven by a single setTimeout schedule (not per-component timers) so
 * skip/reduced-motion only ever have one place to short-circuit. Rendered
 * by IntroGate, which owns the "have we shown this before" decision.
 */
export default function IntroAnimation({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [config, setConfig] = useState<Config | null>(null);
  const [phase, setPhase] = useState<Phase>("core");
  const [flash, setFlash] = useState(0);
  const [showSkipHint, setShowSkipHint] = useState(false);

  const timersRef = useRef<number[]>([]);
  const skippingRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // useReducedMotion() starts at `false` and corrects itself in its own
    // mount effect (no matchMedia access during the very first render) — so
    // this must depend on `reducedMotion`, not run once with `[]`, or a
    // reduced-motion visitor's very first render (before that correction
    // lands) permanently locks in the full animation instead.
    const mobile = window.innerWidth < MOBILE_BREAKPOINT_PX;
    setConfig({
      mobile,
      timing: reducedMotion
        ? INTRO_TIMING_REDUCED
        : mobile
        ? INTRO_TIMING_MOBILE
        : INTRO_TIMING_DESKTOP,
    });
  }, [reducedMotion]);

  useEffect(() => {
    if (!config) return;
    const { schedule, completeAt } = buildSchedule(config.timing);
    setPhase("core");
    const timers = schedule
      .slice(1)
      .map(({ phase: p, at }) => window.setTimeout(() => setPhase(p), at));
    timers.push(
      window.setTimeout(() => onCompleteRef.current(), completeAt)
    );
    timersRef.current = timers;
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [config]);

  useEffect(() => {
    const t = window.setTimeout(
      () => setShowSkipHint(true),
      SKIP_HINT_DELAY_MS
    );
    return () => window.clearTimeout(t);
  }, []);

  function handleSkip() {
    if (skippingRef.current || phase === "exit" || !config) return;
    skippingRef.current = true;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    setPhase("exit");
    const t = window.setTimeout(
      () => onCompleteRef.current(),
      config.timing.exit
    );
    timersRef.current = [t];
  }

  useEffect(() => {
    // IntroParticles unmounts once collapse ends (phase -> "logo") and its
    // rAF loop's very last onFlash call can land mid-fade (rAF and the
    // schedule's setTimeout aren't ticked together), leaving `flash` stuck
    // above 0 with nothing left to animate it back down — wash the whole
    // background out. Belt-and-suspenders reset the moment collapse ends.
    if (phase !== "collapse") setFlash(0);
  }, [phase]);

  useEffect(() => {
    function onKeydown() {
      handleSkip();
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, config]);

  const showParticles =
    !!config &&
    config.timing.particles > 0 &&
    (phase === "particles" || phase === "collapse");
  const showLogo = phase === "logo" || phase === "exit";

  return (
    <div
      id="intro-overlay"
      className={phase === "exit" ? "intro-overlay intro-overlay--exit" : "intro-overlay"}
      role="presentation"
      aria-hidden="true"
      onClick={handleSkip}
    >
      <div
        className="intro-bg-warm"
        style={{ opacity: phase === "collapse" || showLogo ? 1 : 0 }}
      />
      {flash > 0 && (
        <div className="intro-flash" style={{ opacity: flash }} />
      )}
      {showParticles && (
        <IntroParticles
          phase={phase === "collapse" ? "collapse" : "particles"}
          collapseDurationMs={config?.timing.collapse || 1}
          onFlash={setFlash}
        />
      )}
      {!reducedMotion && (
        <IntroCore visible={phase === "core" || phase === "particles"} />
      )}
      <IntroFloatingShapes visible={showLogo} />
      {config && <IntroLogo active={showLogo} instant={reducedMotion} />}
      {showSkipHint && phase !== "exit" && (
        <button
          type="button"
          data-cursor="interactive"
          className="intro-skip"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
        >
          ПРОПУСТИТЬ
        </button>
      )}
    </div>
  );
}
