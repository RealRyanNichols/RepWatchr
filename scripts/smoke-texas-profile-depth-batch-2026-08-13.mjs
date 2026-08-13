import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-13";
const files = [
  ...[27, 28, 29, 30, 31].map((district) => `src/data/officials/state/tx-senate-sd${district}.json`),
  ...[
    "tx-sboe-d1-gustavo-reveles.json", "tx-sboe-d2-lj-francis.json", "tx-sboe-d3-marisa-b-perez-diaz.json",
    "tx-sboe-d5-rebecca-bell-metereau.json", "tx-sboe-d6-will-hickman.json", "tx-sboe-d7-julie-pickren.json",
    "tx-sboe-d8-audrey-young.json", "tx-sboe-d9-keven-ellis.json", "tx-sboe-d10-tom-maynard.json",
    "tx-sboe-d13-tiffany-clark.json", "tx-sboe-d15-aaron-kinsey.json",
  ].map((file) => `src/data/officials/statewide/tx/${file}`),
  "src/data/officials/federal/us-house-tx1.json", "src/data/officials/federal/us-house-tx12.json",
  "src/data/officials/federal/us-house-tx18.json", "src/data/officials/federal/us-senate-tx-cornyn.json",
  "src/data/officials/federal/us-senate-tx-cruz.json", "src/data/officials/county/marion-county/county-judge.json",
  "src/data/officials/state/tx-house-hd1.json", "src/data/officials/state/tx-house-hd4.json", "src/data/officials/state/tx-house-hd5.json",
];
const errors = [];
for (const relative of files) {
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
  const label = `${profile.name} (${relative})`;
  if (profile.lastVerifiedAt !== REVIEWED_AT || !profile.name || !profile.position || profile.state !== "TX") errors.push(`${label}: identity/freshness incomplete`);
  if (!profile.party || !profile.nextElection || !profile.contactInfo?.website) errors.push(`${label}: office/election/contact incomplete`);
  if (!profile.photo?.startsWith("/") || !profile.photoSourceUrl || !profile.photoCredit || !profile.photoRights) errors.push(`${label}: stored portrait provenance incomplete`);
  if (!profile.bio || profile.bio.length < 180 || !Array.isArray(profile.committeeAssignments)) errors.push(`${label}: biography/assignments incomplete`);
  if (!Array.isArray(profile.sourceLinks) || profile.sourceLinks.length < 10) errors.push(`${label}: source ledger below ten entries`);
  if (profile.sourceLinks?.some((item) => item.accessedAt !== REVIEWED_AT || !item.supports?.length)) errors.push(`${label}: field-level source metadata incomplete`);
  if (!profile.officialRecord?.status || profile.campaignFinanceDisclosure?.status !== "pending_review" || profile.sentimentDisclosure?.status !== "pending_review") errors.push(`${label}: evidence disclosures incomplete`);
  for (const key of ["identity", "portrait", "contact", "term", "assignments", "legislation", "votingRecord", "campaignFinance", "positiveWork", "criticism", "sentiment", "constitutionalAlignment"]) {
    if (!profile.fieldFreshness?.[key] || profile.fieldFreshness[key].reviewedAt !== REVIEWED_AT) errors.push(`${label}: missing freshness gate ${key}`);
  }
  for (const key of ["campaignFinance", "positiveWork", "sentiment", "constitutionalAlignment"]) {
    if (profile.fieldFreshness?.[key]?.status !== "pending_review") errors.push(`${label}: ${key} must remain pending_review`);
  }
  const imagePath = path.join(ROOT, "public", profile.photo);
  if (!fs.existsSync(imagePath)) errors.push(`${label}: portrait file missing`);
  else {
    const [width, height] = execFileSync("identify", ["-format", "%w %h", imagePath], { encoding: "utf8" }).trim().split(/\s+/).map(Number);
    if (Math.min(width, height) < 500) errors.push(`${label}: portrait below 500px (${width}x${height})`);
  }
}
if (files.length !== 25 || new Set(files).size !== 25) errors.push("batch must contain exactly 25 unique profiles");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Texas profile depth smoke passed: ${files.length} profiles.`);
