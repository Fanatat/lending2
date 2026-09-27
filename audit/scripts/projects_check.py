"""Block 2, per project: does the demo open, how fast it becomes interactive,
console errors in the first 30 s, does it work on a phone.

"Demo" of a system = its /projects/<slug> page with the «Вживую» widget
(nothing else is linked from the site). The five games have public builds on
GitHub Pages / Vercel that the site does NOT link to — they are checked too,
because the report has to say whether linking them is safe.

Interactivity: a long-task observer is injected before the page loads;
"TTI (approx.)" = end of the last long task that is followed by ≥ 5 s of
quiet within the 30 s window (Lighthouse-style heuristic), or DCL if no
long tasks. On this site background canvas effects keep producing long
tasks, so TTI often equals the 30 s window: read it together with
long_tasks / blocking_ms_30s. For site pages the clock includes the intro
gate being skipped; "widget_section_visible_s" is measured only after the
intro is really gone.
Output: data/projects_check.json, screenshots/projects/<viewport>/
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (DESKTOP, PHONE, PROJECT_SLUGS, attach_console, load_json, new_context,  # noqa: E402
                    pass_intro, polite, rel, save_json, shot_path, url)
from playwright.sync_api import sync_playwright  # noqa: E402

WINDOW_S = 30

EXTERNAL_DEMOS = {
    "Словоход (VK build on Vercel)": "https://slovokhod-vk.vercel.app",
    "Картинки по числам / catnonogram (Vercel)": "https://catnonogram-vk.vercel.app",
    "Color Sort (Vercel)": "https://color-sort-vk.vercel.app",
    "Словоход (games-dev)": "https://fanatat.github.io/games-dev/slovokhod/",
    "Картинки по числам (games-dev)": "https://fanatat.github.io/games-dev/catnonogram/",
    "Color Sort (games-dev)": "https://fanatat.github.io/games-dev/color-sort/",
    "Lane Battler (games-dev)": "https://fanatat.github.io/games-dev/lane-battle/",
    "Royal Solitaire (games-dev)": "https://fanatat.github.io/games-dev/royal-solitaire/",
}

LONGTASK_INIT = """
window.__lt = [];
try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push([e.startTime, e.duration])))
      .observe({type: 'longtask', buffered: true}); } catch (e) {}
"""

TTI_JS = """
() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const dcl = nav ? nav.domContentLoadedEventEnd : 0;
  const lt = (window.__lt || []).slice().sort((a, b) => a[0] - b[0]);
  let tti = dcl;
  for (let i = 0; i < lt.length; i++) {
    const end = lt[i][0] + lt[i][1];
    const next = lt[i + 1] ? lt[i + 1][0] : Infinity;
    if (end > tti) tti = end;
    if (next - end >= 5000) break;
  }
  return {dcl_ms: Math.round(dcl), load_ms: nav ? Math.round(nav.loadEventEnd) : null,
          long_tasks: lt.length, long_task_total_ms: Math.round(lt.reduce((a, t) => a + t[1], 0)),
          blocking_ms_30s: Math.round(lt.reduce((a, t) => a + Math.max(0, t[1] - 50), 0)),
          tti_approx_ms: Math.round(tti)};
}
"""

PAGE_JS = """
() => {
  const txt = document.body.innerText;
  const canv = [...document.querySelectorAll('canvas')].map(c => { const r = c.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  return {
    title: document.title,
    text_len: txt.length,
    text_head: txt.trim().slice(0, 200),
    canvases: canv,
    horizontal_scroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    buttons: document.querySelectorAll('button, [role=button], a[href]').length,
    mobile_warning: /только (на )?(компьютер|десктоп)|desktop only|best on desktop|поверните/i.test(txt),
    external_links: [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => !h.includes(location.host)),
  };
}
"""


def check(browser, target: str, vp: str, is_site: bool, tag: str) -> dict:
    ctx = new_context(browser, vp)
    page = ctx.new_page()
    page.add_init_script(LONGTASK_INIT)
    errs: list = []
    attach_console(page, errs)
    polite()
    t0 = time.monotonic()
    rec = {"target": target, "viewport": vp}
    try:
        resp = page.goto(target, wait_until="domcontentloaded", timeout=60000)
        rec["status"] = resp.status if resp else None
        if is_site:
            rec["intro"] = pass_intro(page, "skip")
            rec["intro_passed_s"] = round(time.monotonic() - t0, 1)
            live = page.locator("h2", has_text="Вживую")
            try:
                live.first.wait_for(state="visible", timeout=15000)
                rec["widget_section_visible_s"] = round(time.monotonic() - t0, 1)
            except Exception:  # noqa: BLE001
                rec["widget_section_visible_s"] = None
        remaining = WINDOW_S - (time.monotonic() - t0)
        if remaining > 0:
            page.wait_for_timeout(int(remaining * 1000))
        rec.update(page.evaluate(TTI_JS))
        rec.update(page.evaluate(PAGE_JS))
        p = shot_path("projects", vp, f"{tag}_30s.png")
        page.screenshot(path=p)
        rec["screenshot_30s"] = rel(p)
    except Exception as e:  # noqa: BLE001
        rec["error"] = str(e)[:300]
    rec["console_errors_30s"] = [e for e in errs if e["kind"] == "pageerror" or e.get("type") == "error"][:15]
    rec["failed_requests_30s"] = [e for e in errs if e["kind"] in ("requestfailed", "http")][:15]
    ctx.close()
    return rec


def main():
    site, ext = {}, {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for slug in PROJECT_SLUGS:
            for vp in (DESKTOP, PHONE):
                print("site project", slug, vp, flush=True)
                site.setdefault(slug, {})[vp] = check(b, url(f"/projects/{slug}"), vp, True, slug)
                save_json("projects_check.json", {"site_projects": site, "external_demos": ext})
        for name, target in EXTERNAL_DEMOS.items():
            tag = target.rstrip("/").split("/")[-1].replace(".", "_")
            for vp in (DESKTOP, PHONE):
                print("external demo", name, vp, flush=True)
                ext.setdefault(name, {})[vp] = check(b, target, vp, False, tag)
                save_json("projects_check.json", {"site_projects": site, "external_demos": ext})
        b.close()
    links = load_json("links.json", [])
    save_json("projects_check.json", {
        "method": __doc__.strip(),
        "site_projects": site, "external_demos": ext,
        "code_links": [{k: l.get(k) for k in ("url", "status", "linked_from_site")} for l in links if "github.com" in l["url"]],
    })


if __name__ == "__main__":
    main()
