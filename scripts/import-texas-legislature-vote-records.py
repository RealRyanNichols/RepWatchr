#!/usr/bin/env python3
"""Import recent Texas Legislature record-vote snapshots.

Sources:
- Texas Legislature Online House votes-by-date pages.
- Texas Legislature Online bill history pages.
- Texas Legislature Online RecordVote AJAX endpoint.

This writes source-backed vote snapshots only. It does not assign left/right
ideology scores; that still requires separate issue-direction review.

Texas Senate history pages use a different vote reference shape. They are
intentionally left out until a Senate journal parser is added.
"""

from __future__ import annotations

import argparse
import ast
import datetime as dt
import html
import json
import re
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TEXAS_OFFICIALS_DIR = ROOT / "src" / "data" / "officials" / "state"
VOTE_RECORDS_DIR = ROOT / "src" / "data" / "vote-records"

TLO_BASE = "https://capitol.texas.gov"
HOUSE_BY_DATE = f"{TLO_BASE}/Reports/GeneralVotesByDateHouse.aspx"
SENATE_BY_DATE = f"{TLO_BASE}/Reports/GeneralVotesByDateSenate.aspx"
HISTORY_URL = f"{TLO_BASE}/billlookup/History.aspx"
RECORD_VOTE_URL = (
    f"{TLO_BASE}/ajax/TLC.TLO.Client.Controls.RecordVote,TLC.TLO.Client.ashx"
    "?_method=GetVote&_session=no"
)

TODAY = dt.date.today()
DEFAULT_START = dt.date(2025, 1, 14)
DEFAULT_LIMIT = 120


def request(url: str, data: bytes | None = None) -> urllib.request.Request:
    return urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": "RepWatchr Texas Legislature vote importer",
            "Accept": "*/*",
        },
    )


