import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(file) {
  return readFileSync(join(root, file), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredFiles = [
  "docs/REFERRAL_SHARE_CAMPAIGN_SYSTEM.md",
  "docs/SAFE_SHARE_COPY_GUIDE.md",
  "supabase-referral-share-campaigns.sql",
  "src/lib/referral-share-campaigns.ts",
  "src/lib/referral-client.ts",
  "src/app/api/referrals/code/route.ts",
  "src/app/api/referrals/event/route.ts",
  "src/app/api/admin/share-campaigns/route.ts",
  "src/app/admin/share-campaigns/page.tsx",
  "src/components/referrals/ReferralAttributionTracker.tsx",
  "src/components/referrals/ReferralLinkButton.tsx",
  "src/components/referrals/SafeShareTextGenerator.tsx",
  "src/components/referrals/SharePromptModal.tsx",
  "src/components/referrals/ShareCampaignCard.tsx",
  "src/components/referrals/ReferralStatsPanel.tsx",
  "src/components/referrals/AdminShareCampaignManager.tsx",
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing referral/share file: ${file}`);
}

const sql = read("supabase-referral-share-campaigns.sql");
for (const table of ["referral_codes", "referral_events", "share_campaigns", "share_assets"]) {
  assert(sql.includes(`create table if not exists public.${table}`), `Missing SQL table ${table}`);
  assert(sql.includes(`alter table public.${table} enable row level security`), `Missing RLS for ${table}`);
  assert(sql.includes(`revoke all on public.${table} from anon, authenticated`), `Missing explicit revoke for ${table}`);
}

for (const campaignType of [
  "source_gap",
  "profile_watch",
  "race_watch",
  "county_hub",
  "school_board",
  "public_question",
  "free_packet",
  "records_request",
  "package_interest",
  "contributor_badge",
]) {
  assert(sql.includes(campaignType), `Missing campaign type in SQL: ${campaignType}`);
}

assert(sql.includes("private.is_repw_admin"), "SQL includes admin helper.");
assert(sql.includes("to anon, authenticated"), "SQL explicitly supports public insert/select policies where intended.");
assert(sql.includes("on conflict (key) do nothing"), "SQL seeds default campaigns idempotently.");

const referralLib = read("src/lib/referral-share-campaigns.ts");
for (const exported of [
  "makeReferralCode",
  "buildReferralUrl",
  "generateSafeShareText",
  "findUnsafeShareCopy",
  "safeSharePrimaryPrompt",
  "safeShareSecondaryPrompt",
]) {
  assert(referralLib.includes(`export function ${exported}`), `Missing referral utility export ${exported}`);
}

for (const templateKind of ["source_gap", "profile", "public_question", "race", "packet", "correction"]) {
  assert(referralLib.includes(templateKind), `Missing safe share template ${templateKind}`);
}

const templateBlock = referralLib.slice(referralLib.indexOf("const templates"), referralLib.indexOf("return templates"));
for (const unsafeTerm of ["destroy", "expose them", "take them down", "go after", "harass", "guilty", "criminal"]) {
  assert(!templateBlock.toLowerCase().includes(unsafeTerm), `Generated safe templates include unsafe term: ${unsafeTerm}`);
}

const codeRoute = read("src/app/api/referrals/code/route.ts");
assert(codeRoute.includes("getSupabaseAdminClient"), "Referral code API persists through admin client when available.");
assert(codeRoute.includes("persisted"), "Referral code API returns persistence state without exposing setup details.");
assert(!codeRoute.includes("not configured"), "Referral code API does not expose setup language publicly.");

const eventRoute = read("src/app/api/referrals/event/route.ts");
assert(eventRoute.includes("normalizeReferralEventType"), "Referral event API validates event type.");
assert(eventRoute.includes("safeMetadata"), "Referral event API sanitizes metadata.");
assert(eventRoute.includes("referral_events"), "Referral event API writes referral events.");

const adminRoute = read("src/app/api/admin/share-campaigns/route.ts");
assert(adminRoute.includes("getAdminUserForServer"), "Admin share campaign API is server-side admin protected.");
assert(adminRoute.includes("validateSafeCopy"), "Admin API validates unsafe campaign copy.");
assert(adminRoute.includes("admin_audit_log"), "Admin API writes audit log when available.");

const adminPage = read("src/app/admin/share-campaigns/page.tsx");
assert(adminPage.includes("robots: { index: false, follow: false }"), "Admin share campaign page is noindex.");
assert(adminPage.includes("requireAdminPageAccess"), "Admin share campaign page is server-side protected.");

const shareButtons = read("src/components/shared/ShareButtons.tsx");
assert(shareButtons.includes("ReferralLinkButton"), "Shared ShareButtons includes referral link button.");

const layout = read("src/app/layout.tsx");
assert(layout.includes("ReferralAttributionTracker"), "Root layout tracks referral attribution.");

const thanks = read("src/components/source-submissions/SourceSubmissionThanksClient.tsx");
assert(thanks.includes("SharePromptModal"), "Source submission thank-you page includes share prompt.");
assert(thanks.includes("referral_source_submission"), "Source submission thank-you tracks referral conversion.");

const freePacket = read("src/components/free-packet/FreePacketFunnel.tsx");
assert(freePacket.includes("SharePromptModal"), "Free packet completion includes share prompt.");
assert(freePacket.includes("referral_packet_created"), "Free packet completion tracks referral conversion.");

const clientAnalytics = read("src/lib/client-analytics.ts");
const serverAnalytics = read("src/app/api/analytics/event/route.ts");
for (const eventName of [
  "referral_link_created",
  "referral_link_copied",
  "referral_visit",
  "referral_signup",
  "referral_source_submission",
  "referral_packet_created",
  "share_campaign_viewed",
  "share_campaign_clicked",
  "safe_share_text_copied",
]) {
  assert(clientAnalytics.includes(eventName), `Client analytics allows ${eventName}`);
  assert(serverAnalytics.includes(eventName), `Server analytics allows ${eventName}`);
}

const referralFiles = [
  referralLib,
  read("src/lib/referral-client.ts"),
  read("src/components/referrals/ReferralLinkButton.tsx"),
  read("src/components/referrals/SharePromptModal.tsx"),
  adminRoute,
].join("\n");

for (const forbidden of ["sendEmail(", "sendSms", "sendMessage", "postToFacebook", "postToX", "autoPost", "massInvite"]) {
  assert(!referralFiles.includes(forbidden), `Referral/share system must not include outbound automation: ${forbidden}`);
}

const docs = `${read("docs/REFERRAL_SHARE_CAMPAIGN_SYSTEM.md")}\n${read("docs/SAFE_SHARE_COPY_GUIDE.md")}`;
assert(docs.includes("does not auto-contact anyone"), "Docs state no auto-contact boundary.");
assert(docs.includes("No Spam Boundary"), "Docs include no-spam boundary.");
assert(docs.includes("Help attach the receipt."), "Docs include primary share prompt.");

console.log("Referral/share campaign smoke check passed.");
