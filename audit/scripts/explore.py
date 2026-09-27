"""Block 3 extras:
  1. "Lost visitor": 50 clicks on random visible interactive elements from the
     home page (fixed seed). Records dead clicks (nothing changed), dead ends
     (page with no way home and no contact), errors, external links that
     replace the site in the same tab, blocking overlays.
  2. Card round-trip: open every project card on the dashboard, go back with
     the browser Back button and with the page's own "← на дашборд" button;
     records whether the scroll position survives and whether the intro
     replays.
  3. Slow network (Slow 4G: 150 ms RTT, 1.6 Mbps down, 0.75 Mbps up, CPU 4x):
     screenshots at 0.5/1/2/3/6 s on the home page and on the heaviest demo.
  4. The only form on the site (chat with an agent on /projects/staff):
     empty submit, long input, what is kept.
Output: data/lost_visitor.json, data/card_roundtrip.json, data/slow_network.json,
data/form_check.json, screenshots/lost_visitor/, screenshots/slow_network/
"""
from __future__ import annotations

import random
import re
import shutil
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (BASE_URL, DESKTOP, PHONE, attach_console, new_context, pass_intro,  # noqa: E402
                    polite, rel, save_json, shot_path, url)
from playwright.sync_api import sync_playwright  # noqa: E402

SEED = 20260927
CLICKS = 50

CANDIDATES_JS = r"""
() => {
  const els = [...document.querySelectorAll('a[href], button, [role=button], summary, [data-cursor=interactive], [tabindex]:not([tabindex="-1"])')];
  const out = [];
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    if (r.width < 2 || r.height < 2 || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return;
    if (el.disabled) return;
    el.setAttribute('data-audit-id', String(i));
    out.push({id: String(i), tag: el.tagName.toLowerCase(), href: el.getAttribute('href'), target: el.getAttribute('target'),
      text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60)});
  });
  return out;
}
"""

# Continuous background animations (particles, counters, typewriter) mutate
# the DOM all the time, so "something mutated" is no signal. A click counts as
# live if the URL, scroll, number of visible elements, ARIA/<details> state or
# the visible text (digits stripped: animated counters) changed, or a tab opened.
STATE_JS = r"""
() => {
  const vis = [...document.body.querySelectorAll('*')].filter(e => {
    const s = getComputedStyle(e);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
    const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0;
  }).length;
  const aria = [...document.querySelectorAll('[aria-expanded],[aria-pressed],[aria-checked],details')]
    .map(e => (e.getAttribute('aria-expanded') || '') + (e.getAttribute('aria-pressed') || '') + (e.open ? 'o' : '')).join('');
  const t = document.body.innerText.replace(/[0-9]/g, '');
  let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  // Blocking overlay: what receives a click in the middle of the screen.
  let el = document.elementFromPoint(innerWidth / 2, innerHeight / 2), overlay = null;
  while (el && el !== document.body) {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    if (s.position === 'fixed' && r.width >= innerWidth * 0.8 && r.height >= innerHeight * 0.8) {
      overlay = el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0, 3).join('.') + ' «' + el.innerText.trim().slice(0, 60) + '»';
      break;
    }
    el = el.parentElement;
  }
  return {url: location.href, y: Math.round(scrollY), vis, aria, text: h, overlay};
}
"""


