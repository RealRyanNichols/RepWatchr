import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultWatchAlertPreferences,
  isWatchAlertType,
  type WatchAlertType,
} from "@/lib/member-watchlists";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WatchlistPatchBody = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  color?: unknown;
  isDefault?: unknown;
  alertPreferences?: unknown;
};

const colors = new Set(["blue", "red", "gold", "green", "slate"]);

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanUuid(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleaned)
    ? cleaned
    : null;
}

function cleanColor(value: unknown) {
  const color = cleanText(value, 20) ?? "blue";
  return colors.has(color) ? color : "blue";
}

function cleanAlertPreferences(value: unknown) {
  if (!Array.isArray(value)) return null;

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as { alertType?: unknown; enabled?: unknown };
      if (!isWatchAlertType(record.alertType)) return null;
      return {
        alertType: record.alertType,
        enabled: Boolean(record.enabled),
      };
    })
    .filter((item): item is { alertType: WatchAlertType; enabled: boolean } => Boolean(item));
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

async function loadWatchlists(supabase: SupabaseClient, userId: string) {
  const [watchlistsResult, itemsResult, preferencesResult, alertsResult] = await Promise.all([
    supabase
      .from("member_watchlists")
      .select("id, name, description, color, is_default, last_alert_at, last_digest_at, created_at, updated_at")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("member_watchlist_items")
      .select("id, watchlist_id, entity_type, entity_id, label, href, jurisdiction, source_context, notes, active, created_at, updated_at")
      .eq("user_id", userId)
      .eq("active", true)
      .order("updated_at", { ascending: false }),
    supabase
      .from("member_watchlist_alert_preferences")
      .select("id, watchlist_id, alert_type, enabled, delivery_channels, minimum_severity, last_sent_at, updated_at")
      .eq("user_id", userId),
    supabase
      .from("member_watchlist_alert_events")
      .select("id, watchlist_id, watchlist_item_id, alert_type, title, summary, href, severity, status, triggered_at")
      .eq("user_id", userId)
      .neq("status", "dismissed")
      .order("triggered_at", { ascending: false })
      .limit(30),
  ]);

  if (watchlistsResult.error) {
    return { error: watchlistsResult.error.message, watchlists: [] };
  }

  const items = itemsResult.data ?? [];
  const preferences = preferencesResult.data ?? [];
  const alerts = alertsResult.data ?? [];

  return {
    error: null,
    watchlists: (watchlistsResult.data ?? []).map((watchlist) => ({
      ...watchlist,
      items: items.filter((item) => item.watchlist_id === watchlist.id),
      alertPreferences: preferences.filter((preference) => preference.watchlist_id === watchlist.id),
      alerts: alerts.filter((alert) => alert.watchlist_id === watchlist.id).slice(0, 5),
    })),
  };
}

export async function GET() {
  const { supabase, userId, error } = await getUser();
  if (!supabase || !userId) {
    return NextResponse.json({ ok: false, error }, { status: error === "Login required." ? 401 : 503 });
  }

  const result = await loadWatchlists(supabase, userId);
  if (result.error) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });

  return NextResponse.json({ ok: true, watchlists: result.watchlists });
}

export async function POST(request: NextRequest) {
  const { supabase, userId, error } = await getUser();
  if (!supabase || !userId) {
    return NextResponse.json({ ok: false, error }, { status: error === "Login required." ? 401 : 503 });
  }

  const body = (await request.json().catch(() => null)) as WatchlistPatchBody | null;
  const name = cleanText(body?.name, 160);
  if (!name) return NextResponse.json({ ok: false, error: "Watchlist name is required." }, { status: 400 });

  const created = await supabase
    .from("member_watchlists")
    .insert({
      user_id: userId,
      name,
      description: cleanText(body?.description, 1000),
      color: cleanColor(body?.color),
      is_default: Boolean(body?.isDefault),
    })
    .select("id, name, description, color, is_default, last_alert_at, last_digest_at, created_at, updated_at")
    .single();

  if (created.error) return NextResponse.json({ ok: false, error: created.error.message }, { status: 500 });

  const preferences = defaultWatchAlertPreferences.map((preference) => ({
    watchlist_id: created.data.id,
    user_id: userId,
    alert_type: preference.alertType,
    enabled: preference.enabled,
    delivery_channels: ["in_app"],
  }));

  await supabase.from("member_watchlist_alert_preferences").insert(preferences);

  return NextResponse.json({ ok: true, watchlist: { ...created.data, items: [], alertPreferences: preferences, alerts: [] } });
}

export async function PATCH(request: NextRequest) {
  const { supabase, userId, error } = await getUser();
  if (!supabase || !userId) {
    return NextResponse.json({ ok: false, error }, { status: error === "Login required." ? 401 : 503 });
  }

  const body = (await request.json().catch(() => null)) as WatchlistPatchBody | null;
  const id = cleanUuid(body?.id);
  if (!id) return NextResponse.json({ ok: false, error: "Valid watchlist id is required." }, { status: 400 });

  const patch: Record<string, string | null> = {};
  const name = cleanText(body?.name, 160);
  const description = typeof body?.description === "string" ? cleanText(body.description, 1000) : undefined;

  if (name) patch.name = name;
  if (description !== undefined) patch.description = description;
  if (body && "color" in body) patch.color = cleanColor(body.color);

  if (Object.keys(patch).length) {
    const updateResult = await supabase
      .from("member_watchlists")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);
    if (updateResult.error) return NextResponse.json({ ok: false, error: updateResult.error.message }, { status: 500 });
  }

  const alertPreferences = cleanAlertPreferences(body?.alertPreferences);
  if (alertPreferences?.length) {
    const upsertRows = alertPreferences.map((preference) => ({
      watchlist_id: id,
      user_id: userId,
      alert_type: preference.alertType,
      enabled: preference.enabled,
      delivery_channels: ["in_app"],
      updated_at: new Date().toISOString(),
    }));

    const upsert = await supabase
      .from("member_watchlist_alert_preferences")
      .upsert(upsertRows, { onConflict: "watchlist_id,alert_type" });
    if (upsert.error) return NextResponse.json({ ok: false, error: upsert.error.message }, { status: 500 });
  }

  const result = await loadWatchlists(supabase, userId);
  if (result.error) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });

  return NextResponse.json({ ok: true, watchlists: result.watchlists });
}

export async function DELETE(request: NextRequest) {
  const { supabase, userId, error } = await getUser();
  if (!supabase || !userId) {
    return NextResponse.json({ ok: false, error }, { status: error === "Login required." ? 401 : 503 });
  }

  const id = cleanUuid(request.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false, error: "Valid watchlist id is required." }, { status: 400 });

  const archive = await supabase
    .from("member_watchlists")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (archive.error) return NextResponse.json({ ok: false, error: archive.error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
