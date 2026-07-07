export type ContentLabelId =
  | "confirmed_public_record"
  | "source_backed_claim"
  | "public_question"
  | "needs_source"
  | "allegation"
  | "opinion"
  | "correction_requested"
  | "under_review";

export type TrustLabelTone = "green" | "blue" | "amber" | "red" | "slate";

export type ContentLabel = {
  id: ContentLabelId;
  label: string;
  description: string;
  tone: TrustLabelTone;
};

export type TrustSafetyWarning = {
  id: string;
  label: string;
  detail: string;
  severity: "block" | "warn";
  matchedText?: string;
};

export const CONTENT_LABELS: Record<ContentLabelId, ContentLabel> = {
  confirmed_public_record: {
    id: "confirmed_public_record",
    label: "Confirmed public record",
    description: "The item points to an official public record or primary record source.",
    tone: "green",
  },
  source_backed_claim: {
    id: "source_backed_claim",
    label: "Source-backed claim",
    description: "The claim is limited to what the linked source supports.",
    tone: "blue",
  },
  public_question: {
    id: "public_question",
    label: "Public question",
    description: "This is framed as a question voters or reporters can ask with the source attached.",
    tone: "blue",
  },
  needs_source: {
    id: "needs_source",
    label: "Needs source",
    description: "This should not be treated as verified until a public source is attached.",
    tone: "red",
  },
  allegation: {
    id: "allegation",
    label: "Allegation",
    description: "This is a claim that requires careful sourcing and review before stronger language is used.",
    tone: "amber",
  },
  opinion: {
    id: "opinion",
    label: "Opinion",
    description: "This is commentary, not a finding.",
    tone: "slate",
  },
  correction_requested: {
    id: "correction_requested",
    label: "Correction requested",
    description: "A user has asked RepWatchr to check or correct the record.",
    tone: "amber",
  },
  under_review: {
    id: "under_review",
    label: "Under review",
    description: "RepWatchr has not completed source review for this item.",
    tone: "amber",
  },
};

export const PUBLIC_CONTENT_RULES = [
  "No private home addresses.",
  "No minor children.",
  "No threats.",
  "No doxxing.",
  "No instructions to harass.",
  "No unsourced criminal accusations.",
  "No private personal data.",
  "No claims beyond what the public source supports.",
];

const riskyLanguagePatterns: Array<{
  id: string;
  label: string;
  detail: string;
  severity: TrustSafetyWarning["severity"];
  pattern: RegExp;
}> = [
  {
    id: "private-address",
    label: "Possible private-address language",
    detail: "Public pages should not include private home addresses or directions to a private residence.",
    severity: "block",
    pattern: /\b(home address|private address|lives at|resides at|street address|apartment|apt\.?|unit #)\b/i,
  },
  {
    id: "minor-children",
    label: "Possible minor-child reference",
    detail: "Do not publish minor children or family details unless a lawful public-record reason is reviewed.",
    severity: "block",
    pattern: /\b(child|children|minor|kids|son|daughter)\b/i,
  },
  {
    id: "family-private-info",
    label: "Possible private family reference",
    detail: "Badge, court, and public-role profiles should not publish family details or private personal context.",
    severity: "block",
    pattern: /\b(wife|husband|spouse|family|mother|father|relative|home life|personal phone|personal email)\b/i,
  },
  {
    id: "threat-harass",
    label: "Possible threat or harassment language",
    detail: "RepWatchr cannot publish threats, harassment instructions, or calls to target a person privately.",
    severity: "block",
    pattern: /\b(threaten|harass|go after|show up at|confront at home|make them pay|hunt down|target them|follow them|call their house)\b/i,
  },
  {
    id: "wanted-vigilante-framing",
    label: "Possible wanted-style or vigilante framing",
    detail: "Badge and court profiles must avoid wanted-poster, bounty, target-list, mugshot, or vigilante styling.",
    severity: "block",
    pattern: /\b(wanted poster|wanted list|bounty|target list|enemy list|mugshot|red siren|vigilante|take justice into your own hands)\b/i,
  },
  {
    id: "criminal-accusation",
    label: "Possible criminal accusation",
    detail: "Use source-limited wording unless a public legal finding supports the stronger claim.",
    severity: "warn",
    pattern: /\b(criminal|crime|felony|bribe|bribery|kickback|stole|stealing|fraud|fraudulent|corrupt|treason|traitor|illegal payoff)\b/i,
  },
  {
    id: "guilt-language",
    label: "Possible guilt language",
    detail: "Do not state guilt or criminal status unless an official public finding supports it and the copy is source-limited.",
    severity: "warn",
    pattern: /\b(guilty|convicted|conviction|belongs in jail|locked up|jail them|prosecute them|known criminal|alleged criminal)\b/i,
  },
  {
    id: "overclaim",
    label: "Possible overclaim",
    detail: "Avoid certainty beyond the source. Prefer public-question or source-backed wording.",
    severity: "warn",
    pattern: /\b(proves|confirmed that .* guilty|without a doubt|obviously guilty|caught red-handed|sold out|cover[- ]?up|everyone knows|no question that)\b/i,
  },
];

export function getContentLabel(id: ContentLabelId | string | null | undefined) {
  return CONTENT_LABELS[(id || "") as ContentLabelId] ?? CONTENT_LABELS.under_review;
}

export function labelForSource(sourceUrl?: string | null, preferred?: ContentLabelId | string | null) {
  if (preferred) return getContentLabel(preferred);
  return sourceUrl ? CONTENT_LABELS.confirmed_public_record : CONTENT_LABELS.needs_source;
}

export function scanPublicContentForWarnings(value: string | null | undefined): TrustSafetyWarning[] {
  const text = value?.trim();
  if (!text) return [];

  return riskyLanguagePatterns.flatMap((rule) => {
    const match = text.match(rule.pattern);
    if (!match) return [];
    return [
      {
        id: rule.id,
        label: rule.label,
        detail: rule.detail,
        severity: rule.severity,
        matchedText: match[0],
      },
    ];
  });
}

export function validateRedFlagForPublicUse(flag: {
  sourceUrl?: string | null;
  date?: string | null;
  jurisdiction?: string | null;
  whyItMatters?: string | null;
  statusLabel?: string | null;
  reviewerStatus?: string | null;
}) {
  const missing: string[] = [];
  if (!flag.sourceUrl) missing.push("source URL");
  if (!flag.date) missing.push("date");
  if (!flag.jurisdiction) missing.push("jurisdiction");
  if (!flag.whyItMatters) missing.push("why it matters");
  if (!flag.statusLabel) missing.push("status label");
  if (!flag.reviewerStatus) missing.push("reviewer status");
  return missing;
}
