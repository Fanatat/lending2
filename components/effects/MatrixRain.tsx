"use client";

import { useEffect, useRef } from "react";
import { useLabStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/motion";

const CHARS = "01アイウエオカキクケコサシスセソタチツテト";
const FONT_SIZE = 14;

/**
 * Falling green code rain behind the page — the background half of the
 * Matrix easter egg (five quick clicks on the hero title toggles
 * html.matrix-mode in styles/tokens.css, which handles the text-color half).
 * Only mounts its render loop while matrixMode is on.
 *
 * Sized to the full document height and `position: absolute` (not `fixed`)
 * so the rain is one continuous field spanning the whole page and scrolls
 * with it — a `fixed` canvas would only ever draw the current viewport,
 * which reads as the effect "riding along" with a fast scroll instead of
 * covering the page's full length.
 */
export default function MatrixRain() {
  const matrixMode = useLabStore((s) => s.matrixMode);
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!matrixMode || reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const canvasEl: HTMLCanvasElement = canvas;
    const context: CanvasRenderingContext2D = ctx;

    let width = 0;
    let height = 0;
    let columns = 0;
    let drops: number[] = [];
    let rafId = 0;
    let visible = document.visibilityState === "visible";

    function documentHeight() {
      const doc = document.documentElement;
      return Math.max(doc.scrollHeight, doc.clientHeight, window.innerHeight);
    }

    function resize() {
      const newWidth = window.innerWidth;
      const newHeight = documentHeight();
      if (newWidth === width && newHeight === height) return;
      width = newWidth;
      height = newHeight;
      canvasEl.width = width;
      canvasEl.height = height;
      columns = Math.ceil(width / FONT_SIZE);
      drops = Array.from({ length: columns }, () => Math.random() * -50);
    }

    function tick() {
      if (!visible) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      context.fillStyle = "rgba(10, 10, 10, 0.08)";
      context.fillRect(0, 0, width, height);
      context.font = `${FONT_SIZE}px monospace`;
      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)] ?? "0";
        const x = i * FONT_SIZE;
        const drop = drops[i] ?? 0;
        const y = drop * FONT_SIZE;
        context.fillStyle =
          Math.random() > 0.97 ? "rgba(200,255,220,0.8)" : "rgba(0,255,65,0.55)";
        context.fillText(char, x, y);
        drops[i] = y > height && Math.random() > 0.975 ? 0 : drop + 1;
      }
      rafId = requestAnimationFrame(tick);
    }

    function handleVisibility() {
      visible = document.visibilityState === "visible";
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);
    rafId = requestAnimationFrame(tick);

    // Page height changes independently of window resize (Подробнее
    // disclosures, the СИСТЕМА 04 unfold, sensor data swapping in) — a
    // ResizeObserver on <html> catches those too, so the canvas never ends
    // up shorter than the page it's supposed to cover.
    const observer = new ResizeObserver(() => resize());
    observer.observe(document.documentElement);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [matrixMode, reducedMotion]);

  if (!matrixMode || reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-0"
    />
  );
}
