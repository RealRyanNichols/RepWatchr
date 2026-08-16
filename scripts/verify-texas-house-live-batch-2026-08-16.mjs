import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const districts = [
  1, 4, 5, 17, 29, 37, 51, 63, 68, 70, 74, 75, 80,
  84, 90, 91, 104, 139, 141, 143, 144, 145, 148, 149, 150,
];
const rosterUrl = "https://house.texas.gov/api/getMembers";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function plain(value) {
  return String(value)
    .replace(/&iacute;/gi, "í")
    .replace(/&aacute;/gi, "á")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function key(value) {
  return plain(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

const rosterResponse = await fetch(rosterUrl, { signal: AbortSignal.timeout(30_000) });
if (!rosterResponse.ok) throw new Error(`Texas House roster returned ${rosterResponse.status}`);
const roster = await rosterResponse.json();

for (const district of districts) {
  const profile = readJson(path.join(ROOT, "src", "data", "officials", "state", `tx-house-hd${district}.json`));
  const member = roster.find((item) => item.id === district);
  if (!member) throw new Error(`Official roster is missing HD-${district}`);
  const rosterName = plain(member.member_name).split(",").map((item) => item.trim()).reverse().join(" ");
  if (key(rosterName) !== key(profile.name)) {
    throw new Error(`HD-${district} identity mismatch: ${rosterName} != ${profile.name}`);
  }

  const [memberResponse, committeeResponse] = await Promise.all([
    fetch(profile.contactInfo.website, { signal: AbortSignal.timeout(30_000) }),
    fetch(`${profile.contactInfo.website}/committees`, { signal: AbortSignal.timeout(30_000) }),
  ]);
  if (!memberResponse.ok || !committeeResponse.ok) {
    throw new Error(`HD-${district} official page returned ${memberResponse.status}/${committeeResponse.status}`);
  }
  const memberHtml = await memberResponse.text();
  const committeeHtml = await committeeResponse.text();
  if (!memberHtml.includes(`District ${district}`) || !memberHtml.includes("Austin, Texas 78711-2910")) {
    throw new Error(`HD-${district} official member page is missing the expected district or complete Capitol address`);
  }
  const committeeTextKey = key(committeeHtml.replace(/<[^>]+>/g, " "));
  if (!committeeHtml.includes("Committee") || !committeeTextKey.includes(key(profile.lastName))) {
    throw new Error(`HD-${district} official committee page failed its identity/content check`);
  }
}

console.log(`Live Texas House roster, member, contact, and committee verification passed for ${districts.length} profiles.`);
