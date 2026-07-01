import { NextRequest, NextResponse } from "next/server";
import { getTexasElectionRaces } from "@/data/texas-election-races";
import { getAllNews, getAllOfficials } from "@/lib/data";
import {
  INTEREST_TOPIC_BY_SLUG,
  scoreTextAgainstInterestSlugs,
  type InterestSlug,
} from "@/lib/interest-graph";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type InterestScoreRow = {
  interest_slug: string;
  score: number;
  raw_event_count: number;
  last_scored_at: string | null;
};

type Recommendation = {
  title: string;
  href: string;
  label: string;
  detail: string;
  reason: string;
};

const defaultInterestSlugs: InterestSlug[] = ["texas", "transparency", "open-records", "election-integrity"];

const laneLibrary: Record<InterestSlug, Recommendation> = {
  texas: {
    title: "Texas election hub",
    href: "/elections/texas",
    label: "Texas",
    detail: "Statewide and county race lanes with official source links.",
    reason: "Your activity shows Texas record interest.",
  },
  "school-boards": {
    title: "Open school boards",
    href: "/school-boards",
    label: "School boards",
    detail: "Trustee, district, meeting, and local education records.",
    reason: "School-board behavior is rising in your profile.",
  },
  "property-taxes": {
    title: "Find property-tax records",
    href: "/officials?issue=property-taxes",
    label: "Property taxes",
    detail: "Look for budgets, appraisals, bonds, and tax votes.",
    reason: "Property-tax signals are part of your interest graph.",
  },
  "water-rights": {
    title: "Watch water and infrastructure",
    href: "/officials?issue=water-rights",
    label: "Water rights",
    detail: "Track water votes, infrastructure projects, and missing source links.",
    reason: "Water-rights records match your recent actions.",
  },
  congress: {
    title: "Compare federal officials",
    href: "/officials?level=federal",
    label: "Congress",
    detail: "Open U.S. House and Senate dossiers with roll-call and funding trails.",
    reason: "Congressional records are part of your active lanes.",
  },
  sheriffs: {
    title: "Open sheriff records",
    href: "/officials?office=sheriff",
    label: "Sheriffs",
    detail: "Watch public-safety, jail, and county law-enforcement records.",
    reason: "Sheriff/public-safety signals matched your activity.",
  },
  judges: {
    title: "Open judicial records",
    href: "/officials?office=judge",
    label: "Judges",
    detail: "Find court, judge, and judicial accountability pages.",
    reason: "Judicial records match your interest graph.",
  },
  "county-commissioners": {
    title: "County commissioners",
    href: "/officials?office=county-commissioner",
    label: "County commissioners",
    detail: "Follow commissioners court, county budget, and local source gaps.",
    reason: "County-government activity is showing up in your graph.",
  },
  "campaign-finance": {
    title: "Follow the money",
    href: "/funding",
    label: "Campaign finance",
    detail: "Open donors, PACs, spending, and source-backed funding trails.",
    reason: "Funding and donor records are high-signal interests.",
  },
  transparency: {
    title: "Latest source-backed records",
    href: "/news",
    label: "Transparency",
    detail: "Open stories and records with visible source status.",
    reason: "Transparency actions are a core part of your profile.",
  },
  "open-records": {
    title: "Build a source packet",
    href: "/free-packet",
    label: "Open records",
    detail: "Turn a public link into a clean packet and submit it for review.",
    reason: "Source and records actions match your behavior.",
  },
  veterans: {
    title: "Track veteran policy records",
    href: "/officials?issue=veterans",
    label: "Veterans",
    detail: "Find public commitments, votes, and benefit-related records.",
    reason: "Veterans records matched your activity.",
  },
  education: {
    title: "Education accountability",
    href: "/school-boards",
    label: "Education",
    detail: "Compare education, curriculum, trustee, and district records.",
    reason: "Education signals are part of your interest graph.",
  },
  energy: {
    title: "Energy and grid records",
    href: "/officials?issue=energy",
    label: "Energy",
    detail: "Watch oil, gas, grid, utility, and production records.",
    reason: "Energy records match recent behavior.",
  },
  immigration: {
    title: "Border and immigration records",
    href: "/officials?issue=immigration",
    label: "Immigration",
    detail: "Find source-backed border, immigration, and local-impact records.",
    reason: "Immigration terms matched your activity.",
  },
  infrastructure: {
    title: "Infrastructure watch",
    href: "/officials?issue=infrastructure",
    label: "Infrastructure",
    detail: "Track road, bridge, water, broadband, and public works records.",
    reason: "Infrastructure records match your interest profile.",
  },
  "election-integrity": {
    title: "Election record lanes",
    href: "/elections",
    label: "Election integrity",
    detail: "Open races, filing records, ballot links, and election source gaps.",
    reason: "Election records are a top interest lane.",
  },
};

function normalizeTrackingId(value: string | null) {
  const id = value?.trim().slice(0, 120) ?? "";
  return /^[a-zA-Z0-9:_-]{16,120}$/.test(id) ? id : null;
}

function labelForSlug(slug: string) {
  return INTEREST_TOPIC_BY_SLUG[slug as InterestSlug]?.label ?? slug.replace(/-/g, " ");
}

