import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const componentPath = "src/components/elections/FlagshipRaceExperience.tsx";
const routePath = "src/app/elections/texas/[raceSlug]/page.tsx";
const candidateDataPath = "src/data/election-candidates.ts";
const candidateRoutePath = "src/app/candidates/[candidateSlug]/page.tsx";
const candidateOgPath = "src/app/api/og/candidate/route.tsx";
const ogRendererPath = "src/lib/repwatchr-og.tsx";
const verifiedBriefPath = "src/data/official-verified-briefs.ts";
const officialRoutePath = "src/app/officials/[id]/page.tsx";
const seoInventoryPath = "src/lib/seo-inventory.ts";
const raceSlug = "marion-county-judge-2026";

const portraits = [
  {
    label: "Dina K. Carroll",
    publicPath: `/images/races/${raceSlug}/dina-carroll-portrait.jpg`,
  },
  {
    label: "Leward J. LaFleur II",
    publicPath: `/images/races/${raceSlug}/leward-lafleur-portrait.jpg`,
  },
];

const forbiddenPlaceholderMarkers = [
  "High-resolution photo release requested",
  "Portrait authorization pending",
  "Two different claims on county leadership",
  'initials="LC"',
  'initials="LL"',
];

function fail(message) {
  console.error(`Marion County race release smoke failed: ${message}`);
  process.exitCode = 1;
}

function readSource(path) {
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath)) {
    fail(`missing source file ${path}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

function assertJpeg(path, label) {
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath)) {
    fail(`${label} portrait file is missing at ${path}`);
    return;
  }

  const stat = statSync(absolutePath);
  if (!stat.isFile() || stat.size < 1_024) {
    fail(`${label} portrait at ${path} is not a usable image file`);
    return;
  }

  const header = readFileSync(absolutePath).subarray(0, 3);
  if (header[0] !== 0xff || header[1] !== 0xd8 || header[2] !== 0xff) {
    fail(`${label} portrait at ${path} is not a JPEG`);
  }
}

const component = readSource(componentPath);
const route = readSource(routePath);
const candidateData = readSource(candidateDataPath);
const candidateRoute = readSource(candidateRoutePath);
const candidateOg = readSource(candidateOgPath);
const ogRenderer = readSource(ogRendererPath);
const verifiedBrief = readSource(verifiedBriefPath);
const officialRoute = readSource(officialRoutePath);
const seoInventory = readSource(seoInventoryPath);

for (const portrait of portraits) {
  const filePath = `public${portrait.publicPath}`;
  assertJpeg(filePath, portrait.label);

  if (!component.includes(`src="${portrait.publicPath}"`)) {
    fail(`${portrait.label} portrait path is not rendered by ${componentPath}`);
  }
}

for (const marker of [
  "Highest verified public image",
  "Dina K. Carroll",
  "Leward J. LaFleur II",
  'href="/candidates/dina-k-carroll"',
  'href="/officials/leward-j-lafleur-ii"',
  "Announced write-in · qualification pending",
  "selected as chair in 2023",
  "current official roster for a reported East Texas water-advisory role was not located",
  "<RaceCommunityPoll />",
]) {
  if (!component.includes(marker)) {
    fail(`required dossier marker is missing: ${marker}`);
  }
}

const heroMatchupStart = component.indexOf('className={styles.heroMatchup}');
const pollPosition = component.indexOf("<RaceCommunityPoll />");
const heroMatchupEnd = component.indexOf("</aside>", heroMatchupStart);
if (
  heroMatchupStart < 0 ||
  pollPosition < heroMatchupStart ||
  pollPosition > heroMatchupEnd
) {
  fail("the community pulse is not rendered inside the portrait-led hero matchup");
}

for (const unsupportedCurrentRole of [
  "chair since 2023",
  "Chairs the East Texas Water Advisory Board",
]) {
  if (component.toLowerCase().includes(unsupportedCurrentRole.toLowerCase())) {
    fail(`unsupported present-tense role remains: ${unsupportedCurrentRole}`);
  }
}

for (const marker of forbiddenPlaceholderMarkers) {
  if (component.toLowerCase().includes(marker.toLowerCase())) {
    fail(`legacy placeholder marker remains in ${componentPath}: ${marker}`);
  }
}

if (
  !route.includes(`raceSlug === "${raceSlug}"`) ||
  !route.includes("<FlagshipRaceExperience")
) {
  fail(`the ${raceSlug} route is not wired to FlagshipRaceExperience`);
}

for (const marker of [
  'slug: "dina-k-carroll"',
  "announced write-in candidate; ballot-counting eligibility pending official filing confirmation",
  `/images/races/${raceSlug}/dina-carroll-portrait.jpg`,
  "campaignClaims",
  "independentRecord",
  "evidenceGaps",
]) {
  if (!candidateData.includes(marker)) {
    fail(`standalone candidate data is missing: ${marker}`);
  }
}

for (const marker of [
  "generateStaticParams",
  "dynamicParams = false",
  "buildRepWatchrMetadata",
  "ProfilePage",
  "Performance grade",
  "Not rated",
  "Evidence voters still need",
  "Correction & response",
  "August 17, 2026",
]) {
  if (!candidateRoute.includes(marker)) {
    fail(`standalone candidate route is missing: ${marker}`);
  }
}

for (const portrait of portraits) {
  if (!ogRenderer.includes(portrait.publicPath)) {
    fail(`${portrait.label} portrait is not embedded for protected OG rendering`);
  }
}

for (const marker of [
  "Dina Carroll: open the write-in file",
  "portraitImage: candidate.portrait.src",
  "renderRepWatchrOgImage",
]) {
  if (!candidateOg.includes(marker)) {
    fail(`candidate OG route is missing: ${marker}`);
  }
}

for (const marker of [
  '"leward-j-lafleur-ii"',
  "1,079 votes",
  "reported-allegations",
  "LaFleur and his attorney denied the allegations",
  "getOfficialVerifiedBriefSources",
]) {
  if (!verifiedBrief.includes(marker)) {
    fail(`LaFleur verified brief is missing: ${marker}`);
  }
}

if (verifiedBrief.includes('id: "county-performance-gaps"')) {
  fail("a missing research category must not be published as critical coverage");
}

if (
  !officialRoute.includes("completeSourceCount") ||
  !officialRoute.includes("dashboardRecordLabel={officeAccountability.decisionLabel}")
) {
  fail("LaFleur's standalone page does not expose the complete brief/source ledger or role-aware navigation");
}

if (
  !seoInventory.includes('path: "/candidates/dina-k-carroll"') ||
  !seoInventory.includes('buildOgImageUrl("candidate"')
) {
  fail("the standalone candidate page is missing from the sitemap/OG inventory");
}

if (!process.exitCode) {
  console.log("Marion County race source release smoke passed.");
}
