import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getAllOfficials, getOfficialById, getRepWatchrDataStats } from "../src/lib/data";
import { isTexasOfficial, officialState } from "../src/lib/official-scope";
import { isInFootprint } from "../src/lib/district-footprint";
import { getAllOfficialIdeologyProfiles } from "../src/lib/ideology";
import type { Official } from "../src/types";

const officials = getAllOfficials();
const probe = { jurisdiction: "Unassigned", county: ["Harrison"], contactInfo: {} } as Official;
assert.equal(officialState(probe), "", "A shared county name cannot establish Texas jurisdiction");
assert.equal(isTexasOfficial({ ...probe, state: "CA", jurisdiction: "Texas", contactInfo: { office: "Austin, TX 78701" } }), false, "Explicit out-of-state jurisdiction wins over incidental Texas text");
assert.equal(isTexasOfficial({ ...probe, contactInfo: { office: "Harleton, TX 75651" } }), true, "Legacy Texas local records retain postal provenance");
assert.equal(isTexasOfficial({ ...probe, state: "MO", jurisdiction: "Marion County" }), false);
assert(officials.length > 700, "Texas records must survive cleanup");
assert(officials.every(isTexasOfficial), "No directory, search or API may load a non-Texas official");
assert.equal(getOfficialById("nancy-pelosi"), undefined);
assert.equal(getOfficialById("mitch-mcconnell"), undefined);
for (const id of ["jay-dean", "nathaniel-moran", "ted-cruz", "john-cornyn"]) {
  const official = getOfficialById(id);
  assert(official, `Retain Texas officeholder ${id}`);
  if (id === "jay-dean" || id === "nathaniel-moran") assert(isInFootprint(official));
}
const ids = new Set(officials.map((official) => official.id));
assert(getAllOfficialIdeologyProfiles().every((profile) => ids.has(profile.officialId)), "Derived profile records follow retained IDs");
const stats = getRepWatchrDataStats();
assert.equal(stats.federalExpectedSeats, 40);
assert.equal(stats.stateLegislatureExpectedSeats, 181);
assert.equal(stats.texasFederalStateExpectedSeats, 221);
for (const official of officials) {
  for (const photo of [official.photo, official.featuredPhoto]) {
    if (photo?.startsWith("/images/")) assert(fs.existsSync(path.join(process.cwd(), "public", photo.split("?")[0])), `Preserve retained portrait ${photo}`);
  }
}
console.log(`Texas profile scope passed: ${officials.length} records, HD7/TX01 retained, out-of-state queries excluded, linked portraits present.`);
