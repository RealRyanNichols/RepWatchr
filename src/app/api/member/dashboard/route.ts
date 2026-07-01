import { NextResponse } from "next/server";
import { loadMemberDashboardSnapshot } from "@/lib/member-dashboard";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function envReady() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET() {
  if (!envReady()) {
    return NextResponse.json(
      { ok: false, error: "Member dashboard storage is not configured yet." },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  }

  const snapshot = await loadMemberDashboardSnapshot(supabase, user.id);
  return NextResponse.json(snapshot);
}
