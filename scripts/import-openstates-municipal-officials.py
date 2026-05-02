#!/usr/bin/env python3
"""Import current municipal mayor profiles from OpenStates people data.

The importer only writes generated municipal data under:

- src/data/officials/city-openstates
- public/images/officials/city-openstates

It intentionally leaves the hand-built city profiles alone and skips obvious
duplicates when OpenStates already overlaps with existing local records.
"""

from __future__ import annotations

import argparse
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
from io import BytesIO
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:
    raise SystemExit("PyYAML is required: python3 -m pip install PyYAML") from exc

try:
    from PIL import Image, ImageOps, UnidentifiedImageError
except ImportError as exc:
    raise SystemExit("Pillow is required: python3 -m pip install Pillow") from exc


ROOT = Path(__file__).resolve().parents[1]
OFFICIALS_ROOT = ROOT / "src" / "data" / "officials"
CITY_OUT = OFFICIALS_ROOT / "city-openstates"
IMAGE_ROOT = ROOT / "public" / "images" / "officials" / "city-openstates"
COUNTS_OUT = ROOT / "src" / "data" / "national-official-profile-counts.ts"

ACCESSED_DATE = dt.date.today().isoformat()
TODAY = dt.date.fromisoformat(ACCESSED_DATE)
MAX_IMAGE_BYTES = 8_000_000
MAX_PROFILE_IMAGE_SIZE = (420, 520)
IMAGE_TIMEOUT_SECONDS = 10
ORGANIZATION_NAME_PATTERN = re.compile(r"\b(board|city council|committee|department|office of)\b", re.IGNORECASE)

JURISDICTION_NAMES = {
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
    "DC": "District of Columbia",
    "PR": "Puerto Rico",
}


def request(url: str) -> urllib.request.Request:
    return urllib.request.Request(
        iri_to_uri(url),
        headers={
            "User-Agent": "RepWatchr OpenStates municipal public official importer",
            "Accept": "*/*",
        },
    )


def iri_to_uri(url: str) -> str:
    parts = urllib.parse.urlsplit(html.unescape(url).strip())
    path = urllib.parse.quote(parts.path, safe="/%:@")
    query = urllib.parse.quote(parts.query, safe="=&?/:;+,%@")
    fragment = urllib.parse.quote(parts.fragment, safe="=&?/:;+,%@")
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, path, query, fragment))


