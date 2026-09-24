/**
 * Where the site lives. Defaults describe the Vercel deployment; the GitHub
 * Pages build (see next.config.mjs and .github/workflows/pages.yml) serves
 * it from a sub-path, so both values arrive through the environment.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vanatat.vercel.app";

export const GITHUB_URL = "https://github.com/Fanatat";
export const TELEGRAM_URL = "https://t.me/fanatat";
export const MAX_URL = "https://max.ru/se14158141_bot";

/** Prefix a file from /public for code paths Next doesn't rewrite itself (fetch, three.js loaders). */
export function asset(path: string) {
  return `${BASE_PATH}${path}`;
}

/**
 * metadataBase must be the bare origin: Next already prefixes basePath onto
 * some metadata URLs, so a base with a path would double it. Metadata URLs
 * are written with asset() instead.
 */
export const SITE_ORIGIN = new URL(SITE_URL).origin;

export const OG_IMAGE = {
  url: asset("/og.png"),
  width: 1200,
  height: 630,
  alt: "Привет от Валеры — восемь автономных систем, 2 000 руб./мес",
};
