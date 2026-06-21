import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const route of [
  "src/app/api/og/route.tsx",
  "src/app/api/og/home/route.tsx",
  "src/app/api/og/official/route.tsx",
  "src/app/api/og/school-board/route.tsx",
  "src/app/api/og/race/route.tsx",
  "src/app/api/og/red-flag/route.tsx",
  "src/app/api/og/funding/route.tsx",
  "src/app/api/og/news/route.tsx",
  "src/app/api/og/source-packet/route.tsx",
  "src/app/api/og/methodology/route.tsx",
  "src/app/api/og/services/route.tsx",
]) {
  assert(exists(route), `Missing OG route: ${route}`);
  assert(read(route).includes("renderRepWatchrOgImage"), `OG route does not use shared renderer: ${route}`);
}

const renderer = read("src/lib/repwatchr-og.tsx");
for (const requiredRendererText of [
  "repwatchr-logo-america-first.png",
  "REPWATCHR_TAGLINE",
  "pageType",
  "metricLabel",
  "metricValue",
  "jurisdiction",
]) {
  assert(renderer.includes(requiredRendererText), `Shared OG renderer missing ${requiredRendererText}`);
}

const seo = read("src/lib/repwatchr-seo.ts");
for (const requiredMetadataField of ["openGraph", "twitter", "summary_large_image", "images", "canonical"]) {
  assert(seo.includes(requiredMetadataField), `SEO helper missing ${requiredMetadataField}`);
}

for (const page of [
  "src/app/page.tsx",
  "src/app/officials/[id]/page.tsx",
  "src/app/school-boards/page.tsx",
  "src/app/school-boards/[districtSlug]/page.tsx",
  "src/app/school-boards/[districtSlug]/[candidateId]/page.tsx",
  "src/app/elections/texas/[raceSlug]/page.tsx",
  "src/app/red-flags/page.tsx",
  "src/app/funding/page.tsx",
  "src/app/funding/[officialId]/page.tsx",
  "src/app/news/[id]/page.tsx",
  "src/app/news/page.tsx",
  "src/app/feedback/page.tsx",
  "src/app/submit-source/thanks/page.tsx",
  "src/app/methodology/page.tsx",
  "src/app/services/page.tsx",
  "src/app/services/[slug]/page.tsx",
]) {
  const content = read(page);
  assert(content.includes("buildRepWatchrMetadata"), `Page missing metadata helper: ${page}`);
  assert(content.includes("buildOgImageUrl"), `Page missing generated OG image URL: ${page}`);
}

assert(read("src/components/shared/RedFlagCard.tsx").includes("?flag="), "Red flag share card must use query URLs for distinct previews.");
assert(read("src/app/layout.tsx").includes("/api/og"), "Root metadata fallback must use generated OG image.");

console.log("og preview smoke checks passed");