def fetch_text(url: str, data: bytes | None = None, timeout: int = 30) -> str:
    with urllib.request.urlopen(request(url, data=data), timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def read_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def clean_text(value: Any) -> str:
    text = re.sub(r"<[^>]+>", " ", str(value or ""))
    text = html.unescape(text).replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()


def normalize_key(value: str) -> str:
    value = value.replace("(C)", " ")
    value = value.replace(",", " ")
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", " ", value).lower()
    return re.sub(r"\s+", " ", value).strip()


def parse_date(value: str) -> dt.date:
    return dt.datetime.strptime(value, "%m/%d/%Y").date()


def display_date(value: dt.date) -> str:
    return value.strftime("%m/%d/%Y")


def iso_date(value: str) -> str:
    return parse_date(value).isoformat()


def load_texas_officials() -> tuple[dict[str, dict[str, Any]], dict[str, set[str]], dict[str, str]]:
    officials: dict[str, dict[str, Any]] = {}
    alias_candidates: dict[str, set[str]] = {}
    chamber_by_id: dict[str, str] = {}

    for path in sorted(TEXAS_OFFICIALS_DIR.glob("tx-*.json")):
        official = read_json(path)
        if not official or official.get("state") != "TX":
            continue
        official_id = str(official.get("id"))
        if not official_id:
            continue
        officials[official_id] = official
        position = str(official.get("position", ""))
        chamber_by_id[official_id] = "senate" if "Senator" in position else "house"

        first = clean_text(official.get("firstName"))
        last = clean_text(official.get("lastName"))
        name = clean_text(official.get("name"))
        aliases = {
            normalize_key(name),
            normalize_key(last),
            normalize_key(f"{last} {first}"),
        }
        if first:
            aliases.add(normalize_key(f"{last} {first[0]}"))
        for alias in aliases:
            if alias:
                alias_candidates.setdefault(alias, set()).add(official_id)

    speaker = next((item_id for item_id, item in officials.items() if item.get("name") == "Dustin Burrows"), None)
    if speaker:
        alias_candidates["mr speaker"] = {speaker}
        alias_candidates["speaker"] = {speaker}

    return officials, alias_candidates, chamber_by_id


def vote_date_url(chamber: str, date_value: dt.date) -> str:
    base = HOUSE_BY_DATE if chamber == "H" else SENATE_BY_DATE
    return f"{base}?{urllib.parse.urlencode({'date': display_date(date_value)})}"


def history_url(leg_sess: str, bill: str) -> str:
    return f"{HISTORY_URL}?{urllib.parse.urlencode({'Bill': bill, 'LegSess': leg_sess})}"


def extract_bill_links(page_html: str) -> set[tuple[str, str]]:
    links: set[tuple[str, str]] = set()
    pattern = re.compile(r"BillLookup/Actions\.aspx\?LegSess=([^&\"']+)&Bill=([^\"'#&]+)", re.I)
    for leg_sess, bill in pattern.findall(page_html):
        links.add((html.unescape(leg_sess), html.unescape(bill)))
    return links


def extract_direct_vote_calls(page_html: str) -> list[dict[str, str]]:
    calls: list[dict[str, str]] = []
    pattern = re.compile(
        r"setRecordVoteParms\(\s*'[^']*'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)",
        re.I,
    )
    for leg_sess, bill, record_vote, chamber, action_date, vote_type in pattern.findall(page_html):
        if not record_vote.isdigit():
            continue
        calls.append(
            {
                "legSess": leg_sess,
                "bill": bill,
                "recordVote": record_vote,
                "chamber": chamber,
                "date": action_date,
                "type": vote_type,
                "sourceUrl": vote_date_url(chamber, parse_date(action_date)),
            }
        )
    return calls


def extract_record_votes_from_history(leg_sess: str, bill: str, page_html: str) -> list[dict[str, str]]:
    votes: list[dict[str, str]] = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", page_html, flags=re.I | re.S):
        if "Record vote" not in row or "RV#" not in row:
            continue
        chamber_match = re.search(r'data-label="Action Chamber"[^>]*>(.*?)</td>', row, flags=re.I | re.S)
        comment_match = re.search(r'data-label="Action Comment"[^>]*>(.*?)</td>', row, flags=re.I | re.S)
        date_match = re.search(r'data-label="Action Date"[^>]*>(.*?)</td>', row, flags=re.I | re.S)
        link_match = re.search(r'<a[^>]+href="([^"]+)"[^>]*>\s*Record vote\s*</a>', row, flags=re.I | re.S)
        if not chamber_match or not comment_match or not date_match:
            continue
        rv_match = re.search(r"RV#\s*(\d+)", clean_text(comment_match.group(1)), flags=re.I)
        if not rv_match:
            continue
        chamber = clean_text(chamber_match.group(1)).upper()[:1]
        action_date = clean_text(date_match.group(1))
        source_url = history_url(leg_sess, bill)
        if link_match:
            source_url = urllib.parse.urljoin(TLO_BASE, html.unescape(link_match.group(1)))
        votes.append(
            {
                "legSess": leg_sess,
                "bill": bill,
                "recordVote": rv_match.group(1),
                "chamber": chamber,
                "date": action_date,
                "type": "",
                "sourceUrl": source_url,
            }
        )
    return votes


def fetch_record_vote(vote: dict[str, str]) -> dict[str, Any] | None:
    body = "\r\n".join(
        [
            f"legSess={vote['legSess']}",
            f"bill={vote.get('bill', '')}",
            f"recordVote={vote['recordVote']}",
            f"chamber={vote['chamber']}",
            f"actionDate={vote['date']}",
            f"type={vote.get('type', '')}",
        ]
    ).encode("utf-8")
    raw = fetch_text(RECORD_VOTE_URL, data=body, timeout=30).strip()
    try:
        decoded = ast.literal_eval(raw)
        payload = json.loads(decoded)
    except (ValueError, SyntaxError, json.JSONDecodeError):
        return None
    if not payload.get("VoteExist"):
        return None
    return payload


def parse_member_list(value: str) -> list[str]:
    text = clean_text(value)
    if " - " in text:
        text = text.split(" - ", 1)[1]
    return [item.strip() for item in text.split(";") if item.strip()]


def summarize_votes(votes: list[dict[str, Any]]) -> dict[str, int]:
    summary = {"totalVotesLoaded": len(votes), "yea": 0, "nay": 0, "present": 0, "notVoting": 0, "other": 0}
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


def source_links_for_chamber(chamber: str) -> list[dict[str, str]]:
    links = [
        {
            "title": "Texas Legislature Online vote information",
            "url": f"{TLO_BASE}/billlookup/voteinfo.aspx",
        }
    ]
    if chamber == "house":
        return [{"title": "Texas House votes by date", "url": HOUSE_BY_DATE}, *links]
    return [{"title": "Texas Senate votes by date", "url": SENATE_BY_DATE}, *links]


def add_member_votes(
    rows_by_official: dict[str, list[dict[str, Any]]],
    alias_candidates: dict[str, set[str]],
    chamber_by_id: dict[str, str],
    meta: dict[str, Any],
    member_names: list[str],
    vote_value: str,
    vote_cast: str,
    unmatched: dict[str, int],
) -> None:
    for member_name in member_names:
        key = normalize_key(member_name)
        candidates = alias_candidates.get(key, set())
        if len(candidates) > 1:
            candidates = {item for item in candidates if chamber_by_id.get(item) == meta["chamber"]}
        official_id = next(iter(candidates)) if len(candidates) == 1 else None
        if not official_id:
            unmatched[member_name] = unmatched.get(member_name, 0) + 1
            continue
        rows_by_official.setdefault(official_id, []).append({**meta, "vote": vote_value, "voteCast": vote_cast})


def build_vote_rows(
    vote: dict[str, str],
    payload: dict[str, Any],
    alias_candidates: dict[str, set[str]],
    chamber_by_id: dict[str, str],
    rows_by_official: dict[str, list[dict[str, Any]]],
    unmatched: dict[str, int],
) -> None:
    description_value = clean_text(payload.get("DescriptionValue")) or vote.get("bill") or "Texas Legislature record vote"
    totals = clean_text(payload.get("Totals"))
    chamber = "house" if vote["chamber"] == "H" else "senate"
    source_id = f"tx-{vote['legSess'].lower()}-{vote['chamber'].lower()}-{int(vote['recordVote']):04d}"
    meta = {
        "sourceId": source_id,
        "sourceName": "Texas Legislature Online record vote",
        "sourceUrl": vote["sourceUrl"],
        "sourceLookupUrl": vote_date_url(vote["chamber"], parse_date(vote["date"])),
        "chamber": chamber,
        "session": vote["legSess"],
        "rollCall": int(vote["recordVote"]),
        "date": iso_date(vote["date"]),
        "issue": vote.get("bill") or description_value,
        "question": description_value,
        "voteType": clean_text(payload.get("Description")) or "Record vote",
        "result": totals,
        "title": description_value,
    }
    add_member_votes(rows_by_official, alias_candidates, chamber_by_id, meta, parse_member_list(payload.get("Yeas", "")), "yea", "Yea", unmatched)
    add_member_votes(rows_by_official, alias_candidates, chamber_by_id, meta, parse_member_list(payload.get("Nays", "")), "nay", "Nay", unmatched)
    add_member_votes(rows_by_official, alias_candidates, chamber_by_id, meta, parse_member_list(payload.get("Present", "")), "present", "Present", unmatched)
    add_member_votes(rows_by_official, alias_candidates, chamber_by_id, meta, parse_member_list(payload.get("Pnv", "")), "present", "Present, not voting", unmatched)
    for key, label in [
        ("AbsentExcused", "Absent, excused"),
        ("AbsentCommittee", "Absent, committee"),
        ("Absent", "Absent"),
    ]:
        add_member_votes(rows_by_official, alias_candidates, chamber_by_id, meta, parse_member_list(payload.get(key, "")), "not-voting", label, unmatched)


def date_range(start: dt.date, end: dt.date) -> list[dt.date]:
    days: list[dt.date] = []
    current = start
    while current <= end:
        days.append(current)
        current += dt.timedelta(days=1)
    return days


def collect_vote_specs(start: dt.date, end: dt.date, history_workers: int) -> tuple[list[dict[str, str]], int, int]:
    direct_votes: dict[tuple[str, str, str, str, str], dict[str, str]] = {}
    bill_links: set[tuple[str, str]] = set()
    pages_checked = 0

    days = date_range(start, end)
    for day_index, day in enumerate(days, start=1):
        for chamber in ["H", "S"]:
            try:
                page_html = fetch_text(vote_date_url(chamber, day), timeout=12)
            except Exception:
                continue
            pages_checked += 1
            bill_links.update(extract_bill_links(page_html))
            for vote in extract_direct_vote_calls(page_html):
                key = (vote["legSess"], vote.get("bill", ""), vote["recordVote"], vote["chamber"], vote["date"])
                direct_votes[key] = vote
        if day_index % 30 == 0 or day_index == len(days):
            print(
                f"Checked {day_index}/{len(days)} Texas calendar days; "
                f"{len(bill_links)} bill pages queued, {len(direct_votes)} direct record votes found.",
                flush=True,
            )

    def fetch_history(link: tuple[str, str]) -> tuple[tuple[str, str], list[dict[str, str]]]:
        leg_sess, bill = link
        page_html = fetch_text(history_url(leg_sess, bill), timeout=20)
        return link, extract_record_votes_from_history(leg_sess, bill, page_html)

    history_votes: dict[tuple[str, str, str, str, str], dict[str, str]] = {}
    completed = 0
    with ThreadPoolExecutor(max_workers=max(1, history_workers)) as executor:
        future_map = {executor.submit(fetch_history, link): link for link in sorted(bill_links)}
        for future in as_completed(future_map):
            completed += 1
            try:
                _, votes = future.result()
            except Exception:
                votes = []
            for vote in votes:
                key = (vote["legSess"], vote.get("bill", ""), vote["recordVote"], vote["chamber"], vote["date"])
                history_votes[key] = vote
            if completed % 100 == 0 or completed == len(future_map):
                print(f"Checked {completed}/{len(bill_links)} Texas bill history pages; found {len(history_votes)} record votes.", flush=True)

    all_votes = {**history_votes, **direct_votes}
    return sorted(all_votes.values(), key=lambda item: (iso_date(item["date"]), item["chamber"], int(item["recordVote"]))), pages_checked, len(bill_links)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start", default=DEFAULT_START.isoformat(), help="Start date, YYYY-MM-DD")
    parser.add_argument("--end", default=TODAY.isoformat(), help="End date, YYYY-MM-DD")
    parser.add_argument("--max-votes-per-official", type=int, default=DEFAULT_LIMIT)
    parser.add_argument("--history-workers", type=int, default=8, help="Concurrent Texas bill-history page fetches")
    parser.add_argument("--vote-workers", type=int, default=12, help="Concurrent Texas record-vote payload fetches")
    args = parser.parse_args()

    start = dt.date.fromisoformat(args.start)
    end = dt.date.fromisoformat(args.end)
    officials, alias_candidates, chamber_by_id = load_texas_officials()
    tx_ids = set(officials)
    vote_specs, pages_checked, bill_count = collect_vote_specs(start, end, args.history_workers)
    print(
        f"Collected {len(vote_specs)} Texas record-vote specs from {pages_checked} date pages and {bill_count} bill pages.",
        flush=True,
    )

    rows_by_official: dict[str, list[dict[str, Any]]] = {}
    unmatched: dict[str, int] = {}
    fetched = 0
    completed = 0
    with ThreadPoolExecutor(max_workers=max(1, args.vote_workers)) as executor:
        future_map = {executor.submit(fetch_record_vote, vote): vote for vote in vote_specs}
        for future in as_completed(future_map):
            completed += 1
            vote = future_map[future]
            try:
                payload = future.result()
            except Exception as exc:
                print(f"Warning: could not fetch RV#{vote['recordVote']} {vote['date']} {vote.get('bill', '')}: {exc}", flush=True)
                payload = None
            if payload:
                fetched += 1
                build_vote_rows(vote, payload, alias_candidates, chamber_by_id, rows_by_official, unmatched)
            if completed % 100 == 0 or completed == len(future_map):
                print(f"Fetched {completed}/{len(vote_specs)} Texas record votes.", flush=True)

    VOTE_RECORDS_DIR.mkdir(parents=True, exist_ok=True)
    for path in VOTE_RECORDS_DIR.glob("*.json"):
        existing = read_json(path) or {}
        if path.stem in tx_ids and existing.get("level") == "state":
            path.unlink()

    written = 0
    for official_id, official in sorted(officials.items()):
        votes = rows_by_official.get(official_id, [])
        if not votes:
            continue
        votes = sorted(votes, key=lambda item: (item["date"], item["rollCall"]), reverse=True)
        if args.max_votes_per_official > 0:
            votes = votes[: args.max_votes_per_official]
        chamber = chamber_by_id.get(official_id, "house")
        write_json(
            VOTE_RECORDS_DIR / f"{official_id}.json",
            {
                "officialId": official_id,
                "name": official.get("name"),
                "level": "state",
                "state": "TX",
                "chamber": chamber,
                "session": f"Texas Legislature records from {start.isoformat()} through {end.isoformat()}",
                "lastUpdated": TODAY.isoformat(),
                "sourceLinks": source_links_for_chamber(chamber),
                "summary": summarize_votes(votes),
                "votes": votes,
            },
        )
        written += 1

    print(f"Fetched {fetched} Texas record-vote payloads.")
    print(f"Wrote {written} Texas state vote-record snapshots to {VOTE_RECORDS_DIR.relative_to(ROOT)}.")
    if unmatched:
        top = sorted(unmatched.items(), key=lambda item: item[1], reverse=True)[:25]
        print(f"Unmatched Texas vote names: {len(unmatched)}")
        for name, count in top:
            print(f"- {name}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
