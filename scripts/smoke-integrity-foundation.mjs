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
const voterMigration = read("supabase/migrations/20260715222729_repwatchr_foundation_v2.sql");
const civicMigration = read("supabase/migrations/20260715230000_canonical_civic_model.sql");
const assuranceMigration = read("supabase/migrations/20260715234500_member_identity_assurance.sql");

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

for (const token of [
  "private.member_assurance",
  "private.identity_verification_attempts",
  "private.identity_duplicate_keys",
  "private.residence_claims",
  "private.identity_review_requests",
  "get_my_assurance_status",
  "repw_sync_profile_assurance",
  "force row level security",
  "grant execute on function private.repw_sync_profile_assurance(uuid) to service_role",
]) {
  if (!assuranceMigration.includes(token)) {
    throw new Error(`Identity-assurance migration is missing: ${token}`);
  }
}

for (const forbiddenColumn of [
  /document_number\s+(text|varchar)/i,
  /date_of_birth\s+(date|text|varchar)/i,
  /street_address\s+(text|varchar)/i,
  /selfie\s+(bytea|text)/i,
]) {
  if (forbiddenColumn.test(assuranceMigration)) {
    throw new Error(`Identity-assurance migration stores prohibited raw evidence: ${forbiddenColumn}`);
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

for (const token of [
  "drop column if exists dl_hash",
  "verification_status = 'needs_review'",
  "repw_stamp_verified_voter",
  "security_invoker = true",
  "grant select, insert, update, delete on table public.site_analytics_events to service_role",
]) {
  if (!voterMigration.includes(token)) {
    throw new Error(`Voter/analytics migration is missing: ${token}`);
  }
}
if (/grant select on table public\.approval_ratings to[^;]*(anon|authenticated)/.test(voterMigration)) {
  throw new Error("Raw community aggregates must stay server-only until privacy thresholds are implemented.");
}

for (const token of [
  "create table public.civic_people",
  "create table public.civic_races",
  "create table public.civic_candidacies",
  "create table public.civic_source_records",
  "create table public.civic_claims",
  "assert_civic_claim_has_support",
  "force row level security",
]) {
  if (!civicMigration.includes(token)) {
    throw new Error(`Canonical civic migration is missing: ${token}`);
  }
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
