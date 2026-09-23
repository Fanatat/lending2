"use client";

import { useEffect, useRef } from "react";
import { INTRO_DUST, INTRO_MARBLES, INTRO_T } from "@/lib/introConfig";

/**
 * Canvas half of the intro's cinematic (0 → ~10 s): a ring of painted
 * marbles spinning right around the camera, sparkle dust between them, the
 * camera pulling away until the ring is a speck, and the starfield it leaves
 * behind (which slowly pushes in under the mark, then fades out).
 *
 * Everything is a pure function of `t` (ms since `origin`), so the picture
 * can't drift from the DOM half (IntroMark) that runs on the same clock.
 */

interface MarbleStyle {
  base: string;
  bands: { color: string; from: number; to: number }[];
}

// Two-tone "painted" marbles from the reference: orange with a teal cap,
// teal/red halves, cream, slate, ochre with a teal belt, red/orange...
const MARBLE_STYLES: MarbleStyle[] = [
  { base: "#c86a2e", bands: [{ color: "#2f97a3", from: -1, to: -0.45 }] },
  { base: "#2a8893", bands: [{ color: "#b84e36", from: 0.1, to: 1 }] },
  { base: "#d9d3c1", bands: [{ color: "#c2b595", from: 0.55, to: 1 }] },
  { base: "#707275", bands: [{ color: "#8f9195", from: -1, to: -0.5 }] },
  { base: "#a98b36", bands: [{ color: "#3a8387", from: -0.35, to: 0.05 }] },
  { base: "#a3372d", bands: [{ color: "#cf7a38", from: -0.1, to: 0.5 }] },
  {
    base: "#cf7432",
    bands: [
      { color: "#2a8793", from: -0.25, to: 0.15 },
      { color: "#ad3c2e", from: 0.6, to: 1 },
    ],
  },
  { base: "#245a60", bands: [{ color: "#cfc8b3", from: -1, to: -0.55 }] },
];

const SPRITE_PX = 192;

interface Marble {
  angle: number;
  radius: number;
  z: number;
  size: number;
  soft: HTMLCanvasElement;
  sharp: HTMLCanvasElement;
  /** This frame's projection. */
  px: number;
  py: number;
  pr: number;
  depth: number;
}

interface Dust {
  angle: number;
  radius: number;
  z: number;
  /** Angular speed relative to the ring — dust shears past the marbles. */
  drift: number;
  size: number;
  alpha: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
}

function rand(seed: number) {
  // mulberry32 — deterministic, so every visit gets the same composition.
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const ramp = (t: number, from: number, to: number) => smooth((t - from) / (to - from));

/**
 * Paints one marble at a tiny resolution and upscales it: the upscale blur
 * is the reference's shallow depth of field for free (no ctx.filter, which
 * Safari lacks). `lowRes` picks how blurry.
 */
function paintMarble(style: MarbleStyle, bandTilt: number, lowRes: number) {
  const low = document.createElement("canvas");
  low.width = low.height = lowRes;
  const c = low.getContext("2d")!;
  const r = lowRes / 2;

  c.save();
  c.beginPath();
  c.arc(r, r, r * 0.94, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = style.base;
  c.fillRect(0, 0, lowRes, lowRes);

  // Bands are latitude slabs, bowed so they wrap around the ball, rotated
  // per marble so no two look alike.
  c.save();
  c.translate(r, r);
  c.rotate(bandTilt);
  for (const band of style.bands) {
    const y0 = band.from * r;
    const y1 = band.to * r;
    c.fillStyle = band.color;
    c.beginPath();
    c.moveTo(-r * 1.5, y0);
    c.quadraticCurveTo(0, y0 + r * 0.35, r * 1.5, y0);
    c.lineTo(r * 1.5, y1);
    c.quadraticCurveTo(0, y1 + r * 0.35, -r * 1.5, y1);
    c.closePath();
    c.fill();
  }
  c.restore();

  // Studio light from the upper left, deep shadow on the far side.
  const light = c.createRadialGradient(r * 0.62, r * 0.55, r * 0.05, r, r, r * 1.02);
  light.addColorStop(0, "rgba(255,255,255,0.3)");
  light.addColorStop(0.3, "rgba(255,255,255,0.04)");
  light.addColorStop(0.6, "rgba(0,0,0,0.18)");
  light.addColorStop(1, "rgba(0,0,0,0.72)");
  c.fillStyle = light;
  c.fillRect(0, 0, lowRes, lowRes);
  c.restore();

  // Upscale in ×3 steps: one big bilinear jump shows blocky seams, a few
  // small ones blur like a lens.
  let src: HTMLCanvasElement = low;
  for (let size = lowRes * 3; ; size *= 3) {
    const next = document.createElement("canvas");
    next.width = next.height = Math.min(size, SPRITE_PX);
    const o = next.getContext("2d")!;
    o.imageSmoothingEnabled = true;
    o.imageSmoothingQuality = "high";
    o.drawImage(src, 0, 0, next.width, next.height);
    src = next;
    if (next.width === SPRITE_PX) return next;
  }
}

function glowSprite(size: number, core: string, halo: string) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const c = cv.getContext("2d")!;
  const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, core);
  g.addColorStop(0.18, core);
  g.addColorStop(0.35, halo);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, size, size);
  return cv;
}

