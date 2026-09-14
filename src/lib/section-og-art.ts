/**
 * Section artwork for share cards.
 *
 * Every page that shares to Facebook or X pulls its preview from
 * /api/og/home, and that route drew all fifteen of them on one photograph of
 * Washington at blue hour. The copy differed; the picture never did. Fifteen
 * links in a feed therefore read as one link posted fifteen times, which is
 * the exact thing a share card exists to prevent.
 *
 * There is only one editorial photograph in the repository, so more photos
 * were not the fix. Each section gets a drawing instead: its own geometry and
 * its own accent, generated rather than sourced, so a new section is a motif
 * here and not a photo shoot.
 *
 * Same technique as `issue-art.ts`: satori rasterises an SVG referenced as an
 * image but will not walk SVG elements in the tree, so these are emitted as
 * complete documents encoded for an `<img src>`.
 */

/** 1200x630 reduces to 640x336 at the same ratio, which is the drawing frame. */
const W = 640;
const H = 336;

type Palette = {
  /** Deep corner of the ground wash. */
  base: string;
  /** Lit corner of the ground wash. */
  mid: string;
  /** The section's own color, carried by every stroke in the motif. */
  accent: string;
};

/**
 * The card lays a heavy scrim over this drawing so the headline stays
 * readable, which eats a flat drawing alive. Grounds start light and the
 * motifs are drawn at opacities that survive it.
 */
const GROUNDS: Record<string, Pick<Palette, "base" | "mid">> = {
  navy: { base: "#0d2440", mid: "#1c4a7a" },
  slate: { base: "#111f33", mid: "#27425f" },
  ink: { base: "#0b1c33", mid: "#1b3c63" },
  crimson: { base: "#2a1220", mid: "#5c2438" },
  forest: { base: "#0c2429", mid: "#1a4a4a" },
};

/* ------------------------------------------------------------------ motifs */

function rows(
  count: number,
  { x, y, step, widths, accent, height = 11 }: { x: number; y: number; step: number; widths: number[]; accent: string; height?: number },
) {
  return Array.from({ length: count }, (_, i) => {
    const w = widths[i % widths.length];
    return `<rect x="${x}" y="${y + i * step}" width="${w}" height="${height}" rx="${height / 2}" fill="${accent}" fill-opacity="${i === 0 ? 0.5 : 0.2}"/>`;
  }).join("");
}

/** The homepage: stacked records, each one sourced. */
function theRecord({ accent }: Palette) {
  const cards = [0, 1, 2]
    .map(
      (i) =>
        `<rect x="${78 + i * 26}" y="${70 + i * 22}" width="300" height="176" rx="6" fill="${accent}" fill-opacity="${0.05 + i * 0.04}" stroke="${accent}" stroke-opacity="${0.22 + i * 0.16}" stroke-width="2.5"/>`,
    )
    .join("");
  return `
    ${cards}
    ${rows(4, { x: 152, y: 138, step: 26, widths: [214, 176, 198, 148], accent })}
    <circle cx="500" cy="112" r="44" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="3"/>
    <path d="M478 112 L494 128 L524 96" fill="none" stroke="${accent}" stroke-opacity="0.85" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="452" y="184" width="140" height="10" rx="5" fill="${accent}" fill-opacity="0.3"/>
    <rect x="452" y="208" width="104" height="10" rx="5" fill="${accent}" fill-opacity="0.18"/>
  `;
}

