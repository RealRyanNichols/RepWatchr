import type { CandidateDossier, SourceLink } from "@/lib/school-board-research";

export type EvidenceLabel = "FACT" | "DOCUMENTED_INFERENCE" | "REQUIRES_FURTHER_EVIDENCE";
export type SchoolBoardEvidenceCategory = "child_safety" | "parental_rights" | "student_privacy" | "curriculum_and_books" | "transparency" | "fiscal_stewardship" | "public_service" | "faith_and_family_alignment" | "political_lean";
export type SchoolBoardEvidenceDirection = "positive" | "negative" | "neutral";

export interface SchoolBoardEvidenceItem {
  id?: string;
  category: SchoolBoardEvidenceCategory;
  direction: SchoolBoardEvidenceDirection;
  label: EvidenceLabel;
  summary: string;
  source_url: string;
  source_title?: string;
  event_date?: string;
  severity?: "low" | "medium" | "high" | "critical";
  tags?: string[];
}

export interface PoliticalLeanAssessment {
  label: "Votes Republican" | "Votes Democrat" | "Mixed / Unclear" | "Unknown";
  confidence: "high" | "medium" | "low" | "none";
  basis: string;
  sources: SourceLink[];
}

export interface SchoolBoardScoreResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F" | "Pending";
  praiseWiped: boolean;
  overrideReason?: string;
  categoryScores: Record<Exclude<SchoolBoardEvidenceCategory, "political_lean">, number>;
  positiveCount: number;
  negativeCount: number;
  evidenceCount: number;
  requiredEvidenceNote: string;
  politicalLean: PoliticalLeanAssessment;
}

const CATEGORY_WEIGHTS: Record<Exclude<SchoolBoardEvidenceCategory, "political_lean">, number> = {
  child_safety: 28,
  parental_rights: 24,
  student_privacy: 14,
  curriculum_and_books: 10,
  transparency: 9,
  fiscal_stewardship: 5,
  public_service: 5,
  faith_and_family_alignment: 5,
};

const HARD_OVERRIDE_RULES = [
  { tag: "documented_child_harm", cap: 0, wipePraise: true, reason: "Documented act or policy outcome involving harm to children." },
  { tag: "covered_up_child_safety_issue", cap: 10, wipePraise: true, reason: "Documented concealment or suppression of a child-safety issue." },
  { tag: "hid_material_information_from_parents", cap: 25, wipePraise: true, reason: "Documented withholding of material information from parents." },
  { tag: "opposed_parental_notification", cap: 35, wipePraise: true, reason: "Documented opposition to parental notification or parent access to important student information." },
  { tag: "sex_based_privacy_violation", cap: 30, wipePraise: true, reason: "Documented vote or policy allowing sex-based privacy conflicts in bathrooms, locker rooms, overnight lodging, or similar private spaces." },
  { tag: "retaliated_against_parent_or_child", cap: 20, wipePraise: true, reason: "Documented retaliation against a parent, student, whistleblower, or complainant." },
  { tag: "age_inappropriate_sexual_material", cap: 40, wipePraise: true, reason: "Documented vote or policy defending age-inappropriate sexual material for children." },
];

function scoreToGrade(score: number): SchoolBoardScoreResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function isUsableEvidence(item: SchoolBoardEvidenceItem) {
  return item.label !== "REQUIRES_FURTHER_EVIDENCE" && Boolean(item.source_url);
}

function hasEnoughEvidenceForGrade(evidence: SchoolBoardEvidenceItem[], hardTriggerCount: number) {
  if (hardTriggerCount > 0) return true;

  const scoreMovingEvidence = evidence.filter((item) => item.category !== "political_lean" && item.direction !== "neutral");
  const strongNegativeEvidence = scoreMovingEvidence.some(
    (item) => item.direction === "negative" && (item.severity === "high" || item.severity === "critical")
  );

  return strongNegativeEvidence || scoreMovingEvidence.length >= 5;
}

