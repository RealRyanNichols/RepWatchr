#!/usr/bin/env python3
"""Generate the master vote-weighted ideology/profile-buildout file.

The output is intentionally evidence-first. The left/right marker moves only
when a vote can be mapped to a directional policy axis. Everything else stays
centered and marked as pending instead of pretending a complete voting record
exists.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
OFFICIALS = DATA / "officials"
SCORES = DATA / "scores"
FUNDING = DATA / "funding"
RED_FLAGS = DATA / "red-flags"
NEWS = DATA / "news"
OUTPUT = DATA / "official-ideology-master.json"
GENERATED_DATE = date.today().isoformat()

RIGHT_POLICY_CATEGORIES = {"taxes", "land-and-property-rights"}
RIGHT_POLICY_KEYWORDS = {
    "balanced budget",
    "border",
    "deficit",
    "eminent domain",
    "energy independence",
    "fiscal restraint",
    "franchise tax",
    "property rights",
    "property tax relief",
    "regulatory burden",
    "regulatory overreach",
    "school voucher",
    "spending control",
    "tax cuts",
    "tax relief",
    "unfunded mandate",
}
NEUTRAL_POLICY_KEYWORDS = {
    "campaign finance disclosure",
    "congressional stock trading",
    "ethics",
    "foia",
    "open meetings",
    "public information",
    "transparency",
}

LEVEL_ORDER = {
    "federal": 0,
    "state": 1,
    "county": 2,
    "city": 3,
    "school-board": 4,
}


def read_json(path: Path, fallback: Any = None) -> Any:
    try:
        return json.loads(path.read_text())
    except Exception:
        return fallback


def collect_officials() -> list[dict[str, Any]]:
    officials: list[dict[str, Any]] = []
    for path in sorted(OFFICIALS.rglob("*.json")):
        official = read_json(path)
        if official:
            officials.append(official)
    return sorted(
        officials,
        key=lambda item: (
            LEVEL_ORDER.get(item.get("level", ""), 99),
            district_sort_value(item.get("district")),
            item.get("name", ""),
        ),
    )


def district_sort_value(value: str | None) -> int:
    if not value:
        return 9999
    digits = "".join(ch for ch in value if ch.isdigit())
    return int(digits) if digits else 9999


def collect_vote_source_urls() -> dict[str, str]:
    urls: dict[str, str] = {}
    for path in sorted((DATA / "votes").glob("*.json")):
        vote_file = read_json(path, {})
        if vote_file.get("id") and vote_file.get("sourceUrl"):
            urls[vote_file["id"]] = vote_file["sourceUrl"]
    return urls


def collect_news_map() -> dict[str, int]:
    counts: dict[str, int] = {}
    for path in sorted(NEWS.glob("*.json")):
        article = read_json(path, {})
        for official_id in article.get("officialIds", []):
            counts[official_id] = counts.get(official_id, 0) + 1
    return counts


def flatten_scorecard_votes(scorecard: dict[str, Any]) -> list[dict[str, Any]]:
    votes: list[dict[str, Any]] = []
    for category in scorecard.get("categories", {}).values():
        votes.extend(category.get("votes", []))
    return votes


def classify_vote_axis(vote: dict[str, Any]) -> tuple[int | None, str]:
    category = vote.get("category", "")
    text = f"{vote.get('billTitle', '')} {vote.get('explanation', '')}".lower()

    if any(keyword in text for keyword in NEUTRAL_POLICY_KEYWORDS):
        return None, "Transparency or ethics vote is tracked for accountability but not forced onto the left/right axis."

    if category in RIGHT_POLICY_CATEGORIES or any(keyword in text for keyword in RIGHT_POLICY_KEYWORDS):
        right_position = vote.get("proEastTexasPosition")
        if right_position not in {"yea", "nay"}:
            return None, "No yea/nay right-side policy position is coded for this vote."
        return (1 if right_position == "yea" else -1), "Mapped from coded fiscal, property-rights, border, spending, regulatory, voucher, or energy policy direction."

    if category == "water-rights" and any(keyword in text for keyword in {"landowner", "rule of capture", "regulatory", "private landowner"}):
        right_position = vote.get("proEastTexasPosition")
        if right_position not in {"yea", "nay"}:
            return None, "No yea/nay right-side policy position is coded for this water-rights vote."
        return (1 if right_position == "yea" else -1), "Mapped from landowner-rights or regulatory water policy direction."

    return None, "No left/right vote-direction mapping is coded for this issue yet."


def build_ideology(official: dict[str, Any], scorecard: dict[str, Any] | None, vote_sources: dict[str, str]) -> dict[str, Any]:
    if not scorecard:
        return {
            "ideologyScore": None,
            "ideologyLabel": "Vote record pending",
            "confidence": "none",
            "method": "No scorecard vote file exists for this official yet.",
            "basis": "The marker stays centered until public votes are loaded and mapped to the left/right policy axis.",
            "mappedVoteCount": 0,
            "totalScorecardVotes": 0,
            "rightVoteCount": 0,
            "leftVoteCount": 0,
            "centerVoteCount": 0,
            "evidence": [],
        }

    total_weight = 0
    weighted_score = 0
    right_count = 0
    left_count = 0
    center_count = 0
    evidence: list[dict[str, Any]] = []
    all_votes = flatten_scorecard_votes(scorecard)

    seen_vote_keys: set[tuple[str, str, str]] = set()
    for vote in all_votes:
        vote_choice = vote.get("officialVote")
        if vote_choice not in {"yea", "nay"}:
            continue

        right_position_sign, rationale = classify_vote_axis(vote)
        if right_position_sign is None:
            center_count += 1
            continue

        weight = int(vote.get("weight") or 1)
        vote_sign = 1 if vote_choice == "yea" else -1
        impact = weight * (1 if vote_sign == right_position_sign else -1)
        total_weight += weight
        weighted_score += impact

        if impact > 0:
            right_count += 1
            direction = "right"
        elif impact < 0:
            left_count += 1
            direction = "left"
        else:
            center_count += 1
            direction = "center"

        key = (vote.get("billId", ""), vote.get("date", ""), vote.get("category", ""))
        if key in seen_vote_keys:
            continue
        seen_vote_keys.add(key)
        evidence.append(
            {
                "billId": vote.get("billId", "unknown"),
                "billTitle": vote.get("billTitle", "Unknown vote"),
                "date": vote.get("date", "unknown"),
                "category": vote.get("category", "uncategorized"),
                "officialVote": vote_choice,
                "rightPosition": "yea" if right_position_sign == 1 else "nay",
                "direction": direction,
                "weight": weight,
                "impact": impact,
                "sourceUrl": vote_sources.get(vote.get("billId", "")),
                "rationale": rationale,
            }
        )

    mapped_vote_count = right_count + left_count
    if total_weight == 0:
        return {
            "ideologyScore": None,
            "ideologyLabel": "Vote record not mapped",
            "confidence": "none",
            "method": "Scorecard exists, but no votes are mapped to the left/right policy axis yet.",
            "basis": "The marker stays centered until vote-direction review is completed for this official.",
            "mappedVoteCount": 0,
            "totalScorecardVotes": len(all_votes),
            "rightVoteCount": 0,
            "leftVoteCount": 0,
            "centerVoteCount": center_count,
            "evidence": [],
        }

    ideology_score = round((weighted_score / total_weight) * 100)
    confidence = "high" if mapped_vote_count >= 8 else "medium" if mapped_vote_count >= 4 else "low"
    return {
        "ideologyScore": ideology_score,
        "ideologyLabel": ideology_label(ideology_score),
        "confidence": confidence,
        "method": "Weighted average of scorecard votes that are mapped to a left/right policy axis.",
        "basis": "Uses public vote records already loaded in the scorecard. Non-directional transparency and uncoded issue votes are not forced left or right.",
        "mappedVoteCount": mapped_vote_count,
        "totalScorecardVotes": len(all_votes),
        "rightVoteCount": right_count,
        "leftVoteCount": left_count,
        "centerVoteCount": center_count,
        "evidence": evidence,
    }


def ideology_label(score: int) -> str:
    if score >= 70:
        return "Hard right voting record"
    if score >= 35:
        return "Right voting record"
    if score >= 10:
        return "Center-right voting record"
    if score > -10:
        return "Mixed or center voting record"
    if score > -35:
        return "Center-left voting record"
    if score > -70:
        return "Left voting record"
    return "Hard left voting record"


def buildout(official: dict[str, Any], scorecard: dict[str, Any] | None, news_count: int) -> dict[str, Any]:
    official_id = official["id"]
    has_photo = bool(official.get("photo"))
    has_bio = bool(official.get("bio"))
    has_public_sources = bool(official.get("sourceLinks"))
    has_contact_website = bool(official.get("contactInfo", {}).get("website"))
    has_scorecard = bool(scorecard)
    has_vote_record = bool(scorecard and flatten_scorecard_votes(scorecard))
    has_funding = (FUNDING / f"{official_id}.json").exists()
    has_red_flag_review = (RED_FLAGS / f"{official_id}.json").exists()
    has_news = news_count > 0

    checks = [
        ("profile photo", has_photo),
        ("public bio", has_bio),
        ("public source links", has_public_sources),
        ("official website", has_contact_website),
        ("scorecard", has_scorecard),
        ("vote record", has_vote_record),
        ("campaign funding summary", has_funding),
        ("red-flag review file", has_red_flag_review),
        ("related news links", has_news),
        ("left/right ideology chart", True),
    ]
    loaded_count = sum(1 for _, value in checks if value)
    missing = [label for label, value in checks if not value]

    return {
        "completionPercent": round((loaded_count / len(checks)) * 100),
        "hasPhoto": has_photo,
        "hasBio": has_bio,
        "hasPublicSources": has_public_sources,
        "hasContactWebsite": has_contact_website,
        "hasScorecard": has_scorecard,
        "hasVoteRecord": has_vote_record,
        "hasFundingSummary": has_funding,
        "hasRedFlagReview": has_red_flag_review,
        "hasNewsLinks": has_news,
        "hasIdeologyChart": True,
        "isComplete": len(missing) == 0,
        "missingItems": missing,
    }


def main() -> int:
    officials = collect_officials()
    vote_sources = collect_vote_source_urls()
    news_map = collect_news_map()
    rows: list[dict[str, Any]] = []

    for official in officials:
        official_id = official["id"]
        scorecard = read_json(SCORES / f"{official_id}.json")
        ideology = build_ideology(official, scorecard, vote_sources)
        rows.append(
            {
                "officialId": official_id,
                "name": official.get("name", ""),
                "party": official.get("party", "NP"),
                "level": official.get("level", "state"),
                "position": official.get("position", ""),
                "jurisdiction": official.get("jurisdiction", ""),
                "district": official.get("district"),
                **ideology,
                "lastUpdated": GENERATED_DATE,
                "buildout": buildout(official, scorecard, news_map.get(official_id, 0)),
            }
        )

    OUTPUT.write_text(json.dumps(rows, indent=2, ensure_ascii=True) + "\n")
    with_votes = sum(1 for row in rows if row["ideologyScore"] is not None)
    complete = sum(1 for row in rows if row["buildout"]["isComplete"])
    print(f"Wrote {len(rows)} official ideology/profile rows to {OUTPUT.relative_to(ROOT)}")
    print(f"{with_votes} rows have a vote-weighted left/right score; {complete} rows are marked complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
