"use client";

import { useIntroStore } from "@/lib/introStore";

/** Footer link that plays the whole intro again — the planet parade included. */
export default function IntroReplayButton({ label }: { label: string }) {
  const replay = useIntroStore((s) => s.replay);
  return (
    <button
      type="button"
      data-cursor="interactive"
      onClick={replay}
      className="underline underline-offset-2 hover:text-accent"
    >
      {label}
    </button>
  );
}
