#!/usr/bin/env python3
"""Import current Texas federal and state elected officials.

Sources:
- Federal roster: unitedstates/congress-legislators current YAML.
- Federal photos: unitedstates congressional image mirror.
- Texas Legislature roster/profile data: OpenStates public people YAML, with
  official Texas House/Senate profile links and official headshot URLs.

The script rewrites only:
- src/data/officials/federal/*.json
- src/data/officials/state/*.json
- public/images/officials/{federal,state-house,state-senate}/*
"""

from __future__ import annotations

import datetime as dt
import html
import json
import re
import shutil
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:
    raise SystemExit("PyYAML is required to run this importer: python3 -m pip install PyYAML") from exc


ROOT = Path(__file__).resolve().parents[1]
OFFICIALS_DIR = ROOT / "src" / "data" / "officials"
IMAGE_DIR = ROOT / "public" / "images" / "officials"
ACCESSED_DATE = "2026-04-27"
TODAY = dt.date.fromisoformat(ACCESSED_DATE)

FEDERAL_SOURCE_URL = (
    "https://raw.githubusercontent.com/unitedstates/congress-legislators/master/"
    "legislators-current.yaml"
)
OPENSTATES_CONTENTS_URL = (
    "https://api.github.com/repos/openstates/people/contents/data/tx/legislature"
)

FEDERAL_PHOTO_OVERRIDES = {
    "G000601": "https://craiggoldman.house.gov/sites/evo-subsites/craiggoldman.house.gov/files/evo-media-image/craiggoldman.png",
    "G000603": "https://gill.house.gov/sites/evo-subsites/gill.house.gov/files/styles/evo_image_portrait_480/public/evo-media-image/2024-11-19_np_gill_brandon_0012_re_select.jpg?itok=lnh9pyjk",
    "J000310": "https://juliejohnson.house.gov/sites/evo-subsites/juliejohnson.house.gov/files/styles/large/public/evo-media-image/juliejohnson.jpeg.webp?itok=-aQBRRwF",
    "M001245": "https://bioguide.congress.gov/photo/698206b2eb30d3271899373e.jpg",
}


def request(url: str) -> urllib.request.Request:
    return urllib.request.Request(
        url,
        headers={
            "User-Agent": "RepWatchr data importer",
            "Accept": "*/*",
        },
    )


def fetch_text(url: str) -> str:
    with urllib.request.urlopen(request(url), timeout=45) as response:
        return response.read().decode("utf-8")


def fetch_json(url: str) -> Any:
    return json.loads(fetch_text(url))


def html_to_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def normalize_date(value: Any) -> str:
    if isinstance(value, dt.date):
        return value.isoformat()
    if value is None:
        return ""
    return str(value)


def slugify(value: str) -> str:
    value = html_to_text(value).lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def party_code(value: str | None) -> str:
    value = (value or "").lower()
    if "republican" in value:
        return "R"
    if "democrat" in value or "democratic" in value:
        return "D"
    if "independent" in value:
        return "I"
    return "NP"


def ordinal(value: int) -> str:
    if 10 <= value % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(value % 10, "th")
    return f"{value}{suffix}"


def write_json(file_path: Path, payload: dict[str, Any]) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def clean_generated_dirs() -> None:
    for subdir in ["federal", "state"]:
        target = OFFICIALS_DIR / subdir
        target.mkdir(parents=True, exist_ok=True)
        for item in target.glob("*.json"):
            item.unlink()

    for subdir in ["federal", "state-house", "state-senate"]:
        target = IMAGE_DIR / subdir
        if target.exists():
            shutil.rmtree(target)
        target.mkdir(parents=True, exist_ok=True)


