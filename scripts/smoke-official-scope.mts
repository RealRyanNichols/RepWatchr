import assert from "node:assert/strict";
import { getAllOfficials } from "../src/lib/data";
import { HOME_DISTRICT_COUNTIES, HOME_DISTRICTS, isInHomeDistricts } from "../src/lib/home-districts";
import type { Official } from "../src/types";

const fixture = (overrides: Partial<Official> = {}): Official => ({
  id: "scope-regression-fixture",
  name: "Scope regression fixture",
  firstName: "Scope",
  lastName: "Fixture",
  party: "NP",
  level: "city",
  position: "Council Member",
  jurisdiction: "City of Austin, Texas",
  county: [],
  state: "TX",
  termStart: "",
  termEnd: "",
  contactInfo: {},
  ...overrides,
});

for (const [name, official, expected] of [
  ["San Antonio justice center", fixture({
    level: "state", jurisdiction: "Fourth Court of Appeals District, Texas",
    contactInfo: { office: "Cadena-Reeves Justice Center, 300 Dolorosa, San Antonio, TX 78205" },
  }), false],
  ["Fort Worth justice center", fixture({
    level: "state", jurisdiction: "Second Court of Appeals District, Texas",
    contactInfo: { office: "Tim Curry Criminal Justice Center, Fort Worth, TX 76196" },
  }), false],
  ["Kyle Center Street", fixture({
    jurisdiction: "City of Kyle, Texas", contactInfo: { office: "100 W Center St;Kyle, TX 78640" },
  }), false],
  ["institutional Center police", fixture({ jurisdiction: "Texas Medical Center police" }), false],
  ["City of Center", fixture({ jurisdiction: "City of Center, Texas" }), true],
  ["bare structured city", fixture({ jurisdiction: "Center" }), true],
  ["Center school district", fixture({ level: "school-board", jurisdiction: "Center ISD" }), true],
  ["qualified Tyler address", fixture({
    level: "state", jurisdiction: "Twelfth Court of Appeals District, Texas",
    contactInfo: { office: "1517 West Front Street, Suite 354, Tyler, TX 75702" },
  }), true],
  ["home county without a state field", fixture({ state: undefined, county: ["Gregg County"] }), true],
  ["foreign shared county", fixture({ state: "OH", county: ["Harrison"] }), false],
  ["foreign shared municipality", fixture({ state: "GA", jurisdiction: "City of Atlanta" }), false],
  ["HD-7 seat without counties", fixture({ level: "state", district: "HD-7" }), true],
  ["TX-01 seat without counties", fixture({ level: "federal", district: "TX-01" }), true],
  ["Texas jurisdiction without local evidence", fixture({ level: "state", jurisdiction: "Texas" }), false],
] as const) {
  assert.equal(isInHomeDistricts(official), expected, name);
}

const officials = getAllOfficials();
const countyNames = new Set(HOME_DISTRICT_COUNTIES.map((county) => county.toLowerCase()));
let retainedLocalProfiles = 0;
for (const official of officials) {
  if (official.state && official.state.toUpperCase() !== "TX") continue;
  if (!official.county.some((county) => countyNames.has(county.trim().toLowerCase().replace(/\s+county$/, "")))) continue;
  assert.equal(isInHomeDistricts(official), true, `Preserve local county record: ${official.id}`);
  retainedLocalProfiles += 1;
}
assert.ok(retainedLocalProfiles > 0, "The real local dataset was loaded");

for (const district of HOME_DISTRICTS) {
  const official = officials.find((record) => record.id === district.incumbentOfficialId);
  assert.ok(official, `${district.code} profile exists`);
  assert.equal(isInHomeDistricts(official), true, `${district.code} remains in scope`);
}

for (const official of officials.filter((record) => /^tx-coa-[24]-/.test(record.id) || record.id === "yvonne-flores-cale")) {
  assert.equal(isInHomeDistricts(official), false, `Exclude false Center locality: ${official.id}`);
}

console.log(`Official scope checks passed; ${retainedLocalProfiles} local county records retained.`);
