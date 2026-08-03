import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const senateDistricts = Array.from({ length: 16 }, (_, index) => index + 1);
const supremeIds = [
  "tx-supreme-jimmy-blacklock",
  "tx-supreme-debra-lehrmann",
  "tx-supreme-john-phillip-devine",
  "tx-supreme-brett-busby",
  "tx-supreme-jane-bland",
  "tx-supreme-rebeca-aizpuru-huddle",
  "tx-supreme-evan-a-young",
  "tx-supreme-james-p-sullivan",
  "tx-supreme-kyle-d-hawkins",
];
const paths = [
  ...senateDistricts.map((district) => join(root, "src", "data", "officials", "state", `tx-senate-sd${district}.json`)),
  ...supremeIds.map((id) => join(root, "src", "data", "officials", "state", `${id}.json`)),
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(paths.length === 25, `Expected 25 profile paths, found ${paths.length}`);
for (const path of paths) {
  const profile = JSON.parse(readFileSync(path, "utf8"));
  assert(profile.name && profile.position && profile.jurisdiction, `${path}: identity incomplete`);
  assert(profile.termStart && /^\d{4}-12-31$/.test(profile.termEnd), `${profile.id}: term is not source resolved`);
  assert(/^\d{4} general election$/.test(profile.nextElection), `${profile.id}: next election missing`);
  assert(profile.reviewStatus === "source_seeded", `${profile.id}: must remain source_seeded`);
  assert(profile.lastVerifiedAt === "2026-08-03", `${profile.id}: freshness date mismatch`);
  assert(profile.photo?.startsWith("/images/officials/texas-accountability/"), `${profile.id}: stored portrait missing`);
  assert(existsSync(join(root, "public", profile.photo)), `${profile.id}: portrait file not found`);
  assert(profile.photoSourceUrl?.startsWith("https://"), `${profile.id}: portrait provenance missing`);
  assert(profile.photoCredit, `${profile.id}: portrait credit missing`);
  assert(profile.sourceLinks?.length >= 8, `${profile.id}: source ledger too short`);
  assert(profile.sourceLinks.every((source) => source.accessedAt === "2026-08-03"), `${profile.id}: field freshness missing`);
  assert(profile.accountabilityNotes?.length >= 3, `${profile.id}: evidence gates not disclosed`);
  assert(profile.fieldFreshness?.campaignFinance?.status === "pending_review", `${profile.id}: finance gap not explicit`);
  assert(profile.fieldFreshness?.sentiment?.status === "pending_review", `${profile.id}: sentiment gap not explicit`);
}

const staleDistrict22 = join(root, "src", "data", "officials", "state", "tx-senate-sd22.json");
assert(!existsSync(staleDistrict22), "Vacant Senate District 22 must not publish Brian Birdwell as current");
console.log(`Texas profile batch smoke passed: ${paths.length} source-reviewed active-office profiles.`);
