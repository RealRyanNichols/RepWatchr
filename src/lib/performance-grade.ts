export const PERFORMANCE_GRADE_METHOD_VERSION = "1.0";

export type PerformanceDimensionId =
  | "voting_accountability"
  | "legislative_effectiveness"
  | "ethics_integrity"
  | "constituent_transparency"
  | "attendance_duty";

export type PerformanceGradeStatus = "published" | "provisional" | "insufficient_data";

export type PerformanceDimensionDefinition = {
  id: PerformanceDimensionId;
  label: string;
  weight: number;
  neutralQuestion: string;
};

export type PerformanceDimensionInput = {
  id: PerformanceDimensionId;
  score: number | null;
  coverage: number;
  sourceQuality: number;
  freshness: number;
  reliability: number;
  sourceCount: number;
  note: string;
};

export type PerformanceDimensionResult = PerformanceDimensionInput & {
  label: string;
  weight: number;
  confidence: number;
  scoreable: boolean;
};

export type PerformanceGradeResult = {
  methodVersion: string;
  status: PerformanceGradeStatus;
  score: number | null;
  letterGrade: "A" | "B" | "C" | "D" | "F" | null;
  scoreableWeight: number;
  weightedCoverage: number;
  confidence: number;
  confidenceLabel: "high" | "medium" | "low" | "insufficient";
  dimensions: PerformanceDimensionResult[];
  reason: string;
};

export const LEGISLATOR_PERFORMANCE_DIMENSIONS: readonly PerformanceDimensionDefinition[] = [
  {
    id: "voting_accountability",
    label: "Voting accountability",
    weight: 20,
    neutralQuestion: "Did the official take a documented position when eligible, regardless of policy direction?",
  },
  {
    id: "legislative_effectiveness",
    label: "Legislative effectiveness",
    weight: 25,
    neutralQuestion: "Did the official turn comparable opportunities into substantive, documented outcomes?",
  },
  {
    id: "ethics_integrity",
    label: "Ethics and integrity",
    weight: 25,
    neutralQuestion: "What final, authoritative findings or required-filing results are documented?",
  },
  {
    id: "constituent_transparency",
    label: "Constituent service and transparency",
    weight: 20,
    neutralQuestion: "Is the office accessible, responsive, and compliant with applicable transparency duties?",
  },
  {
    id: "attendance_duty",
    label: "Attendance and duty fulfillment",
    weight: 10,
    neutralQuestion: "Did the official attend eligible duties after approved leave and conflicts are excluded?",
  },
] as const;

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
export function scoreToLetterGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function confidenceLabel(confidence: number): PerformanceGradeResult["confidenceLabel"] {
  if (confidence >= 80) return "high";
  if (confidence >= 65) return "medium";
  if (confidence >= 45) return "low";
  return "insufficient";
}

export function calculatePerformanceGrade(
  inputs: readonly PerformanceDimensionInput[],
): PerformanceGradeResult {
  const byId = new Map(inputs.map((input) => [input.id, input]));
  const dimensions = LEGISLATOR_PERFORMANCE_DIMENSIONS.map((definition) => {
    const input = byId.get(definition.id) ?? {
      id: definition.id,
      score: null,
      coverage: 0,
      sourceQuality: 0,
      freshness: 0,
      reliability: 0,
      sourceCount: 0,
      note: "This category has not cleared evidence review.",
    };
    const coverage = clampPercent(input.coverage);
    const sourceQuality = clampPercent(input.sourceQuality);
    const freshness = clampPercent(input.freshness);
    const reliability = clampPercent(input.reliability);
    const confidence = Math.round(
      coverage * (0.5 * (sourceQuality / 100) + 0.25 * (freshness / 100) + 0.25 * (reliability / 100)),
    );
    const scoreable = input.score !== null && coverage >= 60 && sourceQuality >= 60;

    return {
      ...input,
      coverage,
      sourceQuality,
      freshness,
      reliability,
      confidence,
      scoreable,
      label: definition.label,
      weight: definition.weight,
    };
  });

  const scoreable = dimensions.filter((dimension) => dimension.scoreable && dimension.score !== null);
  const scoreableWeight = scoreable.reduce((sum, dimension) => sum + dimension.weight, 0);
  const weightedCoverage = Math.round(
    dimensions.reduce((sum, dimension) => sum + dimension.coverage * dimension.weight, 0) / 100,
  );
  const confidence = Math.round(
    dimensions.reduce((sum, dimension) => sum + dimension.confidence * dimension.weight, 0) / 100,
  );
  const ethicsScoreable = dimensions.some(
    (dimension) => dimension.id === "ethics_integrity" && dimension.scoreable,
  );
  const numericScore = scoreableWeight
    ? Math.round(
        scoreable.reduce((sum, dimension) => sum + (dimension.score ?? 0) * dimension.weight, 0) /
          scoreableWeight,
      )
    : null;

  const fullPublicationReady =
    scoreableWeight >= 80 &&
    weightedCoverage >= 70 &&
    confidence >= 65 &&
    scoreable.length >= 4 &&
    ethicsScoreable;
  const provisionalReady = scoreableWeight >= 60 && confidence >= 45;
  const status: PerformanceGradeStatus = fullPublicationReady
    ? "published"
    : provisionalReady
      ? "provisional"
      : "insufficient_data";
  const publishedScore = status === "insufficient_data" ? null : numericScore;

  return {
    methodVersion: PERFORMANCE_GRADE_METHOD_VERSION,
    status,
    score: publishedScore,
    letterGrade: status === "published" && publishedScore !== null ? scoreToLetterGrade(publishedScore) : null,
    scoreableWeight,
    weightedCoverage,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    dimensions,
    reason:
      status === "published"
        ? "The score cleared the coverage, confidence, category, and ethics publication gates."
        : status === "provisional"
          ? "Enough evidence is available for a provisional number, but not yet for a letter grade."
          : "The record has not cleared RepWatchr's minimum evidence gate for a defensible overall grade.",
  };
}
