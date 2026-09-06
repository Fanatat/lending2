"use client";

import { useEffect, useRef, useState } from "react";
import HeroTitleReveal from "./HeroTitleReveal";
import SystemsCounter from "./SystemsCounter";
import AnimatedLeadCount from "./AnimatedLeadCount";
import TypewriterLine from "./TypewriterLine";
import AnomalyBanner from "./AnomalyBanner";
import { useReducedMotion } from "@/lib/motion";
import { useTypewriter } from "@/lib/useTypewriter";

const TITLE = "#НЕРЕЗЮМЕ, а список реализованных задач";
// The leading "Девять автономных систем." is rendered live by
// AnimatedLeadCount (synced to SystemsCounter's tally) instead of being
// typed out as plain text — BODY_GHOST keeps the full original sentence
// around only to reserve layout space (see the invisible ghost below).
const BODY_GHOST =
  "Девять автономных систем. Ноль сотрудников, ноль облачных подписок, ноль обещаний. Часть из них исполняет свои функции прямо сейчас, пока вы читаете эту строку.";
const BODY_REST =
  " Ноль сотрудников, ноль облачных подписок, ноль обещаний. Часть из них исполняет свои функции прямо сейчас, пока вы читаете эту строку.";
const FOOTNOTE =
  "Все задачи решаются за 2000 рублей в месяц. Доказательства ниже.";

// The headline reveal waits for the `hero-fly-in` CSS animation's real
// `animationend` rather than a fixed timer racing it from mount — on a cold
// reload hydration can lag well behind the CSS (which starts painting
// before JS even runs), so a hardcoded delay can fire before the fly-in has
// actually landed. FLY_IN_FALLBACK_MS only covers the rare case where the
// event never fires. REVEAL_PAUSE_MS is an extra beat after landing so the
// fill-in reads as a deliberate step, not something that happens instantly.
const FLY_IN_FALLBACK_MS = 650;
const REVEAL_PAUSE_MS = 450;
const FOOTNOTE_DELAY_MS = 2000;

/** Hero section — flies in on load, then headline + counter reveal together → typed body → delayed footnote. */
export default function Hero() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [revealStart, setRevealStart] = useState(false);
  const [counterDone, setCounterDone] = useState(false);
  const [leadCount, setLeadCount] = useState(0);
  const [leadVisible, setLeadVisible] = useState(false);
  const [paragraphDone, setParagraphDone] = useState(false);
  const [footnoteStart, setFootnoteStart] = useState(false);
  const { output: restOutput } = useTypewriter(BODY_REST, {
    start: counterDone,
    sound: true,
    onDone: () => setParagraphDone(true),
  });

  useEffect(() => {
    if (reducedMotion) {
      setRevealStart(true);
      return;
    }

    const section = sectionRef.current;
    let pauseTimer = 0;

    function startReveal() {
      pauseTimer = window.setTimeout(() => setRevealStart(true), REVEAL_PAUSE_MS);
    }

    function handleAnimationEnd(e: AnimationEvent) {
      if (e.animationName !== "hero-fly-in") return;
      window.clearTimeout(fallback);
      startReveal();
    }

    const fallback = window.setTimeout(startReveal, FLY_IN_FALLBACK_MS);
    section?.addEventListener("animationend", handleAnimationEnd);

    return () => {
      window.clearTimeout(fallback);
      window.clearTimeout(pauseTimer);
      section?.removeEventListener("animationend", handleAnimationEnd);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!paragraphDone) return;
    const t = window.setTimeout(
      () => setFootnoteStart(true),
      FOOTNOTE_DELAY_MS
    );
    return () => window.clearTimeout(t);
  }, [paragraphDone]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="hero-fly-in flex min-h-[100svh] flex-col justify-center gap-6 px-4 py-20 sm:px-6 sm:py-24 md:px-10 lg:px-16"
    >
      <HeroTitleReveal text={TITLE} start={revealStart} />
      <AnomalyBanner />
      <SystemsCounter
        start={revealStart}
        onDone={() => setCounterDone(true)}
        onTick={(n) => {
          setLeadCount(n);
          setLeadVisible(true);
        }}
      />
      <div className="relative max-w-2xl text-base text-fg-primary sm:text-lg">
        <p aria-hidden="true" className="invisible">
          {BODY_GHOST}
        </p>
        <p className="absolute inset-0">
          <AnimatedLeadCount count={leadCount} visible={leadVisible} />
          {counterDone && (
            <>
              {restOutput}
              {!footnoteStart && (
                <span className="typing-cursor" aria-hidden="true">
                  |
                </span>
              )}
            </>
          )}
        </p>
      </div>
      <TypewriterLine
        text={FOOTNOTE}
        start={footnoteStart}
        speedMs={30}
        className="max-w-xl text-xs text-fg-muted"
      />
    </section>
  );
}
