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
 *
 * The HP100 endpoint (api.vanatat.ru/site/air) answers CORS only for the
 * site's real origins, so from localhost the browser would block it and
 * log an error. The run answers it with a fixed sample instead — the same
 * shape — which also keeps the result independent of the sensor's server.
 */
import { chromium } from "playwright";

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const SETTLE_MS = 5000;
const AIR_URL = /^https:\/\/api\.vanatat\.ru\/site\/air(\?.*)?$/;

function airSample() {
  const now = Date.now();
  const bucket = 15 * 60 * 1000;
  const last = Math.floor(now / bucket) * bucket;
  const history = Array.from({ length: 97 }, (_, i) => ({
    t: new Date(last - (96 - i) * bucket).toISOString(),
    co2: 450 + i * 2,
    temperature: 26 + (i % 8) * 0.1,
    humidity: 42,
    dust: i % 10 === 0 ? null : 8,
  }));
  return {
    co2: 650,
    temperature: 26.4,
    humidity: 41.5,
    dust: 9,
    updated: new Date(now - 60_000).toISOString(),
    history,
  };
}
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
  await context.route(AIR_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(airSample()),
    })
  );
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
