import { z } from "zod";
import {
  PACKAGE_BUDGET_RANGES,
  PACKAGE_ORGANIZATION_TYPES,
  PACKAGE_URGENCY_OPTIONS,
  getRepWatchrPackageByKey,
  getRepWatchrPackageOptions,
  type PackageKey,
} from "@/data/repwatchr-packages";

const packageKeys = getRepWatchrPackageOptions().map((item) => item.packageKey) as [PackageKey, ...PackageKey[]];

export const packageInterestStatuses = [
  "new",
  "reviewed",
  "contacted",
  "qualified",
  "beta_candidate",
  "not_fit",
  "converted_to_order",
  "archived",
] as const;

export type PackageInterestStatus = (typeof packageInterestStatuses)[number];

export type PackageInterestRow = {
  id: string;
  anonymous_id: string | null;
  user_id: string | null;
  email: string | null;
  name: string | null;
  package_key: PackageKey;
  package_name: string;
  source_route: string | null;
  entity_type: string | null;
  entity_id: string | null;
  jurisdiction: string | null;
  urgency: string | null;
  use_case: string | null;
  budget_range: string | null;
  organization_type: string | null;
  message: string | null;
  attribution: Record<string, unknown>;
  status: PackageInterestStatus;
  created_at: string;
  updated_at?: string | null;
};

export const packageInterestSchema = z.object({
  anonymousId: z.string().trim().max(120).optional().nullable(),
  packageKey: z.enum(packageKeys),
  email: z.string().trim().email().max(180),
  name: z.string().trim().max(120).optional().nullable(),
  sourceRoute: z.string().trim().max(500).optional().nullable(),
  entityType: z.string().trim().max(80).optional().nullable(),
  entityId: z.string().trim().max(180).optional().nullable(),
  jurisdiction: z.string().trim().max(180).optional().nullable(),
  urgency: z.enum(PACKAGE_URGENCY_OPTIONS).optional().default("this month"),
  useCase: z.string().trim().min(12).max(3000),
  budgetRange: z.enum(PACKAGE_BUDGET_RANGES).optional().nullable(),
  organizationType: z.enum(PACKAGE_ORGANIZATION_TYPES).optional().default("individual citizen"),
  message: z.string().trim().max(2000).optional().nullable(),
  referrer: z.string().trim().max(500).optional().nullable(),
  utm: z
    .object({
      utm_source: z.string().trim().max(120).optional().nullable(),
      utm_medium: z.string().trim().max(120).optional().nullable(),
      utm_campaign: z.string().trim().max(160).optional().nullable(),
      utm_term: z.string().trim().max(160).optional().nullable(),
      utm_content: z.string().trim().max(160).optional().nullable(),
    })
    .optional()
    .default({}),
  honeypot: z.string().max(0).optional().nullable(),
});

export type PackageInterestInput = z.infer<typeof packageInterestSchema>;

export type ReadinessRecommendation =
  | "Do not sell yet"
  | "Test waitlist"
  | "Launch beta manually"
  | "Build landing page"
  | "Launch checkout"
  | "Needs more traffic"
  | "Needs clearer offer"
  | "Needs fulfillment workflow"
  | "Needs source review process";

export type PackageDemandSummary = {
  packageKey: PackageKey;
  packageName: string;
  totalInterest: number;
  highIntent: number;
  anonymousInterest: number;
  namedInterest: number;
  topJurisdictions: Array<{ label: string; count: number }>;
  topOrganizationTypes: Array<{ label: string; count: number }>;
  topUrgencies: Array<{ label: string; count: number }>;
  readinessScore: number;
  recommendation: ReadinessRecommendation;
  blockers: string[];
};

export type MonetizationReadinessCategory = {
  label: string;
  status: "blocked" | "collecting" | "candidate" | "ready";
  score: number;
  note: string;
};

function cleanText(value: string | null | undefined, maxLength = 500) {
  return value?.replace(/\s+/g, " ").trim().slice(0, maxLength) || "";
}

