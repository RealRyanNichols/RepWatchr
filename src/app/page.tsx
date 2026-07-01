import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpenCheck,
  Building2,
  ClipboardCheck,
  Database,
  Eye,
  FileCheck2,
  FilePlus2,
  Gauge,
  Landmark,
  Layers3,
  LockKeyhole,
  MapPin,
  PackageSearch,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Vote,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { HomepageOpenTracker, HomepageSectionViewTracker, HomepageTrackedLink } from "@/components/home/HomepageTelemetry";
import OfficialPhotoImage from "@/components/shared/OfficialPhotoImage";
import PredictiveSearchBox from "@/components/shared/PredictiveSearchBox";
import { REPWATCHR_PACKAGES, packageRoute } from "@/data/repwatchr-packages";
import {
  getAllOfficials,
  getFundingSummary,
  getPublicVoteRecord,
  getRedFlags,
  getRepWatchrDataStats,
  getScoreCard,
} from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import { datasetJsonLd, getPageMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import type { Official, FundingSummary, PublicVoteRecord, ScoreCard } from "@/types";

export const metadata: Metadata = getPageMetadata({
  title: "RepWatchr | Public-Record Accountability",
  description:
    "Search officials, attach public sources, watch records, build source packets, and follow public-record accountability updates.",
  path: "/",
  imagePath:
    "/api/og?type=home&title=RepWatchr&subtitle=Public-record%20accountability%20profiles%20for%20officials%2C%20agencies%2C%20boards%2C%20and%20public%20power.",
});

type RecentProfile = {
  official: Official;
  sourceCount: number;
  completeness: string;
  confidence: string;
  lastUpdated: string;
  scoreCard?: ScoreCard;
  funding?: FundingSummary;
  voteRecord?: PublicVoteRecord;
  redFlagCount: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function displayDate(value?: string) {
  if (!value) return "Review date not published";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));
}

function latestTimestamp(values: Array<string | undefined>) {
  return values
    .map((value) => (value ? Date.parse(value) : Number.NaN))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
}

function sourceCountForOfficial({
  official,
  funding,
  voteRecord,
  redFlags,
}: {
  official: Official;
  funding?: FundingSummary;
  voteRecord?: PublicVoteRecord;
  redFlags: ReturnType<typeof getRedFlags>;
}) {
  const urls = new Set<string>();
  official.sourceLinks?.forEach((source) => source.url && urls.add(source.url));
  if (official.contactInfo.website) urls.add(official.contactInfo.website);
  if (official.photoSourceUrl) urls.add(official.photoSourceUrl);
  funding?.sources.forEach((source) => source.url && urls.add(source.url));
  voteRecord?.sourceLinks.forEach((source) => source.url && urls.add(source.url));
  redFlags.forEach((flag) => flag.sourceUrl && urls.add(flag.sourceUrl));
  return urls.size;
}

function confidenceLabel(official: Official, sourceCount: number) {
  if (official.reviewStatus === "complete") return "Complete public file";
  if (official.reviewStatus === "verified") return "Verified profile";
  if (official.reviewStatus === "source_seeded") return "Source-seeded";
  if (sourceCount > 0) return "Needs source review";
  return "Missing source links";
}

function completenessLabel(sourceCount: number, profile: Pick<RecentProfile, "scoreCard" | "funding" | "voteRecord">) {
  const attachedAreas = [profile.scoreCard, profile.funding, profile.voteRecord].filter(Boolean).length;
  if (sourceCount >= 5 && attachedAreas >= 2) return "Strong dossier";
  if (sourceCount >= 3) return "Useful source trail";
  if (sourceCount > 0) return "Starter file";
  return "Needs sources";
}

