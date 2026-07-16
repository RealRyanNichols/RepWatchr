import type { Official } from "@/types";

export type OfficeAccountabilityFamily =
  | "legislative_roll_call"
  | "deliberative_board"
  | "executive_actions"
  | "judicial_record"
  | "prosecutorial_record";

export type OfficeAccountabilityProfile = {
  family: OfficeAccountabilityFamily;
  decisionLabel: string;
  decisionLabelLower: string;
  pendingHeading: string;
  pendingExplanation: string;
  supportsLegislatorGrade: boolean;
};

const legislativePattern = /\b(?:u\.?s\.?\s+)?(?:state\s+)?(?:representative|senator|delegate|assemblymember|assemblyman|assemblywoman|legislator)\b/i;
const deliberativePattern = /\b(?:council(?:member|or|man|woman)?|alder(?:man|woman|person)|trustee|school\s+board|board\s+(?:member|president|vice[- ]president))\b/i;
const localCommissionerPattern = /\bcommissioner\b/i;
const judicialPattern = /\b(?:judge|justice|magistrate|judicial)\b/i;
const prosecutorialPattern = /\b(?:district\s+attorney|prosecutor|prosecuting\s+attorney|state'?s\s+attorney|commonwealth'?s\s+attorney)\b/i;

/**
 * Maps an office to the kind of public decisions that can fairly be expected.
 * A missing legislative roll-call file must never be treated as a missing
 * executive, judicial, or prosecutorial record.
 */
export function getOfficeAccountabilityProfile(
  official: Pick<Official, "level" | "position">,
): OfficeAccountabilityProfile {
  const position = official.position.trim();

  if (judicialPattern.test(position)) {
    return {
      family: "judicial_record",
      decisionLabel: "Judicial record",
      decisionLabelLower: "judicial decisions and administrative record",
      pendingHeading: "Applicable judicial record is not loaded",
      pendingExplanation:
        "Roll-call voting is not the right measure for this office. A role-specific review of opinions, recusals, reversals, discipline, and administrative duties is still pending.",
      supportsLegislatorGrade: false,
    };
  }

  if (prosecutorialPattern.test(position)) {
    return {
      family: "prosecutorial_record",
      decisionLabel: "Prosecutorial record",
      decisionLabelLower: "prosecutorial policies and public outcomes",
      pendingHeading: "Applicable prosecutorial record is not loaded",
      pendingExplanation:
        "Roll-call voting is not the right measure for this office. Charging policy, disclosure compliance, case outcomes, misconduct findings, and public transparency require a separate review.",
      supportsLegislatorGrade: false,
    };
  }

  if (legislativePattern.test(position)) {
    return {
      family: "legislative_roll_call",
      decisionLabel: "Roll calls",
      decisionLabelLower: "official roll-call positions",
      pendingHeading: "Official roll calls are not loaded",
      pendingExplanation:
        "The absence of a vote file is a RepWatchr research gap. It is not counted as absence, nonparticipation, or misconduct by the official.",
      supportsLegislatorGrade: true,
    };
  }

  if (
    official.level === "school-board" ||
    deliberativePattern.test(position) ||
    ((official.level === "county" || official.level === "city") && localCommissionerPattern.test(position))
  ) {
    return {
      family: "deliberative_board",
      decisionLabel: "Board decisions",
      decisionLabelLower: "meeting votes and board decisions",
      pendingHeading: "Meeting decisions are not loaded",
      pendingExplanation:
        "This office acts through meetings or a deliberative body, but RepWatchr has not loaded a role-compatible decision ledger. Missing rows are not treated as absences or misconduct.",
      supportsLegislatorGrade: false,
    };
  }

  return {
    family: "executive_actions",
    decisionLabel: "Executive actions",
    decisionLabelLower: "orders, vetoes, appointments, contracts, and administrative actions",
    pendingHeading: "Applicable executive record is not loaded",
    pendingExplanation:
      "Roll-call voting may not apply to this office. Orders, vetoes, appointments, contracts, public-safety actions, and administrative duties require a role-specific review.",
    supportsLegislatorGrade: false,
  };
}
