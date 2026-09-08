export type CommunityPollOption = { option_id: string; label: string; display_order: number };
export type CommunityPollTotal = { option_id: string; votes: number; as_of: string | null };

/** Suppress the actual values at the API boundary, not only in the chart. */
export function getCommunityPollResults(options: CommunityPollOption[], totals: CommunityPollTotal[], minimumSample: number) {
  const validIds = new Set(options.map((option) => option.option_id));
  const validTotals = totals.filter((row) => validIds.has(row.option_id));
  if (!Number.isInteger(minimumSample) || minimumSample < 10 || minimumSample > 500 ||
      validTotals.some((row) => !Number.isSafeInteger(Number(row.votes)) || Number(row.votes) < 0) ||
      new Set(validTotals.map((row) => row.option_id)).size !== validTotals.length) {
    throw new Error("Invalid community pulse aggregate");
  }
  const votesByOption = new Map(validTotals.map((row) => [row.option_id, Number(row.votes)]));
  const responseCount = validTotals.reduce((sum, row) => sum + Number(row.votes), 0);
  if (!Number.isSafeInteger(responseCount)) throw new Error("Invalid community pulse count");
  const resultsVisible = responseCount >= minimumSample;
  return {
    responseCount,
    resultsVisible,
    asOf: resultsVisible ? validTotals.reduce<string | null>((latest, row) => row.as_of && (!latest || row.as_of > latest) ? row.as_of : latest, null) : null,
    options: options.map((option) => {
      const votes = votesByOption.get(option.option_id) ?? 0;
      return { optionId: option.option_id, label: option.label, votes: resultsVisible ? votes : null, percent: resultsVisible ? Math.round(votes / responseCount * 100) : null };
    }),
  };
}