function isRecommendation(value: Recommendation | undefined): value is Recommendation {
  return Boolean(value);
}

function recommendationReason(text: string, slugs: string[]) {
  const normalized = text.toLowerCase();
  const match = slugs.find((slug) => {
    const topic = INTEREST_TOPIC_BY_SLUG[slug as InterestSlug];
    if (!topic) return false;
    return topic.keywords.some((keyword) => normalized.includes(keyword)) || normalized.includes(topic.label.toLowerCase());
  });
  return match ? `${labelForSlug(match)} match` : "Recommended from your RepWatchr activity";
}

function ranked<T>(
  items: T[],
  slugs: string[],
  textForItem: (item: T) => string,
  toRecommendation: (item: T, reason: string) => Recommendation,
  fallbackScore = 0,
) {
  return items
    .map((item, index) => {
      const text = textForItem(item);
      return {
        item,
        score: scoreTextAgainstInterestSlugs(text, slugs) + fallbackScore - index * 0.001,
        reason: recommendationReason(text, slugs),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((entry) => toRecommendation(entry.item, entry.reason));
}

async function currentUserId() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function loadInterestRows(userId: string | null, anonymousId: string | null) {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  if (userId) {
    const userRows = await admin
      .from("visitor_interest_scores")
      .select("interest_slug, score, raw_event_count, last_scored_at")
      .eq("user_id", userId)
      .order("score", { ascending: false })
      .limit(12);
    if (!userRows.error && userRows.data?.length) return userRows.data as InterestScoreRow[];
  }

  if (!anonymousId) return [];

  const anonymousRows = await admin
    .from("visitor_interest_scores")
    .select("interest_slug, score, raw_event_count, last_scored_at")
    .eq("anonymous_id", anonymousId)
    .order("score", { ascending: false })
    .limit(12);

  return anonymousRows.error ? [] : (anonymousRows.data as InterestScoreRow[] | null) ?? [];
}

function buildRecommendations(slugs: string[]) {
  const stories = ranked(
    getAllNews().slice(0, 60),
    slugs,
    (article) =>
      [
        article.title,
        article.summary,
        article.tags.join(" "),
        article.scope,
        article.state,
        article.counties?.join(" "),
        article.locationLabel,
        article.powerChannels?.join(" "),
      ].join(" "),
    (article, reason) => ({
      title: article.title,
      href: `/news/${article.id}`,
      label: article.sourceStatus === "needs_source_review" ? "Needs review" : "Story",
      detail: article.summary,
      reason,
    }),
    0.5,
  );

  const officials = ranked(
    getAllOfficials().slice(0, 500),
    slugs,
    (official) =>
      [
        official.name,
        official.position,
        official.level,
        official.jurisdiction,
        official.district,
        official.state,
        official.county.join(" "),
        official.party,
        official.bio,
      ].join(" "),
    (official, reason) => ({
      title: official.name,
      href: `/officials/${official.id}`,
      label: official.position,
      detail: [official.jurisdiction, official.district, official.party].filter(Boolean).join(" / "),
      reason,
    }),
  );

  const races = ranked(
    getTexasElectionRaces(),
    slugs,
    (race) => [race.title, race.office, race.region, race.summary, race.geography, race.recordFocus.join(" ")].join(" "),
    (race, reason) => ({
      title: race.title,
      href: `/elections/texas/${race.slug}`,
      label: race.region,
      detail: race.summary,
      reason,
    }),
    1,
  );

  const homepageLanes = slugs
    .map((slug) => laneLibrary[slug as InterestSlug])
    .filter(isRecommendation)
    .filter((lane, index, all) => all.findIndex((item) => item.href === lane.href) === index)
    .slice(0, 4);

  const dashboardModules = homepageLanes.slice(0, 3).map((lane) => ({
    ...lane,
    title: `Next move: ${lane.title}`,
  }));

  return {
    stories,
    officials,
    races,
    homepageLanes,
    dashboardModules,
    watchlistSuggestions: [...officials.slice(0, 3), ...races.slice(0, 2)],
    emailDigestTopics: slugs.slice(0, 6).map((slug) => labelForSlug(slug)),
    alertTopics: slugs.slice(0, 5).map((slug) => labelForSlug(slug)),
  };
}

export async function GET(request: NextRequest) {
  const anonymousId = normalizeTrackingId(request.nextUrl.searchParams.get("anonymousId"));
  const userId = await currentUserId();
  const rows = await loadInterestRows(userId, anonymousId);

  const interests = rows.length
    ? rows.map((row) => ({
        slug: row.interest_slug,
        label: labelForSlug(row.interest_slug),
        score: Number(row.score ?? 0),
        rawEventCount: Number(row.raw_event_count ?? 0),
        lastScoredAt: row.last_scored_at,
      }))
    : defaultInterestSlugs.map((slug, index) => ({
        slug,
        label: labelForSlug(slug),
        score: defaultInterestSlugs.length - index,
        rawEventCount: 0,
        lastScoredAt: null,
      }));

  const slugs = interests.map((interest) => interest.slug);

  return NextResponse.json({
    ok: true,
    personalized: rows.length > 0,
    interests,
    recommendations: buildRecommendations(slugs),
  });
}
