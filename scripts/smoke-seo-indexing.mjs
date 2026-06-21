import fs from "node:fs";

const requiredFiles = [
  "src/app/sitemap.xml/route.ts",
  "src/app/sitemaps/static.xml/route.ts",
  "src/app/sitemaps/officials.xml/route.ts",
  "src/app/sitemaps/school-boards.xml/route.ts",
  "src/app/sitemaps/races.xml/route.ts",
  "src/app/sitemaps/stories.xml/route.ts",
  "src/app/sitemaps/red-flags-funding.xml/route.ts",
  "src/app/image-sitemap.xml/route.ts",
  "src/app/news-sitemap.xml/route.ts",
  "src/app/seo-report/route.ts",
  "src/lib/seo-inventory.ts",
  "src/lib/sitemap-xml.ts",
  "src/lib/structured-data.ts",
  "src/app/admin/layout.tsx",
  "src/app/dashboard/layout.tsx",
  "src/app/auth/layout.tsx",
  "scripts/seo-report.mjs",
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing required SEO file: ${file}`);
}

const robots = fs.readFileSync("src/app/robots.ts", "utf8");
for (const sitemap of ["/sitemap.xml", "/news-sitemap.xml", "/image-sitemap.xml"]) {
  if (!robots.includes(sitemap)) failures.push(`robots.ts does not reference ${sitemap}`);
}
for (const blocked of ["/admin/", "/auth/", "/dashboard/", "/api/", "/seo-report"]) {
  if (!robots.includes(blocked)) failures.push(`robots.ts does not disallow ${blocked}`);
}

for (const privateLayout of ["src/app/admin/layout.tsx", "src/app/dashboard/layout.tsx", "src/app/auth/layout.tsx"]) {
  const source = fs.readFileSync(privateLayout, "utf8");
  if (!source.includes("index: false") || !source.includes("follow: false")) {
    failures.push(`${privateLayout} is missing noindex/nofollow metadata`);
  }
}

const seo = fs.readFileSync("src/lib/repwatchr-seo.ts", "utf8");
if (!seo.includes('REPWATCHR_ORIGIN = "https://www.repwatchr.com"')) {
  failures.push("RepWatchr canonical origin is not pinned to the public domain");
}

const reportRoute = fs.readFileSync("src/app/seo-report/route.ts", "utf8");
if (!reportRoute.includes("x-robots-tag") || !reportRoute.includes("noindex")) {
  failures.push("/seo-report route is missing X-Robots-Tag noindex");
}

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (packageJson.scripts["seo:report"] !== "node scripts/seo-report.mjs") {
  failures.push("package.json is missing seo:report script");
}
if (packageJson.scripts["smoke:seo"] !== "node scripts/smoke-seo-indexing.mjs") {
  failures.push("package.json is missing smoke:seo script");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("SEO indexing smoke checks passed.");
