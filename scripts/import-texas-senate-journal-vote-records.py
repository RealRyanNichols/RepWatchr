#!/usr/bin/env python3
"""Import Texas Senate record-vote snapshots from official Senate Journal PDFs.

Texas Legislature Online exposes House record votes through an AJAX endpoint.
Senate history rows point to Senate Journal PDF anchors instead, so this parser
reads those official journal pages and extracts the public Yeas/Nays sections.
It writes source-backed vote snapshots only; it does not assign ideology or
constitutional scores.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import tempfile
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

try:
    import pdfplumber
except ImportError as exc:  # pragma: no cover - local import script guard
    raise SystemExit("pdfplumber is required for Senate journal PDF parsing") from exc


ROOT = Path(__file__).resolve().parents[1]
TEXAS_OFFICIALS_DIR = ROOT / "src" / "data" / "officials" / "state"
VOTE_RECORDS_DIR = ROOT / "src" / "data" / "vote-records"

TLO_BASE = "https://capitol.texas.gov"
SENATE_BY_DATE = f"{TLO_BASE}/Reports/GeneralVotesByDateSenate.aspx"
HISTORY_URL = f"{TLO_BASE}/billlookup/History.aspx"

TODAY = dt.date.today()
DEFAULT_START = dt.date(2025, 1, 14)
DEFAULT_LIMIT = 120

LABEL_PATTERN = re.compile(r"\b(Yeas|Nays|Present(?:, not voting|-not voting|-not-voting)?|Present|Absent-excused|Absent):\s*", re.I)
STOP_PATTERN = re.compile(
    r"\n(?:The bill|The resolution|The amendment|SENATE BILL|HOUSE BILL|SENATE RESOLUTION|SENATE RESOLUTIONS|COMMITTEE\s+SUBSTITUTE|SENATE BILLS|HOUSE BILLS|MESSAGE FROM|HOUSE CHAMBER|RECESS|AFTER RECESS|CO-AUTHOR|CO-AUTHORS|CO-SPONSOR|CO-SPONSORS|MOTION TO ADJOURN|ADJOURNMENT|AAAPPENDIXAA)\b",
    re.I,
)


def request(url: str) -> urllib.request.Request:
    return urllib.request.Request(
        url,
        headers={
            "User-Agent": "RepWatchr Texas Senate journal vote importer",
            "Accept": "*/*",
        },
    )


def fetch_text(url: str, timeout: int = 30) -> str:
    with urllib.request.urlopen(request(url), timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def fetch_bytes(url: str, timeout: int = 45) -> bytes:
    with urllib.request.urlopen(request(url), timeout=timeout) as response:
        return response.read()


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


def safe_term_start(value: str | None) -> dt.date:
    if not value:
        return dt.date.min
    try:
        return dt.date.fromisoformat(value)
    except ValueError:
        return dt.date.min


def date_range(start: dt.date, end: dt.date) -> list[dt.date]:
    days: list[dt.date] = []
    current = start
    while current <= end:
        days.append(current)
        current += dt.timedelta(days=1)
    return days


def vote_date_url(date_value: dt.date) -> str:
    return f"{SENATE_BY_DATE}?{urllib.parse.urlencode({'date': display_date(date_value)})}"


def history_url(leg_sess: str, bill: str) -> str:
    return f"{HISTORY_URL}?{urllib.parse.urlencode({'Bill': bill, 'LegSess': leg_sess})}"


def extract_bill_links(page_html: str) -> set[tuple[str, str]]:
    links: set[tuple[str, str]] = set()
    pattern = re.compile(r"BillLookup/Actions\.aspx\?LegSess=([^&\"']+)&Bill=([^\"'#&]+)", re.I)
    for leg_sess, bill in pattern.findall(page_html):
        links.add((html.unescape(leg_sess), html.unescape(bill)))
    return links


def load_texas_senators() -> tuple[dict[str, dict[str, Any]], dict[str, set[str]], dict[str, dt.date]]:
    officials: dict[str, dict[str, Any]] = {}
    alias_candidates: dict[str, set[str]] = {}
    term_starts: dict[str, dt.date] = {}

    for path in sorted(TEXAS_OFFICIALS_DIR.glob("tx-*.json")):
        official = read_json(path)
        if not official or official.get("state") != "TX" or official.get("position") != "State Senator":
            continue
        official_id = str(official.get("id"))
        officials[official_id] = official
        term_starts[official_id] = safe_term_start(official.get("termStart"))

        first = clean_text(official.get("firstName"))
        last = clean_text(official.get("lastName"))
        name = clean_text(official.get("name"))
        aliases = {
            normalize_key(name),
            normalize_key(last),
            normalize_key(f"{first} {last}"),
            normalize_key(f"{last} {first}"),
        }
        if first:
            aliases.add(normalize_key(f"{first[0]} {last}"))
            aliases.add(normalize_key(f"{last} {first[0]}"))
        if official_id == "chuy-hinojosa":
            aliases.update({"j hinojosa", "hinojosa j", "juan hinojosa", "hinojosa juan"})
        for alias in aliases:
            if alias:
                alias_candidates.setdefault(alias, set()).add(official_id)

    return officials, alias_candidates, term_starts


def extract_senate_vote_specs(leg_sess: str, bill: str, page_html: str) -> list[dict[str, str]]:
    votes: list[dict[str, str]] = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", page_html, flags=re.I | re.S):
        if "senvote" not in row or "Record vote" not in row:
            continue
        chamber_match = re.search(r'data-label="Action Chamber"[^>]*>(.*?)</td>', row, flags=re.I | re.S)
        date_match = re.search(r'data-label="Action Date"[^>]*>(.*?)</td>', row, flags=re.I | re.S)
        anchor_match = re.search(r'<a[^>]+class="senvote"[^>]*>', row, flags=re.I | re.S)
        if not anchor_match:
            continue
        anchor = anchor_match.group(0)
        href_match = re.search(r'href="([^"]+)"', anchor, flags=re.I)
        vote_match = re.search(r'name="vote(\d+)"', anchor, flags=re.I)
        if not href_match or not vote_match:
            continue
        source_url = urllib.parse.urljoin(TLO_BASE, html.unescape(href_match.group(1)))
        vote_number = vote_match.group(1)
        if not chamber_match or clean_text(chamber_match.group(1)).upper()[:1] != "S" or not date_match:
            continue
        votes.append(
            {
                "legSess": leg_sess,
                "bill": bill,
                "recordVote": vote_number,
                "chamber": "S",
                "date": clean_text(date_match.group(1)),
                "sourceUrl": source_url,
            }
        )
    return votes


def collect_senate_vote_specs(start: dt.date, end: dt.date, history_workers: int) -> tuple[list[dict[str, str]], int, int]:
    bill_links: set[tuple[str, str]] = set()
    pages_checked = 0

    days = date_range(start, end)
    for day_index, day in enumerate(days, start=1):
        try:
            page_html = fetch_text(vote_date_url(day), timeout=12)
        except Exception:
            continue
        pages_checked += 1
        bill_links.update(extract_bill_links(page_html))
        if day_index % 30 == 0 or day_index == len(days):
            print(
                f"Checked {day_index}/{len(days)} Texas Senate calendar days; {len(bill_links)} bill pages queued.",
                flush=True,
            )

    def fetch_history(link: tuple[str, str]) -> tuple[tuple[str, str], list[dict[str, str]]]:
        leg_sess, bill = link
        page_html = fetch_text(history_url(leg_sess, bill), timeout=20)
        return link, extract_senate_vote_specs(leg_sess, bill, page_html)

    votes_by_key: dict[tuple[str, str, str, str, str], dict[str, str]] = {}
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
                key = (vote["legSess"], vote["bill"], vote["recordVote"], vote["date"], vote["sourceUrl"])
                votes_by_key[key] = vote
            if completed % 100 == 0 or completed == len(future_map):
                print(
                    f"Checked {completed}/{len(bill_links)} Texas Senate bill history pages; found {len(votes_by_key)} Senate journal votes.",
                    flush=True,
                )

    return (
        sorted(votes_by_key.values(), key=lambda item: (iso_date(item["date"]), int(item["recordVote"]), item["bill"])),
        pages_checked,
        len(bill_links),
    )


def journal_pdf_url(source_url: str) -> str:
    return source_url.split("#", 1)[0]


def journal_page_number(source_url: str) -> int | None:
    fragment = urllib.parse.urlparse(source_url).fragment
    params = urllib.parse.parse_qs(fragment)
    page = params.get("page", [None])[0]
    return int(page) if page and page.isdigit() else None


class PdfTextCache:
    def __init__(self) -> None:
        self.cache_dir = Path(tempfile.gettempdir()) / "repwatchr-texas-senate-journals"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.page_text: dict[tuple[str, int], str] = {}

    def page(self, pdf_url: str, page_number: int) -> str:
        key = (pdf_url, page_number)
        if key in self.page_text:
            return self.page_text[key]

        pdf_path = self.cache_dir / (normalize_key(Path(urllib.parse.urlparse(pdf_url).path).name) + ".pdf")
        if not pdf_path.exists():
            pdf_path.write_bytes(fetch_bytes(pdf_url))

        text = ""
        with pdfplumber.open(str(pdf_path)) as pdf:
            page_index = page_number - 1
            pieces: list[str] = []
            for index in [page_index, page_index + 1]:
                if 0 <= index < len(pdf.pages):
                    pieces.append(pdf.pages[index].extract_text(x_tolerance=1, y_tolerance=3) or "")
            text = "\n".join(pieces)

        self.page_text[key] = text
        return text


def normalize_journal_text(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = text.replace("ii", " ")
    text = re.sub(r"\b(Yeas|Nays)i(?=\d)", r"\1 ", text)
    text = re.sub(r":i+", ": ", text)
    text = re.sub(r"([A-Za-z])-?\s*\n\s*([A-Za-z])", r"\1 \2", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text


def bill_pattern(bill: str) -> re.Pattern[str]:
    match = re.match(r"([A-Z]+)(\d+)", bill.upper())
    if not match:
        return re.compile(re.escape(bill), re.I)
    prefix, number = match.groups()
    if prefix == "SB":
        return re.compile(rf"(?:CS)?S\s*B\s*i?\s*{number}|SENATE\s+BILL\s+{number}", re.I)
    if prefix == "HB":
        return re.compile(rf"(?:CS)?H\s*B\s*i?\s*{number}|HOUSE\s+BILL\s+{number}", re.I)
    if prefix == "SR":
        return re.compile(rf"S\s*R\s*i?\s*{number}|SENATE\s+RESOLUTION\s+{number}", re.I)
    return re.compile(rf"{re.escape(prefix)}\s*i?\s*{number}", re.I)


def segment_for_vote(page_text: str, bill: str) -> str:
    text = normalize_journal_text(page_text)
    match = bill_pattern(bill).search(text)
    if not match:
        return text[:3500]
    return text[match.start() : match.start() + 3500]


def clean_member_list(value: str) -> list[str]:
    value = re.sub(r"\([^)]*\)", " ", value)
    value = value.replace("\n", " ")
    value = re.sub(r"\bThe\s+.*$", " ", value)
    value = re.sub(r"\s+", " ", value).strip(" .;:")
    if not value:
        return []
    return [item.strip(" .;:") for item in re.split(r",|;", value) if item.strip(" .;:")]


def stop_index(value: str) -> int:
    match = STOP_PATTERN.search(value)
    return match.start() if match else len(value)


def parse_vote_sections(segment: str) -> tuple[dict[str, list[str]], bool]:
    segment = normalize_journal_text(segment)
    first_vote_line = re.search(r"following vote:\s*.*", segment, re.I)
    if first_vote_line:
        segment = segment[first_vote_line.start() :]

    matches = list(LABEL_PATTERN.finditer(segment))
    sections: dict[str, list[str]] = {}
    default_yea = bool(
        re.search(r'All Members are deemed to have voted "Yea"', segment, re.I)
        or re.search(r"Yeas?\s*[0-9]+,\s*Nays?\s*0", segment, re.I)
    )

    for index, match in enumerate(matches):
        label = normalize_key(match.group(1))
        next_start = matches[index + 1].start() if index + 1 < len(matches) else stop_index(segment[match.end() :]) + match.end()
        raw_value = segment[match.end() : next_start]
        sections[label] = clean_member_list(raw_value)

    return sections, default_yea


def active_senator_ids(officials: dict[str, dict[str, Any]], term_starts: dict[str, dt.date], vote_date: dt.date) -> set[str]:
    return {official_id for official_id in officials if term_starts.get(official_id, dt.date.min) <= vote_date}


def resolve_member(member_name: str, aliases: dict[str, set[str]], active_ids: set[str], unmatched: dict[str, int]) -> str | None:
    key = normalize_key(member_name)
    candidates = aliases.get(key, set()) & active_ids
    if len(candidates) == 1:
        return next(iter(candidates))
    if not candidates:
        unmatched[member_name] = unmatched.get(member_name, 0) + 1
    return None


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


def source_links() -> list[dict[str, str]]:
    return [
        {"title": "Texas Senate votes by date", "url": SENATE_BY_DATE},
        {"title": "Texas Legislature Online vote information", "url": f"{TLO_BASE}/billlookup/voteinfo.aspx"},
        {"title": "Texas Senate journal search", "url": "https://journals.senate.texas.gov/"},
    ]


def add_senate_vote_rows(
    vote: dict[str, str],
    sections: dict[str, list[str]],
    default_yea: bool,
    officials: dict[str, dict[str, Any]],
    aliases: dict[str, set[str]],
    term_starts: dict[str, dt.date],
    rows_by_official: dict[str, list[dict[str, Any]]],
    unmatched: dict[str, int],
) -> None:
    vote_date = parse_date(vote["date"])
    active_ids = active_senator_ids(officials, term_starts, vote_date)
    votes_for_ids: dict[str, tuple[str, str]] = {}
    section_member_total = sum(len(names) for names in sections.values())
    if section_member_total > 31:
        malformed_key = f"skipped malformed Senate vote section: {vote['bill']} {vote['date']} #{vote['recordVote']}"
        unmatched[malformed_key] = unmatched.get(malformed_key, 0) + 1
        return

    if default_yea:
        for official_id in active_ids:
            votes_for_ids[official_id] = ("yea", "Yea")

    label_map = [
        ("yeas", "yea", "Yea"),
        ("nays", "nay", "Nay"),
        ("present", "present", "Present"),
        ("present not voting", "present", "Present, not voting"),
        ("absent excused", "not-voting", "Absent, excused"),
        ("absent", "not-voting", "Absent"),
    ]
    for label, vote_value, vote_cast in label_map:
        for member_name in sections.get(label, []):
            official_id = resolve_member(member_name, aliases, active_ids, unmatched)
            if official_id:
                votes_for_ids[official_id] = (vote_value, vote_cast)

    if not votes_for_ids:
        return

    result_parts = []
    for key, display in [("yeas", "Yeas"), ("nays", "Nays"), ("present", "Present"), ("absent excused", "Absent-excused"), ("absent", "Absent")]:
        if sections.get(key):
            result_parts.append(f"{display}: {len(sections[key])}")
    result = ", ".join(result_parts) if result_parts else "Texas Senate journal roll call"
    source_id = f"tx-{vote['legSess'].lower()}-s-{int(vote['recordVote']):04d}-{normalize_key(vote['bill'])}"
    meta = {
        "sourceId": source_id,
        "sourceName": "Texas Senate Journal record vote",
        "sourceUrl": vote["sourceUrl"],
        "chamber": "senate",
        "congress": 89,
        "session": 2025,
        "rollCall": int(vote["recordVote"]),
        "date": vote_date.isoformat(),
        "issue": vote["bill"],
        "question": f"Texas Senate journal record vote on {vote['bill']}",
        "voteType": "Record vote",
        "result": result,
        "title": f"{vote['bill']} Senate record vote",
    }
    for official_id, (vote_value, vote_cast) in votes_for_ids.items():
        rows_by_official.setdefault(official_id, []).append({**meta, "vote": vote_value, "voteCast": vote_cast})


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start", default=DEFAULT_START.isoformat(), help="Start date, YYYY-MM-DD")
    parser.add_argument("--end", default=TODAY.isoformat(), help="End date, YYYY-MM-DD")
    parser.add_argument("--max-votes-per-official", type=int, default=DEFAULT_LIMIT)
    parser.add_argument("--history-workers", type=int, default=10)
    args = parser.parse_args()

    start = dt.date.fromisoformat(args.start)
    end = dt.date.fromisoformat(args.end)
    officials, aliases, term_starts = load_texas_senators()
    vote_specs, pages_checked, bill_count = collect_senate_vote_specs(start, end, args.history_workers)
    print(
        f"Collected {len(vote_specs)} Texas Senate journal vote specs from {pages_checked} date pages and {bill_count} bill pages.",
        flush=True,
    )

    pdf_cache = PdfTextCache()
    rows_by_official: dict[str, list[dict[str, Any]]] = {}
    unmatched: dict[str, int] = {}
    parsed = 0
    for vote in vote_specs:
        page_number = journal_page_number(vote["sourceUrl"])
        if not page_number:
            continue
        try:
            page_text = pdf_cache.page(journal_pdf_url(vote["sourceUrl"]), page_number)
            segment = segment_for_vote(page_text, vote["bill"])
            sections, default_yea = parse_vote_sections(segment)
            add_senate_vote_rows(vote, sections, default_yea, officials, aliases, term_starts, rows_by_official, unmatched)
            parsed += 1
        except Exception as exc:
            print(f"Warning: could not parse Senate journal vote {vote['bill']} {vote['date']} #{vote['recordVote']}: {exc}", flush=True)
        if parsed % 100 == 0:
            print(f"Parsed {parsed}/{len(vote_specs)} Texas Senate journal votes.", flush=True)

    VOTE_RECORDS_DIR.mkdir(parents=True, exist_ok=True)
    written = 0
    for official_id, official in sorted(officials.items()):
        votes = rows_by_official.get(official_id, [])
        votes = sorted(votes, key=lambda item: (item["date"], item["rollCall"], item["issue"]), reverse=True)
        if args.max_votes_per_official > 0:
            votes = votes[: args.max_votes_per_official]
        write_json(
            VOTE_RECORDS_DIR / f"{official_id}.json",
            {
                "officialId": official_id,
                "name": official.get("name"),
                "level": "state",
                "state": "TX",
                "chamber": "senate",
                "session": f"Texas Senate Journal records from {start.isoformat()} through {end.isoformat()}",
                "lastUpdated": TODAY.isoformat(),
                "sourceLinks": source_links(),
                "summary": summarize_votes(votes),
                "votes": votes,
            },
        )
        written += 1

    print(f"Parsed {parsed} Texas Senate journal vote pages.")
    print(f"Wrote {written} Texas Senate vote-record snapshots to {VOTE_RECORDS_DIR.relative_to(ROOT)}.")
    if unmatched:
        top = sorted(unmatched.items(), key=lambda item: item[1], reverse=True)[:25]
        print(f"Unmatched Texas Senate vote names: {len(unmatched)}")
        for name, count in top:
            print(f"- {name}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
