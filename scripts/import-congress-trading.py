#!/usr/bin/env python3
"""Import a Congress trading disclosure snapshot for RepWatchr profiles.

This importer uses the public GovTrades aggregate table as a secondary tracker
and maps rows to current federal RepWatchr profile IDs when the current profile
name matches. Official House Clerk and Senate eFD search pages remain attached
as the source-of-record disclosure portals.
"""

from __future__ import annotations

import datetime as dt
import html
import json
import re
import unicodedata
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
FEDERAL_OFFICIALS_DIR = ROOT / "src" / "data" / "officials" / "federal"
OUTPUT_DIR = ROOT / "src" / "data" / "congress-trading"
SNAPSHOT_DATE = dt.date.today().isoformat()

GOVTRADES_URL = "https://www.govtrades.com/congress-stock-tracker"
GOVTRADES_BASE = "https://www.govtrades.com"
HOUSE_DISCLOSURE_URL = "https://disclosures-clerk.house.gov/FinancialDisclosure/ViewSearch"
SENATE_DISCLOSURE_URL = "https://efdsearch.senate.gov/search/home/"

ROW_RE = re.compile(
    r'<tr><td class="row-number">(?P<rank>\d+)</td>'
    r'<td class="text-center"><span class="popularity-badge [^"]+" title="(?P<note>[^"]*)">(?P<popularity>\d+)</span></td>'
    r'<td><a class="table-link" href="(?P<href>[^"]+)">(?P<name>.*?)</a></td>'
    r'<td><span class="chamber-badge (?P<chamber_class>[^"]+)">(?P<chamber>.*?)</span></td>'
    r'<td class="text-muted">(?P<district>.*?)</td>'
    r'<td class="text-right text-muted">(?P<filings>\d+)</td>'
    r'<td class="text-right text-muted">(?P<transactions>\d+)</td>'
    r'<td class="text-right text-muted">(?P<last>[^<]+)</td></tr>'
)

TOTALS_RE = re.compile(
    r"<div class=\"stat-number\">(?P<politicians>[\d,]+)</div><div class=\"stat-label\">Politicians</div>.*?"
    r"<div class=\"stat-number\">(?P<transactions>[\d,]+)</div><div class=\"stat-label\">Transactions</div>",
    re.DOTALL,
)

MANUAL_ALIASES = {
    "a mitchell mcconnell": "mitch-mcconnell",
    "mitchell mcconnell": "mitch-mcconnell",
    "rafael e cruz": "ted-cruz",
    "thomas h tuberville tuberville tommy": "tommy-tuberville",
    "thomas h tuberville": "tommy-tuberville",
    "david h mccormick mccormick david h": "david-mccormick",
    "david h mccormick": "david-mccormick",
    "william cassidy": "bill-cassidy",
    "john f reed": "jack-reed",
    "donald sternoff beyer": "donald-s-beyer-jr",
    "donald sternoff beyer j": "donald-s-beyer-jr",
    "john w hickenlooper": "john-hickenlooper",
    "earl leroy carter": "earl-l-buddy-carter",
    "michael k simpson": "mike-simpson",
    "neal patrick dunn": "neal-p-dunn",
    "robert j wittman": "robert-j-wittman",
    "thomas suozzi": "tom-suozzi",
    "william r keating": "bill-keating",
}


def normalize_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", html.unescape(value or ""))
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower().replace("&", " and ")
    normalized = re.sub(
        r"\b(mr|mrs|ms|miss|dr|hon|honorable|senator|representative|rep)\b",
        " ",
        normalized,
    )
    normalized = re.sub(r"\b(jr|sr|ii|iii|iv|md|facs|former)\b", " ", normalized)
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized).strip()
    return re.sub(r"\s+", " ", normalized)


def name_variants(value: str) -> set[str]:
    base = normalize_name(value)
    parts = base.split()
    variants = {base}
    if len(parts) >= 2:
        variants.add(f"{parts[0]} {parts[-1]}")
    if len(parts) >= 3 and len(parts[0]) == 1:
        variants.add(" ".join(parts[1:]))
        variants.add(f"{parts[1]} {parts[-1]}")
    if len(parts) >= 4:
        variants.add(f"{parts[0]} {parts[1]} {parts[-1]}")
    return {variant for variant in variants if variant}


def clean_cell(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub("<[^>]+>", " ", value))).strip()


def load_current_federal_lookup() -> tuple[set[str], dict[str, list[str]]]:
    profile_ids: set[str] = set()
    lookup: dict[str, list[str]] = {}

    for file_path in FEDERAL_OFFICIALS_DIR.glob("*.json"):
        data = json.loads(file_path.read_text())
        profile_id = data["id"]
        profile_ids.add(profile_id)
        possible_names = {
            data.get("name", ""),
            f"{data.get('firstName', '')} {data.get('lastName', '')}",
        }
        for name in possible_names:
            for variant in name_variants(name):
                lookup.setdefault(variant, []).append(profile_id)

    return profile_ids, lookup


