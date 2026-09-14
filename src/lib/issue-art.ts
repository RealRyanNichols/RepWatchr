/**
 * Artwork for the five issue categories RepWatchr scores.
 *
 * The categories used to render as a coloured bar over text, which gives a
 * reader nothing to look at and nothing to remember. These are drawn from the
 * subject matter itself: water contours, surveyed parcels, a tax ledger, a
 * record opened to be read, a ballot column.
 *
 * Pure SVG for the same reasons the article covers are: nothing to fetch,
 * nothing to 404, and it scales from a card thumbnail to a page banner.
 */

export const ISSUE_ART_VIEWBOX = "0 0 640 280";

/** Every category carries its own accent; the ground stays in the brand family. */
type IssueArtPalette = {
  base: string;
  mid: string;
  accent: string;
};

function paletteFor(accent: string, variant: IssueArtVariant = "page"): IssueArtPalette {
  // The share card lays a heavy scrim over its background so headline text stays
  // readable. A drawing tuned for a white page disappears under it, so the share
  // variant starts from a lighter ground.
  return variant === "share"
    ? { base: "#0d2440", mid: "#1c4a7a", accent }
    : { base: "#061120", mid: "#0d2340", accent };
}

type IssueArtVariant = "page" | "share";

/**
 * Raise every opacity in generated markup toward 1.
 *
 * Only ever applied to markup this module produced, where each `*-opacity`
 * value is a number it wrote itself.
 */
function brighten(markup: string, factor: number) {
  return markup.replace(/-opacity="([\d.]+)"/g, (whole, value: string) => {
    const raised = Math.min(1, Number(value) * factor);
    return Number.isFinite(raised) ? `-opacity="${Number(raised.toFixed(3))}"` : whole;
  });
}

function waterRights({ accent }: IssueArtPalette) {
  const wave = (y: number, amplitude: number, opacity: number) =>
    `<path d="M0 ${y} C 90 ${y - amplitude}, 180 ${y + amplitude}, 280 ${y} S 470 ${y - amplitude}, 640 ${y}" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2.5"/>`;
  return `
    ${[120, 150, 180, 210, 240].map((y, i) => wave(y, 14 - i * 1.5, 0.34 - i * 0.05)).join("")}
    <path d="M470 58 C 470 92, 510 104, 510 134 a 40 40 0 0 1 -80 0 C 430 104, 470 92, 470 58 Z"
      fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-opacity="0.55" stroke-width="3"/>
    <circle cx="470" cy="132" r="9" fill="${accent}" fill-opacity="0.7"/>
    <line x1="150" y1="70" x2="150" y2="196" stroke="${accent}" stroke-opacity="0.4" stroke-width="3"/>
    <rect x="132" y="62" width="36" height="14" fill="${accent}" fill-opacity="0.45"/>
  `;
}

function landAndPropertyRights({ accent }: IssueArtPalette) {
  const parcels = [
    [70, 90, 120, 80],
    [200, 90, 92, 80],
    [304, 90, 140, 52],
    [304, 154, 140, 16],
    [70, 182, 120, 60],
    [200, 182, 92, 60],
  ]
    .map(
      ([x, y, w, h]) =>
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${accent}" fill-opacity="0.05" stroke="${accent}" stroke-opacity="0.28" stroke-width="2"/>`,
    )
    .join("");
  return `
    ${parcels}
    <rect x="304" y="182" width="140" height="60" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-opacity="0.62" stroke-width="3.5"/>
    <line x1="486" y1="74" x2="486" y2="242" stroke="${accent}" stroke-opacity="0.5" stroke-width="3"/>
    <polygon points="486,74 530,86 486,98" fill="${accent}" fill-opacity="0.6"/>
    <line x1="52" y1="252" x2="588" y2="252" stroke="${accent}" stroke-opacity="0.22" stroke-width="2"/>
  `;
}

function taxes({ accent }: IssueArtPalette) {
  const lines = [230, 196, 214, 168, 204]
    .map(
      (width, index) =>
        `<rect x="96" y="${96 + index * 26}" width="${width}" height="7" rx="3.5" fill="${accent}" fill-opacity="${index === 2 ? 0.5 : 0.2}"/>`,
    )
    .join("");
  const bars = [40, 62, 88, 118]
    .map(
      (height, index) =>
        `<rect x="${424 + index * 42}" y="${226 - height}" width="26" height="${height}" fill="${accent}" fill-opacity="${0.24 + index * 0.14}"/>`,
    )
    .join("");
  return `
    <rect x="70" y="62" width="288" height="182" rx="4" fill="${accent}" fill-opacity="0.07" stroke="${accent}" stroke-opacity="0.3" stroke-width="2.5"/>
    <rect x="96" y="80" width="150" height="12" fill="${accent}" fill-opacity="0.5"/>
    ${lines}
    ${bars}
    <line x1="410" y1="228" x2="596" y2="228" stroke="${accent}" stroke-opacity="0.4" stroke-width="2.5"/>
  `;
}

