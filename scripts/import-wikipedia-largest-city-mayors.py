#!/usr/bin/env python3
"""Import source-seeded mayor profiles for the 50 largest U.S. cities.

Source:
- Wikipedia table: List of mayors of the 50 largest cities in the United States

The importer rewrites only:
- src/data/officials/city/largest-cities/*.json
- public/images/officials/city/largest-cities/*

These are starter records. They are intentionally marked `source_seeded`
because each profile still needs a city/government source pass before it is
treated as a complete RepWatchr profile.
"""

from __future__ import annotations

import datetime as dt
import html
import json
import re
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path
from typing import Any

try:
    from PIL import Image, ImageOps, UnidentifiedImageError
except ImportError as exc:
    raise SystemExit("Pillow is required: python3 -m pip install Pillow") from exc


ROOT = Path(__file__).resolve().parents[1]
OFFICIALS_ROOT = ROOT / "src" / "data" / "officials"
CITY_OUT = OFFICIALS_ROOT / "city" / "largest-cities"
IMAGE_OUT = ROOT / "public" / "images" / "officials" / "city" / "largest-cities"
COUNTS_OUT = ROOT / "src" / "data" / "national-official-profile-counts.ts"

ACCESSED_DATE = dt.date.today().isoformat()
MAX_IMAGE_BYTES = 8_000_000
MAX_PROFILE_IMAGE_SIZE = (420, 520)
WIKIPEDIA_PAGE = "List of mayors of the 50 largest cities in the United States"
WIKIPEDIA_PAGE_URL = "https://en.wikipedia.org/wiki/List_of_mayors_of_the_50_largest_cities_in_the_United_States"
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"

STATE_CODES = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "District of Columbia": "DC",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY",
}


def request(url: str) -> urllib.request.Request:
    return urllib.request.Request(
        url,
        headers={
            "User-Agent": "RepWatchr largest-city mayor importer contact Ryan@RealRyanNichols.com",
            "Accept": "*/*",
        },
    )


def html_to_text(value: Any) -> str:
    if value is None:
        return ""
    value = re.sub(r"\[[^\]]+\]", "", str(value))
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def slugify(value: str) -> str:
    value = html_to_text(value).lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "official"


def wiki_url(path: str | None) -> str | None:
    if not path:
        return None
    path = html.unescape(path)
    if path.startswith("//"):
        return f"https:{path}"
    if path.startswith("/"):
        return f"https://en.wikipedia.org{path}"
    if path.startswith("http"):
        return path
    return None


class WikitableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_table = False
        self.table_depth = 0
        self.tables: list[list[list[dict[str, Any]]]] = []
        self.current_table: list[list[dict[str, Any]]] | None = None
        self.in_row = False
        self.row: list[dict[str, Any]] = []
        self.cell: dict[str, Any] | None = None
        self.cell_tag: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key: value or "" for key, value in attrs}
        if tag == "table":
            if self.in_table:
                self.table_depth += 1
            elif "wikitable" in attr.get("class", ""):
                self.in_table = True
                self.table_depth = 1
                self.current_table = []
        if not self.in_table:
            return
        if tag == "tr" and self.table_depth == 1:
            self.in_row = True
            self.row = []
        if self.in_row and tag in {"td", "th"}:
            self.cell = {"text": "", "links": [], "images": [], "tag": tag}
            self.cell_tag = tag
        if self.cell is not None:
            if tag == "a" and attr.get("href"):
                self.cell["links"].append(attr["href"])
            if tag == "img" and (attr.get("src") or attr.get("data-src")):
                self.cell["images"].append(attr.get("src") or attr.get("data-src"))

    def handle_endtag(self, tag: str) -> None:
        if not self.in_table:
            return
        if self.cell is not None and tag == self.cell_tag:
            self.row.append(self.cell)
            self.cell = None
            self.cell_tag = None
        elif tag == "tr" and self.in_row and self.table_depth == 1:
            if self.row and self.current_table is not None:
                self.current_table.append(self.row)
            self.in_row = False
            self.row = []
        elif tag == "table":
            self.table_depth -= 1
            if self.table_depth == 0 and self.current_table is not None:
                self.tables.append(self.current_table)
                self.current_table = None
                self.in_table = False

    def handle_data(self, data: str) -> None:
        if self.cell is not None:
            self.cell["text"] += data