export function calculateSchoolBoardScore(candidate: CandidateDossier, evidence: SchoolBoardEvidenceItem[] = []): SchoolBoardScoreResult {
  const usableEvidence = evidence.filter(isUsableEvidence);
  const positiveEvidence = usableEvidence.filter((item) => item.direction === "positive");
  const negativeEvidence = usableEvidence.filter((item) => item.direction === "negative");
  const categoryScores = Object.keys(CATEGORY_WEIGHTS).reduce((acc, category) => {
    acc[category as Exclude<SchoolBoardEvidenceCategory, "political_lean">] = 50;
    return acc;
  }, {} as SchoolBoardScoreResult["categoryScores"]);

  for (const item of usableEvidence) {
    if (item.category === "political_lean") continue;
    const severity = item.severity ?? "medium";
    const deltaBase = severity === "critical" ? 45 : severity === "high" ? 30 : severity === "medium" ? 18 : 9;
    const delta = item.direction === "positive" ? deltaBase : item.direction === "negative" ? -deltaBase : 0;
    categoryScores[item.category] = clampScore(categoryScores[item.category] + delta);
  }

  let weightedScore = Object.entries(CATEGORY_WEIGHTS).reduce((total, [category, weight]) => total + categoryScores[category as keyof typeof CATEGORY_WEIGHTS] * (weight / 100), 0);
  const hardTriggers = negativeEvidence.flatMap((item) => HARD_OVERRIDE_RULES.filter((rule) => item.tags?.includes(rule.tag)).map((rule) => ({ rule, item })));
  let praiseWiped = false;
  let overrideReason: string | undefined;

  if (hardTriggers.length > 0) {
    const strongest = hardTriggers.sort((a, b) => a.rule.cap - b.rule.cap)[0];
    weightedScore = Math.min(weightedScore, strongest.rule.cap);
    praiseWiped = strongest.rule.wipePraise;
    overrideReason = `${strongest.rule.reason} Source: ${strongest.item.source_title ?? strongest.item.source_url}`;
  }

  const finalScore = clampScore(weightedScore);
  const grade = hasEnoughEvidenceForGrade(usableEvidence, hardTriggers.length)
    ? scoreToGrade(finalScore)
    : "Pending";

  return {
    score: finalScore,
    grade,
    praiseWiped,
    overrideReason,
    categoryScores,
    positiveCount: positiveEvidence.length,
    negativeCount: negativeEvidence.length,
    evidenceCount: usableEvidence.length,
    requiredEvidenceNote: "A hard override can only be applied from public-source evidence labeled FACT or DOCUMENTED_INFERENCE. Rumor, private claims, and unsourced allegations do not count. A public grade stays pending until a hard override, high-severity negative record, or enough score-moving source records exist.",
    politicalLean: assessPoliticalLean(candidate, evidence),
  };
}

export function buildEvidenceFromDossier(candidate: CandidateDossier): SchoolBoardEvidenceItem[] {
  const evidence: SchoolBoardEvidenceItem[] = [];
  candidate.about_public_record?.affiliations_full_inventory?.forEach((item, index) => {
    if (!item.source_url || !item.organization || !item.role) return;
    evidence.push({ id: `${candidate.candidate_id}-affiliation-${index}`, category: "public_service", direction: "positive", label: "FACT", summary: `${item.role} with ${item.organization}.`, source_url: item.source_url, source_title: item.organization, severity: "low", tags: ["public_service"] });
  });
  candidate.about_public_record?.board_performance_incumbents_only?.notable_votes?.forEach((vote, index) => {
    if (!vote.source_url || !vote.item) return;
    evidence.push({ id: `${candidate.candidate_id}-vote-${index}`, category: "fiscal_stewardship", direction: "neutral", label: vote.board_outcome?.includes("REQUIRES_FURTHER_EVIDENCE") ? "REQUIRES_FURTHER_EVIDENCE" : "FACT", summary: vote.item, source_url: vote.source_url, source_title: vote.meeting_date ?? "Board vote", event_date: vote.meeting_date, severity: "medium", tags: ["board_vote"] });
  });

  // Silent signals: never render publicly, but feed scoring + political lean.
  const silent = candidate.silent_signals;
  silent?.voter_primary_history?.forEach((entry, index) => {
    if (!entry.source_url) return;
    const tag = entry.party === "R" ? "republican_primary" : entry.party === "D" ? "democratic_primary" : "primary_pulled";
    evidence.push({
      id: `${candidate.candidate_id}-silent-primary-${index}`,
      category: "political_lean",
      direction: "neutral",
      label: "FACT",
      summary: `Pulled ${entry.party} primary ballot (${entry.year}).`,
      source_url: entry.source_url,
      source_title: `Primary ${entry.year}`,
      tags: [tag, entry.party === "R" ? "votes republican" : entry.party === "D" ? "votes democrat" : ""],
    });
  });
  silent?.donations?.forEach((entry, index) => {
    if (!entry.source_url) return;
    evidence.push({
      id: `${candidate.candidate_id}-silent-donation-${index}`,
      category: "political_lean",
      direction: "neutral",
      label: "FACT",
      summary: `Donation to ${entry.recipient}${entry.amount ? ` ($${entry.amount})` : ""}${entry.cycle ? ` ${entry.cycle}` : ""}.`,
      source_url: entry.source_url,
      source_title: entry.recipient,
      tags: [entry.alignment === "right" ? "votes republican" : entry.alignment === "left" ? "votes democrat" : ""].filter(Boolean),
    });
  });
  silent?.endorsements_received?.forEach((entry, index) => {
    if (!entry.source_url) return;
    evidence.push({
      id: `${candidate.candidate_id}-silent-endorsement-${index}`,
      category: "political_lean",
      direction: "neutral",
      label: "FACT",
      summary: `Endorsed by ${entry.from}.`,
      source_url: entry.source_url,
      source_title: entry.from,
      tags: [entry.alignment === "right" ? "votes republican" : entry.alignment === "left" ? "votes democrat" : ""].filter(Boolean),
    });
  });
  silent?.affiliations?.forEach((entry, index) => {
    if (!entry.source_url) return;
    evidence.push({
      id: `${candidate.candidate_id}-silent-affiliation-${index}`,
      category: "political_lean",
      direction: "neutral",
      label: "FACT",
      summary: `Affiliated with ${entry.organization}.`,
      source_url: entry.source_url,
      source_title: entry.organization,
      tags: [entry.alignment === "right" ? "votes republican" : entry.alignment === "left" ? "votes democrat" : ""].filter(Boolean),
    });
  });

  const flags = [...(candidate.red_flags ?? []), ...(candidate.about_public_record?.conflicts_of_interest_inventory ?? [])];
  flags.forEach((flag, index) => {
    if (!flag.source_url) return;
    const text = `${flag.type ?? ""} ${flag.description}`.toLowerCase();
    const category: SchoolBoardEvidenceCategory = text.includes("parent") ? "parental_rights" : text.includes("child") || text.includes("student") || text.includes("safety") || text.includes("discipline") ? "child_safety" : text.includes("curriculum") || text.includes("book") ? "curriculum_and_books" : text.includes("privacy") || text.includes("bathroom") || text.includes("locker") ? "student_privacy" : text.includes("faith") || text.includes("family") || text.includes("biblical") || text.includes("church") ? "faith_and_family_alignment" : text.includes("tax") || text.includes("bond") || text.includes("budget") ? "fiscal_stewardship" : "transparency";
    const severity = flag.severity === "critical" || flag.severity === "high" || flag.severity === "medium" || flag.severity === "low" ? flag.severity : "medium";
    const tags = [
      text.includes("hid") || text.includes("withholding") ? "hid_material_information_from_parents" : "",
      text.includes("bathroom") || text.includes("locker") || text.includes("sex-based privacy") ? "sex_based_privacy_violation" : "",
      text.includes("retaliat") ? "retaliated_against_parent_or_child" : "",
      text.includes("cover") && text.includes("child") ? "covered_up_child_safety_issue" : "",
      text.includes("harm") && text.includes("child") ? "documented_child_harm" : "",
    ].filter(Boolean);
    evidence.push({ id: `${candidate.candidate_id}-flag-${index}`, category, direction: "negative", label: flag.fact_label === "FACT" || flag.fact_label === "DOCUMENTED_INFERENCE" ? flag.fact_label : "REQUIRES_FURTHER_EVIDENCE", summary: flag.description, source_url: flag.source_url, source_title: flag.type, severity, tags });
  });
  return evidence;
}

