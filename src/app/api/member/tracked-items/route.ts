import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  getMemberAccountContext,
  memberDatabaseUnavailableResponse,
} from "@/lib/member-auth";

export const runtime = "nodejs";

const itemTypes = new Set(["official", "school_board", "county", "race", "research"]);

type TrackedItemBody = {
  label?: string;
  href?: string;
  type?: string;
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return memberDatabaseUnavailableResponse();

  const context = await getMemberAccountContext();
  if (!context) {
    return NextResponse.json({ error: "Member session required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("member_tracked_items")
    .select("id, label, href, item_type")
    .eq("user_id", context.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []).map((item) => ({
      id: item.id as string,
      label: item.label as string,
      href: item.href as string,
      type: item.item_type as string,
    })),
  });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return memberDatabaseUnavailableResponse();

  const context = await getMemberAccountContext();
  if (!context) {
    return NextResponse.json({ error: "Member session required." }, { status: 401 });
  }

  let body: TrackedItemBody;
  try {
    body = (await request.json()) as TrackedItemBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const label = cleanText(body.label, 200);
  const href = cleanText(body.href, 1000);
  const type = itemTypes.has(body.type ?? "") ? body.type : "official";

  if (!label || !href) {
    return NextResponse.json({ error: "Label and href are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("member_tracked_items")
    .insert({
      user_id: context.user.id,
      label,
      href,
      item_type: type,
    })
    .select("id, label, href, item_type")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not save item." }, { status: 500 });
  }

  return NextResponse.json({
    item: {
      id: data.id as string,
      label: data.label as string,
      href: data.href as string,
      type: data.item_type as string,
    },
  });
}
