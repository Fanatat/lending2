"use client";

import { useEffect, useState } from "react";
import HeroTitleReveal from "./HeroTitleReveal";
import SystemsCounter from "./SystemsCounter";
import TypewriterLine from "./TypewriterLine";

const TITLE = "Не резюме. Список реализованных задач.";
const BODY =
  "Девять автономных систем. Ноль сотрудников, ноль облачных подписок, ноль обещаний. Часть из них исполняет свои функции прямо сейчас, пока вы читаете эту строку.";
const FOOTNOTE =
  "Все задачи решаются за 2000 рублей в месяц. Доказательства ниже.";

const FOOTNOTE_DELAY_MS = 2000;

/** Hero section — headline reveal → counter tally → typed body → delayed footnote. */
export default function Hero() {
  const [titleRevealed, setTitleRevealed] = useState(false);
  const [counterDone, setCounterDone] = useState(false);
  const [paragraphDone, setParagraphDone] = useState(false);
  const [footnoteStart, setFootnoteStart] = useState(false);

  useEffect(() => {
    if (!paragraphDone) return;
    const t = window.setTimeout(
      () => setFootnoteStart(true),
      FOOTNOTE_DELAY_MS
    );
    return () => window.clearTimeout(t);
  }, [paragraphDone]);

  return (
    <section className="flex min-h-screen flex-col justify-center gap-6 px-6 py-24 sm:px-10 md:px-16">
      <HeroTitleReveal text={TITLE} onRevealed={() => setTitleRevealed(true)} />
      <SystemsCounter start={titleRevealed} onDone={() => setCounterDone(true)} />
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
