export type AlignmentFactor = {
  id: string;
  label: string;
  weight: number;
  description: string;
  sourceRule: string;
};

export type OwnerLockedIssuePosition = {
  id: string;
  label: string;
  position: string;
  status: "confirmed" | "needs_owner_clarification";
  note: string;
};

export const REPWATCHR_ALIGNMENT_FACTORS: AlignmentFactor[] = [
  {
    id: "biblical_alignment",
    label: "Voting record against God's Word",
    weight: 30,
    description:
      "Votes are scored against owner-approved moral issue positions. Scripture-sensitive issues are never guessed by the code.",
    sourceRule: "Bill text, official vote record, public statement, and owner-approved issue stance.",
  },
  {
    id: "voter_bloc_will",
    label: "Will of the voting bloc",
    weight: 20,
    description:
      "Compares the official's action against district-level election returns, ballot propositions, verified constituent surveys, and public meeting sentiment where available.",
    sourceRule: "Election results, public ballot data, verified in-district responses, and meeting records.",
  },
  {
    id: "record_vs_rhetoric",
    label: "Votes vs speech/rhetoric",
    weight: 15,
    description:
      "Penalizes contradiction between campaign promises, official statements, public posts, and the recorded vote.",
    sourceRule: "Official campaign pages, verified public profiles, press releases, roll calls, and source screenshots.",
  },
  {
    id: "core_voting_record",
    label: "Core voting record",
    weight: 15,
    description:
      "Scores high-impact votes by issue severity. Child safety, parental rights, faith/family alignment, spending, transparency, and constitutional questions can carry heavier weights.",
    sourceRule: "Official roll calls, board minutes, agendas, video, bill text, and public records.",
  },
  {
    id: "verified_public_sentiment",
    label: "Verified public sentiment",
    weight: 10,
    description:
      "Verified voters, verified local parents, verified officials, journalists, and claim-reviewed profiles get higher confidence weight.",
    sourceRule: "Signed-in verified RepWatchr profiles and clearly attributable public comments.",
  },
  {
    id: "open_public_sentiment",
    label: "Open public sentiment",
    weight: 5,
    description:
      "Anonymous and unverified speech remains visible and constitutionally protected, but receives lower confidence weight in scoring.",
    sourceRule: "Public comments, tips, social posts, and meeting comments marked by verification level.",
  },
  {
    id: "source_quality",
    label: "Source quality and evidence strength",
    weight: 5,
    description:
      "Public records, primary documents, video, and official sources carry more weight than rumor, summaries, or unsourced claims.",
    sourceRule: "Every score-moving item needs a source, evidence label, confidence level, and audit trail.",
  },
];

export const OWNER_LOCKED_ISSUE_POSITIONS: OwnerLockedIssuePosition[] = [
  {
    id: "abortion",
    label: "Abortion / Life",
    position: "Pro-life. Opposes abortion expansion and scores against votes that fund, protect, or expand abortion.",
    status: "confirmed",
    note: "Owner clarified this position directly. Future abortion scoring should follow this unless Ryan changes it.",
  },
  {
    id: "student_privacy",
    label: "Student privacy, bathrooms, locker rooms",
    position: "Needs exact owner-approved rule text before hard scoring.",
    status: "needs_owner_clarification",
    note: "Ask Ryan before weighting edge cases or policy exceptions.",
  },
  {
    id: "parental_rights",
    label: "Parental rights",
    position: "Needs exact owner-approved rule text before hard scoring.",
    status: "needs_owner_clarification",
    note: "Ask Ryan before deciding how competing custody, school safety, or medical/privacy issues are scored.",
  },
  {
    id: "faith_family_alignment",
    label: "Faith and family alignment",
    position: "Needs exact owner-approved rule text before hard scoring.",
    status: "needs_owner_clarification",
    note: "Ask Ryan for the position and severity weight before scoring specific issue families.",
  },
];

export const REPWATCHR_SCORE_SCALE = [
  { range: "95-100", grade: "A / A+", meaning: "Elite. This should be rare for public officials." },
  { range: "90-94", grade: "A-", meaning: "Strong record, still review the source votes." },
  { range: "80-89", grade: "B / C", meaning: "Mixed. Not green by default." },
  { range: "70-79", grade: "D", meaning: "Weak record. A 72 is a serious warning, not a good grade." },
  { range: "60-69", grade: "F", meaning: "Bad record." },
  { range: "0-59", grade: "F", meaning: "Terrible record." },
];
