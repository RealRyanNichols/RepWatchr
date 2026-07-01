#!/usr/bin/env python3
"""Write a source-backed RepWatchr profile completion audit.

This is intentionally an audit, not a scoring importer. A profile is not
marked complete just because a shell JSON row exists. Vote records, issue
mapping, scorecards, funding, sources, and photos are counted separately so the
public UI cannot imply certainty before the data layer supports it.
"""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
OFFICIALS = DATA / "officials"
VOTE_RECORDS = DATA / "vote-records"
SCORES = DATA / "scores"
FUNDING = DATA / "funding"
RED_FLAGS = DATA / "red-flags"
NEWS = DATA / "news"
IDEOLOGY_MASTER = DATA / "official-ideology-master.json"
OUT_JSON = DATA / "profile-completion-audit.json"
OUT_DOC = ROOT / "docs" / "PROFILE_COMPLETION_AUDIT.md"
TEXAS_EXPECTED_SEATS = {
    "usHouse": 38,
    "usSenate": 2,
    "stateHouse": 150,
    "stateSenate": 31,
}


def read_json(path: Path, fallback: Any = None) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def collect_json_files(root: Path) -> list[Path]:
    if not root.exists():
        return []
    return sorted(path for path in root.rglob("*.json") if path.is_file())


def collect_officials() -> list[dict[str, Any]]:
    master_rows = read_json(IDEOLOGY_MASTER, [])
    if isinstance(master_rows, list) and master_rows:
        rows: list[dict[str, Any]] = []
        seen_ids: set[str] = set()
        for row in master_rows:
            if not isinstance(row, dict) or not row.get("officialId"):
                continue
            seen_ids.add(str(row.get("officialId")))
            rows.append(
                {
                    "id": row.get("officialId"),
                    "name": row.get("name"),
                    "party": row.get("party"),
                    "level": row.get("level"),
                    "position": row.get("position"),
                    "jurisdiction": row.get("jurisdiction"),
                    "district": row.get("district"),
                    "_source": "official-ideology-master.json",
                    "_buildout": row.get("buildout") if isinstance(row.get("buildout"), dict) else {},
                }
            )
        for path in [
            *sorted((OFFICIALS / "federal").glob("us-house-tx*.json")),
            *sorted((OFFICIALS / "federal").glob("us-senate-tx*.json")),
            *sorted((OFFICIALS / "state").glob("tx-*.json")),
        ]:
            official = read_json(path)
            if not isinstance(official, dict) or not official.get("id"):
                continue
            official_id = str(official["id"])
            if official_id in seen_ids:
                continue
            seen_ids.add(official_id)
            official["_file"] = str(path.relative_to(ROOT))
            rows.append(official)
        return rows

    rows: list[dict[str, Any]] = []
    for path in collect_json_files(OFFICIALS):
        official = read_json(path)
        if isinstance(official, dict) and official.get("id"):
            official["_file"] = str(path.relative_to(ROOT))
            rows.append(official)
    return rows


def file_ids(directory: Path) -> set[str]:
    return {path.stem for path in directory.glob("*.json")} if directory.exists() else set()


def collect_vote_rows() -> dict[str, dict[str, Any]]:
    rows: dict[str, dict[str, Any]] = {}
    for path in VOTE_RECORDS.glob("*.json") if VOTE_RECORDS.exists() else []:
        rows[path.stem] = {
            "rows": None,
            "session": None,
            "lastUpdated": None,
            "hasFile": True,
        }
    return rows


def read_vote_total(official_id: str) -> int | None:
    path = VOTE_RECORDS / f"{official_id}.json"
    if not path.exists():
        return None
    try:
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                if '"totalVotesLoaded"' in line:
                    digits = "".join(ch for ch in line if ch.isdigit())
                    return int(digits) if digits else None
                if '"votes"' in line:
                    break
    except Exception:
        return None
    return None


def collect_news_counts() -> Counter[str]:
    counts: Counter[str] = Counter()
    for path in NEWS.glob("*.json") if NEWS.exists() else []:
        article = read_json(path, {})
        if not isinstance(article, dict):
            continue
        for official_id in article.get("officialIds", []):
            counts[str(official_id)] += 1
    return counts


