import Link from "next/link";
import { getAllOfficials, getScoreCard, getIssueCategories, getAllNews, getRedFlags, getRepWatchrDataStats, getOfficialById } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import OfficialCard from "@/components/officials/OfficialCard";
import FarettaSearchBox from "@/components/shared/FarettaSearchBox";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import { getRepWatchrServices } from "@/data/repwatchr-services";
import type { NewsArticle, Official } from "@/types";

export const revalidate = 3600;

type WatchBoardSignal = {
  official: Official;
  score?: number;
  redFlagCount: number;
  heat: number;
};

const levelCards = [
  {
    level: "federal",
    title: "Federal",
    description: "Congressional profiles, votes, money, and public signals",
    href: "/officials?level=federal",
  },
  {
    level: "state",
    title: "State",
    description: "Texas House and Senate profiles loaded first",
    href: "/officials?level=state",
  },
  {
    level: "county",
    title: "County",
    description: "Local offices that touch taxes, courts, roads, and records",
    href: "/officials?level=county",
  },
  {
    level: "city",
    title: "City",
    description: "Mayors, councils, departments, and local decision makers",
    href: "/officials?level=city",
  },
  {
    level: "school-board",
    title: "School Boards",
    description: "Board members, meetings, votes, and parent-facing records",
    href: "/school-boards",
  },
];

const recordLoop = [
  {
    step: "Search",
    title: "Find the person fast",
    detail: "Start with a name, district, office, or school board and get to the record fast.",
  },
  {
    step: "Grade",
    title: "Let citizens put pressure on the record",
    detail: "Profiles are not static biographies. They are public accountability pages people can rate, revisit, and watch.",
  },
  {
    step: "Source",
    title: "Turn claims into receipts",
    detail: "Every useful tip should become a source, missing-record lead, vote, funding trail, or red flag for review.",
  },
  {
    step: "Share",
    title: "Make every profile easy to share",
    detail: "The page should give voters a clean link they can post before meetings, elections, hearings, and news cycles.",
  },
];

const memberFunnelTools = [
  {
    label: "Watchlist",
    detail: "Keep officials, boards, agencies, and public authority roles in one return path.",
  },
  {
    label: "Records request",
    detail: "Turn a concern into a clean request for agendas, minutes, filings, videos, contracts, or vote records.",
  },
  {
    label: "Timeline starter",
    detail: "Separate dates, claims, source links, missing proof, and next records to pull.",
  },
  {
    label: "Safer share copy",
    detail: "Post what the record shows without overstating what still needs verification.",
  },
];

const twoMinuteChallenge = [
  {
    label: "Find one name",
    href: "/officials",
    detail: "Search the official, board member, district, or office people are arguing about.",
  },
  {
    label: "Open one record",
    href: "/red-flags",
    detail: "Look for the vote, funder, source gap, or red flag that needs a closer look.",
  },
  {
    label: "Submit one source",
    href: "/submit-source",
    detail: "Send the agenda, clip, article, filing, meeting video, contract, or missing link.",
  },
  {
    label: "Build one packet",
    href: "/elections/texas/contribute",
    detail: "Turn the source into a copyable packet that can become a story, correction, or profile update.",
  },
];

const returnHooks = [
  {
    trigger: "Before a meeting",
    promise: "Open the profile, copy the clean talking point, and walk in with the record already organized.",
  },
  {
    trigger: "When a post goes viral",
    promise: "Drop the source-backed profile instead of sending people into another comment fight.",
  },
  {
    trigger: "When a new record appears",
    promise: "Submit the receipt, flag the gap, and turn scattered claims into a reusable public record trail.",
  },
  {
    trigger: "When election season starts",
    promise: "Compare faces, votes, red flags, money, citizen grades, and source links in one place.",
  },
];

const sharePrompts = [
  "Who voted for this, who funded it, and where is the source?",
  "Open the record before the next meeting.",
  "Do not argue from memory. Share the receipt.",
];

