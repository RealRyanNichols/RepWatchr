import assert from "node:assert/strict";
import { getAllOfficials } from "../src/lib/data";
import { getJurisdictionSummaries, rosterSourceHref } from "../src/lib/jurisdiction-explorer";

const base = process.env.REPWATCHR_SMOKE_BASE_URL ?? "http://127.0.0.1:3107";
const rows = getJurisdictionSummaries(getAllOfficials());
async function read(path: string, expected = 200) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, expected, `${path}: wrong HTTP status`);
  return (await response.text()).replace(/<!--[\s\S]*?-->/g, "");
}
for (let index = 0; index < rows.length; index += 4) {
  await Promise.all(rows.slice(index, index + 4).map(async (row) => {
    const html = await read(row.href);
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `${row.href}: expected one h1`);
    assert.equal((html.match(/<main(?:\s|>)/g) ?? []).length, 1, `${row.href}: expected one main landmark`);
    assert.match(html, /name="robots" content="noindex, follow"/, `${row.href}: working roster must not be indexed`);
    assert(html.includes("Working roster."));
    assert(html.includes("/submit-source?target="));
  }));
}
const filtered = await read("/home-district/roster?county=Harrison&kind=city");
assert.match(filtered, /name="robots" content="noindex, follow"/);
for (const slug of ["hallsville", "longview", "marshall"]) assert(filtered.includes(`/home-district/roster/city/${slug}`));
assert(!filtered.includes('href="/home-district/roster/city/tyler"'));
const empty = await read("/home-district/roster?q=no-such-jurisdiction");
assert(empty.includes("No matching jurisdiction in the working list."));
const longview = rows.find((row) => row.slug === "longview")!;
const source = await read(rosterSourceHref(longview, "City Council Member"));
assert(source.includes("Back to Longview records"));
assert(source.includes('value="Longview: City Council Member"'));
assert(source.includes("Check the current officeholder, office or precinct"));
await read("/home-district/roster/city/not-a-real-place", 404);
await read("/home-district/roster/school/longview", 404);
console.log(`Local record route checks passed against ${base}: ${rows.length} detail pages, filters, empty state, source context, and real 404s.`);
