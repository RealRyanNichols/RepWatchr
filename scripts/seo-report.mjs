import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "src/app");
const inventoryFile = path.join(root, "src/lib/seo-inventory.ts");

const ignoredPrefixes = [
  "/admin",
  "/auth",
  "/dashboard",
  "/api",
  "/services/checkout",
  "/submit-source/thanks",
  "/profiles/claim",
];

const ignoredExact = new Set([
  "/login",
  "/create-account",
  "/buildout",
  "/uap",
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function routeFromPage(file) {
  const relative = path.relative(appDir, file).replaceAll(path.sep, "/");
  const withoutPage = relative.replace(/\/page\.tsx$/, "").replace(/page\.tsx$/, "");
  if (!withoutPage) return "/";
  return `/${withoutPage}`.replace(/\/+/g, "/");
}

function isIgnored(route, source) {
  if (ignoredExact.has(route)) return true;
  if (ignoredPrefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`))) return true;
  return /index:\s*false/.test(source);
}

function lastSlug(route) {
  return route.split("/").filter(Boolean).at(-1) ?? "/";
}

function duplicateCounts(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

const inventorySource = fs.readFileSync(inventoryFile, "utf8");
const inventoryStaticPaths = new Set(
  [...inventorySource.matchAll(/path:\s*"([^"]+)"/g)].map((match) => match[1]),
);
const pageFiles = walk(appDir).filter((file) => file.endsWith("/page.tsx"));
const pages = pageFiles.map((file) => {
  const source = fs.readFileSync(file, "utf8");
  return {
    file: path.relative(root, file),
    route: routeFromPage(file),
    source,
  };
});
const publicPages = pages.filter((page) => !isIgnored(page.route, page.source));
const publicStaticPages = publicPages.filter((page) => !page.route.includes("["));
const hasMetadata = (source) =>
  /(export\s+(async\s+function\s+generateMetadata|const\s+metadata))|export\s*\{\s*metadata/.test(source);
const hasCanonical = (source) => /buildRepWatchrMetadata|canonical:|export\s*\{\s*metadata/.test(source);
const hasOgImage = (source) => /buildRepWatchrMetadata|openGraph:[\s\S]*images|export\s*\{\s*metadata/.test(source);

const missingMetadata = publicPages
  .filter((page) => !hasMetadata(page.source))
  .map((page) => ({ route: page.route, file: page.file }));

const missingCanonical = publicPages
  .filter((page) => !hasCanonical(page.source))
  .map((page) => ({ route: page.route, file: page.file }));

const missingOgImage = publicPages
  .filter((page) => !hasOgImage(page.source))
  .map((page) => ({ route: page.route, file: page.file }));

const orphanPages = publicStaticPages
  .filter((page) => !inventoryStaticPaths.has(page.route))
  .map((page) => ({ route: page.route, file: page.file }));

const duplicateSlugs = duplicateCounts(publicPages.map((page) => lastSlug(page.route)));

const report = {
  generatedAt: new Date().toISOString(),
  note: "This is a local technical SEO route audit. It does not claim Google indexed any URL.",
  appPages: pages.length,
  publicPages: publicPages.length,
  indexedStaticInventoryPaths: inventoryStaticPaths.size,
  missingMetadata,
  missingCanonical,
  missingOgImage,
  duplicateSlugs,
  orphanPages,
};

console.log(JSON.stringify(report, null, 2));
