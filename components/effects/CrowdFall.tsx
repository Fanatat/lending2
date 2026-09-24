"use client";

import { useEffect, useRef } from "react";
import { drainFalls, useBridgeStore } from "@/lib/bridgeStore";
import { useLabStore } from "@/lib/store";
import { playSfx } from "@/lib/sfx";

/**
 * The runners that trip through the broken "Мост" pipe: each one falls the
 * whole length of the landing — past every section below — and piles up at
 * the very bottom of the page into a heap that keeps growing while the
 * bridge stays broken.
 *
 * World space is the document, measured upwards from the page's bottom edge
 * (y = 0 is the floor). That way the heap stays glued to the bottom even
 * when the page above it changes height (СИСТЕМА 04 folding away, fonts
 * loading), and the canvas itself is just a fixed viewport-sized window onto
 * that world, redrawn with the current scroll offset.
 *
 * Physics: circles with gravity + terminal velocity, a spatial hash for
 * contacts, strong contact friction and sleeping — resting bodies freeze in
 * place, which is what lets the pile keep a slope instead of flowing flat.
 * The pointer shoves bodies around (and wakes them).
 */

const GRAVITY = 1500; // px/s²
const TERMINAL = 1100; // px/s
const MAX_BODIES = 420;
const CELL = 16;
const STEP = 1 / 120;
const SLEEP_SPEED = 14;
const SLEEP_AFTER = 0.3;
const POKE_RADIUS = 34;
const HEAP_EGG_AT = 60;

const YELLS = ["а-а-а!", "ой", "ipv6!!", "мама", "аа", "эээ"];

interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  va: number;
  r: number;
  asleep: boolean;
  still: number;
  landed: boolean;
  unicorn: boolean;
  yell: string | null;
  /** 1 → 0 while being swept away. */
  fade: number | null;
  seed: number;
}

