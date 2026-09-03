"use client";

import { useEffect, useRef, useState } from "react";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { useReducedMotion } from "@/lib/motion";
import ContactPhonePanel from "./ContactPhonePanel";

const COST_LINES = [
  { label: "Арендованный сервер", amount: 300 },
  { label: "Сторонний прокси", amount: 200 },
  { label: "Подписка на нейросеть", amount: 1500 },
];
const TOTAL = COST_LINES.reduce((sum, l) => sum + l.amount, 0);

/**
 * Shakes the CTA in proportion to scroll speed, settling the instant
 * scrolling stops — the closest analogue, without an actual camera, to
 * "text reacts to camera movement". Deliberately the only place on the site
 * that does this; everywhere else uses the four deterministic reveal
 * animations.
 */
function useScrollJitter<T extends HTMLElement>(reducedMotion: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (reducedMotion) return;

    let rafId = 0;
    let lastY = window.scrollY;
    let velocity = 0;

    function frame() {
      const y = window.scrollY;
      velocity = velocity * 0.85 + (y - lastY) * 0.15;
      lastY = y;

      const el = ref.current;
      if (el) {
        const amount = Math.min(6, Math.abs(velocity) * 0.6);
        if (amount > 0.05) {
          const dx = (Math.random() - 0.5) * amount;
          const dy = (Math.random() - 0.5) * amount;
          const rot = (Math.random() - 0.5) * amount * 0.4;
          el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
        } else {
          el.style.transform = "";
        }
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion]);

  return ref;
}

export default function ClosingSection() {
  const reducedMotion = useReducedMotion();
  const ctaRef = useScrollJitter<HTMLButtonElement>(reducedMotion);
  const [phoneOpen, setPhoneOpen] = useState(false);
  return (
    <section
      id="closing"
      className="border-t border-line px-4 py-16 sm:px-6 sm:py-24 md:px-10 lg:px-16"
    >
      <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-2 lg:gap-16">
        <RevealOnScroll index={0} className="order-2 flex items-start justify-center lg:order-1 lg:justify-start">
          <div className="w-full max-w-sm border border-line bg-panel p-5">
            <div className="text-[10px] uppercase tracking-wide text-fg-muted">
              Содержание инфраструктуры
            </div>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {COST_LINES.map((line) => (
                  <tr key={line.label} className="border-b border-line/50">
                    <td className="py-2 text-fg-muted">{line.label}</td>
                    <td className="py-2 text-right tabular-nums text-fg-primary">
                      {line.amount} ₽
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3 text-fg-primary">Итого в месяц</td>
                  <td className="pt-3 text-right text-xl font-bold tabular-nums text-accent">
                    {TOTAL} ₽
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </RevealOnScroll>

        <div className="order-1 lg:order-2">
          <RevealOnScroll index={0}>
            <h2 className="text-2xl text-fg-primary sm:text-3xl">
              Содержание инфраструктуры: {TOTAL} рублей в месяц
            </h2>
          </RevealOnScroll>

          <RevealOnScroll index={1}>
            <p className="mt-6 text-left text-sm leading-relaxed text-fg-primary/90 sm:text-justify sm:text-base">
              Раскладка по строкам — в блоке рядом. Больше ничего не
              понадобилось.
            </p>
          </RevealOnScroll>

          <RevealOnScroll index={2}>
            <p className="mt-4 text-left text-sm leading-relaxed text-fg-primary/90 sm:text-justify sm:text-base">
              Я делаю системы, и иногда могу чересчур погрузиться в них. Чтобы
              лишний раз потом не ходить в поликлинику, за моей комнатой следит
              HP100. А чтобы всё это работало — нужно {TOTAL} рублей в месяц.
            </p>
          </RevealOnScroll>

          <RevealOnScroll index={3}>
            <p className="mt-4 text-left text-sm leading-relaxed text-fg-primary/90 sm:text-justify sm:text-base">
              Я не беру заказы. Я беру задачи, которые мне искренне интересно
              решить — в этом залог моего творчества. Если у вас есть такая
              задача и понимание её ценности — напишите. Я посмотрю, стоит ли
              её решать. И если да — заберу вашу проблему и передам вам
              работающий механизм.
            </p>
          </RevealOnScroll>

          <RevealOnScroll
            index={4}
            className="flex flex-col items-center gap-3 lg:items-start"
          >
            <button
              ref={ctaRef}
              type="button"
              onClick={() => setPhoneOpen(true)}
              aria-expanded={phoneOpen}
              data-cursor="interactive"
              className="mt-8 inline-block border border-accent px-6 py-3 text-sm text-accent transition-[filter] duration-200 hover:[filter:drop-shadow(0_0_6px_var(--accent))]"
            >
              Написать в ТГ
            </button>
            <a
              href="https://max.ru/se14158141_bot"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="interactive"
              className="inline-block border border-accent px-6 py-3 text-sm text-accent transition-[filter] duration-200 hover:[filter:drop-shadow(0_0_6px_var(--accent))]"
            >
              Написать в MAX
            </a>
          </RevealOnScroll>
        </div>
      </div>

      <ContactPhonePanel open={phoneOpen} onClose={() => setPhoneOpen(false)} />
    </section>
  );
}
