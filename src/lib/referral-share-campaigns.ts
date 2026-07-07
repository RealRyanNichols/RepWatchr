import { canonicalShareUrl } from "@/lib/share-snippets";
import { cleanText, cleanUrl } from "@/lib/source-submissions";

export const REFERRAL_QUERY_PARAM = "rw_ref";
export const REFERRAL_STORAGE_KEY = "repwatchr.referralCode.v1";

export const referralEventTypes = [
  "visit",
  "signup",
  "source_submission",
  "packet_build",
  "watchlist_add",
  "package_interest",
  "referral_link_created",
  "referral_link_copied",
  "referral_visit",
  "referral_signup",
  "referral_source_submission",
  "referral_packet_created",
  "share_campaign_viewed",
  "share_campaign_clicked",
  "safe_share_text_copied",
] as const;

export type ReferralEventType = (typeof referralEventTypes)[number];

export const shareCampaignTypes = [
  "source_gap",
  "profile_watch",
  "race_watch",
  "county_hub",
  "school_board",
  "public_question",
  "free_packet",
  "records_request",
  "package_interest",
  "contributor_badge",
] as const;

export type ShareCampaignType = (typeof shareCampaignTypes)[number];

export const safeShareTemplateKinds = [
  "source_gap",
  "profile",
  "public_question",
  "race",
  "packet",
  "correction",
] as const;

export type SafeShareTemplateKind = (typeof safeShareTemplateKinds)[number];

export type SafeShareInput = {
  kind: SafeShareTemplateKind;
  subject?: string;
  topic?: string;
  question?: string;
  url?: string;
};

export type UnsafeCopyFinding = {
  term: string;
  reason: string;
};

export const unsafeShareTerms: Array<{ term: string; reason: string }> = [
  { term: "destroy", reason: "Avoid escalation or victory language." },
  { term: "expose them", reason: "Use source-first language instead of outrage framing." },
  { term: "take them down", reason: "Avoid harassment or campaign-style attack framing." },
  { term: "go after", reason: "Avoid targeting language." },
  { term: "target", reason: "Use subject, official, race, record, or public body instead." },
  { term: "harass", reason: "RepWatchr share copy must not encourage harassment." },
  { term: "guilty", reason: "Do not imply legal conclusions from public-source sharing." },
  { term: "criminal", reason: "Do not make criminal accusations in share copy." },
];

function compact(value: unknown, maxLength = 160) {
  return cleanText(value, maxLength).replace(/\s+/g, " ").trim();
}

function cleanPath(value: unknown) {
  const path = cleanText(value, 1000);
  if (!path) return "/";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      return `${url.pathname}${url.search}` || "/";
    } catch {
      return "/";
    }
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export function sanitizeReferralCode(value: unknown) {
  return cleanText(value, 80).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
}

export function makeReferralCode() {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `rw-${random.slice(0, 14)}`;
}

export function buildReferralUrl(path: string, code: string) {
  const cleanCode = sanitizeReferralCode(code);
  const url = new URL(canonicalShareUrl(cleanPath(path)));
  if (cleanCode) url.searchParams.set(REFERRAL_QUERY_PARAM, cleanCode);
  return url.toString();
}

export function normalizeReferralEventType(value: unknown): ReferralEventType | "" {
  const eventType = cleanText(value, 80);
  return referralEventTypes.includes(eventType as ReferralEventType) ? (eventType as ReferralEventType) : "";
}

export function normalizeShareCampaignType(value: unknown): ShareCampaignType | "" {
  const campaignType = cleanText(value, 80);
  return shareCampaignTypes.includes(campaignType as ShareCampaignType) ? (campaignType as ShareCampaignType) : "";
}

export function normalizeSafeShareKind(value: unknown): SafeShareTemplateKind {
  const kind = cleanText(value, 80);
  return safeShareTemplateKinds.includes(kind as SafeShareTemplateKind) ? (kind as SafeShareTemplateKind) : "profile";
}

export function findUnsafeShareCopy(copy: string): UnsafeCopyFinding[] {
  const lower = copy.toLowerCase();
  return unsafeShareTerms
    .filter(({ term }) => lower.includes(term))
    .map(({ term, reason }) => ({ term, reason }));
}

export function generateSafeShareText(input: SafeShareInput) {
  const subject = compact(input.subject, 120) || "this public record";
  const topic = compact(input.topic, 120) || "the missing source";
  const question = compact(input.question, 220) || `Which public record answers the question about ${subject}?`;
  const rawUrl = compact(input.url, 1000);
  const url = cleanUrl(rawUrl) || canonicalShareUrl(rawUrl || "/");
  const kind = normalizeSafeShareKind(input.kind);

  const templates: Record<SafeShareTemplateKind, string> = {
    source_gap: `RepWatchr is looking for a public source for ${subject} on ${topic}. Add a source here: ${url}`,
    profile: `Watch public-record updates for ${subject} on RepWatchr: ${url}`,
    public_question: `Public question for ${subject}: ${question} Source/context: ${url}`,
    race: `Follow public-record updates for ${subject} here: ${url}`,
    packet: `I built a public source packet for ${subject}. Review or add sources here: ${url}`,
    correction: `See something wrong on this public profile? Request a correction here: ${url}`,
  };

  return templates[kind];
}

export function safeSharePrimaryPrompt() {
  return "Help attach the receipt.";
}

export function safeShareSecondaryPrompt() {
  return "Send this to someone who follows this official, race, or public body.";
}

export function normalizeReferralRoute(value: unknown) {
  const route = cleanPath(value);
  if (route.startsWith("/api") || route.startsWith("/admin") || route.startsWith("/dashboard") || route.startsWith("/auth")) {
    return "/";
  }
  return route.split("#")[0].slice(0, 1000) || "/";
}
