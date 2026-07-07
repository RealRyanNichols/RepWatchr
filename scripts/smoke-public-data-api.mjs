import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/PUBLIC_DATA_API_PLAN.md",
  "docs/DATA_EXPORT_POLICY.md",
  "docs/API_SECURITY_MODEL.md",
  "supabase-public-data-api.sql",
  "src/lib/public-data-api-config.ts",
  "src/lib/public-data-api.ts",
  "src/app/api/public/route.ts",
  "src/app/api/public/[...path]/route.ts",
  "src/app/api/public-data-api/request-access/route.ts",
  "src/app/packages/public-data-api/page.tsx",
  "src/app/admin/api/page.tsx",
  "src/app/api/admin/api/route.ts",
  "src/components/public-data-api/PublicDataApiAccessForm.tsx",
  "src/components/public-data-api/AdminPublicDataApiClient.tsx",
];

const requiredSnippets = [
  ["src/lib/public-data-api-config.ts", "RepWatchr public API is not enabled yet. Request access at /packages/public-data-api."],
  ["src/lib/public-data-api.ts", "hashApiKey"],
  ["src/lib/public-data-api.ts", "ENABLE_PUBLIC_API"],
  ["src/app/api/public/route.ts", "PUBLIC_API_DISABLED_MESSAGE"],
  ["src/app/api/public/[...path]/route.ts", "pending_public_data_adapter"],
  ["src/components/public-data-api/PublicDataApiAccessForm.tsx", "no private user data is sold or exposed"],
  ["src/app/api/admin/api/route.ts", "ENABLE_PUBLIC_API must be true before issuing API keys"],
  ["supabase-public-data-api.sql", "alter table public.api_keys enable row level security"],
  ["supabase-public-data-api.sql", "revoke all on table public.api_keys from anon, authenticated"],
  ["docs/DATA_EXPORT_POLICY.md", "Never export"],
];

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

for (const [file, snippet] of requiredSnippets) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8");
  if (!text.toLowerCase().includes(snippet.toLowerCase())) {
    console.error(`Missing required snippet in ${file}: ${snippet}`);
    failed = true;
  }
}

const route = readFileSync("src/app/api/public/route.ts", "utf8");
if (route.includes("status: 500")) {
  console.error("Disabled public API route should not expose a 500 fallback.");
  failed = true;
}

if (failed) process.exit(1);
console.log("Public data API foundation smoke check passed.");
