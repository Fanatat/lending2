"use client";

import { useEffect, useRef, useState } from "react";
import { useLabStore, EASTER_EGGS, type EasterEggMeta } from "@/lib/store";
import { playSfx } from "@/lib/sfx";

const TOAST_MS = 4200;

/**
 * Fixed top-right tally of discovered easter eggs ("found/total"). Clicking
 * it opens the hunter's log: found eggs with what they were, missing ones
 * as "???" with a nudge. Every new find also pops a short toast with a
 * chime, so the visitor knows the thing they just did counted. Once every
 * egg is found, a "МАТРИЦА ВКЛ/ВЫКЛ" toggle unlocks here — a reward for full
 * completion.
 */
export default function EasterEggCounter() {
  const foundIds = useLabStore((s) => s.foundEasterEggs);
  const matrixMode = useLabStore((s) => s.matrixMode);
  const setMatrixMode = useLabStore((s) => s.setMatrixMode);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<EasterEggMeta | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const found = foundIds.length;
  const total = EASTER_EGGS.length;
  const allFound = found >= total;

  // Toast only for finds made during this visit — the store is hydrated
  // from localStorage once on mount, and that initial batch must stay quiet.
  useEffect(() => {
    let hydrated = false;
    const t0 = window.setTimeout(() => (hydrated = true), 800);
    let timer = 0;
    const unsub = useLabStore.subscribe((s, prev) => {
      if (!hydrated || s.foundEasterEggs.length <= prev.foundEasterEggs.length) return;
      const id = s.foundEasterEggs[s.foundEasterEggs.length - 1];
      const meta = EASTER_EGGS.find((e) => e.id === id);
      if (!meta) return;
      playSfx("egg_found");
      setToast(meta);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(null), TOAST_MS);
    });
    return () => {
      unsub();
      window.clearTimeout(t0);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={panelRef} className="fixed right-4 top-4 z-40 flex flex-col items-end">
      <div className="flex items-center gap-2 border border-line bg-void px-2 py-1 text-[10px] tracking-widest text-fg-muted">
        <button
          type="button"
          data-cursor="interactive"
          aria-expanded={open}
          aria-label={`Найдено пасхалок: ${found} из ${total}. Открыть список`}
          onClick={() => {
            setOpen((o) => !o);
            playSfx("ui_click");
          }}
          className="transition-colors hover:text-accent"
        >
          Пасхалки: {found}/{total} {open ? "▴" : "▾"}
        </button>
        {allFound && (
          <button
            type="button"
            data-cursor="interactive"
            onClick={() => {
              setMatrixMode(!matrixMode);
              playSfx("matrix");
            }}
            className="border-l border-line pl-2 text-accent"
          >
            {matrixMode ? "МАТРИЦА: ВЫКЛ" : "МАТРИЦА ВКЛ"}
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Журнал пасхалок"
          className="egg-log mt-2 max-h-[70vh] w-[min(340px,calc(100vw-2rem))] overflow-y-auto border border-line bg-panel p-3 text-[11px] leading-snug shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        >
          <div className="mb-2 flex items-center justify-between text-[10px] tracking-widest text-fg-muted">
            <span>ЖУРНАЛ ОХОТНИКА</span>
            <span>
              {found}/{total}
            </span>
          </div>
          <ul className="space-y-2">
            {EASTER_EGGS.map((egg) => {
              const isFound = foundIds.includes(egg.id);
              return (
                <li key={egg.id} className="border-t border-line/60 pt-2">
                  <div className={isFound ? "text-accent" : "text-fg-muted"}>
                    {isFound ? "✓ " : "○ "}
                    {isFound ? egg.title : "???"}
                  </div>
                  <div className={isFound ? "text-fg-primary/80" : "text-fg-muted/80"}>
                    {isFound ? egg.found : egg.hint}
                  </div>
                </li>
              );
            })}
          </ul>
          {!allFound && (
            <p className="mt-3 border-t border-line/60 pt-2 text-[10px] text-fg-muted">
              Найдёте все — в этом углу появится переключатель Матрицы.
            </p>
          )}
        </div>
      )}

      {toast && !open && (
        <div role="status" className="egg-toast mt-2 max-w-[280px] border border-accent bg-void px-3 py-2 text-[11px]">
          <div className="text-[9px] tracking-widest text-fg-muted">ПАСХАЛКА НАЙДЕНА · {found}/{total}</div>
          <div className="mt-0.5 text-accent">{toast.title}</div>
        </div>
      )}
    </div>
  );
}