def html_to_text(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", html.unescape(str(value))).strip()


def normalize_date(value: Any) -> str:
    if isinstance(value, dt.date):
        return value.isoformat()
    return html_to_text(value)


def parse_date(value: Any) -> dt.date | None:
    text = normalize_date(value)
    if not text:
        return None
    try:
        return dt.date.fromisoformat(text)
    except ValueError:
        return None


def slugify(value: str) -> str:
    value = html_to_text(value).lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "official"


def party_code(value: Any) -> str:
    text = html_to_text(value).lower()
    if "republican" in text:
        return "R"
    if "democrat" in text or "democratic" in text:
        return "D"
    if "independent" in text:
        return "I"
    return "NP"


def read_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def read_yaml(path: Path) -> dict[str, Any] | None:
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except Exception:
        return None


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def git_commit(source_dir: Path) -> str:
    head = source_dir / ".git" / "HEAD"
    if not head.exists():
        return "master"
    head_text = head.read_text(encoding="utf-8").strip()
    if head_text.startswith("ref: "):
        ref = source_dir / ".git" / head_text.removeprefix("ref: ").strip()
        if ref.exists():
            return ref.read_text(encoding="utf-8").strip()
    return head_text


def clean_generated_dirs() -> None:
    for path in [CITY_OUT, IMAGE_ROOT]:
        if path.exists():
            shutil.rmtree(path)
        path.mkdir(parents=True, exist_ok=True)


def collect_existing_ids_and_city_keys() -> tuple[set[str], set[tuple[str, str, str, str]]]:
    used_ids: set[str] = set()
    city_keys: set[tuple[str, str, str, str]] = set()

    for path in OFFICIALS_ROOT.rglob("*.json"):
        if CITY_OUT in path.parents:
            continue
        data = read_json(path)
        if not data:
            continue
        if data.get("id"):
            used_ids.add(str(data["id"]))
        if data.get("level") != "city":
            continue
        name = slugify(html_to_text(data.get("name")))
        position = slugify(html_to_text(data.get("position")))
        state = html_to_text(data.get("state")).upper()
        jurisdiction = html_to_text(data.get("jurisdiction"))
        place = jurisdiction_place_slug(jurisdiction)
        city_keys.add((name, state, place, position))

    return used_ids, city_keys


def jurisdiction_place_slug(jurisdiction: str) -> str:
    text = html_to_text(jurisdiction)
    text = re.sub(r"^city\s+of\s+", "", text, flags=re.IGNORECASE)
    text = text.split(",", 1)[0]
    return slugify(text)


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


def role_is_current_mayor(role: dict[str, Any], code: str) -> bool:
    if html_to_text(role.get("type")).lower() != "mayor":
        return False
    jurisdiction = html_to_text(role.get("jurisdiction"))
    code_lower = code.lower()
    if f"state:{code_lower}/place:" not in jurisdiction:
        return False

    start = parse_date(role.get("start_date") or role.get("start"))
    if start and start > TODAY:
        return False

    end = parse_date(role.get("end_date") or role.get("end"))
    if end and end < TODAY:
        return False
    return True


def current_mayor_roles(person: dict[str, Any], code: str) -> list[dict[str, Any]]:
    return [role for role in person.get("roles") or [] if role_is_current_mayor(role, code)]


def place_from_role(role: dict[str, Any]) -> str:
    jurisdiction = html_to_text(role.get("jurisdiction"))
    match = re.search(r"/place:([^/]+)/government$", jurisdiction)
    if not match:
        return "citywide"
    return match.group(1).replace("_", " ").title()


def office_payload(offices: list[dict[str, Any]]) -> tuple[str | None, str | None]:
    for classification in ["primary", "district", "capitol"]:
        for office in offices:
            if office.get("classification") == classification:
                return office.get("address"), office.get("voice")
    return None, None


def official_website(person: dict[str, Any]) -> str | None:
    for link in person.get("links") or []:
        if link.get("url"):
            return link["url"]
    for source in person.get("sources") or []:
        if source.get("url"):
            return source["url"]
    return None


def social_media(person: dict[str, Any]) -> dict[str, str]:
    ids = person.get("ids") or {}
    social: dict[str, str] = {}
    twitter = ids.get("twitter") or ids.get("x")
    if twitter:
        handle = str(twitter).lstrip("@")
        social["x"] = f"https://x.com/{handle}"
        social["twitter"] = f"https://x.com/{handle}"
    if ids.get("facebook"):
        social["facebook"] = f"https://facebook.com/{str(ids['facebook']).lstrip('@')}"
    if ids.get("youtube"):
        social["youtube"] = f"https://youtube.com/{str(ids['youtube']).lstrip('@')}"
    if ids.get("instagram"):
        social["instagram"] = f"https://instagram.com/{str(ids['instagram']).lstrip('@')}"
    return social


def optimized_jpeg(body: bytes) -> bytes:
    with Image.open(BytesIO(body)) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail(MAX_PROFILE_IMAGE_SIZE)

        if image.mode in {"RGBA", "LA"} or (image.mode == "P" and "transparency" in image.info):
            background = Image.new("RGB", image.size, (255, 255, 255))
            alpha = image.convert("RGBA").getchannel("A")
            background.paste(image.convert("RGB"), mask=alpha)
            image = background
        else:
            image = image.convert("RGB")

        output = BytesIO()
        image.save(output, format="JPEG", quality=82, optimize=True, progressive=True)
        return output.getvalue()


def download_image(url: str | None, target_stem: Path) -> tuple[str | None, str | None]:
    if not url:
        return None, None
    try:
        with urllib.request.urlopen(request(url), timeout=IMAGE_TIMEOUT_SECONDS) as response:
            content_type = response.headers.get("content-type")
            if content_type and not content_type.startswith("image/"):
                return None, f"not image content: {url}"
            content_length = response.headers.get("content-length")
            if content_length and int(content_length) > MAX_IMAGE_BYTES:
                return None, f"image too large: {url}"
            body = response.read(MAX_IMAGE_BYTES + 1)
            if len(body) > MAX_IMAGE_BYTES:
                return None, f"image too large: {url}"
            if len(body) < 300:
                return None, f"image too small: {url}"
            try:
                body = optimized_jpeg(body)
            except (UnidentifiedImageError, OSError, ValueError) as exc:
                return None, f"could not optimize image: {url}: {exc}"
            target = target_stem.with_suffix(".jpg")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
            return "/" + str(target.relative_to(ROOT / "public")), None
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
        return None, f"{url}: {exc}"


def public_source_url(commit: str, source_path: Path) -> str:
    parts = source_path.parts
    if "data" in parts:
        data_index = parts.index("data")
        rel = "/".join(parts[data_index:])
    else:
        rel = source_path.name
    return f"https://raw.githubusercontent.com/openstates/people/{commit}/{rel}"


def source_links(person: dict[str, Any], source_url: str, photo_url: str | None, website: str | None) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    seen: set[str] = set()

    def add(title: str, url: str | None) -> None:
        if not url or url in seen:
            return
        seen.add(url)
        links.append({"title": title, "url": url})

    add("Official public profile", website)
    add("OpenStates public municipality record", source_url)
    add("Public profile photo source", photo_url)
    for item in person.get("sources") or []:
        add(item.get("note") or "Public source", item.get("url"))
        if len(links) >= 10:
            break
    return links


def build_payload(
    person: dict[str, Any],
    role: dict[str, Any],
    code: str,
    official_id: str,
    source_url: str,
    photo: str | None,
    photo_source_url: str | None,
) -> dict[str, Any]:
    state_name = JURISDICTION_NAMES[code]
    place = place_from_role(role)
    name = html_to_text(person.get("name"))
    first_name = html_to_text(person.get("given_name") or name.split(" ")[0])
    last_name = html_to_text(person.get("family_name") or name.split(" ")[-1])
    party = party_code((person.get("party") or [{}])[0].get("name"))
    website = official_website(person)
    office_address, phone = office_payload(person.get("offices") or [])
    social = social_media(person)

    contact_info: dict[str, Any] = {
        "office": office_address,
        "phone": phone,
        "email": person.get("email"),
        "website": website,
        "socialMedia": social or None,
    }
    contact_info = {key: value for key, value in contact_info.items() if value}

    payload = {
        "id": official_id,
        "name": name,
        "firstName": first_name,
        "lastName": last_name,
        "photo": photo,
        "photoSourceUrl": photo_source_url,
        "photoCredit": "OpenStates public profile image source" if photo_source_url else None,
        "party": party,
        "level": "city",
        "position": "Mayor",
        "district": "Citywide",
        "jurisdiction": f"City of {place}, {state_name}",
        "county": [],
        "termStart": normalize_date(role.get("start_date") or role.get("start")) or "Start date pending source review",
        "termEnd": normalize_date(role.get("end_date") or role.get("end")) or "Current public term pending source review",
        "contactInfo": contact_info,
        "bio": (
            f"{name} is listed as mayor of the City of {place}, {state_name}. "
            "This RepWatchr starter profile is source-seeded from OpenStates public municipality data, "
            "official public links, and public profile photo sources where available."
        ),
        "campaignPromises": [],
        "reviewStatus": "source_seeded",
        "state": code,
        "sourceLinks": source_links(person, source_url, photo_source_url, website),
        "lastVerifiedAt": ACCESSED_DATE,
    }
    return {key: value for key, value in payload.items() if value is not None}


def output_filename(code: str, place: str, official_id: str) -> Path:
    return CITY_OUT / code.lower() / f"{code.lower()}-mayor-{slugify(place)}-{official_id}.json"


def build_tasks(source_dir: Path, used_ids: set[str], city_keys: set[tuple[str, str, str, str]]) -> tuple[list[dict[str, Any]], dict[str, int], int, int]:
    commit = git_commit(source_dir)
    tasks: list[dict[str, Any]] = []
    counts: dict[str, int] = {}
    skipped_duplicates = 0
    skipped_non_people = 0

    for code in sorted(JURISDICTION_NAMES):
        directory = source_dir / "data" / code.lower() / "municipalities"
        if not directory.exists():
            continue
        for source_path in sorted(directory.glob("*.yml")):
            person = read_yaml(source_path)
            if not person:
                continue
            roles = current_mayor_roles(person, code)
            if not roles:
                continue
            role = roles[-1]
            name = html_to_text(person.get("name"))
            if not name:
                continue
            if ORGANIZATION_NAME_PATTERN.search(name):
                skipped_non_people += 1
                continue
            place = place_from_role(role)
            new_key = (slugify(name), code, slugify(place), "mayor")
            unknown_tx_key = (slugify(name), "", slugify(place), "mayor")
            if new_key in city_keys or (code == "TX" and unknown_tx_key in city_keys):
                skipped_duplicates += 1
                continue

            suffix = f"{code.lower()}-mayor-{slugify(place)}"
            official_id = unique_id(slugify(name), used_ids, suffix)
            city_keys.add(new_key)
            source_url = public_source_url(commit, source_path)
            tasks.append(
                {
                    "person": person,
                    "role": role,
                    "code": code,
                    "official_id": official_id,
                    "source_url": source_url,
                    "photo_source_url": person.get("image"),
                    "output_path": output_filename(code, place, official_id),
                    "image_stem": IMAGE_ROOT / code.lower() / official_id,
                }
            )
            counts[code] = counts.get(code, 0) + 1

    return tasks, counts, skipped_duplicates, skipped_non_people


def write_counts_file() -> None:
    counts: dict[str, int] = {}
    for path in OFFICIALS_ROOT.rglob("*.json"):
        data = read_json(path)
        if not data or data.get("level") == "school-board":
            continue
        code = html_to_text(data.get("state")).upper()
        if code:
            counts[code] = counts.get(code, 0) + 1

    ordered = {key: counts[key] for key in sorted(counts)}
    lines = [
        "export const officialProfileCountsByJurisdiction: Record<string, number> = {",
        *[f'  "{key}": {value},' for key, value in ordered.items()],
        "};",
        f'export const officialProfileCountsGeneratedAt = "{ACCESSED_DATE}";',
        "",
    ]
    COUNTS_OUT.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", default="/tmp/openstates-people", help="Path to a clone of openstates/people")
    parser.add_argument("--skip-images", action="store_true", help="Write profiles without downloading local profile images")
    parser.add_argument("--image-workers", type=int, default=32, help="Concurrent public image fetches")
    args = parser.parse_args()

    source_dir = Path(args.source_dir).resolve()
    if not (source_dir / "data").exists():
        print(f"OpenStates source directory missing data/: {source_dir}", file=sys.stderr)
        return 1

    clean_generated_dirs()
    used_ids, city_keys = collect_existing_ids_and_city_keys()
    tasks, counts, skipped_duplicates, skipped_non_people = build_tasks(source_dir, used_ids, city_keys)

    photos: dict[str, tuple[str | None, str | None]] = {}
    warnings: list[str] = []
    if args.skip_images:
        photos = {task["official_id"]: (None, None) for task in tasks}
    else:
        with ThreadPoolExecutor(max_workers=max(1, args.image_workers)) as executor:
            future_map = {
                executor.submit(download_image, task["photo_source_url"], task["image_stem"]): task
                for task in tasks
            }
            for future in as_completed(future_map):
                task = future_map[future]
                photo, warning = future.result()
                photos[task["official_id"]] = (photo, task["photo_source_url"] if photo else None)
                if warning:
                    warnings.append(warning)

    for task in tasks:
        photo, photo_source_url = photos.get(task["official_id"], (None, None))
        payload = build_payload(
            task["person"],
            task["role"],
            task["code"],
            task["official_id"],
            task["source_url"],
            photo,
            photo_source_url,
        )
        write_json(task["output_path"], payload)

    write_counts_file()

    print(f"Imported {sum(counts.values())} municipal mayor profiles.")
    print(f"Skipped {skipped_duplicates} duplicate city mayor profiles.")
    print(f"Skipped {skipped_non_people} organization-style municipal records.")
    print(f"Downloaded {sum(1 for photo, _ in photos.values() if photo)} profile photos.")
    print(f"States with generated municipal data: {len(counts)}.")
    for code in sorted(counts):
        print(f"- {code}: {counts[code]}")
    if warnings:
        print(f"Image warnings: {len(warnings)}")
        for warning in warnings[:120]:
            print(f"- {warning}")
        if len(warnings) > 120:
            print(f"- ... {len(warnings) - 120} more warnings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
