import { getRepWatchrService, getRepWatchrServices } from "@/data/repwatchr-services";
import { cleanEmail, cleanLongText, cleanText } from "@/lib/source-submissions";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getFeatureFlagSnapshot, normalizeFeatureFlagKey } from "@/lib/feature-flags";

export const PACKAGE_CANDIDATES = [
  {
    key: "quick-record-check",
    name: "Quick Record Check",
    expectedRange: "$49-$99",
    variants: [
      { key: "qrc_49", label: "$49", priceCents: 4900 },
      { key: "qrc_79", label: "$79", priceCents: 7900 },
      { key: "qrc_99", label: "$99", priceCents: 9900 },
    ],
  },
  {
    key: "official-record-brief",
    name: "Official Record Brief",
    expectedRange: "$199-$499",
    variants: [
      { key: "orb_199", label: "$199", priceCents: 19900 },
      { key: "orb_299", label: "$299", priceCents: 29900 },
      { key: "orb_499", label: "$499", priceCents: 49900 },
    ],
  },
  {
    key: "local-race-source-pack",
    name: "Local Race Source Pack",
    expectedRange: "$149-$499",
    variants: [
      { key: "lrsp_149", label: "$149", priceCents: 14900 },
      { key: "lrsp_299", label: "$299", priceCents: 29900 },
      { key: "lrsp_499", label: "$499", priceCents: 49900 },
    ],
  },
  {
    key: "election-watch-desk",
    name: "Election Watch Desk",
    expectedRange: "$500-$1,500/mo",
    variants: [
      { key: "ewd_500", label: "$500/mo", priceCents: 50000 },
      { key: "ewd_750", label: "$750/mo", priceCents: 75000 },
      { key: "ewd_1500", label: "$1,500/mo", priceCents: 150000 },
    ],
  },
  {
    key: "school-board-monitor",
    name: "School Board Monitor",
    expectedRange: "$99-$499/mo",
    variants: [
      { key: "sbm_99", label: "$99/mo", priceCents: 9900 },
      { key: "sbm_199", label: "$199/mo", priceCents: 19900 },
      { key: "sbm_499", label: "$499/mo", priceCents: 49900 },
    ],
  },
] as const;

export const BETA_ACCESS_STATUSES = ["new", "reviewed", "invited", "active", "not_fit", "waitlist", "archived"] as const;
export const PRICING_EXPERIMENT_STATUSES = ["draft", "active", "paused", "completed", "archived"] as const;

export type BetaAccessStatus = (typeof BETA_ACCESS_STATUSES)[number];
export type PricingExperimentStatus = (typeof PRICING_EXPERIMENT_STATUSES)[number];

export type BetaAccessInput = {
  anonymousId?: unknown;
  email?: unknown;
  name?: unknown;
  packageKey?: unknown;
  useCase?: unknown;
  jurisdiction?: unknown;
  organizationType?: unknown;
  urgency?: unknown;
};

export type NormalizedBetaAccessInput = {
  anonymousId: string;
  email: string;
  name: string;
  packageKey: string;
  useCase: string;
  jurisdiction: string;
  organizationType: string;
  urgency: string;
};

