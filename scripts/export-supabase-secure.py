#!/usr/bin/env python3
"""Run interactively on the Droplet. Read-only source export; never prints passwords."""
from datetime import datetime, timezone
import getpass
import hashlib
import json
import os
from pathlib import Path
import subprocess


def main():
    os.umask(0o077)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    destination = Path("/srv/repwatchr-migration") / stamp
    destination.mkdir(parents=True, mode=0o700)
    pg = Path("/usr/lib/postgresql/17/bin")
    if not (pg / "pg_dump").exists():
        raise SystemExit("PostgreSQL 17 client required; no source data changed.")
    print("RepWatchr read-only database backup to this Droplet.")
    print("This does not reset credentials, move the live database, or cancel Supabase.")
    password = getpass.getpass("Existing RepWatchr database password (hidden; Enter to cancel): ")
    if not password:
        raise SystemExit("Cancelled; source unchanged.")
    env = dict(os.environ, PGHOST="aws-1-us-west-2.pooler.supabase.com", PGPORT="5432",
               PGUSER="postgres.rgxboswrinsuakxqstyc", PGDATABASE="postgres",
               PGSSLMODE="verify-full", PGSSLROOTCERT="/srv/site-env/repwatchr-supabase-roots.pem",
               PGCONNECT_TIMEOUT="15", PGPASSWORD=password)
    password = None
    partial = destination / "database.dump.partial"
    try:
        subprocess.run([str(pg / "pg_dump"), "--no-password", "--format=custom", "--file=" + str(partial)],
                       env=env, check=True, timeout=600)
        subprocess.run([str(pg / "pg_restore"), "--list", str(partial)], check=True,
                       stdout=subprocess.DEVNULL)
        archive = destination / "database.dump"
        partial.rename(archive)
        roles = subprocess.run([str(pg / "pg_dumpall"), "--no-password", "--roles-only", "--no-role-passwords"],
                               env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        if roles.returncode == 0:
            (destination / "roles-without-passwords.sql").write_bytes(roles.stdout)
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        manifest = {"project": "rgxboswrinsuakxqstyc", "exportedAt": stamp,
                    "archive": archive.name, "sha256": digest, "bytes": archive.stat().st_size,
                    "rolesExported": roles.returncode == 0,
                    "restored": False, "liveMigrationComplete": False,
                    "limitations": "Logical database backup only. Separately reconcile files, hosted Auth/OAuth/SMTP settings, signing/encryption keys, edge-function secrets, jobs and external integrations. Restore and policy/auth tests are still required."}
        (destination / "manifest.json").write_text(json.dumps(manifest, indent=2))
        print("Backup archive verified readable:", archive)
        print("Restore and migration verification remain pending. Supabase is unchanged.")
    finally:
        env.pop("PGPASSWORD", None)


if __name__ == "__main__":
    main()
