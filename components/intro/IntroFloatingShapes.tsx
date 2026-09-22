"use client";

const SHAPES = [
  { top: "16%", left: "16%", size: 420, delay: "0s", duration: "22s" },
  { top: "58%", left: "66%", size: 520, delay: "-7s", duration: "27s" },
  { top: "72%", left: "18%", size: 320, delay: "-13s", duration: "19s" },
];

/** Slow blurred drift behind the revealed logo (ТЗ phase 5), CSS-only. */
export default function IntroFloatingShapes({ visible }: { visible: boolean }) {
  return (
    <div
      className={
        visible ? "intro-shapes intro-shapes--visible" : "intro-shapes"
      }
      aria-hidden="true"
    >
      {SHAPES.map((s) => (
        <div
          key={s.top + s.left}
          className="intro-shape decorative-loop"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}
