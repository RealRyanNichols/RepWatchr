import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-12";
const ids = [
  "tx-coa-4-place-4-lori-massey-brissette",
  "tx-coa-5-place-1-j-j-koch", "tx-coa-5-place-5-cynthia-m-barbare", "tx-coa-5-place-7-nancy-kennedy",
  "tx-coa-5-place-8-dennise-garcia", "tx-coa-5-place-9-tina-clinton", "tx-coa-5-place-10-earl-jackson",
  "tx-coa-5-place-11-gino-j-rossini", "tx-coa-5-place-13-emily-miskel",
  "tx-coa-7-place-3-alex-l-yarbrough", "tx-coa-7-place-4-lawrence-m-doss",
  "tx-coa-9-place-2-jay-wright", "tx-coa-9-place-4-kent-chambers",
  "tx-coa-10-place-2-lee-harris", "tx-coa-12-place-2-brian-t-hoyle", "tx-coa-12-place-3-c-michael-davis",
  "tx-coa-13-place-1-jaime-e-tijerina", "tx-coa-13-place-2-jenny-cron",
  "tx-coa-14-place-3-chad-bridges", "tx-coa-14-place-4-tonya-mclaughlin", "tx-coa-14-place-6-katy-boatman",
  "tx-coa-14-place-7-ken-wise", "tx-coa-14-place-8-brad-hart", "tx-coa-14-place-9-randy-wilson",
  "tx-coa-15-place-1-scott-brister",
];
const errors = [];

for (const id of ids) {
  const relative = `src/data/officials/state/${id}.json`;
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
  const prefix = `${profile.name} (${relative})`;
  if (profile.id !== id || profile.lastVerifiedAt !== REVIEWED_AT || profile.reviewStatus !== "source_seeded") errors.push(`${prefix}: identity/freshness mismatch`);
  if (!profile.name || !profile.position || !profile.district || !["R", "D"].includes(profile.party)) errors.push(`${prefix}: missing identity/office fields`);
  if (!profile.contactInfo?.website || !profile.contactInfo?.office || !profile.contactInfo?.phone) errors.push(`${prefix}: missing public contact path`);
  if (!profile.bio || profile.bio.length < 180 || !profile.nextElection) errors.push(`${prefix}: incomplete biography/election status`);
  if (!profile.photoRights || !profile.photoSourceUrl) errors.push(`${prefix}: portrait provenance missing`);
  if (!Array.isArray(profile.sourceLinks) || profile.sourceLinks.length < 12) errors.push(`${prefix}: source ledger below twelve entries`);
  if (profile.sourceLinks?.some((item) => item.accessedAt !== REVIEWED_AT || !item.supports?.length)) errors.push(`${prefix}: incomplete field-level source metadata`);
  for (const key of ["identity", "portrait", "contact", "term", "assignments", "legislation", "votingRecord", "officialRecord", "campaignFinance", "positiveWork", "criticism", "sentiment", "constitutionalAlignment"]) {
    if (!profile.fieldFreshness?.[key] || profile.fieldFreshness[key].reviewedAt !== REVIEWED_AT) errors.push(`${prefix}: missing freshness gate ${key}`);
  }
  for (const key of ["campaignFinance", "positiveWork", "criticism", "sentiment", "constitutionalAlignment"]) {
    if (profile.fieldFreshness?.[key]?.status !== "pending_review") errors.push(`${prefix}: ${key} must remain pending_review`);
  }
  const imagePath = path.join(ROOT, "public", profile.photo);
  if (!fs.existsSync(imagePath)) errors.push(`${prefix}: stored portrait missing`);
  else {
    const [width, height] = execFileSync("identify", ["-format", "%w %h", imagePath], { encoding: "utf8" }).trim().split(/\s+/).map(Number);
    if (Math.min(width, height) < 500) errors.push(`${prefix}: portrait below 500px (${width}x${height})`);
  }
}

if (new Set(ids).size !== 25) errors.push("batch id list is not exactly 25 unique profiles");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Texas appellate accountability smoke passed: ${ids.length} profiles.`);