/** Officials directory: a grid of people, one of them pulled forward. */
function directory({ accent }: Palette) {
  const cells = [];
  for (let r = 0; r < 3; r += 1) {
    for (let col = 0; col < 5; col += 1) {
      const x = 76 + col * 100;
      const y = 66 + r * 88;
      const lit = r === 1 && col === 2;
      cells.push(`
        <rect x="${x}" y="${y}" width="82" height="70" rx="5" fill="${accent}" fill-opacity="${lit ? 0.2 : 0.05}" stroke="${accent}" stroke-opacity="${lit ? 0.8 : 0.26}" stroke-width="${lit ? 3.5 : 2}"/>
        <circle cx="${x + 24}" cy="${y + 26}" r="13" fill="${accent}" fill-opacity="${lit ? 0.7 : 0.26}"/>
        <rect x="${x + 44}" y="${y + 19}" width="26" height="7" rx="3.5" fill="${accent}" fill-opacity="${lit ? 0.6 : 0.22}"/>
        <rect x="${x + 44}" y="${y + 31}" width="18" height="6" rx="3" fill="${accent}" fill-opacity="${lit ? 0.4 : 0.14}"/>
        <rect x="${x + 12}" y="${y + 50}" width="58" height="7" rx="3.5" fill="${accent}" fill-opacity="${lit ? 0.5 : 0.16}"/>
      `);
    }
  }
  return cells.join("");
}

/** State legislatures: a dome over a chamber. */
function statehouse({ accent }: Palette) {
  const seats = [];
  for (let ring = 0; ring < 4; ring += 1) {
    const radius = 96 + ring * 26;
    for (let i = 0; i <= 10; i += 1) {
      const angle = Math.PI + (i / 10) * Math.PI;
      const x = 320 + Math.cos(angle) * radius;
      const y = 268 + Math.sin(angle) * radius * 0.52;
      seats.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${accent}" fill-opacity="${ring === 1 && i === 5 ? 0.85 : 0.2 + ring * 0.06}"/>`,
      );
    }
  }
  return `
    <path d="M320 44 C 268 44 244 84 244 118 L396 118 C 396 84 372 44 320 44 Z" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-opacity="0.5" stroke-width="3"/>
    <rect x="316" y="22" width="8" height="24" fill="${accent}" fill-opacity="0.7"/>
    <polygon points="320,14 336,22 320,30" fill="${accent}" fill-opacity="0.8"/>
    <rect x="228" y="118" width="184" height="14" fill="${accent}" fill-opacity="0.35"/>
    ${seats.join("")}
  `;
}

/** About / standards: claims sorted into labeled lanes. */
function standards({ accent }: Palette) {
  const lanes = ["FACT", "REPORTED", "OPINION", "UNVERIFIED"];
  return lanes
    .map((_, i) => {
      const y = 62 + i * 62;
      const strength = [0.85, 0.55, 0.32, 0.14][i];
      return `
        <rect x="88" y="${y}" width="14" height="44" rx="4" fill="${accent}" fill-opacity="${strength}"/>
        <rect x="118" y="${y + 8}" width="${[300, 252, 214, 168][i]}" height="12" rx="6" fill="${accent}" fill-opacity="${strength * 0.5}"/>
        <rect x="118" y="${y + 26}" width="${[214, 180, 150, 112][i]}" height="9" rx="4.5" fill="${accent}" fill-opacity="${strength * 0.28}"/>
        <rect x="466" y="${y + 6}" width="86" height="30" rx="15" fill="none" stroke="${accent}" stroke-opacity="${strength * 0.7}" stroke-width="2.5"/>
      `;
    })
    .join("");
}

/** Authority watch: institutions, columns, a decision coming down. */
function authority({ accent }: Palette) {
  const columns = [0, 1, 2, 3, 4]
    .map((i) => `<rect x="${186 + i * 46}" y="120" width="24" height="110" fill="${accent}" fill-opacity="${i === 2 ? 0.55 : 0.2}"/>`)
    .join("");
  return `
    <polygon points="320,50 452,110 188,110" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-opacity="0.5" stroke-width="3"/>
    ${columns}
    <rect x="170" y="230" width="300" height="16" fill="${accent}" fill-opacity="0.4"/>
    <line x1="320" y1="252" x2="320" y2="300" stroke="${accent}" stroke-opacity="0.6" stroke-width="3" stroke-dasharray="10 8"/>
    <circle cx="320" cy="308" r="12" fill="${accent}" fill-opacity="0.7"/>
    <rect x="502" y="96" width="86" height="112" rx="5" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-opacity="0.3" stroke-width="2"/>
    ${rows(4, { x: 516, y: 116, step: 22, widths: [58, 46, 54, 38], accent, height: 8 })}
  `;
}

