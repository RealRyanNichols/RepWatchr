import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-18";
const houseDistricts = [2, 3, 27, 57, 58, 112];
const federalDistricts = [19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];
const files = [
  ...houseDistricts.map((district) => `src/data/officials/state/tx-house-hd${district}.json`),
  ...federalDistricts.map((district) => `src/data/officials/federal/us-house-tx${district}.json`),
];
const errors = [];

for (const relative of files) {
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
  const voteRecord = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/vote-records", `${profile.id}.json`), "utf8"));
  const label = `${profile.name} (${relative})`;
  const isFederal = relative.includes("/federal/");
  const expectedRows = isFederal ? 24 : 60;
  const expectedPositions = isFederal ? 221 : 4507;

  if (profile.reviewStatus !== "record_enriched" || profile.lastVerifiedAt !== REVIEWED_AT) errors.push(`${label}: depth/freshness marker incomplete`);
  if (!profile.name || /&[a-z]+;|\blll\b/.test(profile.name)) errors.push(`${label}: full name contains an unresolved source artifact`);
  if (!profile.position || !profile.district || !profile.jurisdiction || !profile.party) errors.push(`${label}: office identity incomplete`);
  if (!profile.termStart || !profile.termEnd || !profile.nextElection) errors.push(`${label}: term/election disclosure incomplete`);
  if (!profile.contactInfo?.office || !profile.contactInfo?.phone || !profile.contactInfo?.website?.startsWith("https://")) errors.push(`${label}: current contact channels incomplete`);
  if (!isFederal && !profile.contactInfo.office.endsWith("Austin, Texas 78711-2910")) errors.push(`${label}: complete Capitol mailing address missing`);
  if (isFederal && !profile.contactInfo.office.includes("Washington")) errors.push(`${label}: complete Washington office address missing`);
  if (!profile.bio || profile.bio.length < 180 || !profile.bio.endsWith(".")) errors.push(`${label}: concise biography incomplete`);
  if (!Array.isArray(profile.committeeAssignments) || profile.committeeAssignments.length === 0) errors.push(`${label}: current committee assignments missing`);

  if (!profile.photo?.startsWith("/") || !profile.photoSourceUrl || !profile.photoCredit || !profile.photoRights) errors.push(`${label}: stored portrait provenance incomplete`);
  const portraitFile = path.join(ROOT, "public", profile.photo.replace(/^\//, ""));
  if (!fs.existsSync(portraitFile)) errors.push(`${label}: portrait file missing`);
  else {
    const [width, height] = execFileSync("identify", ["-format", "%w %h", portraitFile], { encoding: "utf8" }).trim().split(/\s+/).map(Number);
    if (Math.min(width, height) < 500) errors.push(`${label}: portrait below 500px gate (${width}x${height})`);
    if (!profile.fieldFreshness?.portrait?.note?.includes(`${width}x${height}`)) errors.push(`${label}: stored portrait dimensions not recorded in freshness metadata`);
  }
  if (!profile.sourceLinks?.some((item) => item.url.includes("commons.wikimedia.org") && item.supports?.includes("portrait_license"))) errors.push(`${label}: Commons license ledger missing`);

  if (!Array.isArray(profile.sourceLinks) || profile.sourceLinks.length < 12) errors.push(`${label}: source ledger below 12 entries`);
  if (profile.sourceLinks?.some((item) => item.accessedAt !== REVIEWED_AT || !item.supports?.length || !item.url?.startsWith("https://"))) errors.push(`${label}: field-mapped source ledger incomplete`);
  if (!profile.sourceLinks?.some((item) => item.supports?.includes("portrait_provenance"))) errors.push(`${label}: portrait provenance source missing`);
  if (!profile.sourceLinks?.some((item) => item.supports?.includes("sponsored_legislation"))) errors.push(`${label}: sponsored-legislation path missing`);
  if (!profile.sourceLinks?.some((item) => item.supports?.includes("roll_call_links"))) errors.push(`${label}: roll-call path missing`);

  if (voteRecord.officialId !== profile.id || voteRecord.summary?.totalVotesLoaded !== expectedPositions || voteRecord.votes?.length !== expectedRows) errors.push(`${label}: vote record identity/count mismatch`);
  if (voteRecord.votes?.some((vote) => !vote.sourceUrl || !vote.sourceId || !vote.voteCast || !vote.date)) errors.push(`${label}: unsourced vote row`);
  if (profile.votingRecordEvidence?.indexedPositions !== expectedPositions || profile.votingRecordEvidence?.storedRecordRows !== expectedRows || profile.votingRecordEvidence?.reviewedAt !== REVIEWED_AT) errors.push(`${label}: voting evidence summary mismatch`);
  if (profile.officialRecord?.status !== "record_level_vote_evidence_loaded") errors.push(`${label}: official record was not promoted to record-level depth`);
  if (profile.campaignFinanceDisclosure?.status !== "pending_review" || profile.sentimentDisclosure?.status !== "pending_review") errors.push(`${label}: unsupported finance/sentiment disclosure opened`);

  const freshnessKeys = ["identity", "portrait", "contact", "term", "assignments", "biography", "legislation", "votingRecord", "officialRecord", "campaignFinance", "positiveWork", "criticism", "sentiment", "constitutionalAlignment"];
  for (const key of freshnessKeys) {
    if (!profile.fieldFreshness?.[key] || profile.fieldFreshness[key].reviewedAt !== REVIEWED_AT || !profile.fieldFreshness[key].sourceUrl) errors.push(`${label}: missing field freshness ${key}`);
  }
  for (const key of ["campaignFinance", "positiveWork", "criticism", "sentiment", "constitutionalAlignment"]) {
    if (profile.fieldFreshness?.[key]?.status !== "pending_review") errors.push(`${label}: unsupported ${key} gate opened`);
  }
}

if (files.length !== 25 || new Set(files).size !== 25) errors.push("Batch must contain exactly 25 unique profiles");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Texas August 18 profile-depth smoke passed for ${files.length} profiles.`);
