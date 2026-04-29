#!/usr/bin/env python3
"""Import recent public federal roll-call vote snapshots.

Sources:
- House Clerk roll-call XML for the 119th Congress, 2nd session.
- Senate LIS roll-call XML for the 119th Congress, 2nd session.

The importer writes source-backed vote snapshots only. It does not turn those
votes into RepWatchr scorecards or left/right ideology scores; that still
requires issue mapping and review.
"""

from __future__ import annotations

import datetime as dt
import html
import json
import re
import unicodedata
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
OFFICIALS_DIR = ROOT / "src" / "data" / "officials" / "federal"
VOTE_RECORDS_DIR = ROOT / "src" / "data" / "vote-records"
ACCESSED_DATE = dt.date.today().isoformat()

CONGRESS = 119
SESSION = 2
YEAR = 2026
RECENT_VOTE_LIMIT = 12

HOUSE_INDEX_URL = f"https://clerk.house.gov/evs/{YEAR}/index.asp"
HOUSE_XML_URL = f"https://clerk.house.gov/evs/{YEAR}/roll{{roll:03d}}.xml"
HOUSE_PUBLIC_URL = "https://clerk.house.gov/cgi-bin/vote.asp?year={year}&rollnumber={roll}"

SENATE_MENU_URL = (
    "https://www.senate.gov/legislative/LIS/roll_call_lists/"
    f"vote_menu_{CONGRESS}_{SESSION}.xml"
)
SENATE_XML_URL = (
    "https://www.senate.gov/legislative/LIS/roll_call_votes/"
    f"vote{CONGRESS}{SESSION}/vote_{CONGRESS}_{SESSION}_{{roll:05d}}.xml"
)


def request(url: str) -> urllib.request.Request:
    return urllib.request.Request(
        url,
        headers={
            "User-Agent": "RepWatchr federal vote record importer",
            "Accept": "*/*",
        },
    )


def fetch_bytes(url: str, timeout: int = 45) -> bytes:
    with urllib.request.urlopen(request(url), timeout=timeout) as response:
        return response.read()


