"""Block 3: visitor scenarios, desktop + phone, a screenshot per step.

Assumed audience (not given in the brief, derived from the content — see
inventory.md): people with a task for an automation/AI-agent producer and
recruiters (app/en/page.tsx says so). Target action: write on Telegram/MAX.

The intro is passed the way a first-time visitor would: "без звука", wait for
"Начать", press it (scenario S1 also records the "Пропустить" path).
"Time" is the mechanical minimum (automation + the site's own animations),
reading time is not simulated. External links are captured as popups and
closed without loading third-party pages further.
Output: data/scenarios.json, screenshots/scenarios/<scenario>/<viewport>/NN_step.png
"""
from __future__ import annotations

import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (DESKTOP, PHONE, attach_console, new_context, pass_intro, polite,  # noqa: E402
                    rel, save_json, shot_path, url)
from playwright.sync_api import sync_playwright  # noqa: E402


class Run:
    def __init__(self, browser, scenario: str, vp: str):
        self.ctx = new_context(browser, vp)
        self.page = self.ctx.new_page()
        self.errs: list = []
        attach_console(self.page, self.errs)
        self.scenario, self.vp = scenario, vp
        self.steps: list = []
        self.actions = 0
        self.t0 = time.monotonic()
        self.ok = True
        self.note = None

    def step(self, name: str, action: bool = True, **data):
        if action:
            self.actions += 1
        n = len(self.steps) + 1
        p = shot_path("scenarios", self.scenario, self.vp, f"{n:02d}_{re.sub(r'[^a-z0-9]+', '_', name.lower())[:40]}.png")
        try:
            self.page.screenshot(path=p)
            shot = rel(p)
        except Exception:  # noqa: BLE001
            shot = None
        self.steps.append({"n": n, "step": name, "t_s": round(time.monotonic() - self.t0, 1),
                           "actions_so_far": self.actions, "url": self.page.url, "screenshot": shot, **data})

    def fail(self, why: str):
        self.ok = False
        self.note = why
        self.step("FAIL: " + why[:60], action=False)

    def goto(self, path: str):
        polite()
        self.page.goto(url(path), wait_until="domcontentloaded")
        self.step(f"open {path}", action=True)

    def intro(self, how="silent"):
        r = pass_intro(self.page, how)
        self.page.wait_for_timeout(1500)
        self.step(f"intro passed ({how})", action=True if how == "skip" else False, intro=r)
        if how == "silent":
            self.actions += 2  # "без звука" + "Начать"
        return r

    def scroll_to(self, locator, name: str):
        """Scroll with the wheel until the element is in view; count screens."""
        vh = self.page.viewport_size["height"]
        start_y = self.page.evaluate("scrollY")
        wheel = 0
        for _ in range(200):
            box = locator.bounding_box()
            if box and 0 <= box["y"] < vh - 60:
                break
            self.page.mouse.wheel(0, vh * 0.8)
            wheel += 1
            self.page.wait_for_timeout(250)
        self.actions += wheel
        dist = self.page.evaluate("scrollY") - start_y
        self.page.wait_for_timeout(800)
        self.step(name, action=False, wheel_scrolls=wheel, scrolled_px=dist, screens=round(dist / vh, 1))
        return wheel

    def click_external(self, locator, name: str):
        with self.ctx.expect_page(timeout=8000) as pinfo:
            locator.click()
        pop = pinfo.value
        dest = pop.url
        pop.close()
        self.step(name, action=True, opened_in_new_tab=True, destination=dest)
        return dest

    def result(self):
        self.ctx.close()
        return {"scenario": self.scenario, "viewport": self.vp, "reached_goal": self.ok, "note": self.note,
                "actions": self.actions, "time_s": round(time.monotonic() - self.t0, 1), "steps": self.steps,
                "console_errors": [e for e in self.errs if e["kind"] == "pageerror" or e.get("type") == "error"][:20]}


def tg_link(page):
    return page.get_by_role("link", name=re.compile(r"Написать в ТГ|Message on Telegram"))


def s1_client(r: Run):
    """Home → who is the author → open a project → back → Telegram."""
    r.goto("/")
    r.intro("silent")
    op = r.page.locator("#operator h2")
    r.scroll_to(op, "found 'КТО ЗА ПУЛЬТОМ' block")
    card = r.page.locator("[role=button][aria-label*='HP100']").first
    r.scroll_to(card, "HP100 card in view")
    card.click()
    r.page.wait_for_url("**/projects/hp100**", timeout=10000)
    r.page.wait_for_timeout(1500)
    r.step("project page HP100 opened")
    has_contact = tg_link(r.page).count()
    r.steps[-1]["contact_on_project_page"] = bool(has_contact)
    y_before = None
    r.page.get_by_role("button", name=re.compile("на дашборд")).click()
    r.page.wait_for_timeout(2500)
    y_after = r.page.evaluate("scrollY")
    hp = r.page.evaluate("document.getElementById('hp100')?.getBoundingClientRect().top")
    r.step("back to dashboard", intro_replayed=r.page.locator(".intro-gate, .intro-welcome").count() > 0,
           scroll_y=y_after, hp100_section_top_px=hp, y_before=y_before)
    link = tg_link(r.page)
    r.scroll_to(link, "Telegram button in view")
    r.click_external(link, "click 'Написать в ТГ'")


