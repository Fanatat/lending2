/**
 * Shared timings/copy/colors for the boot intro (components/intro/*). Kept
 * in one place so the whole ~10 s timeline can be read (and retuned) at a
 * glance.
 */

// Bumped from "lab-terminal:intro-seen" when the intro was rebuilt to the
// full ~10 s cut — the old key would otherwise hide the new version from
// everyone who already sat through the short one.
export const INTRO_STORAGE_KEY = "lab-terminal:intro-seen-v2";
export const INTRO_BOOT_HTML_CLASS = "intro-seen-boot";
/** `?intro` in the URL replays the intro even after it has been seen. */
export const INTRO_REPLAY_PARAM = "intro";

export const INTRO_COLOR = {
  core: "255, 243, 208",
  accent: "255, 197, 61",
  deep: "255, 150, 40",
};

export interface IntroTiming {
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

// ≈10.5 s end to end. Mobile and reduced-motion run the same timeline —
// they get lighter visuals (fewer particles / no flash, slower orbits),
// not a shorter cut.
export const INTRO_TIMING: IntroTiming = {
  core: 1300,
  particles: 2900,
  collapse: 1100,
  logo: 2900,
  hold: 1300,
  exit: 1100,
};

export const INTRO_PARTICLES_DESKTOP = { orbit: 12, sparks: 46 };
export const INTRO_PARTICLES_MOBILE = { orbit: 8, sparks: 20 };
export const MOBILE_BREAKPOINT_PX = 768;

/** Skip button fades in after this long (ТЗ "Skip button"). */
export const INTRO_SKIP_DELAY_MS = 1200;

export const INTRO_NAME = "ВАЛЕРИЙ";
export const INTRO_STATUS_LINE = "root@valera:~$ status --brief";
// Wording matches the <meta name="description"> in app/layout.tsx —
// deliberately not a new tagline, just the site's own line typed out.
export const INTRO_STATUS_OUTPUT =
  "9 автономных систем. 0 сотрудников. 0 облачных подписок.";
