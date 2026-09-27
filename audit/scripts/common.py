"""Shared config and helpers for the audit scripts.

Everything here only *observes* the site: the page code is never changed,
measurement helpers are injected from the test (page.evaluate / add_init_script).
"""
from __future__ import annotations

import json
import re
import os
import statistics
import time
from pathlib import Path

AUDIT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = AUDIT_DIR / "data"
SHOTS_DIR = AUDIT_DIR / "screenshots"
REPO_DIR = AUDIT_DIR.parent

# Production site. The GitHub Pages mirror is checked for availability only.
BASE_URL = os.environ.get("AUDIT_BASE_URL", "https://vanatat.vercel.app").rstrip("/")
MIRROR_URL = "https://fanatat.github.io/lending2"

# Politeness on the live site: at most ~1 navigation per second.
REQUEST_GAP_S = 1.0

VIEWPORTS = {
    "desktop-1920": {"viewport": {"width": 1920, "height": 1080}},
    "laptop-1366": {"viewport": {"width": 1366, "height": 768}},
    "tablet-768": {"viewport": {"width": 768, "height": 1024}, "is_mobile": True, "has_touch": True, "device_scale_factor": 2},
    "phone-390": {"viewport": {"width": 390, "height": 844}, "is_mobile": True, "has_touch": True, "device_scale_factor": 3,
                  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"},
}
DESKTOP = "desktop-1920"
PHONE = "phone-390"

PROJECT_SLUGS = [
    "friday-studio", "hp100", "channel-autopilot", "bridge",
    "all-in", "content-factory", "staff", "perimeter",
]

KEY_PAGES = ["/", "/en", "/projects/friday-studio", "/projects/hp100"]

CHROME = str(Path.home() / ".cache/ms-playwright/chromium-1234/chrome-linux64/chrome")

_last_nav = [0.0]


def polite():
    """Sleep so that consecutive navigations stay ≤ 1 req/s."""
    gap = time.monotonic() - _last_nav[0]
    if gap < REQUEST_GAP_S:
        time.sleep(REQUEST_GAP_S - gap)
    _last_nav[0] = time.monotonic()


def url(path: str) -> str:
    return BASE_URL + path


def save_json(name: str, obj) -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    p = DATA_DIR / name
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2))
    return p


def load_json(name: str, default=None):
    p = DATA_DIR / name
    if not p.exists():
        return default
    return json.loads(p.read_text())


def median(xs):
    xs = [x for x in xs if x is not None]
    return statistics.median(xs) if xs else None


def shot_path(*parts: str) -> Path:
    p = SHOTS_DIR.joinpath(*parts)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def rel(p: Path) -> str:
    """Path relative to audit/ for use in reports."""
    return str(Path(p).resolve().relative_to(AUDIT_DIR))


def new_context(browser, vp_name: str, **extra):
    opts = dict(VIEWPORTS[vp_name])
    opts.update(extra)
    opts.setdefault("locale", "ru-RU")
    return browser.new_context(**opts)


def attach_console(page, sink: list):
    """Collect console errors/warnings, page errors and failed/4xx-5xx requests."""
    page.on("console", lambda m: sink.append({"kind": "console", "type": m.type, "text": m.text[:500]})
            if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: sink.append({"kind": "pageerror", "text": str(e)[:500]}))
    page.on("requestfailed", lambda r: sink.append({"kind": "requestfailed", "url": r.url, "failure": r.failure}))

    def on_resp(r):
        if r.status >= 400:
            sink.append({"kind": "http", "status": r.status, "url": r.url})
    page.on("response", on_resp)


def pass_intro(page, how: str = "skip", timeout_ms: int = 20000) -> dict:
    """Get through the boot intro the way a visitor would.

    how = "skip"  -> press the visible "Пропустить/Skip" button on the gate
          "silent"-> choose "без звука", then wait for "Начать" and press it
          "esc"   -> press Escape
    Returns timings in ms from call.
    """
    t0 = time.monotonic()
    res = {"how": how}
    try:
        if how in ("esc", "skip"):
            # Before hydration the skip button / Esc do nothing, so repeat
            # every 2 s; the count of ignored attempts is recorded.
            ignored = 0
            deadline = time.monotonic() + timeout_ms / 1000
            while time.monotonic() < deadline:
                if how == "esc":
                    page.keyboard.press("Escape")
                else:
                    page.locator("button.intro-skip").first.click(timeout=timeout_ms)
                try:
                    page.wait_for_selector(".intro-main-wrap--visible", timeout=2000)
                    break
                except Exception:  # noqa: BLE001
                    ignored += 1
            res["ignored_attempts"] = ignored
        elif how == "silent":
            ignored = 0
            for _ in range(10):
                gate_btn = page.locator("button.intro-gate-secondary")
                if not gate_btn.count():
                    break  # gate already gone: the previous click worked
                try:
                    gate_btn.first.click(timeout=3000)
                    page.wait_for_function(
                        "!document.querySelector('.intro-gate') || document.querySelector('.intro-gate--out')",
                        timeout=2000)
                    break
                except Exception:  # noqa: BLE001 — not hydrated yet, click ignored
                    ignored += 1
            res["ignored_attempts"] = ignored
            res["gate_ms"] = round((time.monotonic() - t0) * 1000)
            start = page.get_by_role("button", name=re.compile(r"^(Начать|Start)$"))
            start.first.wait_for(state="visible", timeout=40000)
            res["start_visible_ms"] = round((time.monotonic() - t0) * 1000)
            start.first.click()
        page.wait_for_selector(".intro-main-wrap--visible", timeout=timeout_ms)
        # Wait until the overlay is gone (body scroll re-enabled).
        page.wait_for_function("document.body.style.overflow !== 'hidden'", timeout=timeout_ms)
    except Exception as e:  # noqa: BLE001 — recorded, not fatal
        res["error"] = str(e)[:300]
    # A click that lands before hydration does nothing; retry the way a
    # visitor would (the gate advertises Esc) so later steps see the site.
    for _ in range(3):
        if page.locator(".intro-main-wrap--visible").count():
            break
        res["retries"] = res.get("retries", 0) + 1
        page.keyboard.press("Escape")
        page.wait_for_timeout(1500)
    res["passed"] = page.locator(".intro-main-wrap--visible").count() > 0
    res["total_ms"] = round((time.monotonic() - t0) * 1000)
    return res
