#!/usr/bin/env python3
"""Bounded official-source discovery. Changes are leads, never findings/publication."""
import concurrent.futures
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import tempfile
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlparse

SOURCES = [
    ("longview-agendas", "Longview public notices and agendas", "https://www.longviewtexas.gov/AgendaCenter"),
    ("harrison-court", "Harrison County Commissioners Court", "https://www.harrisoncountytexas.gov/page/CommissionerCourt"),
    ("gregg-county", "Gregg County official records discovery", "https://greggcounty.texas.gov/"),
    ("kilgore-finances", "Kilgore financial transparency", "https://cityofkilgore.com/579/Financial-Transparency"),
    ("edtx-releases", "Eastern District of Texas releases; geographic review required", "https://www.justice.gov/usao-edtx"),
    ("texas-audits", "Texas State Auditor reports; geographic review required", "https://sao.texas.gov/"),
]
INTEREST = re.compile(r"agenda|minute|budget|audit|tax|council|commission|/pr/|report|financial", re.I)
MAX_BYTES = 2_000_000


class Records(HTMLParser):
    def __init__(self, base):
        super().__init__()
        self.base, self.href, self.label, self.links = base, None, [], set()

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.href = dict(attrs).get("href")
            self.label = []

    def handle_data(self, data):
        if self.href:
            self.label.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.href:
            label = " ".join(" ".join(self.label).split())
            url = urljoin(self.base, self.href).split("#")[0]
            if urlparse(url).scheme == "https" and INTEREST.search(url + " " + label):
                self.links.add((url, label[:300]))
            self.href = None


def atomic_json(path, value):
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=".pending-")
    try:
        with os.fdopen(fd, "w") as stream:
            json.dump(value, stream, indent=2)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def inspect(source, folder, checked_at):
    key, name, url = source
    result = {"id": key, "name": name, "url": url, "checkedAt": checked_at}
    state_file = folder / (key + ".json")
    previous = json.loads(state_file.read_text()) if state_file.exists() else None
    try:
        request = Request(url, headers={"User-Agent": "RepWatchr public-records monitor (+https://www.repwatchr.com); hourly discovery"})
        with urlopen(request, timeout=20) as response:
            if urlparse(response.url).hostname != urlparse(url).hostname:
                raise ValueError("Source redirected to another host; review required")
            if "text/html" not in response.headers.get("Content-Type", ""):
                raise ValueError("Unexpected source format")
            body = response.read(MAX_BYTES + 1)
        if len(body) > MAX_BYTES:
            raise ValueError("Source exceeds bounded download size")
        parser = Records(url)
        parser.feed(body.decode("utf-8", errors="replace"))
        if not parser.links:
            raise ValueError("No relevant record links; source needs review")
        links = [{"url": link, "title": label} for link, label in sorted(parser.links)]
        digest = hashlib.sha256(json.dumps(links, sort_keys=True).encode()).hexdigest()
        old_urls = {item["url"] for item in (previous or {}).get("links", [])}
        result.update(status="baseline" if not previous else "changed" if digest != previous.get("digest") else "unchanged",
                      digest=digest, links=links,
                      newLinks=[item for item in links if item["url"] not in old_urls] if previous else [],
                      lastSuccessfulCheck=checked_at)
        atomic_json(state_file, result)
    except Exception as error:
        result.update(status="error", error=type(error).__name__ + ": " + str(error)[:250],
                      lastSuccessfulCheck=(previous or {}).get("lastSuccessfulCheck"))
    return result


def main():
    os.umask(0o077)
    folder = Path(os.environ.get("REPWATCHR_MONITOR_DIR", "/var/lib/repwatchr/record-monitor"))
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    checked_at = datetime.now(timezone.utc).isoformat()
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(lambda source: inspect(source, folder, checked_at), SOURCES))
    report = {"checkedAt": checked_at, "publication": "none", "note": "Discovery only. A changed link is not evidence of misconduct. Read original records and verify the location, date, finding and response before reporting.", "sources": results}
    atomic_json(folder / "latest.json", report)
    print(json.dumps({"checkedAt": checked_at, "sources": [{"id": x["id"], "status": x["status"]} for x in results], "publication": "none"}))
    if any(x["status"] == "error" for x in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
