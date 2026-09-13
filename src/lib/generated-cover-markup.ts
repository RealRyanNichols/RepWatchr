import { coverArtFor, coverHash, starPoints, type CoverArtInput, type CoverPalette } from "@/lib/generated-cover";

/**
 * Cover art for articles that ship without a photograph, as SVG markup.
 *
 * This is the single source of truth for the artwork. The article card renders
 * it inline; the share image inlines the same bytes as a data URI, so the card
 * a reader sees on the page and the card they see when someone shares it are
 * the same graphic. Markup rather than JSX because the App Router will not let
 * a route import react-dom/server.
 *
 * The motifs stay in the record family - documents, ballots, district maps, the
 * Capitol, the seal, the star. Artwork only: the location chip and headline are
 * drawn over it as real text.
 */

export const COVER_VIEWBOX = "0 0 1200 630";
export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 630;

/** Nudges placement so two cards sharing a motif still differ. */
const VARIANT_SHIFT = [0, -48, 42];

type MotifInput = { palette: CoverPalette; variant: number };

function ledger({ palette, variant }: MotifInput) {
  const accent = palette.accent;
  const lines = [246, 214, 236, 182, 224, 196];
  const sheet = (x: number, y: number, fill: number, stroke: number, rotate: string) =>
    `<rect x="${x}" y="${y}" width="318" height="416" rx="4" fill="${accent}" fill-opacity="${fill}" stroke="${accent}" stroke-opacity="${stroke}" stroke-width="2" transform="${rotate}"/>`;
  return `<g transform="translate(${VARIANT_SHIFT[variant] - 40} 0)">
    ${sheet(700, 22, 0.05, 0.16, "rotate(-9 859 230)")}
    ${sheet(728, 42, 0.07, 0.22, "rotate(-4 887 250)")}
    <g transform="rotate(3 915 270)">
      <rect x="756" y="62" width="318" height="416" rx="4" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-opacity="0.34" stroke-width="2.5"/>
      <rect x="786" y="98" width="182" height="13" fill="${accent}" fill-opacity="0.52"/>
      ${lines
        .map(
          (width, index) =>
            `<rect x="786" y="${142 + index * 38}" width="${width}" height="7" rx="3.5" fill="${accent}" fill-opacity="${index === 3 ? 0.5 : 0.2}"/>`,
        )
        .join("")}
    </g>
  </g>`;
}

function star({ palette, variant }: MotifInput) {
  const accent = palette.accent;
  const cx = 862 + VARIANT_SHIFT[variant];
  const cy = 248;
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="262" fill="none" stroke="${accent}" stroke-opacity="0.1" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="228" fill="none" stroke="${accent}" stroke-opacity="0.17" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="216" fill="none" stroke="${accent}" stroke-opacity="0.09" stroke-width="1.5"/>
    <polygon points="${starPoints(cx, cy, 185, 74)}" fill="${accent}" fill-opacity="0.09" stroke="${accent}" stroke-opacity="0.44" stroke-width="4" stroke-linejoin="round"/>
  </g>`;
}

function dome({ palette, variant }: MotifInput) {
  const accent = palette.accent;
  const columns = [0, 1, 2, 3, 4, 5, 6]
    .map(
      (index) =>
        `<rect x="${676 + index * 67}" y="312" width="25" height="96" fill="${accent}" fill-opacity="0.2"/>`,
    )
    .join("");
  return `<g transform="translate(${VARIANT_SHIFT[variant] - 34} 0)">
    <rect x="628" y="430" width="530" height="14" fill="${accent}" fill-opacity="0.16"/>
    <rect x="650" y="412" width="486" height="14" fill="${accent}" fill-opacity="0.22"/>
    ${columns}
    <rect x="660" y="291" width="466" height="21" fill="${accent}" fill-opacity="0.28"/>
    <rect x="792" y="222" width="202" height="70" fill="${accent}" fill-opacity="0.16"/>
    <path d="M792 224 C792 100 994 100 994 224 Z" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-opacity="0.4" stroke-width="3"/>
    <rect x="882" y="148" width="22" height="38" fill="${accent}" fill-opacity="0.3"/>
    <polygon points="${starPoints(893, 120, 27, 11)}" fill="${accent}" fill-opacity="0.55"/>
  </g>`;
}

function ballot({ palette, variant }: MotifInput) {
  const accent = palette.accent;
  const widths = [252, 212, 278, 198, 240];
  const marked = variant + 1;
  const rows = widths
    .map((width, index) => {
      const y = 88 + index * 76;
      const isMarked = index === marked;
      const check = isMarked
        ? `<path d="M730 ${y + 23} L739 ${y + 33} L755 ${y + 11}" fill="none" stroke="${accent}" stroke-opacity="0.85" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
        : "";
      return `<g>
        <rect x="720" y="${y}" width="44" height="44" rx="3" fill="${accent}" fill-opacity="${isMarked ? 0.18 : 0}" stroke="${accent}" stroke-opacity="0.36" stroke-width="3"/>
        ${check}
        <rect x="788" y="${y + 13}" width="${width}" height="18" rx="4" fill="${accent}" fill-opacity="${isMarked ? 0.3 : 0.12}"/>
      </g>`;
    })
    .join("");
  return `<g transform="translate(${VARIANT_SHIFT[variant] / 2 - 30} 0)">${rows}</g>`;
}

