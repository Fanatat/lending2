"use client";

import { useEffect, useRef } from "react";
import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import BridgeDiagram from "./BridgeDiagram";
import { useLabStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/motion";
import { SYSTEM_COPY } from "@/lib/systemCopy";

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
          number={SYSTEM_COPY.bridge.number}
          title={SYSTEM_COPY.bridge.title}
          line={
            <>
              <SystemStatusLine systemId="bridge" className="mb-3" />
              Мост соединяет SOCKS5 с HTTP и возвращает{" "}
              <span className="text-fg-muted/50 line-through">Telegram</span>{" "}
              Desktop в рабочее состояние за пару минут.
            </>
          }
          details={SYSTEM_COPY.bridge.details}
        >
          <div className="flex w-full flex-col items-center gap-3">
            <BridgeDiagram />
            <ProjectCardLink
              href="/projects/bridge"
              ariaLabel="Открыть проект Мост"
              className="text-[10px] text-accent"
            >
              Как устроен мост →
            </ProjectCardLink>
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
