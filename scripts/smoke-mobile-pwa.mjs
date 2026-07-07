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
  "docs/MOBILE_PWA_SYSTEM.md",
  "docs/MOBILE_UX_RULES.md",
  "src/app/manifest.ts",
  "src/app/layout.tsx",
  "src/app/offline/page.tsx",
  "src/components/mobile/MobileAppShell.tsx",
  "src/components/mobile/OfflinePageTracker.tsx",
  "public/sw.js",
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing mobile PWA file: ${file}`);
}

const manifest = read("src/app/manifest.ts");
for (const phrase of [
  'name: "RepWatchr"',
  'short_name: "RepWatchr"',
  "Public-record accountability profiles for officials, agencies, boards, and public power.",
  'start_url: "/"',
  'display: "standalone"',
  'background_color: "#06172f"',
  'theme_color: "#06172f"',
  "share_target",
  'action: "/submit-source"',
  "shortcuts",
]) {
  assert(manifest.includes(phrase), `Manifest includes ${phrase}`);
}

const layout = read("src/app/layout.tsx");
assert(layout.includes("MobileAppShell"), "Root layout includes MobileAppShell.");
assert(layout.includes("viewportFit"), "Root layout exports viewport fit metadata.");
assert(layout.includes("appleWebApp"), "Root layout includes apple web app metadata.");

const shell = read("src/components/mobile/MobileAppShell.tsx");
for (const phrase of [
  "serviceWorker.register",
  "beforeinstallprompt",
  "navigator.share",
  "navigator.clipboard",
  "mobile_action_dock_clicked",
  "pwa_install_prompt_shown",
  "pwa_install_prompt_clicked",
  "pwa_install_prompt_dismissed",
  "pwa_installed",
  "public_question_copied",
  "detectVariant",
  "DockVariant",
  'variant === "home"',
]) {
  assert(shell.includes(phrase), `Mobile shell includes ${phrase}`);
}

for (const label of [
  "Search",
  "Watch",
  "Source",
  "Packet",
  "Dashboard",
  "Share",
  "Question",
  "Compare",
  "Review",
  "Settings",
]) {
  assert(shell.includes(label), `Mobile dock includes ${label}`);
}

const sw = read("public/sw.js");
for (const excluded of [
  'path.startsWith("/api")',
  'path.startsWith("/admin")',
  'path.startsWith("/dashboard")',
  'path.startsWith("/auth")',
  'path.startsWith("/submit-source")',
  'path.startsWith("/tools/public-records-response")',
  'path.startsWith("/services/checkout")',
]) {
  assert(sw.includes(excluded), `Service worker excludes ${excluded}`);
}
assert(sw.includes("caches.match(\"/offline\")"), "Service worker has offline fallback.");
assert(!sw.includes("cache.addAll([\"/\"]"), "Service worker does not precache homepage HTML.");

const offline = read("src/app/offline/page.tsx");
assert(offline.includes("robots: { index: false, follow: false }"), "Offline page is noindex.");
assert(offline.includes("Live public records need a connection"), "Offline page explains live connection requirement.");

const css = read("src/app/globals.css");
for (const className of [
  ".rw-mobile-action-dock",
  ".rw-mobile-dock-button",
  ".rw-mobile-more-panel",
  ".rw-pwa-install-card",
  "env(safe-area-inset-bottom)",
  "prefers-reduced-motion",
]) {
  assert(css.includes(className), `CSS includes ${className}`);
}

const clientAnalytics = read("src/lib/client-analytics.ts");
const serverAnalytics = read("src/app/api/analytics/event/route.ts");
for (const eventName of [
  "mobile_action_dock_clicked",
  "pwa_install_prompt_shown",
  "pwa_install_prompt_clicked",
  "pwa_install_prompt_dismissed",
  "pwa_installed",
  "native_share_clicked",
  "offline_page_viewed",
]) {
  assert(clientAnalytics.includes(eventName), `Client analytics allows ${eventName}`);
  assert(serverAnalytics.includes(eventName), `Server analytics allows ${eventName}`);
}

const docs = `${read("docs/MOBILE_PWA_SYSTEM.md")}\n${read("docs/MOBILE_UX_RULES.md")}`;
assert(docs.includes("No private watchlist, dashboard, admin, submission, checkout, or auth response is cached."), "Docs state private data is not cached.");
assert(docs.includes("No horizontal scroll."), "Docs include mobile no-horizontal-scroll rule.");

console.log("Mobile PWA smoke check passed.");
