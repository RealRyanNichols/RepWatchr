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
  "docs/DIGEST_NOTIFICATION_SYSTEM.md",
  "docs/EMAIL_PROVIDER_SETUP.md",
  "supabase-digest-notification-system.sql",
  "src/lib/digest-notifications.ts",
  "src/app/api/notifications/preferences/route.ts",
  "src/app/api/notifications/digest-preview/route.ts",
  "src/app/api/notifications/digest-queue/route.ts",
  "src/app/dashboard/notifications/page.tsx",
  "src/app/unsubscribe/page.tsx",
  "src/components/notifications/DigestPreferencesPanel.tsx",
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing digest notification file: ${file}`);
}

const sql = read("supabase-digest-notification-system.sql");
for (const table of ["notification_preferences", "digest_queue", "digest_items", "notification_events"]) {
  assert(sql.includes(`create table if not exists public.${table}`), `Missing SQL table ${table}`);
  assert(sql.includes(`alter table public.${table} enable row level security`), `Missing RLS for ${table}`);
  assert(sql.includes(`revoke all on public.${table} from anon, authenticated`), `Missing explicit revoke for ${table}`);
}

assert(sql.includes("private.is_repw_admin"), "Admin RLS helper exists.");
assert(sql.includes("to authenticated"), "Policies use explicit authenticated role.");
assert(!sql.includes("grant select") || !sql.includes(" to anon"), "Digest tables do not grant anon read access.");

const lib = read("src/lib/digest-notifications.ts");
for (const exported of ["generateDigestPreview", "renderDigestEmail", "sendEmail", "sendDigest"]) {
  assert(lib.includes(`export ${exported}`) || lib.includes(`export async function ${exported}`) || lib.includes(`export function ${exported}`), `Missing export ${exported}`);
}

for (const gate of ["ENABLE_EMAIL_SENDING", "EMAIL_PROVIDER", "RESEND_API_KEY", "SENDGRID_API_KEY", "POSTMARK_API_KEY", "FROM_EMAIL"]) {
  assert(lib.includes(gate), `Missing email config gate ${gate}`);
}

assert(lib.includes("email_consent_at"), "sendDigest checks consent.");
assert(lib.includes("unsubscribed_at"), "sendDigest checks unsubscribe state.");
assert(lib.includes("return { ok: true, sent: false, disabled: true"), "sendEmail has clean disabled return.");
assert(!lib.includes("NEXT_PUBLIC_RESEND_API_KEY"), "Resend key is not public.");
assert(!lib.includes("NEXT_PUBLIC_SENDGRID_API_KEY"), "SendGrid key is not public.");
assert(!lib.includes("NEXT_PUBLIC_POSTMARK_API_KEY"), "Postmark key is not public.");

const queueApi = read("src/app/api/notifications/digest-queue/route.ts");
assert(queueApi.includes("isEmailSendingEnabled()"), "Queue API checks email sending flag.");
assert(queueApi.includes("email_consent_at"), "Queue API checks consent before pending status.");
assert(queueApi.includes("unsubscribed_at"), "Queue API checks unsubscribe before pending status.");
assert(queueApi.includes("sending_disabled"), "Queue API supports disabled preview queue rows.");
assert(!queueApi.includes("sendDigest("), "Queue API does not send email directly.");

const preferencesApi = read("src/app/api/notifications/preferences/route.ts");
assert(preferencesApi.includes("email_consent"), "Preferences API accepts consent field.");
assert(preferencesApi.includes("unsubscribe"), "Preferences API supports unsubscribe.");
assert(preferencesApi.includes("digest_preference_changed"), "Preferences API logs preference changes.");

const panel = read("src/components/notifications/DigestPreferencesPanel.tsx");
for (const label of [
  "Weekly digest",
  "Daily digest",
  "Breaking alerts",
  "Watched official updates",
  "Watched race updates",
  "Watched jurisdiction updates",
  "Source review updates",
  "Contribution updates",
  "Records request updates",
  "Package updates",
  "Unsubscribe",
]) {
  assert(panel.includes(label), `Digest preferences UI includes ${label}`);
}
assert(panel.includes("/api/notifications/digest-preview"), "Panel can refresh preview.");
assert(panel.includes("/api/notifications/digest-queue"), "Panel can save queue row.");
assert(panel.includes("Email was not sent"), "Panel explains queue save does not send.");

const dashboardPage = read("src/app/dashboard/notifications/page.tsx");
assert(dashboardPage.includes("robots: { index: false, follow: false }"), "Dashboard notifications page is noindex.");
assert(dashboardPage.includes("ensureNotificationPreferences"), "Dashboard ensures preferences.");
assert(dashboardPage.includes("generateDigestPreview"), "Dashboard generates preview.");

const unsubscribePage = read("src/app/unsubscribe/page.tsx");
assert(unsubscribePage.includes("robots: { index: false, follow: false }"), "Unsubscribe route is noindex.");
assert(unsubscribePage.includes("token"), "Unsubscribe route documents token behavior.");

const clientAnalytics = read("src/lib/client-analytics.ts");
const serverAnalytics = read("src/app/api/analytics/event/route.ts");
for (const eventName of [
  "digest_preferences_open",
  "digest_preference_changed",
  "digest_preview_generated",
  "digest_queue_created",
  "digest_email_sent",
  "digest_email_failed",
  "digest_unsubscribe_clicked",
  "digest_item_clicked",
]) {
  assert(clientAnalytics.includes(eventName), `Client analytics allows ${eventName}`);
  assert(serverAnalytics.includes(eventName), `Server analytics allows ${eventName}`);
}

const docs = `${read("docs/DIGEST_NOTIFICATION_SYSTEM.md")}\n${read("docs/EMAIL_PROVIDER_SETUP.md")}`;
assert(docs.includes("No emails are sent unless"), "Docs explain no-send default.");
assert(docs.includes("ENABLE_EMAIL_SENDING=false"), "Docs include disabled default.");
assert(docs.includes("Do not expose provider keys"), "Docs warn against public provider keys.");

console.log("Digest notification smoke check passed.");
