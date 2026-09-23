/**
 * Shared timeline/copy for the boot intro (components/intro/*). The timeline
 * follows the reference recording (reference.mp4 in the project root) beat
 * for beat, so every number here is "ms since the intro started" and can be
 * checked against the video:
 *
 *   0.0 s  the eight planets spin in a ring right around the camera
 *   2.7 s  the ring recedes, spiralling, into a starfield
 *   4.4 s  a white point flies in and swells into a glowing ball
 *   5.0 s  the ball unwinds into the mark (dot + wake arcs)
 *   9.4 s  mark and stars fade to black
 *  10.9 s  teal nebula light, then the planet sphere
 *  13.4 s  footer, 14.6 s heading, 15.8 s the "Начать" button
 *
 * After that the intro waits for the visitor (like the reference): the
 * sphere keeps turning until "Начать" is pressed.
 *
 * While the mark is switched off (INTRO_SHOW_MARK) its beat is cut out:
 * everything from "stars fade to black" on comes MARK_BEAT_MS earlier.
 */

/**
 * The logo reveal (point → ball → mark) stays in the code but is off
 * until the logo is approved.
 */
export const INTRO_SHOW_MARK = false;
const MARK_BEAT_MS = 4000;
const cut = INTRO_SHOW_MARK ? 0 : MARK_BEAT_MS;

export const INTRO_T = {
  /** Camera starts pulling away from the planet ring. */
  ringPullback: 2500,
  /** Ring has shrunk to a sparkle cloud; spheres are gone. */
  ringGone: 3900,
  /** Starfield fade-in window. */
  starsIn: 2900,
  starsFull: 3900,
  /** White point appears, swells to a ball. */
  dot: 4400,
  /** Ball unwinds into the mark. */
  mark: 5000,
  /** Mark + stars fade to black. */
  cosmosOut: 9400 - cut,
  cosmosGone: 10200 - cut,
  /** Nebula light fades in over black. */
  nebula: 10900 - cut,
  nebulaFull: 12300 - cut,
  /** Planet sphere fades in. */
  sphere: 11900 - cut,
  sphereFull: 13600 - cut,
  /** Footer, then heading, then button. */
  chrome: 13400 - cut,
  title: 14600 - cut,
  button: 15800 - cut,
};

/** "Начать" → screen blooms into the planet, then the site shows through. */
export const INTRO_EXIT_MS = 1500;
/** Skip / Esc during the cinematic — a quick fade straight to the site. */
export const INTRO_SKIP_EXIT_MS = 650;
/** Skip button fades in after this long. */
export const INTRO_SKIP_DELAY_MS = 1200;

export const MOBILE_BREAKPOINT_PX = 768;

/** Sparkle dust density around the planet ring (desktop / mobile). */
export const INTRO_DUST = { desktop: 900, mobile: 420 };

export const INTRO_TITLE = "Добро пожаловать к Валере!";
export const INTRO_CTA = "Начать";
