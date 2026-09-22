import assert from "node:assert/strict";
import { getAllOfficials } from "../src/lib/data";
import { getJurisdictionSummaries, rosterSourceHref } from "../src/lib/jurisdiction-explorer";
import { filterJurisdictions, parseRosterFilters } from "../src/lib/roster-filters";
import { getRosterSourceContext } from "../src/lib/roster-source-context";

const rows = getJurisdictionSummaries(getAllOfficials());
const defaults = parseRosterFilters({});
assert.equal(filterJurisdictions(rows, defaults).length, rows.length);
assert.deepEqual(parseRosterFilters({ kind: "school", status: "invented", sort: "score" }), defaults);
assert.equal(parseRosterFilters({ q: ["  Longview  ", "Tyler"] }).q, "Longview");
assert.equal(parseRosterFilters({ q: "x".repeat(500) }).q.length, 100);

const harrisonCities = filterJurisdictions(rows, parseRosterFilters({ county: "Harrison", kind: "city" }));
assert(harrisonCities.some((row) => row.slug === "longview"), "Cross-county Longview must remain discoverable in Harrison.");
assert(harrisonCities.some((row) => row.slug === "marshall"));
assert(harrisonCities.every((row) => row.kind === "city" && row.counties.includes("Harrison")));
assert.equal(filterJurisdictions(rows, parseRosterFilters({ q: "Longview", county: "Marion" })).length, 0);
assert.equal(filterJurisdictions(rows, parseRosterFilters({ q: "no such jurisdiction" })).length, 0);
assert(filterJurisdictions(rows, parseRosterFilters({ status: "not-started" })).every((row) => row.profileCount === 0));
assert(filterJurisdictions(rows, parseRosterFilters({ status: "has-records" })).every((row) => row.profileCount > 0));
assert(filterJurisdictions(rows, parseRosterFilters({ status: "gaps" })).every((row) => row.missingOfficeCount > 0));
const sorted = filterJurisdictions(rows, parseRosterFilters({ sort: "records" }));
assert(sorted.every((row, index) => index === 0 || sorted[index - 1].profileCount >= row.profileCount));

for (const row of rows) {
  const source = new URL(rosterSourceHref(row, "Council / Place 2"), "https://www.repwatchr.com");
  const context = getRosterSourceContext(source.searchParams.get("from") ?? undefined);
  assert.equal(context?.href, row.href, "Every contribution must preserve the exact public record route.");
  assert.equal(context?.name, row.name);
  assert.equal(source.searchParams.get("type"), "roster");
  assert(source.searchParams.get("target")?.includes("Council / Place 2"));
}
for (const unsafe of [undefined, "https://evil.example", "//evil.example", "javascript:alert(1)", "/admin", "/home-district/roster/city/unknown", "/home-district/roster/city/longview?next=https://evil.example", "/home-district/roster/city/../admin"]) {
  assert.equal(getRosterSourceContext(unsafe), null, `Unsafe or unknown return path accepted: ${unsafe}`);
}

console.log(`Roster navigation passed: ${rows.length} jurisdictions, combined filters, cross-county discovery, empty states, sorting, and safe contribution context.`);
