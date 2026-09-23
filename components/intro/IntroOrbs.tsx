"use client";

import type { CSSProperties } from "react";

interface OrbSpec {
  top: string;
  left: string;
  size: number;
  tone: "amber" | "copper" | "cream" | "slate" | "azure";
  /** Fraction of the voyage duration this orb's entrance/recede spans. */
  durationFrac: number;
  /** Fraction of the voyage duration before this orb starts (stagger). */
  delayFrac: number;
  /** Resting drift once "in frame", px. */
  driftX: number;
  driftY: number;
}

// A small, deliberately varied set — five planets, five distinct colors
// (amber/copper/cream/slate/azure), no two alike — reads as our own solar
// system rather than a generic asteroid field. All finish receding by
// ~60% of the voyage, leaving the back stretch clear for the Milky Way,
// constellations and the dash into a star (see IntroStarfield).
const ORB_PRESETS: OrbSpec[] = [
  { top: "22%", left: "18%", size: 320, tone: "amber", durationFrac: 0.52, delayFrac: 0, driftX: 26, driftY: -18 },
  { top: "68%", left: "78%", size: 230, tone: "copper", durationFrac: 0.48, delayFrac: 0.05, driftX: -20, driftY: 22 },
  { top: "16%", left: "74%", size: 180, tone: "cream", durationFrac: 0.44, delayFrac: 0.1, driftX: 16, driftY: 14 },
  { top: "76%", left: "22%", size: 210, tone: "slate", durationFrac: 0.5, delayFrac: 0.04, driftX: -14, driftY: -20 },
  { top: "44%", left: "90%", size: 160, tone: "azure", durationFrac: 0.42, delayFrac: 0.14, driftX: -18, driftY: -10 },
];

interface IntroOrbsProps {
  count: number;
  durationMs: number;
  gentle: boolean;
}

/**
 * Deep-space orb flythrough (ТЗ voyage phase, ahead of the original
 * core/particles phases): a handful of glossy spheres drift into frame, hold
 * a moment, then recede toward the viewport's own vanishing point and shrink
 * to nothing — mounted only while `phase === "voyage"` in IntroAnimation, so
 * it never re-triggers. --cx/--cy (px→vw/vh vector from each orb's resting
 * position to screen center) are computed here since only the caller knows
 * each orb's base position; the shared @keyframes just reads them.
 */
export default function IntroOrbs({ count, durationMs, gentle }: IntroOrbsProps) {
  const orbs = ORB_PRESETS.slice(0, count);

  return (
    <div className="intro-orbs" aria-hidden="true">
      {orbs.map((o) => {
        const topPct = parseFloat(o.top);
        const leftPct = parseFloat(o.left);
        const style = {
          top: o.top,
          left: o.left,
          width: o.size,
          height: o.size,
          animationDuration: `${Math.round(durationMs * o.durationFrac)}ms`,
          animationDelay: `${Math.round(durationMs * o.delayFrac)}ms`,
          "--cx": `${(50 - leftPct).toFixed(1)}vw`,
          "--cy": `${(50 - topPct).toFixed(1)}vh`,
          "--dx": `${o.driftX}px`,
          "--dy": `${o.driftY}px`,
        } as CSSProperties;
        return (
          <span
            key={`${o.top}-${o.left}`}
            className={`intro-orb intro-orb--${o.tone}${gentle ? " intro-orb--gentle" : ""}`}
            style={style}
          />
        );
      })}
      {!gentle && (
        <>
          <span
            className="intro-orb-streak intro-orb-streak--a"
            style={{ animationDuration: `${durationMs}ms` }}
          />
          <span
            className="intro-orb-streak intro-orb-streak--b"
            style={{ animationDuration: `${durationMs}ms` }}
          />
        </>
      )}
    </div>
  );
}
