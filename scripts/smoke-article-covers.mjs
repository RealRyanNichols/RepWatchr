import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Every article card has to show a graphic.
 *
 * The homepage lead once rendered as an empty gradient box because the leading
 * article shipped without an imageUrl and the fallback drew nothing. These
 * assertions cover both halves of that: photos that exist, and generated cover
 * art for every article that has no photo.
 */

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => {
  if (!condition) {
    console.error(`Article cover smoke failed: ${message}`);
    process.exit(1);
  }
};

const thumbnail = read("src/components/news/ArticleThumbnail.tsx");
const cover = read("src/components/news/GeneratedCover.tsx");
const coverLib = read("src/lib/generated-cover.ts");
const coverMarkup = read("src/lib/generated-cover-markup.ts");
const thumbnailCss = read("src/components/news/ArticleThumbnail.module.css");
const articleOg = read("src/lib/article-og.tsx");
const ogRoute = read("src/app/api/og/news/route.tsx");

// The no-photo branch draws generated art, not an empty box.
const fallbackBranch = thumbnail.slice(thumbnail.indexOf("hasPhoto && article.imageUrl ? ("));
assert(
  fallbackBranch.includes("<GeneratedCover"),
  "ArticleThumbnail no longer renders GeneratedCover when an article has no photo.",
);
assert(
  !/<div className=\{styles\.backdrop\}/.test(thumbnail),
  "ArticleThumbnail is back to drawing a bare gradient div instead of cover art.",
);
assert(
  thumbnail.includes('data-thumbnail-visual={hasPhoto ? "photo" : "generated"}'),
  "ArticleThumbnail stopped labelling which visual it drew, so this regression becomes invisible again.",
);
assert(
  thumbnailCss.includes(".generated .shade"),
  "The lighter wash for generated covers is gone; artwork will be buried under the photo-strength shade.",
);

// Cover art is keyed off the article, so a story always draws the same graphic.
assert(
  thumbnail.includes("coverKey={article.id || article.title}"),
  "GeneratedCover is no longer keyed off a stable article identity.",
);

// Every motif the library can pick has a component behind it.
const motifList = coverLib.match(/export const COVER_MOTIFS = \[([^\]]+)\]/);
assert(motifList, "COVER_MOTIFS is missing from the generated-cover library.");
const motifs = [...motifList[1].matchAll(/"([a-z]+)"/g)].map((match) => match[1]);
assert(motifs.length >= 4, `Only ${motifs.length} cover motifs are defined; cards will look repetitive.`);
const registry = coverMarkup.slice(
  coverMarkup.indexOf("const MOTIF_MARKUP"),
  coverMarkup.indexOf("export function generatedCoverInnerSvg"),
);
for (const motif of motifs) {
  assert(
    new RegExp(`\\b${motif}[,:]`).test(registry),
    `Motif "${motif}" can be selected but has no drawing in MOTIF_MARKUP, so its cards render blank.`,
  );
}

// One artwork module, drawn by both the page card and the share card, so they
// can never drift apart.
assert(
  cover.includes("generatedCoverInnerSvg"),
  "The article card no longer draws from the shared cover-art module.",
);
assert(
  articleOg.includes("generatedCoverDataUri"),
  "The share image no longer draws the same cover art as the article card.",
);
assert(
  !articleOg.includes("washington-accountability-blue-hour"),
  "The share image is back to falling back on a Washington photo, so local stories share as the Capitol.",
);
assert(
  ogRoute.includes("coverKey: article.id || article.title"),
  "The share-image route stopped passing the article identity, so its art no longer matches the page card.",
);

// Every palette a scope can resolve to actually exists.
const paletteNames = [...coverLib.matchAll(/return "([A-Za-z]+)";/g)].map((match) => match[1]);
assert(paletteNames.length > 0, "No palettes are selected by scope in the generated-cover library.");
for (const name of paletteNames) {
  assert(
    new RegExp(`^\\s{2}${name}: \\{`, "m").test(coverLib),
    `Scope resolves to palette "${name}" but COVER_PALETTES has no such entry.`,
  );
}

// Article data: a photo path must point at a file that is actually shipped.
const newsDir = join(root, "src/data/news");
const files = readdirSync(newsDir).filter((name) => name.endsWith(".json"));
assert(files.length > 0, "No article records were found to check.");

let photos = 0;
let generated = 0;
for (const file of files) {
  const article = JSON.parse(readFileSync(join(newsDir, file), "utf8"));
  const imageUrl = article.imageUrl;
  if (!imageUrl) {
    generated += 1;
    assert(
      typeof article.id === "string" && article.id.length > 0,
      `${file} has no photo and no id, so its cover art cannot be keyed to the story.`,
    );
    continue;
  }
  photos += 1;
  if (imageUrl.startsWith("/")) {
    assert(
      existsSync(join(root, "public", imageUrl)),
      `${file} points at ${imageUrl}, which is not in public/. That card renders a broken image.`,
    );
  }
}

console.log(
  `Article cover smoke passed: ${files.length} articles checked (${photos} photos on disk, ${generated} drawing generated cover art).`,
);
