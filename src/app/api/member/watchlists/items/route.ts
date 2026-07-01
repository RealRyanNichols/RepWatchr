import { NextRequest, NextResponse } from "next/server";
import { isWatchEntityType } from "@/lib/member-watchlists";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WatchItemBody = {
  id?: unknown;
  watchlistId?: unknown;
  entityType?: unknown;
  entityId?: unknown;
  label?: unknown;
  href?: unknown;
  jurisdiction?: unknown;
  sourceContext?: unknown;
  notes?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanHref(value: unknown) {
  const href = cleanText(value, 1000);
  if (!href) return null;
  if (href.startsWith("/")) return href;
  try {
    const url = new URL(href);
    return `${url.hostname}${url.pathname}`.slice(0, 1000);
  } catch {
    return href;
  }
}

function cleanUuid(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleaned)
    ? cleaned
    : null;
}

async function getUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { supabase: null, userId: null, error: "Supabase is not configured." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? null, error: user ? null : "Login required." };
}

export async function POST(request: NextRequest) {
  const { supabase, userId, error } = await getUser();
  if (!supabase || !userId) {
    return NextResponse.json({ ok: false, error }, { status: error === "Login required." ? 401 : 503 });
  }

  const body = (await request.json().catch(() => null)) as WatchItemBody | null;
  const watchlistId = cleanUuid(body?.watchlistId);
  const label = cleanText(body?.label, 220);
  const entityType = body?.entityType;

  if (!watchlistId) return NextResponse.json({ ok: false, error: "Valid watchlist id is required." }, { status: 400 });
  if (!label) return NextResponse.json({ ok: false, error: "Watched target label is required." }, { status: 400 });
  if (!isWatchEntityType(entityType)) return NextResponse.json({ ok: false, error: "Unsupported watch entity type." }, { status: 400 });

  const created = await supabase
    .from("member_watchlist_items")
    .insert({
      watchlist_id: watchlistId,
      user_id: userId,
      entity_type: entityType,
      entity_id: cleanText(body?.entityId, 180),
      label,
      href: cleanHref(body?.href),
      jurisdiction: cleanText(body?.jurisdiction, 180),
      source_context: cleanText(body?.sourceContext, 500),
      notes: cleanText(body?.notes, 2000),
      active: true,
    })
    .select("id, watchlist_id, entity_type, entity_id, label, href, jurisdiction, source_context, notes, active, created_at, updated_at")
    .single();

  if (created.error) return NextResponse.json({ ok: false, error: created.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, item: created.data });
}

export async function PATCH(request: NextRequest) {
  const { supabase, userId, error } = await getUser();
  if (!supabase || !userId) {
    return NextResponse.json({ ok: false, error }, { status: error === "Login required." ? 401 : 503 });
  }

  const body = (await request.json().catch(() => null)) as WatchItemBody | null;
  const id = cleanUuid(body?.id);
  if (!id) return NextResponse.json({ ok: false, error: "Valid item id is required." }, { status: 400 });

  const patch: Record<string, string | null> = {};
  const label = cleanText(body?.label, 220);
  if (label) patch.label = label;
  if (body && "href" in body) patch.href = cleanHref(body.href);
  if (body && "jurisdiction" in body) patch.jurisdiction = cleanText(body.jurisdiction, 180);
  if (body && "sourceContext" in body) patch.source_context = cleanText(body.sourceContext, 500);
  if (body && "notes" in body) patch.notes = cleanText(body.notes, 2000);

  const updated = await supabase
    .from("member_watchlist_items")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, watchlist_id, entity_type, entity_id, label, href, jurisdiction, source_context, notes, active, created_at, updated_at")
    .single();

  if (updated.error) return NextResponse.json({ ok: false, error: updated.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: updated.data });
}

export async function DELETE(request: NextRequest) {
  const { supabase, userId, error } = await getUser();
  if (!supabase || !userId) {
    return NextResponse.json({ ok: false, error }, { status: error === "Login required." ? 401 : 503 });
  }

  const id = cleanUuid(request.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false, error: "Valid item id is required." }, { status: 400 });

  const removed = await supabase
    .from("member_watchlist_items")
    .update({ active: false })
    .eq("id", id)
    .eq("user_id", userId);

  if (removed.error) return NextResponse.json({ ok: false, error: removed.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
