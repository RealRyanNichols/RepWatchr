import { NextResponse } from "next/server";
import { getRepWatchrPackageByKey } from "@/data/repwatchr-packages";
import {
  buildPackageInterestSummary,
  normalizePackageEmail,
  normalizePackageInterestText,
  packageInterestSchema,
} from "@/lib/package-interest";
import { serverTrackEvent, updateInterestScore, updateVisitorProfile } from "@/lib/analytics-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hasUnsafeRequestLanguage(text: string) {
  return /\b(home address|private address|minor child|kids? address|threaten|harass|doxx|dox|swat|stalk)\b/i.test(text);
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
  const parsed = packageInterestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Check the package interest form and try again.",
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  if (input.honeypot) {
    return NextResponse.json({ ok: false, message: "The request could not be accepted." }, { status: 400 });
  }

  const combinedText = [input.useCase, input.message, input.entityId, input.jurisdiction].filter(Boolean).join(" ");
  if (hasUnsafeRequestLanguage(combinedText)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "RepWatchr can only collect public-record, source-safe package requests. Remove private addresses, minor details, threats, or harassment language and try again.",
      },
      { status: 400 },
    );
  }

  const packageItem = getRepWatchrPackageByKey(input.packageKey);
  if (!packageItem) {
    return NextResponse.json({ ok: false, message: "Package is not available." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        message: "The package interest queue is not available right now. Keep your request text and try again.",
      },
      { status: 503 },
    );
  }

  const userId = await getAuthenticatedUserId();
  const attribution = {
    referrer: normalizePackageInterestText(input.referrer, 500),
    utm: input.utm,
  };
  const row = {
    anonymous_id: normalizePackageInterestText(input.anonymousId, 120),
    user_id: userId,
    email: normalizePackageEmail(input.email),
    name: normalizePackageInterestText(input.name, 120),
    package_key: input.packageKey,
    package_name: packageItem.name,
    source_route: normalizePackageInterestText(input.sourceRoute, 500) ?? `/packages/${packageItem.slug}`,
    entity_type: normalizePackageInterestText(input.entityType, 80),
    entity_id: normalizePackageInterestText(input.entityId, 180),
    jurisdiction: normalizePackageInterestText(input.jurisdiction, 180),
    urgency: input.urgency,
    use_case: input.useCase,
    budget_range: input.budgetRange ?? null,
    organization_type: input.organizationType,
    message: normalizePackageInterestText(input.message, 2000),
    attribution,
    status: "new",
  };

  const { data, error } = await admin
    .from("package_interest")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "The package interest queue is not ready yet. Keep your request text and try again.",
      },
      { status: 503 },
    );
  }

  const route = row.source_route ?? `/packages/${packageItem.slug}`;
  await Promise.all([
    admin.from("pricing_experiment_events").insert({
      anonymous_id: row.anonymous_id,
      user_id: userId,
      event_name: "package_interest_submitted",
      metadata: {
        package_key: input.packageKey,
        package_slug: packageItem.slug,
        package_interest_id: data.id,
        organization_type: input.organizationType,
        urgency: input.urgency,
        jurisdiction: row.jurisdiction,
        source_route: route,
        attribution,
      },
    }),
    serverTrackEvent({
      eventName: "package_interest_submitted",
      anonymousId: row.anonymous_id,
      userId,
      route,
      referrer: attribution.referrer,
      utm_source: input.utm.utm_source ?? null,
      utm_medium: input.utm.utm_medium ?? null,
      utm_campaign: input.utm.utm_campaign ?? null,
      utm_term: input.utm.utm_term ?? null,
      utm_content: input.utm.utm_content ?? null,
      metadata: {
        package_key: input.packageKey,
        package_slug: packageItem.slug,
        package_interest_id: data.id,
        organization_type: input.organizationType,
        urgency: input.urgency,
      },
    }),
    updateVisitorProfile({
      eventName: "package_interest_submitted",
      anonymousId: row.anonymous_id,
      userId,
      route,
      referrer: attribution.referrer,
      metadata: { package_key: input.packageKey, package_slug: packageItem.slug },
    }),
    updateInterestScore({
      eventType: "package_interest_submitted",
      anonymousId: row.anonymous_id,
      userId,
      path: route,
      entityType: "package",
      entityId: input.packageKey,
      metadata: {
        package_key: input.packageKey,
        package_slug: packageItem.slug,
        jurisdiction: row.jurisdiction ?? "",
        organization_type: input.organizationType,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    submissionId: data.id,
    summary: buildPackageInterestSummary(input),
    message: "Package interest received.",
  });
}
