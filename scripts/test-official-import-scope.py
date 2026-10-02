#!/usr/bin/env python3
"""Exercise Texas ingestion boundaries without network calls or repo writes."""

import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from official_scope import is_profile_state, is_texas_official, require_profile_state


def load_script(name):
    path = Path(__file__).with_name(f"{name}.py")
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class OfficialImportScopeTest(unittest.TestCase):
    def test_legacy_texas_and_explicit_conflicts(self):
        self.assertTrue(is_profile_state("Texas"))
        self.assertTrue(is_texas_official({"contactInfo": {"office": "Wells, TX 75976"}}))
        self.assertTrue(is_texas_official({"jurisdiction": "Texas Supreme Court"}))
        self.assertFalse(is_texas_official({"state": "CA", "jurisdiction": "Texas"}))
        self.assertFalse(is_texas_official({"contactInfo": {"office": "Los Angeles, CA 90001"}, "jurisdiction": "Texas"}))
        self.assertFalse(is_texas_official({"jurisdiction": "Unverified town"}))
        with self.assertRaises(ValueError):
            require_profile_state({"id": "unmarked", "jurisdiction": "Texas"})

    def test_all_profile_writers_reject_before_touching_disk(self):
        for name in (
            "import-national-federal-officials",
            "import-national-openstates-officials",
            "import-openstates-municipal-officials",
            "import-wikipedia-largest-city-mayors",
        ):
            module = load_script(name)
            with tempfile.TemporaryDirectory() as temporary:
                target = Path(temporary) / "new-directory" / "outside.json"
                with self.subTest(importer=name), self.assertRaises(ValueError):
                    module.write_json(target, {"id": "outside", "state": "CA"})
                self.assertFalse(target.parent.exists())

    def test_federal_selection_excludes_other_states(self):
        module = load_script("import-national-federal-officials")
        people = [{"name": {"first": str(i), "last": "Fixture"}, "id": {"bioguide": str(i)}, "terms": [{"state": state, "type": chamber, "start": "2025-01-01", "end": "2027-01-01"}]} for i, (state, chamber) in enumerate([("TX", "sen"), ("TX", "sen"), ("TX", "rep"), ("CA", "rep")])]
        written = []
        with patch.object(module, "fetch_text", return_value="unused"), patch.object(module.yaml, "safe_load", return_value=people), patch.object(module, "clean_generated_dirs"), patch.object(module, "download_profile_photo", return_value=(None, None, None, None)), patch.object(module, "make_payload", side_effect=lambda person, term, *args: {"state": term["state"]}), patch.object(module, "write_json", side_effect=lambda path, payload: written.append(payload)), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(module.main(), 0)
        self.assertEqual(len(written), 3)
        self.assertEqual({row["state"] for row in written}, {"TX"})

    def test_empty_texas_source_cannot_clear_roster(self):
        module = load_script("import-national-federal-officials")
        with patch.object(module, "fetch_text", return_value="unused"), patch.object(module.yaml, "safe_load", return_value=[]), patch.object(module, "clean_generated_dirs") as clean, contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(module.main(), 1)
        clean.assert_not_called()
        for name in ["import-national-openstates-officials", "import-openstates-municipal-officials"]:
            module = load_script(name)
            with tempfile.TemporaryDirectory() as temporary:
                (Path(temporary) / "data" / "ca").mkdir(parents=True)
                with patch("sys.argv", [name, "--source-dir", temporary, "--skip-images"]), patch.object(module, "clean_generated_dirs") as clean, contextlib.redirect_stderr(io.StringIO()):
                    self.assertEqual(module.main(), 1, name)
                clean.assert_not_called()

    def test_openstates_walk_only_visits_texas(self):
        import yaml
        for name, kind, role_type in [("import-national-openstates-officials", "executive", "governor"), ("import-openstates-municipal-officials", "municipalities", "mayor")]:
            module = load_script(name)
            with tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                for state in ["tx", "ca"]:
                    directory = root / "data" / state / kind
                    directory.mkdir(parents=True)
                    jurisdiction = f"ocd-jurisdiction/country:us/state:{state}/government" if kind == "executive" else f"ocd-jurisdiction/country:us/state:{state}/place:fixture/government"
                    (directory / "person.yml").write_text(yaml.safe_dump({"name": f"{state} Fixture", "roles": [{"type": role_type, "jurisdiction": jurisdiction, "start_date": "2025-01-01"}]}))
                tasks = module.build_tasks(root, False, set())[0] if kind == "executive" else module.build_tasks(root, set(), set())[0]
                self.assertEqual(len(tasks), 1, name)
                self.assertEqual(tasks[0]["code"], "TX")

    def test_mayor_source_filter_runs_before_downloads(self):
        module = load_script("import-wikipedia-largest-city-mayors")
        rows = [{"state": "Texas", "name": "TX Fixture", "city": "Fixture", "photo_url": None}] + [{"state": "California", "name": f"CA Fixture {i}", "city": "Fixture", "photo_url": None} for i in range(44)]
        written = []
        with patch.object(module, "extract_rows", return_value=rows), patch.object(module, "clean_generated_dirs"), patch.object(module, "download_image", return_value=None) as download, patch.object(module, "build_payload", side_effect=lambda row, photo: {"state": module.STATE_CODES[row["state"]]}), patch.object(module, "write_json", side_effect=lambda path, payload: written.append(payload)), patch.object(module, "write_counts_file"), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(module.main(), 0)
        self.assertEqual(download.call_count, 1)
        self.assertEqual(written, [{"state": "TX"}])

    def test_vote_and_trading_lookups_ignore_non_texas(self):
        votes = load_script("import-federal-vote-records")
        trades = load_script("import-congress-trading")
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            for state in ["TX", "CA"]:
                (directory / f"{state}.json").write_text(json.dumps({"id": state, "name": state, "lastName": state, "state": state, "bioguideId": state, "position": "U.S. Senator"}))
            with patch.object(votes, "OFFICIALS_DIR", directory), patch.object(trades, "FEDERAL_OFFICIALS_DIR", directory):
                self.assertEqual(set(votes.load_federal_officials()[0]), {"TX"})
                self.assertEqual(trades.load_current_federal_lookup()[0], {"TX"})
        for district, expected in [("TX-01", True), ("TX", True), ("Texas", True), ("CA-01", False), ("TXish", False), ("", False)]:
            self.assertEqual(trades.is_texas_tracker_row({"district": district}), expected)

    def test_ideology_uses_texas_records_only(self):
        module = load_script("generate-official-ideology-master")
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            for row in [{"id": "tx", "state": "TX"}, {"id": "ca", "state": "CA"}, {"id": "legacy", "contactInfo": {"office": "Wells, TX 75976"}}]:
                (directory / f"{row['id']}.json").write_text(json.dumps(row))
            with patch.object(module, "OFFICIALS", directory):
                self.assertEqual({row["id"] for row in module.collect_officials()}, {"tx", "legacy"})


if __name__ == "__main__":
    unittest.main()