export type BetaAccessRequestRow = {
  id: string;
  anonymous_id: string | null;
  user_id: string | null;
  email: string;
  name: string | null;
  package_key: string;
  use_case: string | null;
  jurisdiction: string | null;
  organization_type: string | null;
  urgency: string | null;
  status: string;
  invite_code: string | null;
  invited_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PricingExperimentRow = {
  id: string;
  key: string;
  package_key: string;
  name: string;
  status: string;
  hypothesis: string | null;
  variants: Array<Record<string, unknown>>;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PricingExperimentEventRow = {
  id: string;
  experiment_id: string | null;
  anonymous_id: string | null;
  user_id: string | null;
  variant_key: string | null;
  event_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

function normalizePackageKey(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

export function getPackageCandidate(packageKey: string) {
  const normalized = normalizePackageKey(packageKey);
  return PACKAGE_CANDIDATES.find((item) => item.key === normalized) ?? null;
}

export function getPackageName(packageKey: string) {
  return getPackageCandidate(packageKey)?.name ?? getRepWatchrService(packageKey)?.name ?? packageKey.replaceAll("-", " ");
}

export function getExpectedPriceRange(packageKey: string) {
  return getPackageCandidate(packageKey)?.expectedRange ?? "";
}

export function normalizeBetaAccessInput(input: BetaAccessInput): NormalizedBetaAccessInput {
  return {
    anonymousId: cleanText(input.anonymousId, 120),
    email: cleanEmail(input.email),
    name: cleanText(input.name, 255),
    packageKey: normalizePackageKey(input.packageKey),
    useCase: cleanLongText(input.useCase, 3000),
    jurisdiction: cleanText(input.jurisdiction, 500),
    organizationType: cleanText(input.organizationType, 255),
    urgency: cleanText(input.urgency, 255),
  };
}

export function validateBetaAccessInput(input: NormalizedBetaAccessInput) {
  if (!input.email) return "Add a valid email address.";
  if (!input.packageKey) return "Choose a package.";
  if (!getPackageCandidate(input.packageKey) && !getRepWatchrService(input.packageKey)) return "Choose a valid RepWatchr package.";
  if (!input.useCase && !input.jurisdiction) return "Tell us what you need monitored or which jurisdiction matters.";
  return "";
}

export function normalizeBetaStatus(value: unknown): BetaAccessStatus {
  const normalized = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return BETA_ACCESS_STATUSES.includes(normalized as BetaAccessStatus) ? (normalized as BetaAccessStatus) : "new";
}

export function normalizeExperimentStatus(value: unknown): PricingExperimentStatus {
  const normalized = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return PRICING_EXPERIMENT_STATUSES.includes(normalized as PricingExperimentStatus) ? (normalized as PricingExperimentStatus) : "draft";
}

export function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function makeInviteCode(packageKey: string) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${normalizePackageKey(packageKey).slice(0, 8).toUpperCase()}-${random}`;
}

export async function recordPricingExperimentEvent(input: {
  experimentId?: string | null;
  anonymousId?: string | null;
  userId?: string | null;
  variantKey?: string | null;
  eventName: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { skipped: true };
  const { error } = await supabase.from("pricing_experiment_events").insert({
    experiment_id: cleanText(input.experimentId, 80) || null,
    anonymous_id: cleanText(input.anonymousId, 120) || null,
    user_id: cleanText(input.userId, 80) || null,
    variant_key: cleanText(input.variantKey, 120) || null,
    event_name: cleanText(input.eventName, 120),
    metadata: input.metadata ?? {},
  });
  return { skipped: Boolean(error), error: error?.message };
}

async function countRows(table: string, filters: Record<string, string> = {}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return 0;
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { count } = await query;
  return count ?? 0;
}

export async function getPricingAdminData() {
  const supabase = getSupabaseAdminClient();
  const flags = await getFeatureFlagSnapshot();
  const errors: string[] = [];
  const servicePackages = getRepWatchrServices().filter((service) => service.priceCents > 0);

  if (!supabase) {
    return {
      flags,
      experiments: [] as PricingExperimentRow[],
      events: [] as PricingExperimentEventRow[],
      betaRequests: [] as BetaAccessRequestRow[],
      packageCandidates: PACKAGE_CANDIDATES,
      servicePackages,
      demandByPackage: [] as Array<{ packageKey: string; packageName: string; count: number }>,
      stats: { totalBeta: 0, newBeta: 0, invitedBeta: 0, activeExperiments: 0, totalEvents: 0 },
      errors: ["Supabase admin client is not configured."],
    };
  }

  const [experimentsResponse, eventsResponse, betaResponse] = await Promise.all([
    supabase.from("pricing_experiments").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("pricing_experiment_events").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("beta_access_requests").select("*").order("created_at", { ascending: false }).limit(300),
  ]);

  if (experimentsResponse.error) errors.push(`pricing_experiments: ${experimentsResponse.error.message}`);
  if (eventsResponse.error) errors.push(`pricing_experiment_events: ${eventsResponse.error.message}`);
  if (betaResponse.error) errors.push(`beta_access_requests: ${betaResponse.error.message}`);

  const demandByPackage = await Promise.all(
    PACKAGE_CANDIDATES.map(async (candidate) => ({
      packageKey: candidate.key,
      packageName: candidate.name,
      count: await countRows("beta_access_requests", { package_key: candidate.key }),
    })),
  );

  const [totalBeta, newBeta, invitedBeta, activeExperiments, totalEvents] = await Promise.all([
    countRows("beta_access_requests"),
    countRows("beta_access_requests", { status: "new" }),
    countRows("beta_access_requests", { status: "invited" }),
    countRows("pricing_experiments", { status: "active" }),
    countRows("pricing_experiment_events"),
  ]);

  return {
    flags,
    experiments: (experimentsResponse.data ?? []) as PricingExperimentRow[],
    events: (eventsResponse.data ?? []) as PricingExperimentEventRow[],
    betaRequests: (betaResponse.data ?? []) as BetaAccessRequestRow[],
    packageCandidates: PACKAGE_CANDIDATES,
    servicePackages,
    demandByPackage,
    stats: { totalBeta, newBeta, invitedBeta, activeExperiments, totalEvents },
    errors,
  };
}

export type PricingAdminData = Awaited<ReturnType<typeof getPricingAdminData>>;

export function normalizeExperimentKey(value: unknown) {
  return cleanText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function normalizeExperimentVariants(value: unknown, packageKey: string) {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object").slice(0, 8);
  const candidate = getPackageCandidate(packageKey);
  return candidate ? [...candidate.variants] : [];
}

export function normalizeFlagRollout(value: unknown) {
  const numeric = typeof value === "number" ? value : Number.parseInt(String(value ?? "0"), 10);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

export function normalizeFlagKeyForAdmin(value: unknown) {
  return normalizeFeatureFlagKey(value);
}
