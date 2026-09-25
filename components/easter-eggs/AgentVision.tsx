"use client";

import { useEffect, useRef, useState } from "react";
import { useLabStore } from "@/lib/store";
import { playSfx } from "@/lib/sfx";
import { useLocale } from "@/lib/locale";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "KeyB", "KeyA",
];
const HTML_CLASS = "agent-vision";

/** What an agent would call the element under the cursor. */
function describe(el: Element | null, quote: [string, string]): string {
  if (!el) return "—";
  const sec = el.closest("section[id]");
  const tag = el.tagName.toLowerCase();
  const label =
    el.getAttribute("aria-label") ||
    (el as HTMLElement).innerText?.trim().split("\n")[0]?.slice(0, 38) ||
    "";
  return `${sec ? `#${sec.id} › ` : ""}<${tag}>${label ? ` ${quote[0]}${label}${quote[1]}` : ""}`;
}

/**
 * Konami code (↑↑↓↓←→←→BA, by physical key so it works on a Russian layout
 * too) flips the page into "agent vision": desaturated, every block
 * outlined, and a HUD that reads out what's under the cursor the way a
 * parser would see it. Same code or Esc turns it off.
 */
export default function AgentVision() {
  const [on, setOn] = useState(false);
  const [target, setTarget] = useState("—");
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const progress = useRef(0);
  const markFound = useLabStore((s) => s.markFound);
  const en = useLocale() === "en";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Escape" && on) {
        setOn(false);
        return;
      }
      if (e.code === KONAMI[progress.current]) {
        progress.current += 1;
        if (progress.current === KONAMI.length) {
          progress.current = 0;
          setOn((v) => !v);
          markFound("konami");
          playSfx("matrix");
        }
      } else {
        progress.current = e.code === KONAMI[0] ? 1 : 0;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on, markFound]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle(HTML_CLASS, on);
    if (!on) return;
    let raf = 0;
    function onMove(e: PointerEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY });
        setTarget(describe(document.elementFromPoint(e.clientX, e.clientY), en ? ["“", "”"] : ["«", "»"]));
      });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      html.classList.remove(HTML_CLASS);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [on, en]);

  if (!on) return null;

  return (
    <div className="agent-vision-hud pointer-events-none fixed inset-0 z-[60] text-[10px] tracking-widest text-accent">
      <div className="absolute left-4 top-4 border border-accent/60 bg-void/80 px-2 py-1">
        AGENT VIEW · ↑↑↓↓←→←→BA · ESC — {en ? "exit" : "выход"}
      </div>
      <div className="absolute bottom-4 left-4 max-w-[80vw] truncate border border-accent/60 bg-void/80 px-2 py-1">
        {en ? "TARGET" : "ЦЕЛЬ"}: {target}
      </div>
      <div
        className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 border border-accent/70"
        style={{ left: pos.x, top: pos.y }}
      >
        <span className="absolute left-1/2 top-0 h-2 w-px bg-accent" />
        <span className="absolute bottom-0 left-1/2 h-2 w-px bg-accent" />
        <span className="absolute left-0 top-1/2 h-px w-2 bg-accent" />
        <span className="absolute right-0 top-1/2 h-px w-2 bg-accent" />
      </div>
    </div>
  );
}
