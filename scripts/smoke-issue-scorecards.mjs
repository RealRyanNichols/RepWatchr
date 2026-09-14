#!/usr/bin/env node
/**
 * Guards the issue buildout and the published scorecard algorithm.
 *
 * Two kinds of check run here. Source assertions catch a card losing its
 * artwork or a page losing its link to the method. A behavioural probe
 * (scripts/scorecard-model-probe.mts) runs the real arithmetic over the real
 * data, because no amount of string matching can tell whether a weighted mean
 * is actually weighted.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const failures = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

// Whether each motif actually DRAWS is checked by the probe at the bottom,
// which renders every one. Source alone cannot tell a motif that returns
// geometry from one that returns an empty string.
const categories = JSON.parse(read("src/data/issues/categories.json"));
check(categories.length > 0, "No issue categories are defined, so there is nothing to score or draw.");

// --------------------------------------------------------------------------
// The cards are wired to the artwork
// --------------------------------------------------------------------------
const homepage = read("src/app/page.tsx");

for (const id of ["source-standard", "review-status", "coverage-area"]) {
  check(
    homepage.includes(`art: "${id}"`),
    `The homepage standards card "${id}" no longer declares artwork.`,
  );
}
check(
  /standardArtInnerSvg\(standard\.art\)/.test(homepage),
  "The homepage standards cards no longer render their artwork; the `art` field would be dead data.",
);
check(
  /issueArtInnerSvg\(issue\.id, issue\.color\)/.test(homepage),
  "The homepage issue cards no longer render issue artwork.",
);

// --------------------------------------------------------------------------
// Honest framing of the archive size
// --------------------------------------------------------------------------
check(
  /label: "HD-7 \/ TX-01 Profiles"/.test(homepage),
  "The homepage stats row no longer leads with the in-district profile count.",
);
check(
  /footprintProfileCount/.test(homepage) && /officials\.filter\(isInFootprint\)/.test(homepage),
  "The in-district stat is not derived from the footprint module, so it can drift from the declared beat.",
);
check(
  !/label: "Public Profiles"[\s\S]{0,200}people and institutions on the record/.test(homepage),
  'The all-states archive total is labelled "Public Profiles" again beside the HD-7 / TX-01 headline, where it reads as district coverage.',
);
check(
  !/\{issue\.weight\}% of overall score/.test(homepage),
  "The homepage issue cards claim their weight is a share of the overall grade. Issue weights weight the vote-record score, not the performance grade.",
);

// --------------------------------------------------------------------------
// The algorithm is published and linked from where the numbers appear
// --------------------------------------------------------------------------
const methodPage = read("src/app/methodology/scorecards/page.tsx");
check(
  /category score = weight of aligned votes/.test(methodPage),
  "The scorecard method page no longer states the category formula.",
);
check(
  /letterGradeBands\(\)/.test(methodPage),
  "The method page stopped deriving its letter bands from the grading function and could drift from the code that grades.",
);
check(
  /getScoreCardGateReport\(\)/.test(methodPage),
  "The method page stopped publishing the live publication-gate counts, so an empty scorecard table has no explanation.",
);

const linkers = [
  ["src/app/page.tsx", "the homepage issue section"],
  ["src/app/issues/page.tsx", "the issues index"],
  ["src/app/issues/[id]/page.tsx", "the issue detail page"],
  ["src/app/scorecards/page.tsx", "the scorecards index"],
  ["src/app/scorecards/[category]/page.tsx", "the category scorecard"],
  ["src/app/methodology/page.tsx", "the methodology page"],
];
for (const [file, label] of linkers) {
  check(
    read(file).includes("/methodology/scorecards"),
    `${label} does not link to the scorecard algorithm, so a reader who sees a score cannot reach the method.`,
  );
}

// The category-key mapping must exist in exactly one place.
const categoryScorecard = read("src/app/scorecards/[category]/page.tsx");
check(
  !/const categoryKeyMap/.test(categoryScorecard),
  "The category scorecard page re-declares its own issue-id-to-score-key map; it must read the shared one.",
);

// --------------------------------------------------------------------------
// Share images: an issue card must not fall back to the shared stock photo
// --------------------------------------------------------------------------
const ogRoute = read("src/app/api/og/methodology/route.tsx");
check(
  /issue\s*\?\s*issueArtDataUri\(issue\.id, issue\.color\)/.test(ogRoute),
  "Issue share images no longer use the issue's own artwork, so all five would share one background.",
);
check(
  read("src/lib/repwatchr-og.tsx").includes('pathOrUrl.startsWith("data:")'),
  "The share-image asset resolver would treat an inlined drawing as a relative path and drop it.",
);

// --------------------------------------------------------------------------
// The arithmetic itself
// --------------------------------------------------------------------------
let probe;
try {
  const raw = execFileSync("npx", ["tsx", "scripts/scorecard-model-probe.mts"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  probe = JSON.parse(raw.trim().split("\n").pop());
} catch (error) {
  failures.push(`The scorecard model probe did not run: ${error.message}`);
}

if (probe) {
  for (const problem of probe.problems) failures.push(problem);
  check(
    probe.gate.onFile === probe.gate.published + probe.gate.withheldTotal,
    "The publication gate does not account for every scorecard on file.",
  );
}

if (failures.length) {
  console.error(`\nsmoke:issue-scorecards FAILED (${failures.length})\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error("");
  process.exit(1);
}

console.log("smoke:issue-scorecards passed");
if (probe) {
  console.log(
    `  ${categories.length} issue categories drawn · ${probe.gate.published} scorecards published, ${probe.gate.withheldTotal} withheld`,
  );
  console.log(`  letter bands: ${probe.bands.join(", ")}`);
}