function districtMap({ palette, variant }: MotifInput) {
  const accent = palette.accent;
  const cx = 858 + VARIANT_SHIFT[variant];
  const cy = 248;
  const grid = [
    ...Array.from({ length: 16 }, (_, index) => `<line x1="${index * 75}" y1="0" x2="${index * 75}" y2="630"/>`),
    ...Array.from({ length: 9 }, (_, index) => `<line x1="0" y1="${index * 70}" x2="1200" y2="${index * 70}"/>`),
  ].join("");
  const shape = `${cx - 182},108 ${cx + 66},80 ${cx + 190},182 ${cx + 164},324 ${cx + 13},422 ${cx - 146},376 ${cx - 217},250`;
  return `<g>
    <g stroke="${accent}" stroke-opacity="0.07" stroke-width="1.5">${grid}</g>
    <polygon points="${shape}" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-opacity="0.46" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="43" fill="none" stroke="${accent}" stroke-opacity="0.18" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="24" fill="none" stroke="${accent}" stroke-opacity="0.42" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="10" fill="${accent}" fill-opacity="0.85"/>
  </g>`;
}

function seal({ palette, variant }: MotifInput) {
  const accent = palette.accent;
  const cx = 860 + VARIANT_SHIFT[variant];
  const cy = 244;
  const ticks = Array.from({ length: 36 }, (_, index) => {
    const angle = (index * 10 * Math.PI) / 180;
    return `<line x1="${(cx + 190 * Math.cos(angle)).toFixed(1)}" y1="${(cy + 190 * Math.sin(angle)).toFixed(1)}" x2="${(cx + 213 * Math.cos(angle)).toFixed(1)}" y2="${(cy + 213 * Math.sin(angle)).toFixed(1)}"/>`;
  }).join("");
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="218" fill="none" stroke="${accent}" stroke-opacity="0.13" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="184" fill="none" stroke="${accent}" stroke-opacity="0.32" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="136" fill="${accent}" fill-opacity="0.05" stroke="${accent}" stroke-opacity="0.14" stroke-width="1.5"/>
    <g stroke="${accent}" stroke-opacity="0.3" stroke-width="3" stroke-linecap="round">${ticks}</g>
    <polygon points="${starPoints(cx, cy, 87, 35)}" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-opacity="0.44" stroke-width="3" stroke-linejoin="round"/>
  </g>`;
}

const MOTIF_MARKUP = {
  ledger,
  star,
  dome,
  ballot,
  map: districtMap,
  seal,
} as const;

/** Everything inside the `<svg>` element: gradients, wash, motif, top rule. */
export function generatedCoverInnerSvg(input: CoverArtInput) {
  const { motif, palette, variant } = coverArtFor(input);
  const id = `rw-cover-${coverHash(`${input.key}:${motif}`).toString(36)}`;
  return {
    motif,
    id,
    markup: `<defs>
      <linearGradient id="${id}-wash" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.mid}"/>
        <stop offset="70%" stop-color="${palette.base}"/>
      </linearGradient>
      <radialGradient id="${id}-glow" cx="0.78" cy="0.16" r="0.72">
        <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="${id}-dots" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="${palette.accent}" fill-opacity="0.07"/>
      </pattern>
    </defs>
    <rect width="1200" height="630" fill="url(#${id}-wash)"/>
    <rect width="1200" height="630" fill="url(#${id}-glow)"/>
    <rect width="1200" height="630" fill="url(#${id}-dots)"/>
    ${MOTIF_MARKUP[motif]({ palette, variant })}
    <rect x="0" y="0" width="1200" height="6" fill="${palette.rule}" fill-opacity="0.9"/>`,
  };
}

/** A standalone SVG document, for embedding as a data URI in the share image. */
export function generatedCoverSvgDocument(input: CoverArtInput) {
  const { markup } = generatedCoverInnerSvg(input);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" viewBox="${COVER_VIEWBOX}">${markup}</svg>`;
}

/** The same art as a base64 data URI. Satori renders SVG images, not SVG elements. */
export function generatedCoverDataUri(input: CoverArtInput) {
  return `data:image/svg+xml;base64,${Buffer.from(generatedCoverSvgDocument(input)).toString("base64")}`;
}
