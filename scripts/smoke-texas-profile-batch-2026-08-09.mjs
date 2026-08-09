import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const senateDistricts = [];
const houseDistricts = [
  115, 116, 117, 118, 120, 121, 122, 123, 124, 127,
  128, 129, 130, 132, 134, 137, 138, 139, 141, 143,
  144, 145, 148, 149, 150,
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

assert(paths.length === 25, `Expected 25 profile paths, found ${paths.length}`);
for (const path of paths) {
  const profile = JSON.parse(readFileSync(path, "utf8"));
  assert(profile.name && profile.position && profile.jurisdiction, `${path}: identity incomplete`);
  assert(/^\d{4}-12-31$/.test(profile.termEnd), `${profile.id}: term end is not source resolved`);
  assert(/^\d{4} general election$/.test(profile.nextElection), `${profile.id}: next election missing`);
  assert(profile.reviewStatus === "source_seeded", `${profile.id}: must remain source_seeded`);
  assert(profile.lastVerifiedAt === "2026-08-09", `${profile.id}: freshness date mismatch`);
  assert(profile.photo?.startsWith("/images/officials/texas-accountability/"), `${profile.id}: stored portrait missing`);
  const imagePath = join(root, "public", profile.photo);
  assert(existsSync(imagePath), `${profile.id}: portrait file not found`);
  const dimensions = jpegDimensions(readFileSync(imagePath));
  assert(dimensions?.width >= 500 && dimensions?.height >= 500, `${profile.id}: portrait below 500x500`);
  assert(profile.photoSourceUrl?.startsWith("https://"), `${profile.id}: portrait provenance missing`);
  assert(profile.photoCredit && profile.photoRights, `${profile.id}: portrait rights metadata missing`);
  assert(profile.sourceLinks?.length >= 10, `${profile.id}: source ledger too short`);
  assert(profile.sourceLinks.every((source) => source.accessedAt === "2026-08-09"), `${profile.id}: source freshness missing`);
  assert(Array.isArray(profile.committeeAssignments), `${profile.id}: committee field missing`);
  assert(profile.accountabilityNotes?.length >= 5, `${profile.id}: evidence gates not disclosed`);
  assert(profile.fieldFreshness?.campaignFinance?.status === "pending_review", `${profile.id}: finance gap not explicit`);
  assert(profile.fieldFreshness?.sentiment?.status === "pending_review", `${profile.id}: sentiment gap not explicit`);
  assert(profile.fieldFreshness?.positiveWork?.status === "pending_review", `${profile.id}: positive-work gap not explicit`);
  assert(profile.fieldFreshness?.criticism?.status === "pending_review", `${profile.id}: criticism gap not explicit`);
  assert(profile.fieldFreshness?.constitutionalAlignment?.status === "pending_review", `${profile.id}: constitutional gate missing`);
}

const customPortraitChecks = [
  {
    district: 115,
    credit: "Official Mexican American Legislative Caucus member portrait.",
    rights: "Official Texas House legislative-caucus profile image",
    source: "https://malc.org/membership/",
  },
  {
    district: 118,
    credit: "Jonathan Mallard, U.S. Air Force",
    rights: "Public domain United States federal-government work",
    source: "https://commons.wikimedia.org/wiki/File:John_Lujan_visits_560th_Flying_Training_Wing_(cropped).jpg",
  },
  {
    district: 122,
    credit: "Gage Skidmore, CC BY-SA 3.0",
    rights: "Creative Commons Attribution-ShareAlike 3.0 Unported",
    source: "https://commons.wikimedia.org/wiki/File:Mark_Dorazio_by_Gage_Skidmore.jpg",
  },
];

for (const check of customPortraitChecks) {
  const profile = JSON.parse(readFileSync(
    join(root, "src", "data", "officials", "state", `tx-house-hd${check.district}.json`),
    "utf8",
  ));
  assert(profile.photoCredit.includes(check.credit), `${profile.id}: custom portrait attribution mismatch`);
  assert(profile.photoRights.includes(check.rights), `${profile.id}: custom portrait rights mismatch`);
  assert(profile.sourceLinks.some((source) => source.url === check.source), `${profile.id}: portrait source ledger entry missing`);
}

assert(!existsSync(join(root, "src", "data", "officials", "state", "tx-senate-sd22.json")), "Vacant SD-22 must remain absent");

const profileExperience = readFileSync(
  join(root, "src", "components", "officials", "OfficialProfileExperience.tsx"),
  "utf8",
);
assert(
  profileExperience.includes("const reviewedAt = official.lastVerifiedAt ?? voteRecord?.lastUpdated;"),
  "Profile hero must prefer the profile verification date over an older vote-record date",
);

const universalDashboard = readFileSync(
  join(root, "src", "components", "officials", "UniversalOfficialDashboard.tsx"),
  "utf8",
);
assert(
  universalDashboard.includes("const refreshedAt = official.lastVerifiedAt ?? overlay.completion?.lastCheckedAt ?? voteRecord?.lastUpdated;"),
  "Universal dashboard must prefer the profile verification date over older metric dates",
);

console.log(`Texas profile batch smoke passed: ${paths.length} source-reviewed active-office profiles.`);