function buildRecentProfiles(officials: Official[]) {
  return officials
    .filter((official) => official.level === "federal" || official.level === "state")
    .map((official): RecentProfile => {
      const scoreCard = getScoreCard(official.id);
      const funding = getFundingSummary(official.id);
      const voteRecord = getPublicVoteRecord(official.id);
      const redFlags = getRedFlags(official.id);
      const sourceCount = sourceCountForOfficial({ official, funding, voteRecord, redFlags });
      const updatedAt = latestTimestamp([
        official.lastVerifiedAt,
        scoreCard?.lastUpdated,
        funding?.lastUpdated,
        voteRecord?.lastUpdated,
      ]);
      const stub = {
        scoreCard,
        funding,
        voteRecord,
      };

      return {
        official,
        sourceCount,
        scoreCard,
        funding,
        voteRecord,
        redFlagCount: redFlags.length,
        completeness: completenessLabel(sourceCount, stub),
        confidence: confidenceLabel(official, sourceCount),
        lastUpdated: Number.isFinite(updatedAt) ? new Date(updatedAt).toISOString() : "",
      };
    })
    .sort((a, b) => {
      const dateDiff = (Date.parse(b.lastUpdated) || 0) - (Date.parse(a.lastUpdated) || 0);
      if (dateDiff !== 0) return dateDiff;
      return b.sourceCount - a.sourceCount;
    })
    .slice(0, 6);
}

function buildSourceGaps(officials: Official[]) {
  const federalOrState = officials.filter((official) => official.level === "federal" || official.level === "state");
  const missingWebsite = federalOrState.find((official) => !official.contactInfo.website);
  const missingFunding = federalOrState.find((official) => !getFundingSummary(official.id));
  const missingVoteRecord = federalOrState.find((official) => !getPublicVoteRecord(official.id));
  const missingPhotoSource = federalOrState.find((official) => !official.photoSourceUrl);

  return [
    {
      label: "Official website source",
      target: missingWebsite?.name ?? "A public official profile",
      jurisdiction: missingWebsite?.jurisdiction ?? "United States",
      detail: "Add the official website or public contact page so voters can inspect the source.",
      href: `/submit-source?target=${encodeURIComponent(missingWebsite?.name ?? "official profile")}&sourceType=official_website`,
    },
    {
      label: "Campaign finance source",
      target: missingFunding?.name ?? "A candidate or elected official",
      jurisdiction: missingFunding?.jurisdiction ?? "Texas or federal race",
      detail: "Attach the public filing, committee page, FEC source, or state ethics source.",
      href: `/submit-source?target=${encodeURIComponent(missingFunding?.name ?? "campaign finance")}&sourceType=campaign_finance`,
    },
    {
      label: "Vote record source",
      target: missingVoteRecord?.name ?? "A voting official",
      jurisdiction: missingVoteRecord?.jurisdiction ?? "Congress or state legislature",
      detail: "Add the roll call, bill page, chamber journal, meeting minutes, or agenda record.",
      href: `/submit-source?target=${encodeURIComponent(missingVoteRecord?.name ?? "vote record")}&sourceType=vote_record`,
    },
    {
      label: "School board meeting minutes",
      target: "Local school board hub",
      jurisdiction: "Texas school districts",
      detail: "RepWatchr needs agendas, minutes, videos, and vote records for local boards.",
      href: "/submit-source?sourceType=meeting_minutes&target=school%20board",
    },
    {
      label: "Photo/source credit",
      target: missingPhotoSource?.name ?? "Public profile media",
      jurisdiction: missingPhotoSource?.jurisdiction ?? "Public official profile",
      detail: "A profile photo is only useful when the public source or credit is visible.",
      href: `/submit-source?target=${encodeURIComponent(missingPhotoSource?.name ?? "profile photo")}&sourceType=profile_photo`,
    },
  ];
}

function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

const quickChips = [
  { label: "Search Texas", href: "/search?q=Texas", query: "Texas" },
  { label: "Search Congress", href: "/search?q=Congress", query: "Congress" },
  { label: "Search Sheriffs", href: "/search?q=Sheriff", query: "Sheriff" },
  { label: "Search Judges", href: "/search?q=Judge", query: "Judge" },
  { label: "Search School Boards", href: "/search?q=School%20Board", query: "School Board" },
  { label: "Submit a Source", href: "/submit-source", query: "submit_source" },
  { label: "Build Source Packet", href: "/free-packet", query: "source_packet" },
  { label: "Watch a Race", href: "/elections/texas", query: "race_watch" },
];

