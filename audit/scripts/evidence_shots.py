"""Element-level screenshots used as evidence in the reports (each section of
the dashboard on desktop and phone, the contact block, the conveyor that
scrolls sideways on phones, the footer, the easter-egg counter). Also dumps the
visible text of every dashboard section for quoting.
Output: screenshots/sections/<viewport>/<id>.png, data/sections_text.json
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import DESKTOP, PHONE, new_context, pass_intro, polite, rel, save_json, shot_path, url  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

SECTIONS = ["hero", "operator", "friday-studio", "hp100", "channel-autopilot", "bridge", "all-in",
            "content-factory", "staff", "perimeter", "closing"]


def main():
    texts = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for vp in (DESKTOP, PHONE):
            ctx = new_context(b, vp)
            page = ctx.new_page()
            polite()
            page.goto(url("/"), wait_until="domcontentloaded")
            pass_intro(page, "skip")
            page.wait_for_timeout(6000)
            for sid in SECTIONS:
                loc = page.locator(f"#{sid}")
                if not loc.count():
                    continue
                loc.first.scroll_into_view_if_needed()
                page.wait_for_timeout(1800)  # reveal-on-scroll
                sp = shot_path("sections", vp, f"{sid}.png")
                try:
                    loc.first.screenshot(path=sp)
                except Exception:  # noqa: BLE001
                    page.screenshot(path=sp)
                if vp == DESKTOP:
                    texts[sid] = {"text": loc.first.inner_text(), "screenshot": rel(sp)}
            foot = page.locator("footer").first
            foot.scroll_into_view_if_needed()
            page.wait_for_timeout(800)
            foot.screenshot(path=shot_path("sections", vp, "footer.png"))
            # Easter-egg list opened.
            page.evaluate("scrollTo(0,0)")
            page.wait_for_timeout(500)
            try:
                page.locator("button", has_text="Пасхалки").first.click()
                page.wait_for_timeout(800)
                page.screenshot(path=shot_path("sections", vp, "easter_egg_list.png"))
            except Exception:  # noqa: BLE001
                pass
            ctx.close()
        b.close()
    save_json("sections_text.json", texts)
    print("sections:", len(texts))


if __name__ == "__main__":
    main()
