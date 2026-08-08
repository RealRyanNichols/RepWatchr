import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const senateDistricts = [];
const houseDistricts = [
  49, 50, 52, 53, 54, 55, 56, 59, 60, 61,
  62, 64, 65, 66, 67, 69, 71, 72, 73, 76,
  77, 78, 79, 81, 82, 83, 85, 86, 87, 88,
  89, 92, 93, 94, 95, 96, 97, 98, 99, 100,
  101, 102, 105, 106, 107, 108, 109, 110, 111, 114,
];
const paths = [
  ...senateDistricts.map((district) => join(root, "src", "data", "officials", "state", `tx-senate-sd${district}.json`)),
  ...houseDistricts.map((district) => join(root, "src", "data", "officials", "state", `tx-house-hd${district}.json`)),
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function jpegDimensions(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
    const length = bytes.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    if (length < 2) break;
    offset += 2 + length;
  }
  return null;
}

assert(paths.length === 50, `Expected 50 profile paths, found ${paths.length}`);
for (const path of paths) {
  const profile = JSON.parse(readFileSync(path, "utf8"));
  assert(profile.name && profile.position && profile.jurisdiction, `${path}: identity incomplete`);
  assert(/^\d{4}-12-31$/.test(profile.termEnd), `${profile.id}: term end is not source resolved`);
  assert(/^\d{4} general election$/.test(profile.nextElection), `${profile.id}: next election missing`);
  assert(profile.reviewStatus === "source_seeded", `${profile.id}: must remain source_seeded`);
  assert(profile.lastVerifiedAt === "2026-08-08", `${profile.id}: freshness date mismatch`);
  assert(profile.photo?.startsWith("/images/officials/texas-accountability/"), `${profile.id}: stored portrait missing`);
  const imagePath = join(root, "public", profile.photo);
  assert(existsSync(imagePath), `${profile.id}: portrait file not found`);
  const dimensions = jpegDimensions(readFileSync(imagePath));
  assert(dimensions?.width >= 500 && dimensions?.height >= 500, `${profile.id}: portrait below 500x500`);
  assert(profile.photoSourceUrl?.startsWith("https://"), `${profile.id}: portrait provenance missing`);
  assert(profile.photoCredit && profile.photoRights, `${profile.id}: portrait rights metadata missing`);
  assert(profile.sourceLinks?.length >= 10, `${profile.id}: source ledger too short`);
  assert(profile.sourceLinks.every((source) => source.accessedAt === "2026-08-08"), `${profile.id}: source freshness missing`);
  assert(Array.isArray(profile.committeeAssignments), `${profile.id}: committee field missing`);
  assert(profile.accountabilityNotes?.length >= 5, `${profile.id}: evidence gates not disclosed`);
  assert(profile.fieldFreshness?.campaignFinance?.status === "pending_review", `${profile.id}: finance gap not explicit`);
  assert(profile.fieldFreshness?.sentiment?.status === "pending_review", `${profile.id}: sentiment gap not explicit`);
  assert(profile.fieldFreshness?.positiveWork?.status === "pending_review", `${profile.id}: positive-work gap not explicit`);
  assert(profile.fieldFreshness?.criticism?.status === "pending_review", `${profile.id}: criticism gap not explicit`);
  assert(profile.fieldFreshness?.constitutionalAlignment?.status === "pending_review", `${profile.id}: constitutional gate missing`);
}

assert(!existsSync(join(root, "src", "data", "officials", "state", "tx-senate-sd22.json")), "Vacant SD-22 must remain absent");
console.log(`Texas profile batch smoke passed: ${paths.length} source-reviewed active-office profiles.`);