def collect_ideology_rows() -> dict[str, dict[str, Any]]:
    rows = read_json(IDEOLOGY_MASTER, [])
    if not isinstance(rows, list):
        return {}
    return {
        str(row.get("officialId")): row
        for row in rows
        if isinstance(row, dict) and row.get("officialId")
    }


def is_texas_rep(official: dict[str, Any]) -> bool:
    official_id = str(official.get("id", "")).lower()
    district = str(official.get("district", "")).upper()
    state = str(official.get("state", "")).upper()
    jurisdiction = str(official.get("jurisdiction", "")).lower()
    position = str(official.get("position", ""))
    return (
        position in {"U.S. Representative", "U.S. Senator", "State Representative", "State Senator"}
        and (
            state == "TX"
            or "texas" in jurisdiction
            or district == "TEXAS"
            or district.startswith("TX-")
            or official_id.startswith(("us-house-tx", "us-senate-tx"))
        )
    )


def has_sources(official: dict[str, Any]) -> bool:
    buildout = official.get("_buildout") if isinstance(official.get("_buildout"), dict) else None
    if buildout:
        return bool(buildout.get("hasPublicSources") or buildout.get("hasContactWebsite"))

    contact = official.get("contactInfo") if isinstance(official.get("contactInfo"), dict) else {}
    return bool(
        official.get("sourceLinks")
        or official.get("photoSourceUrl")
        or contact.get("website")
    )


def completion_row(
    official: dict[str, Any],
    vote_rows: dict[str, dict[str, Any]],
    score_ids: set[str],
    funding_ids: set[str],
    red_flag_ids: set[str],
    ideology_rows: dict[str, dict[str, Any]],
    news_counts: Counter[str],
) -> dict[str, Any]:
    official_id = str(official["id"])
    vote_meta = vote_rows.get(official_id, {"rows": 0})
    ideology = ideology_rows.get(official_id, {})
    buildout = official.get("_buildout") if isinstance(official.get("_buildout"), dict) else {}
    mapped_votes = int(ideology.get("mappedVoteCount") or 0)
    loaded_public_vote_count = read_vote_total(official_id) if mapped_votes > 0 else None
    has_vote_record = official_id in vote_rows or bool(buildout.get("hasVoteRecord"))
    has_complete_left_right_chart = bool(
        ideology.get("ideologyScore") is not None
        and mapped_votes > 0
        and (not loaded_public_vote_count or mapped_votes >= loaded_public_vote_count)
    )
    checks = {
        "identity": bool(official.get("name") and official.get("position") and official.get("jurisdiction")),
        "photo": bool(buildout.get("hasPhoto") if buildout else official.get("photo")),
        "public_sources": has_sources(official),
        "contact": bool(
            buildout.get("hasContactWebsite")
            if buildout
            else (official.get("contactInfo") or {}).get("website") or (official.get("contactInfo") or {}).get("phone")
        ),
        "vote_record": has_vote_record,
        "left_right_chart": has_complete_left_right_chart,
        "scorecard": official_id in score_ids or bool(buildout.get("hasScorecard")),
        "funding": official_id in funding_ids or bool(buildout.get("hasFundingSummary")),
        "red_flag_review": official_id in red_flag_ids or bool(buildout.get("hasRedFlagReview")),
        "news_links": news_counts[official_id] > 0 or bool(buildout.get("hasNewsLinks")),
    }
    loaded = [key for key, value in checks.items() if value]
    missing = [key for key, value in checks.items() if not value]
    return {
        "id": official_id,
        "name": official.get("name"),
        "position": official.get("position"),
        "state": official.get("state"),
        "district": official.get("district"),
        "level": official.get("level"),
        "href": f"/officials/{official_id}",
        "completionPercent": round((len(loaded) / len(checks)) * 100),
        "loaded": loaded,
        "missing": missing,
        "voteRows": loaded_public_vote_count
        if loaded_public_vote_count is not None
        else int(vote_meta.get("rows") or 0) if vote_meta.get("rows") is not None else 0,
        "voteRecordLoaded": has_vote_record,
        "voteSession": vote_meta.get("session"),
        "mappedLeftRightVotes": mapped_votes,
        "scorecardLoaded": official_id in score_ids,
        "fundingLoaded": official_id in funding_ids,
        "redFlagReviewLoaded": official_id in red_flag_ids,
        "newsRows": news_counts[official_id],
        "file": official.get("_file") or official.get("_source"),
    }


