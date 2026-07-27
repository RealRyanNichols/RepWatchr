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

function walk(relativeDir, files = []) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return files;

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      walk(relativePath, files);
    } else if (entry.isFile()) {
      files.push(relativePath.replaceAll(path.sep, "/"));
    }
  }

  return files;
}

function routeFromPage(file) {
  const relative = file
    .replace(/^src\/app\/?/, "")
    .replace(/\/page\.tsx$/, "")
    .replace(/^page\.tsx$/, "");
  return relative ? `/${relative}`.replace(/\/+/g, "/") : "/";
}

const ignoredPublicPagePrefixes = [
  "/admin",
  "/api",
  "/auth",
  "/dashboard",
  "/profiles/claim",
  "/services/checkout",
  "/submit-source/thanks",
];
const ignoredPublicPageRoutes = new Set([
  "/buildout",
  "/create-account",
  "/login",
  "/uap",
]);

function isPublicPage(file, source) {
  const route = routeFromPage(file);
  if (ignoredPublicPageRoutes.has(route)) return false;
  if (
    ignoredPublicPagePrefixes.some(
      (prefix) => route === prefix || route.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }
  return !/index\s*:\s*false/.test(source);
}

function hasPageSpecificOgMetadata(source) {
  if (/export\s*\{[^}]*\bmetadata\b[^}]*\}/.test(source)) return true;
  if (
    source.includes("buildRepWatchrMetadata") &&
    source.includes("buildOgImageUrl")
  ) {
    return true;
  }
  return /openGraph\s*:\s*\{[\s\S]*?\bimages\s*:/.test(source);
}

const ogRoutes = walk("src/app/api/og")
  .filter((file) => file.endsWith("/route.tsx") || file === "src/app/api/og/route.tsx")
  .sort();

assert(ogRoutes.length >= 11, `Expected at least 11 OG routes, found ${ogRoutes.length}.`);

for (const route of ogRoutes) {
  assert(exists(route), `Missing OG route: ${route}`);
  const source = read(route);
  assert(source.includes("renderRepWatchrOgImage"), `OG route does not use shared renderer: ${route}`);
  assert(
    /renderRepWatchrOgImage\s*\(\s*\{[\s\S]*?\bheadline\s*(?::|,)/.test(source),
    `OG route does not pass a reader-facing headline: ${route}`,
  );
  assert(
    !/renderRepWatchrOgImage\s*\(\s*\{[\s\S]*?\bheadline\s*:\s*(?:undefined|null|["'`]\s*["'`])/.test(source),
    `OG route passes an empty headline: ${route}`,
  );
  assert(
    /renderRepWatchrOgImage\s*\(\s*\{[\s\S]*?\bsupportLine\s*(?::|,)/.test(source),
    `OG route does not pass a reader-facing support line: ${route}`,
  );
  assert(
    !/renderRepWatchrOgImage\s*\(\s*\{[\s\S]*?\bsupportLine\s*:\s*(?:undefined|null|["'`]\s*["'`])/.test(source),
    `OG route passes an empty support line: ${route}`,
  );
  assert(
    /renderRepWatchrOgImage\s*\(\s*\{[\s\S]*?\bpageType\s*(?::|,)/.test(source),
    `OG route does not identify its page type: ${route}`,
  );
}

const renderer = read("src/lib/repwatchr-og.tsx");
for (const requiredRendererText of [
  "repwatchr-logo.png",
  "REPWATCHR_TAGLINE",
  "pageType",
  "metricLabel",
  "metricValue",
  "jurisdiction",
  "headline: string",
  "supportLine: string",
  "input.headline",
  "input.supportLine",
  "{headline}",
  "{supportLine}",
  "ImageResponse",
  "REPWATCHR_OG_SIZE",
  "_vercel_share",
  "embeddedAssetData",
]) {
  assert(renderer.includes(requiredRendererText), `Shared OG renderer missing ${requiredRendererText}`);
}
const nextConfig = read("next.config.ts");
for (const embeddedAsset of [
  "repwatchr-logo.png",
  "washington-accountability-blue-hour.jpg",
  "marion-county-judge-2026-hero.jpg",
]) {
  assert(
    nextConfig.includes(embeddedAsset),
    `Next output tracing does not include embedded OG asset ${embeddedAsset}`,
  );
}
assert(
  !/\bheadline\s*\?\s*:/.test(renderer),
  "Shared OG renderer headline must remain required.",
);
assert(
  !/\bsupportLine\s*\?\s*:/.test(renderer),
  "Shared OG renderer support line must remain required.",
);

const seo = read("src/lib/repwatchr-seo.ts");
for (const requiredMetadataField of ["openGraph", "twitter", "summary_large_image", "images", "canonical"]) {
  assert(seo.includes(requiredMetadataField), `SEO helper missing ${requiredMetadataField}`);
}

const publicPages = walk("src/app")
  .filter((file) => file.endsWith("/page.tsx") || file === "src/app/page.tsx")
  .map((file) => ({ file, source: read(file) }))
  .filter(({ file, source }) => isPublicPage(file, source));
const pagesWithoutSpecificOg = publicPages
  .filter(({ source }) => !hasPageSpecificOgMetadata(source))
  .map(({ file }) => `${routeFromPage(file)} (${file})`);

assert(
  pagesWithoutSpecificOg.length === 0,
  `Public pages missing page-specific OG metadata:\n${pagesWithoutSpecificOg.join("\n")}`,
);

for (const { file, source } of publicPages) {
  if (!source.includes("buildRepWatchrMetadata")) continue;
  assert(
    source.includes("buildOgImageUrl"),
    `Public page uses metadata helper without a generated OG image URL: ${file}`,
  );
}

assert(read("src/components/shared/RedFlagCard.tsx").includes("?flag="), "Red flag share card must use query URLs for distinct previews.");
assert(read("src/app/layout.tsx").includes("/api/og"), "Root metadata fallback must use generated OG image.");
const robots = read("src/app/robots.ts");
assert(
  /allow\s*:\s*(?:["']\/api\/og\/["']|\[[\s\S]*?["']\/api\/og\/["'][\s\S]*?\])/.test(robots),
  "robots.ts must explicitly allow generated /api/og/ social images.",
);

console.log(
  `og preview smoke checks passed (${ogRoutes.length} routes, ${publicPages.length} public pages)`,
);
