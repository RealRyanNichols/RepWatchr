import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { generateDigestPreview } from "@/lib/digest-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Supabase auth is not configured." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const preview = await generateDigestPreview(user.id);
  const admin = getSupabaseAdminClient();
  if (admin) {
    await admin.from("notification_events").insert({
      user_id: user.id,
      event_type: "digest_preview_generated",
      metadata: { digest_type: preview.digestType, sections: preview.sections.length },
    });
  }

  return NextResponse.json({ ok: true, preview });
}
