import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { normalizePartnerInterest, validatePartnerInterest, type PartnerInterestInput } from "@/lib/partner-pipeline";
import { cleanText } from "@/lib/source-submissions";

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
  const body = (await request.json().catch(() => null)) as PartnerInterestInput | null;
  const input = normalizePartnerInterest(body ?? {});
  const validationError = validatePartnerInterest(input);

  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "RepWatchr saved the page, but the interest queue is temporarily unavailable. Try again later." }, { status: 503 });
  }

  const userId = await getOptionalUserId();

  const { data, error } = await admin
    .from("partner_interest")
    .insert({
      anonymous_id: input.anonymousId || null,
      user_id: userId,
      name: input.name,
      email: input.email,
      organization: input.organization || null,
      title: input.title || null,
      website: input.website || null,
      interest_type: input.interestType,
      budget_or_check_size: input.budgetOrCheckSize || null,
      jurisdiction_focus: input.jurisdictionFocus || null,
      message: input.message || null,
      attribution: input.attribution,
      status: "new",
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    return NextResponse.json({ error: error?.message ?? "The interest form did not return an ID." }, { status: 500 });
  }

  await admin.from("partner_pipeline_events").insert({
    partner_interest_id: data.id,
    event_type: "submitted",
    actor_user_id: userId,
    notes: "Public investor/partner interest form submitted.",
    metadata: {
      interest_type: input.interestType,
      organization: cleanText(input.organization, 255) || null,
      source: "investors_page",
    },
  });

  return NextResponse.json({ ok: true, id: data.id });
}
