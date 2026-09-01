"use client";

import { useEffect, useRef } from "react";
import SectionShell from "@/components/sections/SectionShell";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import BridgeDiagram from "./BridgeDiagram";
import { useLabStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/motion";

const REVEAL_MS = 700;

/**
 * СИСТЕМА 04 is the second header-click egg (see HeroTitleReveal): the whole
 * block stays collapsed to zero height, non-interactive and out of the tab
 * order until Matrix mode switches on, then unfolds in sync with the theme
 * change. Deliberately never rendered as "hidden" via a fixed height/scroll
 * trick — grid-template-rows keeps the collapse exact regardless of content
 * length, matching DetailsDisclosure's pattern elsewhere on the page.
 */
export default function BridgeSection() {
  const matrixMode = useLabStore((s) => s.matrixMode);
  const reducedMotion = useReducedMotion();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!matrixMode || notifiedRef.current) return;
    notifiedRef.current = true;
    // TrunkNav measures section positions near mount; unfolding this block
    // shifts everything below it, so nudge it to re-measure once settled.
    const t = window.setTimeout(
      () => window.dispatchEvent(new Event("resize")),
      reducedMotion ? 0 : REVEAL_MS
    );
    return () => window.clearTimeout(t);
  }, [matrixMode, reducedMotion]);

  return (
    <div
      aria-hidden={!matrixMode}
      style={{
        display: "grid",
        gridTemplateRows: matrixMode ? "1fr" : "0fr",
        opacity: matrixMode ? 1 : 0,
        visibility: matrixMode ? "visible" : "hidden",
        pointerEvents: matrixMode ? "auto" : "none",
        transition: reducedMotion
          ? "none"
          : `grid-template-rows ${REVEAL_MS}ms ease, opacity ${REVEAL_MS}ms ease, visibility 0s linear ${
              matrixMode ? "0s" : `${REVEAL_MS}ms`
            }`,
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <SectionShell
          id="bridge"
          number="СИСТЕМА 04"
          title="Фикс для приближающегося рунета."
          line={
            <>
              Мост соединяет SOCKS5 с HTTP и возвращает{" "}
              <span className="text-fg-muted/50 line-through">Telegram</span>{" "}
              Desktop в рабочее состояние за пару минут.
            </>
          }
          details="Локальный сервер поднимается на компьютере и берёт на себя всю грязную работу: авторизацию, туннелирование, разбор соединений, с логом каждого из них. Инструкция построена как нормальная диагностика, от дешёвого к дорогому: сначала две галочки в настройках самого приложения, и только если это не помогло, запускается мост. Работает системной службой, самотест зелёный. Задача типовая: так же лечится любое приложение, которое понимает один протокол, а у вас оплачен и доступен другой."
        >
          <div className="flex w-full flex-col items-center gap-3">
            <BridgeDiagram />
            <ProjectCardLink
              href="/projects/bridge"
              ariaLabel="Открыть проект Мост"
              className="text-[10px] text-accent"
            >
              Лог соединений и архитектура →
            </ProjectCardLink>
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