def summarize(rows: list[dict[str, Any]]) -> dict[str, Any]:
    missing_counts = Counter(item for row in rows for item in row["missing"])
    return {
        "total": len(rows),
        "complete": sum(1 for row in rows if not row["missing"]),
        "averageCompletionPercent": round(sum(row["completionPercent"] for row in rows) / len(rows)) if rows else 0,
        "withPhotos": sum(1 for row in rows if "photo" not in row["missing"]),
        "withVoteRecords": sum(1 for row in rows if row["voteRecordLoaded"]),
        "withMappedLeftRightCharts": sum(1 for row in rows if row["mappedLeftRightVotes"] > 0),
        "withScorecards": sum(1 for row in rows if row["scorecardLoaded"]),
        "withFunding": sum(1 for row in rows if row["fundingLoaded"]),
        "withRedFlagReview": sum(1 for row in rows if row["redFlagReviewLoaded"]),
        "missingCounts": dict(sorted(missing_counts.items(), key=lambda item: (-item[1], item[0]))),
    }


def texas_expected_report(rows: list[dict[str, Any]]) -> dict[str, Any]:
    def district_numbers(position: str, prefix: str) -> set[int]:
        values: set[int] = set()
        for row in rows:
            if row.get("position") != position:
                continue
            district = str(row.get("district") or "")
            if not district.startswith(prefix):
                continue
            try:
                values.add(int(district.replace(prefix, "", 1)))
            except ValueError:
                continue
        return values

    us_house = district_numbers("U.S. Representative", "TX-")
    state_house = district_numbers("State Representative", "HD-")
    state_senate = district_numbers("State Senator", "SD-")
    us_senate_loaded = sum(1 for row in rows if row.get("position") == "U.S. Senator")

    return {
        "expectedTotal": sum(TEXAS_EXPECTED_SEATS.values()),
        "loadedTotal": len(rows),
        "missingTotal": max(0, sum(TEXAS_EXPECTED_SEATS.values()) - len(rows)),
        "missing": {
            "usHouse": [f"TX-{district}" for district in range(1, TEXAS_EXPECTED_SEATS["usHouse"] + 1) if district not in us_house],
            "usSenate": max(0, TEXAS_EXPECTED_SEATS["usSenate"] - us_senate_loaded),
            "stateHouse": [f"HD-{district}" for district in range(1, TEXAS_EXPECTED_SEATS["stateHouse"] + 1) if district not in state_house],
            "stateSenate": [f"SD-{district}" for district in range(1, TEXAS_EXPECTED_SEATS["stateSenate"] + 1) if district not in state_senate],
        },
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# RepWatchr Profile Completion Audit",
        "",
        f"Generated: {payload['generatedAt']}",
        "",
        "This audit separates loaded profile shells from source-backed profile completion. Raw roll-call rows do not automatically become left/right scores; they require issue mapping and review first.",
        "",
        "## Summary",
        "",
    ]
    for label, summary in [
        ("All official profiles", payload["summary"]["all"]),
        ("Federal/state official profiles", payload["summary"]["federalState"]),
        ("Texas federal/state representative profiles", payload["summary"]["texasRepresentatives"]),
    ]:
        lines.extend(
            [
                f"### {label}",
                "",
                f"- Profiles: {summary['total']}",
                f"- Complete: {summary['complete']}",
                f"- Average completion: {summary['averageCompletionPercent']}%",
                f"- Photos: {summary['withPhotos']}",
                f"- Vote-record files present: {summary['withVoteRecords']}",
                f"- Profiles with any mapped left/right votes: {summary['withMappedLeftRightCharts']}",
                f"- Scorecards: {summary['withScorecards']}",
                f"- Funding files: {summary['withFunding']}",
                f"- Red-flag review files: {summary['withRedFlagReview']}",
                "",
            ]
        )

    texas_expected = payload["texasExpected"]
    missing_texas = [
        *texas_expected["missing"]["usHouse"],
        *texas_expected["missing"]["stateHouse"],
        *texas_expected["missing"]["stateSenate"],
    ]
    lines.extend(
        [
            "## Texas Seat Coverage",
            "",
            f"- Expected federal/state representative profiles: {texas_expected['expectedTotal']}",
            f"- Loaded federal/state representative profiles: {texas_expected['loadedTotal']}",
            f"- Missing seat/district profiles: {', '.join(missing_texas) if missing_texas else 'none'}",
            f"- Missing U.S. Senate seats: {texas_expected['missing']['usSenate']}",
            "",
        ]
    )

    lines.extend(["## Missing Item Counts", ""])
    for key, count in payload["summary"]["texasRepresentatives"]["missingCounts"].items():
        lines.append(f"- {key}: {count}")

    lines.extend(
        [
            "",
            "## Texas Representative Queue",
            "",
            "| Profile | Office | District | Completion | Vote rows | Mapped chart votes | Missing |",
            "| --- | --- | --- | ---: | ---: | ---: | --- |",
        ]
    )
    for row in payload["queues"]["texasRepresentatives"][:75]:
        vote_rows = str(row["voteRows"]) if row["voteRows"] > 0 else ("file" if row["voteRecordLoaded"] else "0")
        lines.append(
            "| "
            f"[{row['name']}]({row['href']}) | "
            f"{row['position']} | "
            f"{row.get('district') or ''} | "
            f"{row['completionPercent']}% | "
            f"{vote_rows} | "
            f"{row['mappedLeftRightVotes']} | "
            f"{', '.join(row['missing']) or 'none'} |"
        )

    lines.extend(
        [
            "",
            "## Next Source Adapters",
            "",
            "- Federal: expand the current importer beyond the latest snapshot if RepWatchr wants full-session or full-term roll-call coverage.",
            "- Texas Legislature: keep House/Senate TLO record-vote imports running by date range, then add issue/category mapping rules before moving the left/right chart.",
            "- Funding: add TEC/FEC import adapters by office type and cycle before marking Texas profiles complete.",
            "- Photos: keep official/Wikimedia/open-source portrait sync running, with source credit on each public profile.",
            "- Charts: keep unmapped vote rows centered and visibly marked as source-review until reviewed rules exist.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    officials = collect_officials()
    vote_rows = collect_vote_rows()
    score_ids = file_ids(SCORES)
    funding_ids = file_ids(FUNDING)
    red_flag_ids = file_ids(RED_FLAGS)
    news_counts = collect_news_counts()
    ideology_rows = collect_ideology_rows()
    rows = [
        completion_row(official, vote_rows, score_ids, funding_ids, red_flag_ids, ideology_rows, news_counts)
        for official in officials
    ]
    federal_state = [row for row in rows if row["level"] in {"federal", "state"}]
    texas_ids = {str(official["id"]) for official in officials if is_texas_rep(official)}
    texas_reps = [row for row in rows if row["id"] in texas_ids]
    texas_reps.sort(key=lambda row: (row["completionPercent"], row["position"] or "", row["district"] or "", row["name"] or ""))

    by_state: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in federal_state:
        by_state[str(row.get("state") or "Unknown")].append(row)

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "all": summarize(rows),
            "federalState": summarize(federal_state),
            "texasRepresentatives": summarize(texas_reps),
        },
        "texasExpected": texas_expected_report(texas_reps),
        "stateSummary": {
            state: summarize(state_rows)
            for state, state_rows in sorted(by_state.items(), key=lambda item: item[0])
        },
        "queues": {
            "texasRepresentatives": texas_reps,
            "lowestFederalState": sorted(
                federal_state,
                key=lambda row: (row["completionPercent"], row["state"] or "", row["name"] or ""),
            )[:100],
        },
    }

    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    OUT_DOC.parent.mkdir(parents=True, exist_ok=True)
    OUT_DOC.write_text(render_markdown(payload), encoding="utf-8")
    print(f"Wrote {OUT_JSON.relative_to(ROOT)}")
    print(f"Wrote {OUT_DOC.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
