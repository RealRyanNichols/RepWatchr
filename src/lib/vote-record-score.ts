/**
 * The vote-record scorecard algorithm.
 *
 * This is the model behind /scorecards, /scorecards/[category] and the issue
 * pages. It is deliberately separate from two other numbers on this site:
 *
 *   - the performance grade (src/lib/performance-grade.ts, documented at
 *     /methodology) grades documented execution of the job and never reads a
 *     policy position;
 *   - participant sentiment is a self-selected community signal and is not an
 *     input to either.
 *
 * Until now the category scores and the overall number were typed into
 * src/data/scores/*.json by hand. A reader had no way to check them, and a
 * stored `aligned: true` on a vote the official did not actually cast that way
 * would have inflated a score silently. Everything published here is now
 * derived from the vote rows themselves, so the arithmetic is reproducible from
 * what the page already shows.
 */

import { calculateLetterGrade } from "@/lib/scoring";
import type { CategoryScore, IssueCategory, ScoreCard, ScoredVote } from "@/types";

export type CategoryScoreKey = keyof ScoreCard["categories"];

/**
 * The category ids in src/data/issues/categories.json and the keys used inside
 * a ScoreCard are spelled differently. Both spellings are load-bearing in URLs
 * and stored data, so the mapping lives here once instead of being re-declared
 * in every page that needs it.
 */
export const CATEGORY_KEY_BY_ISSUE_ID: Record<string, CategoryScoreKey> = {
  "water-rights": "waterRights",
  "land-and-property-rights": "landAndPropertyRights",
  taxes: "taxes",
  "government-transparency": "governmentTransparency",
  "voting-record": "votingRecord",
};

export function categoryKeyForIssueId(issueId: string): CategoryScoreKey | undefined {
  return CATEGORY_KEY_BY_ISSUE_ID[issueId];
}

/**
 * Whether a category carries a real grade.
 *
 * A card may be published with votes in only some categories. The empty ones
 * are not zeros, and every page that ranks, grades, or averages must exclude
 * them rather than reading their placeholder score.
 */
export function isScoredCategory(category: Pick<CategoryScore, "scored" | "votes">) {
  if (typeof category.scored === "boolean") return category.scored;
  // A card that never went through withDerivedScores falls back to the same
  // test rather than being assumed graded.
  return (category.votes ?? []).some(isScoreableVote);
}

/**
 * A vote counts toward a category only when the official actually took a
 * position on it. An absence is not scored as a wrong vote — it is not scored
 * at all, because "missing evidence is never converted into a zero" is the same
 * rule the performance grade runs on.
 */
export function isScoreableVote(vote: ScoredVote) {
  return vote.officialVote === "yea" || vote.officialVote === "nay";
}

/**
 * Alignment is computed, never trusted from the file. The stored `aligned`
 * field is a convenience for display; this is what moves the number.
 *
 * `proEastTexasPosition` is the scorecard's copy of the district position. It
 * is only safe to compare against because the publication gate in
 * src/lib/data.ts refuses any card whose copy disagrees with the reviewed bill
 * record — without that, a single mistyped position would silently invert a
 * vote's alignment and move every derived score.
 */
export function isAlignedVote(vote: ScoredVote) {
  return isScoreableVote(vote) && vote.officialVote === vote.proEastTexasPosition;
}

/** Weights outside 1-10 are clamped so one mistyped row cannot swamp a category. */
export function voteWeight(vote: ScoredVote) {
  const weight = Number.isFinite(vote.weight) ? vote.weight : 0;
  return Math.max(1, Math.min(10, Math.round(weight || 1)));
}

export type CategoryComputation = {
  score: number;
  letterGrade: string;
  scoreableVotes: number;
  unscoreableVotes: number;
  alignedWeight: number;
  totalWeight: number;
};

/**
 * Category score = weight of the aligned votes ÷ weight of the votes the
 * official actually cast, as a percentage. A bill carrying weight 10 moves the
 * category ten times as far as a bill carrying weight 1.
 *
 * Returns null when there is nothing to score. That is not a zero: a category
 * with no reviewed votes has no grade, and the pages say so.
 */
