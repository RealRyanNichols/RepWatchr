import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sharedThumbnailPath = "src/components/shared/EditorialThumbnail.tsx";
const allowedExemptions = new Set(["brand", "micro-avatar", "detail-portrait"]);
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function fail(message) {
  failures.push(message);
}

function requireMatch(source, pattern, message) {
  if (!pattern.test(source)) fail(message);
}

function componentSection(source, anchor) {
  const start = source.indexOf(anchor);
  if (start < 0) return "";

  const remainder = source.slice(start + anchor.length);
  const nextComponent = remainder.search(
    /\n(?:export\s+default\s+|export\s+)?function\s+[A-Z][A-Za-z0-9_]*\s*\(/,
  );
  return nextComponent < 0
    ? source.slice(start)
    : source.slice(start, start + anchor.length + nextComponent);
}

function walkTsx(relativeDir, files = []) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return files;

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      walkTsx(relativePath, files);
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(relativePath.replaceAll(path.sep, "/"));
    }
  }

  return files;
}

const newsDirectory = path.join(root, "src/data/news");
if (fs.existsSync(newsDirectory)) {
  for (const entry of fs.readdirSync(newsDirectory)) {
    if (!entry.endsWith(".json")) continue;
    const article = JSON.parse(fs.readFileSync(path.join(newsDirectory, entry), "utf8"));
    if (article.editorialStatus !== "approved" || article.sourceStatus !== "source_linked") continue;

    const message = typeof article.thumbnailMessage === "string"
      ? article.thumbnailMessage.replace(/\s+/g, " ").trim()
      : "";
    if (!message) {
      fail(`${entry} is public but has no thumbnailMessage.`);
    } else if (message.length > 80 || message.split(" ").length > 12) {
      fail(`${entry} thumbnailMessage is not short enough for a thumbnail.`);
    }
  }
}

if (!exists(sharedThumbnailPath)) {
  fail(`Missing required editorial thumbnail component: ${sharedThumbnailPath}`);
} else {
  const sharedThumbnail = read(sharedThumbnailPath);
  requireMatch(
    sharedThumbnail,
    /\bmessage\s*:\s*string\s*;/,
    "EditorialThumbnail must require a message: string prop.",
  );
  requireMatch(
    sharedThumbnail,
    /data-editorial-thumbnail/,
    "EditorialThumbnail root must expose data-editorial-thumbnail for runtime QA.",
  );
  requireMatch(
    sharedThumbnail,
    /data-thumbnail-headline\s*=\s*\{\s*message\s*\}/,
    "EditorialThumbnail must expose its message through data-thumbnail-headline.",
  );
  requireMatch(
    sharedThumbnail,
    /\{\s*(?:message|displayMessage|shortMessage)\s*\}/,
    "EditorialThumbnail must visibly render its reader-facing message.",
  );
  if (/\bmessage\s*\?\s*:/.test(sharedThumbnail)) {
    fail("EditorialThumbnail message must not be optional.");
  }
}

const editorialVisualsPath = "src/lib/editorial-visuals.ts";
if (!exists(editorialVisualsPath)) {
  fail(`Missing editorial message normalizer: ${editorialVisualsPath}`);
} else {
  const editorialVisuals = read(editorialVisualsPath);
  requireMatch(
    editorialVisuals,
    /toEditorialThumbnailMessage/,
    "Editorial visual helper must normalize thumbnail messages.",
  );
  requireMatch(
    editorialVisuals,
    /DEFAULT_MAX_WORDS/,
    "Editorial visual helper must cap thumbnail message words.",
  );
  requireMatch(
    editorialVisuals,
    /DEFAULT_MAX_CHARACTERS/,
    "Editorial visual helper must cap thumbnail message characters.",
  );
}

const recordVisualPath = "src/components/shared/RecordVisual.tsx";
if (!exists(recordVisualPath)) {
  fail(`Missing existing graphic preview component: ${recordVisualPath}`);
} else {
  const recordVisual = read(recordVisualPath);
  requireMatch(
    recordVisual,
    /\btitle\s*:\s*string\s*;/,
    "RecordVisual must continue to require a title.",
  );
  requireMatch(
    recordVisual,
    /\{\s*clampTitle\(title\)\s*\}/,
    "RecordVisual must visibly render its title.",
  );
}

