"""Does the site play sound after a visitor presses "Пропустить" (skip) or
chooses "без звука"? Counts Web Audio buffer starts via an injected hook
(AudioBufferSourceNode.prototype.start is wrapped before the page loads).
Output: data/sound_check.json
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import DESKTOP, PHONE, new_context, pass_intro, polite, save_json, url  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

HOOK = """
window.__audioStarts = 0;
const _s = AudioBufferSourceNode.prototype.start;
AudioBufferSourceNode.prototype.start = function (...a) { window.__audioStarts++; return _s.apply(this, a); };
const _p = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function (...a) { window.__audioStarts++; return _p.apply(this, a); };
"""


def main():
    out = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--autoplay-policy=user-gesture-required"])
        for vp in (DESKTOP, PHONE):
            for how in ("skip", "silent"):
                ctx = new_context(b, vp)
                page = ctx.new_page()
                page.add_init_script(HOOK)
                polite()
                page.goto(url("/"), wait_until="domcontentloaded")
                page.wait_for_timeout(1500)
                r = pass_intro(page, how)
                page.evaluate("window.__audioStarts = 0")
                page.wait_for_timeout(8000)  # hero typewriter runs here
                out.append({"viewport": vp, "intro_path": how,
                            "sound_toggle_label": page.locator("text=/Звук: /").first.inner_text(),
                            "audio_starts_in_8s_after_intro": page.evaluate("window.__audioStarts"),
                            "intro": r})
                ctx.close()
        b.close()
    save_json("sound_check.json", out)
    for o in out:
        print(o)


if __name__ == "__main__":
    main()
