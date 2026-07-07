import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  normalizeBetaAccessInput,
  recordPricingExperimentEvent,
  validateBetaAccessInput,
  type BetaAccessInput,
} from "@/lib/pricing-beta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOptionalUserId() {
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
  const body = (await request.json().catch(() => null)) as BetaAccessInput | null;
  const input = normalizeBetaAccessInput(body ?? {});
  const validationError = validateBetaAccessInput(input);

  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Beta access requests are temporarily unavailable. Try again later." },
      { status: 503 },
    );
  }

  const userId = await getOptionalUserId();
  const { data, error } = await supabase
    .from("beta_access_requests")
    .insert({
      anonymous_id: input.anonymousId || null,
      user_id: userId,
      email: input.email,
      name: input.name || null,
      package_key: input.packageKey,
      use_case: input.useCase || null,
      jurisdiction: input.jurisdiction || null,
      organization_type: input.organizationType || null,
      urgency: input.urgency || null,
      status: "new",
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    return NextResponse.json({ error: error?.message ?? "Beta access request did not return an ID." }, { status: 500 });
  }

  await recordPricingExperimentEvent({
    anonymousId: input.anonymousId,
    userId,
    eventName: "beta_access_requested",
    metadata: {
      beta_access_request_id: data.id,
      package_key: input.packageKey,
      jurisdiction: input.jurisdiction || null,
      organization_type: input.organizationType || null,
    },
  });

  return NextResponse.json({ ok: true, id: data.id });
}