def lost_visitor(browser, vp: str) -> dict:
    # Screenshots are taken only for suspicious clicks; drop the previous
    # run's files so the folder matches data/lost_visitor.json.
    shutil.rmtree(shot_path("lost_visitor", vp, "x").parent, ignore_errors=True)
    rnd = random.Random(SEED)
    ctx = new_context(browser, vp)
    page = ctx.new_page()
    errs: list = []
    attach_console(page, errs)
    polite()
    page.goto(url("/"), wait_until="domcontentloaded")
    pass_intro(page, "skip")
    page.wait_for_timeout(2500)
    log = []
    for i in range(CLICKS):
        # Wander: sometimes scroll a random amount first, like a visitor would.
        if rnd.random() < 0.6:
            page.mouse.wheel(0, rnd.randint(-600, 2200))
            page.wait_for_timeout(400)
        cands = page.evaluate(CANDIDATES_JS)
        if not cands:
            log.append({"i": i, "event": "no interactive elements on screen", "url": page.url})
            page.mouse.wheel(0, 900)
            continue
        c = rnd.choice(cands)
        # Control: the same wait without a click tells whether the page text
        # changes on its own (typewriter/tickers); then text is not a signal.
        ctrl0 = page.evaluate(STATE_JS)
        page.wait_for_timeout(900)
        before = page.evaluate(STATE_JS)
        text_is_signal = ctrl0["text"] == before["text"] and ctrl0["vis"] == before["vis"]
        n_err0 = len(errs)
        entry = {"i": i, "el": c, "url_before": before["url"]}
        popup = None
        try:
            with ctx.expect_page(timeout=1500) as pinfo:
                page.locator(f'[data-audit-id="{c["id"]}"]').first.click(timeout=3000)
            popup = pinfo.value
        except Exception as e:  # noqa: BLE001 — "no popup" timeout is the normal case
            if "Locator.click" in str(e):
                entry["click_error"] = str(e)[:160]
        page.wait_for_timeout(900)
        if popup:
            entry["opened_new_tab"] = popup.url
            popup.close()
        try:
            after = page.evaluate(STATE_JS)
        except Exception:  # noqa: BLE001 — navigated mid-evaluate
            page.wait_for_load_state("domcontentloaded")
            after = page.evaluate(STATE_JS)
        entry.update({"url_after": after["url"], "scroll_delta": after["y"] - before["y"],
                      "visible_elements_delta": after["vis"] - before["vis"],
                      "aria_state_changed": after["aria"] != before["aria"], "text_changed": after["text"] != before["text"],
                      "new_errors": [e for e in errs[n_err0:] if e["kind"] == "pageerror" or e.get("type") == "error"][:3],
                      "fullscreen_overlay": after["overlay"]})
        left_site = not after["url"].startswith(BASE_URL)
        if left_site:
            entry["left_site_same_tab"] = after["url"]
            page.go_back()
            page.wait_for_timeout(1500)
        elif after["url"] != before["url"]:
            entry["navigated"] = True
            # Dead-end check on the new page.
            entry["page_has_way_home"] = page.evaluate("""() => [...document.querySelectorAll('a[href],button')].some(e =>
                /дашборд|RU|главн|home/i.test(e.innerText) || (e.getAttribute('href')||'') === '/')""")
            entry["page_has_contact"] = page.evaluate("() => !!document.querySelector('a[href*=\"t.me\"], a[href*=\"max.ru\"]')")
            if page.locator(".intro-gate").count():
                entry["intro_replayed"] = True
                pass_intro(page, "skip")
        dead = (not popup and after["url"] == before["url"] and abs(after["y"] - before["y"]) < 5
                and after["aria"] == before["aria"]
                and (not text_is_signal or (after["vis"] == before["vis"] and after["text"] == before["text"])))
        entry["control_page_static"] = text_is_signal
        entry["dead_click"] = dead
        if dead or entry.get("fullscreen_overlay") or entry.get("new_errors") or entry.get("left_site_same_tab"):
            p = shot_path("lost_visitor", vp, f"{i:02d}.png")
            page.screenshot(path=p)
            entry["screenshot"] = rel(p)
        # Escape any modal/overlay the way a visitor would.
        if entry.get("fullscreen_overlay"):
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
        log.append(entry)
    final = shot_path("lost_visitor", vp, "final.png")
    page.screenshot(path=final)
    ctx.close()
    summary = {
        "clicks": len(log),
        "dead_clicks": sum(1 for e in log if e.get("dead_click")),
        "navigations": sum(1 for e in log if e.get("navigated")),
        "new_tabs": sum(1 for e in log if e.get("opened_new_tab")),
        "left_site_same_tab": sum(1 for e in log if e.get("left_site_same_tab")),
        "clicks_with_errors": sum(1 for e in log if e.get("new_errors")),
        "fullscreen_overlays": sum(1 for e in log if e.get("fullscreen_overlay")),
        "dead_ends": [e for e in log if e.get("navigated") and not e.get("page_has_way_home")],
        "pages_without_contact": sorted({e["url_after"] for e in log if e.get("navigated") and not e.get("page_has_contact")}),
    }
    return {"viewport": vp, "seed": SEED, "summary": summary, "log": log,
            "all_errors": [e for e in errs if e["kind"] == "pageerror" or e.get("type") == "error"][:30],
            "final_screenshot": rel(final)}