/** Attorney watch: scales over a docket. */
function legal({ accent }: Palette) {
  const pan = (cx: number, y: number, o: number) =>
    `<path d="M${cx - 38} ${y} a 38 30 0 0 0 76 0 Z" fill="${accent}" fill-opacity="${o}" stroke="${accent}" stroke-opacity="0.6" stroke-width="2.5"/>
     <line x1="${cx}" y1="${y - 46}" x2="${cx}" y2="${y}" stroke="${accent}" stroke-opacity="0.5" stroke-width="2.5"/>`;
  return `
    <rect x="314" y="64" width="9" height="188" rx="4" fill="${accent}" fill-opacity="0.6"/>
    <rect x="272" y="248" width="94" height="14" rx="6" fill="${accent}" fill-opacity="0.45"/>
    <line x1="196" y1="88" x2="442" y2="88" stroke="${accent}" stroke-opacity="0.6" stroke-width="4" stroke-linecap="round"/>
    ${pan(196, 134, 0.3)}
    ${pan(442, 134, 0.12)}
    <rect x="66" y="72" width="102" height="180" rx="5" fill="${accent}" fill-opacity="0.05" stroke="${accent}" stroke-opacity="0.26" stroke-width="2"/>
    ${rows(6, { x: 80, y: 92, step: 26, widths: [74, 58, 66, 48], accent, height: 8 })}
    <rect x="472" y="72" width="102" height="180" rx="5" fill="${accent}" fill-opacity="0.05" stroke="${accent}" stroke-opacity="0.26" stroke-width="2"/>
    ${rows(6, { x: 486, y: 92, step: 26, widths: [66, 74, 50, 62], accent, height: 8 })}
  `;
}

/** Media watch: a tower, and who owns the signal. */
function media({ accent }: Palette) {
  const waves = [0, 1, 2]
    .map(
      (i) =>
        `<path d="M${392 + i * 30} ${104 - i * 22} a ${44 + i * 30} ${44 + i * 30} 0 0 1 0 ${88 + i * 44}" fill="none" stroke="${accent}" stroke-opacity="${0.55 - i * 0.14}" stroke-width="4" stroke-linecap="round"/>`,
    )
    .join("");
  const mirrored = [0, 1, 2]
    .map(
      (i) =>
        `<path d="M${248 - i * 30} ${104 - i * 22} a ${44 + i * 30} ${44 + i * 30} 0 0 0 0 ${88 + i * 44}" fill="none" stroke="${accent}" stroke-opacity="${0.55 - i * 0.14}" stroke-width="4" stroke-linecap="round"/>`,
    )
    .join("");
  return `
    <polygon points="320,54 352,258 288,258" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-opacity="0.55" stroke-width="3"/>
    <line x1="298" y1="140" x2="342" y2="140" stroke="${accent}" stroke-opacity="0.45" stroke-width="3"/>
    <line x1="292" y1="188" x2="348" y2="188" stroke="${accent}" stroke-opacity="0.45" stroke-width="3"/>
    <circle cx="320" cy="48" r="10" fill="${accent}" fill-opacity="0.9"/>
    ${waves}${mirrored}
    <rect x="252" y="272" width="136" height="12" rx="6" fill="${accent}" fill-opacity="0.35"/>
  `;
}

/** Public safety: a badge, and the footage that settles it. */
function publicSafety({ accent }: Palette) {
  return `
    <path d="M214 58 L330 58 L330 176 C 330 216 294 240 272 250 C 250 240 214 216 214 176 Z" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-opacity="0.6" stroke-width="3.5"/>
    <polygon points="272,96 284,124 314,124 290,142 300,172 272,154 244,172 254,142 230,124 260,124" fill="${accent}" fill-opacity="0.7"/>
    <rect x="374" y="92" width="192" height="122" rx="8" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-opacity="0.4" stroke-width="3"/>
    <circle cx="470" cy="153" r="34" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="3.5"/>
    <circle cx="470" cy="153" r="14" fill="${accent}" fill-opacity="0.75"/>
    <circle cx="398" cy="112" r="7" fill="${accent}" fill-opacity="0.85"/>
    <rect x="374" y="230" width="118" height="10" rx="5" fill="${accent}" fill-opacity="0.32"/>
    <rect x="374" y="250" width="76" height="10" rx="5" fill="${accent}" fill-opacity="0.18"/>
  `;
}

