import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-11";
const stateDir = path.join(ROOT, "src/data/officials/state");
const files = [
  ...fs.readdirSync(stateDir).filter((name) => /^tx-coa-[1-4]-place-/.test(name)).map((name) => path.join("src/data/officials/state", name)),
  "src/data/officials/statewide/tx/tx-rrc-wayne-christian.json",
];
const errors = [];
if (files.length !== 27) errors.push(`expected 27 files, found ${files.length}`);

for (const relative of files) {
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
  const prefix = `${profile.name} (${relative})`;
  if (profile.lastVerifiedAt !== REVIEWED_AT) errors.push(`${prefix}: wrong freshness date`);
  if (profile.reviewStatus !== "source_seeded") errors.push(`${prefix}: wrong review status`);
  if (!profile.name || !profile.position || !profile.district || !["R", "D"].includes(profile.party)) errors.push(`${prefix}: missing identity/office fields`);
  if (!profile.contactInfo?.website || !profile.contactInfo?.office || !profile.contactInfo?.phone) errors.push(`${prefix}: missing public contact path`);
  if (!profile.bio || profile.bio.length < 180) errors.push(`${prefix}: biography too short`);
  if (!profile.nextElection) errors.push(`${prefix}: missing next-election status`);
  if (!Array.isArray(profile.committeeAssignments)) errors.push(`${prefix}: assignments status missing`);
  if (!profile.photoRights || !profile.photoSourceUrl) errors.push(`${prefix}: portrait provenance missing`);
  if (!Array.isArray(profile.sourceLinks) || profile.sourceLinks.length < 10) errors.push(`${prefix}: source ledger below ten entries`);
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

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Texas appellate accountability smoke passed: ${files.length} profiles.`);
