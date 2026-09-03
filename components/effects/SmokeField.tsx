"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion";

interface Blob {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  r: number;
  alpha: number;
}

const REPEL_RADIUS = 360;
const REPEL_STRENGTH = 260;
const EASE = 0.08;
const PARALLAX_FACTOR = 0.18;

function hexToRgb(hex: string): string {
  const m = hex.trim().match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return "255,255,255";
  return `${parseInt(m[1]!, 16)},${parseInt(m[2]!, 16)},${parseInt(m[3]!, 16)}`;
}

/**
 * Soft, low-opacity smoke blobs that gently get pushed away from the cursor
 * and ease back to their home position. Cheap stand-in for real fluid
 * dynamics — a lerp-based repulsion reads the same at this scale and cost
 * far less per frame. Tinted with the live `--accent` color (read from the
 * DOM, since canvas fill styles can't reference CSS custom properties
 * directly) rather than plain white, so it reads as a warm ambient glow
 * instead of grey haze — and follows matrix mode's green re-theme for free.
 */
export default function SmokeField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const pointer = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const canvasEl: HTMLCanvasElement = canvas;
    const context: CanvasRenderingContext2D = ctx;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let blobs: Blob[] = [];
    let rafId = 0;
    let visible = document.visibilityState === "visible";
    let lastScrollY = window.scrollY;
    let accentRgb = "255,197,61";

    function readAccentColor() {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim();
      if (raw) accentRgb = hexToRgb(raw);
    }

    readAccentColor();
    const themeObserver = new MutationObserver(readAccentColor);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    function makeBlobs() {
      const count = 14;
      blobs = Array.from({ length: count }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        return {
          homeX: x,
          homeY: y,
          x,
          y,
          r: Math.min(width, height) * (0.16 + Math.random() * 0.16),
          alpha: 0.03 + Math.random() * 0.03,
        };
      });
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeBlobs();
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      for (const b of blobs) {
        const gradient = context.createRadialGradient(
          b.x,
          b.y,
          0,
          b.x,
          b.y,
          b.r
        );
        gradient.addColorStop(0, `rgba(${accentRgb},${b.alpha})`);
        gradient.addColorStop(1, `rgba(${accentRgb},0)`);
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        context.fill();
      }
    }

    function tick() {
      if (!visible) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const scrollY = window.scrollY;
      const scrollDelta = (scrollY - lastScrollY) * PARALLAX_FACTOR;
      lastScrollY = scrollY;

      for (const b of blobs) {
        if (scrollDelta !== 0) {
          b.homeY -= scrollDelta;
          const wrapMargin = height + b.r * 2;
          if (b.homeY < -b.r) b.homeY += wrapMargin;
          if (b.homeY > height + b.r) b.homeY -= wrapMargin;
        }
        const dx = b.x - pointer.current.x;
        const dy = b.y - pointer.current.y;
        const dist = Math.hypot(dx, dy);
        let targetX = b.homeX;
        let targetY = b.homeY;
        if (dist < REPEL_RADIUS && dist > 0.01) {
          const push = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          targetX = b.x + (dx / dist) * push;
          targetY = b.y + (dy / dist) * push;
        }
        b.x += (targetX - b.x) * EASE;
        b.y += (targetY - b.y) * EASE;
      }
      draw();
      rafId = requestAnimationFrame(tick);
    }

    function handlePointerMove(e: PointerEvent) {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
    }

    function handleVisibility() {
      visible = document.visibilityState === "visible";
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    if (reducedMotion) {
      draw();
    } else {
      window.addEventListener("pointermove", handlePointerMove);
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      themeObserver.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