export function normalizePackageInterestText(value: string | null | undefined, maxLength = 500) {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
}

export function normalizePackageEmail(value: string) {
  return value.trim().toLowerCase();
}

export function buildPackageInterestSummary(input: PackageInterestInput) {
  const packageItem = getRepWatchrPackageByKey(input.packageKey);
  return [
    `Package: ${packageItem?.name ?? input.packageKey}`,
    `Jurisdiction: ${cleanText(input.jurisdiction, 180) || "Not supplied"}`,
    `Target: ${cleanText(input.entityId, 180) || "Not supplied"}`,
    `Urgency: ${input.urgency}`,
    `Organization: ${input.organizationType}`,
    `Budget range: ${input.budgetRange || "Not supplied"}`,
    "",
    `Use case: ${input.useCase}`,
    input.message ? `Message: ${input.message}` : "",
    "",
    "Next move: RepWatchr will use this as a demand signal. No payment has been collected.",
  ]
    .filter(Boolean)
    .join("\n");
}

function countBy(rows: PackageInterestRow[], key: keyof PackageInterestRow) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[key] ?? "").trim() || "unspecified";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
}

function isHighIntent(row: PackageInterestRow) {
  const urgent = ["this week", "before an election", "before a meeting", "ongoing monitoring"].includes(
    String(row.urgency ?? ""),
  );
  const hasTarget = Boolean(row.entity_id || row.jurisdiction);
  const hasUseCase = (row.use_case?.length ?? 0) >= 40;
  const hasEmail = Boolean(row.email);
  return hasEmail && hasUseCase && (urgent || hasTarget);
}

function recommendationFor(input: {
  totalInterest: number;
  highIntent: number;
  hasLandingPage: boolean;
  hasSourceReview: boolean;
  hasFulfillmentWorkflow: boolean;
  paymentsEnabled: boolean;
}): { score: number; recommendation: ReadinessRecommendation; blockers: string[] } {
  const blockers: string[] = [];
  let score = 0;

  if (input.hasLandingPage) score += 15;
  else blockers.push("Needs a public package landing page.");

  if (input.totalInterest >= 10) score += 25;
  else if (input.totalInterest >= 3) score += 15;
  else if (input.totalInterest >= 1) score += 7;
  else blockers.push("Not enough package interest yet.");

  if (input.highIntent >= 5) score += 25;
  else if (input.highIntent >= 2) score += 15;
  else if (input.highIntent >= 1) score += 8;
  else blockers.push("No high-intent demand signals yet.");

  if (input.hasSourceReview) score += 15;
  else blockers.push("Needs source review process.");

  if (input.hasFulfillmentWorkflow) score += 15;
  else blockers.push("Needs fulfillment workflow.");

  if (input.paymentsEnabled) score += 5;

  if (!input.hasLandingPage) return { score, recommendation: "Build landing page", blockers };
  if (!input.hasSourceReview) return { score, recommendation: "Needs source review process", blockers };
  if (!input.hasFulfillmentWorkflow) return { score, recommendation: "Needs fulfillment workflow", blockers };
  if (input.totalInterest < 3) return { score, recommendation: "Needs more traffic", blockers };
  if (input.highIntent < 2) return { score, recommendation: "Test waitlist", blockers };
  if (score >= 85 && input.paymentsEnabled) return { score, recommendation: "Launch checkout", blockers };
  if (score >= 70) return { score, recommendation: "Launch beta manually", blockers };
  return { score, recommendation: "Needs clearer offer", blockers };
}

