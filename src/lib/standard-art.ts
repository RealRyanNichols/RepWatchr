/**
 * Artwork for the three editorial standards cards on the homepage.
 *
 * Each one draws the thing the card is actually promising: a filing with a
 * source line under it, a review queue with items still open, and the district
 * ground this desk covers. Drawn rather than photographed so nothing has to be
 * licensed, fetched, or kept from 404ing.
 */

export const STANDARD_ART_VIEWBOX = "0 0 480 200";

type StandardArtId = "source-standard" | "review-status" | "coverage-area";

/** The filing itself, with the source line that has to sit under every claim. */
function sourceStandard(accent: string, ink: string) {
  const bodyLines = [188, 156, 204, 140]
    .map(
      (width, index) =>
        `<rect x="72" y="${74 + index * 18}" width="${width}" height="6" rx="3" fill="${ink}" fill-opacity="0.22"/>`,
    )
    .join("");
  return `
    <rect x="52" y="34" width="236" height="146" rx="6" fill="#ffffff" fill-opacity="0.96" stroke="${ink}" stroke-opacity="0.2" stroke-width="2"/>
    <rect x="72" y="54" width="120" height="10" rx="3" fill="${accent}" fill-opacity="0.85"/>
    ${bodyLines}
    <rect x="72" y="152" width="150" height="8" rx="4" fill="${accent}" fill-opacity="0.55"/>
    <path d="M234 158 h 42" stroke="${accent}" stroke-opacity="0.8" stroke-width="3" stroke-linecap="round"/>
    <circle cx="360" cy="92" r="42" fill="none" stroke="${accent}" stroke-opacity="0.75" stroke-width="7"/>
    <path d="M390 122 L 424 156" stroke="${accent}" stroke-opacity="0.75" stroke-width="10" stroke-linecap="round"/>
    <path d="M342 92 L 355 105 L 380 78" fill="none" stroke="${accent}" stroke-opacity="0.85" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

/** A queue where some rows are cleared and some are visibly still open. */
function reviewStatus(accent: string, ink: string) {
  const rows = [0, 1, 2, 3]
    .map((index) => {
      const y = 40 + index * 34;
      const cleared = index < 2;
      const mark = cleared
        ? `<path d="M66 ${y + 17} L76 ${y + 27} L94 ${y + 6}" fill="none" stroke="${accent}" stroke-opacity="0.9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<circle cx="80" cy="${y + 16}" r="9" fill="none" stroke="${ink}" stroke-opacity="0.4" stroke-width="4" stroke-dasharray="5 5"/>`;
      return `
        <rect x="56" y="${y}" width="48" height="32" rx="5" fill="${cleared ? accent : ink}" fill-opacity="${cleared ? 0.12 : 0.05}" stroke="${cleared ? accent : ink}" stroke-opacity="${cleared ? 0.5 : 0.25}" stroke-width="2"/>
        ${mark}
        <rect x="122" y="${y + 11}" width="${[248, 196, 224, 168][index]}" height="10" rx="5" fill="${cleared ? accent : ink}" fill-opacity="${cleared ? 0.35 : 0.14}"/>
      `;
    })
    .join("");
  return `${rows}<rect x="56" y="182" width="368" height="4" rx="2" fill="${accent}" fill-opacity="0.28"/>`;
}

/** Counties as a block of parcels, with the two home seats lit up. */
function coverageArea(accent: string, ink: string) {
  const grid = [
    [64, 36, 96, 52],
    [168, 36, 74, 52],
    [250, 36, 96, 52],
    [354, 36, 62, 52],
    [64, 96, 74, 52],
    [146, 96, 96, 52],
    [250, 96, 62, 52],
    [320, 96, 96, 52],
  ]
    .map(
      ([x, y, w, h], index) =>
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${index === 1 || index === 5 ? accent : ink}" fill-opacity="${index === 1 || index === 5 ? 0.3 : 0.06}" stroke="${index === 1 || index === 5 ? accent : ink}" stroke-opacity="${index === 1 || index === 5 ? 0.75 : 0.22}" stroke-width="${index === 1 || index === 5 ? 3 : 2}"/>`,
    )
    .join("");
  return `
    ${grid}
    <circle cx="205" cy="62" r="8" fill="${accent}" fill-opacity="0.95"/>
    <circle cx="194" cy="122" r="8" fill="${accent}" fill-opacity="0.95"/>
    <rect x="64" y="162" width="352" height="4" rx="2" fill="${accent}" fill-opacity="0.3"/>
    <rect x="64" y="174" width="140" height="4" rx="2" fill="${accent}" fill-opacity="0.6"/>
  `;
}

const STANDARD_MOTIFS: Record<StandardArtId, (accent: string, ink: string) => string> = {
  "source-standard": sourceStandard,
  "review-status": reviewStatus,
  "coverage-area": coverageArea,
};

export const STANDARD_ART_IDS = Object.keys(STANDARD_MOTIFS) as StandardArtId[];

export function hasStandardArt(id: string): id is StandardArtId {
  return id in STANDARD_MOTIFS;
}

/** Everything inside the `<svg>` for one standards card. */
export function standardArtInnerSvg(id: string) {
  const motif = STANDARD_MOTIFS[id as StandardArtId];
  const accent = "#b3231f";
  const ink = "#0b2049";
  const gradientId = `rw-standard-${id}`;
  return `<defs>
      <linearGradient id="${gradientId}-wash" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e8eefb"/>
        <stop offset="100%" stop-color="#f7f9ff"/>
      </linearGradient>
    </defs>
    <rect width="480" height="200" fill="url(#${gradientId}-wash)"/>
    ${motif ? motif(accent, ink) : ""}`;
}
