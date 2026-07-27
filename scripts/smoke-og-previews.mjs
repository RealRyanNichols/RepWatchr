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
    `OG route passes an empty support line: ${rm«ëŒ+Š×ž®º+º$zzb¥