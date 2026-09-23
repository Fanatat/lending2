"use client";

import { useEffect, useRef } from "react";
import { INTRO_DUST, INTRO_T } from "@/lib/introConfig";

/**
 * Canvas half of the intro's cinematic: the eight planets of the Solar
 * System paraded in a ring spinning right around the camera, sparkle dust
 * between them, the
 * camera pulling away until the ring is a speck, and the starfield it leaves
 * behind (which slowly pushes in under the mark, then fades out).
 *
 * Everything is a pure function of `t` (ms since `origin`), so the picture
 * can't drift from the DOM half (IntroMark) that runs on the same clock.
 */

type PlanetName =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

// The eight planets in order from the Sun. `size` is the disk radius in
// ring units — not to scale, just enough that Jupiter reads as the giant
// and Mercury as the pebble. `tilt` rotates the painted bands/axis.
const PLANETS: { name: PlanetName; size: number; tilt: number }[] = [
  { name: "mercury", size: 0.25, tilt: 0.1 },
  { name: "venus", size: 0.35, tilt: -0.05 },
  { name: "earth", size: 0.37, tilt: 0.4 },
  { name: "mars", size: 0.3, tilt: 0.45 },
  { name: "jupiter", size: 0.6, tilt: 0.05 },
  { name: "saturn", size: 0.48, tilt: 0.45 },
  { name: "uranus", size: 0.4, tilt: 1.45 },
  { name: "neptune", size: 0.39, tilt: 0.5 },
];

/**
 * The planets' diameters add up to more than the ring's circumference by
 * this factor, so neighbours always overlap each other.
 */
const PLANET_CROWDING = 1.18;

/** Sprite size for a plain disk; Saturn's is wider to fit the rings. */
const SPRITE_PX = 288;
const DISK_EXTENT = 1.1;
const SATURN_EXTENT = 2.3;

interface Planet {
  angle: number;
  radius: number;
  z: number;
  size: number;
  /** Sprite width / disk diameter. */
  extent: number;
  soft: HTMLCanvasElement;
  sharp: HTMLCanvasElement;
  /** Black silhouettes of the sprites — dims a planet without seeing through it. */
  softShade: HTMLCanvasElement;
  sharpShade: HTMLCanvasElement;
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
  /** Angular speed relative to the ring — dust shears past the planets. */
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

/** Latitude band between sin-latitudes s0 < s1 (−1 south … 1 north). */
function band(c: CanvasRenderingContext2D, r: number, s0: number, s1: number, color: string) {
  c.fillStyle = color;
  c.fillRect(-r * 1.5, -s1 * r, r * 3, (s1 - s0) * r);
}

function blob(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  rot = 0
) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fill();
}

/** Stack of belts from pole to pole, cycling through `colors`. */
function belts(c: CanvasRenderingContext2D, r: number, colors: string[], min: number, max: number, rnd: () => number) {
  let s = -1.05;
  let i = 0;
  while (s < 1.05) {
    const h = min + rnd() * (max - min);
    band(c, r, s, s + h, colors[i++ % colors.length]!);
    s += h;
  }
}

/**
 * Surface texture in a disk of radius r around the origin (already clipped).
 * Soft edges come from ctx.filter where the browser has it; without it
 * (older Safari) the bands are just crisper.
 */