export function assessPoliticalLean(candidate: CandidateDossier, evidence: SchoolBoardEvidenceItem[] = []): PoliticalLeanAssessment {
  const politicalEvidence = evidence.filter((item) => item.category === "political_lean" && isUsableEvidence(item));
  const sources = politicalEvidence.map((item) => ({ url: item.source_url, title: item.source_title ?? item.summary, source_type: "political_lean", accessed_date: candidate.last_updated }));
  const text = `${candidate.party_registration ?? ""} ${politicalEvidence.map((item) => `${item.summary} ${(item.tags ?? []).join(" ")}`).join(" ")}`.toLowerCase();
  if (text.includes("votes republican") || text.includes("republican primary") || text.includes("gop")) return { label: "Votes Republican", confidence: sources.length >= 2 ? "high" : "medium", basis: "Based on public primary voting history, public partisan activity, donations, endorsements, or candidate statements loaded into the dossier.", sources };
  if (text.includes("votes democrat") || text.includes("democratic primary") || text.includes("democrat")) return { label: "Votes Democrat", confidence: sources.length >= 2 ? "high" : "medium", basis: "Based on public primary voting history, public partisan activity, donations, endorsements, or candidate statements loaded into the dossier.", sources };
  if (politicalEvidence.length > 0) return { label: "Mixed / Unclear", confidence: "low", basis: "Political evidence exists, but it does not support a clean lean label.", sources };
  return { label: "Unknown", confidence: "none", basis: "No public primary voting history, donation pattern, endorsement record, or self-description has been loaded yet.", sources: [] };
}

export const schoolBoardScoringModel = {
  version: "2026.04.24-school-board-watch-v2",
  weights: CATEGORY_WEIGHTS,
  hardOverrideRules: HARD_OVERRIDE_RULES,
  evidenceRequirement: "Every score-moving item must include a public source URL and a fact label. Child-safety, parent-rights, student privacy, and faith/family alignment overrides require FACT or DOCUMENTED_INFERENCE evidence. A public grade stays pending until the evidence threshold is met.",
};