const sourceDeskActions = [
  {
    label: "Submit the receipt",
    href: "/submit-source",
    detail: "Send the roster, vote, agenda, filing, clip, article, correction, or missing source link.",
  },
  {
    label: "Open the target",
    href: "/officials",
    detail: "Find the official, board, office, or public role so the source lands on the right record.",
  },
  {
    label: "Check the rules",
    href: "/methodology",
    detail: "Keep facts, public claims, inferences, and missing proof clearly separated.",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function hashDateKey(value: string) {
  return Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0);
}

function isOfficial(value: Official | undefined): value is Official {
  return Boolean(value);
}

function ProfileTicker({ officials }: { officials: Official[] }) {
  const rows = [...officials, ...officials];

  return (
    <div className="overflow-hidden border-y border-slate-200 bg-white">
      <div className="repwatchr-profile-marquee flex w-max gap-3 py-3">
        {rows.map((official, index) => (
          <Link
            key={`${official.id}-${index}`}
            href={`/officials/${official.id}`}
            className="group flex min-w-[210px] items-center gap-3 rounded-full border border-slate-200 bg-slate-50 py-2 pl-2 pr-4 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white bg-slate-200 shadow-sm">
              <OfficialPhotoImage
                official={official}
                sizes="96px"
                className="object-cover transition duration-300 group-hover:scale-110"
                fallbackClassName="grid h-full w-full place-items-center text-xs font-black text-slate-700"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 group-hover:text-blue-800">
                {official.name}
              </p>
              <p className="truncate text-[11px] font-bold text-slate-500">
                {official.position} / {official.district ?? official.jurisdiction}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function WatchBoardCard({
  official,
  score,
  redFlags,
  preload = false,
}: {
  official: Official;
  score?: number;
  redFlags: number;
  preload?: boolean;
}) {
  return (
    <Link
      href={`/officials/${official.id}`}
      className="group grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-xl border border-slate-300 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
    >
      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <OfficialPhotoImage
          official={official}
          sizes="112px"
          preload={preload}
          quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
          className="object-cover transition duration-300 group-hover:scale-105"
          fallbackClassName="grid h-full w-full place-items-center text-sm font-black text-slate-700"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950 group-hover:text-red-700">
          {official.name}
        </p>
        <p className="truncate text-[11px] font-bold text-slate-500">
          {official.position} / {official.district ?? official.jurisdiction}
        </p>
        <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-blue-800">
          {redFlags} flag{redFlags === 1 ? "" : "s"} loaded
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
          Score
        </p>
        <p className="text-xl font-black text-red-700">
          {typeof score === "number" ? score : "Open"}
        </p>
      </div>
    </Link>
  );
}

function MobileWatchBoard({
  signals,
  prompt,
}: {
  signals: WatchBoardSignal[];
  prompt: string;
}) {
  if (!signals.length) {
    return null;
  }

  const [primary, ...supporting] = signals;

  return (
    <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-950 p-3 text-white shadow-xl shadow-blue-950/20 lg:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
            Daily watch
          </p>
          <h2 className="mt-1 text-xl font-black leading-tight">
            Open one record first.
          </h2>
        </div>
        <span className="shrink-0 rounded-full bg-red-700 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
          Daily hook
        </span>
      </div>

      <Link
        href={`/officials/${primary.official.id}`}
        className="group mt-3 grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-xl border border-slate-300 bg-white p-2.5 text-slate-950 shadow-sm transition hover:border-red-300 hover:bg-red-50"
      >
        <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <OfficialPhotoImage
            official={primary.official}
            sizes="112px"
            preload
            quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
            className="object-cover transition duration-300 group-hover:scale-105"
            fallbackClassName="grid h-full w-full place-items-center text-sm font-black text-slate-700"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950 group-hover:text-red-700">
            {primary.official.name}
          </p>
          <p className="truncate text-[11px] font-bold text-slate-500">
            {primary.official.position} / {primary.official.district ?? primary.official.jurisdiction}
          </p>
          <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-blue-800">
            {primary.redFlagCount} flag{primary.redFlagCount === 1 ? "" : "s"} loaded
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
            Score
          </p>
          <p className="text-xl font-black text-red-700">
            {typeof primary.score === "number" ? primary.score : "Open"}
          </p>
        </div>
      </Link>

      {supporting.length > 0 ? (
        <div className="mt-2 grid gap-2">
          {supporting.slice(0, 2).map(({ official, score, redFlagCount }) => (
            <Link
              key={official.id}
              href={`/officials/${official.id}`}
              className="group grid grid-cols-[40px_1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-white/10 p-2 transition hover:bg-white/15"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-white/10 bg-slate-800">
                <OfficialPhotoImage
                  official={official}
                  sizes="80px"
                  quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
                  className="object-cover transition duration-300 group-hover:scale-105"
                  fallbackClassName="grid h-full w-full place-items-center text-[10px] font-black text-white"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-white group-hover:text-amber-200">
                  {official.name}
                </p>
                <p className="truncate text-[10px] font-bold text-slate-300">
                  {redFlagCount} flags loaded
                </p>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-red-700">
                {typeof score === "number" ? score : "Open"}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-2.5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
          Share prompt
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-200">
          {prompt}
        </p>
      </div>
    </div>
  );
}

function HomeStoryVisual({ article }: { article: NewsArticle }) {
  const officialsWithPhotos = article.officialIds
    .map((id) => getOfficialById(id))
    .filter(isOfficial)
    .filter((official) => official.photo)
    .slice(0, 3);

  if (!officialsWithPhotos.length) {
    return (
      <div className="grid aspect-video place-items-center rounded-xl bg-slate-950 p-3 text-center sm:aspect-square">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">Story</p>
        <p className="mt-2 text-2xl font-black text-white">RW</p>
      </div>
    );
  }

  return (
    <div className="grid aspect-video overflow-hidden rounded-xl border border-slate-300 bg-slate-950 sm:aspect-square">
      <div className="grid h-full grid-cols-3">
        {officialsWithPhotos.map((official) => (
          <div key={official.id} className="relative min-h-0 border-r border-white/10 last:border-r-0">
            <OfficialPhotoImage
              official={official}
              sizes="(min-width: 640px) 96px, 33vw"
              quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
              className="object-cover opacity-95"
            />
            <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 px-1.5 py-1">
              <p className="truncate text-[9px] font-black text-white">{official.lastName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const officials = getAllOfficials();
  const issueCategories = getIssueCategories();
  const schoolBoardStats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();
  const electedProfileCount = dataStats.nonSchoolOfficialFiles + schoolBoardStats.candidates;
  const allPublicProfileCount = electedProfileCount + dataStats.publicPowerProfiles;
  const allPublicSourceUrls = dataStats.publicSourceUrls + schoolBoardStats.sourceCount;

  const stats = [
    {
      label: "Public Profiles",
      value: formatNumber(allPublicProfileCount),
      caption: "people and institutions on the record",
    },
    {
      label: "Federal/State",
      value: formatNumber(dataStats.federalAndStateOfficeProfilesLoaded),
      caption: `${dataStats.nationalFederalStateCompletionPercent}% broad benchmark loaded`,
    },
    {
      label: "Authority Roles",
      value: formatNumber(dataStats.publicPowerProfiles),
      caption: "public authority and influence roles",
    },
    {
      label: "Source URLs",
      value: formatNumber(allPublicSourceUrls),
      caption: "links voters can open and share",
    },
  ];

  const photoOfficials = officials
    .filter((official) => official.photo && (official.level === "federal" || official.level === "state"))
    .slice(0, 28);

  const watchBoardSignals = officials
    .filter((official) => official.photo && (official.level === "federal" || official.level === "state"))
    .map((official) => {
      const scoreCard = getScoreCard(official.id);
      const redFlagCount = getRedFlags(official.id).length;
      return {
        official,
        score: scoreCard?.overall,
        redFlagCount,
        heat: redFlagCount * 18 + (scoreCard ? 100 - scoreCard.overall : 0),
      };
    })
    .filter(({ score, redFlagCount }) => typeof score === "number" || redFlagCount > 0)
    .sort((a, b) => b.heat - a.heat);

  const watchBoardOfficials = watchBoardSignals.slice(0, 4);
  const dailySeed = hashDateKey(new Date().toISOString().slice(0, 10));
  const dailyWatchIndex = watchBoardSignals.length > 0 ? dailySeed % watchBoardSignals.length : 0;
  const mobileWatchSignals = watchBoardSignals.length
    ? [
        watchBoardSignals[dailyWatchIndex],
        ...watchBoardSignals.filter((_, index) => index !== dailyWatchIndex).slice(0, 2),
      ]
    : [];
  const dailySharePrompt = sharePrompts[dailySeed % sharePrompts.length];

  const latestNews = getAllNews().slice(0, 3);
  const serviceHighlights = getRepWatchrServices().slice(0, 3);

  const featuredOfficials = officials
    .filter((o) => o.level === "federal" || o.level === "state")
    .slice(0, 6);

  const returnStats = [
    {
      label: "First move",
      value: "2 min",
      detail: "Search, open, source, share",
    },
    {
      label: "Hot records",
      value: formatNumber(watchBoardSignals.length),
      detail: "profiles with scores or flags",
    },
    {
      label: "Fresh signals",
      value: formatNumber(latestNews.length),
      detail: "updates that point back to records",
    },
    {
      label: "Receipts",
      value: formatNumber(allPublicSourceUrls),
      detail: "source links voters can check",
    },
  ];

  const homeStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "RepWatchr",
      url: "https://www.repwatchr.com",
      description:
        "Search public officials, school boards, votes, funding, red flags, source links, and citizen grades.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://www.repwatchr.com/faretta-ai?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "RepWatchr",
      url: "https://www.repwatchr.com",
      logo: "https://www.repwatchr.com/images/repwatchr-logo-america-first.png",
      description:
        "A public accountability index built around official profiles, public records, voting data, school-board rosters, and citizen source submissions.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "RepWatchr public accountability profiles",
      url: "https://www.repwatchr.com",
      description:
        "Source-backed public profiles covering officials, school boards, power profiles, votes, campaign finance, red flags, and public source links.",
      keywords: [
        "public officials",
        "school boards",
        "voting records",
        "campaign finance",
        "red flags",
        "citizen grades",
        "public records",
      ],
      creator: {
        "@type": "Organization",
        name: "RepWatchr",
      },
      spatialCoverage: "United States",
      variableMeasured: [
        "public profiles",
        "source links",
        "citizen grades",
        "voting records",
        "campaign finance",
        "school-board rosters",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to use RepWatchr",
      description: "A four-step public accountability loop for voters.",
      step: recordLoop.map((item, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: item.title,
        text: item.detail,
      })),
    },
  ];

  return (
    <div className="pb-24 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_50%,#fff7ed_100%)]">
        <div className="grid h-2 grid-cols-3">
          <div className="bg-red-700" />
          <div className="bg-white" />
          <div className="bg-blue-900" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.82fr)] lg:items-start lg:px-8 lg:py-5">
          <div className="flex flex-col justify-start">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-sm">
              Accountability loop live
              </span>
              <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-950 shadow-sm">
                {formatNumber(dataStats.officialsWithPhotos)} faces loaded
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-900 shadow-sm">
                Source-backed
              </span>
            </div>
            <MobileWatchBoard signals={mobileWatchSignals} prompt={dailySharePrompt} />
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.92] tracking-tight text-blue-950 sm:text-6xl lg:text-8xl">
              Put your officials
              <span className="block text-red-700">on the record.</span>
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-blue-950/75 sm:text-lg">
              Search a name. Open the profile. Grade the record. Add the missing source.
              Share the page before the meeting, election, hearing, or news cycle. Public pressure
              only works when it turns into receipts, return visits, and records people can repeat.
            </p>
            <div className="mt-5 max-w-2xl">
              <FarettaSearchBox compact placeholder="Search an official, school board, vote, funder, red flag, or record..." />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/officials"
                className="rounded-xl bg-red-700 px-5 py-4 text-center text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5 hover:bg-blue-900"
              >
                Find an official
              </Link>
              <Link
                href="/school-boards"
                className="rounded-xl border border-blue-200 bg-white px-5 py-4 text-center text-sm font-black uppercase tracking-wide text-blue-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50"
              >
                Open school boards
              </Link>
              <Link
                href="/submit-source"
                className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm font-black uppercase tracking-wide text-amber-950 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-100"
              >
                Submit source
              </Link>
              <Link
                href="/elections"
                className="rounded-xl border border-slate-300 bg-slate-950 px-5 py-4 text-center text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-700"
              >
                Election hub
              </Link>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              {recordLoop.map((item) => (
                <div key={item.step} className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-700">{item.step}</p>
                  <p className="mt-1 text-sm font-black leading-5 text-blue-950">{item.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid content-start gap-3">
            <div className="rounded-2xl border border-slate-300 bg-slate-950 p-4 text-white shadow-xl shadow-blue-950/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Open first</p>
                  <h2 className="mt-1 text-2xl font-black">Records built to share.</h2>
                </div>
                <Link href="/red-flags" className="shrink-0 rounded-full bg-red-700 px-3 py-1.5 text-xs font-black text-white transition hover:bg-red-600">
                  Red flags
                </Link>
              </div>
              <div className="mt-4 grid gap-2">
                {watchBoardOfficials.map(({ official, score, redFlagCount }, index) => (
                  <WatchBoardCard
                    key={official.id}
                    official={official}
                    score={score}
                    redFlags={redFlagCount}
                    preload={index < 2}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">
                The strongest RepWatchr pages are not opinion pages. They are names, votes,
                scores, source links, and a next action voters can repeat.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/elections/texas/contribute" className="rounded-xl border border-red-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-50 hover:shadow-md">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Citizen pressure</p>
                <h3 className="mt-1 text-lg font-black text-blue-950">Build a source packet</h3>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">Package the public source, target, dates, and missing record without waiting on accounts.</p>
              </Link>
              <Link href="/methodology" className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md">
                <p className="text-xs font-black uppercase tracking-wide text-blue-800">Trust shield</p>
                <h3 className="mt-1 text-lg font-black text-blue-950">Show the receipts</h3>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">Every claim should point back to a source voters can inspect.</p>
              </Link>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">2-minute challenge</p>
              <h3 className="mt-2 text-2xl font-black leading-tight text-blue-950">
                Check one public record in the next two minutes.
              </h3>
              <div className="mt-4 grid gap-2">
                {twoMinuteChallenge.map((action, index) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="group grid grid-cols-[32px_1fr] gap-3 rounded-xl border border-amber-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-sm"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-red-700 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-black text-blue-950 group-hover:text-red-700">{action.label}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">{action.detail}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <ProfileTicker officials={photoOfficials} />
      </section>

      {/* Proof Bar */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Proof people can check</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
              The record is already loaded. Now make it easy to open, grade, and share.
            </h2>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-100 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="border-b border-r border-gray-100 px-4 py-5 sm:border-b-0">
                <p className="text-2xl font-black text-slate-900 sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700 sm:text-sm">
                  {stat.label}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-gray-500">
                  {stat.caption}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {returnStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-800">{stat.label}</p>
                <p className="mt-2 text-3xl font-black text-red-700">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-blue-950/70">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Records */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">RepWatchr records</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
              Turn public records into stories people actually share.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-blue-950/70">
              RepWatchr turns public records into readable story packets with a hook,
              source trail, linked officials, share snippet, and a path back to the
              full record.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/blog"
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-950"
              >
                Open Blog
              </Link>
              <Link
                href="/elections"
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
              >
                Election command center
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            {latestNews.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.id}`}
                className="group grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white hover:shadow-md sm:grid-cols-[132px_1fr]"
              >
                <HomeStoryVisual article={article} />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-red-700">
                    {article.locationLabel ?? "RepWatchr"} / social-ready
                  </p>
                  <h3 className="mt-1 text-lg font-black leading-tight text-slate-950 group-hover:text-red-700">
                    {article.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                    {article.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Citizen Source Desk */}
      <section className="border-b border-blue-100 bg-[#f8fbff]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Citizen Source Desk</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
              Do not just read the story. Help build the record people share.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-blue-950/70">
              RepWatchr holds value when voters can become useful: source runner,
              profile builder, meeting reporter, correction submitter, or share editor.
              Give them a receipt standard and a clean way back to the record.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/submit-source"
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-950"
              >
                Submit Source
              </Link>
              <Link
                href="/officials"
                className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-blue-50"
              >
                Find a profile
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            {sourceDeskActions.map((action, index) => (
              <Link
                key={action.label}
                href={action.href}
                className="group grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md sm:grid-cols-[48px_1fr]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-blue-950 text-sm font-black text-white group-hover:bg-red-700">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-lg font-black leading-tight text-blue-950 group-hover:text-red-700">
                    {action.label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-6 text-slate-600">
                    {action.detail}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Attention Multiplier */}
      <section className="border-b border-blue-100 bg-[#f8fbff]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Record-to-action loop</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
                Every page should make the next click obvious.
              </h2>
              <p className="mt-4 text-sm font-semibold leading-6 text-blue-950/70">
                The site should not ask voters to admire a database. It should give
                them a clear path from search, to source, to share, to the next record.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {recordLoop.map((item, index) => (
                <div key={item.step} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-red-700 text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">{item.step}</p>
                  </div>
                  <h3 className="mt-4 text-xl font-black leading-tight text-blue-950">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Return Hooks */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Reasons to come back</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
                Make RepWatchr the place people return when pressure rises.
              </h2>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-blue-950/70">
                A useful accountability page should answer the first question and point
                to the next record: meetings, viral posts, new filings, and elections.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {returnHooks.map((hook) => (
                  <div key={hook.trigger} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-red-700">{hook.trigger}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{hook.promise}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-blue-950/15">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Share lines people can use</p>
              <h3 className="mt-2 text-3xl font-black leading-tight">
                Give people words they can use without making claims they cannot prove.
              </h3>
              <div className="mt-5 grid gap-3">
                {sharePrompts.map((prompt) => (
                  <div key={prompt} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-sm font-black leading-6 text-white">&quot;{prompt}&quot;</p>
                  </div>
                ))}
              </div>
              <Link
                href="/methodology"
                className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Check the rules
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Funnel */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Free first. Paid when useful.</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
                Turn attention into source work, research packets, and race pages.
              </h2>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-blue-950/70">
                The free path captures sources while Supabase is paused. Paid services give voters,
                campaigns, and local groups a way to request deeper public-record research without
                turning RepWatchr into a rumor board.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/services"
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-950"
                >
                  View Services
                </Link>
                <Link
                  href="/elections/texas/contribute"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-amber-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
                >
                  Build Free Packet
                </Link>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {serviceHighlights.map((service) => (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                      {service.eyebrow}
                    </span>
                    <span className="text-lg font-black text-red-700">{service.priceLabel}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-black leading-tight text-blue-950 group-hover:text-red-700">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {service.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Attention Loop */}
      <section className="border-b border-blue-100 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-300">Return engine</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">
              Accountability compounds when people have a reason to come back.
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
              The homepage gets the click. The source packet keeps the work moving.
              Give citizens public-records drafts, timeline starters, source tracking,
              and safer share copy so RepWatchr becomes their repeat accountability habit.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/elections/texas/contribute"
                className="rounded-xl bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Build free packet
              </Link>
              <Link
                href="/officials"
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Search first
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-300/30 bg-amber-300 p-5 text-slate-950">
              <p className="text-xs font-black uppercase tracking-wide">The record formula</p>
              <p className="mt-2 text-4xl font-black">4 moves</p>
              <p className="mt-2 text-sm font-bold leading-6">
                Search the name. Grade the record. Add the source. Share the profile.
                That is the loop every page should push.
              </p>
            </div>
            {memberFunnelTools.map((tool) => (
              <div key={tool.label} className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-black text-white">{tool.label}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{tool.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Level */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Choose the record lane
          </h2>
          <p className="text-gray-500 mt-2">
            People do not share categories. They share names, boards, votes, red flags, and receipts.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {levelCards.map((card) => (
            <Link
              key={card.level}
              href={card.href}
              className="group block rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:border-blue-200 hover:-translate-y-1"
            >
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-gray-500 mt-2">{card.description}</p>
              <span className="inline-block mt-4 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                Open records &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Issue Categories */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Score what people already argue about
            </h2>
            <p className="text-gray-500 mt-2">
              Turn hot-button issues into traceable votes, source links, and scorecards people can inspect.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {issueCategories.map((issue) => (
              <Link
                key={issue.id}
                href={`/scorecards/${issue.id}`}
                className="group block rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className="w-10 h-1 rounded-full mb-4"
                  style={{ backgroundColor: issue.color }}
                />
                <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                  {issue.name}
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
                  {issue.description}
                </p>
                <p
                  className="text-xs font-bold mt-3"
                  style={{ color: issue.color }}
                >
                  {issue.weight}% of overall score
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Officials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Faces move faster than folders
            </h2>
            <p className="text-gray-500 mt-1">
              Open a name, inspect the record, then share the profile.
            </p>
          </div>
          <Link
            href="/officials"
            className="text-blue-600 hover:text-blue-800 text-sm font-bold"
          >
            Find a rep &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredOfficials.map((official) => (
            <OfficialCard
              key={official.id}
              official={official}
              scoreCard={getScoreCard(official.id)}
            />
          ))}
        </div>
      </section>

      {/* Latest News */}
      {latestNews.length > 0 && (
        <section className="bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">
                  New records and accountability signals
                </h2>
                <p className="text-gray-500 mt-1">
                  Updates should point people back into profiles, source trails, and action.
                </p>
              </div>
              <Link
                href="/blog"
                className="text-blue-600 hover:text-blue-800 text-sm font-bold"
              >
                Open Blog &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {latestNews.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="group block rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {article.summary}
                  </p>
                  <span className="inline-block mt-4 text-xs text-gray-400">
                    {new Date(article.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Cards */}
      <section className="border-y border-blue-100 bg-[#f4f8ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Attention that survives scrutiny</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
              The loudest page should still be the safest page.
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-blue-950/70">
              RepWatchr can hit hard without getting sloppy: funding, red flags, and scoring all need a visible receipt trail.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              href="/funding"
              className="group rounded-2xl border border-blue-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
            >
              <h3 className="font-extrabold text-xl text-blue-950 mb-3">
                Who Funds Them?
              </h3>
              <p className="text-blue-950/70 text-sm leading-relaxed mb-4">
                Follow the money and give people a shareable reason to ask who
                benefits from the decision.
              </p>
              <span className="text-blue-700 text-sm font-bold group-hover:translate-x-1 inline-block transition-transform">
                View Funding Data &rarr;
              </span>
            </Link>
            <Link
              href="/red-flags"
              className="group rounded-2xl border border-red-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-red-300 hover:shadow-lg"
            >
              <h3 className="font-extrabold text-xl text-red-700 mb-3">
                Red Flags
              </h3>
              <p className="text-blue-950/70 text-sm leading-relaxed mb-4">
                Conflicts, promises, and source-backed issues voters can open
                before they walk into a meeting.
              </p>
              <span className="text-red-700 text-sm font-bold group-hover:translate-x-1 inline-block transition-transform">
                View Red Flags &rarr;
              </span>
            </Link>
            <Link
              href="/methodology"
              className="group rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
            >
              <h3 className="font-extrabold text-xl text-emerald-800 mb-3">
                How We Score
              </h3>
              <p className="text-blue-950/70 text-sm leading-relaxed mb-4">
                Every public score needs to survive a hostile read. Show how the
                record was weighed.
              </p>
              <span className="text-emerald-700 text-sm font-bold group-hover:translate-x-1 inline-block transition-transform">
                View Methodology &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="mx-auto mb-6 h-1.5 max-w-xs rounded-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_35%,#ffffff_35%,#ffffff_65%,#002868_65%,#002868_100%)] shadow-sm" />
          <h2 className="text-3xl font-extrabold text-blue-950 mb-4">
            Do not just watch the record. Move it.
          </h2>
          <p className="text-blue-950/70 text-lg mb-8 max-w-2xl mx-auto">
            Search a profile, package the missing source, request deeper research, and
            share the page with people who need to open it before the next vote.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/elections/texas/contribute"
              className="rounded-xl bg-blue-900 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 hover:bg-red-700"
            >
              Build Free Packet
            </Link>
            <Link
              href="/services"
              className="rounded-xl border-2 border-blue-200 px-8 py-3.5 text-sm font-bold text-blue-900 hover:bg-blue-50 transition-all"
            >
              View Services
            </Link>
            <Link
              href="/officials"
              className="rounded-xl border-2 border-red-200 px-8 py-3.5 text-sm font-bold text-red-700 hover:bg-red-50 transition-all"
            >
              Find Officials
            </Link>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-2xl shadow-blue-950/20 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <Link
            href="/officials"
            className="rounded-xl bg-red-700 px-3 py-3 text-center text-[11px] font-black uppercase tracking-wide text-white"
          >
            Find
          </Link>
          <Link
              href="/submit-source"
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-center text-[11px] font-black uppercase tracking-wide text-amber-950"
          >
            Source
          </Link>
          <Link
            href="/blog"
            className="rounded-xl bg-blue-950 px-3 py-3 text-center text-[11px] font-black uppercase tracking-wide text-white"
          >
            Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
