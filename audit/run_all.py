#!/usr/bin/env python3
"""Run the whole audit: python3 audit/run_all.py [--only name,name] [--skip name,name]

Steps (in order): code_scan, crawl, hosts, repos, lighthouse, page_metrics, projects,
scenarios, explore, a11y, sound, evidence, check (every file cited in the
reports exists). Each writes JSON to audit/data/ and screenshots to
audit/screenshots/. See audit/README.md.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
STEPS = {
    "code_scan": "scripts/code_scan.py",
    "crawl": "scripts/crawl.py",
    "hosts": "scripts/hosts_check.py",
    "repos": "scripts/repos_check.py",
    "lighthouse": "scripts/lighthouse_runs.py",
    "page_metrics": "scripts/page_metrics.py",
    "projects": "scripts/projects_check.py",
    "scenarios": "scripts/scenarios.py",
    "explore": "scripts/explore.py",
    "a11y": "scripts/a11y.py",
    "sound": "scripts/sound_check.py",
    "evidence": "scripts/evidence_shots.py",
    "check": "scripts/check_evidence.py",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--skip", default="")
    a = ap.parse_args()
    only = [s for s in a.only.split(",") if s]
    skip = {s for s in a.skip.split(",") if s}
    failed = []
    for name, script in STEPS.items():
        if (only and name not in only) or name in skip:
            continue
        t = time.monotonic()
        print(f"=== {name}", flush=True)
        r = subprocess.run([sys.executable, str(HERE / script)], cwd=HERE.parent)
        print(f"=== {name}: exit {r.returncode}, {round(time.monotonic() - t)} s", flush=True)
        if r.returncode:
            failed.append(name)
    if failed:
        print("failed steps:", ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
