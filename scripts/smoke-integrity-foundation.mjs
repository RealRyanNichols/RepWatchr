import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const read = (file) => readFileSync(file, "utf8");
const jsonFiles = (dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(read(path.join(dir, file))));

const dataLibrary = read("src/lib/data.ts");
const completion = read("src/lib/profile-completion.ts");
const ideology = read("src/lib/ideology.ts");
const verificationPage = read("src/app/auth/verify/page.tsx");
const socialAutopost = read("src/lib/social-autopost.ts");
const featureFlags = read("src/lib/repwatchr-feature-flags.ts");

for (const token of [
  "PUBLIC_EVIDENCE_STATUSES",
  "isPublishedEvidenceStatus(bill.reviewStatus)",
  "isPublishableScoreCard",
  ".filter(isPublishableRedFlag)",
]) {
  if (!dataLibrary.includes(token)) {
    throw new Error(`Evidence publication gate is missing: ${token}`);
  }
}

if (completion.includes("hasVoteSourcePath")) {
  throw new Error("A generic government source path must not count as a completed vote record.");
}
if (completion.includes("hasCampaignFinanceSourcePath")) {
  throw new Error("A generic campaign-finance lookup path must not count as completed funding research.");
}
if (!ideology.includes("Previously generated evidence is quarantined")) {
  throw new Error("Generated ideology evidence needs a fail-closed publication gate.");
}

for (const forbidden of ["dl_hash", "hashDL", "isValidTXDL", ".from(\"profiles\").upsert"] ) {
  if (verificationPage.includes(forbidden)) {
    throw new Error(`Unsafe browser verification behavior remains: ${forbidden}`);
  }
}
if (!verificationPage.includes("Human and residence verification are being built as separate checks")) {
  throw new Error("Verification pause must be explained to members.");
}
if (!featureFlags.includes("NEXT_PUBLIC_ENABLE_COMMUNITY_VOTING_V2")) {
  throw new Error("Community voting needs an explicit, default-off public launch gate.");
}

const billDrafts = jsonFiles("src/data/votes");
if (billDrafts.some((bill) => ["verified", "complete"].includes(bill.reviewStatus))) {
  throw new Error("A tracked bill was marked publishable without this audit reviewing its primary record.");
}

const scorecardDrafts = jsonFiles("src/data/scores");
if (scorecardDrafts.some((scorecard) => ["verified", "complete"].includes(scorecard.reviewStatus))) {
  throw new Error("A legacy scorecard was marked publishable without reviewed bill mappings.");
}

const fundingDrafts = jsonFiles("src/data/funding");
if (fundingDrafts.some((funding) => ["verified", "complete"].includes(funding.reviewStatus))) {
  throw new Error("A legacy funding summary was marked publishable without an editorial source review.");
}

if (!/if \(enabled && !editorialApproved && !dryRun\)[\s\S]{0,120}ok: true/.test(socialAutopost)) {
  throw new Error("The intentional editorial approval gate should be a healthy cron skip, not an HTTP 500.");
}

console.log("RepWatchr integrity foundation smoke check passed.");
