"use client";

import { useEffect, useState, type ReactNode } from "react";
import IntroAnimation from "./IntroAnimation";

type GatePhase = "intro" | "revealing" | "done";

/**
 * Runs the boot intro on every load and fades `children` in as it leaves.
 * `phase` starts at "intro" so it always plays, regardless of localStorage
 * or whether the visitor has seen it before.
 */
export default function IntroGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<GatePhase>("intro");

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
