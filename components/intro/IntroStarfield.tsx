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

interface Constellation {
  points: [number, number][];
  lines: [number, number][];
  /** Index into `points` of this constellation's brightest star, if any. */
  destinationIndex?: number;
}

// Three fixed constellations (hand-placed, not random, so the shapes read
// as deliberate) — the third always carries the destination star at exactly
// (0.5, 0.5), the point the dash below rushes toward and where IntroCore's
// dot (also dead-center) picks up right after.
const CONSTELLATIONS: Constellation[] = [
  {
    points: [
      [0.13, 0.22],
      [0.19, 0.15],
      [0.26, 0.19],
      [0.23, 0.28],
      [0.16, 0.29],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  },
  {
    points: [
      [0.8, 0.64],
      [0.87, 0.59],
      [0.92, 0.68],
      [0.85, 0.76],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
  },
  {
    points: [
      [0.4, 0.36],
      [0.5, 0.5],
      [0.62, 0.4],
      [0.56, 0.27],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    destinationIndex: 1,
  },
];

interface IntroStarfieldProps {
  count: number;
  gentle: boolean;
  mobile: boolean;
  /** IntroAnimation's own INTRO_TIMING.voyage — drives the Milky
   *  way/constellations/dash timing fractions below (this component mounts
   *  in lockstep with the voyage phase, so `t` since mount ≈ ms into it). */
  voyageMs: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInCubic = (v: number) => v * v * v;
const easeOutCubic = (v: number) => 1 - Math.pow(1 - v, 3);

/**
 * Deep-space backdrop that stays mounted for the entire intro — the void
 * the orb flythrough (IntroOrbs) pulls back into. Beyond the plain
 * twinkling field, it builds a Milky Way band and a few constellations
 * behind the orbs as they recede, then — in the voyage phase's last stretch
 * — dashes the camera into one particular (always dead-center) star: a fast
 * accelerating zoom that settles back down right as IntroCore's dot takes
 * over the same spot, so the two hand off with no visible seam.
 */
export default function IntroStarfield({ count, gentle, mobile, voyageMs }: IntroStarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const canvasEl: HTMLCanvasElement = canvas;
    const context: CanvasRenderingContext2D = ctx;
    canvasEl.style.transformOrigin = "50% 50%";

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let rafId = 0;
    let px = 0;
    let py = 0;
    let targetPx = 0;
    let targetPy = 0;

    const constellations = mobile
      ? CONSTELLATIONS.filter((c, i) => c.destinationIndex !== undefined || i === 0)
      : CONSTELLATIONS;

    // Voyage timing fractions (see module doc comment above): planets
    // recede over roughly the first 60%, the Milky Way/constellations build
    // up from ~30%/44%, the dash covers the last 20%, and the zoom settles
    // back down over the following SETTLE_MS once the voyage phase ends.
    const milkyWayStart = voyageMs * 0.3;
    const milkyWayFadeMs = voyageMs * 0.22;
    const constStart = voyageMs * 0.44;
    const constFadeMs = voyageMs * 0.2;
    const dashStart = voyageMs * 0.8;
    const dashMs = voyageMs - dashStart;
    const settleMs = 650;
    const dashMaxScale = 9;

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

    function drawMilkyWay(alpha: number) {
      if (alpha <= 0) return;
      context.save();
      context.translate(width / 2, height / 2);
      context.rotate(-0.35);
      const bandLength = Math.max(width, height) * 2.4;
      const glowWidth = Math.min(width, height) * 0.95;
      const glow = context.createLinearGradient(0, -glowWidth / 2, 0, glowWidth / 2);
      glow.addColorStop(0, "rgba(255,238,214,0)");
      glow.addColorStop(0.5, `rgba(255,238,214,${0.09 * alpha})`);
      glow.addColorStop(1, "rgba(255,238,214,0)");
      context.fillStyle = glow;
      context.fillRect(-bandLength / 2, -glowWidth / 2, bandLength, glowWidth);

      const laneWidth = glowWidth * 0.34;
      const lane = context.createLinearGradient(0, -laneWidth / 2, 0, laneWidth / 2);
      lane.addColorStop(0, "rgba(255,244,222,0)");
      lane.addColorStop(0.5, `rgba(255,244,222,${0.13 * alpha})`);
      lane.addColorStop(1, "rgba(255,244,222,0)");
      context.fillStyle = lane;
      context.fillRect(-bandLength / 2, -laneWidth / 2, bandLength, laneWidth);
      context.restore();
    }

    function drawConstellations(alpha: number, destGlow: number) {
      if (alpha <= 0 && destGlow <= 0) return;
      for (const c of constellations) {
        const pts: [number, number][] = c.points.map(([px2, py2]) => [px2 * width, py2 * height]);
        if (alpha > 0) {
          context.strokeStyle = `rgba(255, 238, 214, ${0.22 * alpha})`;
          context.lineWidth = 1;
          context.beginPath();
          for (const [a, b] of c.lines) {
            const from = pts[a];
            const to = pts[b];
            if (!from || !to) continue;
            context.moveTo(from[0], from[1]);
            context.lineTo(to[0], to[1]);
          }
          context.stroke();
        }
        pts.forEach(([sx, sy], i) => {
          const isDest = c.destinationIndex === i;
          if (isDest) {
            if (destGlow <= 0) return;
            const glowR = 3 + destGlow * 46;
            const grad = context.createRadialGradient(sx, sy, 0, sx, sy, glowR);
            grad.addColorStop(0, `rgba(255, 250, 240, ${0.85 * destGlow})`);
            grad.addColorStop(0.35, `rgba(255, 227, 160, ${0.4 * destGlow})`);
            grad.addColorStop(1, "rgba(255, 197, 61, 0)");
            context.fillStyle = grad;
            context.beginPath();
            context.arc(sx, sy, glowR, 0, Math.PI * 2);
            context.fill();
            context.globalAlpha = Math.min(1, 0.7 + destGlow);
            context.fillStyle = "#fffaf0";
            context.beginPath();
            context.arc(sx, sy, 1.6 + destGlow * 1.4, 0, Math.PI * 2);
            context.fill();
            context.globalAlpha = 1;
          } else if (alpha > 0) {
            context.globalAlpha = alpha;
            context.fillStyle = "#fff8e8";
            context.beginPath();
            context.arc(sx, sy, 1.8, 0, Math.PI * 2);
            context.fill();
            context.globalAlpha = 1;
          }
        });
      }
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

      // The Milky Way and constellations fade up behind the orbs, hold
      // through the dash, then fade back out once the camera has settled —
      // by the time the core/particle phases run, the backdrop is back to
      // a plain twinkling field like before.
      const milkyAlpha = gentle
        ? clamp01((t - milkyWayStart) / milkyWayFadeMs) * 0.7
        : clamp01((t - milkyWayStart) / milkyWayFadeMs);
      const constAlpha = clamp01((t - constStart) / constFadeMs);
      const dashProgress = gentle ? 0 : clamp01((t - dashStart) / dashMs);
      const pastVoyage = t >= voyageMs;
      const settleProgress = pastVoyage ? clamp01((t - voyageMs) / settleMs) : 0;
      const fadeOutMul = pastVoyage ? 1 - easeOutCubic(settleProgress) : 1;
      const destGlow = gentle
        ? clamp01((t - constStart) / constFadeMs) * 0.55
        : Math.max(easeInCubic(dashProgress), (1 - easeOutCubic(settleProgress)) * 0.9);
      // Focus narrows onto the destination star as the dash builds.
      const focusFade = 1 - easeInCubic(dashProgress) * 0.7;

      drawMilkyWay(milkyAlpha * focusFade * fadeOutMul);
      drawConstellations(constAlpha * focusFade * fadeOutMul, destGlow * fadeOutMul);

      for (const s of stars) {
        const twinkle = gentle
          ? s.baseAlpha
          : s.baseAlpha * (0.6 + 0.4 * Math.sin(t * s.twinkleSpeed + s.twinklePhase));
        const parX = gentle ? 0 : px * 14 * s.depth;
        const parY = gentle ? 0 : py * 10 * s.depth;
        const sx = (s.x * width - cx) * zoom + cx + parX;
        const sy = (s.y * height - cy) * zoom + cy + parY;
        if (sx < -20 || sx > width + 20 || sy < -20 || sy > height + 20) continue;
        context.globalAlpha = twinkle * (0.4 + 0.6 * focusFade);
        context.fillStyle = "#fff8e8";
        context.beginPath();
        context.arc(sx, sy, s.r, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;

      // The dash itself: a fast, accelerating scale-up anchored at dead
      // center (where the destination star and IntroCore's dot both sit),
      // easing back down to 1 once the voyage phase hands off to "core".
      if (!gentle) {
        const dashScale = 1 + easeInCubic(dashProgress) * (dashMaxScale - 1);
        const settleScale = pastVoyage
          ? 1 + (dashMaxScale - 1) * (1 - easeOutCubic(settleProgress))
          : dashScale;
        canvasEl.style.transform = `scale(${settleScale.toFixed(3)})`;
      }

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
