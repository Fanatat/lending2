"use client";

import { useEffect, useState, type ReactNode } from "react";
import IntroAnimation from "./IntroAnimation";
import { useIntroStore } from "@/lib/introStore";

type GatePhase = "intro" | "revealing" | "done";

/**
 * Runs the boot intro on every load and fades `children` in as it leaves.
 * `phase` starts at "intro" so something always plays: the full intro on a
 * first visit, only the "Начать" scene after that (IntroAnimation decides).
 * "Смотреть интро снова" (IntroReplayButton) bumps `replays`, which brings
 * the overlay back with a fresh IntroAnimation that plays everything.
 */
export default function IntroGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<GatePhase>("intro");
  const reveal = useIntroStore((s) => s.reveal);
  const replays = useIntroStore((s) => s.replays);

  useEffect(() => {
    if (replays > 0) setPhase("intro");
  }, [replays]);

  useEffect(() => {
    document.body.style.overflow = phase === "intro" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  function handleReveal() {
    window.scrollTo(0, 0);
    setPhase("revealing");
    reveal();
  }

  function handleComplete() {
    setPhase("done");
  }

  return (
    <>
      {phase !== "done" && (
        <IntroAnimation
          key={replays}
          full={replays > 0}
          onReveal={handleReveal}
          onComplete={handleComplete}
        />
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
