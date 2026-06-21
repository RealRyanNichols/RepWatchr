export type ShareTemplateKind =
  | "confirmed_record"
  | "public_question"
  | "missing_source"
  | "correction_needed"
  | "funding_trail"
  | "vote_record"
  | "meeting_clip"
  | "red_flag";

export type ShareKitInput = {
  title: string;
  description?: string;
  path: string;
  template?: ShareTemplateKind;
  subject?: string;
  sourceLabel?: string;
};

export type ShareKit = {
  cleanUrl: string;
  template: ShareTemplateKind;
  label: string;
  snippet: string;
  talkingPoint: string;
  publicQuestion: string;
  submitSourceHref: string;
  watchHref: string;
};

const SITE_ORIGIN = "https://www.repwatchr.com";

const labels: Record<ShareTemplateKind, string> = {
  confirmed_record: "Confirmed record",
  public_question: "Public question",
  missing_source: "Missing source",
  correction_needed: "Correction needed",
  funding_trail: "Funding trail",
  vote_record: "Vote record",
  meeting_clip: "Meeting clip",
  red_flag: "Red flag",
};

function compact(value: string, limit = 180) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1).trim()}...`;
}

export function canonicalShareUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function inferShareTemplate(path: string, description = ""): ShareTemplateKind {
  const lower = `${path} ${description}`.toLowerCase();
  if (lower.includes("/funding")) return "funding_trail";
  if (lower.includes("/votes") || lower.includes("vote record") || lower.includes("roll call")) return "vote_record";
  if (lower.includes("/red-flags") || lower.includes("red flag")) return "red_flag";
  if (lower.includes("/daily-wire") || lower.includes("meeting clip") || lower.includes("video clip")) return "meeting_clip";
  if (lower.includes("correction")) return "correction_needed";
  if (lower.includes("missing source") || lower.includes("needs source")) return "missing_source";
  if (lower.includes("/elections") || lower.includes("/school-boards")) return "public_question";
  return "confirmed_record";
}

export function buildRepWatchrShareKit(input: ShareKitInput): ShareKit {
  const cleanUrl = canonicalShareUrl(input.path);
  const template = input.template ?? inferShareTemplate(input.path, input.description);
  const title = compact(input.title, 130);
  const subject = compact(input.subject || input.title, 90);
  const sourceLabel = compact(input.sourceLabel || input.description || "the linked public record", 130);

  const snippetByTemplate: Record<ShareTemplateKind, string> = {
    confirmed_record: `Confirmed public record: ${title}. RepWatchr keeps the source trail attached so people can inspect the receipt, not just react to a post. ${cleanUrl}`,
    public_question: `Public question: ${title}. Open the record, check the source trail, and ask the official or board to point voters to the missing receipt. ${cleanUrl}`,
    missing_source: `Missing source check: ${title}. If there is a better public record, add it so this page can be corrected or upgraded. ${cleanUrl}`,
    correction_needed: `Correction needed? RepWatchr should point to the best public record. Review this page and submit the official source or correction. ${cleanUrl}`,
    funding_trail: `Funding trail: ${title}. Review the reported totals, donors, geography, and source links before repeating the claim. ${cleanUrl}`,
    vote_record: `Vote record: ${title}. Check the roll call and source link before arguing the headline. ${cleanUrl}`,
    meeting_clip: `Meeting clip or public record: ${title}. Keep the date, agency, and source link attached. ${cleanUrl}`,
    red_flag: `Red flag review: ${title}. Treat this as a source-backed question, not a final finding. Check the receipt and submit a better source if one exists. ${cleanUrl}`,
  };

  const sourceType =
    template === "funding_trail"
      ? "campaign_finance"
      : template === "vote_record"
        ? "vote_record"
        : template === "meeting_clip"
          ? "video_clip"
          : template === "correction_needed"
            ? "correction"
            : "official_record";

  return {
    cleanUrl,
    template,
    label: labels[template],
    snippet: snippetByTemplate[template],
    talkingPoint: `Before the meeting: open ${subject}, name the public source, ask what record answers the question, and request the missing link be posted for voters.`,
    publicQuestion: `Can you point voters to the public record, vote, filing, agenda, or source link that supports your position on ${subject}? Current source trail: ${sourceLabel}.`,
    submitSourceHref: `/submit-source?target=${encodeURIComponent(subject)}&type=${encodeURIComponent(sourceType)}`,
    watchHref: `/dashboard?watch=${encodeURIComponent(input.path)}&target=${encodeURIComponent(subject)}`,
  };
}