def fetch_wikipedia_html() -> str:
    params = urllib.parse.urlencode(
        {
            "action": "parse",
            "page": WIKIPEDIA_PAGE,
            "prop": "text",
            "format": "json",
        }
    )
    with urllib.request.urlopen(request(f"{WIKIPEDIA_API}?{params}"), timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8", errors="replace"))
    return payload["parse"]["text"]["*"]


def extract_rows() -> list[dict[str, Any]]:
    parser = WikitableParser()
    parser.feed(fetch_wikipedia_html())

    table = None
    headers: list[str] = []
    for candidate in parser.tables:
        if not candidate:
            continue
        headers = [html_to_text(cell["text"]) for cell in candidate[0]]
        if {"Name", "Photo", "Party", "City", "State", "Rank"}.issubset(set(headers)):
            table = candidate
            break
    if table is None:
        raise RuntimeError("Could not locate the largest-city mayor wikitable")

    index = {name: headers.index(name) for name in headers}

    def header_index(label: str, fallback_prefix: str | None = None) -> int | None:
        if label in index:
            return index[label]
        if fallback_prefix:
            for header, position in index.items():
                if header.startswith(fallback_prefix):
                    return position
        return None

    population_index = header_index("Population(2022 estimate)[1][2]", "Population")
    rows: list[dict[str, Any]] = []
    for cells in table[1:]:
        if len(cells) < len(headers):
            continue
        name = html_to_text(cells[index["Name"]]["text"])
        city = html_to_text(cells[index["City"]]["text"])
        state = html_to_text(cells[index["State"]]["text"])
        if not name or not city or not state:
            continue
        photo_cell = cells[index["Photo"]]
        rows.append(
            {
                "name": name,
                "party": html_to_text(cells[index["Party"]]["text"]),
                "city": city,
                "state": state,
                "population": html_to_text(cells[population_index]["text"]) if population_index is not None else "",
                "rank": html_to_text(cells[index["Rank"]]["text"]),
                "term_start": html_to_text(cells[index["Term start"]]["text"]),
                "term_end": html_to_text(cells[index["Term end"]]["text"]),
                "form_of_government": html_to_text(cells[index["Form of government"]]["text"]),
                "person_url": wiki_url(cells[index["Name"]]["links"][0] if cells[index["Name"]]["links"] else None),
                "photo_url": wiki_url(photo_cell["images"][0] if photo_cell["images"] else None),
                "photo_source_url": wiki_url(photo_cell["links"][0] if photo_cell["links"] else None),
            }
        )
    return rows


def party_code(value: str) -> str:
    text = value.lower()
    if "republican" in text:
        return "R"
    if "democratic" in text or "democrat" in text:
        return "D"
    if "independent" in text:
        return "I"
    return "NP"


def split_name(name: str) -> tuple[str, str]:
    parts = [part for part in name.split(" ") if part]
    if not parts:
        return name, name
    return parts[0], parts[-1]


def clean_generated_dirs() -> None:
    for path in [CITY_OUT, IMAGE_OUT]:
        if path.exists():
            shutil.rmtree(path)
        path.mkdir(parents=True, exist_ok=True)


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
        image.save(output, format="JPEG", quality=84, optimize=True, progressive=True)
        return output.getvalue()


def bigger_thumbnail_url(url: str | None) -> str | None:
    if not url:
        return None
    return re.sub(r"/\d+px-", "/420px-", url)


def download_image(url: str | None, target: Path) -> str | None:
    if not url:
        return None
    candidates = [candidate for candidate in [bigger_thumbnail_url(url), url] if candidate]
    for candidate in dict.fromkeys(candidates):
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request(candidate), timeout=30) as response:
                    content_type = response.headers.get("content-type", "")
                    if not content_type.startswith("image/"):
                        break
                    body = response.read(MAX_IMAGE_BYTES + 1)
                    if len(body) < 300 or len(body) > MAX_IMAGE_BYTES:
                        break
                    body = optimized_jpeg(body)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(body)
                    return "/" + str(target.relative_to(ROOT / "public"))
            except (urllib.error.URLError, TimeoutError, OSError, ValueError, UnidentifiedImageError):
                if attempt < 2:
                    time.sleep(0.4)
    return None


