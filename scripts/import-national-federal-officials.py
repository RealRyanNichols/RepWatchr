#!/usr/bin/env python3
"""Import current U.S. Senators and House members for all 50 states.

Sources:
- Federal roster: unitedstates/congress-legislators current YAML.
- Federal photos: unitedstates congressional image mirror, keyed by Bioguide ID.

The script rewrites only:
- src/data/officials/federal/*.json
- public/images/officials/federal/*
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
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:
    raise SystemExit("PyYAML is required to run this importer: python3 -m pip install PyYAML") from exc


ROOT = Path(__file__).resolve().parents[1]
OFFICIALS_DIR = ROOT / "src" / "data" / "officials" / "federal"
IMAGE_DIR = ROOT / "public" / "images" / "officials" / "federal"
ACCESSED_DATE = dt.date.today().isoformat()
TODAY = dt.date.fromisoformat(ACCESSED_DATE)

FEDERAL_SOURCE_URL = (
    "https://raw.githubusercontent.com/unitedstates/congress-legislators/master/"
    "legislators-current.yaml"
)
CONGRESS_IMAGE_BASE = "https://unitedstates.github.io/images/congress/225x275"
PROFILE_IMAGE_HINTS = {
    "bio",
    "bioguide",
    "evo_image_portrait",
    "headshot",
    "head-shot",
    "official",
    "portrait",
    "profile",
}
GENERIC_IMAGE_HINTS = {
    "academy",
    "banner",
    "bg",
    "background",
    "basketball",
    "building",
    "capitol",
    "casework",
    "dc-office",
    "default",
    "favicon",
    "flag",
    "floor",
    "footer",
    "future",
    "home",
    "icon",
    "logo",
    "medic",
    "meta",
    "military",
    "news",
    "nominations",
    "office",
    "open_graph",
    "presser",
    "seal",
    "signature",
    "social",
    "social-card",
    "sprite",
    "slider",
    "thumbnail",
    "twitter",
    "workman",
}

STATE_NAMES = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming",
}


def request(url: str) -> urllib.request.Request:
    return urllib.request.Request(
        url,
        headers={
            "User-Agent": "RepWatchr national federal importer",
            "Accept": "*/*",
        },
    )


def fetch_text(url: str) -> str:
    with urllib.request.urlopen(request(url), timeout=60) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def fetch_html(url: str) -> str:
    with urllib.request.urlopen(request(url), timeout=20) as response:
        content_type = response.headers.get("content-type", "")
        if "text/html" not in content_type and "application/xhtml" not in content_type:
            return ""
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read(400_000).decode(charset, errors="replace")


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


def jpeg_dimensions(body: bytes) -> tuple[int, int] | None:
    if len(body) < 4 or body[:2] != b"\xff\xd8":
        return None
    cursor = 2
    while cursor + 9 < len(body):
        if body[cursor] != 0xFF:
            cursor += 1
            continue
        marker = body[cursor + 1]
        cursor += 2
        if marker in {0xD8, 0xD9}:
            continue
        if cursor + 2 > len(body):
            return None
        segment_length = int.from_bytes(body[cursor : cursor + 2], "big")
        if segment_length < 2 or cursor + segment_length > len(body):
            return None
        if marker in {
            0xC0,
            0xC1,
            0xC2,
            0xC3,
            0xC5,
            0xC6,
            0xC7,
            0xC9,
            0xCA,
            0xCB,
            0xCD,
            0xCE,
            0xCF,
        }:
            height = int.from_bytes(body[cursor + 3 : cursor + 5], "big")
            width = int.from_bytes(body[cursor + 5 : cursor + 7], "big")
            return width, height
        cursor += segment_length
    return None


def image_dimensions(body: bytes) -> tuple[int, int] | None:
    if body.startswith(b"\x89PNG\r\n\x1a\n") and len(body) >= 24:
        return int.from_bytes(body[16:20], "big"), int.from_bytes(body[20:24], "big")
    if body.startswith(b"\xff\xd8"):
        return jpeg_dimensions(body)
    return None


def looks_like_profile_image(body: bytes, url: str) -> bool:
    dimensions = image_dimensions(body)
    if not dimensions:
        return True
    width, height = dimensions
    if width < 120 or height < 120:
        return False
    lower_url = url.lower()
    if width > height * 2.5 and not any(hint in lower_url for hint in PROFILE_IMAGE_HINTS):
        return False
    return True


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
            if not looks_like_profile_image(body, url):
                return None, f"image does not look like a profile photo: {url}"
            extension = image_extension(url, content_type)
            target_path = target_stem.with_suffix(extension)
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_bytes(body)
            return "/" + str(target_path.relative_to(ROOT / "public")), None
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return None, f"{url}: {exc}"


def write_json(file_path: Path, payload: dict[str, Any]) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def clean_generated_dirs() -> None:
    OFFICIALS_DIR.mkdir(parents=True, exist_ok=True)
    for item in OFFICIALS_DIR.glob("*.json"):
        item.unlink()

    if IMAGE_DIR.exists():
        shutil.rmtree(IMAGE_DIR)
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)


def html_attrs(value: str) -> dict[str, str]:
    attrs: dict[str, str] = {}
    for match in re.finditer(r"""([a-zA-Z_:.-]+)\s*=\s*(['"])(.*?)\2""", value, flags=re.S):
        attrs[match.group(1).lower()] = html.unescape(match.group(3)).strip()
    return attrs


def image_candidate_score(url: str, label: str, person: dict[str, Any]) -> int:
    lower_url = urllib.parse.unquote(url).lower()
    lower_label = label.lower()
    if lower_url.startswith("data:"):
        return -1000
    if not re.search(r"\.(?:jpe?g|png|webp)(?:[?#]|$)", lower_url):
        return -1000

    score = 0
    name = person.get("name", {})
    first = slugify(name.get("first") or "")
    last = slugify(name.get("last") or "")
    url_path = urllib.parse.unquote(urllib.parse.urlparse(lower_url).path)
    url_slug = slugify(Path(url_path).name)
    label_slug = slugify(lower_label)
    has_profile_hint = False
    has_generic_hint = False
    has_name_hint = False

    if any(lower_url.endswith(extension) for extension in (".jpg", ".jpeg", ".png", ".webp")):
        score += 8
    if "evo-media-image" in lower_url:
        score += 8
    for hint in PROFILE_IMAGE_HINTS:
        if hint in lower_url:
            has_profile_hint = True
            score += 12
        if hint in lower_label:
            has_profile_hint = True
            score += 8
    for hint in GENERIC_IMAGE_HINTS:
        if hint in lower_url:
            has_generic_hint = True
            score -= 45
        if hint in lower_label:
            has_generic_hint = True
            score -= 30
    for part in (first, last):
        if part and part in url_slug:
            has_name_hint = True
            score += 16
        if part and part in label_slug and has_profile_hint:
            score += 8
    if not (has_profile_hint or has_name_hint):
        score -= 35
    if has_generic_hint and not has_profile_hint:
        score -= 35
    if lower_url.endswith(".svg") or lower_url.endswith(".gif"):
        score -= 100
    return score


def official_site_image_candidates(person: dict[str, Any], term: dict[str, Any]) -> list[str]:
    website = term.get("url") or term.get("contact_form")
    if not website:
        return []

    try:
        page_html = fetch_html(website)
    except (urllib.error.URLError, TimeoutError, OSError, UnicodeError):
        return []
    if not page_html:
        return []

    candidates: dict[str, int] = {}
    meta_pattern = re.compile(
        r"""<meta\b(?P<attrs>[^>]+?(?:og:image|twitter:image|image_src)[^>]*)>""",
        flags=re.I | re.S,
    )
    for match in meta_pattern.finditer(page_html):
        attrs = html_attrs(match.group("attrs"))
        url = attrs.get("content")
        if not url:
            continue
        absolute_url = urllib.parse.urljoin(website, html.unescape(url))
        candidates[absolute_url] = max(
            candidates.get(absolute_url, -999),
            image_candidate_score(absolute_url, " ".join(attrs.values()), person),
        )

    img_pattern = re.compile(r"""<img\b(?P<attrs>[^>]+)>""", flags=re.I | re.S)
    for match in img_pattern.finditer(page_html):
        attrs = html_attrs(match.group("attrs"))
        url = attrs.get("src") or attrs.get("data-src") or attrs.get("data-lazy-src")
        if not url:
            srcset = attrs.get("srcset") or attrs.get("data-srcset")
            if srcset:
                url = srcset.split(",")[0].strip().split(" ")[0]
        if not url:
            continue
        absolute_url = urllib.parse.urljoin(website, html.unescape(url))
        label = " ".join(attrs.get(key, "") for key in ("alt", "title", "aria-label", "class"))
        candidates[absolute_url] = max(
            candidates.get(absolute_url, -999),
            image_candidate_score(absolute_url, label, person),
        )

    return [
        url
        for url, score in sorted(candidates.items(), key=lambda item: item[1], reverse=True)
        if score >= 25
    ][:5]


def download_profile_photo(task: dict[str, Any]) -> tuple[str | None, str | None, str | None, str | None]:
    photo_source_url = task["photo_source_url"]
    photo, warning = download_image(photo_source_url, IMAGE_DIR / task["official_id"])
    if photo:
        return photo, photo_source_url, "UnitedStates project congressional image mirror", warning

    warnings = [warning] if warning else []
    for candidate in official_site_image_candidates(task["person"], task["term"]):
        photo, candidate_warning = download_image(candidate, IMAGE_DIR / task["official_id"])
        if photo:
            return photo, candidate, "Official congressional website image", None
        if candidate_warning:
            warnings.append(candidate_warning)
    return None, None, None, "; ".join(warnings) if warnings else None


def official_name(person: dict[str, Any]) -> str:
    name = person.get("name", {})
    return html_to_text(
        name.get("official_full")
        or " ".join(part for part in [name.get("first"), name.get("middle"), name.get("last")] if part)
    )


def current_federal_term(person: dict[str, Any]) -> dict[str, Any] | None:
    terms = []
    for term in person.get("terms", []):
        state = term.get("state")
        if state not in STATE_NAMES or term.get("type") not in {"rep", "sen"}:
            continue
        start = dt.date.fromisoformat(str(term["start"])) if term.get("start") else dt.date.min
        end = dt.date.fromisoformat(str(term["end"])) if term.get("end") else dt.date.max
        if start <= TODAY <= end:
            terms.append(term)
    return terms[-1] if terms else None


def unique_id(base: str, used_ids: set[str], suffix: str) -> str:
    candidate = base
    if candidate not in used_ids:
        used_ids.add(candidate)
        return candidate
    candidate = f"{base}-{suffix}"
    counter = 2
    while candidate in used_ids:
        candidate = f"{base}-{suffix}-{counter}"
        counter += 1
    used_ids.add(candidate)
    return candidate


def federal_filename(term: dict[str, Any], person: dict[str, Any]) -> str:
    state = term["state"].lower()
    if term["type"] == "sen":
        last = slugify(person.get("name", {}).get("last") or official_name(person).split(" ")[-1])
        return f"us-senate-{state}-{last}.json"
    return f"us-house-{state}{term.get('district')}.json"


def make_payload(
    person: dict[str, Any],
    term: dict[str, Any],
    official_id: str,
    photo: str | None,
    photo_source_url: str | None,
    photo_credit: str | None,
) -> dict[str, Any]:
    name = official_name(person)
    name_parts = person.get("name", {})
    first_name = html_to_text(name_parts.get("first") or name.split(" ")[0])
    last_name = html_to_text(name_parts.get("last") or name.split(" ")[-1])
    state = term["state"]
    state_name = STATE_NAMES[state]
    is_senate = term["type"] == "sen"
    district_number = term.get("district")
    bioguide = person.get("id", {}).get("bioguide")
    contact_form = term.get("contact_form") or term.get("url")
    website = term.get("url") or contact_form
    social = person.get("social", {})

    if is_senate:
        position = "U.S. Senator"
        district = state_name
        jurisdiction = "U.S. Senate"
        bio_office = f"a U.S. Senator for {state_name}"
    else:
        position = "U.S. Representative"
        district = f"{state}-{district_number}"
        jurisdiction = "U.S. House of Representatives"
        bio_office = (
            f"the U.S. Representative for {state_name}'s "
            f"{ordinal(int(district_number))} Congressional District"
        )

    contact_info = {
        "office": term.get("office"),
        "phone": term.get("phone"),
        "email": contact_form,
        "website": website,
        "socialMedia": {
            "x": social.get("twitter") and f"https://x.com/{social['twitter']}",
            "twitter": social.get("twitter") and f"https://x.com/{social['twitter']}",
            "facebook": social.get("facebook") and f"https://facebook.com/{social['facebook']}",
            "youtube": social.get("youtube") and f"https://youtube.com/{social['youtube']}",
            "instagram": social.get("instagram") and f"https://instagram.com/{social['instagram']}",
        },
    }
    contact_info["socialMedia"] = {
        key: value for key, value in contact_info["socialMedia"].items() if value
    }
    if not contact_info["socialMedia"]:
        contact_info.pop("socialMedia")
    contact_info = {key: value for key, value in contact_info.items() if value}

    source_links = [
        {"title": "Official congressional website", "url": website},
        {"title": "Congress legislators current roster", "url": FEDERAL_SOURCE_URL},
        {"title": "Biographical Directory of the United States Congress", "url": f"https://bioguide.congress.gov/search/bio/{bioguide}" if bioguide else None},
        {"title": "Congressional photo source", "url": photo_source_url},
    ]

    payload = {
        "id": official_id,
        "name": name,
        "firstName": first_name,
        "lastName": last_name,
        "photo": photo,
        "photoSourceUrl": photo_source_url,
        "photoCredit": photo_credit,
        "party": party_code(term.get("party")),
        "level": "federal",
        "position": position,
        "district": district,
        "jurisdiction": jurisdiction,
        "county": [],
        "termStart": normalize_date(term.get("start")),
        "termEnd": normalize_date(term.get("end")),
        "contactInfo": contact_info,
        "bio": (
            f"{name} serves as {bio_office}. This RepWatchr starter profile is "
            "source-seeded from current congressional roster data, official public links, "
            "and public congressional photo sources."
        ),
        "campaignPromises": [],
        "reviewStatus": "source_seeded",
        "state": state,
        "bioguideId": bioguide,
        "sourceLinks": [link for link in source_links if link.get("url")],
        "lastVerifiedAt": ACCESSED_DATE,
    }
    return {key: value for key, value in payload.items() if value is not None}


def main() -> int:
    people = yaml.safe_load(fetch_text(FEDERAL_SOURCE_URL))
    records: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for person in people:
        term = current_federal_term(person)
        if term:
            records.append((person, term))

    used_ids: set[str] = set()
    tasks: list[dict[str, Any]] = []
    for person, term in records:
        name = official_name(person)
        bioguide = person.get("id", {}).get("bioguide") or "federal"
        official_id = unique_id(slugify(name), used_ids, bioguide.lower())
        photo_source_url = f"{CONGRESS_IMAGE_BASE}/{bioguide}.jpg" if bioguide else None
        tasks.append(
            {
                "person": person,
                "term": term,
                "official_id": official_id,
                "filename": federal_filename(term, person),
                "photo_source_url": photo_source_url,
            }
        )

    clean_generated_dirs()

    warnings: list[str] = []
    photos: dict[str, tuple[str | None, str | None, str | None]] = {}
    with ThreadPoolExecutor(max_workers=16) as executor:
        future_map = {
            executor.submit(download_profile_photo, task): task
            for task in tasks
        }
        for future in as_completed(future_map):
            task = future_map[future]
            photo, photo_source_url, photo_credit, warning = future.result()
            photos[task["official_id"]] = (photo, photo_source_url, photo_credit)
            if warning:
                warnings.append(warning)

    for task in tasks:
        photo, photo_source_url, photo_credit = photos.get(task["official_id"], (None, None, None))
        payload = make_payload(
            task["person"],
            task["term"],
            task["official_id"],
            photo,
            photo_source_url,
            photo_credit,
        )
        write_json(OFFICIALS_DIR / task["filename"], payload)

    by_type = {"sen": 0, "rep": 0}
    states = set()
    for task in tasks:
        by_type[task["term"]["type"]] += 1
        states.add(task["term"]["state"])

    print(f"Imported {by_type['sen']} U.S. Senators.")
    print(f"Imported {by_type['rep']} U.S. House members.")
    print(f"Loaded federal officials for {len(states)} states.")
    print(f"Downloaded {sum(1 for value in photos.values() if value[0])} profile photos.")

    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")

    if by_type["sen"] != 100:
        print(f"Expected 100 U.S. Senators, found {by_type['sen']}.", file=sys.stderr)
        return 1
    if len(states) != 50:
        print(f"Expected all 50 states, found {len(states)}.", file=sys.stderr)
        return 1
    if by_type["rep"] < 400:
        print(f"Expected at least 400 current U.S. House members, found {by_type['rep']}.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
