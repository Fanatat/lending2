"use client";

import { useReducedMotion } from "@/lib/motion";

const NUMERAL_WORDS = [
  "Ноль",
  "Одна",
  "Две",
  "Три",
  "Четыре",
  "Пять",
  "Шесть",
  "Семь",
  "Восемь",
  "Девять",
];

/** Russian noun/adjective agreement for "N автономных систем" — same
 * 1 / 2-4 / else split as SystemsCounter's labelFor, just for a different
 * phrase. */
function nounPhrase(n: number) {
  if (n === 1) return "автономная система";
  if (n >= 2 && n <= 4) return "автономные системы";
  return "автономных систем";
}

interface AnimatedLeadCountProps {
  /** Current tally value, synced from SystemsCounter's own onTick. */
  count: number;
  /** Only render once the counter above has actually appeared. */
  visible: boolean;
}

/**
 * "Девять автономных систем." as a live phrase whose numeral and noun
 * agreement swap in step with SystemsCounter's tally above, with a small
 * swap animation on each change, instead of sitting there as a fixed word
 * for TypewriterLine to type out once — see Hero.
 */
export default function AnimatedLeadCount({ count, visible }: AnimatedLeadCountProps) {
  const reducedMotion = useReducedMotion();

  if (!visible) return <span className="invisible">Девять автономных систем.</span>;

  const word = NUMERAL_WORDS[count] ?? NUMERAL_WORDS[NUMERAL_WORDS.length - 1];
  const text = `${word} ${nounPhrase(count)}.`;

  return (
    <span
      key={reducedMotion ? "static" : count}
      className="inline-block"
      style={{ animation: reducedMotion ? undefined : "lead-word-swap 220ms ease-out both" }}
    >
      {text}
    </span>
  );
}