const actionCards = [
  {
    title: "Search an Official",
    detail: "Find a profile, office, jurisdiction, vote, story, or source trail.",
    href: "/search",
    cta: "Open search",
    icon: Search,
  },
  {
    title: "Follow a Race",
    detail: "Open Texas race hubs, candidate lanes, filing links, and public questions.",
    href: "/elections/texas",
    cta: "Open races",
    icon: Vote,
  },
  {
    title: "Check Funding",
    detail: "Review public campaign finance records without implying wrongdoing from a donation.",
    href: "/search?q=campaign%20finance",
    cta: "Search money trail",
    icon: WalletCards,
  },
  {
    title: "Read Vote History",
    detail: "Open roll calls, source links, score impact, and the record behind the chart.",
    href: "/search?q=vote%20record",
    cta: "Search votes",
    icon: BarChart3,
  },
  {
    title: "Submit Public Source",
    detail: "Send a public link, filing, agenda, article, clip, correction, or missing record.",
    href: "/submit-source",
    cta: "Submit source",
    icon: FilePlus2,
  },
  {
    title: "Build Source Packet",
    detail: "Turn one public source into a clean packet people can copy, share, and review.",
    href: "/free-packet",
    cta: "Build packet",
    icon: PackageSearch,
  },
  {
    title: "Request Correction",
    detail: "Flag wrong profile data and point RepWatchr to the better public source.",
    href: "/submit-source?type=correction_request",
    cta: "Request correction",
    icon: FileCheck2,
  },
  {
    title: "Watch Profile Updates",
    detail: "Save officials, boards, races, issues, and records for later review.",
    href: "/dashboard",
    cta: "Open dashboard",
    icon: Bell,
  },
];

const trustStandards = [
  "Public records first",
  "Source labels visible",
  "Corrections stay open",
  "No private home addresses",
  "No doxxing or threats",
  "No unsourced criminal accusations",
  "Under-review items stay labeled",
  "Safe share snippets only",
];

const packageKeys = [
  "official_record_brief",
  "local_race_source_pack",
  "election_watch_desk",
  "school_board_monitor",
  "county_monitor",
  "journalist_desk",
  "organization_dashboard",
  "public_data_api",
];

