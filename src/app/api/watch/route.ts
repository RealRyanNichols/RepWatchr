import { NextResponse } from "next/server";
import { z } from "zod";
import { civicWatchEntityTypes, isWatchReason } from "@/lib/civic-actions";
import { serverTrackEvent, updateInterestScore, updateVisitorProfile } from "@/lib/analytics-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const watchSchema = z.object({
  anonymousId: z.string().trim().max(120).optional().nullable(),
  entityType: z.enum(civicWatchEntityTypes),
  entityId: z.string().trim().min(1).max(220),
  entityName: z.string().trim().max(220).optional().nullable(),
  entitySlug: z.string().trim().max(220).optional().nullable(),
  interestTags: z.array(z.string().trim().max(80)).max(12).optional().default([]),
  alertLevel: z.enum(["low", "normal", "high"]).optional().default("normal"),
  reason: z.string().trim().max(120).optional().nullable(),
  sourceRoute: z.string().trim().max(500).optional().nullable(),
});

const convertSchema = z.object({
  anonymousId: z.string().trim().min(8).max(120),
});

function cleanText(value: string | null | undefined, maxLength = 220) {
  return value?.replace(/\s+/g, " ").trim().slice(0, maxLength) || null;
}

async function getUserId() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function mapMemberWatchType(entityType: string) {
  if (["official", "city", "school_board", "issue", "bill", "campaign", "donor", "pac", "agency", "court", "judge", "race", "county"].includes(entityType)) {
    return entityType;
  }
  if (entityType === "candidate") return "campaign";
  if (entityType === "vendor") return "donor";
  return "research";
}

async function ensureWatchlist(admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, userId: string) {
  const existing = await admin
    .from("watchlists")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "My Civic Watch")
    .maybeSingle();

  if (existing.data?.id) return existing.data.id as string;

  const created = await admin
    .from("watchlists")
    .insert({
      user_id: userId,
      name: "My Civic Watch",
      description: "Officials, races, boards, sources, and records I want RepWatchr to keep in front of me.",
      visibility: "private",
    })
    .select("id")
    .single();

  if (created.error) throw new Error(created.error.message);
  return created.data.id as string;
}

async function mirrorToMemberWatchlists(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  userId: string,
  input: z.infer<typeof watchSchema>,
) {
  const existing = await admin
    .from("member_watchlists")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "My Civic Watch")
    .maybeSingle();

  let watchlistId = existing.data?.id as string | undefined;
  if (!watchlistId) {
    const created = await admin
      .from("member_watchlists")
      .insert({
        user_id: userId,
        name: "My Civic Watch",
        description: "Saved from public watch buttons.",
        color: "blue",
        is_default: true,
      })
      .select("id")
      .single();
    if (created.error) return;
    watchlistId = created.data.id as string;
  }

  await admin.from("member_watchlist_items").upsert(
    {
      watchlist_id: watchlistId,
      user_id: userId,
      entity_type: mapMemberWatchType(input.entityType),
      entity_id: input.entityId,
      label: cleanText(input.entityName, 220) ?? input.entityId,
      href: input.sourceRoute ?? null,
      jurisdiction: null,
      source_context: input.reason ?? null,
      active: true,
      metadata: {
        source: "public_watch_button",
        original_entity_type: input.entityType,
        interest_tags: input.interestTags,
      },
    },
    { onConflict: "watchlist_id,entity_type,entity_id" },
  );
}