const editorialPhotoSurfaces = [
  {
    file: "src/app/feed/page.tsx",
    anchor: "function FeedMedia(",
    label: "FeedMedia",
  },
  {
    file: "src/app/page.tsx",
    anchor: "function HomeStoryVisual(",
    label: "HomeStoryVisual",
  },
  {
    file: "src/components/predator-watch/PredatorProfileCard.tsx",
    anchor: "export default function PredatorProfileCard(",
    label: "PredatorProfileCard",
  },
];

for (const surface of editorialPhotoSurfaces) {
  if (!exists(surface.file)) {
    fail(`Missing editorial preview surface: ${surface.file}`);
    continue;
  }

  const source = read(surface.file);
  const section = componentSection(source, surface.anchor);
  if (!section) {
    fail(`Could not find ${surface.label} in ${surface.file}`);
    continue;
  }
  if (!section.includes("<EditorialThumbnail")) {
    fail(`${surface.label} must render photos through EditorialThumbnail.`);
  }
  if (!/\bmessage\s*=/.test(section)) {
    fail(`${surface.label} must pass a reader-facing message to EditorialThumbnail.`);
  }
}

const editorialPhotoFiles = [
  {
    file: "src/app/state-reps/page.tsx",
    label: "State representatives face strip",
  },
];

for (const surface of editorialPhotoFiles) {
  if (!exists(surface.file)) {
    fail(`Missing editorial preview surface: ${surface.file}`);
    continue;
  }
  const source = read(surface.file);
  if (!source.includes("<EditorialThumbnail")) {
    fail(`${surface.label} must render card photography through EditorialThumbnail.`);
  }
  if (!/\bmessage\s*=/.test(source)) {
    fail(`${surface.label} must pass a reader-facing message to EditorialThumbnail.`);
  }
}

const graphicPreviewSurfaces = [
  {
    file: "src/app/news/page.tsx",
    anchor: "function ArticleCard(",
    label: "News ArticleCard",
  },
  {
    file: "src/app/blog/page.tsx",
    anchor: "function ArticleCard(",
    label: "Blog ArticleCard",
  },
];

for (const surface of graphicPreviewSurfaces) {
  if (!exists(surface.file)) {
    fail(`Missing editorial preview surface: ${surface.file}`);
    continue;
  }

  const section = componentSection(read(surface.file), surface.anchor);
  if (!section) {
    fail(`Could not find ${surface.label} in ${surface.file}`);
    continue;
  }

  const usesEditorialThumbnail =
    section.includes("<EditorialThumbnail") && /\bmessage\s*=/.test(section);
  const usesRecordVisual =
    section.includes("<RecordVisual") && /\btitle\s*=/.test(section);
  if (!usesEditorialThumbnail && !usesRecordVisual) {
    fail(`${surface.label} needs a visible message through EditorialThumbnail or RecordVisual.`);
  }
}

for (const file of walkTsx("src")) {
  const source = read(file);

  for (const match of source.matchAll(/data-thumbnail-exempt\s*=\s*["']([^"']+)["']/g)) {
    if (!allowedExemptions.has(match[1])) {
      fail(
        `${file} uses unsupported data-thumbnail-exempt="${match[1]}"; ` +
          `allowed values are ${[...allowedExemptions].join(", ")}.`,
      );
    }
  }

  for (const match of source.matchAll(/<EditorialThumbnail\b[\s\S]*?(?:\/>|>)/g)) {
    if (!/\bmessage\s*=/.test(match[0])) {
      fail(`${file} renders EditorialThumbnail without a message prop.`);
    }
    if (/\bmessage\s*=\s*(?:\{\s*["']\s*["']\s*\}|["']\s*["'])/.test(match[0])) {
      fail(`${file} renders EditorialThumbnail with an empty literal message.`);
    }
  }

  for (const match of source.matchAll(/<RecordVisual\b[\s\S]*?\/>/g)) {
    if (!/\btitle\s*=/.test(match[0])) {
      fail(`${file} renders RecordVisual without a title prop.`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Editorial thumbnail headline smoke checks passed.");
