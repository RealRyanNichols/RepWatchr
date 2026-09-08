export interface SchoolGovernanceObservation {
  districtSlug: string;
  status: "active_intervention" | "closed";
  sourceUrl: string;
  observedAt: string;
  summary: string;
}

// A documented subset, not a complete statewide investigation count.
// Generic research instructions mentioning TEA do not establish a case.
export const schoolGovernanceObservations: SchoolGovernanceObservation[] = [
  {
    districtSlug: "houston_isd",
    status: "active_intervention",
    sourceUrl: "https://www.houstonisd.org/board-governance/our-board",
    observedAt: "2026-09-08",
    summary:
      "The district identifies its Board of Managers as the official policy-making body.",
  },
  {
    districtSlug: "fort_worth_isd",
    status: "active_intervention",
    sourceUrl: "https://www.fwisd.org/about/tea",
    observedAt: "2026-09-08",
    summary:
      "The district reports a TEA-appointed Board of Managers and suspended elected-trustee authority during the transition.",
  },
];

export function documentedActiveSchoolInterventions(
  districtSlugs: Iterable<string>,
  observations = schoolGovernanceObservations,
) {
  const loaded = new Set(districtSlugs);
  return new Set(
    observations
      .filter(
        (observation) =>
          loaded.has(observation.districtSlug) &&
          observation.status === "active_intervention" &&
          observation.sourceUrl &&
          observation.observedAt,
      )
      .map((observation) => observation.districtSlug),
  ).size;
}
