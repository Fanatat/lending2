"use client";

import { useEffect, useState, type ReactNode } from "react";
import IntroAnimation from "./IntroAnimation";
import { INTRO_REPLAY_PARAM, INTRO_STORAGE_KEY } from "@/lib/introConfig";

type GatePhase = "intro" | "revealing" | "done";

/**
 * Decides whether to show the boot intro and fades `children` in as it
 * leaves (or immediately, for a repeat visit). Follows the same boot-script
 * pattern as SudoEasterEgg: `phase` starts at "intro" to match what SSR
 * renders (no localStorage on the server), and app/layout.tsx's inline
 * <script> already added `intro-seen-boot` to <html> pre-hydration on a
 * repeat visit — see the `html.intro-seen-boot` rules in globals.css — so
 * there's no flash of the overlay (or of hidden content) before this
 * effect's setPhase("done") catches up.
 *
 * `?intro` in the URL replays it regardless (the boot script skips the
 * class in that case too).
 */
export default function IntroGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<GatePhase>("intro");

  useEffect(() => {
    const replay = new URLSearchParams(window.location.search).has(
      INTRO_REPLAY_PARAM
    );
    let seen = false;
    try {
      seen = window.localStorage.getItem(INTRO_STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen && !replay) setPhase("done");
  }, []);

  useEffect(() => {
    document.body.style.overflow = phase === "intro" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  function handleReveal() {
    window.scrollTo(0, 0);
    setPhase("revealing");
  }

  function handleComplete() {
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      // localStorage unavailable — intro just replays next visit.
    }
    setPhase("done");
  }

  return (
    <>
      {phase !== "done" && (
        <IntroAnimation onReveal={handleReveal} onComplete={handleComplete} />
      )}
      <div
        className={
          phase === "intro"
            ? "intro-main-wrap"
            : "intro-main-wrap intro-main-wrap--visible"
        }
      >
        {children}
      </div>
    </>
  );
}
