#!/usr/bin/env python3
"""Static code scan of the portfolio repo (read-only).

Run from the worktree root:  python3 audit/scripts/code_scan.py
Writes audit/data/code_scan.json. Stdlib only. Deterministic output
(no timestamps; the scanned git HEAD is recorded instead), so re-runs on the
same commit produce the same JSON.

Optional: typecheck/lint run only if a node_modules with .bin/tsc / .bin/eslint
is found (env AUDIT_NODE_MODULES, <repo>/node_modules, or the main checkout's
node_modules). Otherwise they are recorded as "skipped: <reason>".
Nothing in the repo is modified; git is only used via read-only commands.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

AUDIT_DIR = Path(__file__).resolve().parent.parent
REPO = AUDIT_DIR.parent
OUT = AUDIT_DIR / "data" / "code_scan.json"

CODE_EXT = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
STYLE_EXT = {".css"}
TEXT_EXT = CODE_EXT | STYLE_EXT | {".json", ".md", ".yml", ".yaml", ".txt", ".example", ".html", ".svg"}
RESOLVE_EXT = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", "/index.js"]
HEAVY_LIBS = ["three", "framer-motion", "lenis", "zustand"]


# ----------------------------------------------------------------- helpers
def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(REPO), *args], capture_output=True, text=True, check=False).stdout


def tracked_files() -> list[str]:
    out = subprocess.run(["git", "-C", str(REPO), "ls-files", "-z"], capture_output=True, check=True).stdout
    files = [f for f in out.decode("utf-8").split("\0") if f]
    return sorted(f for f in files if not f.startswith("audit/"))


def read(rel: str) -> str:
    try:
        return (REPO / rel).read_text(encoding="utf-8")
    except (UnicodeDecodeError, FileNotFoundError, IsADirectoryError):
        return ""


def is_text(rel: str) -> bool:
    p = Path(rel)
    return p.suffix in TEXT_EXT or p.name.startswith(".") or p.suffix == ""


def dir_key(rel: str, depth: int = 1) -> str:
    parts = rel.split("/")
    if len(parts) == 1:
        return "(root)"
    return "/".join(parts[: min(depth, len(parts) - 1)])


def mask(s: str) -> str:
    if len(s) <= 6:
        return "***"
    return s[:3] + "*" * (len(s) - 5) + s[-2:]


# ------------------------------------------------- line classification
def classify_lines(text: str, ext: str):
    """Return list of (kind, stripped) per line; kind in blank/comment/code/mixed.

    Light state machine: tracks /* */ blocks and template literals across
    lines, ignores // and /* inside quotes. Good enough for stats.
    """
    res = []
    in_block = False
    in_tpl = False
    css = ext in STYLE_EXT
    for raw in text.split("\n"):
        s = raw.strip()
        if not s and not in_block:
            res.append(("blank", s))
            continue
        has_code = False
        has_comment = in_block
        i, n = 0, len(raw)
        quote = None
        while i < n:
            c = raw[i]
            two = raw[i : i + 2]
            if in_block:
                if two == "*/":
                    in_block = False
                    i += 2
                    continue
                i += 1
                continue
            if in_tpl:
                has_code = True
                if c == "\\":
                    i += 2
                    continue
                if c == "`":
                    in_tpl = False
                i += 1
                continue
            if quote:
                if c == "\\":
                    i += 2
                    continue
                if c == quote:
                    quote = None
                i += 1
                continue
            if two == "/*":
                has_comment = True
                in_block = True
                i += 2
                continue
            if two == "//" and not css and (i == 0 or raw[i - 1] != ":"):
                has_comment = True
                break
            if c in "\"'" and not css:
                quote = c
                has_code = True
            elif c == "`" and not css:
                in_tpl = True
                has_code = True
            elif not c.isspace():
                # JSX comment wrapper braces `{/* ... */}` are not code
                if not (c in "{}" and (raw[i + 1 : i + 3] == "/*" or raw[max(0, i - 2) : i] == "*/")):
                    has_code = True
            i += 1
        if has_code and has_comment:
            res.append(("mixed", s))
        elif has_code:
            res.append(("code", s))
        elif has_comment:
            res.append(("comment", s))
        else:
            res.append(("blank", s))
    return res


# ------------------------------------------------------------ imports
IMPORT_RES = [
    re.compile(r"""^\s*import\s+(?P<clause>[\s\S]*?)\s+from\s+['"](?P<spec>[^'"]+)['"]""", re.M),
    re.compile(r"""^\s*import\s+['"](?P<spec>[^'"]+)['"]""", re.M),
    re.compile(r"""^\s*export\s+(?P<clause>(?:type\s+)?\{[\s\S]*?\}|\*(?:\s+as\s+\w+)?)\s+from\s+['"](?P<spec>[^'"]+)['"]""", re.M),
    re.compile(r"""\bimport\(\s*['"](?P<spec>[^'"]+)['"]\s*\)"""),
    re.compile(r"""\brequire\(\s*['"](?P<spec>[^'"]+)['"]\s*\)"""),
    re.compile(r"""@import\s+(?:url\()?['"](?P<spec>[^'"]+)['"]"""),
]


def parse_clause(clause: str | None) -> set[str]:
    """Names imported by an import clause. '*' = namespace/all, 'default'."""
    if clause is None:
        return {"*"}  # side-effect / dynamic import: treat as using everything
    clause = re.sub(r"^type\s+", "", clause.strip())
    names: set[str] = set()
    if clause.startswith("*"):
        return {"*"}
    m = re.search(r"\{([\s\S]*)\}", clause)
    head = clause[: m.start()] if m else clause
    head = head.strip().rstrip(",").strip()
    if head and not head.startswith("{"):
        if head.startswith("* as"):
            names.add("*")
        else:
            names.add("default")
    if m:
        for part in m.group(1).split(","):
            part = re.sub(r"^\s*type\s+", "", part).strip()
            if not part:
                continue
            names.add(part.split(" as ")[0].strip())
    if "* as" in clause:
        names.add("*")
    return names


def resolve(spec: str, importer: str, fileset: set[str]) -> str | None:
    if spec.startswith("@/"):
        base = spec[2:]
    elif spec.startswith("."):
        base = os.path.normpath(os.path.join(os.path.dirname(importer), spec))
    else:
        return None
    for ext in RESOLVE_EXT:
        cand = base + ext
        if cand in fileset:
            return cand
    return None


def collect_imports(files: list[str], fileset: set[str]):
    edges = defaultdict(set)  # target -> importers
    names_used = defaultdict(set)  # target -> names
    external = defaultdict(set)  # package -> importers
    unresolved = []
    for f in files:
        if Path(f).suffix not in CODE_EXT | STYLE_EXT:
            continue
        text = read(f)
        for rx in IMPORT_RES:
            for m in rx.finditer(text):
                spec = m.group("spec")
                clause = m.groupdict().get("clause")
                if spec.startswith(("@/", ".")):
                    tgt = resolve(spec, f, fileset)
                    if tgt:
                        edges[tgt].add(f)
                        names_used[tgt] |= parse_clause(clause)
                    else:
                        unresolved.append({"file": f, "spec": spec})
                elif not spec.startswith(("http", "data:")):
                    parts = spec.split("/")
                    pkg = "/".join(parts[:2]) if spec.startswith("@") else parts[0]
                    external[pkg].add(f)
    return edges, names_used, external, unresolved


EXPORT_DECL = re.compile(
    r"^\s*export\s+(?:declare\s+)?(?:async\s+)?(?P<kind>const|let|var|function\*?|class|type|interface|enum)\s+(?P<name>[A-Za-z_$][\w$]*)",
    re.M,
)
EXPORT_DEFAULT = re.compile(r"^\s*export\s+default\b", re.M)
EXPORT_LIST = re.compile(r"^\s*export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)", re.M)

NEXT_SPECIAL_EXPORTS = {"default", "metadata", "generateMetadata", "generateStaticParams", "viewport",
                        "dynamic", "revalidate", "runtime", "alt", "size", "contentType", "GET", "POST",
                        "dynamicParams"}


def line_of(text: str, idx: int) -> int:
    return text.count("\n", 0, idx) + 1


# --------------------------------------------------------------- main
def main() -> int:
    files = tracked_files()
    fileset = set(files)
    code_files = [f for f in files if Path(f).suffix in CODE_EXT]
    src_files = [f for f in files if Path(f).suffix in CODE_EXT | STYLE_EXT]
    texts = {f: read(f) for f in files if is_text(f)}
    result: dict = {
        "repo": str(REPO),
        "git_head": git("rev-parse", "HEAD").strip(),
        "git_branch": git("rev-parse", "--abbrev-ref", "HEAD").strip(),
        "tracked_files_total": len(files),
    }

    # ---------------- inventory
    per_dir = defaultdict(lambda: {"files": 0, "loc": 0, "bytes": 0})
    per_dir2 = defaultdict(lambda: {"files": 0, "loc": 0})
    sizes = []
    for f in files:
        p = REPO / f
        b = p.stat().st_size if p.exists() else 0
        loc = texts[f].count("\n") + (1 if texts.get(f) and not texts[f].endswith("\n") else 0) if f in texts else 0
        d = per_dir[dir_key(f)]
        d["files"] += 1
        d["loc"] += loc
        d["bytes"] += b
        d2 = per_dir2[dir_key(f, 2)]
        d2["files"] += 1
        d2["loc"] += loc
        sizes.append({"file": f, "bytes": b, "loc": loc})
    src_loc = sorted(({"file": s["file"], "loc": s["loc"]} for s in sizes if s["file"] in src_files),
                     key=lambda x: (-x["loc"], x["file"]))
    result["inventory"] = {
        "per_top_dir": dict(sorted(per_dir.items())),
        "per_second_level_dir": dict(sorted(per_dir2.items())),
        "source_files": len(src_files),
        "source_loc": sum(x["loc"] for x in src_loc),
        "largest_source_files_by_loc": src_loc[:10],
        "largest_files_by_bytes": sorted(sizes, key=lambda x: (-x["bytes"], x["file"]))[:10],
    }

    # ---------------- imports / unused modules / exports
    edges, names_used, external, unresolved = collect_imports(files, fileset)
    entry = [f for f in code_files if f.startswith("app/")] + [f for f in code_files if "/" not in f]
    reach, stack = set(), list(entry) + [f for f in files if f.startswith("app/") and f.endswith(".css")]
    fwd = defaultdict(set)
    for tgt, imps in edges.items():
        for i in imps:
            fwd[i].add(tgt)
    while stack:
        x = stack.pop()
        if x in reach:
            continue
        reach.add(x)
        stack.extend(fwd[x])
    lib_comp = [f for f in code_files if f.startswith(("components/", "lib/"))]
    result["unused_modules"] = {
        "never_imported": [f for f in lib_comp if not (edges.get(f, set()) - {f})],
        "unreachable_from_app_entrypoints": [f for f in lib_comp if f not in reach],
        "unresolved_local_imports": unresolved,
    }

    unused_exports = []
    for f in code_files:
        if f.startswith("app/") or "/" not in f:
            continue
        text = texts.get(f, "")
        exported = []
        for m in EXPORT_DECL.finditer(text):
            exported.append((m.group("name"), line_of(text, m.start()), m.group("kind")))
        for m in EXPORT_DEFAULT.finditer(text):
            exported.append(("default", line_of(text, m.start()), "default"))
        for m in EXPORT_LIST.finditer(text):
            for part in m.group(1).split(","):
                part = part.strip()
                if part:
                    exported.append((part.split(" as ")[-1].strip(), line_of(text, m.start()), "list"))
        used = names_used.get(f, set())
        if "*" in used:
            continue
        for name, ln, kind in exported:
            if name in used:
                continue
            local_uses = len(re.findall(r"\b%s\b" % re.escape(name), text)) - 1 if name != "default" else 0
            unused_exports.append({"file": f, "line": ln, "name": name, "kind": kind,
                                   "used_in_same_file": local_uses > 0})
    result["unused_exports"] = unused_exports

    # ---------------- public assets
    src_blob = "\n".join(texts[f] for f in files if f in texts and not f.startswith("public/"))
    assets = []
    for f in files:
        if not f.startswith("public/") or f.endswith(".md"):
            continue
        relp = f[len("public/"):]
        base = Path(f).name
        stem = Path(f).stem
        prefix = re.sub(r"_?\d+$", "", stem)
        if relp in src_blob:
            how = "path"
        elif base in src_blob:
            how = "basename"
        elif re.search(r"['\"`/]%s['\"`]" % re.escape(stem), src_blob):
            how = "stem"
        elif prefix != stem and re.search(r"%s_?\$\{" % re.escape(prefix), src_blob):
            how = "template-prefix"
        elif prefix != stem and re.search(r"\b%s\s*:\s*\d" % re.escape(prefix), src_blob) and "_${" in src_blob:
            how = "variant-table"
        else:
            how = None
        assets.append({"file": f, "bytes": (REPO / f).stat().st_size, "referenced_by": how})
    result["public_assets"] = {
        "unused": [a for a in assets if not a["referenced_by"]],
        "referenced_only_via_stem_or_template": [a for a in assets if a["referenced_by"] in ("stem", "template-prefix", "variant-table")],
        "total": len(assets),
        "total_bytes": sum(a["bytes"] for a in assets),
    }

    # ---------------- npm deps
    pkg = json.loads(texts.get("package.json", "{}") or "{}")
    config_blob = "\n".join(texts.get(f, "") for f in files if "/" not in f and f not in ("package-lock.json", "package.json"))
    deps_report = []
    for section in ("dependencies", "devDependencies"):
        for name in sorted(pkg.get(section, {})):
            importers = sorted(external.get(name, set()))
            note = None
            if not importers:
                if name.startswith("@types/"):
                    base = name[7:]
                    note = "types for '%s' (%s)" % (base, "imported" if base in external or base == "node" or base.startswith("react") else "not imported")
                elif name in config_blob or name in json.dumps(pkg.get("scripts", {})):
                    note = "referenced from root config/scripts"
                elif name == "react-dom":
                    note = "peer of next (implicit)"
                elif name in ("typescript", "eslint", "autoprefixer", "postcss", "tailwindcss", "eslint-config-next"):
                    note = "tooling (implicit)"
            deps_report.append({"name": name, "section": section, "version": pkg[section][name],
                                "importer_count": len(importers), "importers": importers[:30],
                                "unused": not importers and note is None, "note": note})
    result["npm_dependencies"] = deps_report
    result["package_scripts"] = pkg.get("scripts", {})

    # ---------------- comments: density, blocks, commented-out code, TODO
    density_dir = defaultdict(lambda: Counter())
    blocks = []
    commented_code = []
    todos = []
    narration = []
    per_file_density = []
    code_like = re.compile(
        r"^(import\s|export\s|const\s|let\s|var\s|return\b|if\s*\(|for\s*\(|await\s|function\s|"
        r"<[A-Za-z][\w.]*[\s/>]|</\w|\}\s*$|\w[\w.]*\([^)]*\);?\s*$|[\w.\[\]]+\s*=\s*[^=].*;\s*$|.*;\s*$|.*\{\s*$)"
    )
    todo_rx = re.compile(r"\b(TODO|FIXME|HACK|XXX)\b(\([^)]*\))?[:\s]?(.*)")
    narr_rx = re.compile(
        r"(\bused to\b|\bpreviously\b|\bno longer\b|\bwas (?:removed|replaced|changed|moved|hidden)|\bformerly\b|\bold version\b|"
        r"\bthe user\b|\bfounder\b|\bper (?:the )?(?:brief|spec|TZ)\b|\bTZ\b|ТЗ|раньше|теперь|по просьбе|список (?:доработок|правок)|\bправк|"
        r"референс|reference(?:\.mp4| video)|\bTODO\(автор|\bавтор\b|Валер|\bvalera\b)",
        re.I,
    )
    for f in src_files:
        ext = Path(f).suffix
        text = texts.get(f, "")
        lines = text.split("\n")
        kinds = classify_lines(text, ext)
        c = Counter(k for k, _ in kinds)
        density_dir[dir_key(f, 2)].update(c)
        density_dir["ALL"].update(c)
        code_n = c["code"] + c["mixed"]
        per_file_density.append({"file": f, "comment_lines": c["comment"], "code_lines": code_n,
                                 "ratio": round(c["comment"] / code_n, 2) if code_n else None})
        # comment blocks
        start = None
        for i, (k, s) in enumerate(kinds + [("code", "")]):
            if k == "comment":
                if start is None:
                    start = i
            else:
                if start is not None:
                    blocks.append({"file": f, "line": start + 1, "lines": i - start,
                                   "first": lines[start].strip()[:140]})
                start = None
        # commented-out code (// runs and single-line JSX/ block comments)
        run = []
        for i, raw in enumerate(lines + [""]):
            s = raw.strip()
            if s.startswith("//") and not s.startswith("///"):
                run.append((i, s[2:].strip()))
                continue
            if run:
                codeish = [r for r in run if r[1] and code_like.match(r[1]) and not re.match(r"^[A-ZА-Я][^;{}=]*[.:]$", r[1])]
                if len(codeish) >= 2 or (len(run) == 1 and codeish and codeish[0][1].endswith(";")):
                    commented_code.append({"file": f, "line": run[0][0] + 1, "lines": len(run),
                                           "codeish_lines": len(codeish), "sample": codeish[0][1][:120]})
                run = []
        for i, raw in enumerate(lines):
            m = re.search(r"\{/\*\s*(<[A-Za-z][^*]*?/?>)\s*\*/\}", raw)
            if m:
                commented_code.append({"file": f, "line": i + 1, "lines": 1, "codeish_lines": 1,
                                       "sample": m.group(1)[:120]})
        for i, (k, s) in enumerate(kinds):
            raw = lines[i]
            if k in ("comment", "mixed"):
                m = todo_rx.search(raw)
                if m:
                    todos.append({"file": f, "line": i + 1, "marker": m.group(1), "text": raw.strip()[:200]})
                m2 = narr_rx.search(raw)
                if m2 and not raw.strip().startswith("import"):
                    narration.append({"file": f, "line": i + 1, "match": m2.group(0), "text": raw.strip()[:200]})
    dens = {}
    for d, c in sorted(density_dir.items()):
        code_n = c["code"] + c["mixed"]
        dens[d] = {"comment_lines": c["comment"], "code_lines": code_n, "mixed_lines": c["mixed"],
                   "blank_lines": c["blank"],
                   "comment_to_code_ratio": round(c["comment"] / code_n, 3) if code_n else None,
                   "comment_share_of_nonblank": round(c["comment"] / (c["comment"] + code_n), 3) if code_n else None}
    result["comment_density"] = {
        "per_dir": dens,
        "top_files_by_ratio": sorted([x for x in per_file_density if x["ratio"] is not None and x["code_lines"] >= 20],
                                     key=lambda x: (-x["ratio"], x["file"]))[:15],
        "longest_comment_blocks": sorted(blocks, key=lambda b: (-b["lines"], b["file"], b["line"]))[:10],
        "comment_blocks_ge_5_lines": sum(1 for b in blocks if b["lines"] >= 5),
        "comment_blocks_ge_10_lines": sum(1 for b in blocks if b["lines"] >= 10),
    }
    result["commented_out_code"] = commented_code
    result["todo_markers"] = todos
    result["narrative_comments"] = {"count": len(narration), "by_match": dict(Counter(n["match"].lower() for n in narration).most_common()),
                                    "items": narration}

    # ---------------- dead flags
    flag_rx = re.compile(r"^\s*(?:export\s+)?const\s+([A-Z][A-Z0-9_]{2,})\s*(?::\s*[\w<>\[\] |]+)?\s*=\s*(false|true|0|null)\s*(?:as\s+\w+)?;", re.M)
    dead = []
    for f in code_files:
        text = texts[f]
        for m in flag_rx.finditer(text):
            name = m.group(1)
            uses = []
            for g in code_files:
                for i, l in enumerate(texts[g].split("\n")):
                    if re.search(r"\b%s\b" % name, l) and not (g == f and i + 1 == line_of(text, m.start())):
                        uses.append("%s:%d" % (g, i + 1))
            dead.append({"file": f, "line": line_of(text, m.start()), "name": name, "value": m.group(2), "uses": uses})
        for i, l in enumerate(text.split("\n")):
            if re.search(r"\bif\s*\(\s*(false|true|0)\s*\)|\{\s*false\s*&&|&&\s*false\b", l):
                dead.append({"file": f, "line": i + 1, "name": "literal-condition", "value": l.strip()[:120], "uses": []})
    result["dead_flags"] = dead

    # ---------------- duplicated code windows
    trivial = re.compile(r"^(?:[\s{}()\[\];,<>/]*|return \(|\)\s*;?|\}\s*\)\s*;?|\"use client\";|'use client';|</\w+>|<>|</>|else \{|\} else \{|break;|default:|\);|\}\)\}|\)\})$")
    WIN = 8
    norm_lines = {}
    for f in src_files:
        kinds = classify_lines(texts[f], Path(f).suffix)
        seq = []
        for i, (k, s) in enumerate(kinds):
            if k not in ("code", "mixed"):
                continue
            n = re.sub(r"\s+", " ", s)
            n = re.sub(r"//.*$", "", n).strip()
            if len(n) < 6 or trivial.match(n) or n.startswith("import "):
                continue
            seq.append((i + 1, n))
        norm_lines[f] = seq
    win_map = defaultdict(list)
    for f, seq in norm_lines.items():
        for j in range(len(seq) - WIN + 1):
            h = hashlib.md5("\n".join(x[1] for x in seq[j : j + WIN]).encode()).hexdigest()
            win_map[h].append((f, j))
    pair_idx = defaultdict(list)
    for h, occ in win_map.items():
        if len(occ) < 2:
            continue
        for a in range(len(occ)):
            for b in range(a + 1, len(occ)):
                (fa, ja), (fb, jb) = sorted([occ[a], occ[b]])
                if fa == fb and abs(ja - jb) < WIN:
                    continue
                pair_idx[(fa, fb, ja - jb)].append(ja)
    dups = []
    for (fa, fb, off), idxs in pair_idx.items():
        idxs = sorted(set(idxs))
        s = prev = idxs[0]
        for x in idxs[1:] + [None]:
            if x is not None and x == prev + 1:
                prev = x
                continue
            sa, ea = norm_lines[fa][s][0], norm_lines[fa][prev + WIN - 1][0]
            sb, eb = norm_lines[fb][s - off][0], norm_lines[fb][prev - off + WIN - 1][0]
            dups.append({"a": "%s:%d-%d" % (fa, sa, ea), "b": "%s:%d-%d" % (fb, sb, eb),
                         "normalized_lines": prev - s + WIN, "sample": norm_lines[fa][s][1][:100]})
            if x is not None:
                s = prev = x
    dups.sort(key=lambda d: (-d["normalized_lines"], d["a"]))

    # duplicated string literals / JSX text >= 40 chars in >= 2 files
    str_rx = re.compile(r"\"((?:[^\"\\\n]|\\.){40,})\"|'((?:[^'\\\n]|\\.){40,})'|`([^`$]{40,})`")
    jsx_rx = re.compile(r">\s*([^<>{}\n][^<>{}]{38,}?)\s*<")
    lit_map = defaultdict(list)
    for f in code_files:
        text = texts[f]
        for rx in (str_rx, jsx_rx):
            for m in rx.finditer(text):
                s = next(g for g in m.groups() if g is not None)
                n = re.sub(r"\s+", " ", s).strip()
                if len(n) < 40 or n.startswith(("http", "M ", "M0", "data:", "@/", "./", "../")) or re.fullmatch(r"[\w\s:/\-\[\]().,#%]+", n) and " " not in n:
                    continue
                if re.fullmatch(r"[-\w\s:\[\]/.%!#()]+", n) and n.count(" ") > 3 and not re.search(r"[а-яА-Я]{3}|\b(the|and|to|of|a)\b", n):
                    continue  # tailwind class strings
                lit_map[n].append("%s:%d" % (f, line_of(text, m.start())))
    dup_lits = []
    for n, locs in lit_map.items():
        fs = {l.rsplit(":", 1)[0] for l in locs}
        if len(fs) >= 2:
            dup_lits.append({"text": n[:160], "len": len(n), "files": len(fs), "locations": sorted(locs)})
    dup_lits.sort(key=lambda d: (-d["files"], -d["len"], d["text"]))

    # same top-level constant name defined in >= 2 files
    const_rx = re.compile(r"^(?:export\s+)?const\s+([A-Z][A-Z0-9_]{3,})\s*[:=]", re.M)
    const_defs = defaultdict(list)
    for f in code_files:
        for m in const_rx.finditer(texts[f]):
            const_defs[m.group(1)].append("%s:%d" % (f, line_of(texts[f], m.start())))
    result["duplication"] = {
        "window_lines": WIN,
        "code_window_duplicates": dups,
        "code_window_duplicate_pairs": len(dups),
        "duplicated_string_literals": dup_lits,
        "same_constant_name_in_multiple_files": {k: v for k, v in sorted(const_defs.items()) if len({x.rsplit(':', 1)[0] for x in v}) >= 2},
    }

    # ---------------- mock / stub / hardcoded "live" data
    mock_rx = re.compile(r"\b(mock|stub|fake|dummy|placeholder|lorem|simulat\w*|demo)\b|\bonline\s*:\s*true\b|\bisLive\s*[:=]\s*true|"
                         r"status\s*:\s*['\"](?:online|active|ok|live)['\"]|\buptime\s*:\s*['\"]?\d", re.I)
    mock_hits = []
    for f in code_files:
        for i, l in enumerate(texts[f].split("\n")):
            m = mock_rx.search(l)
            if m:
                mock_hits.append({"file": f, "line": i + 1, "match": m.group(0), "text": l.strip()[:160]})
    mock_files = [f for f in files if "/mock/" in f or re.search(r"(mock|fake|stub|fixture)", Path(f).name, re.I)]
    result["mock_data"] = {
        "mock_files": [{"file": f, "loc": texts.get(f, "").count("\n"), "imported_by": sorted(edges.get(f, set()))} for f in mock_files],
        "hits": mock_hits,
    }

    # ---------------- randomness / time / locale during render (hydration candidates)
    hyd_rx = re.compile(r"new Date\(|Date\.now\(|Math\.random\(|toLocale\w*\(|Intl\.\w+|navigator\.|window\.|localStorage|performance\.now\(|crypto\.")
    hyd = []
    for f in code_files:
        text = texts[f]
        client = text.lstrip().startswith(("\"use client\"", "'use client'"))
        for i, l in enumerate(text.split("\n")):
            m = hyd_rx.search(l)
            if m and not l.strip().startswith(("//", "*")):
                hyd.append({"file": f, "line": i + 1, "client": client, "api": m.group(0), "text": l.strip()[:160]})
    result["nondeterministic_apis"] = hyd

    # ---------------- secrets
    secret_rx = {
        "aws_access_key": re.compile(r"\b(AKIA|ASIA)[0-9A-Z]{16}\b"),
        "github_token": re.compile(r"\b(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}"),
        "telegram_bot_token": re.compile(r"\b\d{8,10}:[A-Za-z0-9_-]{35}\b"),
        "openai_key": re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}"),
        "anthropic_key": re.compile(r"\bsk-ant-[A-Za-z0-9_-]{20,}"),
        "generic_assignment": re.compile(r"(api[_-]?key|secret|token|password|passwd)\s*[:=]\s*['\"]([^'\"]{8,})['\"]", re.I),
        "private_ip": re.compile(r"\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b"),
        "public_ipv4": re.compile(r"\b(?!10\.|192\.168\.|127\.|0\.)(\d{1,3}\.){3}\d{1,3}\b"),
        "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
        "phone_ru": re.compile(r"(\+7|8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}"),
        "home_path": re.compile(r"(~/projects/[\w./-]+|/home/[\w./-]+)"),
    }
    secrets = []
    for f in files:
        if f not in texts or f == "package-lock.json":
            continue
        for i, l in enumerate(texts[f].split("\n")):
            for kind, rx in secret_rx.items():
                for m in rx.finditer(l):
                    val = m.group(0)
                    if kind == "public_ipv4" and (not all(0 <= int(x) <= 255 for x in val.split(".")) or re.search(r"\d\.\d+\.\d+\.\d+", l) and "version" in l.lower()):
                        continue
                    if kind == "email" and val.endswith((".png", ".jpg", ".mp3")):
                        continue
                    secrets.append({"file": f, "line": i + 1, "kind": kind,
                                    "value": val if kind in ("email", "home_path", "public_ipv4", "private_ip") else mask(val)})
    env_tracked = [f for f in files if Path(f).name.startswith(".env")]
    # history: any secrets ever committed (added lines only)
    hist = subprocess.run(["git", "-C", str(REPO), "log", "--all", "-p", "--no-color", "--format=commit %h"],
                          capture_output=True, text=True, check=False, errors="replace").stdout
    hist_hits = []
    commit = None
    for l in hist.split("\n"):
        if l.startswith("commit "):
            commit = l.split()[1]
            continue
        if not l.startswith("+") or l.startswith("+++"):
            continue
        for kind in ("aws_access_key", "github_token", "telegram_bot_token", "openai_key", "anthropic_key", "generic_assignment", "private_ip", "public_ipv4"):
            for m in secret_rx[kind].finditer(l):
                if kind == "public_ipv4" and ("integrity" in l or "version" in l or not all(0 <= int(x) <= 255 for x in m.group(0).split("."))):
                    continue
                hist_hits.append({"commit": commit, "kind": kind, "value": mask(m.group(0)), "line": l[:1] + mask(l[1:120])})
    removed = sorted(set(git("-c", "core.quotePath=false", "log", "--all", "--format=", "--name-only", "--diff-filter=D").split("\n")) - {""} - fileset)
    result["secrets"] = {
        "working_tree_hits": secrets,
        "env_files_tracked": env_tracked,
        "history_added_line_hits": hist_hits,
        "files_deleted_but_still_in_history": removed,
        "remote_branches": sorted(x.strip() for x in git("branch", "-r").split("\n") if x.strip()),
    }

    # ---------------- agent artefacts / binaries / tsbuildinfo
    result["repo_hygiene"] = {
        "tracked_.claude": [f for f in files if f.startswith(".claude/")],
        "tracked_reference": [f for f in files if f.startswith("reference/")],
        "tracked_tsbuildinfo": [f for f in files if f.endswith(".tsbuildinfo")],
        "tracked_binaries_over_500kb": [{"file": s["file"], "bytes": s["bytes"]} for s in sizes if s["bytes"] > 500_000 and s["file"] not in texts],
        "untracked_local_heavy_files_in_main_checkout": [
            {"file": str(p.relative_to(REPO.parents[2])), "bytes": p.stat().st_size}
            for p in sorted(REPO.parents[2].glob("reference/*")) + sorted(REPO.parents[2].glob("*.tsbuildinfo"))
            if p.is_file()
        ] if (REPO.parents[2] / "package.json").exists() else [],
        "gitignore_mentions": [l for l in texts.get(".gitignore", "").split("\n") if re.search(r"claude|reference|tsbuildinfo|ТЗ|TZ|ПРОМПТ|доработок|Визуальная|Текст", l)],
        "git_count_objects": git("count-objects", "-vH").strip().split("\n"),
    }

    # ---------------- README / LICENSE
    readme = texts.get("README.md", "")
    result["docs"] = {
        "readme_present": bool(readme),
        "readme_lines": readme.count("\n"),
        "readme_bytes": len(readme.encode()),
        "readme_mentions_ai_process": bool(re.search(r"\b(AI|ИИ|Claude|GPT|agent|агент|LLM|нейросет)", readme)),
        "readme_mentions": {k: bool(re.search(k, readme, re.I)) for k in ["three", "zustand", "Tailwind", "GitHub Pages", "Vercel", "лиценз|license", "скриншот|screenshot|demo|vercel.app"]},
        "license_files": [f for f in files if re.match(r"(LICEN[CS]E|COPYING)", Path(f).name, re.I)],
        "credits_files": [f for f in files if Path(f).name.upper().startswith("CREDITS")],
        "ci_workflows": [f for f in files if f.startswith(".github/workflows/")],
        "tests_present": [f for f in files if re.search(r"(\.test\.|\.spec\.|__tests__|/tests?/)", f)],
    }

    # ---------------- console.*
    cons = []
    for f in code_files:
        for i, l in enumerate(texts[f].split("\n")):
            m = re.search(r"\bconsole\.(log|info|warn|error|debug|table|group\w*)\s*\(", l)
            if m:
                cons.append({"file": f, "line": i + 1, "method": m.group(1), "text": l.strip()[:160]})
    result["console_calls"] = cons

    # ---------------- lint/type escapes
    esc = []
    for f in code_files:
        for i, l in enumerate(texts[f].split("\n")):
            m = re.search(r"eslint-disable[\w-]*\s*([\w/@-]*)|@ts-(ignore|expect-error|nocheck)|\bas any\b|:\s*any\b|as unknown as", l)
            if m:
                esc.append({"file": f, "line": i + 1, "text": l.strip()[:140]})
    result["lint_type_escapes"] = {"count": len(esc), "items": esc}

    # ---------------- heavy client libs
    heavy = {}
    for lib in HEAVY_LIBS:
        imps = sorted(external.get(lib, set()) | {f for p, s in external.items() if p.startswith(lib + "/") for f in s})
        heavy[lib] = [{"file": f, "use_client": texts[f].lstrip().startswith(("\"use client\"", "'use client'")),
                       "reachable_from_app": f in reach,
                       "static_value_import": bool(re.search(r"^\s*import\s+(?!type\b)[^;]*?from\s+['\"]%s(/[^'\"]*)?['\"]" % re.escape(lib), texts[f], re.M)),
                       "dynamic_import": bool(re.search(r"import\(\s*['\"]%s['\"]" % re.escape(lib), texts[f]))} for f in imps]
    dyn = []
    for f in code_files:
        for m in re.finditer(r"dynamic\(\s*\(\)\s*=>\s*import\(['\"]([^'\"]+)['\"]\)", texts[f]):
            dyn.append({"file": f, "line": line_of(texts[f], m.start()), "target": m.group(1)})
    result["heavy_client_imports"] = {
        "by_lib": heavy,
        "next_dynamic_imports": dyn,
        "use_client_files": sum(1 for f in code_files if texts[f].lstrip().startswith(("\"use client\"", "'use client'"))),
        "code_files": len(code_files),
    }

    # ---------------- typecheck / lint
    result["checks"] = run_checks()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT)
    s = result
    print("files=%d src_loc=%d comment/code=%s unused_modules=%d unused_exports=%d dup_pairs=%d dup_literals=%d console=%d"
          % (s["tracked_files_total"], s["inventory"]["source_loc"], s["comment_density"]["per_dir"]["ALL"]["comment_to_code_ratio"],
             len(s["unused_modules"]["never_imported"]), len(s["unused_exports"]),
             s["duplication"]["code_window_duplicate_pairs"], len(s["duplication"]["duplicated_string_literals"]),
             len(s["console_calls"])))
    return 0


def run_checks() -> dict:
    cands = [os.environ.get("AUDIT_NODE_MODULES"), str(REPO / "node_modules"),
             str(REPO.parents[2] / "node_modules") if len(REPO.parents) > 2 else None]
    nm = next((c for c in cands if c and (Path(c) / ".bin" / "tsc").exists()), None)
    if not nm:
        reason = "skipped: no node_modules with .bin/tsc found (checked: %s)" % ", ".join(
            "%s[%s]" % (c, "missing" if not Path(c).exists() else "%d entries" % len(os.listdir(c))) for c in cands if c)
        return {"typecheck": reason, "lint": reason}
    out = {}
    for name, cmd in (
        ("typecheck", [str(Path(nm) / ".bin" / "tsc"), "--noEmit", "--incremental", "false", "-p", str(REPO / "tsconfig.json")]),
        ("lint", [str(Path(nm) / ".bin" / "eslint"), "--no-cache", "--ext", ".ts,.tsx", "app", "components", "lib"]),
    ):
        try:
            p = subprocess.run(cmd, cwd=str(REPO), capture_output=True, text=True, timeout=600,
                               env={**os.environ, "NODE_PATH": nm})
            out[name] = {"cmd": " ".join(cmd), "exit_code": p.returncode, "output_tail": (p.stdout + p.stderr)[-4000:]}
        except Exception as e:  # noqa: BLE001 — environment problem is recorded, not fixed
            out[name] = {"cmd": " ".join(cmd), "error": str(e)[:500]}
    return out


if __name__ == "__main__":
    sys.exit(main())