def parse_tracker_rows(raw_html: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for match in ROW_RE.finditer(raw_html):
        group = match.groupdict()
        chamber = clean_cell(group["chamber"]).lower()
        rows.append(
            {
                "rank": int(group["rank"]),
                "name": clean_cell(group["name"]),
                "chamber": "senate" if chamber == "senate" else "house",
                "district": clean_cell(group["district"]).replace("—", ""),
                "filings": int(group["filings"]),
                "transactions": int(group["transactions"]),
                "lastFilingDate": clean_cell(group["last"]),
                "popularityScore": int(group["popularity"]),
                "popularityNote": clean_cell(group["note"]),
                "trackerUrl": f"{GOVTRADES_BASE}{group['href']}",
            }
        )
    return rows


def find_profile_id(row: dict[str, Any], profile_ids: set[str], lookup: dict[str, list[str]]) -> str | None:
    matches: set[str] = set()
    for variant in name_variants(str(row["name"])):
        alias = MANUAL_ALIASES.get(variant)
        if alias and alias in profile_ids:
            return alias
        matches.update(lookup.get(variant, []))

    return next(iter(matches)) if len(matches) == 1 else None


def risk_for(row: dict[str, Any]) -> tuple[str, list[str]]:
    filings = int(row["filings"])
    transactions = int(row["transactions"])
    popularity = int(row["popularityScore"])
    last_filing = str(row["lastFilingDate"])
    reasons = [
        f"{transactions:,} disclosed transaction rows in the tracker",
        f"{filings:,} disclosure filings in the tracker",
        f"latest tracker filing date {last_filing}",
    ]

    if transactions >= 1000 or filings >= 100:
        level = "critical"
    elif transactions >= 300 or filings >= 50 or (transactions >= 150 and filings >= 25):
        level = "high"
    else:
        level = "watch"

    if popularity >= 80:
        reasons.append(f"tracker attention score {popularity}/100")

    return level, reasons


def official_disclosure_source(chamber: str) -> tuple[str, str]:
    if chamber == "senate":
        return "Senate eFD search", SENATE_DISCLOSURE_URL
    return "House Clerk financial disclosure search", HOUSE_DISCLOSURE_URL


def totals_from_html(raw_html: str, rows: list[dict[str, Any]]) -> tuple[int, int]:
    match = TOTALS_RE.search(raw_html)
    if not match:
        return len(rows), sum(int(row["transactions"]) for row in rows)
    return (
        int(match.group("politicians").replace(",", "")),
        int(match.group("transactions").replace(",", "")),
    )


def main() -> None:
    raw_html = urllib.request.urlopen(GOVTRADES_URL, timeout=45).read().decode("utf-8")
    profile_ids, lookup = load_current_federal_lookup()
    parsed_rows = parse_tracker_rows(raw_html)
    tracker_politicians, tracker_transactions = totals_from_html(raw_html, parsed_rows)
    records: list[dict[str, Any]] = []
    unmatched_records: list[dict[str, Any]] = []

    for row in parsed_rows:
        risk_level, risk_reasons = risk_for(row)
        official_source_name, official_source_url = official_disclosure_source(str(row["chamber"]))
        profile_id = find_profile_id(row, profile_ids, lookup)
        record = {
            "id": f"govtrades-{SNAPSHOT_DATE}-{row['rank']}",
            **row,
            "officialDisclosureUrl": official_source_url,
            "officialDisclosureName": official_source_name,
            "riskLevel": risk_level,
            "riskReasons": risk_reasons,
            "status": "matched_current_profile" if profile_id else "unmatched_or_former_profile",
        }
        if profile_id:
            record["officialId"] = profile_id
            records.append(record)
        else:
            unmatched_records.append(record)

    current_profiles = {record["officialId"] for record in records}
    dataset = {
        "snapshotDate": SNAPSHOT_DATE,
        "source": {
            "name": "GovTrades Congress Stock Tracker",
            "url": GOVTRADES_URL,
            "retrievedDate": SNAPSHOT_DATE,
            "tier": "secondary_tracker",
        },
        "officialSources": [
            {
                "name": "House Clerk Financial Disclosure Reports Database",
                "url": HOUSE_DISCLOSURE_URL,
                "retrievedDate": SNAPSHOT_DATE,
                "tier": "official_record",
            },
            {
                "name": "Senate eFD search",
                "url": SENATE_DISCLOSURE_URL,
                "retrievedDate": SNAPSHOT_DATE,
                "tier": "official_record",
            },
        ],
        "totals": {
            "trackerPoliticians": tracker_politicians,
            "trackerTransactions": tracker_transactions,
            "rowsParsed": len(parsed_rows),
            "matchedCurrentProfiles": len(records),
            "unmatchedOrFormerProfiles": len(unmatched_records),
            "currentProfilesWithRows": len(current_profiles),
            "criticalRows": sum(1 for record in records if record["riskLevel"] == "critical"),
            "highRows": sum(1 for record in records if record["riskLevel"] == "high"),
        },
        "records": records,
        "unmatchedRecords": unmatched_records,
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"govtrades-congress-stock-tracker-{SNAPSHOT_DATE}.json"
    output_path.write_text(json.dumps(dataset, indent=2, sort_keys=False) + "\n")
    print(
        f"Wrote {output_path.relative_to(ROOT)} with "
        f"{len(records)} mapped rows and {len(unmatched_records)} unmatched/former rows."
    )


if __name__ == "__main__":
    main()
