import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  getMemberAccountContext,
  memberDatabaseUnavailableResponse,
} from "@/lib/member-auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return memberDatabaseUnavailableResponse();

  const memberContext = await getMemberAccountContext();
  if (!memberContext) {
    return NextResponse.json({ error: "Member session required." }, { status: 401 });
  }

  const { itemId } = await context.params;
  if (!itemId) {
    return NextResponse.json({ error: "Tracked item ID is required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("member_tracked_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", memberContext.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