def fetch_text(url: str, timeout: int = 45) -> str:
    with urllib.request.urlopen(request(url), timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def read_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n")


def text_at(parent: ET.Element, path: str) -> str:
    value = parent.findtext(path)
    return re.sub(r"\s+", " ", html.unescape(value or "")).strip()


def normalize_vote(value: str) -> str:
    normalized = re.sub(r"\s+", " ", value or "").strip().lower()
    if normalized in {"yea", "aye", "yes"}:
        return "yea"
    if normalized in {"nay", "no"}:
        return "nay"
    if normalized == "present":
        return "present"
    if normalized in {"not voting", "absent"}:
        return "not-voting"
    return normalized or "unknown"


def name_key(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z]", "", ascii_value.lower())


def parse_house_date(value: str) -> str:
    value = value.strip()
    if not value:
        return ""
    for fmt in ("%d-%b-%Y", "%d-%B-%Y"):
        try:
            return dt.datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass
    return value


def parse_senate_date(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    for fmt in ("%B %d, %Y, %I:%M %p", "%B %d, %Y"):
        try:
            return dt.datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass
    return value


class HouseIndexParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_roll_link = False
        self.rolls: list[int] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        attr_map = {key.lower(): value or "" for key, value in attrs}
        href = attr_map.get("href", "")
        match = re.search(r"rollnumber=(\d+)", href)
        if match:
            self.rolls.append(int(match.group(1)))


def latest_house_rolls(limit: int) -> list[int]:
    parser = HouseIndexParser()
    parser.feed(fetch_text(HOUSE_INDEX_URL))
    seen: list[int] = []
    for roll in sorted(set(parser.rolls), reverse=True):
        if roll not in seen:
            seen.append(roll)
        if len(seen) >= limit:
            break
    return seen


def latest_senate_rolls(limit: int) -> list[int]:
    root = ET.fromstring(fetch_bytes(SENATE_MENU_URL))
    rolls: list[int] = []
    for vote in root.findall(".//vote"):
        value = text_at(vote, "vote_number")
        if value.isdigit():
            rolls.append(int(value))
    return sorted(set(rolls), reverse=True)[:limit]


def load_federal_officials() -> tuple[dict[str, dict[str, Any]], dict[tuple[str, str], dict[str, Any]]]:
    by_bioguide: dict[str, dict[str, Any]] = {}
    senators_by_state_last: dict[tuple[str, str], dict[str, Any]] = {}
    for path in sorted(OFFICIALS_DIR.glob("*.json")):
        official = read_json(path)
        if not official:
            continue
        bioguide = official.get("bioguideId")
        if bioguide:
            by_bioguide[bioguide] = official
        if official.get("position") == "U.S. Senator":
            state = official.get("state", "")
            last = name_key(str(official.get("lastName", "")))
            senators_by_state_last[(state, last)] = official
    return by_bioguide, senators_by_state_last


def parse_house_vote(roll: int, by_bioguide: dict[str, dict[str, Any]]) -> tuple[dict[str, Any], list[tuple[str, dict[str, Any]]]]:
    source_url = HOUSE_XML_URL.format(roll=roll)
    root = ET.fromstring(fetch_bytes(source_url))
    metadata = root.find("vote-metadata")
    if metadata is None:
        raise ValueError(f"House roll {roll} has no vote-metadata")

    vote_type = text_at(metadata, "vote-type")
    legis_num = text_at(metadata, "legis-num")
    if vote_type.upper() == "QUORUM" or legis_num.upper() == "QUORUM":
        return {}, []

    public_url = HOUSE_PUBLIC_URL.format(year=YEAR, roll=roll)
    vote_meta = {
        "sourceId": f"house-{YEAR}-{roll:03d}",
        "sourceName": "Office of the Clerk, U.S. House of Representatives",
        "sourceUrl": public_url,
        "sourceXmlUrl": source_url,
        "chamber": "house",
        "congress": CONGRESS,
        "session": SESSION,
        "rollCall": roll,
        "date": parse_house_date(text_at(metadata, "action-date")),
        "issue": legis_num,
        "question": text_at(metadata, "vote-question"),
        "voteType": vote_type,
        "result": text_at(metadata, "vote-result"),
        "title": text_at(metadata, "vote-desc") or legis_num,
    }

    rows: list[tuple[str, dict[str, Any]]] = []
    for recorded in root.findall(".//recorded-vote"):
        legislator = recorded.find("legislator")
        if legislator is None:
            continue
        bioguide = legislator.attrib.get("name-id", "")
        official = by_bioguide.get(bioguide)
        if not official:
            continue
        vote_cast = text_at(recorded, "vote")
        rows.append(
            (
                official["id"],
                {
                    **vote_meta,
                    "vote": normalize_vote(vote_cast),
                    "voteCast": vote_cast,
                },
            )
        )
    return vote_meta, rows


def parse_senate_vote(roll: int, senators_by_state_last: dict[tuple[str, str], dict[str, Any]]) -> tuple[dict[str, Any], list[tuple[str, dict[str, Any]]]]:
    source_url = SENATE_XML_URL.format(roll=roll)
    root = ET.fromstring(fetch_bytes(source_url))
    vote_number = int(text_at(root, "vote_number") or roll)
    vote_meta = {
        "sourceId": f"senate-{YEAR}-{vote_number:05d}",
        "sourceName": "U.S. Senate roll-call vote XML",
        "sourceUrl": source_url,
        "sourceXmlUrl": source_url,
        "chamber": "senate",
        "congress": int(text_at(root, "congress") or CONGRESS),
        "session": int(text_at(root, "session") or SESSION),
        "rollCall": vote_number,
        "date": parse_senate_date(text_at(root, "vote_date")),
        "issue": text_at(root, "document/document_name") or text_at(root, "issue"),
        "question": text_at(root, "vote_question_text") or text_at(root, "question"),
        "voteType": text_at(root, "question"),
        "result": text_at(root, "vote_result_text") or text_at(root, "vote_result"),
        "title": text_at(root, "vote_title") or text_at(root, "document/document_title"),
    }

    rows: list[tuple[str, dict[str, Any]]] = []
    for member in root.findall(".//member"):
        state = text_at(member, "state")
        last = name_key(text_at(member, "last_name"))
        official = senators_by_state_last.get((state, last))
        if not official:
            continue
        vote_cast = text_at(member, "vote_cast")
        rows.append(
            (
                official["id"],
                {
                    **vote_meta,
                    "vote": normalize_vote(vote_cast),
                    "voteCast": vote_cast,
                },
            )
        )
    return vote_meta, rows


def summarize_votes(votes: list[dict[str, Any]]) -> dict[str, int]:
    summary = {
        "totalVotesLoaded": len(votes),
        "yea": 0,
        "nay": 0,
        "present": 0,
        "notVoting": 0,
        "other": 0,
    }
    for vote in votes:
        value = vote.get("vote")
        if value == "yea":
            summary["yea"] += 1
        elif value == "nay":
            summary["nay"] += 1
        elif value == "present":
            summary["present"] += 1
        elif value == "not-voting":
            summary["notVoting"] += 1
        else:
            summary["other"] += 1
    return summary


def main() -> int:
    by_bioguide, senators_by_state_last = load_federal_officials()
    vote_rows_by_official: dict[str, list[dict[str, Any]]] = {}
    warnings: list[str] = []

    for roll in latest_house_rolls(RECENT_VOTE_LIMIT):
        try:
            _, rows = parse_house_vote(roll, by_bioguide)
        except (ET.ParseError, urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
            warnings.append(f"House roll {roll}: {exc}")
            continue
        for official_id, row in rows:
            vote_rows_by_official.setdefault(official_id, []).append(row)

    for roll in latest_senate_rolls(RECENT_VOTE_LIMIT):
        try:
            _, rows = parse_senate_vote(roll, senators_by_state_last)
        except (ET.ParseError, urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
            warnings.append(f"Senate roll {roll}: {exc}")
            continue
        for official_id, row in rows:
            vote_rows_by_official.setdefault(official_id, []).append(row)

    # Rewrite only federal vote snapshots. State/local snapshots can live in
    # the same directory later without being touched by this importer.
    VOTE_RECORDS_DIR.mkdir(parents=True, exist_ok=True)
    federal_ids = {official["id"] for official in by_bioguide.values()}
    for path in VOTE_RECORDS_DIR.glob("*.json"):
        existing = read_json(path) or {}
        if existing.get("level") == "federal" or path.stem in federal_ids:
            path.unlink()

    written = 0
    for official_id, votes in sorted(vote_rows_by_official.items()):
        official = next((item for item in by_bioguide.values() if item["id"] == official_id), None)
        if not official:
            continue
        chamber = "senate" if official.get("position") == "U.S. Senator" else "house"
        votes = sorted(votes, key=lambda item: (item["date"], item["rollCall"]), reverse=True)
        write_json(
            VOTE_RECORDS_DIR / f"{official_id}.json",
            {
                "officialId": official_id,
                "name": official.get("name"),
                "level": "federal",
                "chamber": chamber,
                "session": f"{CONGRESS}th Congress, {SESSION}nd Session ({YEAR})",
                "lastUpdated": ACCESSED_DATE,
                "sourceLinks": [
                    {
                        "title": "House Clerk roll-call votes",
                        "url": HOUSE_INDEX_URL,
                    },
                    {
                        "title": "Senate roll-call votes",
                        "url": SENATE_MENU_URL,
                    },
                ],
                "summary": summarize_votes(votes),
                "votes": votes,
            },
        )
        written += 1

    print(f"Wrote {written} federal vote-record snapshots to {VOTE_RECORDS_DIR.relative_to(ROOT)}")
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
