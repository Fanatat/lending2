"""Block 1 + criterion 5: crawl internal pages, check every external link.

The site is a Next.js SPA: project pages are opened by <div role="button">
cards that call router.push(), not by <a href>. A pure link crawler would
never reach /projects/*, so the crawl has three discovery sources and records
which one found each page:
  - "a[href]"      real links in the rendered DOM (what search engines follow)
  - "click"        role=button cards / buttons that change the URL when clicked
  - "sitemap"      sitemap.xml (404 on this site — recorded)
Output: data/pages.json, data/links.json, data/broken_links.json
"""
from __future__ import annotations

import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urljoin, urlparse

sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from common import (BASE_URL, MIRROR_URL, PROJECT_SLUGS, DESKTOP, attach_console,  # noqa: E402
                    new_context, pass_intro, polite, save_json, url)
from playwright.sync_api import sync_playwright  # noqa: E402

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 portfolio-audit"

# Demos/repos that exist publicly (found on the author's GitHub profile) but are
# NOT linked from the site — checked so the report can say whether linking them is safe.
OFF_SITE = [
    "https://github.com/Fanatat/lending2",
    "https://github.com/Fanatat/slovokhod-vk",
    "https://github.com/Fanatat/catnonogram-vk",
    "https://github.com/Fanatat/Color_Sort-Vk",
    "https://github.com/Fanatat/lane-battle-vk",
    "https://github.com/Fanatat/Royal_solitaire",
    "https://github.com/Fanatat/hp100-live-feed",
    "https://slovokhod-vk.vercel.app",
    "https://catnonogram-vk.vercel.app",
    "https://color-sort-vk.vercel.app",
    "https://fanatat.github.io/games-dev/",
    "https://fanatat.github.io/games-dev/slovokhod/",
    "https://fanatat.github.io/games-dev/catnonogram/",
    "https://fanatat.github.io/games-dev/color-sort/",
    "https://fanatat.github.io/games-dev/lane-battle/",
    "https://fanatat.github.io/games-dev/royal-solitaire/",
    "http://vanatat.ru",
    MIRROR_URL + "/",
]


def http_check(u: str, method: str = "GET") -> dict:
    polite()
    req = urllib.request.Request(u, method=method, headers={"User-Agent": UA})
    t0 = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read(200_000) if method == "GET" else b""
            return {"url": u, "status": r.status, "final_url": r.geturl(),
                    "ms": round((time.monotonic() - t0) * 1000), "bytes": len(body),
                    "_body": body.decode("utf-8", "replace")}
    except urllib.error.HTTPError as e:
        return {"url": u, "status": e.code, "final_url": u, "ms": round((time.monotonic() - t0) * 1000)}
    except Exception as e:  # noqa: BLE001
        return {"url": u, "status": None, "error": str(e)[:200], "ms": round((time.monotonic() - t0) * 1000)}


def page_type(path: str) -> str:
    if path in ("/", ""):
        return "главная (дашборд систем, RU)"
    if path == "/en":
        return "главная EN (текстовая версия)"
    if path.startswith("/projects/"):
        return "карточка проекта"
    if path in ("/og.png",):
        return "служебная (OG-картинка)"
    return "служебная"


