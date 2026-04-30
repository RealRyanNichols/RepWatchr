#!/usr/bin/env python3
"""Import aggregate Texas county voter-registration figures from the SOS page."""

from __future__ import annotations

import datetime as dt
import html
import json
import re
import urllib.request
from pathlib import Path


SOURCE_URL = "https://www.sos.texas.gov/elections/historical/mar2026.shtml"
SOURCE_TITLE = "Texas Secretary of State March 2026 Voter Registration Figures"
OUTPUT_PATH = Path("src/data/texas-voter-registration-march-2026.json")


def clean_cell(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def parse_int(value: str) -> int:
    return int(value.replace(",", "").strip())


def title_county(value: str) -> str:
    return " ".join(part.capitalize() for part in value.split())


def parse_rows(markup: str) -> tuple[list[dict[str, int | str]], dict[str, int | str]]:
    counties: list[dict[str, int | str]] = []
    statewide: dict[str, int | str] | None = None
    for row_markup in re.findall(r"<tr[^>]*>(.*?)</tr>", markup, flags=re.IGNORECASE | re.DOTALL):
        cells = [
            clean_cell(cell)
            for cell in re.findall(r"<(?:th|td)[^>]*>(.*?)</(?:th|td)>", row_markup, flags=re.IGNORECASE | re.DOTALL)
        ]
        if len(cells) != 5 or cells[0] == "County Name":
            continue

        county_name, precincts, registered, suspense, non_suspense = cells
        item: dict[str, int | str] = {
            "countyName": "Statewide Total" if county_name == "STATEWIDE TOTAL" else title_county(county_name),
            "precincts": parse_int(precincts),
            "voterRegistration": parse_int(registered),
            "suspenseVoters": parse_int(suspense),
            "nonSuspenseVoters": parse_int(non_suspense),
        }
        if county_name == "STATEWIDE TOTAL":
            statewide = item
        else:
            counties.append(item)

    if statewide is None:
        raise RuntimeError("Could not find STATEWIDE TOTAL row in Texas SOS voter-registration table.")
    if len(counties) < 250:
        raise RuntimeError(f"Expected Texas county rows, found only {len(counties)}.")
    return counties, statewide


def main() -> None:
    request = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "RepWatchr data import"})
    with urllib.request.urlopen(request, timeout=30) as response:
        markup = response.read().decode("utf-8", errors="replace")

    counties, statewide = parse_rows(markup)
    payload = {
        "meta": {
            "sourceTitle": SOURCE_TITLE,
            "sourceUrl": SOURCE_URL,
            "snapshotLabel": "March 2026",
            "accessedDate": dt.date.today().isoformat(),
            "scope": "Aggregate county-level voter-registration figures only. No individual voter records are imported.",
        },
        "statewideTotal": statewide,
        "counties": counties,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {len(counties)} county rows to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
