"use client";

import { useEffect, useRef, useState } from "react";
import { onCosmosProgress } from "@/lib/cosmosAssets";
import type { IntroCopy } from "@/lib/introConfig";

/**
 * First screen of the intro: "Войти со звуком / без звука". Browsers only
 * allow audio after a gesture, so this click is what lets the intro play
 * with sound from its first frame. While it's up, the planet textures
 * download; the thin line under the buttons is that progress.
 * Enter = with sound.
 */
export default function IntroSoundGate({
  copy,
  onChoose,
  onSkip,
}: {
  copy: IntroCopy;
  onChoose: (withSound: boolean) => void;
  onSkip: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [chosen, setChosen] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => onCosmosProgress(setProgress), []);
  useEffect(() => primaryRef.current?.focus({ preventScroll: true }), []);

  function choose(withSound: boolean) {
    if (chosen) return;
    setChosen(true);
    onChoose(withSound);
  }

  return (
    <div className={`intro-gate ${chosen ? "intro-gate--out" : ""}`}>
      <div className="intro-gate-inner">
        <button
          ref={primaryRef}
          type="button"
          data-cursor="interactive"
          className="intro-gate-primary"
          onClick={() => choose(true)}
        >
          <span className="intro-gate-eq" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          {copy.soundOn}
        </button>
        <button
          type="button"
          data-cursor="interactive"
          className="intro-gate-secondary"
          onClick={() => choose(false)}
        >
          {copy.soundOff}
        </button>
        <p className="intro-gate-note">{copy.soundNote}</p>
        <div className="intro-gate-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        {chosen && progress < 1 && (
          <p className="intro-gate-note" role="status">
            {copy.loading} {Math.round(progress * 100)}%
          </p>
        )}
      </div>
      <button type="button" data-cursor="interactive" className="intro-skip" onClick={onSkip}>
        {copy.skip} <span className="intro-skip-key" aria-hidden="true">esc</span>
      </button>
    </div>
  );
}
