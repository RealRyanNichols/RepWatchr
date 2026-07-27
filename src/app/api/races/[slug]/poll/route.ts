import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { repwatchrFeatureFlags } from "@/lib/repwatchr-feature-flags";

const POLL_SLUG = "marion-county-judge-2026";
const MINIMUM_SAMPLE = 25;
const OPTION_LABELS = {
  "dina-k-carroll": "Dina K. Carroll",
  "leward-j-lafleur-ii": "Leward J. LaFleur II",
} as const;

type OptionId = keyof typeof OPTION_LABELS;
type Segment = "verified_marion" | "verified_outside" | "residence_unverified";

function unavailable(message = "The verified community pulse is not enabled on this deployment.") {
  return NextResponse.json(
    {
      enabled: false,
      asOf: null,
      minimumSample: MINIMUM_SAMPLE,
      segments: [],
      message,
    },
    { status: 503 },
  );
}

function normalizeCounty(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/\s+county$/, "");
}

function segmentForProfile(profile: {
  state?: string | null;
  county?: string | null;
  verification_status?: string | null;
  geography_verified_at?: string | null;
} | null): Segment {
  const verified =
    profile?.verification_status === "verified" &&
    Boolean(profile.geography_verified_at);

  if (!verified) return "residence_unverified";
  const isTexas = (profile?.state ?? "").trim().toUpperCase() === "TX";
  const isMarion = normalizeCounty(profile?.county) === "marion";
  return isTexas && isMarion ? "verified_marion" : "verified_outside";
}

async function verifyTurnstile(token: string, remoteIp: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;

  const form = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteIp) form.set("remoteip", remoteIp);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: form,
      cache: "no-store",
    },
  );

  if (!response.ok) return false;
  const result = (await response.json()) as {
    success?: boolean;
    action?: string;
  };
  return result.success === true && result.action === "marion_county_race_poll";
}

function aggregate(
  rows: Array<{ option_id: string; segment: Segment; updated_at: string }>,
) {
  const segmentKeys = [
    "all",
    "verified_marion",
    "verified_outside",
    "residence_unverified",
  ] as const;
  const segmentLabels = {
    all: "All participants",
    verified_marion: "Verified Marion residents",
    verified_outside: "Verified outside Marion",
    residence_unverified: "Residence unverified",
  };

  return segmentKeys.map((key) => {
    const selected = key === "all" ? rows : rows.filter((row) => row.segment === key);
    const total = selected.length;
    const suppressed = total < MINIMUM_SAMPLE;
    const results = (Object.keys(OPTION_LABELS) as OptionId[]).map((optionId) => {
      const votes = selected.filter((row) => row.option_id === optionId).length;
      return {
        optionId,
        label: OPTION_LABELS[optionId],
        votes: suppressed ? 0 : votes,
        percent: suppressed || total === 0 ? 0 : Math.round((votes / total) * 100),
      };
    });

    return {
      key,
      label: segmentLabels[key],
      total,
      suppressed,
      results,
    };
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (slug !== POLL_SLUG) {
    return NextResponse.json({ message: "Poll not found." }, { status: 404 });
  }
  if (!repwatchrFeatureFlags.racePollsV1) return unavailable();

  const admin = getSupabaseAdminClient();
  if (!admin) return unavailable("The poll database connection is not configured.");

  const { data, error } = await admin
    .from("race_poll_responses")
    .select("option_id, segment, updated_at")
    .eq("poll_slug", POLL_SLUG);

  if (error) return unavailable("The verified poll tables are not deployed yet.");
  const rows = (data ?? []) as Array<{
    option_id: string;
    segment: Segment;
    updated_at: string;
  }>;
  const latest = rows.reduce<string | null>(
    (value, row) => (!value || row.updated_at > value ? row.updated_at : value),
    null,
  );

  return NextResponse.json({
    enabled: true,
    asOf: latest,
    minimumSample: MINIMUM_SAMPLE,
    segments: aggregate(rows),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (slug !== POLL_SLUG) {
    return NextResponse.json({ message: "Poll not found." }, { status: 404 });
  }
  if (!repwatchrFeatureFlags.racePollsV1) return unavailable();

  let body: { optionId?: unknown; turnstileToken?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  if (
    typeof body.optionId !== "string" ||
    !(body.optionId in OPTION_LABELS) ||
    typeof body.turnstileToken !== "string" ||
    body.turnstileToken.length < 20
  ) {
    return NextResponse.json(
      { message: "Choose a candidate and complete the human verification challenge." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return NextResponse.json({ message: "Sign in before participating." }, { status: 401 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const isHuman = await verifyTurnstile(body.turnstileToken, forwardedFor);
  if (!isHuman) {
    return NextResponse.json(
      { message: "Human verification expired or could not be confirmed." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return unavailable("The poll database connection is not configured.");

  const { data: profile } = await admin
    .from("profiles")
    .select("state, county, verification_status, geography_verified_at")
    .eq("id", user.id)
    .maybeSingle();
  const segment = segmentForProfile(profile);

  const { error } = await admin.from("race_poll_responses").upsert(
    {
      poll_slug: POLL_SLUG,
      user_id: user.id,
      option_id: body.optionId,
      segment,
      verification_status_at_vote: profile?.verification_status ?? "needs_review",
      geography_verified_at: profile?.geography_verified_at ?? null,
      human_check: "turnstile",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "poll_slug,user_id" },
  );

  if (error) return unavailable("The verified poll tables are not deployed yet.");

  return NextResponse.json({
    message:
      segment === "verified_marion"
        ? "Response recorded in the verified Marion County segment."
        : segment === "verified_outside"
          ? "Response recorded in the verified outside-Marion segment."
          : "Response recorded. It remains in the residence-unverified segment until verification is complete.",
  });
}
