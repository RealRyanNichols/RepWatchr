import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const read = (file) => readFileSync(file, "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sources = read("src/data/daily-news-watch-sources.ts").toLowerCase();
const social = read("src/lib/social-autopost.ts").toLowerCase();
const ingestion = read("src/lib/daily-news-clips.ts");
const ranking = read("src/lib/editorial-ranking.ts");
const data = read("src/lib/data.ts");
const schoolBoardPage = read("src/app/school-boards/[districtSlug]/[candidateId]/page.tsx");
const currentArticle = JSON.parse(read("src/data/news/health-care-costs-midterms-2026.json"));

for (const name of ["tim burchett", "jonathan gross", "jon_gross"]) {
  assert(!sources.includes(name), `Named-person source lane remains: ${name}`);
  assert(!social.includes(name), `Named-person social boost remains: ${name}`);
}

for (const removedHook of ["high_attention_terms", "sourcecredit) score +=", "sourcecredit) score +="]) {
  assert(!social.includes(removedHook), `Removed social ranking hook remains: ${removedHook}`);
}

assert(
  !ingestion.includes("return [source.sourceCredit.name]"),
  "A credited source can still bypass topic matching.",
);
assert(
  data.includes('article.editorialStatus === "approved"') &&
    data.includes('article.sourceStatus === "source_linked"'),
  "Public story loading must require editorial approval and a linked source.",
);
assert(ranking.includes("primary_sources:") && ranking.includes("independent_publishers:"), "Disclosed rank factors are missing.");
assert(ranking.includes("maxPerOfficial") && ranking.includes("maxPerTopic"), "Editorial diversity caps are missing.");
assert(!/article\.(?:party|author)|official\.name|sourcecredit/i.test(ranking), "Editorial ranking reads a prohibited identity or attribution field.");

assert(!schoolBoardPage.includes("Model score"), "School-board page still presents the retired model score.");
assert(!schoolBoardPage.includes("Political lean"), "School-board page still infers a public political lean.");
assert(!existsSync("src/lib/repwatchr-algorithm.ts"), "Owner-locked moral algorithm still exists.");
assert(!existsSync("src/lib/constitutional-alignment.ts"), "Universal constitutional scoring still exists.");
assert(!existsSync("src/lib/school-board-scoring.ts"), "Retired school-board ideological scoring still exists.");

const newsDir = "src/data/news";
for (const file of readdirSync(newsDir).filter((name) => name.endsWith(".json"))) {
  const article = JSON.parse(read(path.join(newsDir, file)));
  if (article.sourceStatus === "source_linked") {
    assert(article.editorialStatus === "approved", `${file} is source-linked but not explicitly approved.`);
  }
}

assert(!existsSync(path.join(newsDir, "tim-burchett-uap-transparency-watch-2026.json")), "Removed promotional story still exists.");
assert(!existsSync(path.join(newsDir, "uap-file-dump-congress-attention-2026.json")), "Removed promotional story still exists.");
assert(currentArticle.editorialStatus === "approved", "Current midterm article is not approved.");
assert(currentArticle.publicPostEmbeds?.[0]?.url?.startsWith("https://x.com/"), "Current midterm article is missing its native public-post source.");

const factualRoster = read("src/data/officials/federal/us-house-tn2.json");
assert(factualRoster.includes('"name": "Tim Burchett"'), "Neutrality cleanup removed the ordinary factual roster record.");

console.log("Editorial neutrality smoke check passed.");
