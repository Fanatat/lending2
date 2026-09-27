"""Block 4, accessibility (automated part):
  - axe-core (WCAG 2.1 A/AA rules incl. colour contrast), injected from
    audit/node_modules, on the home page (after scrolling through), /en and a
    project page;
  - keyboard: can the intro be passed with Tab/Enter (up to 20 Tab presses,
    every stop recorded, incl. focus landing on elements covered by the
    overlay), then 60 Tab presses on the dashboard — what gets focus, is
    focus visible (outline/box-shadow), can the Telegram link be reached;
  - zoom 200 %: 1280x720 window at 200 % = 640x360 CSS px viewport, check
    horizontal scroll and screenshot;
  - prefers-reduced-motion: does the intro still play.
Output: data/a11y.json, screenshots/a11y/
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import AUDIT_DIR, DESKTOP, new_context, pass_intro, polite, rel, save_json, shot_path, url  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

AXE = (AUDIT_DIR / "node_modules/axe-core/axe.min.js").read_text()

FOCUS_JS = r"""
() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(), role: el.getAttribute('role'),
    text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60),
    href: el.getAttribute('href'),
    outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 ? s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor : null,
    box_shadow: s.boxShadow !== 'none' ? s.boxShadow.slice(0, 60) : null,
    in_viewport: r.bottom > 0 && r.top < innerHeight,
    url: location.pathname,
    // Focused but visually covered by something else (e.g. the intro overlay).
    covered: (() => { const x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null;
      const top = document.elementFromPoint(x, y); return !!top && top !== el && !el.contains(top); })(),
    visible: r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05,
  };
}
"""


def axe(page) -> dict:
    page.add_script_tag(content=AXE)
    res = page.evaluate("""async () => {
        const r = await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']}});
        return r.violations.map(v => ({id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
            samples: v.nodes.slice(0, 5).map(n => ({target: n.target.join(' '), summary: (n.failureSummary || '').slice(0, 200), html: n.html.slice(0, 160)}))}));
    }""")
    return {"violations": res, "violation_count": len(res), "node_count": sum(v["nodes"] for v in res)}


def main():
    out = {"axe": {}, "keyboard": {}, "zoom200": {}, "reduced_motion": {}}
    with sync_playwright() as p:
        b = p.chromium.launch()
        # axe
        for path in ("/", "/en", "/projects/hp100", "/projects/staff"):
            ctx = new_context(b, DESKTOP)
            page = ctx.new_page()
            polite()
            page.goto(url(path), wait_until="domcontentloaded")
            gate = axe(page)  # the intro gate is the first thing everyone sees
            pass_intro(page, "skip")
            page.wait_for_timeout(2000)
            h = page.evaluate("document.documentElement.scrollHeight")
            for y in range(0, h, 600):
                page.mouse.wheel(0, 600)
                page.wait_for_timeout(120)
            page.wait_for_timeout(1500)
            out["axe"][path] = {"intro_gate": gate, "page": axe(page)}
            ctx.close()
            print("axe", path, out["axe"][path]["page"]["violation_count"], flush=True)

        # keyboard
        ctx = new_context(b, DESKTOP)
        page = ctx.new_page()
        polite()
        page.goto(url("/"), wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        gate_focus = page.evaluate(FOCUS_JS)
        page.keyboard.press("Enter")  # gate: Enter = "with sound"
        seq = []
        intro_tabs = []
        try:
            start = page.get_by_role("button", name="Начать")
            start.wait_for(state="visible", timeout=40000)
            # Tab towards "Начать" like a keyboard user; record every stop.
            for _ in range(20):
                page.keyboard.press("Tab")
                page.wait_for_timeout(120)
                f = page.evaluate(FOCUS_JS)
                intro_tabs.append(f)
                if f and f["text"] == "Начать":
                    break
            if intro_tabs and intro_tabs[-1] and intro_tabs[-1]["text"] == "Начать":
                page.keyboard.press("Enter")
                intro_keyboard_ok = f"yes, {len(intro_tabs)} Tab presses"
            else:
                intro_keyboard_ok = "no: 20 Tab presses did not reach «Начать»"
                start.click()
            page.wait_for_selector(".intro-main-wrap--visible", timeout=15000)
            page.wait_for_timeout(2500)
        except Exception as e:  # noqa: BLE001
            intro_keyboard_ok = f"failed: {str(e)[:120]}"
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        page.evaluate("() => { document.activeElement && document.activeElement.blur(); scrollTo(0, 0); }")
        tg_reached_at = None
        for i in range(60):
            page.keyboard.press("Tab")
            page.wait_for_timeout(120)
            f = page.evaluate(FOCUS_JS)
            seq.append(f)
            if f and f.get("href") and "t.me" in f["href"] and tg_reached_at is None:
                tg_reached_at = i + 1
                p_tg = shot_path("a11y", "keyboard_focus_telegram.png")
                page.screenshot(path=p_tg)
            if i in (2, 8, 15):
                page.screenshot(path=shot_path("a11y", f"keyboard_tab_{i + 1}.png"))
        no_visible_focus = [s for s in seq if s and not s["outline"] and not s["box_shadow"]]
        out["keyboard"] = {
            "gate_autofocus": gate_focus,
            "intro_passable_by_keyboard": intro_keyboard_ok,
            "intro_tab_stops": intro_tabs,
            "intro_focus_on_covered_elements": [f for f in intro_tabs if f and f.get("covered")],
            "tab_sequence": seq,
            "tabs_to_telegram": tg_reached_at,
            "focus_stops": len([s for s in seq if s]),
            "focus_without_outline_or_shadow": len(no_visible_focus),
            "focus_without_indicator_samples": no_visible_focus[:10],
            "offscreen_focus": [s for s in seq if s and not s["in_viewport"]][:10],
            "screenshots": [rel(shot_path("a11y", f"keyboard_tab_{i}.png")) for i in (3, 9, 16)],
        }
        ctx.close()

        # zoom 200 %
        for path in ("/", "/projects/hp100", "/en"):
            ctx = b.new_context(viewport={"width": 640, "height": 360}, device_scale_factor=2, locale="ru-RU")
            page = ctx.new_page()
            polite()
            page.goto(url(path), wait_until="domcontentloaded")
            pass_intro(page, "skip")
            page.wait_for_timeout(2500)
            tag = path.strip("/").replace("/", "_") or "home"
            p1 = shot_path("a11y", f"zoom200_{tag}.png")
            page.screenshot(path=p1)
            page.mouse.wheel(0, 2500)
            page.wait_for_timeout(1500)
            p2 = shot_path("a11y", f"zoom200_{tag}_scrolled.png")
            page.screenshot(path=p2)
            out["zoom200"][path] = {
                "css_viewport": "640x360 (1280x720 at 200%)",
                "horizontal_scroll": page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"),
                "scroll_width": page.evaluate("document.documentElement.scrollWidth"),
                "screenshots": [rel(p1), rel(p2)],
            }
            ctx.close()

        # prefers-reduced-motion
        ctx = new_context(b, DESKTOP, reduced_motion="reduce")
        page = ctx.new_page()
        polite()
        page.goto(url("/"), wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        gate = page.locator(".intro-gate").count() > 0
        r = pass_intro(page, "silent")
        p3 = shot_path("a11y", "reduced_motion_after_intro.png")
        page.screenshot(path=p3)
        out["reduced_motion"] = {"intro_gate_shown": gate, "intro_timing_silent_path": r, "screenshot": rel(p3)}
        ctx.close()
        b.close()
    save_json("a11y.json", out)


if __name__ == "__main__":
    main()
