import {
  calculatePerformanceGrade,
  type PerformanceDimensionInput,
  type PerformanceGradeResult,
} from "@/lib/performance-grade";
import { withDerivedPerformanceInputs } from "@/lib/derived-performance-inputs";

const inputsByOfficial: Record<string, readonly PerformanceDimensionInput[]> = {
  "jay-dean": [
    {
      id: "voting_accountability",
      score: null,
      coverage: 78,
      sourceQuality: 100,
      freshness: 90,
      reliability: 82,
      sourceCount: 4507,
      note:
        "Official roll calls are indexed, but the major-decision explanation set and eligible-vote exclusions are not complete.",
    },
    {
      id: "legislative_effectiveness",
      score: null,
      coverage: 48,
      sourceQuality: 94,
      freshness: 90,
      reliability: 45,
      sourceCount: 9,
      note:
        "Enacted measures and appropriations are documented; a same-role opportunity cohort and outcome audit are still required.",
    },
    {
      id: "ethics_integrity",
      score: null,
      coverage: 35,
      sourceQuality: 90,
      freshness: 85,
      reliability: 55,
      sourceCount: 4,
      note:
        "No final ethics finding was located in the reviewed sources, but the required jurisdiction-wide checklist is incomplete.",
    },
    {
      id: "constituent_transparency",
      score: null,
      coverage: 34,
      sourceQuality: 78,
      freshness: 85,
      reliability: 35,
      sourceCount: 6,
      note:
        "Public contact channels and named access criticism are documented; standardized response-time testing is not complete.",
    },
    {
      id: "attendance_duty",
      score: null,
      coverage: 58,
      sourceQuality: 100,
      freshness: 90,
      reliability: 60,
      sourceCount: 4507,
      note:
        "Raw not-voting rows are indexed, but approved leave, official-duty conflicts, and eligible-event denominators need review.",
    },
  ],
};

export function getOfficialPerformanceGrade(officialId: string): PerformanceGradeResult {
  // Dimensions the loaded record can compute are filled in from that record
  // rather than left null. A dimension with no derivation keeps its null, so
  // the grade still reports "not rated" instead of inventing a number.
  const inputs = withDerivedPerformanceInputs(officialId, inputsByOfficial[officialId] ?? []);
  return calculatePerformanceGrade(inputs);
}
