/**
 * Smoke test: opens every page of a running copy of the site in headless
 * Chromium and fails if the browser console reports an error. The pages
 * are pre-rendered, so a hydration mismatch (server HTML ≠ first client
 * render) only shows up here, in a real browser — and it costs the visitor
 * their first click while React re-renders the page.
 *
 *   SMOKE_BASE_URL=http://localhost:3000 npm run smoke
 *
 * The page list comes from the site's own sitemap.xml, plus the hidden
 * project page that the sitemap leaves out on purpose.
 */
import { chromium } from "playwright";

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const SETTLE_MS = 5000;
const EXTRA_PATHS = ["/projects/bridge/"];

async function fetchSitemap() {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const res = await fetch(`${BASE}/sitemap.xml`);
      if (res.ok) return await res.text();
    } catch {
      // server still starting
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`no sitemap.xml at ${BASE} after 30 s`);
}

const sitemap = await fetchSitemap();
const paths = [
  ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname),
  ...EXTRA_PATHS,
];

const browser = await chromium.launch();
let failed = 0;

for (const path of paths) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  const res = await page.goto(`${BASE}${path}`, { waitUntil: "load" });
  await page.waitForTimeout(SETTLE_MS);
  const status = res?.status() ?? 0;

  if (status !== 200 || errors.length) {
    failed++;
    console.log(`FAIL ${path} (HTTP ${status})`);
    for (const e of errors) console.log(`  ${e.slice(0, 300)}`);
  } else {
    console.log(`ok   ${path}`);
  }
  await context.close();
}

await browser.close();
console.log(`${paths.length - failed}/${paths.length} pages with a clean console`);
process.exit(failed ? 1 : 0);
