#!/usr/bin/env python3
"""Import current state-level public officials from OpenStates people data.

The importer is non-destructive to the existing Texas hand-tuned state
legislature files. It writes generated national data under:

- src/data/officials/state-legislature
- src/data/officials/state-executive
- public/images/officials/state-legislature
- public/images/officials/state-executive

Source cache:
  git clone --depth=1 --filter=blob:none --sparse https://github.com/openstates/people.git /tmp/openstates-people
  git -C /tmp/openstates-people sparse-checkout set data
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
LEGISLATURE_OUT = OFFICIALS_ROOT / "state-legislature"
EXECUTIVE_OUT = OFFICIALS_ROOT / "state-executive"
IMAGE_ROOT = ROOT / "public" / "images" / "officials"
COUNTS_OUT = ROOT / "src" / "data" / "national-official-profile-counts.ts"

ACCESSED_DATE = dt.date.today().isoformat()
TODAY = dt.date.fromisoformat(ACCESSED_DATE)
MAX_IMAGE_BYTES = 8_000_000
MAX_PROFILE_IMAGE_SIZE = (420, 520)
IMAGE_TIMEOUT_SECONDS = 10

LEGISLATIVE_ROLE_TYPES = {"upper", "lower", "legislature"}

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

LOWER_CHAMBER_NAMES = {
    "CA": "California State Assembly",
    "MD": "Maryland House of Delegates",
    "NV": "Nevada Assembly",
    "NJ": "New Jersey General Assembly",
    "NY": "New York State Assembly",
    "VA": "Virginia House of Delegates",
    "WV": "West Virginia House of Delegates",
    "WI": "Wisconsin State Assembly",
}

LOWER_POSITION_NAMES = {
    "CA": "Assemblymember",
    "MD": "Delegate",
    "NV": "Assemblymember",
    "NJ": "Assemblymember",
    "NY": "Assemblymember",
    "VA": "Delegate",
    "WV": "Delegate",
    "WI": "Assemblymember",
}


def request(url: str) -> urllib.request.Request:
    return urllib.request.Request(
        iri_to_uri(url),
        headers={
            "User-Agent": "RepWatchr OpenStates public official importer",
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
        return json.loads(path.read_text())
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
    head_text = head.read_text().strip()
    if head_text.startswith("ref: "):
        ref = source_dir / ".git" / head_text.removeprefix("ref: ").strip()
        if ref.exists():
            return ref.read_text().strip()
    return head_text


def clean_generated_dirs() -> None:
    for path in [LEGISLATURE_OUT, EXECUTIVE_OUT, IMAGE_ROOT / "state-legislature", IMAGE_ROOT / "state-executive"]:
        if path.exists():
            shutil.rmtree(path)
        path.mkdir(parents=True, exist_ok=True)


def collect_existing_ids() -> set[str]:
    used: set[str] = set()
    for path in OFFICIALS_ROOT.rglob("*.json"):
        if LEGISLATURE_OUT in path.parents or EXECUTIVE_OUT in path.parents:
            continue
        data = read_json(path)
        if data and data.get("id"):
            used.add(str(data["id"]))
    return used


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


def role_is_current(role: dict[str, Any], code: str, legislative: bool) -> bool:
    jurisdiction = role.get("jurisdiction", "")
    code_lower = code.lower()
    if not (
        f"state:{code_lower}/government" in jurisdiction
        or f"district:{code_lower}/government" in jurisdiction
        or f"territory:{code_lower}/government" in jurisdiction
    ):
        return False

    role_type = role.get("type")
    if legislative and role_type not in LEGISLATIVE_ROLE_TYPES:
        return False
    if not legislative and role_type in LEGISLATIVE_ROLE_TYPES:
        return False

    start = role.get("start_date") or role.get("start")
    if start:
        try:
            if dt.date.fromisoformat(str(start)) > TODAY:
                return False
        except ValueError:
            pass

    end = role.get("end_date") or role.get("end")
    if end:
        try:
            if dt.date.fromisoformat(str(end)) < TODAY:
                return False
        except ValueError:
            pass
    return True


def current_roles(person: dict[str, Any], code: str, legislative: bool) -> list[dict[str, Any]]:
    return [
        role
        for role in person.get("roles") or []
        if role_is_current(role, code, legislative)
    ]


def office_payload(offices: list[dict[str, Any]]) -> tuple[str | None, str | None]:
    for classification in ["capitol", "primary", "district"]:
        for office in offices:
            if office.get("classification") == classification:
                return office.get("address"), office.get("voice")
    return None, None


def official_website(person: dict[str, Any]) -> str | None:
    links = person.get("links") or []
    for link in links:
        if link.get("url"):
            return link["url"]
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


def chamber_payload(code: str, role: dict[str, Any]) -> tuple[str, str, str]:
    state_name = JURISDICTION_NAMES[code]
    district = html_to_text(role.get("district")) or "At-Large"
    role_type = role.get("type")

    if code == "DC":
        return "Councilmember", f"Council of the District of Columbia", district
    if code == "PR":
        if role_type == "upper":
            return "Territorial Senator", "Puerto Rico Senate", district
        return "Territorial Representative", "Puerto Rico House of Representatives", district
    if code == "NE" or role_type == "legislature":
        return "State Senator", f"{state_name} Legislature", f"LD-{district}"
    if role_type == "upper":
        return "State Senator", f"{state_name} Senate", f"SD-{district}"
    return (
        LOWER_POSITION_NAMES.get(code, "State Representative"),
        LOWER_CHAMBER_NAMES.get(code, f"{state_name} House of Representatives"),
        f"HD-{district}",
    )


def executive_position(role_type: str) -> str:
    special = {
        "lt_governor": "Lieutenant Governor",
        "attorney general": "Attorney General",
        "secretary of state": "Secretary of State",
        "state treasurer": "State Treasurer",
        "state auditor": "State Auditor",
        "superintendent of public instruction": "Superintendent of Public Instruction",
    }
    if role_type in special:
        return special[role_type]
    return " ".join(part.capitalize() for part in role_type.replace("_", " ").split())


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


def source_links(person: dict[str, Any], source_url: str, photo_url: str | None, website: str | None) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    seen: set[str] = set()

    def add(title: str, url: str | None) -> None:
        if not url or url in seen:
            return
        seen.add(url)
        links.append({"title": title, "url": url})

    add("Official public profile", website)
    add("OpenStates public people record", source_url)
    add("Public profile photo source", photo_url)
    for item in person.get("sources") or []:
        add(item.get("note") or "Public source", item.get("url"))
        if len(links) >= 10:
            break
    return links


def public_source_url(commit: str, source_path: Path) -> str:
    relative = source_path.relative_to(Path("/tmp/openstates-people")) if str(source_path).startswith("/tmp/openstates-people") else source_path
    try:
        relative = source_path.relative_to(source_path.parents[3])
    except ValueError:
        pass
    parts = source_path.parts
    if "data" in parts:
        data_index = parts.index("data")
        rel = "/".join(parts[data_index:])
    else:
        rel = source_path.name
    return f"https://raw.githubusercontent.com/openstates/people/{commit}/{rel}"


def build_payload(
    person: dict[str, Any],
    role: dict[str, Any],
    code: str,
    kind: str,
    official_id: str,
    source_url: str,
    photo: str | None,
    photo_source_url: str | None,
) -> dict[str, Any]:
    state_name = JURISDICTION_NAMES[code]
    name = html_to_text(person.get("name"))
    first_name = html_to_text(person.get("given_name") or name.split(" ")[0])
    last_name = html_to_text(person.get("family_name") or name.split(" ")[-1])
    party = party_code((person.get("party") or [{}])[0].get("name"))
    website = official_website(person)
    office_address, phone = office_payload(person.get("offices") or [])
    social = social_media(person)

    if kind == "legislature":
        position, jurisdiction, district = chamber_payload(code, role)
        source_district = html_to_text(role.get("district"))
        bio = (
            f"{name} serves as {position} for {jurisdiction}"
            f"{f' District {source_district}' if source_district else ''}. "
            "This RepWatchr starter profile is source-seeded from OpenStates public people data, "
            "official public links, and public profile photo sources where available."
        )
    else:
        position = executive_position(html_to_text(role.get("type")))
        jurisdiction = f"{state_name} statewide public office"
        district = state_name
        bio = (
            f"{name} is listed as {position} for {state_name}. "
            "This RepWatchr starter profile is source-seeded from OpenStates public people data, "
            "official public links, and public profile photo sources where available."
        )

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
        "level": "state",
        "position": position,
        "district": district,
        "jurisdiction": jurisdiction,
        "county": [state_name],
        "termStart": normalize_date(role.get("start_date") or role.get("start")),
        "termEnd": normalize_date(role.get("end_date") or role.get("end")) or "Current public term pending source review",
        "contactInfo": contact_info,
        "bio": bio,
        "campaignPromises": [],
        "reviewStatus": "source_seeded",
        "state": code,
        "sourceLinks": source_links(person, source_url, photo_source_url, website),
        "lastVerifiedAt": ACCESSED_DATE,
    }
    return {key: value for key, value in payload.items() if value is not None}


def output_filename(code: str, kind: str, role: dict[str, Any], name: str, official_id: str) -> Path:
    district = slugify(html_to_text(role.get("district")) or "at-large")
    role_type = slugify(html_to_text(role.get("type")) or kind)
    if kind == "legislature":
        return LEGISLATURE_OUT / code.lower() / f"{code.lower()}-{role_type}-{district}-{official_id}.json"
    return EXECUTIVE_OUT / code.lower() / f"{code.lower()}-{role_type}-{official_id}.json"


def build_tasks(source_dir: Path, include_texas_legislature: bool, used_ids: set[str]) -> tuple[list[dict[str, Any]], dict[str, int], dict[str, int]]:
    commit = git_commit(source_dir)
    tasks: list[dict[str, Any]] = []
    legislative_counts: dict[str, int] = {}
    executive_counts: dict[str, int] = {}

    for code in sorted(JURISDICTION_NAMES):
        code_lower = code.lower()
        jurisdiction_dir = source_dir / "data" / code_lower
        if not jurisdiction_dir.exists():
            continue

        for kind, directory in [("legislature", jurisdiction_dir / "legislature"), ("executive", jurisdiction_dir / "executive")]:
            if not directory.exists():
                continue
            if kind == "legislature" and code == "TX" and not include_texas_legislature:
                continue
            for source_path in sorted(directory.glob("*.yml")):
                person = read_yaml(source_path)
                if not person:
                    continue
                roles = current_roles(person, code, legislative=kind == "legislature")
                if not roles:
                    continue
                role = roles[-1]
                name = html_to_text(person.get("name"))
                if not name:
                    continue
                suffix = f"{code.lower()}-{kind}-{slugify(html_to_text(role.get('type')))}-{slugify(html_to_text(role.get('district')))}"
                official_id = unique_id(slugify(name), used_ids, suffix)
                source_url = public_source_url(commit, source_path)
                image_subdir = "state-legislature" if kind == "legislature" else "state-executive"
                output_path = output_filename(code, kind, role, name, official_id)
                image_stem = IMAGE_ROOT / image_subdir / code.lower() / official_id
                tasks.append(
                    {
                        "person": person,
                        "role": role,
                        "code": code,
                        "kind": kind,
                        "official_id": official_id,
                        "source_url": source_url,
                        "photo_source_url": person.get("image"),
                        "output_path": output_path,
                        "image_stem": image_stem,
                    }
                )
                if kind == "legislature":
                    legislative_counts[code] = legislative_counts.get(code, 0) + 1
                else:
                    executive_counts[code] = executive_counts.get(code, 0) + 1

    return tasks, legislative_counts, executive_counts


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
    parser.add_argument("--include-texas-legislature", action="store_true", help="Also import Texas legislature rows into the generated national folder")
    parser.add_argument("--image-workers", type=int, default=64, help="Concurrent public image fetches")
    args = parser.parse_args()

    source_dir = Path(args.source_dir).resolve()
    if not (source_dir / "data").exists():
        print(f"OpenStates source directory missing data/: {source_dir}", file=sys.stderr)
        return 1

    clean_generated_dirs()
    used_ids = collect_existing_ids()
    tasks, legislative_counts, executive_counts = build_tasks(source_dir, args.include_texas_legislature, used_ids)

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
            task["kind"],
            task["official_id"],
            task["source_url"],
            photo,
            photo_source_url,
        )
        write_json(task["output_path"], payload)

    write_counts_file()

    print(f"Imported {sum(legislative_counts.values())} state legislative profiles.")
    print(f"Imported {sum(executive_counts.values())} state executive/public office profiles.")
    print(f"Downloaded {sum(1 for photo, _ in photos.values() if photo)} profile photos.")
    print(f"Jurisdictions with generated legislature data: {len(legislative_counts)}.")
    print(f"Jurisdictions with generated executive data: {len(executive_counts)}.")
    if warnings:
        print(f"Image warnings: {len(warnings)}")
        for warning in warnings[:120]:
            print(f"- {warning}")
        if len(warnings) > 120:
            print(f"- ... {len(warnings) - 120} more warnings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
