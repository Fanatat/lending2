"use client";

import { useEffect, useRef } from "react";
import { INTRO_COLOR, INTRO_PARTICLE_COUNT } from "@/lib/introConfig";

interface Particle {
  angle: number;
  angularSpeed: number;
  baseRadius: number;
  ellipseB: number;
  rotation: number;
  size: number;
  opacity: number;
  tier: 0 | 1 | 2;
}

const TIER_COLOR: Record<Particle["tier"], string> = {
  0: INTRO_COLOR.particleBright,
  1: INTRO_COLOR.particleMid,
  2: INTRO_COLOR.particleDim,
};

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const tier = (i % 3) as Particle["tier"];
    return {
      angle: (i / count) * Math.PI * 2,
      angularSpeed: (0.35 + Math.random() * 0.9) / 1000, // rad/ms
      baseRadius: 40 + Math.random() * 200,
      ellipseB: 0.3 + Math.random() * 0.7,
      rotation: Math.random() * Math.PI,
      size: tier === 0 ? 3 + Math.random() * 3 : tier === 1 ? 7 + Math.random() * 6 : 16 + Math.random() * 10,
      opacity: tier === 0 ? 0.6 : tier === 1 ? 0.4 : 0.2,
      tier,
    };
  });
}

/** Eases through control points, matching the ТЗ's `times: [0, 0.6, 1]` collapse curve. */
function keyframe(t: number, values: [number, number, number]): number {
  if (t <= 0.6) return values[0] + (values[1] - values[0]) * (t / 0.6);
  const t2 = (t - 0.6) / 0.4;
  return values[1] + (values[2] - values[1]) * (t2 * t2 * (3 - 2 * t2)); // smoothstep out
}

interface IntroParticlesProps {
  phase: "particles" | "collapse";
  collapseDurationMs: number;
  onFlash?: (intensity: number) => void;
}

/**
 * Canvas orbital particles for the intro (ТЗ phases 2-3). Same DPR-aware
 * resize / visibilitychange-pause shape as ParticleDust, but time-driven by
 * elapsed ms (not a running clock) so orbit → collapse can be scrubbed by a
 * single React-owned phase instead of two separate animation loops.
 */
export default function IntroParticles({
  phase,
  collapseDurationMs,
  onFlash,
}: IntroParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  const collapseStartRef = useRef<number | null>(null);
  phaseRef.current = phase;

  useEffect(() => {
    if (phase === "collapse" && collapseStartRef.current === null) {
      collapseStartRef.current = performance.now();
    }
  }, [phase]);

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
    let particles = makeParticles(INTRO_PARTICLE_COUNT);
    let rafId = 0;
    let visible = document.visibilityState === "visible";
    let lastFlash = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(dt: number) {
      const cx = width / 2;
      const cy = height / 2;
      context.clearRect(0, 0, width, height);

      const collapsing = phaseRef.current === "collapse";
      const collapseT = collapsing
        ? Math.min(
            1,
            (performance.now() - (collapseStartRef.current ?? performance.now())) /
              collapseDurationMs
          )
        : 0;

      if (collapsing) {
        const flash = keyframe(collapseT, [0, 1, 0]);
        if (Math.abs(flash - lastFlash) > 0.01) {
          lastFlash = flash;
          onFlash?.(collapseT > 0.9 ? 0 : flash);
        }
      }

      for (const p of particles) {
        p.angle += p.angularSpeed * dt * (collapsing ? 3 : 1);

        const radiusMul = collapsing ? keyframe(collapseT, [1, 1.5, 0.08]) : 1;
        const scaleMul = collapsing ? keyframe(collapseT, [1, 1.4, 0.15]) : 1;
        const opacityMul = collapsing ? keyframe(collapseT, [1, 1, 0]) : 1;

        const radius = p.baseRadius * radiusMul;
        const x = Math.cos(p.angle) * radius;
        const y = Math.sin(p.angle) * radius * p.ellipseB;
        const rx = x * Math.cos(p.rotation) - y * Math.sin(p.rotation);
        const ry = x * Math.sin(p.rotation) + y * Math.cos(p.rotation);

        context.filter = `blur(${Math.max(0, p.size / 3)}px)`;
        context.beginPath();
        context.arc(cx + rx, cy + ry, Math.max(0.5, p.size * scaleMul), 0, Math.PI * 2);
        context.fillStyle = TIER_COLOR[p.tier];
        context.globalAlpha = p.opacity * opacityMul;
        context.fill();
      }
      context.globalAlpha = 1;
      context.filter = "none";
    }

    let last = performance.now();
    function tick(now: number) {
      const dt = Math.min(48, now - last);
      last = now;
      if (visible) draw(dt);
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
      particles = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapseDurationMs]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}
