"use client";

import { useEffect, useState } from "react";
import HeroTitleReveal from "./HeroTitleReveal";
import SystemsCounter from "./SystemsCounter";
import TypewriterLine from "./TypewriterLine";

const TITLE = "#НЕРЕЗЮМЕ а список реализованных задач";
const BODY =
  "Девять автономных систем. Ноль сотрудников, ноль облачных подписок, ноль обещаний. Часть из них исполняет свои функции прямо сейчас, пока вы читаете эту строку.";
const FOOTNOTE =
  "Все задачи решаются за 2000 рублей в месяц. Доказательства ниже.";

// Matches the `hero-fly-in` CSS animation duration in globals.css — the
// headline reveal starts the instant the fly-in lands, so the two read as
// one continuous "arrival" instead of two separate effects.
const FLY_IN_MS = 650;
const FOOTNOTE_DELAY_MS = 2000;

/** Hero section — flies in on load, then headline + counter reveal together → typed body → delayed footnote. */
export default function Hero() {
  const [revealStart, setRevealStart] = useState(false);
  const [counterDone, setCounterDone] = useState(false);
  const [paragraphDone, setParagraphDone] = useState(false);
  const [footnoteStart, setFootnoteStart] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setRevealStart(true), FLY_IN_MS);
    return () => window.clearTimeout(t);
  }, []);

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
