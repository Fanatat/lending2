"""Every file path cited in the audit markdown must exist.

Scans audit/*.md and audit/reports/*.md for paths like `screenshots/...png`,
`data/...json`, `scripts/...py` (relative to audit/) and repo paths like
`components/Foo.tsx:12` (relative to the repo root, line suffix stripped,
line number checked against the file length). Exit code 1 if anything is missing.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import AUDIT_DIR, REPO_DIR  # noqa: E402

AUDIT_PREFIXES = ("screenshots/", "data/", "scripts/", "reports/")
REPO_PREFIXES = ("app/", "components/", "lib/", "public/", "hooks/", "styles/", "store/", "types/")
PATH_RE = re.compile(r"`([A-Za-z0-9_./\-\[\]]+\.(?:png|json|txt|py|md|tsx|ts|js|mjs|css|json|mp3))((?::\d+(?:-\d+)?)(?:,\d+(?:-\d+)?)*)?`")


def main():
    missing, checked = [], 0
    mds = sorted(AUDIT_DIR.glob("*.md")) + sorted((AUDIT_DIR / "reports").glob("*.md"))
    for md in mds:
        for m in PATH_RE.finditer(md.read_text()):
            p, lines = m.group(1), m.group(2)
            p = p.removeprefix("audit/")
            if p.startswith("/"):
                continue  # URL path on the site, not a file
            if p.startswith(AUDIT_PREFIXES) or p in ("inventory.md", "SUMMARY.md", "README.md", "run_all.py", "package.json"):
                f = AUDIT_DIR / p
            elif p.startswith(REPO_PREFIXES) or "/" not in p:
                f = REPO_DIR / p
                if "/" not in p and not f.exists():
                    continue  # bare file name mentioned in prose, not a path
            else:
                f = REPO_DIR / p
            checked += 1
            if not f.exists():
                missing.append(f"{md.name}: {p}")
                continue
            if lines and f.suffix in (".tsx", ".ts", ".js", ".mjs", ".css", ".py"):
                n = len(f.read_text(errors="replace").splitlines())
                for num in re.findall(r"\d+", lines):
                    if int(num) > n:
                        missing.append(f"{md.name}: {p}{lines} (file has {n} lines)")
                        break
    print(f"checked {checked} path references in {len(mds)} files")
    for x in missing:
        print("MISSING", x)
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()
