"use client";

import { useEffect, useRef } from "react";
import { INTRO_COLOR } from "@/lib/introConfig";

interface Particle {
  angle: number;
  /** rad/ms */
  angularSpeed: number;
  baseRadius: number;
  ellipseB: number;
  rotation: number;
  size: number;
  alpha: number;
  sprite: HTMLCanvasElement;
  /** Spiral-out stagger, ms. */
  delay: number;
}

interface IntroParticlesProps {
  /** Orbit phase length, ms — collapse starts right after it. */
  orbitMs: number;
  collapseMs: number;
  counts: { orbit: number; sparks: number };
  /** Reduced motion: slower orbits, short trails. */
  gentle: boolean;
}

const SPIRAL_OUT_MS = 1500;

/** Glow sprites by tier: small/bright, medium, large/dim. */
type Sprites = [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement];

function makeSprite(rgbCenter: string, rgbEdge: string): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${rgbCenter}, 1)`);
  grad.addColorStop(0.25, `rgba(${rgbEdge}, 0.85)`);
  grad.addColorStop(0.6, `rgba(${rgbEdge}, 0.22)`);
  grad.addColorStop(1, `rgba(${rgbEdge}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

function makeParticles(
  counts: IntroParticlesProps["counts"],
  maxRadius: number,
  sprites: Sprites
): Particle[] {
  const orbit = Array.from({ length: counts.orbit }, (_, i): Particle => {
    // ТЗ tiers: small/bright, medium, large/dim.
    const tier = (i % 3) as 0 | 1 | 2;
    return {
      angle: (i / counts.orbit) * Math.PI * 2,
      angularSpeed: (0.6 + Math.random() * 1.2) / 1000,
      baseRadius: 50 + Math.random() * (maxRadius - 50),
      ellipseB: 0.3 + Math.random() * 0.7,
      rotation: Math.random() * Math.PI,
      size: tier === 0 ? 5 + Math.random() * 4 : tier === 1 ? 12 + Math.random() * 10 : 28 + Math.random() * 16,
      alpha: tier === 0 ? 1 : tier === 1 ? 0.6 : 0.3,
      sprite: sprites[tier],
      delay: i * 45,
    };
  });
  const sparks = Array.from({ length: counts.sparks }, (): Particle => ({
    angle: Math.random() * Math.PI * 2,
    angularSpeed: (0.8 + Math.random() * 1.8) / 1000,
    baseRadius: 25 + Math.random() * (maxRadius * 1.25 - 25),
    ellipseB: 0.25 + Math.random() * 0.75,
    rotation: Math.random() * Math.PI,
    size: 1.6 + Math.random() * 2.6,
    alpha: 0.45 + Math.random() * 0.5,
    sprite: sprites[0],
    delay: 150 + Math.random() * 700,
  }));
  return [...orbit, ...sparks];
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Collapse curve (ТЗ phase 3): short inhale outwards, then a hard pull into the core. */
function collapseRadius(ct: number): number {
  if (ct < 0.35) return 1 + 0.2 * easeOutCubic(ct / 0.35);
  if (ct < 0.8) return 1.2 - 1.18 * easeInCubic((ct - 0.35) / 0.45);
  return 0.02;
}

/**
 * Canvas orbital particles for the intro (ТЗ phases 2-3). Purely time-driven
 * from its own mount: orbits for `orbitMs` (spiralling out of the core over
 * the first SPIRAL_OUT_MS), then collapses over `collapseMs`. The parent
 * unmounts it once the collapse is over, so there is no phase prop to keep
 * in sync with the rAF loop.
 *
 * Trails come from fading the previous frame with destination-out instead
 * of clearing it; glows are pre-rendered sprites drawn additively, which is
 * much cheaper than ctx.filter blur (and works in Safari).
 */
export default function IntroParticles({
  orbitMs,
  collapseMs,
  counts,
  gentle,
}: IntroParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const canvasEl: HTMLCanvasElement = canvas;
    const context: CanvasRenderingContext2D = ctx;

    const sprites: Sprites = [
      makeSprite(INTRO_COLOR.core, INTRO_COLOR.accent),
      makeSprite(INTRO_COLOR.accent, INTRO_COLOR.accent),
      makeSprite(INTRO_COLOR.accent, INTRO_COLOR.deep),
    ];

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let rafId = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let resizeTimer = 0;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    }

    resize();
    particles = makeParticles(
      counts,
      Math.min(300, Math.min(width, height) * 0.42),
      sprites
    );

    const speedBase = gentle ? 0.4 : 1;
    const start = performance.now();
    let last = start;

    function frame(now: number) {
      const dt = Math.min(48, now - last);
      last = now;
      const t = now - start;
      const ct = t > orbitMs ? clamp01((t - orbitMs) / collapseMs) : 0;
      const collapsing = ct > 0;

      // Fade the previous frame instead of clearing it — that's the trail.
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = `rgba(0, 0, 0, ${gentle ? 0.4 : collapsing ? 0.14 : 0.2})`;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      const cx = width / 2;
      const cy = height / 2;
      const speedMul = speedBase * (collapsing ? 1 + 3 * easeInCubic(ct) : 1);
      const radiusCollapse = collapsing ? collapseRadius(ct) : 1;
      const alphaCollapse = collapsing ? 1 - clamp01((ct - 0.7) / 0.13) : 1;

      if (alphaCollapse > 0) {
        for (const p of particles) {
          const spiral = easeOutCubic(clamp01((t - p.delay) / SPIRAL_OUT_MS));
          if (spiral <= 0) continue;
          // Spinning faster while still close to the core sells the spiral.
          p.angle += p.angularSpeed * dt * speedMul * (1 + 1.5 * (1 - spiral));

          const radius = p.baseRadius * spiral * radiusCollapse;
          const x = Math.cos(p.angle) * radius;
          const y = Math.sin(p.angle) * radius * p.ellipseB;
          const rx = x * Math.cos(p.rotation) - y * Math.sin(p.rotation);
          const ry = x * Math.sin(p.rotation) + y * Math.cos(p.rotation);

          // Fake depth: the near half of each orbit is bigger and brighter.
          const depth = 0.5 + 0.5 * Math.sin(p.angle);
          const size = p.size * (0.75 + 0.5 * depth) * (0.4 + 0.6 * spiral);
          context.globalAlpha = p.alpha * (0.5 + 0.5 * depth) * alphaCollapse;
          context.drawImage(p.sprite, cx + rx - size, cy + ry - size, size * 2, size * 2);
        }
        context.globalAlpha = 1;
      }

      context.globalCompositeOperation = "source-over";
      rafId = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", onResize);
    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      cancelAnimationFrame(rafId);
    };
    // Props are fixed for the lifetime of one intro run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}
