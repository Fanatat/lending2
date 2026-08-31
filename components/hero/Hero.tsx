"use client";

import { useEffect, useRef, useState } from "react";
import HeroTitleReveal from "./HeroTitleReveal";
import SystemsCounter from "./SystemsCounter";
import TypewriterLine from "./TypewriterLine";
import { useReducedMotion } from "@/lib/motion";

const TITLE = "#НЕРЕЗЮМЕ, а список реализованных задач";
const BODY =
  "Девять автономных систем. Ноль сотрудников, ноль облачных подписок, ноль обещаний. Часть из них исполняет свои функции прямо сейчас, пока вы читаете эту строку.";
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
  const [paragraphDone, setParagraphDone] = useState(false);
  const [footnoteStart, setFootnoteStart] = useState(false);

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
      className="hero-fly-in flex min-h-screen flex-col justify-center gap-6 px-6 py-24 sm:px-10 md:px-16"
    >
      <HeroTitleReveal text={TITLE} start={revealStart} />
      <SystemsCounter start={revealStart} onDone={() => setCounterDone(true)} />
      <TypewriterLine
        text={BODY}
        start={counterDone}
        sound
        onDone={() => setParagraphDone(true)}
        className="max-w-2xl text-base text-fg-primary sm:text-lg"
      />
      <TypewriterLine
        text={FOOTNOTE}
        start={footnoteStart}
        speedMs={30}
        className="max-w-xl text-xs text-fg-muted"
      />
    </section>
  );
}