async function createLoggedInWatch(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  userId: string,
  input: z.infer<typeof watchSchema>,
) {
  const watchlistId = await ensureWatchlist(admin, userId);
  const item = await admin
    .from("watchlist_items")
    .upsert(
      {
        watchlist_id: watchlistId,
        user_id: userId,
        entity_type: input.entityType,
        entity_id: input.entityId,
        entity_name: cleanText(input.entityName, 220),
        entity_slug: cleanText(input.entitySlug, 220),
        interest_tags: input.interestTags,
        alert_level: input.alertLevel,
      },
      { onConflict: "watchlist_id,entity_type,entity_id" },
    )
    .select("id")
    .single();

  if (item.error) throw new Error(item.error.message);

  await Promise.all([
    admin.from("watch_events").insert({
      user_id: userId,
      anonymous_id: cleanText(input.anonymousId, 120),
      watchlist_item_id: item.data.id,
      entity_type: input.entityType,
      entity_id: input.entityId,
      event_type: "watchlist_add",
      metadata: {
        entity_name: input.entityName,
        reason: input.reason,
        source_route: input.sourceRoute,
        interest_tags: input.interestTags,
      },
    }),
    mirrorToMemberWatchlists(admin, userId, input),
  ]);

  if (input.anonymousId) {
    await admin
      .from("anonymous_watch_intents")
      .update({ converted_user_id: userId, converted_at: new Date().toISOString() })
      .eq("anonymous_id", input.anonymousId)
      .is("converted_at", null);
  }

  return { watchlistId, watchlistItemId: item.data.id as string };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = watchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid watch request." }, { status: 400 });
  }

  const input = parsed.data;
  const reason = isWatchReason(input.reason) ? input.reason : input.reason || "Other";
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "Watch queue is temporarily unavailable." }, { status: 503 });

  const userId = await getUserId();
  const anonymousId = cleanText(input.anonymousId, 120);

  try {
    if (userId) {
      const saved = await createLoggedInWatch(admin, userId, { ...input, reason });
      await Promise.all([
        serverTrackEvent({
          eventName: "watchlist_add",
          anonymousId,
          userId,
          route: input.sourceRoute ?? null,
          metadata: { entity_type: input.entityType, entity_id: input.entityId, reason },
        }),
        updateVisitorProfile({
          eventName: "watchlist_add",
          anonymousId,
          userId,
          route: input.sourceRoute ?? null,
          metadata: { entity_type: input.entityType, entity_id: input.entityId },
        }),
        updateInterestScore({
          eventType: "watchlist_add",
          anonymousId,
          userId,
          path: input.sourceRoute ?? null,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: { entity_name: input.entityName ?? "", reason },
        }),
      ]);
      return NextResponse.json({ ok: true, mode: "user", ...saved });
    }

    if (!anonymousId) {
      return NextResponse.json({ ok: false, error: "Anonymous visitor id is required." }, { status: 400 });
    }

    const created = await admin
      .from("anonymous_watch_intents")
      .insert({
        anonymous_id: anonymousId,
        entity_type: input.entityType,
        entity_id: input.entityId,
        entity_name: cleanText(input.entityName, 220),
        source_route: cleanText(input.sourceRoute, 500),
        reason,
      })
      .select("id")
      .single();

    if (created.error) throw new Error(created.error.message);

    await Promise.all([
      admin.from("watch_events").insert({
        anonymous_id: anonymousId,
        entity_type: input.entityType,
        entity_id: input.entityId,
        event_type: "anonymous_watch_intent_created",
        metadata: {
          entity_name: input.entityName,
          reason,
          source_route: input.sourceRoute,
          interest_tags: input.interestTags,
        },
      }),
      serverTrackEvent({
        eventName: "anonymous_watch_intent_created",
        anonymousId,
        route: input.sourceRoute ?? null,
        metadata: { entity_type: input.entityType, entity_id: input.entityId, reason },
      }),
      updateVisitorProfile({
        eventName: "profile_watch_clicked",
        anonymousId,
        route: input.sourceRoute ?? null,
        metadata: { entity_type: input.entityType, entity_id: input.entityId },
      }),
    ]);

    return NextResponse.json({ ok: true, mode: "anonymous", intentId: created.data.id, requiresAccount: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Watch request failed." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = convertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Anonymous visitor id is required." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "Watch queue is temporarily unavailable." }, { status: 503 });

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });

  const { data: intents, error } = await admin
    .from("anonymous_watch_intents")
    .select("id, entity_type, entity_id, entity_name, source_route, reason")
    .eq("anonymous_id", parsed.data.anonymousId)
    .is("converted_at", null)
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  let converted = 0;
  for (const intent of intents ?? []) {
    if (!civicWatchEntityTypes.includes(intent.entity_type as (typeof civicWatchEntityTypes)[number])) continue;
    await createLoggedInWatch(admin, userId, {
      anonymousId: parsed.data.anonymousId,
      entityType: intent.entity_type as (typeof civicWatchEntityTypes)[number],
      entityId: intent.entity_id,
      entityName: intent.entity_name,
      sourceRoute: intent.source_route,
      reason: intent.reason,
      interestTags: [],
      alertLevel: "normal",
    });
    converted += 1;
  }

  await serverTrackEvent({
    eventName: "anonymous_watch_converted",
    anonymousId: parsed.data.anonymousId,
    userId,
    metadata: { converted_count: converted },
  });

  return NextResponse.json({ ok: true, converted });
}
