"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  depth: number;
}

interface IntroStarfieldProps {
  count: number;
  gentle: boolean;
}

/**
 * Deep-space backdrop that stays mounted for the entire intro — the void
 * the orb flythrough (IntroOrbs) pulls back into, and that the core/particle
 * phases keep drifting through afterwards. Runs on its own rAF loop from
 * mount to unmount, independent of the phase timeline: a twinkling field
 * with a very slow continuous zoom (reads as the camera still creeping
 * forward) and light pointer parallax.
 */
export default function IntroStarfield({ count, gentle }: IntroStarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const canvasEl: HTMLCanvasElement = canvas;
    const context: CanvasRenderingContext2D = ctx;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let rafId = 0;
    let px = 0;
    let py = 0;
    let targetPx = 0;
    let targetPy = 0;

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

    function makeStars() {
      // Slight overscan (-0.15..1.15) so pointer parallax / zoom never
      // exposes a bare edge.
      stars = Array.from({ length: count }, (): Star => ({
        x: Math.random() * 1.3 - 0.15,
        y: Math.random() * 1.3 - 0.15,
        r: 0.5 + Math.random() * 1.4,
        baseAlpha: 0.25 + Math.random() * 0.6,
        twinkleSpeed: 0.0005 + Math.random() * 0.0015,
        twinklePhase: Math.random() * Math.PI * 2,
        depth: 0.3 + Math.random() * 0.7,
      }));
    }

    let resizeTimer = 0;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    }

    function onPointerMove(e: PointerEvent) {
      targetPx = (e.clientX / window.innerWidth) * 2 - 1;
      targetPy = (e.clientY / window.innerHeight) * 2 - 1;
    }

    resize();
    makeStars();

    const start = performance.now();

    function frame(now: number) {
      const t = now - start;
      context.clearRect(0, 0, width, height);

      px += (targetPx - px) * 0.02;
      py += (targetPy - py) * 0.02;

      // Sells a camera that never quite stops drifting forward, the whole
      // intro through — not just during the orb flythrough.
      const zoom = gentle ? 1 : 1 + Math.min(t / 40000, 0.08);
      const cx = width / 2;
      const cy = height / 2;

      for (const s of stars) {
        const twinkle = gentle
          ? s.baseAlpha
          : s.baseAlpha * (0.6 + 0.4 * Math.sin(t * s.twinkleSpeed + s.twinklePhase));
        const parX = gentle ? 0 : px * 14 * s.depth;
        const parY = gentle ? 0 : py * 10 * s.depth;
        const sx = (s.x * width - cx) * zoom + cx + parX;
        const sy = (s.y * height - cy) * zoom + cy + parY;
        if (sx < -20 || sx > width + 20 || sy < -20 || sy > height + 20) continue;
        context.globalAlpha = twinkle;
        context.fillStyle = "#fff8e8";
        context.beginPath();
        context.arc(sx, sy, s.r, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;

      rafId = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", onResize);
    if (!gentle) window.addEventListener("pointermove", onPointerMove, { passive: true });
    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.clearTimeout(resizeTimer);
      cancelAnimationFrame(rafId);
    };
    // Props are fixed for the lifetime of one intro run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="intro-starfield" />;
}
