#!/usr/bin/env python3
"""Audit RepWatchr pages for click-forward attention mechanisms."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "src" / "app"
OUT_JSON = ROOT / "src" / "data" / "attention-mechanism-audit.json"
OUT_DOC = ROOT / "docs" / "ATTENTION_MECHANISM_AUDIT.md"

PRIVATE_PREFIXES = ("/admin", "/api", "/auth", "/dashboard", "/login", "/create-account")
ROOT_LOOP_COMPONENT = "CivicLoopPanel"
ATTENTION_TERMS = [
    "Continue Reading",
    "Open Related Official",
    "Compare Votes",
    "Compare Funding",
    "See Similar Officials",
    "Follow This Race",
    "Watch This Official",
    "What Changed",
    "Recent Activity",
    "Who Shares This",
    "Latest Sources",
    "Trending Records",
    "Related Stories",
    "Most Viewed",
    "Recently Updated",
    "Missing Source",
    "Request Review",
    "Next Useful Move",
    "Your next useful click",
    "Submit Missing Source",
    "Build Source Packet",
]


def route_from_page(path: Path) -> str:
    rel = path.relative_to(APP)
    parts = list(rel.parts[:-1])
    route_parts: list[str] = []
    for part in parts:
        if part.startswith("(") and part.endswith(")"):
            continue
        if part.startswith("[") and part.endswith("]"):
            route_parts.append(f":{part[1:-1]}")
        else:
            route_parts.append(part)
    return "/" + "/".join(route_parts) if route_parts else "/"


def is_private(route: str) -> bool:
    return any(route == prefix or route.startswith(f"{prefix}/") for prefix in PRIVATE_PREFIXES)


def local_mechanisms(source: str) -> list[str]:
    found = []
    lower_source = source.lower()
    for term in ATTENTION_TERMS:
        if term.lower() in lower_source:
            found.append(term)
    if "<link" in lower_source or "href=" in lower_source:
        found.append("Route links")
    if "sharebuttons" in lower_source:
        found.append("Share buttons")
    return sorted(set(found))


def main() -> int:
    pages = sorted(APP.rglob("page.tsx"))
    rows = []
    for page in pages:
        route = route_from_page(page)
        source = page.read_text(encoding="utf-8")
        private = is_private(route)
        local = local_mechanisms(source)
        inherited = [] if private else [ROOT_LOOP_COMPONENT]
        rows.append(
            {
                "route": route,
                "file": str(page.relative_to(ROOT)),
                "privateOrAuth": private,
                "localMechanisms": local,
                "inheritedMechanisms": inherited,
                "covered": private or bool(local or inherited),
            }
        )

    public_rows = [row for row in rows if not row["privateOrAuth"]]
    uncovered_public = [row for row in public_rows if not row["covered"]]
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "targetAveragePagesPerSession": 8,
        "measurement": {
            "clientEvent": "pages_per_session_progress",
            "clickEvent": "attention_mechanism_click",
            "note": "PageViewTracker stores unique public routes visited in browser sessionStorage and emits session_page_depth through Vercel Analytics.",
        },
        "summary": {
            "totalPages": len(rows),
            "publicPages": len(public_rows),
            "privateOrAuthPages": len(rows) - len(public_rows),
            "publicCovered": len(public_rows) - len(uncovered_public),
            "publicUncovered": len(uncovered_public),
        },
        "rows": rows,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    OUT_DOC.parent.mkdir(parents=True, exist_ok=True)
    OUT_DOC.write_text(render_markdown(payload), encoding="utf-8")
    print(f"Wrote {OUT_JSON.relative_to(ROOT)}")
    print(f"Wrote {OUT_DOC.relative_to(ROOT)}")
    return 0


def render_markdown(payload: dict) -> str:
    summary = payload["summary"]
    lines = [
        "# RepWatchr Attention Mechanism Audit",
        "",
        f"Generated: {payload['generatedAt']}",
        "",
        "RepWatchr is treated as a civic operating system: every public page needs a natural next click so users do not hit a dead end.",
        "",
        "## Measurement",
        "",
        f"- Target average pages per session: {payload['targetAveragePagesPerSession']}+",
        f"- Page-depth event: `{payload['measurement']['clientEvent']}`",
        f"- Attention click event: `{payload['measurement']['clickEvent']}`",
        f"- Note: {payload['measurement']['note']}",
        "",
        "## Summary",
        "",
        f"- Total page routes audited: {summary['totalPages']}",
        f"- Public page routes: {summary['publicPages']}",
        f"- Private/auth/admin page routes: {summary['privateOrAuthPages']}",
        f"- Public routes covered: {summary['publicCovered']}",
        f"- Public routes uncovered: {summary['publicUncovered']}",
        "",
        "## Page Coverage",
        "",
        "| Route | Scope | Mechanisms | Status |",
        "| --- | --- | --- | --- |",
    ]
    for row in payload["rows"]:
        mechanisms = [*row["localMechanisms"], *row["inheritedMechanisms"]]
        scope = "private/auth" if row["privateOrAuth"] else "public"
        status = "covered" if row["covered"] else "missing"
        lines.append(
            f"| `{row['route']}` | {scope} | {', '.join(mechanisms) if mechanisms else 'workflow navigation'} | {status} |"
        )
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    raise SystemExit(main())
