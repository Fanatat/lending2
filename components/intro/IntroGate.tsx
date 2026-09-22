"use client";

import { useEffect, useState, type ReactNode } from "react";
import IntroAnimation from "./IntroAnimation";
import { INTRO_BOOT_HTML_CLASS, INTRO_STORAGE_KEY } from "@/lib/introConfig";

/**
 * Decides whether to show the boot intro and fades `children` in once it's
 * done (or immediately, for a repeat visit). Follows the same boot-script
 * pattern as SudoEasterEgg: `phase` starts at "intro" to match what SSR
 * renders (no localStorage on the server), and app/layout.tsx's inline
 * <script> already added INTRO_BOOT_HTML_CLASS to <html> pre-hydration on a
 * repeat visit — see the `html.intro-seen-boot` rules in globals.css — so
 * there's no flash of the overlay (or of hidden content) before this
 * effect's setPhase("revealed") catches up.
 */
export default function IntroGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"intro" | "revealed">("intro");

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(INTRO_STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) setPhase("revealed");
  }, []);

  useEffect(() => {
    document.body.style.overflow = phase === "intro" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  function handleComplete() {
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      // localStorage unavailable — intro just replays next visit.
    }
    document.documentElement.classList.add(INTRO_BOOT_HTML_CLASS);
    setPhase("revealed");
  }

  return (
    <>
      {phase === "intro" && <IntroAnimation onComplete={handleComplete} />}
      <div
        className={
          phase === "revealed"
            ? "intro-main-wrap intro-main-wrap--visible"
            : "intro-main-wrap"
        }
      >
        {children}
      </div>
    </>
  );
}
