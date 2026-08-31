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

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
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

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(rafId);
    };
  }, [matrixMode, reducedMotion]);

  if (!matrixMode || reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
