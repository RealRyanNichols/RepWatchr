import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/race-poll-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { repwatchrFeatureFlags } from "@/lib/repwatchr-feature-flags";

const POLL_SLUG = "marion-county-judge-2026";
const MAX_BODY_BYTES = 2_048;

type PollRow = {
  id: number;
  slug: string;
  question: string;
  status: "draft" | "open" | "closed";
  opens_at: string | null;
  closes_at: string | null;
  minimum_sample: number;
};

type OptionRow = {
  option_id: string;
  label: string;
  display_order: number;
};

type TotalRow = {
  option_id: string;
  votes: number;
  as_of: string | null;
};

type PollOption = {
  optionId: string;
  label: string;
  votes: number | null;
  percent: number | null;
};

function json(
  body: Record<string, unknown>,
  init: ResponseInit = {},
) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function unavailable(message = "The community pulse is temporarily unavailable.") {
  return json(
    {
      enabled: false,
      status: "unavailable",
      canVote: false,
      asOf: null,
      closesAt: null,
      minimumSample: 25,
      responseCount: 0,
      myVote: null,
      options: [],
      message,
    },
    { status: 503 },
  );
}

function isPollOpen(poll: PollRow, now = Date.now()) {
  if (poll.status !== "open") return false;
  if (poll.opens_at && Date.parse(poll.opens_at) > now) return false;
  if (poll.closes_at && Date.parse(poll.closes_at) <= now) return false;
  return true;
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function getPoll(
  admin: SupabaseClient,
): Promise<{ poll: PollRow; options: OptionRow[] } | null> {
  const { data: pollData, error: pollError } = await admin
    .from("race_community_polls")
    .select("id, slug, question, status, opens_at, closes_at, minimum_sample")
    .eq("slug", POLL_SLUG)
    .maybeSingle();

  if (pollError || !pollData) return null;
  const poll = pollData as PollRow;

  const { data: optionData, error: optionError } = await admin
    .from("race_community_poll_options")
    .select("option_id, label, display_order")
    .eq("poll_id", poll.id)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (optionError || !optionData || optionData.length !== 2) return null;
  return { poll, options: optionData as OptionRow[] };
}

async function buildPayload(
  admin: SupabaseClient,
  poll: PollRow,
  options: OptionRow[],
  userId: string | null,
) {
  const [{ data: totalData, error: totalError }, myVoteResult, profileResult] = await Promise.all([
    admin
      .from("race_community_poll_totals")
      .select("option_id, votes, as_of")
      .eq("poll_id", poll.id),
    userId
      ? admin
          .from("race_community_poll_responses")
          .select("option_id")
          .eq("poll_id", poll.id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    userId
      ? admin
          .from("member_profiles")
          .select("display_name, home_location")
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (totalError || myVoteResult.error || profileResult.error) return null;

  const totals = (totalData ?? []) as TotalRow[];
  const voteByOption = new Map(
    totals.map((row) => [row.option_id, Number(row.votes)]),
  );
  const responseCount = totals.reduce(
    (sum, row) => sum + Number(row.votes),
    0,
  );
  const resultsVisible = true;
  const asOf = totals.reduce<string | null>(
    (latest, row) =>
      row.as_of && (!latest || row.as_of > latest) ? row.as_of : latest,
    null,
  );
  const payloadOptions: PollOption[] = options.map((option) => {
    const votes = voteByOption.get(option.option_id) ?? 0;
    return {
      optionId: option.option_id,
      label: option.label,
      votes,
      percent:
        responseCount > 0
          ? Math.round((votes / responseCount) * 100)
          : 0,
    };
  });
  const memberProfile = profileResult.data as {
    display_name?: string | null;
    home_location?: string | null;
  } | null;
  const profileComplete = Boolean(
    memberProfile?.display_name?.trim() && memberProfile?.home_location?.trim(),
  );

  return {
    enabled: true,
    status: poll.status,
    canVote: isPollOpen(poll),
    question: poll.question,
    asOf,
    closesAt: poll.closes_at,
    minimumSample: poll.minimum_sample,
    responseCount,
    resultsVisible,
    profileComplete,
    myVote:
      (myVoteResult.data as { option_id?: string } | null)?.option_id ?? null,
    options: payloadOptions,
  };
}

async function getCurrentUserId() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (slug !== POLL_SLUG) {
    return json({ message: "Poll not found." }, { status: 404 });
  }
  if (!repwatchrFeatureFlags.racePollsV1) return unavailable();

  const admin = getSupabaseAdminClient();
  if (!admin) return unavailable();

  const pollData = await getPoll(admin);
  if (!pollData) return unavailable();

  const payload = await buildPayload(
    admin,
    pollData.poll,
    pollData.options,
    await getCurrentUserId(),
  );
  if (!payload) return unavailable();

  return json(payload);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (slug !== POLL_SLUG) {
    return json({ message: "Poll not found." }, { status: 404 });
  }
  if (!repwatchrFeatureFlags.racePollsV1) return unavailable();
  if (!isSameOrigin(request)) {
    return json({ message: "This request could not be verified." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ message: "Invalid request." }, { status: 413 });
  }

  let body: { optionId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ message: "Invalid request." }, { status: 400 });
  }

  if (typeof body.optionId !== "string") {
    return json({ message: "Choose a candidate first." }, { status: 400 });
  }

  let botCheck: Awaited<ReturnType<typeof checkBotId>>;
  try {
    botCheck = await checkBotId();
  } catch {
    return unavailable("Human verification is temporarily unavailable.");
  }
  if (botCheck.isBot || !botCheck.isHuman) {
    return json({ message: "Automated responses are not accepted." }, { status: 403 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return json({ message: "Sign in before participating." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return unavailable();

  const { data: memberProfile, error: profileError } = await admin
    .from("member_profiles")
    .select("display_name, home_location")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError) return unavailable("Your member profile could not be verified right now.");
  if (
    !memberProfile?.display_name?.trim() ||
    !memberProfile?.home_location?.trim()
  ) {
    return json(
      {
        message:
          "Complete your RepWatchr profile with a display name and home location before your response can count.",
        profileComplete: false,
      },
      { status: 428 },
    );
  }

  const pollData = await getPoll(admin);
  if (!pollData) return unavailable();
  if (!isPollOpen(pollData.poll)) {
    return json(
      { message: "This community pulse is not accepting responses." },
      { status: 409 },
    );
  }

  const validOption = pollData.options.some(
    (option) => option.option_id === body.optionId,
  );
  if (!validOption) {
    return json({ message: "Choose a listed candidate." }, { status: 400 });
  }

  const { error } = await admin
    .from("race_community_poll_responses")
    .upsert(
      {
        poll_id: pollData.poll.id,
        user_id: userId,
        option_id: body.optionId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "poll_id,user_id" },
    );

  if (error) return unavailable("Your response could not be recorded right now.");

  const payload = await buildPayload(
    admin,
    pollData.poll,
    pollData.options,
    userId,
  );
  if (!payload) return unavailable();

  return json({
    ...payload,
    message: "Your response is recorded. You can change it before the poll closes.",
  });
}
