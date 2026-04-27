import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  getMemberAccountContext,
  memberDatabaseUnavailableResponse,
} from "@/lib/member-auth";

export const runtime = "nodejs";

type ProfileBody = {
  displayName?: string;
  homeLocation?: string;
  preferredState?: string;
  researchFocus?: string;
  publicProfileEnabled?: boolean;
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET() {
  const context = await getMemberAccountContext();
  if (!context) {
    return NextResponse.json({ error: "Member session required." }, { status: 401 });
  }

  return NextResponse.json(context);
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return memberDatabaseUnavailableResponse();

  const context = await getMemberAccountContext();
  if (!context) {
    return NextResponse.json({ error: "Member session required." }, { status: 401 });
  }

  let body: ProfileBody;
  try {
    body = (await request.json()) as ProfileBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { error } = await supabase.from("member_profiles").upsert(
    {
      user_id: context.user.id,
      display_name: cleanText(body.displayName, 120) || null,
      home_location: cleanText(body.homeLocation, 200) || null,
      preferred_state: cleanText(body.preferredState, 40) || "TX",
      research_focus: cleanText(body.researchFocus, 2000) || null,
      public_profile_enabled: Boolean(body.publicProfileEnabled),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(await getMemberAccountContext());
}
