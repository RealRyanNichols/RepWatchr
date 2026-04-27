import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  getMemberAccountContext,
  memberDatabaseUnavailableResponse,
} from "@/lib/member-auth";

export const runtime = "nodejs";

type VerifyBody = {
  county?: string;
  district?: string;
  dlHash?: string;
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return memberDatabaseUnavailableResponse();

  const context = await getMemberAccountContext();
  if (!context) {
    return NextResponse.json({ error: "Member session required." }, { status: 401 });
  }

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const county = cleanText(body.county, 120);
  const district = cleanText(body.district, 120);
  const dlHash = cleanText(body.dlHash, 128);

  if (!county || !dlHash) {
    return NextResponse.json({ error: "County and hashed ID are required." }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: context.user.id,
      county,
      district: district || null,
      verified: true,
      dl_hash: dlHash,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return NextResponse.json(
        { error: "This ID hash is already associated with another account." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(await getMemberAccountContext());
}
