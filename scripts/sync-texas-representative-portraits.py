#!/usr/bin/env python3
"""Download missing Texas representative portrait assets without deleting anything."""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FEDERAL_DIR = ROOT / "src/data/officials/federal"
STATE_DIR = ROOT / "src/data/officials/state"
REP_POSITIONS = {
    "U.S. Representative",
    "U.S. Senator",
    "State Representative",
    "State Senator",
}


def is_texas_record(record: dict) -> bool:
    state = str(record.get("state") or "").upper()
    district = str(record.get("district") or "").upper()
    record_id = str(record.get("id") or "").lower()
    return (
        state == "TX"
        or district.startswith(("TX-", "HD-", "SD-"))
        or record_id.startswith(("tx-", "us-house-tx", "us-senate-tx"))
    )


def iter_texas_reps() -> list[tuple[Path, dict]]:
    rows: list[tuple[Path, dict]] = []
    patterns = (
        (FEDERAL_DIR, "us-house-tx*.json"),
        (FEDERAL_DIR, "us-senate-tx*.json"),
        (STATE_DIR, "tx-house-*.json"),
        (STATE_DIR, "tx-senate-*.json"),
    )
    for directory, pattern in patterns:
        for path in sorted(directory.glob(pattern)):
            record = json.loads(path.read_text())
            if record.get("position") in REP_POSITIONS and is_texas_record(record):
                rows.append((path, record))
    return rows


def download(url: str, output_path: Path, timeout: int) -> None:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "RepWatchr portrait source sync (public official profile asset)",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        content_type = response.headers.get("content-type", "")
        if "image" not in content_type:
            raise ValueError(f"source did not return an image content-type: {content_type}")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(response.read())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=0, help="maximum missing portraits to attempt")
    parser.add_argument("--timeout", type=int, default=20, help="per-image download timeout in seconds")
    parser.add_argument("--sleep", type=float, default=0.25, help="polite pause between downloads")
    parser.add_argument("--dry-run", action="store_true", help="print work without downloading")
    args = parser.parse_args()

    attempted = 0
    downloaded = 0
    skipped = 0
    failed: list[str] = []

    for path, record in iter_texas_reps():
        photo = record.get("photo")
        source_url = record.get("photoSourceUrl")
        if not photo or not source_url:
            skipped += 1
            continue

        output_path = ROOT / "public" / str(photo).lstrip("/")
        if output_path.exists():
            skipped += 1
            continue

        attempted += 1
        print(f"missing portrait: {record.get('id')} -> {photo}")
        if args.dry_run:
            if args.limit and attempted >= args.limit:
                break
            continue

        try:
            download(str(source_url), output_path, args.timeout)
            downloaded += 1
            time.sleep(args.sleep)
        except (OSError, ValueError, urllib.error.URLError) as exc:
            failed.append(f"{path.name}: {exc}")

        if args.limit and attempted >= args.limit:
            break

    print(f"attempted={attempted} downloaded={downloaded} skipped={skipped} failed={len(failed)}")
    for item in failed[:20]:
        print(f"failed: {item}")
    if len(failed) > 20:
        print(f"failed: {len(failed) - 20} more not shown")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
