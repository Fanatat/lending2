"use client";

/**
 * The site's mark — a bright head with three wake arcs — and its entrance
 * from the reference: a white point flies in, swells into a glowing ball,
 * then the ball shrinks into the head while the arcs unwind out of it.
 * Pure CSS transitions keyed off `stage`; IntroAnimation drives the clock.
 */

export type MarkStage = "hidden" | "ball" | "mark" | "out";

// viewBox 0 0 100 100. The head sits upper-right; the arcs are concentric
// around it and fan out behind it to the lower left, like a comet's wake.
const HEAD = { x: 68, y: 32, r: 8.5 };
const ARC_RADII = [21, 34, 47];
const ARC_FROM = 78; // degrees, SVG orientation (clockwise, y down)
const ARC_TO = 192;

function arcPath(r: number) {
  const a0 = (ARC_FROM * Math.PI) / 180;
  const a1 = (ARC_TO * Math.PI) / 180;
  const x0 = HEAD.x + r * Math.cos(a0);
  const y0 = HEAD.y + r * Math.sin(a0);
  const x1 = HEAD.x + r * Math.cos(a1);
  const y1 = HEAD.y + r * Math.sin(a1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export function MarkGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {ARC_RADII.map((r) => (
        <path
          key={r}
          d={arcPath(r)}
          fill="none"
          stroke="currentColor"
          strokeWidth={8.5}
          strokeLinecap="round"
        />
      ))}
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill="currentColor" />
    </svg>
  );
}

export default function IntroMark({ stage }: { stage: MarkStage }) {
  return (
    <div className={`intro-mark intro-mark--${stage}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="intro-mark-svg">
        {ARC_RADII.map((r, i) => (
          <path
            key={r}
            className="intro-mark-arc"
            style={{ transitionDelay: stage === "mark" ? `${120 + i * 90}ms` : "0ms" }}
            d={arcPath(r)}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth={8.5}
            strokeLinecap="round"
          />
        ))}
        {/* One circle plays both parts: the big ball (transformed into the
            middle of the box) and, untransformed, the mark's head. */}
        <circle className="intro-mark-head" cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill="currentColor" />
      </svg>
    </div>
  );
}
