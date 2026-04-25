// ============================================================
// RepWatchr Score Calculation Utilities
// ============================================================

export type ScoreBand = "elite" | "strong" | "mixed" | "weak" | "bad" | "terrible";

/**
 * Convert a numeric score (0-100) to a letter grade.
 *
 * RepWatchr uses a strict accountability scale. A public official should not
 * get "good" visual treatment for a barely passing record.
 */
export function calculateLetterGrade(score: number): string {
  if (score >= 98) return "A+";
  if (score >= 95) return "A";
  if (score >= 90) return "A-";
  if (score >= 85) return "B";
  if (score >= 80) return "C";
  if (score >= 70) return "D";
  return "F";
}

/**
 * The visible color is tied to the numeric score, not a stored letter grade.
 * 100 is the best green. 0 is the worst red. The curve is intentionally strict:
 * scores in the 70s still read as warning colors, not "pretty good."
 */
export function getScoreColor(score: number): string {
  const normalized = clampScore(score) / 100;
  const hue = Math.round(120 * Math.pow(normalized, 3.5));
  const lightness = Math.round(42 - normalized * 10);
  return `hsl(${hue} 84% ${lightness}%)`;
}

export function getScoreSurfaceStyle(score: number) {
  const normalized = clampScore(score) / 100;
  const hue = Math.round(120 * Math.pow(normalized, 3.5));

  return {
    backgroundColor: `hsl(${hue} 88% 94%)`,
    borderColor: `hsl(${hue} 76% 45%)`,
    color: `hsl(${hue} 82% 22%)`,
  };
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 95) return "elite";
  if (score >= 90) return "strong";
  if (score >= 80) return "mixed";
  if (score >= 70) return "weak";
  if (score >= 60) return "bad";
  return "terrible";
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Return a human-readable descriptor for a numeric score.
 */
export function getScoreDescription(score: number): string {
  if (score >= 95) return "Elite";
  if (score >= 90) return "Strong";
  if (score >= 80) return "Mixed";
  if (score >= 70) return "Weak record";
  if (score >= 60) return "Bad record";
  return "Terrible record";
}
