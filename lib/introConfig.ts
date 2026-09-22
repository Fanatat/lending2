/**
 * Shared timings/copy/colors for the boot intro (components/intro/*). Kept
 * in one place because the desktop/mobile/reduced-motion variants need to
 * stay comparable at a glance, and the terminal-boot copy here is the one
 * spot it's written out (reused by IntroLogo).
 */

export const INTRO_STORAGE_KEY = "lab-terminal:intro-seen";
export const INTRO_BOOT_HTML_CLASS = "intro-seen-boot";

export const INTRO_COLOR = {
  glowStrong: "rgba(255, 197, 61, 0.85)",
  glowSoft: "rgba(255, 197, 61, 0.35)",
  particleBright: "rgba(255, 197, 61, 0.8)",
  particleMid: "rgba(255, 197, 61, 0.45)",
  particleDim: "rgba(255, 197, 61, 0.18)",
};

export interface IntroTiming {
  /** Core dot fade/scale-in. */
  core: number;
  /** Orbital particles (0 = phase skipped, e.g. mobile). */
  particles: number;
  /** Particles rushing to center + flash (0 = phase skipped). */
  collapse: number;
  /** Terminal boot lines + name reveal. */
  logo: number;
  /** Pause on the fully-revealed logo before auto-exit. */
  hold: number;
  /** Overlay exit / curtain-up. */
  exit: number;
}

export const INTRO_TIMING_DESKTOP: IntroTiming = {
  core: 800,
  particles: 1300,
  collapse: 650,
  logo: 1500,
  hold: 1550,
  exit: 850,
};

// Mobile skips the canvas particle phases entirely (perf + ТЗ recommendation).
export const INTRO_TIMING_MOBILE: IntroTiming = {
  core: 450,
  particles: 0,
  collapse: 0,
  logo: 1300,
  hold: 950,
  exit: 600,
};

export const INTRO_TIMING_REDUCED: IntroTiming = {
  core: 0,
  particles: 0,
  collapse: 0,
  logo: 0,
  hold: 900,
  exit: 350,
};

export const INTRO_PARTICLE_COUNT = 11;
export const MOBILE_BREAKPOINT_PX = 768;

export const INTRO_BOOT_LINE = "root@valera:~$ whoami";
export const INTRO_NAME = "ВАЛЕРА";
export const INTRO_STATUS_LINE = "root@valera:~$ status --brief";
// Wording matches the <meta name="description"> in app/layout.tsx —
// deliberately not a new tagline, just the site's own line typed out.
export const INTRO_STATUS_OUTPUT =
  "9 автономных систем. 0 сотрудников. 0 облачных подписок.";
