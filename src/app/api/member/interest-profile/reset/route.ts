import { NextResponse } from "next/server";
import { serverTrackEvent } from "@/lib/analytics-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function envReady() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function POST() {
  if (!envReady()) {
    return NextResponse.json({ ok: false, error: "Interest profile reset needs Supabase auth." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Interest reset needs server data access configured." }, { status: 503 });
  }

  const { error: deleteError } = await admin
    .from("visitor_interest_scores")
    .delete()
    .eq("user_id", user.id);

  if (deleteError && !/does not exist|schema cache/i.test(deleteError.message)) {
    return NextResponse.json({ ok: false, error: "Interest profile could not be reset." }, { status: 500 });
  }

  await serverTrackEvent({
    eventName: "interest_profile_reset",
    userId: user.id,
    route: "/dashboard",
    metadata: { reset: true },
  });

  return NextResponse.json({ ok: true });
}
