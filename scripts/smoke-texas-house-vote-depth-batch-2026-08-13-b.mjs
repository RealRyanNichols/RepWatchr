import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-13";
const districts = [40, 41, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 54, 55, 56, 59, 60, 61, 62, 64, 65, 66, 67, 69, 71];

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
  if (evidence?.status !== "record_level_evidence_loaded" || evidence.indexedPositions !== record.summary.totalVotesLoaded) {
    throw new Error(`${profile.id}: vote evidence summary does not match the stored official record`);
  }
  if (evidence.storedRecordRows !== record.votes.length || evidence.reviewedAt !== REVIEWED_AT) {
    throw new Error(`${profile.id}: stored row count or review date mismatch`);
  }
  if (profile.fieldFreshness?.votingRecord?.status !== "current") {
    throw new Error(`${profile.id}: voting record freshness was not promoted to current`);
  }
  if (profile.fieldFreshness?.biography?.status !== "current" || !profile.bio.endsWith(".")) {
    throw new Error(`${profile.id}: biography is stale or incomplete`);
  }
  if (!profile.sourceLinks.some((source) => source.url.includes("GeneralVotesByDateHouse.aspx"))) {
    throw new Error(`${profile.id}: missing official votes-by-date source`);
  }
  if (!record.votes.every((vote) => vote.sourceUrl && vote.sourceId && vote.voteCast && vote.date)) {
    throw new Error(`${profile.id}: unsourced record-level vote row`);
  }
  for (const gate of ["campaignFinance", "sentiment", "constitutionalAlignment"]) {
    if (profile.fieldFreshness?.[gate]?.status !== "pending_review") {
      throw new Error(`${profile.id}: unsupported ${gate} gate was opened`);
    }
  }

  const photoFile = path.join(ROOT, "public", profile.photo.replace(/^\//, ""));
  const dimensions = execFileSync("identify", ["-format", "%w %h", photoFile], { encoding: "utf8" }).trim().split(/\s+/).map(Number);
  if (Math.min(...dimensions) < 500) throw new Error(`${profile.id}: portrait is below 500px minimum`);
}

console.log(`Texas House vote-depth smoke passed for ${districts.length} profiles.`);
