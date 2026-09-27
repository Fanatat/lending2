"""Block 2 (layout, weight, console, SEO) + block 3 "five-second test".

For every page x viewport (1920x1080, 1366x768, 768x1024, 390x844):
  - screenshot at 5 s with no interaction (what a visitor really sees first)
  - screenshot of the first screen after skipping the intro
  - full-page screenshot after scrolling through (reveal-on-scroll content)
  - horizontal scroll, elements sticking out of the viewport, clipped text,
    overlapping text boxes, tap targets < 44x44, text < 16 px (phone)
  - transferred bytes, request count, top-5 heaviest resources
  - console errors/warnings, failed requests, 4xx/5xx
  - SEO/share basics: title, description, h1, OG/Twitter, favicon, canonical,
    lang, img alt
Measurement code is injected with page.evaluate; the site is not modified.
Output: data/page_metrics.json, screenshots/five_second/, screenshots/pages/
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (DATA_DIR, PHONE, PROJECT_SLUGS, VIEWPORTS, attach_console, new_context,  # noqa: E402
                    pass_intro, polite, rel, save_json, shot_path, url)
from playwright.sync_api import sync_playwright  # noqa: E402

PAGES = ["/", "/en"] + [f"/projects/{s}" for s in PROJECT_SLUGS]
# Full viewport matrix for key pages; project pages get desktop + phone.
FULL_MATRIX = {"/", "/en", "/projects/hp100", "/projects/friday-studio"}

LAYOUT_JS = r"""
(isPhone) => {
  const vw = document.documentElement.clientWidth;
  const vis = el => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const desc = el => {
    const t = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''} «${t}»`;
  };
  const all = [...document.querySelectorAll('body *')];
  // Elements sticking out to the right of the viewport (not fixed decorations).
  const overflowing = all.filter(el => {
    if (!vis(el)) return false;
    const r = el.getBoundingClientRect();
    return r.right > vw + 1 && getComputedStyle(el).position !== 'fixed';
  }).slice(0, 15).map(el => ({el: desc(el), right: Math.round(el.getBoundingClientRect().right)}));
  // Clipped text: content wider than its box with overflow hidden.
  const clipped = all.filter(el => {
    if (!vis(el) || !el.innerText || el.children.length > 3) return false;
    const s = getComputedStyle(el);
    return (s.overflowX === 'hidden' || s.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2;
  }).slice(0, 15).map(desc);
  // Interactive elements and their size.
  const inter = [...document.querySelectorAll('a[href], button, [role=button], input, select, textarea, summary')].filter(vis);
  const small = inter.filter(el => {
    const r = el.getBoundingClientRect();
    return r.width < 44 || r.height < 44;
  }).map(el => {
    const r = el.getBoundingClientRect();
    return {el: desc(el), w: Math.round(r.width), h: Math.round(r.height)};
  });
  // Text size: leaf-ish elements with own text.
  const sizes = {};
  const smallText = [];
  for (const el of all) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
    if (!own || !vis(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    sizes[fs] = (sizes[fs] || 0) + own.length;
    if (fs < 16 && smallText.length < 25) smallText.push({px: fs, text: own.slice(0, 60)});
  }
  const totalChars = Object.values(sizes).reduce((a, b) => a + b, 0);
  const smallChars = Object.entries(sizes).filter(([k]) => parseFloat(k) < 16).reduce((a, [, v]) => a + v, 0);
  // Overlapping text boxes (leaf text elements whose boxes intersect).
  const leaves = all.filter(el => vis(el) && el.children.length === 0 && (el.innerText || '').trim().length > 1
                          && getComputedStyle(el).position !== 'fixed');
  const overlaps = [];
  for (let i = 0; i < leaves.length && overlaps.length < 10; i++) {
    const a = leaves[i].getBoundingClientRect();
    for (let j = i + 1; j < leaves.length; j++) {
      const b = leaves[j].getBoundingClientRect();
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ix > 4 && iy > 4 && !leaves[i].contains(leaves[j]) && !leaves[j].contains(leaves[i])) {
        overlaps.push([desc(leaves[i]), desc(leaves[j])]);
        break;
      }
    }
  }
  return {
    viewport_w: vw,
    scroll_w: document.documentElement.scrollWidth,
    horizontal_scroll: document.documentElement.scrollWidth > vw + 1,
    page_height: document.documentElement.scrollHeight,
    overflowing, clipped, overlaps,
    interactive_total: inter.length,
    tap_targets_under_44: small.length,
    tap_targets_under_44_samples: small.slice(0, 20),
    font_px_by_chars: sizes,
    text_chars_total: totalChars,
    text_chars_under_16px: smallChars,
    text_share_under_16px: totalChars ? +(smallChars / totalChars).toFixed(2) : null,
    small_text_samples: smallText,
  };
}
"""

SEO_JS = r"""
() => {
  const m = n => document.querySelector(`meta[name="${n}"]`)?.content ?? null;
  const p = n => document.querySelector(`meta[property="${n}"]`)?.content ?? null;
  const imgs = [...document.querySelectorAll('img')];
  return {
    title: document.title, description: m('description'), lang: document.documentElement.lang,
    h1: [...document.querySelectorAll('h1')].map(h => h.innerText.trim()),
    h2_count: document.querySelectorAll('h2').length,
    canonical: document.querySelector('link[rel=canonical]')?.href ?? null,
    hreflang: [...document.querySelectorAll('link[rel=alternate][hreflang]')].map(l => l.hreflang + '=' + l.href),
    og: {title: p('og:title'), description: p('og:description'), image: p('og:image'), url: p('og:url'), type: p('og:type')},
    twitter: {card: m('twitter:card'), image: m('twitter:image')},
    favicon: [...document.querySelectorAll('link[rel~=icon]')].map(l => l.href.slice(0, 80)),
    robots: m('robots'),
    images: imgs.length, images_without_alt: imgs.filter(i => !i.hasAttribute('alt')).map(i => i.src.slice(0, 100)),
    svg_count: document.querySelectorAll('svg').length, canvas_count: document.querySelectorAll('canvas').length,
    json_ld: document.querySelectorAll('script[type="application/ld+json"]').length,
  };
}
"""

RES_JS = r"""
() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const res = performance.getEntriesByType('resource');
  const all = [{name: nav.name, size: nav.transferSize, type: 'document'}]
    .concat(res.map(r => ({name: r.name, size: r.transferSize || r.encodedBodySize || 0, type: r.initiatorType})));
  return {
    requests: all.length,
    transfer_kb: Math.round(all.reduce((a, r) => a + r.size, 0) / 1024),
    top5: all.sort((a, b) => b.size - a.size).slice(0, 5).map(r => ({url: r.name.slice(0, 140), kb: Math.round(r.size / 1024), type: r.type})),
    by_type_kb: all.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + Math.round(r.size / 1024); return acc; }, {}),
  };
}
"""


def scroll_through(page, step_px: int = 500, pause_ms: int = 150):
    h = page.evaluate("document.documentElement.scrollHeight")
    y = 0
    while y < h:
        y += step_px
        page.mouse.wheel(0, step_px)
        page.wait_for_timeout(pause_ms)
        h = page.evaluate("document.documentElement.scrollHeight")
    page.wait_for_timeout(1500)


def measure(browser, path: str, vp: str) -> dict:
    ctx = new_context(browser, vp)
    page = ctx.new_page()
    errs: list = []
    attach_console(page, errs)
    tag = (path.strip("/").replace("/", "_") or "home") + "_" + vp
    polite()
    t0 = time.monotonic()
    resp = page.goto(url(path), wait_until="domcontentloaded")
    page.wait_for_timeout(max(0, 5000 - int((time.monotonic() - t0) * 1000)))
    five = shot_path("five_second", f"{tag}_5s_no_action.png")
    page.screenshot(path=five)
    gate_visible = page.locator(".intro-gate").count() > 0 and page.locator(".intro-gate").first.is_visible()
    intro = pass_intro(page, "skip")
    page.wait_for_timeout(4000)  # hero typewriter / reveal animations settle
    first = shot_path("five_second", f"{tag}_first_screen_after_skip.png")
    page.screenshot(path=first)
    above_fold = page.evaluate("""() => {
        const vh = innerHeight;
        const vis = [...document.querySelectorAll('h1,h2,p,a[href],button,[role=button]')].filter(e => {
            const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
            return r.top < vh && r.bottom > 0 && r.width > 0 && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05;
        });
        return vis.map(e => e.tagName.toLowerCase() + ': ' + (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\\s+/g,' ').slice(0, 90)).filter(t => !t.endsWith(': '));
    }""")
    scroll_through(page)
    full = shot_path("pages", f"{tag}_full.png")
    try:
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(500)
        page.screenshot(path=full, full_page=True)
    except Exception as e:  # noqa: BLE001
        full = None
        errs.append({"kind": "audit", "text": f"full-page screenshot failed: {e}"[:200]})
    if vp == "desktop-1920":
        # Visible copy, for quoting in the reports.
        (DATA_DIR / "text").mkdir(parents=True, exist_ok=True)
        (DATA_DIR / "text" / f"{tag}.txt").write_text(page.evaluate("document.body.innerText"))
    layout = page.evaluate(LAYOUT_JS, vp == PHONE)
    seo = page.evaluate(SEO_JS)
    res = page.evaluate(RES_JS)
    ctx.close()
    return {
        "path": path, "viewport": vp, "status": resp.status if resp else None,
        "intro_gate_shown": gate_visible, "intro": intro,
        "screens": {"five_second_no_action": rel(five), "first_screen_after_skip": rel(first),
                    "full_page": rel(full) if full else None},
        "above_fold_after_skip": above_fold[:25],
        "layout": layout, "seo": seo, "resources": res,
        "console": {
            "errors": [e for e in errs if e["kind"] in ("pageerror",) or e.get("type") == "error"],
            "warnings": [e for e in errs if e.get("type") == "warning"][:10],
            "failed_requests": [e for e in errs if e["kind"] in ("requestfailed", "http")],
        },
    }


def main():
    out = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for path in PAGES:
            vps = list(VIEWPORTS) if path in FULL_MATRIX else ["desktop-1920", PHONE]
            for vp in vps:
                print("measure", path, vp, flush=True)
                try:
                    out.append(measure(b, path, vp))
                except Exception as e:  # noqa: BLE001
                    out.append({"path": path, "viewport": vp, "error": str(e)[:300]})
                save_json("page_metrics.json", out)
        b.close()


if __name__ == "__main__":
    main()
