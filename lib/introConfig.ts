/**
 * Shared timeline/copy for the boot intro (components/intro/*). Every number
 * is "ms since the intro started" (the clock starts when the visitor picks
 * sound on/off on the gate screen, see IntroSoundGate):
 *
 *   0.0 s  planet parade: the camera glides outward along the aligned
 *          planets — Earth and the Moon, Mars, Jupiter, Saturn pass close by
 *   4.2 s  the camera cranes up and back: the whole parade in one line,
 *          from the Sun's glare to Neptune
 *   5.8 s  it pulls away until the parade is lost among the stars
 *   7.8 s  fade to black
 *   8.5 s  teal nebula light, then the planet sphere
 *  11.0 s  footer, 12.2 s heading, 13.4 s the "Начать" button
 *
 * After that the intro waits for the visitor: the sphere keeps turning
 * until "Начать" is pressed.
 *
 * The old logo reveal (point → ball → mark) is still in the code but off
 * (INTRO_SHOW_MARK); switched on, it plays after the pull-back and pushes
 * everything from "fade to black" MARK_BEAT_MS later.
 */

export const INTRO_SHOW_MARK = false;
const MARK_BEAT_MS = 4000;
const mk = INTRO_SHOW_MARK ? MARK_BEAT_MS : 0;

export const INTRO_T = {
  /** Camera cranes up: the aligned parade in one shot. */
  reveal: 4200,
  /** Camera pulls away into the starfield. */
  pullback: 5800,
  /** White point appears, swells to a ball (mark on only). */
  dot: 7200,
  /** Ball unwinds into the mark (mark on only). */
  mark: 7800,
  /** Parade (+ mark) fade to black. */
  cosmosOut: 7800 + mk,
  cosmosGone: 8500 + mk,
  /** Nebula light fades in over black. */
  nebula: 8500 + mk,
  nebulaFull: 9900 + mk,
  /** Planet sphere fades in. */
  sphere: 9500 + mk,
  sphereFull: 11200 + mk,
  /** Footer, then heading, then button. */
  chrome: 11000 + mk,
  title: 12200 + mk,
  button: 13400 + mk,
};

/** "Начать" → screen blooms into the planet, then the site shows through. */
export const INTRO_EXIT_MS = 1500;
/** Skip / Esc during the cinematic — a quick fade straight to the site. */
export const INTRO_SKIP_EXIT_MS = 650;
/** Skip button fades in after this long. */
export const INTRO_SKIP_DELAY_MS = 1200;

export const MOBILE_BREAKPOINT_PX = 768;

/** Space-dust motes around the camera path (desktop / mobile) — they sell the speed. */
export const INTRO_DUST = { desktop: 700, mobile: 300 };

/** Intro text per locale — the intro sits in the root layout, so /en gets it too. */
export const INTRO_COPY = {
  ru: {
    title: "Добро пожаловать к Валере!",
    cta: "Начать",
    legal: "Продолжая, вы увидите нечто.",
    skip: "Пропустить",
    soundOn: "Войти со звуком",
    soundOff: "без звука",
    soundNote: "Лучше в наушниках",
    loading: "загрузка",
  },
  en: {
    title: "Welcome — Valery here!",
    cta: "Start",
    legal: "Carry on and you'll see something.",
    skip: "Skip",
    soundOn: "Enter with sound",
    soundOff: "without sound",
    soundNote: "Headphones recommended",
    loading: "loading",
  },
};

export type IntroCopy = (typeof INTRO_COPY)["ru"];
