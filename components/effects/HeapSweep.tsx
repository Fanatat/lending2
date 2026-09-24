"use client";

import { useBridgeStore } from "@/lib/bridgeStore";
import { playSfx } from "@/lib/sfx";

function runnersWord(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "бегун";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "бегуна";
  return "бегунов";
}

/** Footer line under the heap CrowdFall builds — only there while it exists. */
export default function HeapSweep() {
  const landed = useBridgeStore((s) => s.landed);
  const sweep = useBridgeStore((s) => s.sweep);
  if (landed === 0) return null;
  return (
    <p className="mt-3 text-[10px] text-fg-muted">
      На дне страницы: {landed} {runnersWord(landed)} с моста.{" "}
      <button
        type="button"
        data-cursor="interactive"
        onClick={() => {
          playSfx("flyby", { volume: 0.5, rate: 1.4 });
          sweep();
        }}
        className="text-accent underline-offset-2 hover:underline"
      >
        разгрести завал
      </button>
    </p>
  );
}