export default function HomePage() {
  const officials = getAllOfficials();
  const schoolBoardStats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();
  const recentProfiles = buildRecentProfiles(officials);
  const sourceGaps = buildSourceGaps(officials);
  const packages = REPWATCHR_PACKAGES.filter((packageItem) => packageKeys.includes(packageItem.packageKey));
  const allPublicProfileCount =
    dataStats.nonSchoolOfficialFiles + dataStats.publicPowerProfiles + schoolBoardStats.candidates;
  const allPublicSourceUrls = dataStats.publicSourceUrls + schoolBoardStats.sourceCount;
  const recordsLoaded =
    dataStats.publicVoteRecordRows + dataStats.scoredVoteRows + dataStats.redFlagItems + schoolBoardStats.districtFeedItems;
  const trackedJurisdictionSignals =
    dataStats.counties + dataStats.stateLegislatureJurisdictionsLoaded + schoolBoardStats.counties;

  const counters = [
    {
      label: "Public profiles",
      value: allPublicProfileCount,
      detail: "Officials, public-power roles, and school board profiles loaded.",
      href: "/officials",
      icon: Users,
    },
    {
      label: "Source URLs",
      value: allPublicSourceUrls,
      detail: "Public links attached across profiles, school boards, stories, votes, and funding files.",
      href: "/search?q=source",
      icon: Database,
    },
    {
      label: "Officials tracked",
      value: dataStats.federalAndStateOfficeProfilesLoaded,
      detail: "Federal and state office profiles currently loaded from public data files.",
      href: "/officials?level=federal",
      icon: Landmark,
    },
    {
      label: "Jurisdiction signals",
      value: trackedJurisdictionSignals,
      detail: "County, state, and school-board geography signals present in the loaded data.",
      href: "/search?q=jurisdiction",
      icon: MapPin,
    },
    {
      label: "Source submissions",
      empty: "Appears after data collection starts.",
      detail: "Submission counts require the production intake database.",
      href: "/submit-source",
      icon: FilePlus2,
    },
    {
      label: "Watched profiles",
      empty: "Appears after data collection starts.",
      detail: "Watch counts require member activity in production.",
      href: "/dashboard",
      icon: Eye,
    },
    {
      label: "Record rows loaded",
      value: recordsLoaded,
      detail: "Vote rows, scored votes, red flags, and school-board feed items loaded locally.",
      href: "/methodology",
      icon: Layers3,
    },
    {
      label: "Packets built",
      empty: "Appears after packet saves start.",
      detail: "Packet totals require the free packet database workflow.",
      href: "/free-packet",
      icon: ClipboardCheck,
    },
  ];

  const structuredData = [
    organizationJsonLd(),
    websiteJsonLd(),
    datasetJsonLd({
      name: "RepWatchr public-record accountability index",
      description:
        "Public-record profiles, source links, vote records, funding pointers, school board records, and civic source gaps.",
      path: "/",
    }),
  ];

  return (
    <main className="relative isolate overflow-hidden bg-slate-950 text-white">
      <HomepageOpenTracker />
      {structuredData.map((entry, index) => (
        <JsonLd key={index} data={entry} />
      ))}

      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_8%,rgba(37,99,235,0.38),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(220,38,38,0.32),transparent_24%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.17] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_60%,rgba(251,191,36,0.1),transparent_38%)]" />

      <section className="relative min-h-[calc(100vh-88px)] px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-7 lg:p-9">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#b91c1c_0%,#b91c1c_32%,#d6b35a_32%,#d6b35a_44%,#fff_44%,#fff_56%,#2563eb_56%,#2563eb_100%)]" />
            <div className="absolute right-8 top-10 hidden h-44 w-44 rounded-full border border-blue-300/30 bg-blue-500/10 blur-xl lg:block" />
            <div className="relative">
              <div className="mb-7 flex flex-wrap items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/50 bg-white/10 shadow-lg shadow-blue-950/40">
                  <ShieldCheck className="h-6 w-6 text-amber-200" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-200">RepWatchr</p>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-100">Search. Grade. Source. Share.</p>
                </div>
              </div>

              <div className="max-w-4xl">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                  <Sparkles className="h-4 w-4 text-amber-200" aria-hidden="true" />
                  Civic intelligence command center
                </p>
                <h1 className="max-w-5xl text-balance text-4xl font-black leading-[0.96] tracking-normal text-white sm:text-6xl lg:text-7xl">
                  Public-record accountability profiles for officials, agencies, boards, and public power.
                </h1>
                <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-200 sm:text-xl">
                  Search officials, attach sources, watch records, build packets, and follow what changes.
                </p>
              </div>

              <div className="mt-8 rounded-3xl border border-blue-300/20 bg-slate-950/70 p-3 shadow-2xl shadow-blue-950/30">
                <PredictiveSearchBox
                  placeholder="Search an official, agency, board, vote, funder, source, county, or race..."
                  sourceSurface="homepage_hero_search"
                  focusEventName="homepage_search_focus"
                  submitEventName="homepage_search_submit"
                  eventMetadata={{ placement: "hero_console" }}
                />
                <div className="mt-3 flex flex-wrap items-center gap-2 px-1 text-xs font-bold text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">Cmd/Ctrl + K</span>
                  <span>Open command search from anywhere.</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {quickChips.map((chip) => (
                  <HomepageTrackedLink
                    key={chip.label}
                    href={chip.href}
                    eventName="homepage_quick_chip_clicked"
                    metadata={{ chip: chip.label, query: chip.query }}
                    className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200/70 hover:bg-amber-200/10 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  >
                    {chip.label}
                    <ArrowRight className="h-4 w-4 text-amber-200 transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </HomepageTrackedLink>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:sticky lg:top-24">
            <div className="rounded-[2rem] border border-white/15 bg-slate-900/75 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Today&apos;s command stack</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Start with a receipt.</h2>
                </div>
                <Radar className="h-8 w-8 text-blue-300" aria-hidden="true" />
              </div>
              <div className="space-y-3">
                {[
                  ["Find the official", "Search by name, office, county, issue, vote, source, or race."],
                  ["Open the record", "Inspect the source count, gaps, timeline, votes, and money trail."],
                  ["Submit what is missing", "Add the public link, correction, filing, agenda, clip, or article."],
                  ["Share the safe line", "Move the receipt, not the outrage."],
                ].map(([title, detail], index) => (
                  <div key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-black text-white">{title}</p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-slate-300">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HomepageTrackedLink
                href="/submit-source"
                eventName="homepage_action_card_clicked"
                metadata={{ action: "submit_source_side_panel" }}
                className="rounded-3xl border border-red-300/30 bg-red-600/20 p-4 text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <FilePlus2 className="h-6 w-6 text-red-100" aria-hidden="true" />
                <p className="mt-3 text-sm font-black uppercase tracking-[0.16em]">Submit Source</p>
              </HomepageTrackedLink>
              <HomepageTrackedLink
                href="/free-packet"
                eventName="homepage_packet_started"
                metadata={{ action: "build_packet_side_panel" }}
                className="rounded-3xl border border-blue-300/30 bg-blue-600/20 p-4 text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <PackageSearch className="h-6 w-6 text-blue-100" aria-hidden="true" />
                <p className="mt-3 text-sm font-black uppercase tracking-[0.16em]">Build Packet</p>
              </HomepageTrackedLink>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/70 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-red-300">Live public record counters</p>
              <h2 className="mt-2 text-3xl font-black text-white">Real numbers only.</h2>
            </div>
            <p className="max-w-2xl text-sm font-semibold leading-6 text-slate-300">
              When a production metric is not wired yet, RepWatchr says that plainly instead of filling the page with fake activity.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {counters.map((counter) => {
              const Icon = counter.icon;
              return (
                <HomepageTrackedLink
                  key={counter.label}
                  href={counter.href}
                  eventName="homepage_counter_clicked"
                  metadata={{ counter: counter.label, has_value: typeof counter.value === "number" }}
                  className="group min-h-[170px] rounded-3xl border border-white/12 bg-white/[0.07] p-5 shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:border-blue-300/60 hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Icon className="h-6 w-6 text-blue-200" aria-hidden="true" />
                    <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-amber-200" aria-hidden="true" />
                  </div>
                  <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-slate-400">{counter.label}</p>
                  <p className="mt-2 min-h-12 text-3xl font-black text-white">
                    {typeof counter.value === "number" ? formatNumber(counter.value) : counter.empty}
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-5 text-slate-300">{counter.detail}</p>
                </HomepageTrackedLink>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-200">What you can do here</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Every card should create the next click.</h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-300">
              RepWatchr is built around action loops: search, inspect, submit, watch, build a packet, and share the safe line.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {actionCards.map((card) => {
              const Icon = card.icon;
              return (
                <HomepageTrackedLink
                  key={card.title}
                  href={card.href}
                  eventName="homepage_action_card_clicked"
                  metadata={{ action: card.title }}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-slate-900/75 p-5 shadow-xl shadow-black/25 transition hover:-translate-y-1 hover:border-amber-200/60 focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl transition group-hover:bg-red-500/20" />
                  <div className="relative">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                      <Icon className="h-6 w-6 text-amber-200" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-xl font-black text-white">{card.title}</h3>
                    <p className="mt-3 min-h-20 text-sm font-semibold leading-6 text-slate-300">{card.detail}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-blue-200">
                      {card.cta}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </HomepageTrackedLink>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.04] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-red-300">Recently updated profiles</p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Open a dossier, then improve it.</h2>
            </div>
            <HomepageTrackedLink
              href="/officials?sort=recently_updated"
              eventName="homepage_action_card_clicked"
              metadata={{ action: "open_recent_profiles_index" }}
              className="inline-flex min-h-12 w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              View all officials
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </HomepageTrackedLink>
          </div>

          {recentProfiles.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {recentProfiles.map((profile) => (
                <article
                  key={profile.official.id}
                  className="overflow-hidden rounded-[1.75rem] border border-white/12 bg-slate-950/70 shadow-xl shadow-black/25"
                >
                  <HomepageTrackedLink
                    href={`/officials/${profile.official.id}`}
                    eventName="homepage_recent_profile_clicked"
                    metadata={{ official_id: profile.official.id, official_name: profile.official.name }}
                    className="group block p-5 transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-white/15 bg-slate-800 shadow-lg">
                        <OfficialPhotoImage
                          official={profile.official}
                          sizes="80px"
                          className="object-cover transition duration-300 group-hover:scale-105"
                          fallbackClassName="grid h-full w-full place-items-center bg-slate-800 text-lg font-black uppercase text-slate-300"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="rounded-full border border-blue-300/25 bg-blue-500/10 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-blue-100">
                            {profile.official.level}
                          </span>
                          {profile.official.party ? (
                            <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-slate-200">
                              {profile.official.party}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="truncate text-xl font-black text-white">{profile.official.name}</h3>
                        <p className="mt-1 text-sm font-semibold leading-5 text-slate-300">
                          {profile.official.position} / {profile.official.district ?? profile.official.jurisdiction}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <ProfileMetric label="Sources" value={String(profile.sourceCount)} />
                      <ProfileMetric label="Updated" value={displayDate(profile.lastUpdated)} />
                      <ProfileMetric label="Completeness" value={profile.completeness} />
                      <ProfileMetric label="Status" value={profile.confidence} />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      {profile.voteRecord ? <span>{formatNumber(profile.voteRecord.summary.totalVotesLoaded)} votes</span> : <span>Votes need source</span>}
                      {profile.funding ? <span>{profile.funding.cycle} funding</span> : <span>Funding gap</span>}
                      {profile.redFlagCount ? <span>{profile.redFlagCount} review item(s)</span> : <span>No red flags loaded</span>}
                    </div>
                  </HomepageTrackedLink>
                  <div className="grid grid-cols-2 border-t border-white/10">
                    <HomepageTrackedLink
                      href={`/officials/${profile.official.id}`}
                      eventName="homepage_recent_profile_clicked"
                      metadata={{ official_id: profile.official.id, action: "watch_profile" }}
                      className="flex min-h-12 items-center justify-center gap-2 border-r border-white/10 px-3 text-sm font-black text-blue-100 transition hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Watch
                    </HomepageTrackedLink>
                    <HomepageTrackedLink
                      href={`/submit-source?target=${encodeURIComponent(profile.official.name)}`}
                      eventName="homepage_source_gap_clicked"
                      metadata={{ official_id: profile.official.id, action: "submit_profile_source" }}
                      className="flex min-h-12 items-center justify-center gap-2 px-3 text-sm font-black text-amber-100 transition hover:bg-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    >
                      <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                      Source
                    </HomepageTrackedLink>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/70 p-8 text-center">
              <p className="text-xl font-black text-white">Recently updated profiles appear after profile data is loaded.</p>
              <p className="mt-2 font-semibold text-slate-300">Start by searching or submitting the first public source.</p>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-200">Source gaps</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">The missing record is the next move.</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
              These are not accusations. They are practical gaps where a public link makes the record stronger.
            </p>
          </div>
          <div className="grid gap-3">
            {sourceGaps.map((gap) => (
              <HomepageTrackedLink
                key={gap.label}
                href={gap.href}
                eventName="homepage_source_gap_clicked"
                metadata={{ gap_type: gap.label, target: gap.target }}
                className="group rounded-3xl border border-white/12 bg-white/[0.07] p-5 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-red-300/60 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">{gap.label}</p>
                    <h3 className="mt-2 text-xl font-black text-white">{gap.target}</h3>
                    <p className="mt-1 text-sm font-bold text-blue-100">{gap.jurisdiction}</p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{gap.detail}</p>
                  </div>
                  <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition group-hover:border-amber-200">
                    Submit source
                    <ArrowRight className="h-4 w-4 text-amber-200" aria-hidden="true" />
                  </span>
                </div>
              </HomepageTrackedLink>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/80 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-blue-300/20 bg-blue-500/10 p-6 shadow-2xl shadow-blue-950/25">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">Trending civic interest</p>
                <h2 className="mt-2 text-3xl font-black text-white">Trend data appears after visitor activity starts.</h2>
              </div>
              <Gauge className="h-9 w-9 text-blue-200" aria-hidden="true" />
            </div>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
              RepWatchr will use aggregate analytics only: top searches, top counties, top profiles, source gaps, and package interest.
              No fake trending modules. No private user watchlist leaks.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Top searches", "Top profiles", "Top counties"].map((label) => (
                <div key={label} className="rounded-2xl border border-white/12 bg-slate-950/60 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <p className="mt-3 text-sm font-black text-slate-200">Appears after data collection starts.</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-amber-300/25 bg-amber-300/10 p-6 shadow-2xl shadow-amber-950/20">
            <HomepageSectionViewTracker eventName="homepage_packet_funnel_viewed" />
            <PackageSearch className="h-10 w-10 text-amber-100" aria-hidden="true" />
            <p className="mt-5 text-sm font-black uppercase tracking-[0.28em] text-amber-100">Free Source Packet Funnel</p>
            <h2 className="mt-2 text-3xl font-black text-white">Turn a public source into a clean source packet.</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-200">
              Paste one public URL, add the target and the question, then get a copyable packet that separates the source,
              what it appears to show, what it does not prove, and the next record to pull.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <HomepageTrackedLink
                href="/free-packet"
                eventName="homepage_packet_started"
                metadata={{ placement: "packet_funnel" }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-amber-200 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/20 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-100"
              >
                Build Free Packet
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </HomepageTrackedLink>
              <HomepageTrackedLink
                href="/submit-source"
                eventName="homepage_source_gap_clicked"
                metadata={{ placement: "packet_funnel_submit_source" }}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-100"
              >
                Submit Source Instead
              </HomepageTrackedLink>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-white/12 bg-white/[0.07] p-6 shadow-xl shadow-black/20">
            <Bell className="h-10 w-10 text-blue-200" aria-hidden="true" />
            <p className="mt-5 text-sm font-black uppercase tracking-[0.28em] text-blue-100">Watchlist and dashboard funnel</p>
            <h2 className="mt-2 text-3xl font-black text-white">Save the record so people return for the update.</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
              Members can save officials, races, sources, packets, records request drafts, and submissions. Production alerts and digests
              should stay opt-in and based on real changes.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <HomepageTrackedLink
                href="/create-account"
                eventName="homepage_watchlist_cta_clicked"
                metadata={{ action: "create_free_account" }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </HomepageTrackedLink>
              <HomepageTrackedLink
                href="/dashboard"
                eventName="homepage_watchlist_cta_clicked"
                metadata={{ action: "open_dashboard" }}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Open Dashboard
              </HomepageTrackedLink>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  title: "Saved officials",
                  detail: "Keep profiles, corrections, votes, and source gaps easy to revisit.",
                  icon: Eye,
                },
                {
                  title: "Packet drafts",
                  detail: "Start a packet now, export it, submit it, or save it for review.",
                  icon: ClipboardCheck,
                },
                {
                  title: "Records drafts",
                  detail: "Turn public-record questions into reusable request drafts.",
                  icon: BookOpenCheck,
                },
                {
                  title: "Digest preview",
                  detail: "Show what changed only when production data supports it.",
                  icon: Bell,
                },
              ] satisfies Array<{ title: string; detail: string; icon: LucideIcon }>
            ).map(({ title, detail, icon: Icon }) => (
              <div key={title} className="rounded-3xl border border-white/12 bg-slate-900/75 p-5 shadow-xl shadow-black/20">
                <Icon className="h-7 w-7 text-amber-200" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-black text-white">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.04] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-red-300">Future package interest</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Monetization signal without fake checkout.</h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-300">
              These cards collect demand and route people to the package pages. Payment should stay behind the feature flag until the backend is ready.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {packages.map((packageItem) => (
              <HomepageTrackedLink
                key={packageItem.packageKey}
                href={packageRoute(packageItem)}
                eventName="homepage_package_interest_clicked"
                metadata={{ package_key: packageItem.packageKey, package_name: packageItem.name }}
                className="group flex min-h-[250px] flex-col justify-between rounded-[1.75rem] border border-white/12 bg-slate-950/75 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">{packageItem.eyebrow}</p>
                  <h3 className="mt-3 text-xl font-black text-white">{packageItem.name}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{packageItem.summary}</p>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="text-sm font-black text-amber-100">Request Early Access</span>
                  <ArrowRight className="h-5 w-5 text-amber-200 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
              </HomepageTrackedLink>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <HomepageTrackedLink
            href="/methodology"
            eventName="homepage_trust_box_clicked"
            metadata={{ box: "trust_standards" }}
            className="rounded-[2rem] border border-emerald-300/25 bg-emerald-500/10 p-6 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <ShieldCheck className="h-10 w-10 text-emerald-200" aria-hidden="true" />
            <p className="mt-5 text-sm font-black uppercase tracking-[0.28em] text-emerald-100">Trust standards</p>
            <h2 className="mt-2 text-3xl font-black text-white">The receipt stays attached.</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
              RepWatchr should make public records easier to inspect, not easier to overstate. Public pages must stay correction-safe.
            </p>
          </HomepageTrackedLink>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustStandards.map((standard) => (
              <div key={standard} className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.07] p-4">
                <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-200" aria-hidden="true" />
                <span className="text-sm font-black text-white">{standard}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-28 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(37,99,235,0.26),rgba(185,28,28,0.22))] p-6 shadow-2xl shadow-black/25 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-100">Next useful move</p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Search one name. Submit one source. Build one packet.</h2>
              <p className="mt-3 text-base font-semibold leading-7 text-slate-200">
                The homepage should never dead-end. Pick the action that adds one record, checks one claim, or makes one source shareable.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <HomepageTrackedLink
                href="/search"
                eventName="homepage_action_card_clicked"
                metadata={{ action: "final_search" }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Search Now
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </HomepageTrackedLink>
              <HomepageTrackedLink
                href="/free-packet"
                eventName="homepage_packet_started"
                metadata={{ action: "final_packet" }}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-white focus:outline-none focus:ring-2 focus:ring-white"
              >
                Build Packet
              </HomepageTrackedLink>
            </div>
          </div>
        </div>
      </section>

      <aside className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/85 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl xl:flex xl:flex-col xl:gap-2">
        {(
          [
            { href: "/search", label: "Search", icon: Search },
            { href: "/submit-source", label: "Source", icon: FilePlus2 },
            { href: "/free-packet", label: "Packet", icon: PackageSearch },
            { href: "/dashboard", label: "Watch", icon: Eye },
            { href: "/methodology", label: "Trust", icon: LockKeyhole },
          ] satisfies Array<{ href: string; label: string; icon: LucideIcon }>
        ).map(({ href, label, icon: Icon }) => (
          <HomepageTrackedLink
            key={label}
            href={href}
            eventName="homepage_action_card_clicked"
            metadata={{ action: `sticky_${label.toLowerCase()}` }}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:-translate-x-0.5 hover:border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200"
            aria-label={label}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="pointer-events-none absolute right-full mr-3 hidden rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950 shadow-lg group-hover:block">
              {label}
            </span>
          </HomepageTrackedLink>
        ))}
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-white/15 bg-slate-950/90 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl lg:hidden" aria-label="Homepage mobile actions">
        <div className="grid grid-cols-5 gap-1">
          {(
            [
              { href: "/search", label: "Search", icon: Search },
              { href: "/submit-source", label: "Source", icon: FilePlus2 },
              { href: "/free-packet", label: "Packet", icon: PackageSearch },
              { href: "/dashboard", label: "Watch", icon: Eye },
              { href: "/dashboard", label: "Dash", icon: Building2 },
            ] satisfies Array<{ href: string; label: string; icon: LucideIcon }>
          ).map(({ href, label, icon: Icon }) => (
            <HomepageTrackedLink
              key={label}
              href={href}
              eventName="homepage_action_card_clicked"
              metadata={{ action: `mobile_${label.toLowerCase()}` }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.68rem] font-black uppercase tracking-[0.08em] text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <Icon className="h-5 w-5 text-amber-200" aria-hidden="true" />
              {label}
            </HomepageTrackedLink>
          ))}
        </div>
      </nav>
    </main>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-white">{value}</p>
    </div>
  );
}