/** Registry watch: pins on a map, with a freshness stamp. */
function registry({ accent }: Palette) {
  const pin = (x: number, y: number, o: number) =>
    `<path d="M${x} ${y} c -17 0 -30 13 -30 29 c 0 22 30 51 30 51 c 0 0 30 -29 30 -51 c 0 -16 -13 -29 -30 -29 Z" fill="${accent}" fill-opacity="${o}" stroke="${accent}" stroke-opacity="${Math.min(1, o + 0.35)}" stroke-width="2.5"/>
     <circle cx="${x}" cy="${y + 29}" r="10" fill="#0b1c33" fill-opacity="0.75"/>`;
  const grid = Array.from({ length: 7 }, (_, i) => `<line x1="${70 + i * 84}" y1="46" x2="${70 + i * 84}" y2="290" stroke="${accent}" stroke-opacity="0.1" stroke-width="1.5"/>`)
    .concat(Array.from({ length: 4 }, (_, i) => `<line x1="70" y1="${60 + i * 76}" x2="574" y2="${60 + i * 76}" stroke="${accent}" stroke-opacity="0.1" stroke-width="1.5"/>`))
    .join("");
  return `
    ${grid}
    ${pin(180, 92, 0.24)}
    ${pin(326, 66, 0.62)}
    ${pin(452, 128, 0.2)}
    ${pin(246, 186, 0.32)}
    ${pin(408, 214, 0.18)}
    <rect x="66" y="286" width="180" height="12" rx="6" fill="${accent}" fill-opacity="0.34"/>
  `;
}

/** East Texas desk: counties wired to one place. */
function eastTexas({ accent }: Palette) {
  const counties = [
    [92, 70, 118, 84],
    [222, 62, 104, 92],
    [338, 78, 122, 76],
    [472, 66, 92, 88],
    [92, 168, 96, 96],
    [200, 166, 126, 98],
    [338, 166, 104, 92],
    [454, 166, 110, 98],
  ]
    .map(
      ([x, y, w, h], i) =>
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${accent}" fill-opacity="${i === 5 ? 0.26 : 0.05}" stroke="${accent}" stroke-opacity="${i === 5 ? 0.85 : 0.28}" stroke-width="${i === 5 ? 3.5 : 2}"/>`,
    )
    .join("");
  return `
    ${counties}
    <circle cx="263" cy="215" r="13" fill="${accent}" fill-opacity="0.9"/>
    <circle cx="263" cy="215" r="28" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="2.5"/>
    <circle cx="263" cy="215" r="46" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="2"/>
  `;
}

/** The beat: two overlapping district outlines, one star where they meet. */
function homeDistrict({ accent }: Palette) {
  return `
    <path d="M104 82 L282 62 L322 128 L296 236 L142 258 L86 176 Z" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-opacity="0.55" stroke-width="3.5"/>
    <path d="M268 74 L468 58 L546 138 L512 252 L330 268 L252 190 Z" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-opacity="0.4" stroke-width="3.5" stroke-dasharray="12 7"/>
    <polygon points="300,118 315,158 358,158 323,183 336,224 300,199 264,224 277,183 242,158 285,158" fill="${accent}" fill-opacity="0.85"/>
    <rect x="86" y="290" width="96" height="12" rx="6" fill="${accent}" fill-opacity="0.5"/>
    <rect x="196" y="290" width="118" height="12" rx="6" fill="${accent}" fill-opacity="0.28"/>
  `;
}

