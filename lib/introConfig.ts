/**
 * Shared timings/copy/colors for the boot intro (components/intro/*). Kept
 * in one place so the whole ~15 s timeline can be read (and retuned) at a
 * glance.
 */

// Bumped from "lab-terminal:intro-seen-v2" when the intro grew the deep-space
// orb flythrough (IntroOrbs/IntroStarfield) and stretched to ~15 s — the old
// key would otherwise hide the new cut from everyone who already sat through
// the previous version.
export const INTRO_STORAGE_KEY = "lab-terminal:intro-seen-v3";
export const INTRO_BOOT_HTML_CLASS = "intro-seen-boot";
/** `?intro` in the URL replays the intro even after it has been seen. */
export const INTRO_REPLAY_PARAM = "intro";

export const INTRO_COLOR = {
  core: "255, 243, 208",
  accent: "255, 197, 61",
  deep: "255, 150, 40",
};

export interface IntroTiming {
  /** Deep-space orb flythrough, camera pulling back into a starfield. */
  voyage: number;
  /** Black → glowing core dot, pulsing (ТЗ phases 0-1). */
  core: number;
  /** Orbital particles spiral out from the core and circle it (phase 2). */
  particles: number;
  /** Particles rush into the center, flash + shockwave (phase 3). */
  collapse: number;
  /** Name emerges, underline + status lines type out (phase 4). */
  logo: number;
  /** Everything revealed, floating shapes drift, parallax (phases 5-6). */
  hold: number;
  /** Logo shrinks away, overlay lifts like a curtain (phase 7). */
  exit: number;
}

// ≈15.1 s end to end. Mobile and reduced-motion run the same timeline —
// they get lighter visuals (fewer orbs/particles, no flash, slower drift),
// not a shorter cut.
export const INTRO_TIMING: IntroTiming = {
  voyage: 5200,
  core: 800,
  particles: 2600,
  collapse: 1100,
  logo: 3200,
  hold: 1300,
  exit: 900,
};

export const INTRO_PARTICLES_DESKTOP = { orbit: 12, sparks: 46 };
export const INTRO_PARTICLES_MOBILE = { orbit: 8, sparks: 20 };
export const INTRO_ORBS_DESKTOP = 7;
export const INTRO_ORBS_MOBILE = 4;
export const INTRO_STARS_DESKTOP = 160;
export const INTRO_STARS_MOBILE = 80;
export const MOBILE_BREAKPOINT_PX = 768;

/** Skip button fades in after this long (ТЗ "Skip button"). */
export const INTRO_SKIP_DELAY_MS = 1200;

export const INTRO_NAME = "ВАЛЕРИЙ";
export const INTRO_STATUS_LINE = "root@valera:~$ status --brief";
// Wording matches the <meta name="description"> in app/layout.tsx —
// deliberately not a new tagline, just the site's own line typed out.
export const INTRO_STATUS_OUTPUT =
  "9 автономных систем. 0 сотрудников. 0 облачных подписок.";