function governmentTransparency({ accent }: IssueArtPalette) {
  const hidden = [190, 160, 176, 140]
    .map(
      (width, index) =>
        `<rect x="250" y="${112 + index * 28}" width="${width}" height="8" rx="4" fill="${accent}" fill-opacity="0.45"/>`,
    )
    .join("");
  return `
    <rect x="112" y="54" width="300" height="196" rx="4" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-opacity="0.26" stroke-width="2.5"/>
    <rect x="140" y="76" width="170" height="12" fill="${accent}" fill-opacity="0.4"/>
    <rect x="232" y="96" width="228" height="132" rx="4" fill="#061120" fill-opacity="0.55" stroke="${accent}" stroke-opacity="0.55" stroke-width="3"/>
    ${hidden}
    <path d="M366 64 a 74 46 0 0 1 148 0 a 74 46 0 0 1 -148 0 Z" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="3"/>
    <circle cx="440" cy="64" r="19" fill="${accent}" fill-opacity="0.3" stroke="${accent}" stroke-opacity="0.7" stroke-width="3"/>
    <circle cx="440" cy="64" r="7" fill="${accent}" fill-opacity="0.85"/>
  `;
}

function votingRecord({ accent }: IssueArtPalette) {
  const rows = [0, 1, 2, 3, 4]
    .map((index) => {
      const y = 72 + index * 36;
      const yea = index !== 2;
      const mark = yea
        ? `<path d="M162 ${y + 18} L173 ${y + 29} L192 ${y + 6}" fill="none" stroke="${accent}" stroke-opacity="0.8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M164 ${y + 8} L190 ${y + 28} M190 ${y + 8} L164 ${y + 28}" stroke="${accent}" stroke-opacity="0.45" stroke-width="6" stroke-linecap="round"/>`;
      return `
        <rect x="152" y="${y}" width="50" height="36" rx="3" fill="${accent}" fill-opacity="${yea ? 0.14 : 0.04}" stroke="${accent}" stroke-opacity="0.34" stroke-width="2.5"/>
        ${mark}
        <rect x="222" y="${y + 12}" width="${[248, 206, 268, 190, 232][index]}" height="12" rx="6" fill="${accent}" fill-opacity="${yea ? 0.26 : 0.1}"/>
      `;
    })
    .join("");
  return `${rows}<line x1="152" y1="46" x2="540" y2="46" stroke="${accent}" stroke-opacity="0.3" stroke-width="2.5"/>`;
}

const ISSUE_MOTIFS: Record<string, (palette: IssueArtPalette) => string> = {
  "water-rights": waterRights,
  "land-and-property-rights": landAndPropertyRights,
  taxes,
  "government-transparency": governmentTransparency,
  "voting-record": votingRecord,
};

/** Categories this module can draw. A new category needs a motif added here. */
export const ISSUE_ART_IDS = Object.keys(ISSUE_MOTIFS);

export function hasIssueArt(categoryId: string) {
  return categoryId in ISSUE_MOTIFS;
}

/**
 * Everything inside the `<svg>`: ground, texture, motif, accent rule.
 *
 * `groundHeight` lets a taller ground be drawn under the same motif so the
 * drawing can fill a share card's 1.9:1 frame without the motif being cropped.
 */
export function issueArtInnerSvg(
  categoryId: string,
  accentColor: string,
  { groundHeight = 280, variant = "page" as IssueArtVariant } = {},
) {
  const palette = paletteFor(accentColor || "#d6b35a", variant);
  const motif = ISSUE_MOTIFS[categoryId];
  const id = `rw-issue-${categoryId.replace(/[^a-z0-9]/gi, "")}`;
  const motifOffset = Math.max(0, Math.round((groundHeight - 280) / 2));
  const drawn = motif ? motif(palette) : "";
  const motifMarkup = variant === "share" ? brighten(drawn, 2.1) : drawn;
  return `<defs>
      <linearGradient id="${id}-wash" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.mid}"/>
        <stop offset="72%" stop-color="${palette.base}"/>
      </linearGradient>
      <pattern id="${id}-dots" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="${palette.accent}" fill-opacity="0.08"/>
      </pattern>
    </defs>
    <rect width="640" height="${groundHeight}" fill="url(#${id}-wash)"/>
    <rect width="640" height="${groundHeight}" fill="url(#${id}-dots)"/>
    <g transform="translate(0 ${motifOffset})">${motifMarkup}</g>
    <rect x="0" y="0" width="640" height="5" fill="${palette.accent}" fill-opacity="0.9"/>`;
}

/** The share-card frame: 1200x630 reduces to 640x336 at the same ratio. */
const SHARE_ART_HEIGHT = 336;

/**
 * The same drawing as a standalone SVG document, encoded for an `<img src>`.
 *
 * Satori rasterises an SVG referenced as an image but will not walk SVG
 * elements in the tree, so the share-image route needs the document form rather
 * than the inner markup the page uses.
 */
export function issueArtDataUri(categoryId: string, accentColor: string) {
  const inner = issueArtInnerSvg(categoryId, accentColor, {
    groundHeight: SHARE_ART_HEIGHT,
    variant: "share",
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 640 ${SHARE_ART_HEIGHT}">${inner}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
