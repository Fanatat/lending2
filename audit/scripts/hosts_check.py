"""The site lives on two hosts: vanatat.vercel.app (Vercel, HTTPS) and
vanatat.ru (GitHub Pages custom domain; fanatat.github.io/lending2 redirects
there). vanatat.ru is what the author's GitHub profile links to.
Checks: does each host open in Chromium over http and https, what does the
visitor see, canonical/og:url per page, security headers.
Output: data/hosts_check.json, screenshots/hosts/
"""
from __future__ import annotations

import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import DESKTOP, new_context, polite, rel, save_json, shot_path  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

TARGETS = [
    "https://vanatat.vercel.app/", "http://vanatat.ru/", "https://vanatat.ru/",
    "https://fanatat.github.io/lending2/",
]
CANON_PAGES = ["/", "/en", "/projects/hp100", "/projects/friday-studio"]


def head_meta(u: str) -> dict:
    polite()
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 audit"}), timeout=20)
        body = r.read().decode("utf-8", "replace")
        can = re.search(r'<link rel="canonical" href="([^"]+)"', body)
        og = re.search(r'<meta property="og:url" content="([^"]+)"', body)
        desc = re.search(r'<meta name="description" content="([^"]+)"', body)
        return {"url": u, "status": r.status, "canonical": can.group(1) if can else None,
                "og_url": og.group(1) if og else None, "description": desc.group(1)[:160] if desc else None,
                "headers": {k: r.headers.get(k) for k in ("server", "strict-transport-security", "content-security-policy",
                                                          "x-frame-options", "x-content-type-options", "cache-control")}}
    except Exception as e:  # noqa: BLE001
        return {"url": u, "error": str(e)[:200]}


def main():
    out = {"browser": [], "canonical": []}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for t in TARGETS:
            ctx = new_context(b, DESKTOP)
            page = ctx.new_page()
            polite()
            rec = {"target": t}
            try:
                resp = page.goto(t, wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(3000)
                rec.update({"status": resp.status if resp else None, "final_url": page.url, "title": page.title(),
                            "is_secure_context": page.evaluate("window.isSecureContext")})
            except Exception as e:  # noqa: BLE001
                rec["error"] = str(e)[:200]
            sp = shot_path("hosts", re.sub(r"[^a-z0-9]+", "_", t.lower()).strip("_") + ".png")
            try:
                page.screenshot(path=sp)
                rec["screenshot"] = rel(sp)
            except Exception:  # noqa: BLE001
                pass
            out["browser"].append(rec)
            ctx.close()
        b.close()
    for host, suffix in (("https://vanatat.vercel.app", ""), ("http://vanatat.ru", "/")):
        for pth in CANON_PAGES:
            u = host + (pth if pth == "/" else pth + suffix)
            out["canonical"].append(head_meta(u))
    save_json("hosts_check.json", out)
    for r in out["browser"]:
        print(r)


if __name__ == "__main__":
    main()
