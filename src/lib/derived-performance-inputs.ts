/**
 * Scoring the dimensions that the loaded record can already answer.
 *
 * Jay Dean's profile reads "Not rated, 0% of grade weight cleared" while
 * carrying 4,507 indexed roll calls at 100% source quality. Nothing was wrong
 * with the grading model or the evidence. Every dimension simply had
 * `score: null`, because no one ever computed the number, and the gate
 * (`score !== null && coverage >= 60 && sourceQuality >= 60`) fails on that
 * alone.
 *
 * So the score is computed from the roll calls rather than typed beside them.
 * The same rule as the vote-record scorecard: a number a reader cannot
 * reproduce from the page is an assertion, not a grade.
 */

import { getPublicVoteRecord } from "@/lib/data";
import type { PerformanceDimensionInput } from "@/lib/performance-grade";

export type VotingAccountabilityDerivation = {
  score: number;
  recordedPositions: number;
  totalRollCalls: number;
  notVoting: number;
};

/**
 * Voting accountability asks, in the published method: "Did the official take
 * a documented position when eligible, regardless of whether the vote was yea
 * or nay?"
 *
 * That is participation, not agreement. A yea and a nay count identically; only
 * a missing position costs anything, which is what keeps this dimension from
 * becoming a policy score by the back door.
 *
 * The denominator is every loaded roll call, without excluding approved
 * absences, because those exclusions are not loaded yet. That makes the result
 * a FLOOR: the true figure can only be equal or higher, never lower. Erring
 * against the official rather than for them is the safe direction for a number
 * published under someone's name, and the dimension's own coverage figure
 * already discounts the confidence shown beside it.
 */
export function deriveVotingAccountability(officialId: string): VotingAccountabilityDerivation | null {
  const record = getPublicVoteRecord(officialId);
  if (!record) return null;

  const { totalVotesLoaded, yea, nay, present } = record.summary;
  if (!totalVotesLoaded || totalVotesLoaded <= 0) return null;

  const recordedPositions = yea + nay + present;
  if (recordedPositions <= 0) return null;

  return {
    score: Math.round((recordedPositions / totalVotesLoaded) * 1000) / 10,
    recordedPositions,
    totalRollCalls: totalVotesLoaded,
    notVoting: record.summary.notVoting,
  };
}

/**
 * Fill in any dimension score the loaded record can compute.
 *
 * Only dimensions with a real derivation are touched. A hand-entered score is
 * left alone, and a dimension with no derivation keeps its null so the grade
 * keeps reporting "not rated" rather than inventing a number to look complete.
 */
export function withDerivedPerformanceInputs(
  officialId: string,
  inputs: readonly PerformanceDimensionInput[],
): readonly PerformanceDimensionInput[] {
  return inputs.map((input) => {
    if (input.score !== null || input.id !== "voting_accountability") return input;

    const derived = deriveVotingAccountability(officialId);
    if (!derived) return input;

    return {
      ...input,
      score: derived.score,
      sourceCount: derived.totalRollCalls,
      note: `Participation across ${derived.totalRollCalls.toLocaleString()} indexed roll calls: ${derived.recordedPositions.toLocaleString()} recorded positions, ${derived.notVoting.toLocaleString()} with none. Approved-absence exclusions are not loaded, so this is a floor and the true figure can only be higher.`,
    };
  });
}
