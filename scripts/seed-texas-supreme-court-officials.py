#!/usr/bin/env python3
"""Seed current Texas Supreme Court profiles from official court pages.

These are judicial profiles, not legislative roll-call profiles. Opinions and
orders should be imported into a judicial-record lane instead of the
src/data/vote-records legislative snapshot lane.
"""

from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
STATE_OFFICIALS_DIR = ROOT / "src" / "data" / "officials" / "state"
TODAY = dt.date.today().isoformat()

COURT_HOME = "https://www.txcourts.gov/supreme/"
JUSTICES_URL = "https://www.txcourts.gov/supreme/about-the-court/justices/"
ORDERS_OPINIONS_URL = "https://www.txcourts.gov/supreme/orders-opinions/"
CASE_SEARCH_URL = "https://search.txcourts.gov/CaseSearch.aspx?coa=cossup"


JUSTICES: list[dict[str, str]] = [
    {
        "id": "tx-supreme-jimmy-blacklock",
        "name": "Jimmy Blacklock",
        "firstName": "Jimmy",
        "lastName": "Blacklock",
        "position": "Chief Justice, Supreme Court of Texas",
        "district": "Chief Justice",
        "termStart": "2018-01",
        "profileUrl": f"{JUSTICES_URL}chief-justice-jimmy-blacklock/",
        "bio": (
            "Jimmy Blacklock serves as Chief Justice of the Supreme Court of Texas. "
            "The Texas Judicial Branch says he was appointed to the Court in January 2018, "
            "re-elected in 2024, and appointed Chief Justice in January 2025."
        ),
    },
    {
        "id": "tx-supreme-debra-lehrmann",
        "name": "Debra Lehrmann",
        "firstName": "Debra",
        "lastName": "Lehrmann",
        "position": "Justice, Supreme Court of Texas",
        "district": "Place 3",
        "termStart": "Source review pending",
        "profileUrl": f"{JUSTICES_URL}justice-debra-lehrmann/",
        "bio": (
            "Debra Lehrmann serves as Place 3 Justice on the Supreme Court of Texas. "
            "The Texas Judicial Branch describes her as the Court's senior justice and longest-serving woman justice in Texas history."
        ),
    },
    {
        "id": "tx-supreme-john-phillip-devine",
        "name": "John Phillip Devine",
        "firstName": "John Phillip",
        "lastName": "Devine",
        "position": "Justice, Supreme Court of Texas",
        "district": "Place 4",
        "termStart": "2013-01",
        "profileUrl": f"{JUSTICES_URL}justice-john-phillip-devine/",
        "bio": (
            "John Phillip Devine serves as Place 4 Justice on the Supreme Court of Texas. "
            "The Texas Judicial Branch says he was first elected to the Court in November 2012."
        ),
    },
    {
        "id": "tx-supreme-brett-busby",
        "name": "Brett Busby",
        "firstName": "Brett",
        "lastName": "Busby",
        "position": "Justice, Supreme Court of Texas",
        "district": "Place 8",
        "termStart": "2019",
        "profileUrl": f"{JUSTICES_URL}justice-brett-busby/",
        "bio": (
            "Brett Busby serves as Place 8 Justice on the Supreme Court of Texas. "
            "The Texas Judicial Branch says he was appointed in 2019, confirmed by the Texas Senate, and elected to a full term in 2020."
        ),
    },
    {
        "id": "tx-supreme-jane-bland",
        "name": "Jane Bland",
        "firstName": "Jane",
        "lastName": "Bland",
        "position": "Justice, Supreme Court of Texas",
        "district": "Place 6",
        "termStart": "2019",
        "profileUrl": f"{JUSTICES_URL}justice-jane-bland/",
        "bio": (
            "Jane Bland serves as Place 6 Justice on the Supreme Court of Texas. "
            "The Texas Judicial Branch says she has served on the Court since 2019 after prior service on the First Court of Appeals and as a state district judge."
        ),
    },
    {
        "id": "tx-supreme-rebeca-aizpuru-huddle",
        "name": "Rebeca Aizpuru Huddle",
        "firstName": "Rebeca",
        "lastName": "Huddle",
        "position": "Justice, Supreme Court of Texas",
        "district": "Place 5",
        "termStart": "2020-10",
        "profileUrl": f"{JUSTICES_URL}justice-rebeca-aizpuru-huddle/",
        "bio": (
            "Rebeca Aizpuru Huddle serves as Place 5 Justice on the Supreme Court of Texas. "
            "The Texas Judicial Branch says she was appointed in October 2020 and elected to a full term in 2022."
        ),
    },
    {
        "id": "tx-supreme-evan-a-young",
        "name": "Evan A. Young",
        "firstName": "Evan",
        "lastName": "Young",
        "position": "Justice, Supreme Court of Texas",
        "district": "Place 9",
        "termStart": "2021-11",
        "profileUrl": f"{JUSTICES_URL}justice-evan-a-young/",
        "bio": (
            "Evan A. Young serves as Place 9 Justice on the Supreme Court of Texas. "
            "The Texas Judicial Branch says he was appointed in November 2021 and elected in November 2022 to a term expiring December 31, 2028."
        ),
    },
    {
        "id": "tx-supreme-james-p-sullivan",
        "name": "James P. Sullivan",
        "firstName": "James",
        "lastName": "Sullivan",
        "position": "Justice, Supreme Court of Texas",
        "district": "Place 2",
        "termStart": "2025-01",
        "profileUrl": f"{JUSTICES_URL}justice-james-p-sullivan/",
        "bio": (
            "James P. Sullivan serves as Place 2 Justice on the Supreme Court of Texas. "
            "The Texas Judicial Branch says he was appointed to the Court in January 2025."
        ),
    },
    {
        "id": "tx-supreme-kyle-d-hawkins",
        "name": "Kyle D. Hawkins",
        "firstName": "Kyle",
        "lastName": "Hawkins",
        "position": "Justice, Supreme Court of Texas",
        "district": "Place 7",
        "termStart": "2025-10",
        "profileUrl": f"{JUSTICES_URL}justice-kyle-d-hawkins/",
        "bio": (
            "Kyle D. Hawkins serves as Place 7 Justice on the Supreme Court of Texas. "
            "The Texas Judicial Branch says he was appointed to the Court in October 2025."
        ),
    },
]


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def profile_payload(justice: dict[str, str]) -> dict[str, Any]:
    return {
        "id": justice["id"],
        "name": justice["name"],
        "firstName": justice["firstName"],
        "lastName": justice["lastName"],
        "party": "NP",
        "level": "state",
        "position": justice["position"],
        "district": justice["district"],
        "jurisdiction": "Texas Supreme Court",
        "county": ["Texas"],
        "termStart": justice["termStart"],
        "termEnd": "Current court term pending election-record review",
        "contactInfo": {
            "office": "Supreme Court Building, 201 W. 14th Street, Room 104, Austin, Texas 78701",
            "phone": "(512) 463-1312",
            "website": justice["profileUrl"],
        },
        "bio": justice["bio"],
        "campaignPromises": [],
        "reviewStatus": "source_seeded",
        "state": "TX",
        "sourceLinks": [
            {"title": "Official Texas Judicial Branch justice profile", "url": justice["profileUrl"]},
            {"title": "Texas Supreme Court justices roster", "url": JUSTICES_URL},
            {"title": "Texas Supreme Court orders and opinions", "url": ORDERS_OPINIONS_URL},
            {"title": "Texas Supreme Court case search", "url": CASE_SEARCH_URL},
            {"title": "Texas Supreme Court home", "url": COURT_HOME},
        ],
        "lastVerifiedAt": TODAY,
    }


def main() -> int:
    for justice in JUSTICES:
        path = STATE_OFFICIALS_DIR / f"{justice['id']}.json"
        write_json(path, profile_payload(justice))
    print(f"Seeded {len(JUSTICES)} Texas Supreme Court profiles.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