def source_links(row: dict[str, Any]) -> list[dict[str, str]]:
    links = [{"title": "Wikipedia largest-city mayors table", "url": WIKIPEDIA_PAGE_URL}]
    if row.get("person_url"):
        links.append({"title": "Wikipedia public biography page", "url": row["person_url"]})
    if row.get("photo_source_url"):
        links.append({"title": "Public profile photo source", "url": row["photo_source_url"]})
    return links


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def write_counts_file() -> None:
    counts: dict[str, int] = {}
    for path in OFFICIALS_ROOT.rglob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if data.get("level") == "school-board":
            continue
        code = html_to_text(data.get("state")).upper()
        if code:
            counts[code] = counts.get(code, 0) + 1

    lines = [
        "export const officialProfileCountsByJurisdiction: Record<string, number> = {",
        *[f'  "{key}": {counts[key]},' for key in sorted(counts)],
        "};",
        f'export const officialProfileCountsGeneratedAt = "{ACCESSED_DATE}";',
        "",
    ]
    COUNTS_OUT.write_text("\n".join(lines), encoding="utf-8")


def build_payload(row: dict[str, Any], photo: str | None) -> dict[str, Any]:
    code = STATE_CODES.get(row["state"], "")
    official_id = f"mayor-{slugify(row['name'])}-{slugify(row['city'])}"
    first_name, last_name = split_name(row["name"])
    term_end = row["term_end"] or "Current public term pending source review"
    population = f", population rank #{row['rank']}" if row.get("rank") else ""
    jurisdiction = f"City of {row['city']}, {row['state']}"
    if row["city"] == "New York City":
        jurisdiction = f"City of New York, {row['state']}"
    bio = (
        f"{row['name']} is listed as mayor of {row['city']}, {row['state']}{population}. "
        "This RepWatchr starter profile is source-seeded from the public Wikipedia table of mayors "
        "of the 50 largest U.S. cities and still needs a city/government source pass."
    )

    payload = {
        "id": official_id,
        "name": row["name"],
        "firstName": first_name,
        "lastName": last_name,
        "photo": photo,
        "photoSourceUrl": row.get("photo_source_url"),
        "photoCredit": "Wikimedia Commons public file source" if row.get("photo_source_url") else None,
        "party": party_code(row["party"]),
        "level": "city",
        "position": "Mayor",
        "district": row["city"],
        "jurisdiction": jurisdiction,
        "county": [],
        "termStart": row["term_start"],
        "termEnd": term_end,
        "contactInfo": {},
        "bio": bio,
        "campaignPromises": [],
        "reviewStatus": "source_seeded",
        "state": code,
        "sourceLinks": source_links(row),
        "lastVerifiedAt": ACCESSED_DATE,
    }
    return {key: value for key, value in payload.items() if value is not None}


def main() -> int:
    rows = extract_rows()
    if len(rows) < 45:
        print(f"Only found {len(rows)} largest-city mayor rows; refusing partial import.", file=sys.stderr)
        return 1

    clean_generated_dirs()
    photos = 0
    for row in rows:
        official_id = f"mayor-{slugify(row['name'])}-{slugify(row['city'])}"
        photo = download_image(row.get("photo_url"), IMAGE_OUT / f"{official_id}.jpg")
        if photo:
            photos += 1
        payload = build_payload(row, photo)
        write_json(CITY_OUT / f"{official_id}.json", payload)

    write_counts_file()
    print(f"Imported {len(rows)} largest-city mayor profiles.")
    print(f"Downloaded {photos} mayor profile photos.")
    print(f"Source: {WIKIPEDIA_PAGE_URL}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