export function computeCategoryScore(votes: ScoredVote[]): CategoryComputation | null {
  const scoreable = votes.filter(isScoreableVote);
  if (scoreable.length === 0) return null;

  const totalWeight = scoreable.reduce((sum, vote) => sum + voteWeight(vote), 0);
  if (totalWeight === 0) return null;

  const alignedWeight = scoreable
    .filter(isAlignedVote)
    .reduce((sum, vote) => sum + voteWeight(vote), 0);
  const score = Math.round((alignedWeight / totalWeight) * 100);

  return {
    score,
    letterGrade: calculateLetterGrade(score),
    scoreableVotes: scoreable.length,
    unscoreableVotes: votes.length - scoreable.length,
    alignedWeight,
    totalWeight,
  };
}

/**
 * Overall = the category scores averaged by their declared category weight,
 * over the categories that have votes only. Categories with nothing reviewed
 * are dropped from both sides of the division rather than counted as zero, so a
 * thin record reads as a partial record instead of a bad one.
 */
export function computeOverallScore(
  categories: ScoreCard["categories"],
  issueCategories: IssueCategory[],
): { score: number; scoredCategories: number; coveredWeight: number } | null {
  const weightByKey = new Map<CategoryScoreKey, number>();
  for (const issue of issueCategories) {
    const key = categoryKeyForIssueId(issue.id);
    if (key) weightByKey.set(key, issue.weight);
  }

  let weighted = 0;
  let coveredWeight = 0;
  let scoredCategories = 0;

  for (const [key, category] of Object.entries(categories) as Array<[CategoryScoreKey, CategoryScore]>) {
    const computed = computeCategoryScore(category.votes ?? []);
    if (!computed) continue;
    // Fall back to the weight stored on the category when the issue file does
    // not name it, so a renamed category cannot silently drop out of the mean.
    const weight = weightByKey.get(key) ?? category.weight ?? 0;
    if (weight <= 0) continue;
    weighted += computed.score * weight;
    coveredWeight += weight;
    scoredCategories += 1;
  }

  if (coveredWeight === 0) return null;
  return { score: Math.round(weighted / coveredWeight), scoredCategories, coveredWeight };
}

/**
 * Rebuild a scorecard so every number on it is the arithmetic above.
 *
 * Stored scores are discarded rather than preferred. A card whose categories
 * carry no scoreable votes keeps a score of 0 but publishes nothing, because
 * the publication gate in src/lib/data.ts rejects a card with no votes before
 * this function is ever reached.
 */
export function withDerivedScores(scoreCard: ScoreCard, issueCategories: IssueCategory[]): ScoreCard {
  const categories = Object.fromEntries(
    (Object.entries(scoreCard.categories) as Array<[CategoryScoreKey, CategoryScore]>).map(
      ([key, category]) => {
        const computed = computeCategoryScore(category.votes ?? []);
        return [
          key,
          {
            ...category,
            // `scored: false` is the load-bearing part. The 0 below is a
            // placeholder, and several consumers recompute a letter from the
            // number rather than reading `letterGrade` — so an unscored
            // category that only carried "NR" would still render as an F.
            score: computed?.score ?? 0,
            letterGrade: computed?.letterGrade ?? "NR",
            scored: Boolean(computed),
          },
        ];
      },
    ),
  ) as ScoreCard["categories"];

  const overall = computeOverallScore(categories, issueCategories);

  return {
    ...scoreCard,
    categories,
    overall: overall?.score ?? 0,
    letterGrade: overall ? calculateLetterGrade(overall.score) : "NR",
  };
}

/**
 * The published letter scale, read out of calculateLetterGrade rather than
 * retyped, so the methodology page cannot drift from the code that grades.
 */
export function letterGradeBands() {
  const bands: Array<{ grade: string; min: number; max: number }> = [];
  for (let score = 0; score <= 100; score += 1) {
    const grade = calculateLetterGrade(score);
    const last = bands[bands.length - 1];
    if (last && last.grade === grade) {
      last.max = score;
    } else {
      bands.push({ grade, min: score, max: score });
    }
  }
  return bands.reverse();
}
