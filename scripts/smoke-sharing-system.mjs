import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const shareLib = read("src/lib/share-snippets.ts");
const shareComponent = read("src/components/shared/ShareButtons.tsx");
const shareRoute = read("src/app/api/analytics/share/route.ts");
const adminMigration = read("supabase-admin-dashboard.sql");
const globals = read("src/app/globals.css");

for (const template of [
  "confirmed_record",
  "public_question",
  "missing_source",
  "correction_needed",
  "funding_trail",
  "vote_record",
  "meeting_clip",
  "red_flag",
]) {
  assert(shareLib.includes(template), `Share template missing: ${template}`);
}

for (const eventName of [
  "share_copy_clicked",
  "native_share_clicked",
  "social_share_clicked",
  "source_snippet_copied",
  "profile_watch_clicked",
]) {
  assert(shareComponent.includes(eventName), `Share component missing event: ${eventName}`);
  assert(shareRoute.includes(eventName), `Share analytics route missing event: ${eventName}`);
}

for (const requiredText of [
  "Copy link",
  "Copy snippet",
  "Native share",
  "Facebook",
  "LinkedIn",
  "Before the meeting",
  "Ask this public question",
  "Submit a better source",
  "Watch this record",
]) {
  assert(shareComponent.includes(requiredText), `Share card missing UI text: ${requiredText}`);
}

for (const channel of ["linkedin", "native", "snippet", "talking_point", "public_question", "watch_record"]) {
  assert(shareRoute.includes(channel), `Share route missing channel: ${channel}`);
  assert(adminMigration.includes(channel), `Admin migration missing channel: ${channel}`);
}

for (const cssClass of ["share-action-button", "share-mini-button", "share-social-link", "share-primary-link"]) {
  assert(globals.includes(cssClass), `Missing share CSS class: ${cssClass}`);
}

const coverageFiles = [
  "src/app/officials/[id]/page.tsx",
  "src/components/shared/RedFlagCard.tsx",
  "src/app/news/[id]/page.tsx",
  "src/app/news/page.tsx",
  "src/app/elections/page.tsx",
  "src/app/elections/texas/page.tsx",
  "src/app/elections/texas/[raceSlug]/page.tsx",
  "src/app/school-boards/page.tsx",
  "src/app/school-boards/[districtSlug]/page.tsx",
  "src/app/school-boards/[districtSlug]/[candidateId]/page.tsx",
  "src/app/funding/page.tsx",
  "src/app/funding/[officialId]/page.tsx",
  "src/app/daily-wire/page.tsx",
  "src/app/votes/page.tsx",
  "src/app/votes/[billId]/page.tsx",
  "src/app/feedback/page.tsx",
  "src/components/source-submissions/SourceSubmissionThanksClient.tsx",
  "src/app/attorneys/[slug]/page.tsx",
  "src/app/media/[slug]/page.tsx",
  "src/app/public-safety/[slug]/page.tsx",
  "src/app/east-texas-predator-watch/[slug]/page.tsx",
];

for (const file of coverageFiles) {
  assert(read(file).includes("ShareButtons"), `Sharing system is not mounted in ${file}`);
}

console.log("sharing system smoke checks passed");
