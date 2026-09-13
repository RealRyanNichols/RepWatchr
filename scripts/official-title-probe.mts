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

/** Titles that name an institution where a place belongs. */
const READS_AS_INSTITUTION =
  /(House of Representatives|Senate|Court of Appeals)\s+(State|U\.S\.|Justice|Judge)/i;

const EXPECTED = new Map([
  ["gregg-county-sheriff", "Maxey Cerliano - Gregg County Sheriff"],
  ["jay-dean", "Jay Dean - State Representative, HD-7"],
  ["nathaniel-moran", "Nathaniel Moran - U.S. Representative, TX-1"],
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
  if (/\s{2,}/.test(title) || /,\s*$/.test(title) || title.endsWith(" -") || READS_AS_INSTITUTION.test(title)) {
    awkward += 1;
    if (awkwardSamples.length < 5) awkwardSamples.push(title);
  }
  if (typeof record.id === "string" && EXPECTED.has(record.id)) seen.set(record.id, title);
}

const mismatched = [...EXPECTED]
  .filter(([id, expected]) => seen.get(id) !== expected)
  .map(([id, expected]) => ({ id, expected, actual: seen.get(id) ?? "(record not found)" }));

console.log(JSON.stringify({ scanned, awkward, awkwardSamples, mismatched }));