def main():
    pages: dict[str, dict] = {}
    anchors: dict[str, set] = {}      # href -> set of pages where found (a[href])
    click_found: dict[str, str] = {}  # path -> how
    click_failed: list = []
    nav_links: set[str] = set()

    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = new_context(b, DESKTOP)
        queue = ["/", "/en"]
        seen = set()
        while queue:
            path = queue.pop(0)
            if path in seen:
                continue
            seen.add(path)
            page = ctx.new_page()
            errs: list = []
            attach_console(page, errs)
            polite()
            resp = page.goto(url(path), wait_until="domcontentloaded")
            pass_intro(page, "skip")
            page.wait_for_timeout(1500)
            info = page.evaluate("""() => ({
                title: document.title,
                h1: [...document.querySelectorAll('h1')].map(h => h.innerText.trim()),
                hrefs: [...document.querySelectorAll('a[href]')].map(a => ({href: a.href, text: a.innerText.trim().slice(0,60), target: a.target, rel: a.rel})),
                navHrefs: [...document.querySelectorAll('nav a[href], header a[href], [class*=fixed] a[href]')].map(a => a.href),
                roleButtons: [...document.querySelectorAll('[role=button]')].map(e => e.getAttribute('aria-label')),
            })""")
            pages[path] = {"url": url(path), "status": resp.status if resp else None, "title": info["title"],
                           "h1": info["h1"], "type": page_type(path), "found_via": pages.get(path, {}).get("found_via", "start"),
                           "a_href_count": len(info["hrefs"]), "role_button_cards": info["roleButtons"],
                           "errors": errs[:20]}
            for n in info["navHrefs"]:
                nav_links.add(urlparse(n).path.rstrip("/") or "/")
            for a in info["hrefs"]:
                anchors.setdefault(a["href"], set()).add(path)
                pu = urlparse(a["href"])
                if pu.netloc == urlparse(BASE_URL).netloc:
                    ip = pu.path.rstrip("/") or "/"
                    if ip not in seen and ip not in queue:
                        queue.append(ip)
                        pages.setdefault(ip, {})["found_via"] = "a[href]"
            # Click every role=button card on the dashboard and see where it goes.
            if path == "/":
                n = page.locator("[role=button][aria-label]").count()
                for i in range(n):
                    polite()
                    pg2 = ctx.new_page()
                    pg2.goto(url("/"), wait_until="domcontentloaded")
                    pass_intro(pg2, "skip")
                    el = pg2.locator("[role=button][aria-label]").nth(i)
                    label = el.get_attribute("aria-label")
                    try:
                        el.scroll_into_view_if_needed(timeout=5000)
                        el.click(timeout=5000)
                        pg2.wait_for_url("**/projects/**", timeout=8000)
                        dest = urlparse(pg2.url).path.rstrip("/")
                        click_found[dest] = f"click on role=button «{label}»"
                        if dest not in seen and dest not in queue:
                            queue.append(dest)
                            pages.setdefault(dest, {})["found_via"] = "click (div role=button, no href)"
                    except Exception as e:  # noqa: BLE001
                        click_failed.append({"label": label, "error": str(e)[:150]})
                    pg2.close()
            # Project pages: prev/next are <button>s — follow them by click too.
            if path.startswith("/projects/"):
                for name in ("следующая", "предыдущая"):
                    polite()
                    try:
                        page.get_by_role("button", name=__import__("re").compile(name)).click(timeout=5000)
                        page.wait_for_function(f"location.pathname !== {path!r}", timeout=8000)
                        dest = urlparse(page.url).path.rstrip("/")
                        if dest not in seen and dest not in queue:
                            queue.append(dest)
                            pages.setdefault(dest, {})["found_via"] = "click (prev/next <button>, no href)"
                        page.go_back()
                        page.wait_for_timeout(800)
                    except Exception:  # noqa: BLE001
                        pass
            page.close()
        # Slugs from the code that no discovery path reached (e.g. hidden «Мост»).
        for slug in PROJECT_SLUGS:
            pth = f"/projects/{slug}"
            if pth not in seen:
                pg = ctx.new_page()
                polite()
                r = pg.goto(url(pth), wait_until="domcontentloaded")
                pages[pth] = {"url": url(pth), "status": r.status if r else None, "title": pg.title(),
                              "type": page_type(pth), "found_via": "только из кода (lib/projects.ts), на сайте ссылок нет"}
                pg.close()
        # A missing page, to see the 404 experience.
        pg = ctx.new_page()
        polite()
        r = pg.goto(url("/no-such-page-audit"), wait_until="domcontentloaded")
        pass_intro(pg, "skip")
        pg.wait_for_timeout(800)
        pages["/no-such-page-audit"] = {"url": url("/no-such-page-audit"), "status": r.status if r else None,
                                        "title": pg.title(), "type": "404", "found_via": "проверка 404",
                                        "links_on_404": pg.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.href)"),
                                        "text": pg.inner_text("body")[:300]}
        pg.close()
        b.close()

    # Service files.
    service = {}
    for sp in ("/sitemap.xml", "/robots.txt", "/og.png", "/favicon.ico", "/manifest.json"):
        r = http_check(url(sp))
        r.pop("_body", None)
        service[sp] = r
        pages.setdefault(sp, {"url": url(sp), "status": r["status"], "type": "служебная", "found_via": "прямой запрос"})

    for pth, pgi in pages.items():
        pgi["in_navigation"] = pth in nav_links

    # External links found on the site + off-site demos/repos.
    ext = sorted(h for h in anchors if urlparse(h).netloc and urlparse(h).netloc != urlparse(BASE_URL).netloc)
    links = []
    for h in ext + OFF_SITE:
        r = http_check(h)
        body = r.pop("_body", "")
        r["linked_from_site"] = h in anchors
        r["found_on"] = sorted(anchors.get(h, []))
        # Telegram/MAX answer 200 even for dead handles — look at the body.
        if "t.me/" in h:
            r["telegram_profile_ok"] = "tgme_page_title" in body
        if "max.ru/" in h:
            r["max_title"] = body.split("<title>")[1].split("</title>")[0][:120] if "<title>" in body else None
        links.append(r)
    broken = [l for l in links if not l.get("status") or l["status"] >= 400 or l.get("telegram_profile_ok") is False]

    save_json("pages.json", {"base": BASE_URL, "pages": pages, "service_files": service,
                             "click_only_pages": click_found, "click_failed": click_failed, "nav_link_paths": sorted(nav_links)})
    save_json("links.json", links)
    save_json("broken_links.json", broken)
    print(f"pages: {len(pages)}, external links: {len(links)}, broken: {len(broken)}")


if __name__ == "__main__":
    main()