function paintSurface(c: CanvasRenderingContext2D, name: PlanetName, r: number, rnd: () => number) {
  const blur = (k: number) => (c.filter = `blur(${(r * k).toFixed(1)}px)`);
  const fill = (color: string) => {
    c.fillStyle = color;
    c.fillRect(-r * 1.5, -r * 1.5, r * 3, r * 3);
  };
  switch (name) {
    case "mercury": {
      fill("#8e8780");
      // Broad darker plains, then a scatter of small craters.
      blur(0.08);
      for (let i = 0; i < 8; i++) {
        blob(c, (rnd() * 2 - 1) * r, (rnd() * 2 - 1) * r, r * (0.2 + rnd() * 0.3), r * (0.15 + rnd() * 0.25), "rgba(80,74,68,0.3)", rnd() * 3);
      }
      blur(0.008);
      for (let i = 0; i < 160; i++) {
        const cr = r * (0.012 + Math.pow(rnd(), 4) * 0.08);
        const x = (rnd() * 2 - 1) * r;
        const y = (rnd() * 2 - 1) * r;
        blob(c, x, y, cr, cr, rnd() < 0.6 ? "rgba(58,54,50,0.28)" : "rgba(205,199,190,0.25)");
      }
      break;
    }
    case "venus": {
      fill("#d9ba84");
      blur(0.07);
      for (let i = 0; i < 12; i++) {
        const s = rnd() * 2 - 1;
        band(c, r, s, s + 0.08 + rnd() * 0.18, rnd() < 0.5 ? "rgba(240,220,170,0.55)" : "rgba(170,126,72,0.35)");
      }
      break;
    }
    case "earth": {
      fill("#17427f");
      blur(0.015);
      // Continents: clusters of overlapping blobs, green fading to desert.
      for (let k = 0; k < 4; k++) {
        const cx = (rnd() * 1.5 - 0.75) * r;
        const cy = (rnd() * 1.1 - 0.55) * r;
        for (let i = 0; i < 10; i++) {
          blob(
            c,
            cx + (rnd() - 0.5) * r * 0.6,
            cy + (rnd() - 0.5) * r * 0.55,
            r * (0.07 + rnd() * 0.15),
            r * (0.05 + rnd() * 0.12),
            ["#355f2c", "#46733a", "#3b6a33", "#2f5a2a", "#4f7a3c", "#7d6a3a"][Math.floor(rnd() * 6)]!,
            rnd() * 3
          );
        }
      }
      blur(0.03);
      band(c, r, 0.9, 1.1, "#eef2f5");
      band(c, r, -1.1, -0.92, "#eef2f5");
      // Cloud streaks.
      for (let i = 0; i < 14; i++) {
        blob(
          c,
          (rnd() * 2 - 1) * r,
          (rnd() * 2 - 1) * r * 0.85,
          r * (0.14 + rnd() * 0.3),
          r * (0.02 + rnd() * 0.045),
          "rgba(255,255,255,0.55)",
          (rnd() - 0.5) * 0.5
        );
      }
      break;
    }
    case "mars": {
      fill("#b5552f");
      blur(0.05);
      for (let i = 0; i < 16; i++) {
        blob(
          c,
          (rnd() * 2 - 1) * r,
          (rnd() * 2 - 1) * r,
          r * (0.1 + rnd() * 0.3),
          r * (0.05 + rnd() * 0.14),
          rnd() < 0.55 ? "rgba(105,45,24,0.55)" : "rgba(218,138,90,0.45)",
          rnd() * 3
        );
      }
      blur(0.02);
      band(c, r, 0.9, 1.1, "rgba(242,238,232,0.92)");
      break;
    }
    case "jupiter": {
      fill("#d6bf98");
      blur(0.02);
      belts(c, r, ["#e8dac1", "#b8834f", "#dbc39c", "#9f633a", "#eee2cc", "#c48f63", "#8c5836", "#d4b58e"], 0.06, 0.16, rnd);
      // Great Red Spot, in the southern belt.
      blob(c, r * 0.3, r * 0.34, r * 0.2, r * 0.1, "#b0503a");
      blob(c, r * 0.3, r * 0.34, r * 0.12, r * 0.055, "#c9704f");
      break;
    }
    case "saturn": {
      fill("#d8c28e");
      blur(0.03);
      belts(c, r, ["#e5d4a6", "#cdb07b", "#dec893", "#bb9d68", "#eadcb4"], 0.1, 0.22, rnd);
      break;
    }
    case "uranus": {
      fill("#a2d5da");
      blur(0.09);
      band(c, r, 0.5, 1.1, "rgba(205,238,240,0.5)");
      band(c, r, -0.15, 0.12, "rgba(128,188,196,0.35)");
      break;
    }
    case "neptune": {
      fill("#3659c6");
      blur(0.05);
      band(c, r, 0.25, 0.5, "rgba(72,112,218,0.6)");
      band(c, r, -0.65, -0.4, "rgba(34,60,150,0.6)");
      blob(c, -r * 0.25, r * 0.3, r * 0.16, r * 0.08, "#213a8c");
      blob(c, -r * 0.05, r * 0.17, r * 0.2, r * 0.025, "rgba(235,240,255,0.7)");
      blob(c, r * 0.3, -r * 0.35, r * 0.18, r * 0.02, "rgba(235,240,255,0.6)");
      break;
    }
  }
  c.filter = "none";
}

/** Saturn's rings, far half (behind the disk) or near half (in front). */
function paintRings(c: CanvasRenderingContext2D, r: number, half: "far" | "near") {
  const rings: [number, number, string][] = [
    [1.24, 1.5, "rgba(186,166,128,0.55)"],
    [1.53, 1.95, "rgba(226,208,168,0.88)"],
    [2.0, 2.2, "rgba(200,182,142,0.6)"],
  ];
  c.save();
  c.scale(1, 0.28);
  c.beginPath();
  if (half === "far") c.rect(-r * 3, -r * 3, r * 6, r * 3);
  else c.rect(-r * 3, 0, r * 6, r * 3);
  c.clip();
  for (const [inner, outer, color] of rings) {
    c.fillStyle = color;
    c.beginPath();
    c.arc(0, 0, r * outer, 0, Math.PI * 2);
    c.arc(0, 0, r * inner, 0, Math.PI * 2, true);
    c.fill();
  }
  c.restore();
}