/** Seat ledger: every office in the footprint, filled or still open. */
function roster({ accent }: Palette) {
  const lines = Array.from({ length: 7 }, (_, i) => {
    const y = 56 + i * 36;
    const filled = i !== 2 && i !== 5;
    return `
      <rect x="80" y="${y}" width="30" height="26" rx="4" fill="${accent}" fill-opacity="${filled ? 0.55 : 0.06}" stroke="${accent}" stroke-opacity="${filled ? 0.8 : 0.45}" stroke-width="2.5"/>
      ${filled ? `<path d="M87 ${y + 13} L94 ${y + 20} L104 ${y + 7}" fill="none" stroke="#0b1c33" stroke-opacity="0.8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
      <rect x="126" y="${y + 8}" width="${[228, 186, 204, 250, 172, 214, 194][i]}" height="11" rx="5.5" fill="${accent}" fill-opacity="${filled ? 0.3 : 0.1}"/>
      <rect x="${420 + (i % 3) * 12}" y="${y + 8}" width="96" height="11" rx="5.5" fill="${accent}" fill-opacity="${filled ? 0.16 : 0.06}"/>
    `;
  }).join("");
  return lines;
}

/** Coverage tiers: the beat first, then rings outward. */
function coverage({ accent }: Palette) {
  const rings = [148, 112, 76, 42]
    .map(
      (r, i) =>
        `<circle cx="320" cy="168" r="${r}" fill="${accent}" fill-opacity="${0.04 + i * 0.05}" stroke="${accent}" stroke-opacity="${0.22 + i * 0.16}" stroke-width="${2 + i}"/>`,
    )
    .join("");
  return `
    ${rings}
    <polygon points="320,142 330,170 360,170 336,188 345,216 320,199 295,216 304,188 280,170 310,170" fill="${accent}" fill-opacity="0.9"/>
    ${rows(4, { x: 488, y: 68, step: 30, widths: [118, 96, 76, 56], accent, height: 10 })}
    ${rows(4, { x: 34, y: 68, step: 30, widths: [92, 74, 58, 42], accent, height: 10 })}
  `;
}

/** Consent-first pilot: nothing moves until the box is ticked. */
function consent({ accent }: Palette) {
  return `
    <rect x="150" y="58" width="340" height="220" rx="8" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-opacity="0.32" stroke-width="2.5"/>
    <rect x="180" y="84" width="164" height="14" rx="7" fill="${accent}" fill-opacity="0.45"/>
    ${rows(3, { x: 180, y: 118, step: 28, widths: [278, 236, 254], accent, height: 10 })}
    <rect x="180" y="212" width="34" height="34" rx="6" fill="${accent}" fill-opacity="0.55" stroke="${accent}" stroke-opacity="0.85" stroke-width="3"/>
    <path d="M188 229 L196 238 L208 220" fill="none" stroke="#0b1c33" stroke-opacity="0.85" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="230" y="222" width="180" height="12" rx="6" fill="${accent}" fill-opacity="0.32"/>
    <rect x="424" y="210" width="40" height="40" rx="20" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="3"/>
    <path d="M436 230 L444 238 L458 220" fill="none" stroke="${accent}" stroke-opacity="0.75" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

/** VendorTrust: check the public signals before you buy. */
function vendorTrust({ accent }: Palette) {
  const checks = [0, 1, 2]
    .map((i) => {
      const y = 78 + i * 72;
      return `
        <rect x="96" y="${y}" width="300" height="54" rx="8" fill="${accent}" fill-opacity="0.05" stroke="${accent}" stroke-opacity="0.28" stroke-width="2"/>
        <rect x="118" y="${y + 16}" width="${[176, 142, 198][i]}" height="11" rx="5.5" fill="${accent}" fill-opacity="0.3"/>
        <circle cx="360" cy="${y + 27}" r="18" fill="${accent}" fill-opacity="${i === 2 ? 0.1 : 0.6}" stroke="${accent}" stroke-opacity="${i === 2 ? 0.5 : 0.85}" stroke-width="2.5"/>
        ${
          i === 2
            ? `<path d="M353 ${y + 20} L367 ${y + 34} M367 ${y + 20} L353 ${y + 34}" stroke="${accent}" stroke-opacity="0.8" stroke-width="4" stroke-linecap="round"/>`
            : `<path d="M352 ${y + 27} L358 ${y + 34} L369 ${y + 20}" fill="none" stroke="#0b1c33" stroke-opacity="0.85" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`
        }
      `;
    })
    .join("");
  return `
    ${checks}
    <path d="M478 68 L562 96 L562 176 C 562 224 520 250 500 258 C 480 250 438 224 438 176 L438 96 Z" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-opacity="0.5" stroke-width="3"/>
    <path d="M474 168 L494 188 L528 138" fill="none" stroke="${accent}" stroke-opacity="0.85" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

/* ------------------------------------------------------------------ registry */

type SectionArt = {
  draw: (palette: Palette) => string;
  ground: keyof typeof GROUNDS;
  accent: string;
};

/**
 * One entry per share card.
 *
 * Adjacent sections never share an accent, because two cards from the same
 * site in one feed is exactly when a near-match reads as a repost.
 */
export const SECTION_ART: Record<string, SectionArt> = {
  home: { draw: theRecord, ground: "navy", accent: "#f3d179" },
  officials: { draw: directory, ground: "ink", accent: "#86b7ff" },
  "state-reps": { draw: statehouse, ground: "navy", accent: "#68d9ad" },
  about: { draw: standards, ground: "slate", accent: "#d6dee8" },
  authority: { draw: authority, ground: "ink", accent: "#f3d179" },
  attorneys: { draw: legal, ground: "slate", accent: "#68d9ad" },
  media: { draw: media, ground: "navy", accent: "#ff9f6b" },
  "public-safety": { draw: publicSafety, ground: "crimson", accent: "#ff6b6b" },
  "predator-watch": { draw: registry, ground: "crimson", accent: "#ffb4b4" },
  "east-texas": { draw: eastTexas, ground: "forest", accent: "#f3d179" },
  "home-district": { draw: homeDistrict, ground: "crimson", accent: "#ff8a6b" },
  "home-district-roster": { draw: roster, ground: "ink", accent: "#86b7ff" },
  coverage: { draw: coverage, ground: "forest", accent: "#68d9ad" },
  "sales-rep-signal": { draw: consent, ground: "slate", accent: "#9fb8d4" },
  vendortrust: { draw: vendorTrust, ground: "navy", accent: "#8fd0ff" },
};

/** Sections this module can draw. Adding a page means adding a motif here. */
export const SECTION_ART_IDS = Object.keys(SECTION_ART);

export function hasSectionArt(id: string) {
  return id in SECTION_ART;
}

/**
 * The section's drawing as a standalone SVG document, encoded for an
 * `<img src>`.
 *
 * Returns null rather than a default for an unknown id. A silent fallback is
 * how `/home-district` came to ship the homepage's picture: the route accepted
 * an id it had no entry for and drew something else without complaint. The
 * caller has to decide what to do about a gap it can see.
 */
/**
 * Raise every opacity in generated markup toward 1.
 *
 * The card lays a gradient scrim over this drawing that runs from 0.97 alpha
 * on the left, under the headline, to 0.66 on the right. A motif drawn at the
 * opacities that read well on their own disappears almost entirely under it.
 * Only ever applied to markup this module produced, where each `*-opacity`
 * value is a number it wrote itself.
 */
function brighten(markup: string, factor: number) {
  return markup.replace(/-opacity="([\d.]+)"/g, (whole, value: string) => {
    const raised = Math.min(1, Number(value) * factor);
    return Number.isFinite(raised) ? whole.replace(value, raised.toFixed(3)) : whole;
  });
}

export function sectionArtDataUri(id: string): string | null {
  const art = SECTION_ART[id];
  if (!art) return null;

  const palette: Palette = { ...GROUNDS[art.ground], accent: art.accent };
  const key = `rw-sec-${id.replace(/[^a-z0-9]/gi, "")}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="${key}-wash" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.mid}"/>
        <stop offset="72%" stop-color="${palette.base}"/>
      </linearGradient>
      <pattern id="${key}-dots" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="${palette.accent}" fill-opacity="0.08"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${key}-wash)"/>
    <rect width="${W}" height="${H}" fill="url(#${key}-dots)"/>
    ${brighten(art.draw(palette), 2.1)}
    <rect x="0" y="0" width="${W}" height="5" fill="${palette.accent}" fill-opacity="0.9"/>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
