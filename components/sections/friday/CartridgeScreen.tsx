"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion";

/**
 * The "screen" inside each Friday cartridge: a tiny, looping rendition of
 * the game's own mechanic, drawn on a canvas — the word search finding
 * words, the nonogram filling in, flasks being sorted (colour *and* shape,
 * as in the game), two armies meeting on three lanes, cards flying to the
 * foundation. Colours come from the theme tokens, so Matrix mode recolours
 * them too. Paused while off-screen; reduced motion gets a still frame.
 */

interface Palette {
  accent: string;
  fg: string;
  muted: string;
  line: string;
  panel: string;
}

type Scene = (g: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette) => void;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// --- Словоход: word search ------------------------------------------------
const WS_GRID = ["СЛОВХ", "АТЫОО", "ИГРАД", "КОТЕН"];
const WS_WORDS: [number, number][][] = [
  [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]], // СЛОВО
  [[2, 0], [2, 1], [2, 2], [2, 3]], // ИГРА
  [[0, 4], [1, 4], [2, 4]], // ХОД
  [[3, 0], [3, 1], [3, 2]], // КОТ
];
const WS_STEP = 0.22;
const WS_WORD = 1.7;

const wordSearch: Scene = (g, w, h, t, p) => {
  const cycle = WS_WORDS.length * WS_WORD + 1.4;
  const tt = t % cycle;
  const rows = WS_GRID.length;
  const cols = WS_GRID[0]!.length;
  const cell = Math.min((w * 0.8) / cols, (h * 0.84) / rows);
  const ox = (w - cell * cols) / 2;
  const oy = (h - cell * rows) / 2;
  const center = (r: number, c: number) => [ox + (c + 0.5) * cell, oy + (r + 0.5) * cell] as const;

  // found words: soft capsules behind the letters
  WS_WORDS.forEach((path, i) => {
    const local = tt - i * WS_WORD;
    if (local < 0) return;
    const shown = Math.min(path.length, Math.floor(local / WS_STEP) + 1);
    g.strokeStyle = p.accent;
    g.globalAlpha = local > path.length * WS_STEP ? 0.35 : 0.8;
    g.lineWidth = cell * 0.72;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    for (let k = 0; k < shown; k++) {
      const [x, y] = center(path[k]![0], path[k]![1]);
      if (k === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    if (shown === 1) g.lineTo(center(path[0]![0], path[0]![1])[0] + 0.01, center(path[0]![0], path[0]![1])[1]);
    g.stroke();
  });
  g.globalAlpha = 1;
  g.font = `600 ${Math.round(cell * 0.46)}px ui-monospace, monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const [x, y] = center(r, c);
      g.fillStyle = p.fg;
      g.fillText(WS_GRID[r]![c]!, x, y + 1);
    }
};

// --- Картинки по числам: nonogram -----------------------------------------
const NG = [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."];
function clues(line: string) {
  const out: number[] = [];
  let run = 0;
  for (const ch of line) {
    if (ch === "X") run++;
    else if (run) {
      out.push(run);
      run = 0;
    }
  }
  if (run) out.push(run);
  return out;
}
const NG_ROWS = NG.map(clues);
const NG_COLS = NG[0]!.split("").map((_, c) => clues(NG.map((r) => r[c]).join("")));
const NG_ORDER: [number, number][] = [];
NG.forEach((row, r) => row.split("").forEach((_, c) => NG_ORDER.push([r, c])));

const nonogram: Scene = (g, w, h, t, p) => {
  const step = 0.12;
  const cycle = NG_ORDER.length * step + 1.8;
  const tt = t % cycle;
  const n = NG.length;
  const cell = Math.min((w * 0.6) / (n + 1.6), (h * 0.86) / (n + 1.6));
  const ox = (w - cell * (n + 1.6)) / 2 + cell * 1.6;
  const oy = (h - cell * (n + 1.6)) / 2 + cell * 1.6;
  g.font = `${Math.round(cell * 0.42)}px ui-monospace, monospace`;
  g.textBaseline = "middle";
  g.fillStyle = p.muted;
  g.textAlign = "right";
  NG_ROWS.forEach((cl, r) => g.fillText(cl.join(" "), ox - cell * 0.25, oy + (r + 0.5) * cell));
  g.textAlign = "center";
  NG_COLS.forEach((cl, c) =>
    cl.forEach((v, k) => g.fillText(String(v), ox + (c + 0.5) * cell, oy - cell * 0.35 - (cl.length - 1 - k) * cell * 0.45))
  );
  const done = Math.floor(tt / step);
  const solved = done >= NG_ORDER.length;
  NG_ORDER.forEach(([r, c], i) => {
    const x = ox + c * cell;
    const y = oy + r * cell;
    if (i < done) {
      if (NG[r]![c] === "X") {
        g.fillStyle = p.accent;
        g.globalAlpha = solved ? 0.75 + 0.25 * Math.sin(tt * 6) : 1;
        g.fillRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
        g.globalAlpha = 1;
      } else {
        g.strokeStyle = p.muted;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x + cell * 0.32, y + cell * 0.32);
        g.lineTo(x + cell * 0.68, y + cell * 0.68);
        g.moveTo(x + cell * 0.68, y + cell * 0.32);
        g.lineTo(x + cell * 0.32, y + cell * 0.68);
        g.stroke();
      }
    }
  });
  g.strokeStyle = p.line;
  g.lineWidth = 1;
  for (let i = 0; i <= n; i++) {
    g.beginPath();
    g.moveTo(ox + i * cell, oy);
    g.lineTo(ox + i * cell, oy + n * cell);
    g.moveTo(ox, oy + i * cell);
    g.lineTo(ox + n * cell, oy + i * cell);
    g.stroke();
  }
};

// --- Color Sort: flasks, colour + shape -----------------------------------
type Tubes = number[][];
const CS_START: Tubes = [[0, 1, 2], [1, 2, 0], [2, 0, 1], []];
const CS_CAP = 3;

/** Shortest solve, found once by BFS — the loop always shows a legal game. */
const CS_MOVES: [number, number][] = (() => {
  const key = (s: Tubes) => s.map((x) => x.join("")).join("|");
  const solved = (s: Tubes) => s.every((x) => x.length === 0 || (x.length === CS_CAP && x.every((v) => v === x[0])));
  const seen = new Set([key(CS_START)]);
  let frontier: { s: Tubes; path: [number, number][] }[] = [{ s: CS_START, path: [] }];
  while (frontier.length) {
    const next: typeof frontier = [];
    for (const { s, path } of frontier) {
      if (solved(s)) return path;
      for (let a = 0; a < s.length; a++)
        for (let b = 0; b < s.length; b++) {
          const from = s[a]!;
          const to = s[b]!;
          if (a === b || !from.length || to.length >= CS_CAP) continue;
          const top = from[from.length - 1]!;
          if (to.length && to[to.length - 1] !== top) continue;
          const ns = s.map((x) => x.slice());
          ns[b]!.push(ns[a]!.pop()!);
          const k = key(ns);
          if (seen.has(k)) continue;
          seen.add(k);
          next.push({ s: ns, path: [...path, [a, b]] });
        }
    }
    frontier = next;
  }
  return [];
})();

function drawToken(g: CanvasRenderingContext2D, kind: number, x: number, y: number, r: number, color: string, ink: string) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  // the shape mark — why a colour-blind player sorts on equal terms
  g.fillStyle = ink;
  const m = r * 0.45;
  g.beginPath();
  if (kind === 0) g.arc(x, y, m * 0.8, 0, Math.PI * 2);
  else if (kind === 1) g.rect(x - m * 0.75, y - m * 0.75, m * 1.5, m * 1.5);
  else {
    g.moveTo(x, y - m);
    g.lineTo(x + m * 0.95, y + m * 0.7);
    g.lineTo(x - m * 0.95, y + m * 0.7);
  }
  g.fill();
}

const colorSort: Scene = (g, w, h, t, p) => {
  const moveT = 0.8;
  const cycle = CS_MOVES.length * moveT + 1.6;
  const tt = t % cycle;
  const colors = [p.accent, "#5dc8ff", "#ff6b8b"];
  const state: Tubes = CS_START.map((x) => x.slice());
  const idx = Math.min(CS_MOVES.length, Math.floor(tt / moveT));
  for (let i = 0; i < idx; i++) {
    const [a, b] = CS_MOVES[i]!;
    state[b]!.push(state[a]!.pop()!);
  }
  const tubes = state.length;
  const tw = Math.min(w * 0.13, (h * 0.88) / 3.9);
  const th = tw * 3.3;
  const gap = (w - tubes * tw) / (tubes + 1);
  const baseY = (h + tw * 3.9) / 2;
  const r = tw * 0.36;
  const tubeX = (i: number) => gap + i * (tw + gap);
  const slotY = (k: number) => baseY - tw * 0.55 - k * tw * 0.95;

  let flying: { kind: number; x: number; y: number } | null = null;
  if (idx < CS_MOVES.length) {
    const [a, b] = CS_MOVES[idx]!;
    const k = (tt - idx * moveT) / moveT;
    const kind = state[a]!.pop()!;
    const x0 = tubeX(a) + tw / 2;
    const x1 = tubeX(b) + tw / 2;
    const y0 = slotY(state[a]!.length);
    const y1 = slotY(state[b]!.length);
    const top = baseY - th - r * 1.6;
    let x: number;
    let y: number;
    if (k < 0.3) {
      x = x0;
      y = y0 + (top - y0) * ease(k / 0.3);
    } else if (k < 0.7) {
      x = x0 + (x1 - x0) * ease((k - 0.3) / 0.4);
      y = top;
    } else {
      x = x1;
      y = top + (y1 - top) * ease((k - 0.7) / 0.3);
    }
    flying = { kind, x, y };
  }
  state.forEach((balls, i) => {
    const x = tubeX(i);
    g.strokeStyle = p.muted;
    g.lineWidth = 1.5;
    roundRect(g, x, baseY - th, tw, th, tw / 2);
    g.stroke();
    balls.forEach((kind, k) => drawToken(g, kind, x + tw / 2, slotY(k), r, colors[kind]!, p.panel));
  });
  if (flying) drawToken(g, flying.kind, flying.x, flying.y, r, colors[flying.kind]!, p.panel);
};

// --- Lane Battler: three lanes, two armies ----------------------------------
const laneBattler: Scene = (g, w, h, t, p) => {
  const lanes = 3;
  const top = h * 0.1;
  const laneH = (h * 0.8) / lanes;
  const left = w * 0.1;
  const right = w * 0.9;
  g.fillStyle = p.accent;
  g.fillRect(left - 8, top, 6, laneH * lanes);
  g.fillStyle = "#ff6b6b";
  g.fillRect(right + 2, top, 6, laneH * lanes);
  for (let l = 0; l < lanes; l++) {
    const y = top + (l + 0.5) * laneH;
    g.strokeStyle = p.line;
    g.setLineDash([3, 4]);
    g.beginPath();
    g.moveTo(left, y);
    g.lineTo(right, y);
    g.stroke();
    g.setLineDash([]);

    const period = 3.2 + l * 0.45;
    const tt = (t + l * 1.1) % period;
    const meetT = 1.3;
    const fightT = 0.7;
    const meetX = left + (right - left) * (0.42 + 0.16 * ((l * 7) % 3) / 2);
    const winnerLeft = (Math.floor((t + l * 1.1) / period) + l) % 2 === 0;
    const size = Math.min(laneH * 0.42, 14);
    const drawUnit = (x: number, mine: boolean, hp: number, alpha: number) => {
      g.globalAlpha = alpha;
      g.fillStyle = mine ? p.accent : "#ff6b6b";
      if (mine) g.fillRect(x - size / 2, y - size / 2, size, size);
      else {
        g.beginPath();
        g.moveTo(x, y - size / 2);
        g.lineTo(x + size / 2, y + size / 2);
        g.lineTo(x - size / 2, y + size / 2);
        g.fill();
      }
      g.fillStyle = p.muted;
      g.fillRect(x - size / 2, y - size / 2 - 5, size, 2);
      g.fillStyle = mine ? p.accent : "#ff6b6b";
      g.fillRect(x - size / 2, y - size / 2 - 5, size * hp, 2);
      g.globalAlpha = 1;
    };
    if (tt < meetT) {
      const k = ease(tt / meetT);
      drawUnit(left + (meetX - size - left) * k, true, 1, 1);
      drawUnit(right - (right - meetX - size) * k, false, 1, 1);
    } else if (tt < meetT + fightT) {
      const k = (tt - meetT) / fightT;
      const jig = Math.sin(k * 40) * 2;
      drawUnit(meetX - size + jig, true, winnerLeft ? 1 - k * 0.4 : 1 - k, winnerLeft ? 1 : 1 - k * 0.8);
      drawUnit(meetX + size - jig, false, winnerLeft ? 1 - k : 1 - k * 0.4, winnerLeft ? 1 - k * 0.8 : 1);
      g.strokeStyle = p.fg;
      g.globalAlpha = 0.8 * (1 - k);
      g.beginPath();
      for (let s = 0; s < 5; s++) {
        const a = s * 1.3 + k * 9;
        g.moveTo(meetX, y);
        g.lineTo(meetX + Math.cos(a) * size * 1.3, y + Math.sin(a) * size * 1.3);
      }
      g.stroke();
      g.globalAlpha = 1;
    } else {
      const k = ease((tt - meetT - fightT) / (period - meetT - fightT));
      if (winnerLeft) drawUnit(meetX - size + (right - meetX) * k, true, 0.6, 1 - Math.max(0, k - 0.8) * 5);
      else drawUnit(meetX + size - (meetX - left) * k, false, 0.6, 1 - Math.max(0, k - 0.8) * 5);
    }
  }
};

// --- Royal Solitaire: cards to the foundation -------------------------------
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5"];
const solitaire: Scene = (g, w, h, t, p) => {
  const cols = 5;
  const rowGap = h * 0.06;
  const cw = Math.min(w * 0.13, (h * 0.86 - rowGap) / (2.36 * 1.4));
  const ch = cw * 1.4;
  const gap = (w - cols * cw) / (cols + 1);
  const topY = (h - (ch * 2.36 + rowGap)) / 2;
  const tableY = topY + ch + rowGap;
  const per = 0.9;
  const cycle = cols * per + 1.4;
  const tt = t % cycle;
  const moved = Math.min(cols, Math.floor(tt / per));
  const foundationX = w - gap - cw;

  const card = (x: number, y: number, faceUp: boolean, i: number, lift = 0) => {
    g.save();
    g.translate(x + cw / 2, y + ch / 2);
    g.rotate(lift * 0.25);
    g.scale(1 + lift * 0.12, 1 + lift * 0.12);
    g.shadowColor = "rgba(0,0,0,0.5)";
    g.shadowBlur = 4 + lift * 10;
    g.shadowOffsetY = 2 + lift * 6;
    roundRect(g, -cw / 2, -ch / 2, cw, ch, 4);
    g.fillStyle = faceUp ? "#f3efe4" : p.panel;
    g.fill();
    g.shadowColor = "transparent";
    g.strokeStyle = faceUp ? "rgba(0,0,0,0.25)" : p.accent;
    g.lineWidth = 1;
    g.stroke();
    if (faceUp) {
      const suit = SUITS[i % 4]!;
      g.fillStyle = suit === "♥" || suit === "♦" ? "#c62f3a" : "#1b1b1b";
      g.font = `600 ${Math.round(cw * 0.3)}px ui-sans-serif, system-ui`;
      g.textAlign = "left";
      g.textBaseline = "top";
      g.fillText(RANKS[i % RANKS.length]!, -cw / 2 + 3, -ch / 2 + 2);
      g.font = `${Math.round(cw * 0.5)}px ui-sans-serif, system-ui`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(suit, 0, ch * 0.08);
    } else {
      g.strokeStyle = p.line;
      roundRect(g, -cw / 2 + 3, -ch / 2 + 3, cw - 6, ch - 6, 3);
      g.stroke();
    }
    g.restore();
  };

  // foundation slot + cards already there
  g.strokeStyle = p.muted;
  g.setLineDash([3, 3]);
  roundRect(g, foundationX, topY, cw, ch, 4);
  g.stroke();
  g.setLineDash([]);
  for (let i = 0; i < moved; i++) card(foundationX, topY, true, i);

  for (let c = 0; c < cols; c++) {
    const x = gap + c * (cw + gap);
    const hidden = Math.min(c, 2);
    for (let k = 0; k < hidden; k++) card(x, tableY + k * ch * 0.18, false, 0);
    const faceY = tableY + hidden * ch * 0.18;
    if (c > moved) card(x, faceY, true, c);
    else if (c === moved) {
      const k = ease((tt - moved * per) / (per * 0.85));
      const fx = x + (foundationX - x) * k;
      const fy = faceY + (topY - faceY) * k - Math.sin(k * Math.PI) * h * 0.12;
      card(fx, fy, true, c, Math.sin(k * Math.PI));
    }
  }
};

const SCENES: Record<string, Scene> = {
  slovohod: wordSearch,
  nonograms: nonogram,
  "color-sort": colorSort,
  "lane-battler": laneBattler,
  "royal-solitaire": solitaire,
};

function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    accent: v("--accent", "#ffc53d"),
    fg: v("--fg-primary", "#e8e8e8"),
    muted: v("--fg-muted", "#7a7a7a"),
    line: v("--line", "rgba(255,255,255,0.12)"),
    panel: v("--bg-panel", "#101012"),
  };
}

export default function CartridgeScreen({ slug, offset = 0 }: { slug: string; offset?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const scene = SCENES[slug];
    if (!canvas || !scene) return;
    const g = canvas.getContext("2d");
    if (!g) return;
    let raf = 0;
    let visible = false;
    let palette = readPalette();
    let paletteAt = 0;
    const t0 = performance.now() - offset;

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas!.getBoundingClientRect();
      canvas!.width = Math.max(1, Math.round(r.width * dpr));
      canvas!.height = Math.max(1, Math.round(r.height * dpr));
      g!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      if (now - paletteAt > 1000) {
        palette = readPalette();
        paletteAt = now;
      }
      const r = canvas!.getBoundingClientRect();
      g!.clearRect(0, 0, r.width, r.height);
      // reduced motion: a still frame from late in the loop, where there's something to see
      scene!(g!, r.width, r.height, reducedMotion ? 6.5 : (now - t0) / 1000, palette);
    }

    function loop(now: number) {
      draw(now);
      if (visible && !reducedMotion) raf = requestAnimationFrame(loop);
    }

    size();
    const ro = new ResizeObserver(() => {
      size();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    draw(performance.now());

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [slug, offset, reducedMotion]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
