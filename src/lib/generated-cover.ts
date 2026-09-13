/**
 * Deterministic cover art selection for articles that ship without a photo.
 *
 * Every article gets a graphic. Nothing renders as an empty box. The motif and
 * palette are derived from the article id, so the same story always draws the
 * same art, and neighbouring cards on a page do not repeat.
 */

export const COVER_MOTIFS = ["ledger", "star", "dome", "ballot", "map", "seal"] as const;

export type CoverMotif = (typeof COVER_MOTIFS)[number];

export type CoverPalette = {
  /** Darkest corner of the background wash. */
  base: string;
  /** Lighter partner in the linear wash. */
  mid: string;
  /** Radial highlight dropped behind the motif. */
  glow: string;
  /** Structural line and fill colour for the motif. */
  accent: string;
  /** Secondary rule colour, used for the edge stripe. */
  rule: string;
};

export const COVER_PALETTES: Record<string, CoverPalette> = {
  homeDistrict: { base: "#050f1d", mid: "#0d2444", glow: "#1d4a7d", accent: "#e6c169", rule: "#d6b35a" },
  eastTexas: { base: "#05141c", mid: "#0b2a33", glow: "#1a5360", accent: "#dcae63", rule: "#c98f4a" },
  texas: { base: "#060f1e", mid: "#102440", glow: "#28527d", accent: "#d6b35a", rule: "#d6b35a" },
  national: { base: "#04101f", mid: "#0b1c38", glow: "#23406e", accent: "#cfd8e6", rule: "#cb2144" },
  breaking: { base: "#1b040c", mid: "#4a0a17", glow: "#8d1830", accent: "#f0c37a", rule: "#cb2144" },
};

export type CoverArtInput = {
  /** Stable identity for the article. The article id is the right value. */
  key: string;
  scope?: string;
  visualTheme?: string;
};

export type CoverArt = {
  motif: CoverMotif;
  palette: CoverPalette;
  paletteName: string;
  /** 0, 1 or 2. Nudges placement so two cards sharing a motif still differ. */
  variant: number;
};

/** FNV-1a, 32 bit. Stable across runtimes, which server rendering needs. */
export function coverHash(key: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function paletteNameFor(input: CoverArtInput) {
  if (input.visualTheme === "breaking") return "breaking";
  switch (input.scope) {
    case "home-district":
      return "homeDistrict";
    case "east-texas":
      return "eastTexas";
    case "texas":
      return "texas";
    case "national":
      return "national";
    default:
      return "texas";
  }
}

export function coverArtFor(input: CoverArtInput): CoverArt {
  const hash = coverHash(input.key || "repwatchr");
  const paletteName = paletteNameFor(input);
  return {
    motif: COVER_MOTIFS[hash % COVER_MOTIFS.length],
    palette: COVER_PALETTES[paletteName],
    paletteName,
    variant: Math.floor(hash / COVER_MOTIFS.length) % 3,
  };
}

/** Points for a five-point star, written for an SVG `polygon`. */
export function starPoints(cx: number, cy: number, outer: number, inner: number, rotation = -90) {
  const points: string[] = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = ((rotation + index * 36) * Math.PI) / 180;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(" ");
}
