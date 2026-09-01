"use client";

import { useEffect, useRef, useState } from "react";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { useReducedMotion } from "@/lib/motion";
import ContactPhonePanel from "./ContactPhonePanel";

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
      <div className="mx-auto max-w-2xl">
        <RevealOnScroll index={0}>
          <h2 className="text-2xl text-fg-primary sm:text-3xl">
            Содержание инфраструктуры: 2000 рублей в месяц
          </h2>
        </RevealOnScroll>

        <RevealOnScroll index={1}>
          <p className="mt-6 text-left text-sm leading-relaxed text-fg-primary/90 sm:text-justify sm:text-base">
            Арендованный сервер: 300 рублей. Сторонний прокси: 200 рублей.
            Подписка на нейросеть, которая всё это разрабатывает и
            обслуживает: 1500 рублей. Больше не понадобилось.
          </p>
        </RevealOnScroll>

        <RevealOnScroll index={2}>
          <p className="mt-4 text-left text-sm leading-relaxed text-fg-primary/90 sm:text-justify sm:text-base">
            Я делаю системы, и иногда могу чересчур погрузиться в них. Чтобы
            лишний раз потом не ходить в поликлинику, за моей комнатой следит
            HP100. А чтобы всё это работало — нужно 2000 рублей в месяц.
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
          className="flex flex-col items-center gap-3"
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
            href="#"
            data-cursor="interactive"
            className="inline-block border border-accent px-6 py-3 text-sm text-accent transition-[filter] duration-200 hover:[filter:drop-shadow(0_0_6px_var(--accent))]"
          >
            Написать в MAX
          </a>
        </RevealOnScroll>
      </div>

      <ContactPhonePanel open={phoneOpen} onClose={() => setPhoneOpen(false)} />
    </section>
  );
}
