import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const componentPath = "src/components/elections/FlagshipRaceExperience.tsx";
const routePath = "src/app/elections/texas/[raceSlug]/page.tsx";
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
]) {
  if (!component.includes(marker)) {
    fail(`required dossier marker is missing: ${marker}`);
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

if (!process.exitCode) {
  console.log("Marion County race source release smoke passed.");
}