def image_extension(url: str, content_type: str | None) -> str:
    if content_type:
        if "png" in content_type:
            return ".png"
        if "webp" in content_type:
            return ".webp"
    suffix = Path(urllib.parse.urlparse(url).path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    return ".jpg"


def download_image(url: str | None, target_stem: Path) -> tuple[str | None, str | None]:
    if not url:
        return None, None

    try:
        with urllib.request.urlopen(request(url), timeout=45) as response:
            content_type = response.headers.get("content-type")
            if content_type and not content_type.startswith("image/"):
                return None, f"not image content: {url}"
            body = response.read()
            if len(body) < 500:
                return None, f"image too small: {url}"
            extension = image_extension(url, content_type)
            target_path = target_stem.with_suffix(extension)
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_bytes(body)
            return "/" + str(target_path.relative_to(ROOT / "public")), None
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return None, f"{url}: {exc}"


def official_name_from_federal(person: dict[str, Any]) -> str:
    name = person.get("name", {})
    return (
        name.get("official_full")
        or " ".join(part for part in [name.get("first"), name.get("middle"), name.get("last")] if part)
    )


def import_federal(used_ids: set[str]) -> tuple[int, list[str]]:
    people = yaml.safe_load(fetch_text(FEDERAL_SOURCE_URL))
    warnings: list[str] = []
    written = 0

    for person in people:
        terms = [
            term
            for term in person.get("terms", [])
            if term.get("state") == "TX"
            and term.get("type") in {"rep", "sen"}
            and (not term.get("end") or dt.date.fromisoformat(str(term["end"])) >= TODAY)
        ]
        if not terms:
            continue

        term = terms[-1]
        name = official_name_from_federal(person)
        first_name = html_to_text(person.get("name", {}).get("first") or name.split(" ")[0])
        last_name = html_to_text(person.get("name", {}).get("last") or name.split(" ")[-1])
        official_id = slugify(name)
        if official_id in used_ids:
            official_id = f"{official_id}-federal"
        used_ids.add(official_id)

        is_senate = term["type"] == "sen"
        district_number = term.get("district")
        bioguide = person.get("id", {}).get("bioguide")
        photo_source_url = (
            f"https://unitedstates.github.io/images/congress/225x275/{bioguide}.jpg"
            if bioguide
            else None
        )
        photo, image_warning = download_image(photo_source_url, IMAGE_DIR / "federal" / official_id)
        if image_warning and bioguide in FEDERAL_PHOTO_OVERRIDES:
            photo_source_url = FEDERAL_PHOTO_OVERRIDES[bioguide]
            photo, image_warning = download_image(photo_source_url, IMAGE_DIR / "federal" / official_id)
        if image_warning:
            warnings.append(image_warning)
        photo_credit = (
            "UnitedStates project congressional image mirror"
            if photo_source_url and "unitedstates.github.io" in photo_source_url
            else "Official congressional photo source"
        )

        contact_form = term.get("contact_form") or term.get("url")
        website = term.get("url") or contact_form
        social = person.get("social", {})
        payload = {
            "id": official_id,
            "name": html_to_text(name),
            "firstName": first_name,
            "lastName": last_name,
            "photo": photo,
            "photoSourceUrl": photo_source_url,
            "photoCredit": photo_credit,
            "party": party_code(term.get("party")),
            "level": "federal",
            "position": "U.S. Senator" if is_senate else "U.S. Representative",
            "district": "Texas" if is_senate else f"TX-{district_number}",
            "jurisdiction": "U.S. Senate" if is_senate else "U.S. House of Representatives",
            "county": ["Texas"],
            "termStart": normalize_date(term.get("start")),
            "termEnd": normalize_date(term.get("end")),
            "contactInfo": {
                "office": term.get("office"),
                "phone": term.get("phone"),
                "email": contact_form,
                "website": website,
                "socialMedia": {
                    "twitter": social.get("twitter") and f"https://x.com/{social['twitter']}",
                    "facebook": social.get("facebook") and f"https://facebook.com/{social['facebook']}",
                },
            },
            "bio": (
                f"{html_to_text(name)} serves as "
                + (
                    "a U.S. Senator for Texas."
                    if is_senate
                    else f"the U.S. Representative for Texas's {ordinal(int(district_number))} Congressional District."
                )
                + " This RepWatchr starter profile is sourced from the official congressional record data and public profile links."
            ),
            "campaignPromises": [],
            "reviewStatus": "source_seeded",
            "state": "TX",
            "bioguideId": bioguide,
            "sourceLinks": [
                {"title": "Official congressional website", "url": website},
                {"title": "Congress legislators current roster", "url": FEDERAL_SOURCE_URL},
                *(
                    [{"title": "Congressional photo source", "url": photo_source_url}]
                    if photo_source_url
                    else []
                ),
            ],
            "lastVerifiedAt": ACCESSED_DATE,
        }

        payload["contactInfo"]["socialMedia"] = {
            key: value for key, value in payload["contactInfo"]["socialMedia"].items() if value
        }
        if not payload["contactInfo"]["socialMedia"]:
            payload["contactInfo"].pop("socialMedia")
        payload["contactInfo"] = {
            key: value for key, value in payload["contactInfo"].items() if value
        }
        payload = {key: value for key, value in payload.items() if value is not None}

        filename = f"us-senate-{last_name.lower()}.json" if is_senate else f"us-house-tx{district_number}.json"
        write_json(OFFICIALS_DIR / "federal" / filename, payload)
        written += 1

    return written, warnings


def current_texas_role(person: dict[str, Any]) -> dict[str, Any] | None:
    roles = person.get("roles", [])
    current = [
        role
        for role in roles
        if role.get("jurisdiction") == "ocd-jurisdiction/country:us/state:tx/government"
        and role.get("type") in {"upper", "lower"}
        and not role.get("end_date")
    ]
    return current[-1] if current else None


def office_payload(offices: list[dict[str, Any]]) -> tuple[str | None, str | None]:
    for classification in ["capitol", "capitol-mail", "district"]:
        for office in offices:
            if office.get("classification") == classification:
                address = office.get("address")
                phone = office.get("voice")
                return address, phone
    return None, None


def import_state(used_ids: set[str]) -> tuple[int, int, list[str]]:
    contents = fetch_json(OPENSTATES_CONTENTS_URL)
    warnings: list[str] = []
    house_count = 0
    senate_count = 0

    for item in contents:
        if not item.get("name", "").endswith(".yml"):
            continue
        person = yaml.safe_load(fetch_text(item["download_url"]))
        role = current_texas_role(person)
        if not role:
            continue

        chamber = role["type"]
        district = str(role["district"])
        official_id = slugify(person.get("name", ""))
        if official_id in used_ids:
            official_id = f"{official_id}-tx-leg"
        used_ids.add(official_id)

        is_senate = chamber == "upper"
        position = "State Senator" if is_senate else "State Representative"
        jurisdiction = "Texas Senate" if is_senate else "Texas House of Representatives"
        district_label = f"SD-{district}" if is_senate else f"HD-{district}"
        image_subdir = "state-senate" if is_senate else "state-house"
        photo_source_url = person.get("image")
        photo, image_warning = download_image(photo_source_url, IMAGE_DIR / image_subdir / official_id)
        if image_warning:
            warnings.append(image_warning)

        links = person.get("links") or []
        official_url = next(
            (link["url"] for link in links if "senate.texas.gov" in link["url"] or "house.texas.gov" in link["url"]),
            links[0]["url"] if links else None,
        )
        office_address, phone = office_payload(person.get("offices") or [])
        party = party_code((person.get("party") or [{}])[0].get("name"))
        first_name = person.get("given_name") or html_to_text(person.get("name", "")).split(" ")[0]
        last_name = person.get("family_name") or html_to_text(person.get("name", "")).split(" ")[-1]
        source_links = [
            {"title": f"Official {jurisdiction} profile", "url": official_url},
            {"title": "OpenStates public people record", "url": item["download_url"]},
            *(
                [{"title": "Official profile photo source", "url": photo_source_url}]
                if photo_source_url
                else []
            ),
        ]

        payload = {
            "id": official_id,
            "name": html_to_text(person.get("name", "")),
            "firstName": html_to_text(first_name),
            "lastName": html_to_text(last_name),
            "photo": photo,
            "photoSourceUrl": photo_source_url,
            "photoCredit": f"Official {jurisdiction} photo",
            "party": party,
            "level": "state",
            "position": position,
            "district": district_label,
            "jurisdiction": jurisdiction,
            "county": ["Texas"],
            "termStart": normalize_date(role.get("start_date")),
            "termEnd": "Current legislative term pending source review",
            "contactInfo": {
                "office": office_address,
                "phone": phone,
                "email": person.get("email"),
                "website": official_url,
            },
            "bio": (
                f"{html_to_text(person.get('name', ''))} serves as {position} for "
                f"Texas {jurisdiction.split('Texas ')[-1]} District {district}. "
                "This RepWatchr starter profile is sourced from official Texas Legislature profile data and OpenStates public records."
            ),
            "campaignPromises": [],
            "reviewStatus": "source_seeded",
            "state": "TX",
            "sourceLinks": [link for link in source_links if link.get("url")],
            "lastVerifiedAt": ACCESSED_DATE,
        }
        payload["contactInfo"] = {
            key: value for key, value in payload["contactInfo"].items() if value
        }
        payload = {key: value for key, value in payload.items() if value is not None}

        filename = f"tx-senate-sd{district}.json" if is_senate else f"tx-house-hd{district}.json"
        write_json(OFFICIALS_DIR / "state" / filename, payload)
        if is_senate:
            senate_count += 1
        else:
            house_count += 1

    return house_count, senate_count, warnings


def main() -> int:
    clean_generated_dirs()
    used_ids: set[str] = set()
    federal_count, federal_warnings = import_federal(used_ids)
    house_count, senate_count, state_warnings = import_state(used_ids)

    print(f"Imported {federal_count} Texas federal officials.")
    print(f"Imported {house_count} Texas House members.")
    print(f"Imported {senate_count} Texas Senate members.")

    warnings = federal_warnings + state_warnings
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")

    # Texas currently has 38 congressional districts, but the importer counts
    # only filled seats in the current source roster. One or more vacancies can
    # make the federal count less than 40 when paired with the two U.S. Senate
    # seats.
    expected = {"federal_min": 39, "house": 150}
    if federal_count < expected["federal_min"]:
        print(f"Expected at least 39 Texas federal officials, found {federal_count}.", file=sys.stderr)
        return 1
    if house_count != expected["house"]:
        print(f"Expected 150 Texas House members, found {house_count}.", file=sys.stderr)
        return 1
    if senate_count < 30:
        print(f"Expected at least 30 Texas Senate members, found {senate_count}.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