def card_roundtrip(browser, vp: str) -> list:
    out = []
    ctx = new_context(browser, vp)
    page = ctx.new_page()
    polite()
    page.goto(url("/"), wait_until="domcontentloaded")
    pass_intro(page, "skip")
    page.wait_for_timeout(2000)
    cards = page.evaluate("""[...document.querySelectorAll('[role=button][aria-label^="Открыть проект"]')].map(e => {
        const r = e.getBoundingClientRect(), s = getComputedStyle(e);
        return [e.getAttribute('aria-label'), r.width > 0 && r.height > 0 && s.visibility !== 'hidden'];})""")
    for label, visible in cards:
        rec = {"card": label}
        if not visible:
            rec["hidden_on_dashboard"] = True  # the «Мост» easter egg: in the DOM, not shown
            out.append(rec)
            continue
        try:
            el = page.locator(f'[role=button][aria-label="{label}"]').first
            el.scroll_into_view_if_needed(timeout=5000)
            page.wait_for_timeout(600)
            y0 = page.evaluate("scrollY")
            rec["scroll_y_before"] = y0
            t = time.monotonic()
            el.click()
            page.wait_for_url("**/projects/**", timeout=10000)
            rec["dest"] = page.url.replace(BASE_URL, "")
            rec["click_to_route_ms"] = round((time.monotonic() - t) * 1000)
            page.wait_for_timeout(1500)
            page.go_back()
            page.wait_for_timeout(2500)
            rec["browser_back_url"] = page.url.replace(BASE_URL, "")
            rec["browser_back_scroll_y"] = page.evaluate("scrollY")
            rec["browser_back_intro_replayed"] = page.locator(".intro-gate").count() > 0
            rec["browser_back_position_kept"] = abs(rec["browser_back_scroll_y"] - y0) < 300
            if rec["browser_back_intro_replayed"]:
                pass_intro(page, "skip")
            # Same again with the page's own back button.
            el = page.locator(f'[role=button][aria-label="{label}"]').first
            el.scroll_into_view_if_needed(timeout=5000)
            page.wait_for_timeout(500)
            y0 = page.evaluate("scrollY")
            el.click()
            page.wait_for_url("**/projects/**", timeout=10000)
            page.wait_for_timeout(1200)
            page.get_by_role("button", name=re.compile("на дашборд")).click()
            page.wait_for_timeout(2500)
            rec["own_back_url"] = page.url.replace(BASE_URL, "")
            rec["own_back_scroll_y"] = page.evaluate("scrollY")
            rec["own_back_lands_on_section"] = abs(page.evaluate(
                "(() => { const id = location.hash.slice(1); const e = id && document.getElementById(id); return e ? e.getBoundingClientRect().top : 9999; })()")) < 250
        except Exception as e:  # noqa: BLE001
            rec["error"] = str(e)[:200]
        out.append(rec)
    ctx.close()
    return out


def slow_network(browser) -> list:
    out = []
    targets = [("/", "home"), ("/projects/friday-studio", "friday"),
               ("https://fanatat.github.io/games-dev/royal-solitaire/", "royal_solitaire_demo")]
    for vp in (PHONE, DESKTOP):
        for target, tag in targets:
            ctx = new_context(browser, vp)
            page = ctx.new_page()
            cdp = ctx.new_cdp_session(page)
            cdp.send("Network.enable")
            cdp.send("Network.emulateNetworkConditions", {"offline": False, "latency": 150,
                     "downloadThroughput": 1.6 * 1024 * 1024 / 8, "uploadThroughput": 750 * 1024 / 8})
            cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
            full = target if target.startswith("http") else url(target)
            polite()
            t0 = time.monotonic()
            page.goto(full, wait_until="commit")
            shots = []
            for s in (0.5, 1, 2, 3, 6):
                while time.monotonic() - t0 < s:
                    time.sleep(0.05)
                p = shot_path("slow_network", vp, f"{tag}_{s}s.png")
                try:
                    page.screenshot(path=p, timeout=5000)
                    txt = page.evaluate("document.body ? document.body.innerText.trim().slice(0, 160) : ''")
                    shots.append({"t_s": s, "screenshot": rel(p), "visible_text": txt})
                except Exception as e:  # noqa: BLE001 — nothing painted yet is itself the result
                    shots.append({"t_s": s, "screenshot": None, "note": f"nothing painted yet: {str(e)[:80]}"})
            try:
                page.wait_for_load_state("load", timeout=60000)
                load_s = round(time.monotonic() - t0, 1)
            except Exception:  # noqa: BLE001
                load_s = None
            gate_ready = None
            if tag == "home":
                try:
                    page.locator("button.intro-gate-secondary").click(timeout=30000)
                    t1 = time.monotonic()
                    page.get_by_role("button", name=re.compile(r"^(Начать|Start)$")).wait_for(state="visible", timeout=90000)
                    gate_ready = round(time.monotonic() - t1, 1)
                except Exception:  # noqa: BLE001
                    gate_ready = "not reached in 90 s"
            ctx.close()
            skip_asap = None
            if tag == "home":
                # A visitor who presses "Пропустить" as soon as it is painted:
                # clicks before hydration are ignored — count them.
                ctx = new_context(browser, vp)
                page = ctx.new_page()
                cdp = ctx.new_cdp_session(page)
                cdp.send("Network.enable")
                cdp.send("Network.emulateNetworkConditions", {"offline": False, "latency": 150,
                         "downloadThroughput": 1.6 * 1024 * 1024 / 8, "uploadThroughput": 750 * 1024 / 8})
                cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
                polite()
                t0 = time.monotonic()
                page.goto(full, wait_until="commit")
                page.locator("button.intro-skip").first.wait_for(state="visible", timeout=60000)
                painted = round(time.monotonic() - t0, 1)
                r = pass_intro(page, "skip", timeout_ms=60000)
                skip_asap = {"skip_button_painted_s": painted, "clicks_ignored_before_hydration": r.get("ignored_attempts"),
                             "site_visible_s": round(time.monotonic() - t0, 1), "passed": r.get("passed")}
                ctx.close()
            out.append({"viewport": vp, "target": full, "load_event_s": load_s, "shots": shots,
                        "silent_intro_to_start_button_s": gate_ready, "skip_as_soon_as_visible": skip_asap})
    return out