/** Dense faint star layer + Milky Way haze, painted once. */
function paintStarLayer(w: number, h: number, mobile: boolean) {
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(w);
  cv.height = Math.ceil(h);
  const c = cv.getContext("2d")!;
  const rnd = rand(7);

  // Milky Way: a faint bluish band from the lower left to the upper right,
  // passing right of center (where the reference has its haze).
  const bandFrom = { x: w * 0.05, y: h * 1.05 };
  const bandTo = { x: w * 1.05, y: h * 0.05 };
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 26; i++) {
    const k = rnd();
    const x = bandFrom.x + (bandTo.x - bandFrom.x) * k + (rnd() - 0.5) * w * 0.12 + w * 0.12;
    const y = bandFrom.y + (bandTo.y - bandFrom.y) * k + (rnd() - 0.5) * h * 0.12;
    const rr = (0.12 + rnd() * 0.18) * Math.max(w, h);
    const g = c.createRadialGradient(x, y, 0, x, y, rr);
    g.addColorStop(0, "rgba(70, 95, 150, 0.016)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }

  const count = Math.round((w * h) / (mobile ? 700 : 520));
  for (let i = 0; i < count; i++) {
    let x = rnd() * w;
    let y = rnd() * h;
    // A third of the stars crowd into the band.
    if (i % 3 === 0) {
      const k = rnd();
      x = bandFrom.x + (bandTo.x - bandFrom.x) * k + w * 0.12 + (rnd() - 0.5) * w * 0.22;
      y = bandFrom.y + (bandTo.y - bandFrom.y) * k + (rnd() - 0.5) * h * 0.22;
    }
    const b = Math.pow(rnd(), 2.4);
    const a = 0.12 + b * 0.75;
    const tint = rnd();
    c.fillStyle =
      tint < 0.2
        ? `rgba(170, 195, 255, ${a})`
        : tint < 0.3
          ? `rgba(255, 225, 200, ${a})`
          : `rgba(235, 240, 255, ${a})`;
    const s = b > 0.6 ? 1.6 : b > 0.25 ? 1.15 : 0.8;
    c.fillRect(x, y, s, s);
  }
  return cv;
}

export default function IntroCosmos({
  origin,
  mobile,
}: {
  /** performance.now() at which the intro's t = 0. */
  origin: number;
  mobile: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
    let w = 0;
    let h = 0;
    let starLayer: HTMLCanvasElement | null = null;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      // Oversized so the slow push-in never shows an edge.
      starLayer = paintStarLayer(w * 1.2, h * 1.2, mobile);
      ctx!.fillStyle = "#000";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener("resize", resize);

    const rnd = rand(42);
    const marbleCount = mobile ? INTRO_MARBLES.mobile : INTRO_MARBLES.desktop;
    const marbles: Marble[] = Array.from({ length: marbleCount }, (_, i) => {
      const style = MARBLE_STYLES[i % MARBLE_STYLES.length]!;
      const tilt = rnd() * Math.PI * 2;
      return {
        angle: (i / marbleCount) * Math.PI * 2 + (rnd() - 0.5) * 0.2,
        radius: 1 + (rnd() - 0.5) * 0.2,
        z: (rnd() - 0.5) * 0.35,
        size: 0.21 + rnd() * 0.06,
        soft: paintMarble(style, tilt, 14),
        sharp: paintMarble(style, tilt, 30),
        px: 0,
        py: 0,
        pr: 0,
        depth: 0,
      };
    });

    // Dust: a glittering spiral sheet inside the ring plus a thin halo
    // around it — the "galaxy" strands the marbles swim through.
    const dustCount = mobile ? INTRO_DUST.mobile : INTRO_DUST.desktop;
    const dust: Dust[] = Array.from({ length: dustCount }, (_, i) => {
      const kind = i % 10;
      const base = {
        drift: 0.2 + rnd() * 0.3,
        size: 0.8 + Math.pow(rnd(), 3) * 2.6,
        alpha: 0.35 + rnd() * 0.65,
      };
      if (kind < 5) {
        // The glittering strand that runs diagonally through the ring.
        const along = (rnd() * 2 - 1) * 0.95;
        const across = (rnd() + rnd() + rnd() - 1.5) * 0.09 + along * along * 0.12;
        return {
          ...base,
          drift: 0.12,
          angle: Math.atan2(across, along) + 0.7,
          radius: Math.hypot(along, across),
          z: (rnd() - 0.5) * 0.08,
        };
      }
      if (kind < 8) {
        const u = Math.pow(rnd(), 0.7);
        return {
          ...base,
          angle: (kind % 3) * ((Math.PI * 2) / 3) + u * 3.4 + (rnd() - 0.5) * 0.5,
          radius: 0.3 + u * 0.75,
          z: (rnd() - 0.5) * 0.12,
        };
      }
      return { ...base, angle: rnd() * Math.PI * 2, radius: 1.05 + rnd() * 0.3, z: (rnd() - 0.5) * 0.35 };
    });

    const stars: Star[] = [
      // The one bright blue star top-right that anchors the reference frame.
      { x: 0.33, y: -0.44, size: 1.6, phase: 0 },
      { x: 0.24, y: -0.12, size: 1.0, phase: 1.3 },
      { x: 0.31, y: -0.2, size: 0.7, phase: 2.1 },
      { x: -0.12, y: -0.36, size: 0.6, phase: 0.7 },
      { x: -0.35, y: 0.02, size: 0.55, phase: 2.6 },
      { x: 0.08, y: 0.38, size: 0.6, phase: 1.9 },
      { x: -0.26, y: 0.3, size: 0.5, phase: 3.3 },
    ];
    const starGlow = glowSprite(64, "rgba(255,255,255,1)", "rgba(140,180,255,0.18)");

    // Painter's order, re-sorted every frame (far → near).
    const drawList = marbles.slice();

    let raf = 0;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const t = now - origin;
      const W = canvas!.width;
      const H = canvas!.height;

      // --- camera ---------------------------------------------------------
      // Close and slow at first, then the pull-back accelerates hard: the
      // ring goes from filling the frame (2.5 s) to a speck (3.6 s).
      let dist: number;
      if (t < INTRO_T.ringPullback) {
        dist = 0.9 + 0.1 * smooth(t / INTRO_T.ringPullback);
      } else {
        const s = (t - INTRO_T.ringPullback) / 1000;
        dist = Math.exp(2.1 * Math.pow(s, 2.2));
      }
      const pull = ramp(t, INTRO_T.ringPullback, INTRO_T.ringGone);
      // Oblique at first (the near side of the ring looms at the bottom of
      // the frame), turning face-on as the camera backs away.
      const tilt = 0.62 - 0.4 * smooth(t / 3200);
      const roll = -0.55 + 0.25 * Math.sin(t * 0.0006);
      // Spin speeds up as it recedes: a spiral drain rather than a zoom.
      const spin = t * 0.00085 + Math.pow(pull, 1.5) * 2.4;
      // The ring's vanishing point drifts a little left and down.
      const cx = W * (0.5 - 0.06 * pull);
      const cy = H * (0.5 + 0.07 * pull);
      // Portrait screens: size the ring by width so it still frames the shot.
      const focal = Math.min(H * 0.55, W * 0.85);

      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const cosR = Math.cos(roll);
      const sinR = Math.sin(roll);

      // Fade in from black over the first beat; ring gone by ringGone.
      const master = ramp(t, 0, 500) * (1 - ramp(t, INTRO_T.ringGone - 700, INTRO_T.ringGone));
      const dustMaster = ramp(t, 0, 500) * (1 - ramp(t, INTRO_T.ringGone - 200, INTRO_T.dot - 100));

      // --- motion-blur trails ---------------------------------------------
      // Instead of clearing, paint black over the last frame: a little smear
      // while close, long streaks while the ring spirals away.
      const trail = t < INTRO_T.ringPullback ? 0.55 : 0.55 - 0.35 * Math.sin(Math.PI * pull);
      ctx!.globalCompositeOperation = "source-over";
      ctx!.globalAlpha = t > INTRO_T.dot ? 1 : trail;
      ctx!.fillStyle = "#000";
      ctx!.fillRect(0, 0, W, H);
      ctx!.globalAlpha = 1;

      // --- starfield ------------------------------------------------------
      const starsA =
        ramp(t, INTRO_T.starsIn, INTRO_T.starsFull) *
        (1 - ramp(t, INTRO_T.cosmosOut, INTRO_T.cosmosGone));
      if (starsA > 0 && starLayer) {
        const push = 1 + 0.07 * clamp01((t - INTRO_T.starsIn) / 7000);
        const lw = starLayer.width * dpr * push;
        const lh = starLayer.height * dpr * push;
        ctx!.globalAlpha = starsA;
        ctx!.drawImage(starLayer, (W - lw) / 2, (H - lh) / 2, lw, lh);
        ctx!.globalCompositeOperation = "lighter";
        for (const st of stars) {
          const tw = 0.75 + 0.25 * Math.sin(t * 0.002 + st.phase * 3);
          const size = st.size * 26 * dpr * tw;
          const x = W / 2 + st.x * H * push;
          const y = H / 2 + st.y * H * push;
          ctx!.globalAlpha = starsA * tw;
          ctx!.drawImage(starGlow, x - size / 2, y - size / 2, size, size);
        }
        ctx!.globalCompositeOperation = "source-over";
        ctx!.globalAlpha = 1;
      }

      if (master <= 0 && dustMaster <= 0) return;

      // --- dust -----------------------------------------------------------
      if (dustMaster > 0) {
        ctx!.globalCompositeOperation = "lighter";
        ctx!.fillStyle = "#e9f1ff";
        for (const d of dust) {
          const a = d.angle + spin * (1 + d.drift);
          let x = Math.cos(a) * d.radius;
          let y = Math.sin(a) * d.radius;
          // tilt about X, then roll about the view axis
          const y2 = y * cosT - d.z * sinT;
          const z2 = y * sinT + d.z * cosT;
          y = y2;
          const xr = x * cosR - y * sinR;
          const yr = x * sinR + y * cosR;
          x = xr;
          const depth = dist - z2;
          if (depth < 0.08) continue;
          const k = focal / depth;
          const sx = cx + x * k;
          const sy = cy + yr * k;
          if (sx < -4 || sy < -4 || sx > W + 4 || sy > H + 4) continue;
          const size = Math.max(0.7, d.size * dpr * Math.min(2, 1 / depth));
          ctx!.globalAlpha = d.alpha * dustMaster;
          ctx!.fillRect(sx, sy, size, size);
        }
        ctx!.globalCompositeOperation = "source-over";
        ctx!.globalAlpha = 1;
      }

      // --- marbles --------------------------------------------------------
      if (master > 0) {
        for (const m of marbles) {
          const a = m.angle + spin;
          const x = Math.cos(a) * m.radius;
          const y = Math.sin(a) * m.radius;
          const y2 = y * cosT - m.z * sinT;
          const z2 = y * sinT + m.z * cosT;
          m.depth = dist - z2;
          if (m.depth <= 0.12) continue;
          const k = focal / m.depth;
          m.px = cx + (x * cosR - y2 * sinR) * k;
          m.py = cy + (x * sinR + y2 * cosR) * k;
          m.pr = m.size * k;
        }
        drawList.sort((a, b) => b.depth - a.depth);
        for (const m of drawList) {
          const r = m.pr;
          if (m.depth <= 0.12) continue;
          if (m.px + r < 0 || m.py + r < 0 || m.px - r > W || m.py - r > H) continue;
          // Near = big = out of focus; far ones are darker (less light).
          const near = clamp01((r / H - 0.1) / 0.2);
          const shade = clamp01(1.25 - (m.depth - dist + 0.3) * 0.9);
          ctx!.globalAlpha = master * (0.3 + 0.45 * shade);
          ctx!.drawImage(near > 0.5 ? m.soft : m.sharp, m.px - r, m.py - r, r * 2, r * 2);
        }
        ctx!.globalAlpha = 1;
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [origin, mobile]);

  return <canvas ref={canvasRef} className="intro-cosmos" aria-hidden="true" />;
}
