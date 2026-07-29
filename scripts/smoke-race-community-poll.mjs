import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  experience: "src/components/elections/FlagshipRaceExperience.tsx",
  poll: "src/components/elections/RaceCommunityPoll.tsx",
  route: "src/app/api/races/[slug]/poll/route.ts",
  flags: "src/lib/repwatchr-feature-flags.ts",
  admin: "src/lib/race-poll-admin.ts",
  instrumentation: "src/instrumentation-client.ts",
  nextConfig: "next.config.ts",
  schema: "supabase-race-community-poll-v1.sql",
  package: "package.json",
};

const failures = [];

function read(path) {
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath)) {
    failures.push(`missing ${path}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

function requires(source, path, markers) {
  for (const marker of markers) {
    if (!source.includes(marker)) {
      failures.push(`${path} is missing: ${marker}`);
    }
  }
}

const experience = read(files.experience);
const poll = read(files.poll);
const route = read(files.route);
const flags = read(files.flags);
const admin = read(files.admin);
const instrumentation = read(files.instrumentation);
const nextConfig = read(files.nextConfig);
const schema = read(files.schema);
const packageJson = JSON.parse(read(files.package) || "{}");

requires(experience, files.experience, [
  "<RaceCommunityPoll />",
  "heroCandidates",
  "electionStrip",
]);
const matchupStart = experience.indexOf('className={styles.heroMatchup}');
const pollPosition = experience.indexOf("<RaceCommunityPoll />");
const matchupEnd = experience.indexOf("</aside>", matchupStart);
if (
  matchupStart < 0 ||
  pollPosition < matchupStart ||
  pollPosition > matchupEnd
) {
  failures.push("the live poll is not inside the portrait-led hero matchup");
}
if (experience.includes('className={styles.pollSection}')) {
  failures.push("the old below-the-fold duplicate poll section still renders");
}

requires(poll, files.poll, [
  'type="radio"',
  "Record my response",
  "Update my response",
  "Cast your vote",
  "profile-backed",
  "Complete my profile",
  "self-selected community poll",
  "not a scientific survey or official",
  "One current vote per completed profile",
  "setInterval",
  "60_000",
]);
for (const forbidden of [
  "Turnstile",
  "Verified Marion residents",
  "residence-unverified",
  "winner",
]) {
  if (poll.toLowerCase().includes(forbidden.toLowerCase())) {
    failures.push(`${files.poll} contains forbidden wording or dependency: ${forbidden}`);
  }
}

requires(route, files.route, [
  'import { checkBotId } from "botid/server"',
  "isSameOrigin(request)",
  "race_community_polls",
  "race_community_poll_options",
  "race_community_poll_responses",
  "race_community_poll_totals",
  "isPollOpen",
  'onConflict: "poll_id,user_id"',
  '.from("member_profiles")',
  "profileComplete",
  '"Cache-Control", "private, no-store, max-age=0"',
]);
for (const forbidden of [
  "TURNSTILE_SECRET_KEY",
  "verification_status",
  "geography_verified_at",
  '.from("profiles")',
]) {
  if (route.includes(forbidden)) {
    failures.push(`${files.route} still depends on held poll assumptions: ${forbidden}`);
  }
}

requires(schema, files.schema, [
  "create table if not exists public.race_community_polls",
  "create table if not exists public.race_community_poll_options",
  "create table if not exists public.race_community_poll_responses",
  "primary key (poll_id, user_id)",
  "force row level security",
  "from public, anon, authenticated",
  "race_community_poll_totals",
  "'marion-county-judge-2026'",
  "'2026-11-04 02:00:00+00'",
]);
for (const destructivePattern of [
  /\bdrop\s+(table|column|schema|view)\b/i,
  /\btruncate\b/i,
  /\bdelete\s+from\b/i,
  /\balter\s+table\s+public\.profiles\b/i,
  /\bupdate\s+public\.profiles\b/i,
  /\binsert\s+into\s+public\.race_community_poll_responses\b/i,
]) {
  if (destructivePattern.test(schema)) {
    failures.push(
      `${files.schema} contains a forbidden destructive or fake-response statement: ${destructivePattern}`,
    );
  }
}

requires(flags, files.flags, [
  'racePollsV1: process.env.ENABLE_RACE_POLLS_V1 !== "false"',
]);
if (flags.includes("NEXT_PUBLIC_ENABLE_RACE_POLLS_V1")) {
  failures.push("the race poll kill switch must remain server-only");
}
requires(admin, files.admin, ['import "server-only"']);
requires(instrumentation, files.instrumentation, [
  'import { initBotId } from "botid/client/core"',
  'path: "/api/races/*/poll"',
  'method: "POST"',
]);
requires(nextConfig, files.nextConfig, [
  'import { withBotId } from "botid/next/config"',
  "export default withBotId(nextConfig)",
]);
if (!packageJson.dependencies?.botid) {
  failures.push("botid is missing from package dependencies");
}

if (failures.length) {
  console.error("Race community poll smoke failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Race community poll source and schema smoke passed.");
