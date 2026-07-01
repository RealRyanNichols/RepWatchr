import { NextResponse } from "next/server";
import { z } from "zod";
import { PRICING_PACKAGE_CANDIDATES, getPricingPackageCandidate } from "@/data/pricing-experiments";
import { serverTrackEvent, updateInterestScore, updateVisitorProfile } from "@/lib/analytics-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const packageKeys = PRICING_PACKAGE_CANDIDATES.map((item) => item.packageKey);
const organizationTypes = [
  "citizen",
  "journalist",
  "campaign_public_affairs",
  "civic_group",
  "researcher",
  "legal_research",
  "school_board_parent",
  "county_watch",
  "other",
] as const;
const urgencyOptions = ["this_week", "this_month", "before_election", "ongoing_monitoring", "not_urgent"] as const;

const betaAccessSchema = z.object({
  anonymousId: z.string().trim().max(120).optional().nullable(),
  packageKey: z.enum(packageKeys as [string, ...string[]]),
  email: z.string().trim().email().max(180),
  name: z.string().trim().max(120).optional().nullable(),
  useCase: z.string().trim().min(20).max(3000),
  jurisdiction: z.string().trim().max(180).optional().nullable(),
  organizationType: z.enum(organizationTypes).optional().default("citizen"),
  urgency: z.enum(urgencyOptions).optional().default("this_month"),
  honeypot: z.string().max(0).optional().nullable(),
  sourceRoute: z.string().trim().max(500).optional().nullable(),
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
});

function safeText(value: string | null | undefined, fallback = "") {
  return value?.replace(/\s+/g, " ").trim() || fallback;
}

async function getAuthenticatedUserId() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = betaAccessSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Check the beta access form and try again.",
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  if (input.honeypot) {
    return NextResponse.json({ ok: false, message: "The request could not be accepted." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        message: "The beta request queue is not available right now. Keep your request text and try again.",
      },
      { status: 503 },
    );
  }

  const userId = await getAuthenticatedUserId();
  const candidate = getPricingPackageCandidate(input.packageKey);
  const requestRow = {
    anonymous_id: safeText(input.anonymousId) || null,
    user_id: userId,
    email: input.email.toLowerCase(),
    name: safeText(input.name) || null,
    package_key: input.packageKey,
    use_case: input.useCase,
    jurisdiction: safeText(input.jurisdiction) || null,
    organization_type: input.organizationType,
    urgency: input.urgency,
    status: "new",
  };

  const { data, error } = await admin
    .from("beta_access_requests")
    .insert(requestRow)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "The beta request queue is not ready yet. Keep your request text and try again.",
      },
      { status: 503 },
    );
  }

  await Promise.all([
    admin.from("pricing_experiment_events").insert({
      anonymous_id: requestRow.anonymous_id,
      user_id: userId,
      event_name: "beta_access_requested",
      metadata: {
        package_key: input.packageKey,
        request_id: data.id,
        organization_type: input.organizationType,
        urgency: input.urgency,
        source_route: input.sourceRoute ?? null,
        referrer: input.referrer ?? null,
        utm: input.utm,
      },
    }),
    serverTrackEvent({
      eventName: "beta_access_requested",
      anonymousId: requestRow.anonymous_id,
      userId,
      route: input.sourceRoute ?? "/beta-access",
      referrer: input.referrer ?? null,
      utm_source: input.utm.utm_source ?? null,
      utm_medium: input.utm.utm_medium ?? null,
      utm_campaign: input.utm.utm_campaign ?? null,
      utm_term: input.utm.utm_term ?? null,
      utm_content: input.utm.utm_content ?? null,
      metadata: {
        package_key: input.packageKey,
        request_id: data.id,
        organization_type: input.organizationType,
        urgency: input.urgency,
      },
    }),
    updateVisitorProfile({
      eventName: "beta_access_requested",
      anonymousId: requestRow.anonymous_id,
      userId,
      route: input.sourceRoute ?? "/beta-access",
      referrer: input.referrer ?? null,
      metadata: { package_key: input.packageKey },
    }),
    updateInterestScore({
      eventType: "beta_access_requested",
      anonymousId: requestRow.anonymous_id,
      userId,
      path: input.sourceRoute ?? "/beta-access",
      entityType: "package",
      entityId: input.packageKey,
      metadata: {
        package_key: input.packageKey,
        jurisdiction: input.jurisdiction ?? "",
        organization_type: input.organizationType,
      },
    }),
  ]);

  const summary = [
    `Package: ${candidate?.name ?? input.packageKey}`,
    `Jurisdiction: ${safeText(input.jurisdiction, "Not supplied")}`,
    `Use case: ${input.useCase}`,
    "",
    "Next move: RepWatchr will review package demand, scope, and beta fit before paid checkout opens.",
  ].join("\n");

  return NextResponse.json({
    ok: true,
    requestId: data.id,
    summary,
    message: "Beta request received.",
  });
}
