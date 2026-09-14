import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { officialProfileTitle } from "@/lib/official-titles";

/**
 * Builds the <title> for every official record on disk and reports what came
 * out. Run by scripts/smoke-district-positioning.mjs, which needs the real
 * function rather than a copy of its rules - a guard that reimplements the
 * logic it is guarding proves nothing.
 */

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith(".json") ? [full] : [];
  });
}

/**
 * An office description standing where a place belongs. These are never right
 * in a title: "Kay Ivey - Alabama statewide public office Governor". The
 * original check only looked for chambers, so 193 of these shipped. Agency
 * names like "Railroad Commission of Texas" are legitimate in a position and
 * are deliberately not listed here.
 */
const OFFICE_DESCRIPTION = /\b(statewide|public office)\b/i;

/** A chamber standing where a place belongs. */
const CHAMBER_AS_PLACE = /(House of Representatives|Senate)\s+(State|U\.S\.|Justice|Judge)/i;

/**
 * The same phrase twice, which is what an un-deduplicated office and district
 * produce: "Chief Justice, First Court of Appeals, First Court of Appeals,
 * Place 1". A court naming itself once is correct and expected.
 */
function repeatsASegment(title: string) {
  const segments = title
    .split(/[-,]/)
    .map((segment) => segment.trim().toLowerCase())
    .filter((segment) => segment.length > 3);
  return new Set(segments).size !== segments.length;
}

const EXPECTED = new Map([
  ["gregg-county-sheriff", "Maxey Cerliano - Gregg County Sheriff"],
  ["jay-dean", "Jay Dean - State Representative, HD-7"],
  ["nathaniel-moran", "Nathaniel Moran - U.S. Representative, TX-1"],
  ["greg-abbott", "Greg Abbott - Texas Governor"],
]);

let scanned = 0;
let awkward = 0;
const awkwardSamples: string[] = [];
const seen = new Map<string, string>();

for (const file of walk("src/data/officials")) {
  let record: Record<string, unknown>;
  try {
    record = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  if (typeof record.name !== "string") continue;
  scanned += 1;

  const title = officialProfileTitle(record as never);
  if (
    /\s{2,}/.test(title) ||
    /,\s*$/.test(title) ||
    title.endsWith(" -") ||
    OFFICE_DESCRIPTION.test(title) ||
    CHAMBER_AS_PLACE.test(title) ||
    repeatsASegment(title)
  ) {
    awkward += 1;
    if (awkwardSamples.length < 5) awkwardSamples.push(title);
  }
  if (typeof record.id === "string" && EXPECTED.has(record.id)) seen.set(record.id, title);
}

const mismatched = [...EXPECTED]
  .filter(([id, expected]) => seen.get(id) !== expected)
  .map(([id, expected]) => ({ id, expected, actual: seen.get(id) ?? "(record not found)" }));

console.log(JSON.stringify({ scanned, awkward, awkwardSamples, mismatched }));
