import { getAllScoreCards, getIssueCategories, getScoreCardGateReport } from "@/lib/data";
import { hasIssueArt, issueArtDataUri, issueArtInnerSvg } from "@/lib/issue-art";
import { hasStandardArt, standardArtInnerSvg } from "@/lib/standard-art";
import { computeCategoryScore, computeOverallScore, letterGradeBands } from "@/lib/vote-record-score";
import type { ScoredVote } from "@/types";

/**
 * Checks the published vote-record model against the data actually on disk.
 *
 * Three things the smoke cannot see by reading source: the gate report agrees
 * with what getAllScoreCards publishes, the weighted arithmetic behaves the way
 * /methodology describes it, and the letter bands the page prints come out of
 * the grading function rather than being retyped beside it.
 */

const problems: string[] = [];

const gate = getScoreCardGateReport();
const published = getAllScoreCards();

if (gate.published !== published.length) {
  problems.push(
    `The gate report claims ${gate.published} publishable scorecards but getAllScoreCards returned ${published.length}.`,
  );
}
if (gate.onFile !== gate.published + gate.withheldTotal) {
  problems.push(
    `The gate report does not account for every file: ${gate.onFile} on file, ${gate.published} published, ${gate.withheldTotal} withheld.`,
  );
}

/** Weighted alignment, not a plain count: a weight-10 vote must outweigh a weight-1 vote. */
function vote(officialVote: ScoredVote["officialVote"], position: "yea" | "nay", weight: number): ScoredVote {
  return {
    billId: `probe-${officialVote}-${weight}`,
    billTitle: "probe",
    session: "probe",
    date: "2026-01-01",
    officialVote,
    proEastTexasPosition: position,
    aligned: officialVote === position,
    explanation: "probe",
    category: "probe",
    weight,
  };
}

const weighted = computeCategoryScore([vote("yea", "yea", 10), vote("nay", "yea", 1)]);
if (weighted?.score !== 91) {
  problems.push(`Weighted alignment is wrong: 10 aligned against 1 misaligned should score 91, got ${weighted?.score}.`);
}

const unweightedWouldBe50 = computeCategoryScore([vote("yea", "yea", 1), vote("nay", "yea", 1)]);
if (unweightedWouldBe50?.score !== 50) {
  problems.push(`Equal weights should split evenly, got ${unweightedWouldBe50?.score}.`);
}

/** An absence is not a wrong vote. It leaves the score alone and is reported separately. */
const withAbsence = computeCategoryScore([vote("yea", "yea", 5), vote("absent", "yea", 5)]);
if (withAbsence?.score !== 100 || withAbsence.unscoreableVotes !== 1) {
  problems.push(
    `An absence must not be scored as a misaligned vote: got score ${withAbsence?.score} with ${withAbsence?.unscoreableVotes} unscoreable.`,
  );
}

if (computeCategoryScore([]) !== null) {
  problems.push("A category with no votes must return null, not a zero.");
}

/** A stored `aligned: true` on a vote that does not match the position must not count. */
const lying = { ...vote("nay", "yea", 5), aligned: true };
if (computeCategoryScore([lying])?.score !== 0) {
  problems.push("computeCategoryScore trusted the stored `aligned` flag instead of comparing the vote to the position.");
}

/** Categories with no reviewed votes drop out of the mean rather than scoring zero. */
const emptyCategory = { score: 0, letterGrade: "NR", votes: [] as ScoredVote[], weight: 20 };
const overall = computeOverallScore(
  {
    waterRights: { ...emptyCategory, votes: [vote("yea", "yea", 5)] },
    landAndPropertyRights: emptyCategory,
    taxes: emptyCategory,
    governmentTransparency: emptyCategory,
    votingRecord: emptyCategory,
  },
  [{ id: "water-rights", name: "Water Rights", description: "", icon: "", weight: 20, color: "#000" }],
);
if (overall?.score !== 100 || overall.scoredCategories !== 1) {
  problems.push(
    `One perfect category and four empty ones should read 100 over 1 scored category, got ${overall?.score} over ${overall?.scoredCategories}.`,
  );
}

const bands = letterGradeBands();
const top = bands[0];
const bottom = bands[bands.length - 1];
if (top?.max !== 100 || bottom?.min !== 0) {
  problems.push(`Letter bands do not cover 0-100: top ends at ${top?.max}, bottom starts at ${bottom?.min}.`);
}
// The scorecard scale is deliberately strict; 80 is a C, not a B.
const bandFor = (score: number) => bands.find((band) => score >= band.min && score <= band.max)?.grade;
if (bandFor(80) !== "C") {
  problems.push(`The strict scorecard scale should read 80 as a C, got ${bandFor(80)}.`);
}

/**
 * Every category must actually draw something.
 *
 * Checking that a motif is *registered* is not enough — a motif can be
 * registered and return an empty string, which is the flat coloured box this
 * work set out to replace. So render each one and require real geometry on top
 * of the two ground rects the wrapper always emits.
 */
const issueCategories = getIssueCategories();
const drawn: Record<string, number> = {};
for (const category of issueCategories) {
  if (!hasIssueArt(category.id)) {
    problems.push(`Issue category "${category.id}" has no motif, so its card renders as an empty box.`);
    continue;
  }
  const markup = issueArtInnerSvg(category.id, category.color);
  // Shapes beyond the wash, the dot pattern and the accent rule the wrapper draws.
  const shapes = (markup.match(/<(rect|path|circle|line|polygon)\b/g) ?? []).length - 3;
  drawn[category.id] = shapes;
  if (shapes < 4) {
    problems.push(`Issue motif "${category.id}" draws only ${shapes} shapes; that is a coloured box, not artwork.`);
  }
  if (!markup.includes(category.color)) {
    problems.push(`Issue motif "${category.id}" ignores the category accent colour ${category.color}.`);
  }
  const dataUri = issueArtDataUri(category.id, category.color);
  if (!dataUri.startsWith("data:image/svg+xml;base64,") || dataUri.length < 600) {
    problems.push(`Issue share artwork for "${category.id}" did not encode to a usable data URI.`);
  }
}

for (const id of ["source-standard", "review-status", "coverage-area"]) {
  if (!hasStandardArt(id)) {
    problems.push(`Editorial standards card "${id}" has no motif.`);
    continue;
  }
  const markup = standardArtInnerSvg(id);
  const shapes = (markup.match(/<(rect|path|circle|line|polygon)\b/g) ?? []).length - 1;
  drawn[id] = shapes;
  if (shapes < 4) {
    problems.push(`Standards motif "${id}" draws only ${shapes} shapes; that is a coloured box, not artwork.`);
  }
}

console.log(
  JSON.stringify({
    gate,
    publishedScorecards: published.length,
    bands: bands.map((band) => `${band.grade} ${band.min}-${band.max}`),
    drawn,
    problems,
  }),
);