def form_check(browser) -> list:
    out = []
    for vp in (DESKTOP, PHONE):
        ctx = new_context(browser, vp)
        page = ctx.new_page()
        polite()
        page.goto(url("/projects/staff"), wait_until="domcontentloaded")
        pass_intro(page, "skip")
        page.wait_for_timeout(2000)
        rec = {"viewport": vp, "forms_on_page": page.locator("form").count()}
        inp = page.locator("form input").first
        if not rec["forms_on_page"]:
            # The chat opens from an agent avatar.
            cards = page.locator("[role=button][aria-label^='Открыть чат']")
            rec["agent_buttons"] = cards.count()
            if cards.count():
                cards.first.click()
                page.wait_for_timeout(1200)
                rec["forms_after_open"] = page.locator("form").count()
        if page.locator("form").count():
            inp = page.locator("form input").first
            rec["placeholder"] = inp.get_attribute("placeholder")
            rec["maxlength"] = inp.get_attribute("maxlength")
            n0 = page.locator("form").first.evaluate("f => f.parentElement.innerText.length")
            page.locator("form").first.evaluate("f => f.requestSubmit()")
            page.wait_for_timeout(1200)
            rec["empty_submit_text_delta"] = page.locator("form").first.evaluate("f => f.parentElement.innerText.length") - n0
            long = "проверка " * 200
            inp.fill(long)
            rec["long_input_kept_chars"] = len(inp.input_value())
            inp.press("Enter")
            page.wait_for_timeout(3000)
            rec["after_long_submit_input_value_len"] = len(inp.input_value())
            p = shot_path("form", vp, "after_long_submit.png")
            page.screenshot(path=p)
            rec["screenshot"] = rel(p)
            inp.fill("<b>html?</b>")
            inp.press("Enter")
            page.wait_for_timeout(2500)
            rec["html_rendered_as_markup"] = page.locator("form").first.evaluate(
                "f => !!f.parentElement.querySelector('b')")
        out.append(rec)
        ctx.close()
    return out


def main():
    parts = sys.argv[1].split(",") if len(sys.argv) > 1 else ["lost", "cards", "form", "slow"]
    with sync_playwright() as p:
        b = p.chromium.launch()
        if "lost" in parts:
            print("lost visitor", flush=True)
            save_json("lost_visitor.json", [lost_visitor(b, DESKTOP), lost_visitor(b, PHONE)])
        if "cards" in parts:
            print("card round-trip", flush=True)
            save_json("card_roundtrip.json", {DESKTOP: card_roundtrip(b, DESKTOP), PHONE: card_roundtrip(b, PHONE)})
        if "form" in parts:
            print("form", flush=True)
            save_json("form_check.json", form_check(b))
        if "slow" in parts:
            print("slow network", flush=True)
            save_json("slow_network.json", {"conditions": "Slow 4G: RTT 150 ms, 1.6 Mbps down, 0.75 Mbps up, CPU 4x (CDP)",
                                        "runs": slow_network(b)})
        b.close()


if __name__ == "__main__":
    main()
