"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

/**
 * Fixed full-viewport layer of faint, slowly drifting dust motes — not a
 * starfield, closer to dust in a projector beam. This is the one place in
 * the app allowed to use Math.random() for its motion (see globals.css note
 * on .decorative-loop / lib/motion.ts).
 */
export default function ParticleDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

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
    let particles: Particle[] = [];
    let rafId = 0;
    let visible = document.visibilityState === "visible";

    function makeParticles() {
      const count = Math.round(
        Math.min(120, Math.max(40, (width * height) / 14000))
      );
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        r: Math.random() * 1.3 + 0.3,
        alpha: Math.random() * 0.12 + 0.05,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.0008 + Math.random() * 0.0012,
      }));
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
      makeParticles();
    }

    function drawStatic() {
      context.clearRect(0, 0, width, height);
      for (const p of particles) {
        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(232,232,232,${p.alpha})`;
        context.fill();
      }
    }

    function tick(now: number) {
      if (!visible) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      context.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        const twinkle = 0.7 + 0.3 * Math.sin(now * p.twinkleSpeed + p.twinklePhase);
        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(232,232,232,${p.alpha * twinkle})`;
        context.fill();
      }
      rafId = requestAnimationFrame(tick);
    }

    function handleVisibility() {
      visible = document.visibilityState === "visible";
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    if (reducedMotion) {
      drawStatic();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
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
