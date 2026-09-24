"use client";

import { useLabStore } from "@/lib/store";
import { asset } from "@/lib/site";

/**
 * Sample-based sound for the whole site: real recordings from
 * public/sounds (see public/sounds/CREDITS.md), decoded once into Web Audio
 * buffers and played through one master bus. Nothing here synthesizes a
 * tone — Web Audio is only the mixer.
 *
 * Browsers refuse to start audio before a user gesture; the intro's sound
 * gate (IntroSoundGate) is that gesture, and any later click/keypress also
 * unlocks it. Everything below is a silent no-op until then, and whenever
 * the visitor has muted the site (useLabStore.soundEnabled).
 */

export type SfxName =
  | "intro_ambient"
  | "flyby"
  | "riser"
  | "impact"
  | "shimmer"
  | "start"
  | "keys"
  | "ui_click"
  | "matrix"
  | "unicorn"
  | "alarm"
  | "egg_found"
  | "fall_whistle"
  | "thud"
  | "zap"
  | "flashlight"
  | "yelp";

/** Cues recorded as several takes — play() picks one at random. */
const VARIANTS: Partial<Record<SfxName, number>> = {
  keys: 8,
  flyby: 2,
  thud: 2,
};

/** Per-cue mix level, so call sites only pass relative tweaks. */
const LEVEL: Partial<Record<SfxName, number>> = {
  intro_ambient: 0.55,
  flyby: 0.5,
  riser: 0.55,
  impact: 0.7,
  shimmer: 0.45,
  start: 0.6,
  keys: 0.22,
  ui_click: 0.3,
  matrix: 0.5,
  unicorn: 0.45,
  alarm: 0.45,
  egg_found: 0.5,
  fall_whistle: 0.18,
  thud: 0.22,
  zap: 0.4,
  flashlight: 0.5,
  yelp: 0.2,
};

/** Minimum gap between two plays of the same cue, ms. */
const THROTTLE: Partial<Record<SfxName, number>> = {
  keys: 35,
  thud: 70,
  fall_whistle: 900,
  yelp: 1400,
  ui_click: 60,
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers = new Map<string, AudioBuffer | null>();
const loading = new Map<string, Promise<AudioBuffer | null>>();
const lastPlayed = new Map<SfxName, number>();

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  return ctx;
}

function files(name: SfxName): string[] {
  const n = VARIANTS[name];
  if (!n) return [name];
  return Array.from({ length: n }, (_, i) => `${name}_${i + 1}`);
}

function load(file: string): Promise<AudioBuffer | null> {
  const c = context();
  if (!c) return Promise.resolve(null);
  const cached = loading.get(file);
  if (cached) return cached;
  const p = fetch(asset(`/sounds/${file}.mp3`))
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then(
      (data) =>
        new Promise<AudioBuffer>((resolve, reject) => c.decodeAudioData(data, resolve, reject))
    )
    .then((buf) => {
      buffers.set(file, buf);
      return buf;
    })
    .catch(() => {
      buffers.set(file, null);
      return null;
    });
  loading.set(file, p);
  return p;
}

/** Starts fetching/decoding cues ahead of time so the first play isn't late. */
export function preloadSfx(names: SfxName[]) {
  for (const name of names) for (const f of files(name)) void load(f);
}

function enabled() {
  return useLabStore.getState().soundEnabled;
}

/** Resumes the context — call from inside a click/keydown handler. */
export function unlockAudio() {
  const c = context();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}

export function audioUnlocked() {
  return !!ctx && ctx.state === "running";
}

if (typeof window !== "undefined") {
  const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchend"];
  const handler = () => {
    unlockAudio();
    if (audioUnlocked()) events.forEach((e) => window.removeEventListener(e, handler));
  };
  events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
}

interface PlayOptions {
  /** Multiplies the cue's mix level. */
  volume?: number;
  /** Playback rate (pitch + speed together); 1 = as recorded. */
  rate?: number;
  /** Random ± spread applied to rate, e.g. 0.06 for natural variation. */
  jitter?: number;
  /** Stereo position −1..1. */
  pan?: number;
  /** Seconds to wait before starting. */
  delay?: number;
}

/** Fire-and-forget one-shot. Silently skipped while muted / locked / not yet loaded. */
export function playSfx(name: SfxName, opts: PlayOptions = {}) {
  const c = context();
  if (!c || !master || c.state !== "running" || !enabled()) return;
  const now = performance.now();
  const gap = THROTTLE[name];
  if (gap && now - (lastPlayed.get(name) ?? -1e9) < gap) return;

  const list = files(name);
  const file = list[Math.floor(Math.random() * list.length)]!;
  const buf = buffers.get(file);
  if (!buf) {
    void load(file);
    return;
  }
  lastPlayed.set(name, now);

  const src = c.createBufferSource();
  src.buffer = buf;
  const jitter = opts.jitter ?? 0;
  src.playbackRate.value = (opts.rate ?? 1) * (1 + (Math.random() * 2 - 1) * jitter);
  const gain = c.createGain();
  gain.gain.value = (LEVEL[name] ?? 0.5) * (opts.volume ?? 1);
  let node: AudioNode = src.connect(gain);
  if (opts.pan && c.createStereoPanner) {
    const panner = c.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, opts.pan));
    node = node.connect(panner);
  }
  node.connect(master);
  src.start(c.currentTime + (opts.delay ?? 0));
}

export interface LoopHandle {
  stop: (fadeSec?: number) => void;
  setVolume: (v: number, fadeSec?: number) => void;
}

/**
 * Looping bed (the intro ambience). Loops the decoded buffer natively —
 * the file itself is prepared with a crossfaded seam. Returns null if the
 * sound can't start (muted, locked, missing file).
 */
export async function playLoop(
  name: SfxName,
  { fadeIn = 2, volume = 1, offset = 0 }: { fadeIn?: number; volume?: number; offset?: number } = {}
): Promise<LoopHandle | null> {
  const c = context();
  if (!c || !master || !enabled()) return null;
  const buf = await load(files(name)[0]!);
  if (!buf || c.state !== "running") return null;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const gain = c.createGain();
  const level = (LEVEL[name] ?? 0.5) * volume;
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(level, c.currentTime + Math.max(0.05, fadeIn));
  src.connect(gain).connect(master);
  src.start(0, offset % buf.duration);
  let stopped = false;
  return {
    stop(fade = 1.2) {
      if (stopped) return;
      stopped = true;
      const t = c.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + fade);
      src.stop(t + fade + 0.05);
    },
    setVolume(v, fade = 0.6) {
      if (stopped) return;
      const t = c.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
      gain.gain.linearRampToValueAtTime(Math.max(0.0001, (LEVEL[name] ?? 0.5) * v), t + fade);
    },
  };
}

/** Master mute follows the store: fade the bus instead of cutting mid-sample. */
if (typeof window !== "undefined") {
  useLabStore.subscribe((s, prev) => {
    if (s.soundEnabled === prev.soundEnabled || !ctx || !master) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(s.soundEnabled ? 1 : 0, t + 0.25);
  });
}
