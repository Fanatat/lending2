"use client";

import { useEffect, useRef, useState } from "react";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { useHasFinePointer, useReducedMotion } from "@/lib/motion";
import ContactPhonePanel from "./ContactPhonePanel";

const COST_LINES = [
  { label: "Арендованный сервер", amount: 300 },
  { label: "Сторонний прокси", amount: 200 },
  { label: "Подписка на нейросеть", amount: 1500 },
];
const TOTAL = COST_LINES.reduce((sum, l) => sum + l.amount, 0);

const IDLE_PERIOD_MS = 4200;
const IDLE_SHAKE_MS = 400;
const IDLE_AMPLITUDE = 3;
const MAGNET_RADIUS = 70;
const MAGNET_MAX_OFFSET = 10;

/** Decaying wiggle concentrated at the start of each period — a short
 * attention-grabbing shake repeating on a slow interval, not a constant
 * tremor. */
function idleShakeOffset(elapsedInPeriod: number) {
  if (elapsedInPeriod > IDLE_SHAKE_MS) return 0;
  const t = elapsedInPeriod / IDLE_SHAKE_MS;
  return Math.sin(t * Math.PI * 6) * IDLE_AMPLITUDE * (1 - t);
}

/**
 * Combines three transform sources into one imperative write per frame so
 * they never fight over the element's own inline `transform` (a CSS
 * `animation` and a JS-driven inline transform on the same property would
 * otherwise silently override each other):
 *  - idle shake: a small periodic wiggle that draws the eye while at rest
 *  - magnetic pull: the button leans toward the cursor within a small radius
 *  - (TG button only) scroll jitter: shakes in proportion to scroll speed,
 *    the closest analogue, without an actual camera, to "text reacts to
 *    camera movement" — kept from the original CTA-only effect.
 * Idle shake pauses while the magnet is actively engaged so the two never
 * visually compete.
 */
function useCtaAttention<T extends HTMLElement>(
  reducedMotion: boolean,
  hasFinePointer: boolean,
  withScrollJitter: boolean
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    const startTime = performance.now();

    function onPointerMove(e: PointerEvent) {
      pointerX = e.clientX;
      pointerY = e.clientY;
    }
    if (hasFinePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    function frame(now: number) {
      let jx = 0;
      let jy = 0;
      let jrot = 0;
      if (withScrollJitter) {
        const y = window.scrollY;
        scrollVelocity = scrollVelocity * 0.85 + (y - lastScrollY) * 0.15;
        lastScrollY = y;
        const amount = Math.min(6, Math.abs(scrollVelocity) * 0.6);
        if (amount > 0.05) {
          jx = (Math.random() - 0.5) * amount;
          jy = (Math.random() - 0.5) * amount;
          jrot = (Math.random() - 0.5) * amount * 0.4;
        }
      }

      let mx = 0;
      let my = 0;
      if (hasFinePointer && el) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = pointerX - cx;
        const dy = pointerY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < MAGNET_RADIUS) {
          const pull = (1 - dist / MAGNET_RADIUS) * MAGNET_MAX_OFFSET;
          mx = (dx / dist) * pull;
          my = (dy / dist) * pull;
        }
      }

      let sx = 0;
      if (mx === 0 && my === 0) {
        sx = idleShakeOffset((now - startTime) % IDLE_PERIOD_MS);
      }

      const x = jx + mx + sx;
      const y = jy + my;
      if (el) {
        if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05 || Math.abs(jrot) > 0.05) {
          el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${jrot.toFixed(2)}deg)`;
        } else {
          el.style.transform = "";
        }
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [reducedMotion, hasFinePointer, withScrollJitter]);

  return ref;
}

export default function ClosingSection() {
  const reducedMotion = useReducedMotion();
  const hasFinePointer = useHasFinePointer();
  const ctaRef = useCtaAttention<HTMLButtonElement>(reducedMotion, hasFinePointer, true);
  const maxRef = useCtaAttention<HTMLAnchorElement>(reducedMotion, hasFinePointer, false);
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
              ref={maxRef}
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
