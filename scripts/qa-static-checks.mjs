import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const requiredFiles = [
  "docs/QA_MONITORING_SYSTEM.md",
  "docs/ROUTE_SMOKE_TESTS.md",
  "docs/ERROR_TRACKING_PLAN.md",
  "docs/DEPLOYMENT_CHECKLIST.md",
  "docs/ENVIRONMENT_VARIABLES.md",
  "supabase-qa-monitoring.sql",
  "src/lib/qa-monitoring.ts",
  "src/app/admin/quality/page.tsx",
  "src/app/api/admin/quality/route.ts",
  "src/app/api/quality/error/route.ts",
  "src/components/quality/AdminQualityDashboardClient.tsx",
  "src/app/error.tsx",
  "src/app/not-found.tsx",
  "scripts/qa-route-smoke.mjs",
  "scripts/smoke-source-submissions.mjs",
  "scripts/smoke-pricing-beta-access.mjs",
  "scripts/smoke-seo-indexing.mjs",
  "scripts/smoke-og-previews.mjs",
  "scripts/smoke-mobile-pwa.mjs",
];

const requiredSnippets = [
  ["src/lib/qa-monitoring.ts", "validateEnvironment"],
  ["src/lib/qa-monitoring.ts", "logAppError"],
  ["src/lib/qa-monitoring.ts", "getRouteSmokeTargets"],
  ["src/lib/qa-monitoring.ts", "/tools/source-packet-builder"],
  ["src/lib/qa-monitoring.ts", "/packages/quick-record-check"],
  ["src/lib/qa-monitoring.ts", "/packages/election-watch-desk"],
  ["src/lib/qa-monitoring.ts", "/elections/texas/texas-us-senate-2026"],
  ["src/lib/qa-monitoring.ts", "/news/health-care-costs-midterms-2026"],
  ["src/lib/qa-monitoring.ts", "/jurisdictions/texas"],
  ["src/app/api/quality/error/route.ts", "logAppError"],
  ["src/app/admin/quality/page.tsx", "requireAdminPageAccess"],
  ["src/components/quality/AdminQualityDashboardClient.tsx", "quality_dashboard_open"],
  ["src/components/quality/AdminQualityDashboardClient.tsx", "smoke_tests_run"],
  ["src/app/error.tsx", "/api/quality/error"],
  ["src/app/api/source-submissions/route.ts", "validateSourceSubmission"],
  ["src/lib/source-submissions.ts", "cleanEmail"],
  ["src/lib/source-submissions.ts", "cleanUrl"],
  ["src/components/shared/ReportButton.tsx", "profile_correction"],
  ["src/app/api/beta-access/request/route.ts", "validateBetaAccessInput"],
  ["src/app/api/services/request/route.ts", "cleanUrl"],
  ["scripts/smoke-source-submissions.mjs", "Source API missing POST handler"],
  ["scripts/smoke-pricing-beta-access.mjs", "package_interest_submitted"],
  ["scripts/smoke-seo-indexing.mjs", "robots.ts does not disallow"],
  ["scripts/smoke-og-previews.mjs", "src/app/api/og"],
  ["scripts/smoke-mobile-pwa.mjs", "mobile_action_dock_clicked"],
  ["src/lib/client-analytics.ts", "quality_dashboard_open"],
  ["src/lib/client-analytics.ts", "deploy_checklist_open"],
  ["src/app/api/analytics/event/route.ts", "app_error_logged"],
  ["supabase-qa-monitoring.sql", "alter table public.app_error_logs enable row level security"],
  ["supabase-qa-monitoring.sql", "revoke all on table public.app_error_logs from anon"],
  ["docs/ROUTE_SMOKE_TESTS.md", "Known Route Gaps"],
  ["docs/ERROR_TRACKING_PLAN.md", "Do Not Store"],
  ["docs/ENVIRONMENT_VARIABLES.md", "NEXT_PUBLIC_"],
  ["package.json", "\"qa:static\""],
  ["package.json", "\"qa:routes\""],
];

const forbiddenPublicText = [
  "Stripe link not configured yet",
  "SUPABASE_SERVICE_ROLE_KEY=",
  "STRIPE_SECRET_KEY=",
  "OPENAI_API_KEY=",
];

const scanRoots = ["src"];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (["node_modules", ".next"].includes(entry)) continue;
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

for (const [file, snippet] of requiredSnippets) {
  if (!existsSync(file)) {
    failed = true;
    continue;
  }
  const text = readFileSync(file, "utf8");
  if (!text.includes(snippet)) {
    console.error(`Missing required snippet in ${file}: ${snippet}`);
    failed = true;
  }
}

for (const root of scanRoots) {
  if (!existsSync(root)) continue;
  for (const file of walk(root)) {
    const ext = path.extname(file);
    if (![".ts", ".tsx", ".md"].includes(ext)) continue;
    const text = readFileSync(file, "utf8");
    for (const forbidden of forbiddenPublicText) {
      if (text.includes(forbidden)) {
        console.error(`Forbidden public/setup text found in ${file}: ${forbidden}`);
        failed = true;
      }
    }
  }
}

if (failed) process.exit(1);
console.log("RepWatchr QA static checks passed.");
