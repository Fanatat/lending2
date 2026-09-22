"use client";

/** The single glowing point the whole intro grows out of (ТЗ phase 1). */
export default function IntroCore({ visible }: { visible: boolean }) {
  return (
    <div
      className="intro-core-dot"
      style={{ opacity: visible ? undefined : 0 }}
    />
  );
}
