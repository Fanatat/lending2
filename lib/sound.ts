"use client";

/**
 * Minimal Web Audio synth for the Hero typing effect — a short, dry,
 * mechanical click rather than a soft "Apple keyboard" tone. No audio file,
 * no licensing question. AudioContext is created lazily and resumed on the
 * first user gesture, per browser autoplay policy — sound genuinely cannot
 * play before that regardless of what this module does.
 */

let ctx: AudioContext | null = null;
let unlocked = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtor) return null;
  if (!ctx) ctx = new AudioCtor();
  return ctx;
}

function unlockOnGesture() {
  if (unlocked) return;
  const c = getContext();
  if (c && c.state === "suspended") {
    c.resume().catch(() => {});
  }
  unlocked = true;
}

if (typeof window !== "undefined") {
  const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown"];
  const handler = () => {
    unlockOnGesture();
    events.forEach((e) => window.removeEventListener(e, handler));
  };
  events.forEach((e) => window.addEventListener(e, handler, { once: true }));
}

/** A single dry mechanical "key click" — square-wave blip with a fast decay. */
export function playTypingClick(volume = 0.05) {
  const c = getContext();
  if (!c || c.state !== "running") return;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.value = 1400 + Math.random() * 400;

  const now = c.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.02);
}