def s2_contact(r: Run):
    """Home → wants to write right away → finds contact."""
    r.goto("/")
    r.intro("skip")
    # Is there any contact on the first screen?
    vis = r.page.evaluate("""() => [...document.querySelectorAll('a[href]')].filter(a => {
        const b = a.getBoundingClientRect(); return b.top < innerHeight && b.bottom > 0 && b.width > 0;
    }).map(a => a.href)""")
    r.step("first screen links", action=False, links_on_first_screen=vis)
    link = tg_link(r.page)
    r.scroll_to(link, "scrolled to contact")
    r.click_external(link, "click 'Написать в ТГ'")


def s3_recruiter(r: Run):
    """/en → who → GitHub → back → Telegram."""
    r.goto("/en")
    r.intro("silent")
    gh = r.page.get_by_role("link", name="GitHub").first
    r.scroll_to(gh, "GitHub link in view")
    dest = r.click_external(gh, "click GitHub")
    r.steps[-1]["note"] = "ведёт на профиль, не на репозиторий конкретного проекта" if dest.rstrip("/").endswith("Fanatat") else None
    link = tg_link(r.page)
    r.scroll_to(link, "Telegram button in view")
    r.click_external(link, "click 'Message on Telegram'")


def s4_shared_project(r: Run):
    """Arrives on a shared project link → understands → looks for the author's contact."""
    r.goto("/projects/hp100")
    intro = r.intro("silent")
    r.step("project first screen", action=False, intro=intro)
    if tg_link(r.page).count() == 0:
        r.step("no contact on project page", action=False)
    r.page.get_by_role("button", name=re.compile("на дашборд")).click()
    r.page.wait_for_timeout(2500)
    r.step("went to dashboard", intro_replayed=r.page.locator(".intro-gate").count() > 0)
    link = tg_link(r.page)
    r.scroll_to(link, "Telegram button in view")
    r.click_external(link, "click 'Написать в ТГ'")


def s5_play_game(r: Run):
    """Home → studio «Пятница» → wants to play one of the five games."""
    r.goto("/")
    r.intro("skip")
    sec = r.page.locator("#friday-studio")
    r.scroll_to(sec, "Friday studio section")
    cart = r.page.locator("#friday-studio [role=button]").first
    label = cart.get_attribute("aria-label")
    cart.click()
    r.page.wait_for_url("**/projects/**", timeout=10000)
    r.page.wait_for_timeout(2000)
    r.step("clicked game cartridge", clicked=label, landed=r.page.url)
    ext = r.page.evaluate("""() => [...document.querySelectorAll('a[href]')].map(a => a.href)
        .filter(h => !h.includes(location.host))""")
    game_links = [h for h in ext if re.search(r"vk\.com|yandex|vercel\.app|github\.io|crazygames", h)]
    r.step("look for a playable game link", action=False, external_links=ext, game_links=game_links)
    if not game_links:
        r.fail("на странице студии нет ни одной ссылки на игру (ни ВК, ни Яндекс, ни демо)")


SCENARIOS = {
    "S1_client_home_project_contact": s1_client,
    "S2_contact_right_away": s2_contact,
    "S3_recruiter_en_github_contact": s3_recruiter,
    "S4_shared_project_link": s4_shared_project,
    "S5_play_a_game": s5_play_game,
}


def main():
    out = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for name, fn in SCENARIOS.items():
            for vp in (DESKTOP, PHONE):
                print("scenario", name, vp, flush=True)
                r = Run(b, name, vp)
                try:
                    fn(r)
                except Exception as e:  # noqa: BLE001
                    r.fail(f"{type(e).__name__}: {str(e)[:200]}")
                out.append(r.result())
                save_json("scenarios.json", out)
        # The skip path for S1 — how fast can a visitor who notices "Пропустить" get in.
        for vp in (DESKTOP, PHONE):
            r = Run(b, "S1b_intro_skip_timing", vp)
            r.goto("/")
            r.intro("skip")
            out.append(r.result())
        save_json("scenarios.json", out)
        b.close()


if __name__ == "__main__":
    main()
