/**
 * Guard the section share cards.
 *
 * The failure this exists for is silent by construction. A page asks
 * /api/og/home for a card by passing `page=<key>`; if the route has no entry
 * for that key it serves the homepage's card rather than erroring, because a
 * link with no preview image is worse than a link with the wrong one. That is
 * the right runtime behaviour and a terrible way to find out: `/home-district`
 * and `/home-district/roster`, the two pages the whole beat is named after,
 * shipped the homepage's picture for as long as they existed and nothing
 * anywhere said so.
 *
 * So the check lives here instead. Every key a page passes must have an entry,
 * every entry must have its own drawing, and no two sections may resolve to
 * the same picture.
 *
 * Run: npm run smoke:og-sections
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { SECTION_COPY, SECTION_KEYS, withoutZeros } from "../src/lib/section-og-copy";
import { badgesThatFit } from "../src/lib/repwatchr-og";
import {
  EXPECTED_CITY_SEATS,
  EXPECTED_COUNTY_SEATS,
  FOOTPRINT_EXPECTED_SEATS,
  footprintJurisdictions,
} from "../src/lib/district-footprint";
import { SECTION_ART_IDS, hasSectionArt, sectionArtDataUri } from "../src/lib/section-og-art";
import { getRepWatchrDataStats } from "../src/lib/data";
import { getSchoolBoardStats } from "../src/lib/school-board-research";

const root = resolve(import.meta.dirname, "..");
const appDir = resolve(root, "src", "app");

const failures: string[] = [];
const fail = (where: string, message: string) => failures.push(`${where}: ${message}`);

/* ------------------------------------------- what the pages actually ask for */

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry === "page.tsx") out.push(full);
  }
  return out;
}

const pages = walk(appDir);
const asked = new Map<string, string[]>();

for (const file of pages) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/buildOgImageUrl\(\s*"home"\s*,\s*\{[^}]*?page:\s*"([^"]+)"/g)) {
    const key = match[1];
    asked.set(key, [...(asked.get(key) ?? []), relative(root, file)]);
  }
}

if (asked.size === 0) fail("scan", "found no pages asking for a section card; the scan regex has drifted");

for (const [key, files] of asked) {
  if (!SECTION_KEYS.includes(key)) {
    fail(files.join(", "), `asks for page="${key}", which has no entry, so it silently ships the homepage card`);
  }
}

/* ------------------------------------------- two pages, one card is a repost */

for (const [key, files] of asked) {
  if (files.length > 1) {
    fail(files.join(" and "), `both share the "${key}" card, so they preview identically in a feed`);
  }
}

/* ----------------------------------------------------- every entry can draw */

for (const key of SECTION_KEYS) {
  if (!hasSectionArt(key)) fail(key, "has copy but no drawing, so it falls back to no background at all");
}

for (const id of SECTION_ART_IDS) {
  if (!SECTION_KEYS.includes(id)) fail(id, "has a drawing but no copy entry, so nothing can ever request it");
}

/* --------------------------------------------------- and draws its own thing */

const seenArt = new Map<string, string>();
for (const key of SECTION_KEYS) {
  const art = sectionArtDataUri(key);
  if (!art) {
    fail(key, "produced no artwork");
    continue;
  }
  if (!art.startsWith("data:image/svg+xml;base64,")) {
    fail(key, "artwork must be an inlined data URI; satori will not fetch an SVG element tree");
  }

  // Compare what the drawing looks like, not what it is called. Each SVG
  // namespaces its gradient and pattern ids with the section key, so two
  // sections sharing a motif and a palette still differ byte for byte and a
  // naive comparison passes while the feed shows the same picture twice.
  const svg = Buffer.from(art.split(",")[1], "base64").toString("utf8");
  const shape = svg.replace(/rw-sec-[a-z0-9]+/gi, "rw-sec");

  const previous = seenArt.get(shape);
  if (previous) fail(key, `draws exactly the same picture as "${previous}"`);
  seenArt.set(shape, key);
}

/* ------------------------------------------------- the words are its own too */

const seenHeadline = new Map<string, string>();
for (const [key, copy] of Object.entries(SECTION_COPY)) {
  const previous = seenHeadline.get(copy.headline);
  if (previous) fail(key, `shares the headline "${copy.headline}" with "${previous}"`);
  seenHeadline.set(copy.headline, key);

  // 72 is where renderRepWatchrOgImage truncates a headline with an ellipsis.
  if (copy.headline.length > 72) fail(key, `headline is ${copy.headline.length} chars and will be truncated at 72`);
  if (copy.supportLine.length > 126) fail(key, `support line is ${copy.supportLine.length} chars and will be truncated at 126`);
  if (!copy.path.startsWith("/")) fail(key, `path "${copy.path}" is not site-relative`);
}

/* ----------------------------------------- and the numbers on it are not junk */

const stats = getRepWatchrDataStats();
const school = getSchoolBoardStats();

for (const [key, copy] of Object.entries(SECTION_COPY)) {
  const metric = copy.metric(stats, school);
  if (!Number.isFinite(metric.value)) fail(key, `metric "${metric.label}" is not a finite number`);
  if (!metric.label.trim()) fail(key, "metric has no label");

  const badges = withoutZeros(copy.badges(stats, school));
  if (badges.length === 0) fail(key, "has no badges");
  for (const badge of badges) {
    if (String(badge.value).includes("undefined") || String(badge.value).includes("NaN")) {
      fail(key, `badge "${badge.label}" reads "${badge.value}", which means the stat field name is wrong`);
    }
  }

  // The footer is one non-wrapping row, so a badge that does not fit is not
  // pushed to a second line, it walks off the card and is never seen. The
  // renderer drops it rather than overflowing, which is the right thing to do
  // at request time and the wrong thing to find out about from a screenshot.
  const fitted = badgesThatFit(badges, metric.value.toLocaleString("en-US"), metric.label);
  if (fitted.length < badges.length) {
    const dropped = badges.slice(fitted.length).map((badge) => `${badge.value} ${badge.label}`);
    fail(key, `footer is too wide, so these never render: ${dropped.join(", ")}. Shorten the labels or the metric.`);
  }
}

/* --------------------------------------- the beat card must match the page */

// The card said "19 expected seats" because it added the county slate to the
// city slate, which describes one county plus one city and no real footprint.
// The roster page derives its total from the actual jurisdiction rows, so that
// sum is the thing to agree with, not a hand-kept number.
const { counties, places } = footprintJurisdictions();
const ledgerTotal = counties.length * EXPECTED_COUNTY_SEATS + places.length * EXPECTED_CITY_SEATS;
if (FOOTPRINT_EXPECTED_SEATS !== ledgerTotal) {
  fail(
    "district-footprint",
    `FOOTPRINT_EXPECTED_SEATS is ${FOOTPRINT_EXPECTED_SEATS} but the roster ledger sums to ${ledgerTotal}, so the share card and the page would publish different numbers`,
  );
}

/* ----------------------------------------------------------------- report */

if (failures.length > 0) {
  console.error(`\nSection share cards FAILED (${failures.length})`);
  for (const line of failures) console.error(`  - ${line}`);
  process.exit(1);
}

console.log(
  `Section share cards OK: ${SECTION_KEYS.length} sections, ${asked.size} requested by pages, all drawing something different.`,
);
