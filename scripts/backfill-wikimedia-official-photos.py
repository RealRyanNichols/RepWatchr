#!/usr/bin/env python3
"""Backfill missing official profile photos from Wikimedia/Wikidata.

This script only uses identity-anchored matches:

- Federal profiles: existing Bioguide ID -> Wikidata P1157 -> Wikimedia image.
- State/local profiles: existing sourced Wikipedia URL -> Wikidata sitelink -> Wikimedia image.

It does not discover new officeholders and it does not match by name alone.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps, UnidentifiedImageError


ROOT = Path(__file__).resolve().parents[1]
OFFICIALS_ROOT = ROOT / "src" / "data" / "officials"
IMAGE_ROOT = ROOT / "public" / "images" / "officials"
ACCESSED_DATE = dt.date.today().isoformat()

SPARQL_URL = "https://query.wikidata.org/sparql"
COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php"
MAX_IMAGE_BYTES = 10_000_000
MAX_PROFILE_IMAGE_SIZE = (520, 640)
USER_AGENT = "RepWatchr Wikimedia official photo backfill/1.0 (Ryan@RealRyanNichols.com)"


def read_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def request(url: str, data: bytes | None = None) -> urllib.request.Request:
    return urllib.request.Request(
        iri_to_uri(url),
        data=data,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/sparql-results+json, application/json, */*",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )


def iri_to_uri(url: str) -> str:
    parts = urllib.parse.urlsplit(url.replace(" ", "%20"))
    path = urllib.parse.quote(urllib.parse.unquote(parts.path), safe="/%:@")
    query = urllib.parse.quote(urllib.parse.unquote(parts.query), safe="=&?/:;+,%@")
    fragment = urllib.parse.quote(urllib.parse.unquote(parts.fragment), safe="=&?/:;+,%@")
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, path, query, fragment))


def sparql(query: str, retries: int = 3) -> list[dict[str, Any]]:
    data = urllib.parse.urlencode({"query": query, "format": "json"}).encode("utf-8")
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request(SPARQL_URL, data), timeout=60) as response:
                payload = json.loads(response.read().decode("utf-8"))
            return payload.get("results", {}).get("bindings", [])
        except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Wikidata query failed: {last_error}")


def chunked(values: list[Any], size: int) -> list[list[Any]]:
    return [values[index : index + size] for index in range(0, len(values), size)]


def existing_wikipedia_url(official: dict[str, Any]) -> str | None:
    for source in official.get("sourceLinks") or []:
        url = str(source.get("url") or "").strip()
        if "en.wikipedia.org/wiki/" in url:
            return url.split("#", 1)[0]
    return None


def image_subdir(profile_path: Path, official: dict[str, Any]) -> Path:
    relative = profile_path.relative_to(OFFICIALS_ROOT)
    parts = relative.parts
    official_id = official["id"]
    if parts[0] == "federal":
        return IMAGE_ROOT / "federal" / official_id
    if parts[0] in {"state-legislature", "state-executive"} and len(parts) > 1:
        return IMAGE_ROOT / parts[0] / parts[1] / official_id
    return IMAGE_ROOT / str(official.get("level") or parts[0]) / official_id


def collect_missing_profiles(federal_only: bool = False, wikipedia_only: bool = False) -> list[dict[str, Any]]:
    profiles: list[dict[str, Any]] = []
    for path in sorted(OFFICIALS_ROOT.rglob("*.json")):
        official = read_json(path)
        if not official or official.get("photo"):
            continue
        if federal_only and official.get("level") != "federal":
            continue
        task = {
            "path": path,
            "official": official,
            "target_stem": image_subdir(path, official),
        }
        if not wikipedia_only and official.get("level") == "federal" and official.get("bioguideId"):
            task["kind"] = "bioguide"
            task["bioguide"] = str(official["bioguideId"])
            profiles.append(task)
            continue
        wiki_url = existing_wikipedia_url(official)
        if wiki_url:
            task["kind"] = "wikipedia"
            task["wikiUrl"] = wiki_url
            profiles.append(task)
    return profiles


def bioguide_images(ids: list[str]) -> dict[str, dict[str, str]]:
    matches: dict[str, dict[str, str]] = {}
    for batch in chunked(sorted(set(ids)), 80):
        values = " ".join(f'"{value}"' for value in batch)
        rows = sparql(
            f"""
            SELECT ?id ?item ?itemLabel ?image WHERE {{
              VALUES ?id {{ {values} }}
              ?item wdt:P1157 ?id.
              OPTIONAL {{ ?item wdt:P18 ?image. }}
              SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
            }}
            """
        )
        for row in rows:
            if "image" not in row:
                continue
            bioguide = row["id"]["value"]
            matches[bioguide] = {
                "image": row["image"]["value"].replace("http://", "https://"),
                "wikidata": row["item"]["value"].replace("http://", "https://"),
                "label": row.get("itemLabel", {}).get("value", ""),
            }
    return matches


def wikipedia_images(urls: list[str]) -> dict[str, dict[str, str]]:
    matches: dict[str, dict[str, str]] = {}
    for batch in chunked(sorted(set(urls)), 45):
        values = " ".join(f"<{url}>" for url in batch)
        rows = sparql(
            f"""
            SELECT ?article ?item ?itemLabel ?image WHERE {{
              VALUES ?article {{ {values} }}
              ?article schema:about ?item ;
                       schema:isPartOf <https://en.wikipedia.org/> .
              OPTIONAL {{ ?item wdt:P18 ?image. }}
              SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
            }}
            """
        )
        for row in rows:
            if "image" not in row:
                continue
            article = row["article"]["value"]
            matches[article] = {
                "image": row["image"]["value"].replace("http://", "https://"),
                "wikidata": row["item"]["value"].replace("http://", "https://"),
                "label": row.get("itemLabel", {}).get("value", ""),
            }
    return matches


def commons_file_title(source_url: str) -> str | None:
    parsed = urllib.parse.urlparse(source_url)
    if "commons.wikimedia.org" not in parsed.netloc:
        return None
    marker = "/wiki/Special:FilePath/"
    if marker not in parsed.path:
        return None
    file_name = urllib.parse.unquote(parsed.path.split(marker, 1)[1])
    if not file_name:
        return None
    return "File:" + file_name


def commons_thumbnail_url(source_url: str, width: int = 640) -> str:
    title = commons_file_title(source_url)
    if not title:
        return source_url
    params = {
        "action": "query",
        "format": "json",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url|mime",
        "iiurlwidth": str(width),
    }
    api_url = COMMONS_API_URL + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(request(api_url), timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
        pages = payload.get("query", {}).get("pages", {})
        for page in pages.values():
            for info in page.get("imageinfo") or []:
                return info.get("thumburl") or info.get("url") or source_url
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError):
        return source_url
    return source_url


def validate_profile_image(image: Image.Image, source_url: str) -> tuple[bool, str | None]:
    width, height = image.size
    if width < 120 or height < 120:
        return False, "image too small"
    lower_url = urllib.parse.unquote(source_url).lower()
    if width > height * 2.4 and not re.search(r"portrait|headshot|official|congress|senate|house|profile", lower_url):
        return False, "image too wide for a profile photo"
    if height > width * 3.3:
        return False, "image too tall for a profile photo"
    if re.search(r"/(seal|flag|logo|map|arrow|icon|vector|signature|coat_of_arms)", lower_url):
        return False, "generic civic image"
    return True, None


def download_and_optimize(source_url: str, target_stem: Path, retry_count: int = 0) -> tuple[str | None, str | None]:
    download_url = commons_thumbnail_url(source_url)
    try:
        with urllib.request.urlopen(request(download_url), timeout=20) as response:
            content_type = response.headers.get("content-type", "")
            if content_type and not content_type.startswith("image/"):
                return None, "not image content"
            body = response.read(MAX_IMAGE_BYTES + 1)
        if len(body) > MAX_IMAGE_BYTES:
            return None, "image too large"
        if len(body) < 500:
            return None, "image too small"

        with Image.open(BytesIO(body)) as image:
            image = ImageOps.exif_transpose(image)
            valid, reason = validate_profile_image(image, source_url)
            if not valid:
                return None, reason
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

        target = target_stem.with_suffix(".jpg")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(output.getvalue())
        return "/" + str(target.relative_to(ROOT / "public")), None
    except urllib.error.HTTPError as exc:
        if exc.code == 429 and retry_count < 2:
            time.sleep(2)
            return download_and_optimize(source_url, target_stem, retry_count + 1)
        return None, str(exc)
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, UnidentifiedImageError) as exc:
        return None, str(exc)


def add_source_link(official: dict[str, Any], title: str, url: str) -> None:
    links = official.setdefault("sourceLinks", [])
    if any(link.get("url") == url for link in links):
        return
    links.append({"title": title, "url": url})


def patch_profile(task: dict[str, Any], match: dict[str, str], photo: str) -> None:
    official = task["official"]
    kind = task["kind"]
    source_url = match["image"]
    official["photo"] = photo
    official["photoSourceUrl"] = source_url
    if kind == "bioguide":
        official["photoCredit"] = "Wikimedia Commons image referenced by Wikidata Bioguide match"
        add_source_link(official, "Wikidata Bioguide image record", match["wikidata"])
    else:
        official["photoCredit"] = "Wikimedia Commons image referenced by sourced Wikipedia/Wikidata record"
        add_source_link(official, "Wikidata sourced profile image record", match["wikidata"])
    add_source_link(official, "Wikimedia Commons profile image", source_url)
    official["lastVerifiedAt"] = ACCESSED_DATE
    write_json(task["path"], official)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=0, help="Limit downloads for testing")
    parser.add_argument("--federal-only", action="store_true", help="Only backfill federal Bioguide-anchored profiles")
    parser.add_argument("--wikipedia-only", action="store_true", help="Only backfill sourced Wikipedia/Wikidata profiles")
    parser.add_argument("--workers", type=int, default=4, help="Concurrent image downloads")
    args = parser.parse_args()

    tasks = collect_missing_profiles(federal_only=args.federal_only, wikipedia_only=args.wikipedia_only)
    bioguide_ids = [task["bioguide"] for task in tasks if task["kind"] == "bioguide"]
    wiki_urls = [task["wikiUrl"] for task in tasks if task["kind"] == "wikipedia"]
    by_bioguide = bioguide_images(bioguide_ids) if bioguide_ids else {}
    by_wiki = wikipedia_images(wiki_urls) if wiki_urls else {}

    candidates: list[tuple[dict[str, Any], dict[str, str]]] = []
    for task in tasks:
        match = by_bioguide.get(task.get("bioguide")) if task["kind"] == "bioguide" else by_wiki.get(task.get("wikiUrl"))
        if match and match.get("image"):
            candidates.append((task, match))

    if args.limit:
        candidates = candidates[: args.limit]

    written = 0
    completed = 0
    warnings: list[str] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        future_map = {
            executor.submit(download_and_optimize, match["image"], task["target_stem"]): (task, match)
            for task, match in candidates
        }
        for future in as_completed(future_map):
            task, match = future_map[future]
            photo, warning = future.result()
            completed += 1
            if photo:
                patch_profile(task, match, photo)
                written += 1
            elif warning:
                official = task["official"]
                warnings.append(f"{official.get('id')}: {warning}")
            if completed % 50 == 0:
                print(f"Processed {completed}/{len(candidates)} candidates; wrote {written} photos.", flush=True)

    print(f"Missing photo profiles with identity-backed Wikimedia candidates: {len(candidates)}")
    print(f"Wrote {written} Wikimedia-backed profile photos.")
    if warnings:
        print(f"Warnings: {len(warnings)}")
        for warning in warnings[:80]:
            print(f"- {warning}")
        if len(warnings) > 80:
            print(f"- ... {len(warnings) - 80} more warnings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
