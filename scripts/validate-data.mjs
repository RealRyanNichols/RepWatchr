import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "src", "data");
const errors = [];
const warnings = [];

function collectJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectJsonFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${relative(filePath)} is not valid JSON: ${error.message}`);
    return undefined;
  }
}

function relative(filePath) {
  return path.relative(root, filePath);
}

function requireString(value, label, filePath) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${relative(filePath)} is missing ${label}`);
  }
}

function validateNoQuarantinedTerms() {
  const publicDirs = ["src/app", "src/components", "src/data", "src/lib"];
  const blocked = [
    "HB 1750",
    "hb-1750",
    "112-35",
    "5% cap",
    "800-1,200",
    "800\u20131,200",
  ];

  for (const publicDir of publicDirs) {
    const absoluteDir = path.join(root, publicDir);
    if (!fs.existsSync(absoluteDir)) continue;
    for (const filePath of collectPublicFiles(absoluteDir)) {
      const text = fs.readFileSync(filePath, "utf8");
      for (const term of blocked) {
        if (text.includes(term)) {
          errors.push(`${relative(filePath)} contains quarantined term "${term}"`);
        }
      }
    }
  }
}

function collectPublicFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectPublicFiles(fullPath);
    if (!entry.isFile()) return [];
    return /\.(json|ts|tsx|js|jsx|mdx?)$/.test(entry.name) ? [fullPath] : [];
  });
}

function validateVotes() {
  const votesDir = path.join(dataDir, "votes");
  for (const filePath of collectJsonFiles(votesDir)) {
    const vote = readJson(filePath);
    if (!vote) continue;
    requireString(vote.id, "id", filePath);
    requireString(vote.title, "title", filePath);
    requireString(vote.sourceUrl, "sourceUrl", filePath);
  }
}

function validateScorecards() {
  const voteIds = new Set(
    collectJsonFiles(path.join(dataDir, "votes"))
      .map(readJson)
      .filter(Boolean)
      .map((vote) => vote.id)
  );

  for (const filePath of collectJsonFiles(path.join(dataDir, "scores"))) {
    const scorecard = readJson(filePath);
    if (!scorecard?.categories) continue;

    for (const [categoryName, category] of Object.entries(scorecard.categories)) {
      for (const scoredVote of category.votes ?? []) {
        if (!voteIds.has(scoredVote.billId)) {
          warnings.push(
            `${relative(filePath)} ${categoryName} references missing billId "${scoredVote.billId}"`
          );
        }
      }
    }
  }
}

function validateNews() {
  const allowedStatuses = new Set([
    "draft",
    "needs_source_review",
    "approved",
    "quarantined",
  ]);

  for (const filePath of collectJsonFiles(path.join(dataDir, "news"))) {
    const article = readJson(filePath);
    if (!article) continue;

    requireString(article.id, "id", filePath);
    requireString(article.title, "title", filePath);

    if (article.reviewStatus && !allowedStatuses.has(article.reviewStatus)) {
      errors.push(
        `${relative(filePath)} must set reviewStatus to draft, needs_source_review, approved, or quarantined`
      );
    }

    if (article.reviewStatus === "approved") {
      requireString(article.sourceName, "sourceName", filePath);
      requireString(article.sourceUrl, "sourceUrl", filePath);
    }
  }
}

validateNoQuarantinedTerms();
validateVotes();
validateScorecards();
validateNews();

if (errors.length > 0) {
  console.error("Data validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn("Data validation warnings:");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

console.log("Data validation passed.");