function silhouette(src: HTMLCanvasElement) {
  const cv = document.createElement("canvas");
  cv.width = src.width;
  cv.height = src.height;
  const c = cv.getContext("2d")!;
  c.drawImage(src, 0, 0);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = "#000";
  c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

/**
 * Paints one planet: textured disk turned to its axial tilt, sunlight from
 * the upper left with a soft terminator, an atmosphere rim for Earth and
 * rings for Saturn. Also returns a lens-blurred copy (down to a thumbnail
 * and back up in ×3 steps — the reference's shallow depth of field) for the
 * planets passing right in front of the camera.
 */
function paintPlanet(name: PlanetName, tilt: number, seed: number) {
  const extent = name === "saturn" ? SATURN_EXTENT : DISK_EXTENT;
  const S = Math.round((SPRITE_PX * extent) / DISK_EXTENT);
  const r = S / 2 / extent;
  const rnd = rand(seed);
  const sharp = document.createElement("canvas");
  sharp.width = sharp.height = S;
  const c = sharp.getContext("2d")!;

  c.translate(S / 2, S / 2);
  c.rotate(tilt);
  if (name === "saturn") paintRings(c, r, "far");

  c.save();
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.clip();
  c.save();
  paintSurface(c, name, r, rnd);
  c.restore();
  // Lighting is fixed to the screen, not to the planet's axis.
  c.rotate(-tilt);
  const light = c.createRadialGradient(-r * 0.45, -r * 0.45, r * 0.05, -r * 0.2, -r * 0.2, r * 1.45);
  light.addColorStop(0, "rgba(255,255,255,0.16)");
  light.addColorStop(0.28, "rgba(0,0,0,0)");
  light.addColorStop(0.55, "rgba(0,0,0,0.45)");
  light.addColorStop(0.78, "rgba(0,0,0,0.88)");
  light.addColorStop(1, "rgba(0,0,0,0.96)");
  c.fillStyle = light;
  c.fillRect(-r, -r, r * 2, r * 2);
  const limb = c.createRadialGradient(0, 0, r * 0.75, 0, 0, r);
  limb.addColorStop(0, "rgba(0,0,0,0)");
  limb.addColorStop(1, "rgba(0,0,0,0.3)");
  c.fillStyle = limb;
  c.fillRect(-r, -r, r * 2, r * 2);
  c.restore();

  if (name === "earth") {
    c.save();
    c.rotate(-tilt);
    const atm = c.createRadialGradient(-r * 0.1, -r * 0.1, r * 0.92, 0, 0, r * 1.09);
    atm.addColorStop(0, "rgba(120,175,255,0.4)");
    atm.addColorStop(1, "rgba(120,175,255,0)");
    c.fillStyle = atm;
    c.beginPath();
    c.arc(0, 0, r * 1.09, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  if (name === "saturn") paintRings(c, r, "near");

  const tiny = document.createElement("canvas");
  tiny.width = tiny.height = Math.round(S / 9);
  tiny.getContext("2d")!.drawImage(sharp, 0, 0, tiny.width, tiny.height);
  let soft: HTMLCanvasElement = tiny;
  for (let size = tiny.width * 3; soft.width < S; size *= 3) {
    const next = document.createElement("canvas");
    next.width = next.height = Math.min(size, S);
    const o = next.getContext("2d")!;
    o.imageSmoothingEnabled = true;
    o.imageSmoothingQuality = "high";
    o.drawImage(soft, 0, 0, next.width, next.height);
    soft = next;
  }
  return { sharp, soft, extent, sharpShade: silhouette(sharp), softShade: silhouette(soft) };
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
    // Planets sit shoulder to shoulder along the ring (each gap sized by the
    // two neighbours' radii) and alternate above/below the ring plane, so
    // as the ring turns they slide over and behind one another.
    const span = PLANETS.reduce((sum, p) => sum + p.size * 2, 0);
    const scale = (Math.PI * 2 * PLANET_CROWDING) / span;
    let along = 0;
    const planets: Planet[] = PLANETS.map((def, i) => {
      const next = PLANETS[(i + 1) % PLANETS.length]!;
      const angle = (along / span) * Math.PI * 2;
      along += def.size + next.size;
      return {
        angle,
        radius: 1 + (i % 2 ? 0.07 : -0.05),
        z: (i % 2 ? 0.16 : -0.12) + (rnd() - 0.5) * 0.06,
        size: def.size * scale,
        ...paintPlanet(def.name, def.tilt, 100 + i),
        px: 0,
        py: 0,
        pr: 0,
        depth: 0,
      };
    });

    // Dust: a glittering spiral sheet inside the ring plus a thin halo
    // around it — the "galaxy" strands the planets swim through.
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

    // Painter's order. Neighbours overlap (PLANET_CROWDING) and keep passing
    // through equal depth as the ring turns, so a plain depth sort flips
    // which one is on top several times while they overlap. Instead, a pair
    // that overlaps on screen keeps the stacking it had when it first
    // touched; only pairs that are apart (where order is invisible) follow
    // depth. above[i][j]: 1 = i over j, -1 = j over i, 0 = not overlapping.
    const above = planets.map(() => planets.map(() => 0));
    const drawList: Planet[] = [];

    /** Is `from` already stacked over `to` through a chain of kept pairs? */
    function over(from: number, to: number, seen = new Set<number>()): boolean {
      seen.add(from);
      const row = above[from]!;
      for (let k = 0; k < row.length; k++) {
        if (row[k] !== 1 || seen.has(k)) continue;
        if (k === to || over(k, to, seen)) return true;
      }
      return false;
    }

    /** Fills drawList (bottom → top) with this frame's on-screen planets (pr > 0). */
    function sortPlanets() {
      const n = planets.length;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = planets[i]!;
          const b = planets[j]!;
          const touching =
            a.pr > 0 &&
            b.pr > 0 &&
            Math.hypot(a.px - b.px, a.py - b.py) < a.pr * a.extent + b.pr * b.extent;
          if (!touching) above[i]![j] = above[j]![i] = 0;
          else if (above[i]![j] === 0) {
            // A new contact follows depth unless the pairs already kept
            // stack one over the other — then it agrees with them, so the
            // kept pairs never form a loop no painter's order can draw
            // (it happens once the receding ring shrinks into one clump).
            const iOver = over(i, j) || (!over(j, i) && a.depth < b.depth);
            above[i]![j] = iOver ? 1 : -1;
            above[j]![i] = -above[i]![j]!;
          }
        }
      }
      // Topological order over the kept pairs, farthest first among the
      // planets nothing still has to go under. The pairs can't loop (see
      // above); the farthest-remaining fallback is only a safety net.
      drawList.length = 0;
      const left = planets.map((_, i) => i).filter((i) => planets[i]!.pr > 0);
      while (left.length) {
        let pick = -1;
        let fallback = -1;
        for (const i of left) {
          const deeper = fallback < 0 || planets[i]!.depth > planets[fallback]!.depth;
          if (deeper) fallback = i;
          const free = left.every((j) => above[j]![i] !== -1);
          if (free && (pick < 0 || planets[i]!.depth > planets[pick]!.depth)) pick = i;
        }
        const next = pick < 0 ? fallback : pick;
        drawList.push(planets[next]!);
        left.splice(left.indexOf(next), 1);
      }
    }

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

      // --- planets --------------------------------------------------------
      if (master > 0) {
        for (const m of planets) {
          const a = m.angle + spin;
          const x = Math.cos(a) * m.radius;
          const y = Math.sin(a) * m.radius;
          const y2 = y * cosT - m.z * sinT;
          const z2 = y * sinT + m.z * cosT;
          m.depth = dist - z2;
          m.pr = 0;
          if (m.depth <= 0.12) continue;
          const k = focal / m.depth;
          m.px = cx + (x * cosR - y2 * sinR) * k;
          m.py = cy + (x * sinR + y2 * cosR) * k;
          m.pr = m.size * k;
          const r = m.pr * m.extent;
          if (m.px + r < 0 || m.py + r < 0 || m.px - r > W || m.py - r > H) m.pr = 0;
        }
        sortPlanets();
        for (const m of drawList) {
          const r = m.pr * m.extent;
          // Only a planet looming right at the lens goes out of focus; the
          // far side of the ring gets less light. Dimming paints the black
          // silhouette over the planet, so overlaps stay solid.
          const soft = m.pr / H > 0.42;
          const shade = clamp01(1.25 - (m.depth - dist + 0.3) * 0.9);
          const x = m.px - r;
          const y = m.py - r;
          ctx!.globalAlpha = master;
          ctx!.drawImage(soft ? m.soft : m.sharp, x, y, r * 2, r * 2);
          ctx!.globalAlpha = master * (0.5 - 0.4 * shade);
          ctx!.drawImage(soft ? m.softShade : m.sharpShade, x, y, r * 2, r * 2);
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
