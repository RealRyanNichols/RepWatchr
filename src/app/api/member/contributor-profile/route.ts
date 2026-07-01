import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  contributorBadgeCatalog,
  isContributorLevel,
  normalizeContributorHandle,
  type ContributorLevel,
} from "@/lib/contributors";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ContributorProfilePatch = {
  handle?: unknown;
  displayName?: unknown;
  publicBio?: unknown;
  county?: unknown;
  state?: unknown;
  avatarUrl?: unknown;
  primaryLevel?: unknown;
  publicProfileEnabled?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanState(value: unknown) {
  const cleaned = cleanText(value, 40) ?? "TX";
  return cleaned.toUpperCase();
}

function cleanUrl(value: unknown) {
  const cleaned = cleanText(value, 1000);
  if (!cleaned) return null;
  try {
    const url = new URL(cleaned);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanLevel(value: unknown): ContributorLevel {
  return isContributorLevel(value) ? value : "source_runner";
}

async function getSessionUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { userId: null, error: "Contributor reputation is temporarily unavailable." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { userId: user?.id ?? null, error: user ? null : "Login required." };
}

async function loadContributorBundle(admin: SupabaseClient, userId: string) {
  const profileResult = await admin
    .from("contributor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.error) return { error: profileResult.error.message, profile: null };

  const profile = profileResult.data;
  const [recordsResult, awardsResult, xpResult, badgesResult] = await Promise.all([
    profile
      ? admin
          .from("contributor_records")
          .select("id, profile_id, user_id, kind, target_type, target_id, target_label, title, summary, source_url, source_date, jurisdiction, county, state, status, xp_awarded, usefulness_score, accuracy_status, attached_href, created_at")
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    profile
      ? admin
          .from("contributor_badge_awards")
          .select("id, badge_key, reason, created_at, contributor_badges(name, description, icon_label, accent)")
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    profile
      ? admin
          .from("contributor_xp_events")
          .select("id, event_type, xp_delta, reason, created_at")
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    admin
      .from("contributor_badges")
      .select("badge_key, name, description, icon_label, accent")
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  const error = recordsResult.error?.message ?? awardsResult.error?.message ?? xpResult.error?.message ?? badgesResult.error?.message ?? null;
  if (error) return { error, profile };

  return {
    error: null,
    profile,
    records: recordsResult.data ?? [],
    badgeAwards: awardsResult.data ?? [],
    xpEvents: xpResult.data ?? [],
    badgeCatalog: badgesResult.data?.length ? badgesResult.data : contributorBadgeCatalog,
  };
}

export async function GET() {
  const { userId, error } = await getSessionUser();
  if (!userId) {
    return NextResponse.json({ ok: false, error }, { status: error === "Login required." ? 401 : 503 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: true,
        profile: null,
        records: [],
        badgeAwards: [],
        xpEvents: [],
        badgeCatalog: contributorBadgeCatalog,
        fallback: true,
      },
      { status: 200 },
    );
  }

  const bundle = await loadContributorBundle(admin, userId);
  if (bundle.error) return NextResponse.json({ ok: false, error: bundle.error }, { status: 500 });

  return NextResponse.json({ ok: true, ...bundle });
}

export async function PATCH(request: NextRequest) {
  const { userId, error } = await getSessionUser();
  if (!userId) {
    return NextResponse.json({ ok: false, error }, { status: error === "Login required." ? 401 : 503 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Contributor publishing is temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as ContributorProfilePatch | null;
  const handle = normalizeContributorHandle(body?.handle);
  const publicProfileEnabled = Boolean(body?.publicProfileEnabled);

  if (publicProfileEnabled && !handle) {
    return NextResponse.json({ ok: false, error: "A public contributor handle is required before publishing." }, { status: 400 });
  }

  const patch = {
    user_id: userId,
    handle,
    display_name: cleanText(body?.displayName, 120),
    public_bio: cleanText(body?.publicBio, 1000),
    county: cleanText(body?.county, 120),
    state: cleanState(body?.state),
    avatar_url: cleanUrl(body?.avatarUrl),
    primary_level: cleanLevel(body?.primaryLevel),
    public_profile_enabled: publicProfileEnabled,
    metadata: {
      reputationOnly: true,
      noPaidContributions: true,
      updatedFrom: "member_contributor_profile",
    },
  };

  const upsert = await admin
    .from("contributor_profiles")
    .upsert(patch, { onConflict: "user_id" })
    .select("*")
    .single();

  if (upsert.error) return NextResponse.json({ ok: false, error: upsert.error.message }, { status: 500 });

  const bundle = await loadContributorBundle(admin, userId);
  if (bundle.error) return NextResponse.json({ ok: false, error: bundle.error }, { status: 500 });

  return NextResponse.json({ ok: true, ...bundle });
}