export function summarizePackageDemand(
  rows: PackageInterestRow[],
  options: {
    paymentsEnabled?: boolean;
    hasSourceReview?: boolean;
    hasFulfillmentWorkflow?: boolean;
  } = {},
): PackageDemandSummary[] {
  return getRepWatchrPackageOptions().map((packageOption) => {
    const packageRows = rows.filter((row) => row.package_key === packageOption.packageKey);
    const highIntent = packageRows.filter(isHighIntent).length;
    const readiness = recommendationFor({
      totalInterest: packageRows.length,
      highIntent,
      hasLandingPage: true,
      hasSourceReview: options.hasSourceReview ?? false,
      hasFulfillmentWorkflow: options.hasFulfillmentWorkflow ?? false,
      paymentsEnabled: options.paymentsEnabled ?? false,
    });

    return {
      packageKey: packageOption.packageKey,
      packageName: packageOption.name,
      totalInterest: packageRows.length,
      highIntent,
      anonymousInterest: packageRows.filter((row) => row.anonymous_id && !row.user_id).length,
      namedInterest: packageRows.filter((row) => row.email || row.user_id).length,
      topJurisdictions: countBy(packageRows, "jurisdiction"),
      topOrganizationTypes: countBy(packageRows, "organization_type"),
      topUrgencies: countBy(packageRows, "urgency"),
      readinessScore: readiness.score,
      recommendation: readiness.recommendation,
      blockers: readiness.blockers,
    };
  });
}

export function buildMonetizationCategories(input: {
  totalInterest: number;
  highIntent: number;
  sourceSubmissionCount?: number | null;
  packetCount?: number | null;
  watchCount?: number | null;
  analyticsCount?: number | null;
  paymentsEnabled?: boolean;
}): MonetizationReadinessCategory[] {
  const trafficScore = Math.min(100, Math.round(((input.analyticsCount ?? 0) / 200) * 100));
  const demandScore = Math.min(100, Math.round((input.totalInterest / 20) * 100));
  const engagementScore = Math.min(100, Math.round((((input.packetCount ?? 0) + (input.watchCount ?? 0)) / 30) * 100));
  const dataScore = Math.min(100, Math.round(((input.sourceSubmissionCount ?? 0) / 25) * 100));
  const identityScore = input.highIntent >= 5 ? 70 : input.highIntent >= 1 ? 40 : 15;
  const trustScore = dataScore >= 50 ? 60 : 35;
  const fulfillmentScore = input.sourceSubmissionCount && input.packetCount ? 45 : 20;
  const paymentScore = input.paymentsEnabled ? 60 : 10;

  const status = (score: number): MonetizationReadinessCategory["status"] => {
    if (score >= 75) return "ready";
    if (score >= 50) return "candidate";
    if (score >= 25) return "collecting";
    return "blocked";
  };

  return [
    {
      label: "Traffic readiness",
      score: trafficScore,
      status: status(trafficScore),
      note: trafficScore >= 50 ? "Traffic signals are accumulating." : "Not enough traffic data yet.",
    },
    {
      label: "Identity readiness",
      score: identityScore,
      status: status(identityScore),
      note: input.highIntent ? "Named, reachable demand signals exist." : "Need named demand signals.",
    },
    {
      label: "Data readiness",
      score: dataScore,
      status: status(dataScore),
      note: dataScore >= 50 ? "Source submissions support future fulfillment." : "Need more source submissions.",
    },
    {
      label: "Engagement readiness",
      score: engagementScore,
      status: status(engagementScore),
      note: engagementScore >= 50 ? "Users are taking tool/watch actions." : "Need more packets, watches, and return loops.",
    },
    {
      label: "Demand readiness",
      score: demandScore,
      status: status(demandScore),
      note: input.totalInterest
        ? "Package demand is being captured."
        : "Not enough data yet. Keep collecting package interest, source submissions, watchlists, and search behavior.",
    },
    {
      label: "Trust readiness",
      score: trustScore,
      status: status(trustScore),
      note: "Source labels, correction paths, and public-record boundaries must stay active before sales.",
    },
    {
      label: "Fulfillment readiness",
      score: fulfillmentScore,
      status: status(fulfillmentScore),
      note: "Manual fulfillment needs a clear source review and delivery workflow before checkout.",
    },
    {
      label: "Payment readiness",
      score: paymentScore,
      status: status(paymentScore),
      note: input.paymentsEnabled
        ? "Payments flag is on. Verify checkout separately before selling."
        : "ENABLE_PAYMENTS is off. Interest capture should remain the public CTA.",
    },
  ];
}
