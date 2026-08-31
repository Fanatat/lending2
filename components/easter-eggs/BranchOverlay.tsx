"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useBranchStore } from "@/lib/branchStore";
import { useLabStore } from "@/lib/store";
import { SILHOUETTES } from "./silhouettes";

const BEAM_RADIUS_PX = 90;
const FOUND_RADIUS_PX = 70;

const DUST_DOTS = [
  [12, 14], [28, 62], [41, 8], [55, 77], [67, 34], [78, 55],
  [8, 88], [92, 18], [35, 45], [61, 12], [19, 70], [86, 80],
  [48, 90], [72, 65], [5, 40], [95, 45],
];

export default function BranchOverlay() {
  const open = useBranchStore((s) => s.open);
  const foundIds = useBranchStore((s) => s.foundIds);
  const setOpen = useBranchStore((s) => s.setOpen);
  const markFoundSilhouette = useBranchStore((s) => s.markFoundSilhouette);
  const markGlobalFound = useLabStore((s) => s.markFound);
  const overlayRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const allFoundRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    function updateBeam(clientX: number, clientY: number) {
      const el = revealRef.current;
      if (el) {
        el.style.setProperty("--mx", `${clientX}px`);
        el.style.setProperty("--my", `${clientY}px`);
      }
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (const s of SILHOUETTES) {
        if (useBranchStore.getState().foundIds.includes(s.id)) continue;
        const cx = (s.x / 100) * w;
        const cy = (s.y / 100) * h;
        const dist = Math.hypot(clientX - cx, clientY - cy);
        if (dist < FOUND_RADIUS_PX) markFoundSilhouette(s.id);
      }
    }

    function onPointerMove(e: PointerEvent) {
      updateBeam(e.clientX, e.clientY);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, markFoundSilhouette, setOpen]);

  useEffect(() => {
    if (foundIds.length >= SILHOUETTES.length && !allFoundRef.current) {
      allFoundRef.current = true;
      markGlobalFound("branch");
    }
    if (foundIds.length === 0) allFoundRef.current = false;
  }, [foundIds, markGlobalFound]);

  if (!open) return null;

  const allFound = foundIds.length >= SILHOUETTES.length;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[95] bg-void"
      onClick={() => {
        if (allFound) setOpen(false);
      }}
    >
      <button
        type="button"
        data-cursor="interactive"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(false);
        }}
        aria-label="Закрыть"
        className="absolute right-4 top-4 z-10 text-fg-muted"
      >
        ×
      </button>

      <div
        ref={revealRef}
        aria-hidden="true"
        className="absolute inset-0"
        style={
          {
            "--mx": "50vw",
            "--my": "50vh",
            WebkitMaskImage: `radial-gradient(circle ${BEAM_RADIUS_PX}px at var(--mx) var(--my), black 0%, black 55%, transparent 100%)`,
            maskImage: `radial-gradient(circle ${BEAM_RADIUS_PX}px at var(--mx) var(--my), black 0%, black 55%, transparent 100%)`,
          } as CSSProperties
        }
      >
        {DUST_DOTS.map(([x, y], i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-fg-primary/30"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ))}
        {SILHOUETTES.filter((s) => !foundIds.includes(s.id)).map((s) => (
          <div
            key={s.id}
            className="absolute rounded-md bg-fg-primary/10"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.w,
              height: s.h,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {SILHOUETTES.filter((s) => foundIds.includes(s.id)).map((s) => (
        <div
          key={s.id}
          aria-hidden="true"
          className="absolute rounded-md border border-accent bg-accent/15 transition-opacity duration-500"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.w,
            height: s.h,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {allFound && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="max-w-md text-sm text-accent sm:text-base">
            Ветка уже растёт, но пока ничего не несёт. Вернитесь позже.
          </p>
        </div>
      )}
    </div>
  );
}
