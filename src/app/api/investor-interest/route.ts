import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { cleanEmail, cleanLongText, cleanText } from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InterestBody = {
  name?: unknown;
  email?: unknown;
  organization?: unknown;
  interestType?: unknown;
  checkSizeOrPartnershipType?: unknown;
  message?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as InterestBody | null;
  const name = cleanText(body?.name, 255);
  const email = cleanEmail(body?.email);
  const organization = cleanText(body?.organization, 255);
  const interestType = cleanText(body?.interestType, 120) || "Investor interest";
  const checkSizeOrPartnershipType = cleanText(body?.checkSizeOrPartnershipType, 255);
  const message = cleanLongText(body?.message, 5000);

  if (!name) {
    return NextResponse.json({ error: "Add your name." }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "Add a valid email address." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "The interest form is temporarily unavailable." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("partner_interest_forms")
    .insert({
      name,
      email,
      organization: organization || null,
      interest_type: interestType,
      check_size_or_partnership_type: checkSizeOrPartnershipType || null,
      message: message || null,
      status: "new",
      metadata: {
        intake: "investors_page",
      },
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    return NextResponse.json({ error: error?.message ?? "The interest form did not return an ID." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
