"use client";

// `depth` scales the mouse parallax (--mx/--my set by IntroAnimation):
// bigger, blurrier shapes read as further away, so they move less.
const SHAPES = [
  { top: "12%", left: "10%", size: 460, depth: 0.5, delay: "0s", duration: "22s" },
  { top: "55%", left: "62%", size: 560, depth: 0.35, delay: "-7s", duration: "27s" },
  { top: "68%", left: "14%", size: 340, depth: 0.8, delay: "-13s", duration: "19s" },
  { top: "8%", left: "64%", size: 280, depth: 1, delay: "-4s", duration: "17s" },
];

/** Slow blurred drift behind the revealed name (ТЗ phase 5), CSS-only. */
export default function IntroFloatingShapes({ visible }: { visible: boolean }) {
  return (
    <div
      className={visible ? "intro-shapes intro-shapes--visible" : "intro-shapes"}
      aria-hidden="true"
    >
      {SHAPES.map((s) => (
        <div
          key={s.top + s.left}
          className="intro-shape-parallax"
          style={{ top: s.top, left: s.left, ["--depth" as string]: s.depth }}
        >
          <div
            className="intro-shape decorative-loop"
            style={{
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        </div>
      ))}
    </div>
  );
}
