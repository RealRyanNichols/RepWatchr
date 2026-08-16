import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-16";
const districts = [
  1, 4, 5, 17, 29, 37, 51, 63, 68, 70, 74, 75, 80,
  84, 90, 91, 104, 139, 141, 143, 144, 145, 148, 149, 150,
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

for (const district of districts) {
  const profile = readJson(path.join(ROOT, "src", "data", "officials", "state", `tx-house-hd${district}.json`));
  const record = readJson(path.join(ROOT, "src", "data", "vote-records", `${profile.id}.json`));
  const evidence = profile.votingRecordEvidence;

  if (profile.reviewStatus !== "record_enriched" || profile.lastVerifiedAt !== REVIEWED_AT) {
    throw new Error(`${profile.id}: dossier review status or review date is stale`);
  }
  if (profile.district !== `HD-${district}` || profile.position !== "State Representative" || profile.state !== "TX") {
    throw new Error(`${profile.id}: current office identity mismatch`);
  }
  if (evidence?.status !== "record_level_evidence_loaded" || evidence.indexedPositions !== record.summary.totalVotesLoaded) {
    throw new Error(`${profile.id}: vote evidence summary does not match the stored official record`);
  }
  if (evidence.storedRecordRows !== record.votes.length || evidence.reviewedAt !== REVIEWED_AT) {
    throw new Error(`${profile.id}: stored row count or review date mismatch`);
  }
  if (!record.votes.every((vote) => vote.sourceUrl && vote.sourceId && vote.voteCast && vote.date)) {
    throw new Error(`${profile.id}: unsourced record-level vote row`);
  }
  if (profile.committeeAssignments.length === 0 || profile.fieldFreshness?.assignments?.status !== "current") {
    throw new Error(`${profile.id}: committee assignments are missing or stale`);
  }
  if (profile.fieldFreshness?.biography?.status !== "current" || !profile.bio.endsWith(".")) {
    throw new Error(`${profile.id}: biography is stale or incomplete`);
  }
  if (profile.fieldFreshness?.contact?.status !== "current" || !profile.contactInfo.office.endsWith("Austin, Texas 78711-2910")) {
    throw new Error(`${profile.id}: Capitol address is incomplete`);
  }
  if (!profile.contactInfo.phone || !profile.contactInfo.website.startsWith("https://house.texas.gov/members/")) {
    throw new Error(`${profile.id}: official contact channels are incomplete`);
  }
  if (!profile.sourceLinks.some((source) => source.url.includes("GeneralVotesByDateHouse.aspx"))) {
    throw new Error(`${profile.id}: missing official votes-by-date source`);
  }
  if (!profile.sourceLinks.some((source) => source.supports?.includes("portrait_provenance"))) {
    throw new Error(`${profile.id}: missing portrait provenance source`);
  }
  for (const gate of ["campaignFinance", "positiveWork", "criticism", "sentiment", "constitutionalAlignment"]) {
    if (profile.fieldFreshness?.[gate]?.status !== "pending_review") {
      throw new Error(`${profile.id}: unsupported ${gate} gate was opened`);
    }
  }
  const photoFile = path.join(ROOT, "public", profile.photo.replace(/^\//, ""));
  const dimensions = execFileSync("identify", ["-format", "%w %h", photoFile], { encoding: "utf8" })
    .trim()
    .split(/\s+/)
    .map(Number);
  if (Math.min(...dimensions) < 500) throw new Error(`${profile.id}: portrait is below 500px minimum`);
}

console.log(`Texas House August 16 vote-depth smoke passed for ${districts.length} profiles.`);