function rnd(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function drawFigure(
  c: CanvasRenderingContext2D,
  b: Body,
  t: number,
  color: string
) {
  const s = b.r / 5.2;
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 1.35;
  c.lineCap = "round";
  c.lineJoin = "round";

  // Mid-air: arms up and windmilling, legs kicking. On the heap: a limp,
  // per-body sprawl so the pile doesn't look like one sprite repeated.
  let armL: number, armR: number, legL: number, legR: number;
  if (!b.landed) {
    const k = t * 22 + b.seed * 10;
    armL = -2.5 + Math.sin(k) * 0.6;
    armR = 2.5 + Math.sin(k + 1.7) * 0.6;
    legL = 0.35 + Math.sin(k * 0.9) * 0.45;
    legR = -0.35 + Math.sin(k * 0.9 + 2) * 0.45;
  } else {
    armL = -1.2 - b.seed * 1.4;
    armR = 1.0 + ((b.seed * 7) % 1) * 1.6;
    legL = 0.2 + ((b.seed * 13) % 1) * 0.7;
    legR = -0.25 - ((b.seed * 5) % 1) * 0.7;
  }

  const limb = (x: number, y: number, ang: number, len: number) => {
    c.moveTo(x, y);
    c.lineTo(x + Math.sin(ang) * len, y + Math.cos(ang) * len);
  };

  c.beginPath();
  c.moveTo(0, -2.6 * s);
  c.lineTo(0, 1.4 * s);
  limb(0, -1.8 * s, armL, 3 * s);
  limb(0, -1.8 * s, armR, 3 * s);
  limb(0, 1.4 * s, legL, 3.4 * s);
  limb(0, 1.4 * s, legR, 3.4 * s);
  c.stroke();
  c.beginPath();
  c.arc(0, -4.3 * s, 1.65 * s, 0, Math.PI * 2);
  c.fill();
}

export default function CrowdFall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepToken = useBridgeStore((s) => s.sweepToken);
  const sweepRef = useRef(sweepToken);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bodies: Body[] = [];
    const grid = new Map<number, Body[]>();
    let nextId = 1;
    let vw = 0;
    let vh = 0;
    let dpr = 1;
    let pageW = 0;
    let pageH = 0;
    let accent = "#ffc53d";
    let accentCheckedAt = 0;
    let lastDrawnScroll = -1;
    let dirty = true;
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    let landedCount = 0;
    let eggFired = false;
    const pointer = { x: -1e4, y: -1e4, dx: 0, dy: 0, at: 0 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas!.width = Math.round(vw * dpr);
      canvas!.height = Math.round(vh * dpr);
      dirty = true;
    }
    resize();
    window.addEventListener("resize", resize);

    function onPointerMove(e: PointerEvent) {
      pointer.dx = e.clientX - pointer.x;
      pointer.dy = e.clientY - pointer.y;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.at = performance.now();
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const key = (cx: number, cy: number) => cx * 73856093 + cy * 19349663;

    function rebuildGrid() {
      grid.clear();
      for (const b of bodies) {
        if (b.fade !== null) continue;
        const k = key(Math.floor(b.x / CELL), Math.floor(b.y / CELL));
        const cell = grid.get(k);
        if (cell) cell.push(b);
        else grid.set(k, [b]);
      }
    }

    function spawn(xv: number, yv: number, unicorn: boolean) {
      if (bodies.length >= MAX_BODIES) return;
      const b: Body = {
        id: nextId++,
        x: xv + window.scrollX,
        y: pageH - (yv + window.scrollY),
        vx: rnd(-70, 70),
        vy: rnd(60, 160),
        a: 0,
        va: rnd(-7, 7),
        r: rnd(4.6, 6.2),
        asleep: false,
        still: 0,
        landed: false,
        unicorn,
        yell: Math.random() < 0.35 ? YELLS[Math.floor(Math.random() * YELLS.length)]! : null,
        fade: null,
        seed: Math.random(),
      };
      bodies.push(b);
      const pan = (xv / vw) * 2 - 1;
      if (b.yell) playSfx("yelp", { pan, jitter: 0.12 });
      playSfx("fall_whistle", { pan, jitter: 0.05 });
    }

    function land(b: Body) {
      if (b.landed) return;
      b.landed = true;
      b.yell = null;
      landedCount++;
      useBridgeStore.getState().addLanded();
      const sy = pageH - b.y - window.scrollY;
      if (sy > -20 && sy < vh + 20) playSfx("thud", { jitter: 0.15, pan: (b.x / vw) * 2 - 1 });
      if (!eggFired && landedCount >= HEAP_EGG_AT) {
        eggFired = true;
        useLabStore.getState().markFound("heap");
      }
    }

    function step(dt: number) {
      rebuildGrid();
      const poking = performance.now() - pointer.at < 60;
      const px = pointer.x + window.scrollX;
      const py = pageH - (pointer.y + window.scrollY);

      for (const b of bodies) {
        if (b.fade !== null) {
          b.vy -= GRAVITY * 0.4 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.a += b.va * dt;
          b.fade -= dt / 1.1;
          continue;
        }

        if (poking) {
          const dx = b.x - px;
          const dy = b.y - py;
          const d = Math.hypot(dx, dy);
          if (d < POKE_RADIUS && d > 0.01) {
            const push = (1 - d / POKE_RADIUS) * 420;
            b.vx += (dx / d) * push + pointer.dx * 6;
            b.vy += (dy / d) * push - pointer.dy * 6;
            b.va += rnd(-8, 8);
            b.asleep = false;
            b.still = 0;
          }
        }
        if (b.asleep) continue;

        b.vy = Math.max(b.vy - GRAVITY * dt, -TERMINAL);
        b.vx *= 1 - 0.25 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.a += b.va * dt;

        let contact = false;
        if (b.y < b.r) {
          b.y = b.r;
          if (b.vy < 0) b.vy = -b.vy * 0.18;
          b.vx *= 0.82;
          contact = true;
        }
        if (b.x < b.r) {
          b.x = b.r;
          b.vx = Math.abs(b.vx) * 0.3;
        } else if (b.x > pageW - b.r) {
          b.x = pageW - b.r;
          b.vx = -Math.abs(b.vx) * 0.3;
        }

        // Only bodies near the floor can touch anything — skip the lookup
        // for the ones still dropping through the page.
        const cx = Math.floor(b.x / CELL);
        const cy = Math.floor(b.y / CELL);
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const cell = grid.get(key(cx + ox, cy + oy));
            if (!cell) continue;
            for (const o of cell) {
              if (o === b) continue;
              const dx = b.x - o.x;
              const dy = b.y - o.y;
              const min = b.r + o.r;
              const d2 = dx * dx + dy * dy;
              if (d2 >= min * min || d2 < 1e-6) continue;
              const d = Math.sqrt(d2);
              const nx = dx / d;
              const ny = dy / d;
              const overlap = min - d;
              const share = o.asleep ? 1 : 0.5;
              b.x += nx * overlap * share;
              b.y += ny * overlap * share;
              if (!o.asleep) {
                o.x -= nx * overlap * 0.5;
                o.y -= ny * overlap * 0.5;
              }
              const ovx = o.asleep ? 0 : o.vx;
              const ovy = o.asleep ? 0 : o.vy;
              const rvx = b.vx - ovx;
              const rvy = b.vy - ovy;
              const vn = rvx * nx + rvy * ny;
              if (vn < 0) {
                const j = -(1.12 * vn) * share;
                b.vx += nx * j;
                b.vy += ny * j;
                if (!o.asleep) {
                  o.vx -= nx * j;
                  o.vy -= ny * j;
                }
              }
              // Friction: bleed off sliding along the contact — this is
              // what makes the pile hold a slope.
              const tx = -ny;
              const ty = nx;
              const vt = (b.vx - ovx) * tx + (b.vy - ovy) * ty;
              b.vx -= tx * vt * 0.35 * share * 2;
              b.vy -= ty * vt * 0.35 * share * 2;
              if (ny > 0.2) contact = true;
              if (o.landed) land(b);
            }
          }
        }

        if (contact) {
          land(b);
          b.va += ((-b.vx / b.r) - b.va) * 0.2;
          const speed = Math.hypot(b.vx, b.vy);
          if (speed < SLEEP_SPEED) {
            b.still += dt;
            if (b.still > SLEEP_AFTER) {
              b.asleep = true;
              b.vx = b.vy = b.va = 0;
            }
          } else b.still = 0;
        } else {
          b.still = 0;
        }
      }

      for (let i = bodies.length - 1; i >= 0; i--) {
        const f = bodies[i]!.fade;
        if (f !== null && f <= 0) bodies.splice(i, 1);
      }
    }

    function draw(t: number) {
      const c = ctx!;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, vw, vh);
      if (!bodies.length) return;
      const now = performance.now();
      if (now - accentCheckedAt > 500) {
        accentCheckedAt = now;
        accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || accent;
      }
      const sx0 = window.scrollX;
      const sy0 = window.scrollY;
      c.font = "9px ui-monospace, monospace";
      for (const b of bodies) {
        const x = b.x - sx0;
        const y = pageH - b.y - sy0;
        if (y < -30 || y > vh + 30 || x < -30 || x > vw + 30) continue;
        const color = b.unicorn ? `hsl(${(t * 0.3 + b.id * 37) % 360} 95% 65%)` : accent;
        c.globalAlpha = b.fade === null ? 1 : Math.max(0, b.fade);
        c.save();
        c.translate(x, y);
        c.rotate(-b.a);
        drawFigure(c, b, t / 1000, color);
        c.restore();
        if (b.yell && !b.landed) {
          c.globalAlpha = 0.75;
          c.fillStyle = color;
          c.fillText(b.yell, x + 7, y - 9);
        }
      }
      c.globalAlpha = 1;
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dtReal = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const falls = drainFalls();
        if (falls.length) {
          pageH = document.documentElement.scrollHeight;
          pageW = document.documentElement.clientWidth;
        }
        for (const f of falls) spawn(f.x, f.y, f.unicorn);
      } else drainFalls();

      if (useBridgeStore.getState().sweepToken !== sweepRef.current) {
        sweepRef.current = useBridgeStore.getState().sweepToken;
        for (const b of bodies) {
          b.fade = 1;
          b.asleep = false;
          b.vx = rnd(-500, 500);
          b.vy = rnd(300, 900);
          b.va = rnd(-14, 14);
        }
        landedCount = 0;
      }

      if (!bodies.length) {
        if (lastDrawnScroll !== -2) {
          draw(now);
          lastDrawnScroll = -2;
        }
        return;
      }

      pageH = document.documentElement.scrollHeight;
      pageW = document.documentElement.clientWidth;
      const moving = bodies.some((b) => !b.asleep) || now - pointer.at < 200;
      if (moving) {
        acc += dtReal;
        let n = 0;
        while (acc >= STEP && n < 6) {
          step(STEP);
          acc -= STEP;
          n++;
        }
        if (n === 6) acc = 0;
      }
      const scrollKey = window.scrollY * 7 + window.scrollX + pageH * 0.001;
      const animated = moving || bodies.some((b) => b.unicorn);
      if (animated || dirty || scrollKey !== lastDrawnScroll) {
        draw(now);
        lastDrawnScroll = scrollKey;
        dirty = false;
      }
    }
    raf = requestAnimationFrame(frame);

    // Leaving Matrix mode folds the bridge away and mends its pipe (see
    // BridgeDiagram); runners still in mid-air fade out rather than keep
    // falling and yelling from a section that's no longer there. The heap
    // already on the floor stays — it has its own sweep button.
    const unsubMatrix = useLabStore.subscribe((s, prev) => {
      if (s.matrixMode || !prev.matrixMode) return;
      for (const b of bodies) {
        if (b.landed || b.fade !== null) continue;
        b.fade = 0.6;
        b.yell = null;
      }
    });

    return () => {
      unsubMatrix();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 h-full w-full"
    />
  );
}
