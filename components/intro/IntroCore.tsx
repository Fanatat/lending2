"use client";

/**
 * The single glowing point the whole intro grows out of (ТЗ phase 1).
 * "born" fades/scales it in and pulses, "charged" keeps pulsing while its
 * halo swells as the particles spiral out, "collapse" swells it hard and
 * snuffs it out right as the particles hit it (see --intro-flash-delay).
 */
export default function IntroCore({
  stage,
}: {
  stage: "born" | "charged" | "collapse";
}) {
  return (
    <div className={`intro-core intro-core--${stage}`} aria-hidden="true">
      <div className="intro-core-halo" />
      <div className="intro-core-dot" />
    </div>
  );
}
