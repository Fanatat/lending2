/**
 * Base path for the selected deployment. GitHub Pages can serve a static
 * export from a sub-path; regular Next.js hosting uses the root by default.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * The one address search engines and link previews should use, whichever
 * deployment served the page. Pages serves directories
 * with a trailing slash and redirects without one, so canonical paths carry
 * it too — a canonical that itself redirects is worse than none. Metadata
 * URLs are written out in full with it, so Next's basePath handling never
 * touches them.
 */
export const CANONICAL_ORIGIN =
  process.env.NEXT_PUBLIC_CANONICAL_ORIGIN ?? "https://vanatat.ru";

export const GITHUB_URL = "https://github.com/Fanatat";
export const SITE_REPO_URL = `${GITHUB_URL}/lending2`;
export const TELEGRAM_URL = "https://t.me/fanatat";
export const MAX_URL = "https://max.ru/se14158141_bot";

/**
 * Where the contact form in the closing section posts its JSON
 * (n8n behind the server's proxy). Override with NEXT_PUBLIC_LEAD_URL at
 * build time — e.g. a local mock while testing.
 */
export const LEAD_URL =
  process.env.NEXT_PUBLIC_LEAD_URL ?? "https://api.vanatat.ru/site/lead";

/**
 * Yandex Metrica counter of this site (not the games' one — their data
 * must not mix with the site's). 0 keeps Metrica off; put the counter
 * number here once it's created for vanatat.ru.
 */
export const YANDEX_METRIKA_ID: number = 0;

/** Prefix a file from /public for code paths Next doesn't rewrite itself (fetch, three.js loaders). */
export function asset(path: string) {
  return `${BASE_PATH}${path}`;
}

/** Absolute canonical URL of a page: pageUrl("/projects/hp100") → https://vanatat.ru/projects/hp100/ */
export function pageUrl(path: string) {
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  return `${CANONICAL_ORIGIN}${withSlash}`;
}

export const OG_IMAGE = {
  url: `${CANONICAL_ORIGIN}/og.png`,
  width: 1200,
  height: 630,
  alt: "Привет от Валеры — восемь автономных систем, 2 000 руб./мес",
};
