"""Public repositories behind the portfolio (GitHub API, unauthenticated,
≤ 1 req/s): description, homepage, last push, README size and whether the
README links a playable build / store page. Output: data/repos_check.json
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import polite, save_json  # noqa: E402

REPOS = ["lending2", "slovokhod-vk", "catnonogram-vk", "Color_Sort-Vk", "lane-battle-vk",
         "Royal_solitaire", "hp100-live-feed", "games-dev", "Fanatat", "lending1", "garden_clicker_vk"]


def get(u: str, raw: bool = False):
    polite()
    req = urllib.request.Request(u, headers={"User-Agent": "portfolio-audit", "Accept": "application/vnd.github.raw" if raw else "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read().decode("utf-8", "replace")
            return data if raw else json.loads(data)
    except Exception as e:  # noqa: BLE001
        return {"error": str(e)[:150]}


def main():
    out = []
    for name in REPOS:
        meta = get(f"https://api.github.com/repos/Fanatat/{name}")
        readme = get(f"https://api.github.com/repos/Fanatat/{name}/readme", raw=True)
        rec = {"repo": name}
        if isinstance(meta, dict) and "error" not in meta:
            rec.update({k: meta.get(k) for k in ("description", "homepage", "pushed_at", "created_at", "stargazers_count", "default_branch", "license")})
            rec["license"] = (meta.get("license") or {}).get("spdx_id")
        else:
            rec["meta_error"] = meta
        if isinstance(readme, str):
            rec["readme_chars"] = len(readme)
            rec["readme_links"] = sorted(set(re.findall(r"https?://[^\s)\]>\"']+", readme)))[:25]
            rec["readme_mentions_ai"] = bool(re.search(r"Claude|ИИ|нейросет|AI agent|LLM|агент", readme, re.I))
            rec["readme_head"] = readme[:400]
        else:
            rec["readme"] = "missing" if isinstance(readme, dict) else None
        out.append(rec)
    save_json("repos_check.json", out)
    for r in out:
        print(r["repo"], r.get("readme_chars"), r.get("homepage"), [l for l in r.get("readme_links", []) if "vk.com" in l or "yandex" in l])


if __name__ == "__main__":
    main()
