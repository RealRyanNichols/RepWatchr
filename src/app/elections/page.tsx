import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllNews,
  getAllOfficials,
  getAllScoreCards,
  getFundingSummary,
  getRedFlags,
  getRepWatchrDataStats,
  getScoreCard,
} from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import CopySnippetButton from "@/components/shared/CopySnippetButton";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import ShareButtons from "@/components/shared/ShareButtons";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import type { NewsArticle, Official } from "@/types";

export const metadata: Metadata = {
  ...buildRepWatchrMetadata({
    title: "Election Command Center | RepWatchr",
    description:
      "Find officials, inspect votes, check money, open red flags, submit missing sources, and share the record.",
    path: "/elections",
    imagePath: buildOgImageUrl("race"),
    imageAlt: "RepWatchr Election Command Center preview",
  }),
};

const voterMoves = [
  {
    label: "Find the name",
    href: "/officials",
    detail: "Search the official, office, board, district, county, city, or school system people are talking about.",
  },
  {
    label: "Check votes",
    href: "/votes",
    detail: "Open roll calls and issue records before the debate turns into memory and slogans.",
  },
  {
    label: "Check money",
    href: "/funding",
    detail: "Look for campaign finance, top donors, sector patterns, and source links.",
  },
  {
    label: "Submit receipts",
    href: "/submit-source",
    detail: "Send agendas, filings, meeting clips, voter guides, bond language, corrections, or missing public records.",
  },
];

const electionLanes = [
  {
    title: "Texas race watch",
    href: "/elections/texas",
    detail: "The Texas-first race board for statewide power, East Texas congressional races, state districts, and local watch lanes.",
  },
  {
    title: "Federal and state offices",
    href: "/officials?level=federal",
    detail: "U.S. House, U.S. Senate, state representatives, state senators, governors, and statewide offices.",
  },
  {
    title: "School boards and bonds",
    href: "/school-boards",
    detail: "Trustees, district rosters, meetings, bond measures, curriculum fights, safety votes, and parent-facing records.",
  },
  {
    title: "Votes and scorecards",
    href: "/votes",
    detail: "Roll-call votes, issue categories, scorecards, red flags, and the public-source trail behind them.",
  },
  {
    title: "Stories with receipts",
    href: "/news",
    detail: "Shareable story packets that point back to public officials, votes, funding, source links, and missing records.",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function isSourceLinked(article: NewsArticle) {
  return Boolean(article.sourceUrl || article.sourceLinks?.some((source) => source.url));
}

function isElectionStory(article: NewsArticle) {
  return article.tags.includes("election") || article.powerChannels?.includes("elections");
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function heatForOfficial(official: Official) {
  const scoreCard = getScoreCard(official.id);
  const redFlags = getRedFlags(official.id);
  const funding = getFundingSummary(official.id);
  const scorePressure = scoreCard ? 100 - scoreCard.overall : 0;
  const stateBoost = official.state === "TX" ? 12 : 0;

  return redFlags.length * 35 + scorePressure + (funding ? 18 : 0) + stateBoost;
}

function articleSourceReceipt(article: NewsArticle) {
  if (article.sourceUrl) {
    return `Receipt: ${article.sourceName ?? "Public source"} - ${article.sourceUrl}`;
  }

  const firstSource = article.sourceLinks?.find((source) => source.url);
  if (firstSource) {
    return `Receipt: ${firstSource.title} - ${firstSource.url}`;
  }

  return "Receipt: public-source review needed before amplification.";
}

function articleShareSnippet(article: NewsArticle) {
  return [
    "Before you vote, put this on the record.",
    "",
    article.title,
    "",
    `Why it matters: ${article.summary}`,
    "",
    articleSourceReceipt(article),
    "",
    `Open: https://www.repwatchr.com/news/${article.id}`,
  ].join("\n");
}

function officialShareSnippet(official: Official) {
  const scoreCard = getScoreCard(official.id);
  const redFlagCount = getRedFlags(official.id).length;
  const funding = getFundingSummary(official.id);
  const district = official.district ?? official.jurisdiction;
  const statusLines = [
    scoreCard ? `RepWatchr score: ${scoreCard.overall} (${scoreCard.letterGrade})` : "RepWatchr score: open for source review",
    `${redFlagCount} public red flag${redFlagCount === 1 ? "" : "s"} listed`,
    funding ? "Campaign-money summary is loaded." : "Campaign-money sources still need review.",
  ];

  return [
    `Before you vote, check ${official.name}'s record.`,
    "",
    `${official.position} / ${district}`,
    ...statusLines,
    "",
    `Open: https://www.repwatchr.com/officials/${official.id}`,
  ].join("\n");
}

function ElectionStoryCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={`/news/${article.id}`}
      className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-[0_18px_46px_rgba(15,23,42,0.12)]"
    >
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-red-700 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          Election record
        </span>
        <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          {article.locationLabel ?? article.state ?? "United States"}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-black leading-tight text-slate-950 group-hover:text-red-700">
        {article.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
        {article.summary}
      </p>
      <div className="mt-auto border-t border-slate-100 pt-4">
        <p className="text-xs font-bold text-slate-500">
          {dateLabel(article.publishedAt)}
        </p>
        <p className="mt-1 text-xs font-black text-blue-800">
          {article.sourceName ? `Source: ${article.sourceName}` : "Source packet attached"}
        </p>
        <span className="mt-3 inline-flex text-[11px] font-black uppercase tracking-wide text-slate-950 group-hover:text-red-700">
          Read and share
        </span>
      </div>
    </Link>
  );
}

function OfficialWatchCard({ official }: { official: Official }) {
  const scoreCard = getScoreCard(official.id);
  const redFlagCount = getRedFlags(official.id).length;
  const funding = getFundingSummary(official.id);

  return (
    <Link
      href={`/officials/${official.id}`}
      className="group grid grid-cols-[64px_1fr] gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
    >
      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <OfficialPhotoImage
          official={official}
          sizes="128px"
          quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
          className="object-cover transition duration-300 group-hover:scale-105"
          fallbackClassName="grid h-full w-full place-items-center text-sm font-black text-slate-700"
        />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black text-slate-950 group-hover:text-red-700">
          {official.name}
        </h3>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {official.position} / {official.district ?? official.jurisdiction}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-900">
            {scoreCard ? `${scoreCard.overall} score` : "Open score"}
          </span>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase text-red-700">
            {redFlagCount} flag{redFlagCount === 1 ? "" : "s"}
          </span>
          {funding ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">
              Money loaded
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function SharePacketCard({
  eyebrow,
  title,
  href,
  snippet,
}: {
  eyebrow: string;
  title: string;
  href: string;
  snippet: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-700">{eyebrow}</p>
      <Link href={href} className="mt-2 block text-lg font-black leading-tight text-blue-950 hover:text-red-700">
        {title}
      </Link>
      <p className="mt-3 max-h-40 overflow-hidden whitespace-pre-line rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-700">
        {snippet}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <CopySnippetButton text={snippet} label="Copy post" copiedLabel="Post copied" />
        <Link href={href} className="text-xs font-black uppercase tracking-wide text-blue-800 hover:text-red-700">
          Open record
        </Link>
      </div>
    </div>
  );
}

export default function ElectionsPage() {
  const stats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const officials = getAllOfficials();
  const stories = getAllNews();
  const scoreCards = getAllScoreCards();
  const electionStories = stories
    .filter((article) => isElectionStory(article) && isSourceLinked(article))
    .slice(0, 6);
  const fallbackStories = stories.filter(isSourceLinked).slice(0, 6);
  const storiesToShow = electionStories.length ? electionStories : fallbackStories;
  const watchOfficials = officials
    .filter((official) => official.level === "federal" || official.level === "state")
    .filter((official) => official.photo || getScoreCard(official.id) || getRedFlags(official.id).length)
    .sort((a, b) => heatForOfficial(b) - heatForOfficial(a))
    .slice(0, 6);
  const shareSnippet = [
    "Before you vote, check the record.",
    "",
    "RepWatchr puts officials, votes, money, red flags, school boards, stories, and source links in one place.",
    "",
    "Open the Election Command Center:",
    "https://www.repwatchr.com/elections",
  ].join("\n");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "RepWatchr Election Command Center",
    url: "https://www.repwatchr.com/elections",
    description:
      "A source-backed election hub for officials, votes, funding, red flags, school boards, stories, and public records.",
    about: [
      "public officials",
      "elections",
      "voting records",
      "campaign finance",
      "school boards",
      "public records",
    ],
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_54%,#fff7ed_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className="inline-flex rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
              Election Command Center
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-blue-950 sm:text-7xl">
              Before they vote, send them to the record.
            </h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-blue-950/75 sm:text-lg">
              RepWatchr should be the page voters open before a meeting, debate, hearing, primary,
              runoff, midterm, or general election: find the official, inspect the votes, check the
              money, read the story, submit the missing source, then share the receipt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/elections/texas"
                className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Texas races
              </Link>
              <Link
                href="/officials"
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-950"
              >
                Find officials
              </Link>
              <Link
                href="/votes"
                className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-blue-50"
              >
                Check votes
              </Link>
              <Link
                href="/submit-source"
                className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-amber-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
              >
                Submit source
              </Link>
            </div>
            <div className="mt-6">
              <ShareButtons
                title="RepWatchr Election Command Center"
                description="Find officials, inspect votes, check money, open red flags, submit missing sources, and share the record."
                path="/elections"
                template="public_question"
                subject="RepWatchr election records"
                sourceLabel="officials, votes, money, red flags, school boards, stories, and source links"
              />
            </div>
          </div>

          <div className="grid content-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Public profiles", stats.officialFiles + schoolStats.candidates],
                ["Source URLs", stats.publicSourceUrls + schoolStats.sourceCount],
                ["Vote records", stats.publicVoteRecords],
                ["Scorecards", scoreCards.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-2xl font-black text-slate-950">{formatNumber(Number(value))}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-900">Fastest useful path</p>
              <p className="mt-2 text-2xl font-black leading-tight text-blue-950">
                Search. Compare. Source. Share.
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-blue-950/70">
                This is the election-season loop. Keep visitors moving from hot interest to a record they can repeat.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Voter workflow</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
              Give every election visitor a job they can finish.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {voterMoves.map((move, index) => (
              <Link
                key={move.label}
                href={move.href}
                className="group rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white hover:shadow-md"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-red-700 text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-black leading-tight text-slate-950 group-hover:text-red-700">
                  {move.label}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{move.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#f8fbff]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Record lanes</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
              The election page should route every hot question somewhere useful.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-blue-950/70">
              Voters do not need a maze. They need the shortest path to a person, vote, funding trail,
              source packet, or school-board record they can share.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {electionLanes.map((lane) => (
              <Link
                key={lane.title}
                href={lane.href}
                className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
              >
                <h3 className="text-lg font-black leading-tight text-blue-950 group-hover:text-red-700">
                  {lane.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{lane.detail}</p>
                <span className="mt-4 inline-flex text-xs font-black uppercase tracking-wide text-blue-800 group-hover:text-red-700">
                  Open lane
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Election stories</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
                Stories built to travel back to the record.
              </h2>
            </div>
            <Link href="/news?scope=texas&state=TX" className="text-sm font-black text-blue-800 hover:text-red-700">
              Texas story view
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {storiesToShow.map((article) => (
              <ElectionStoryCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#f8fbff]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Watchboard</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
              Faces, scores, money, and flags keep people clicking.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-blue-950/70">
              The profile is the anchor. Stories and social posts should push people back to the
              person responsible for votes, statements, funding, meetings, and public records.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/officials"
                className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Search profiles
              </Link>
              <Link
                href="/scorecards"
                className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-blue-50"
              >
                Open scorecards
              </Link>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {watchOfficials.map((official) => (
              <OfficialWatchCard key={official.id} official={official} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Post-ready packets</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
              Give supporters the exact post to copy.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-blue-950/70">
              High-attention politics moves fast. These packets keep the hook short, name the record,
              and drive people back to a page where the source trail can be checked.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {storiesToShow.slice(0, 3).map((article) => (
              <SharePacketCard
                key={`story-${article.id}`}
                eyebrow="Story post"
                title={article.title}
                href={`/news/${article.id}`}
                snippet={articleShareSnippet(article)}
              />
            ))}
            {watchOfficials.slice(0, 3).map((official) => (
              <SharePacketCard
                key={`official-${official.id}`}
                eyebrow="Profile post"
                title={official.name}
                href={`/officials/${official.id}`}
                snippet={officialShareSnippet(official)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Share kit</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">
              Make the share clean enough that people use it.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
              The safest viral loop is not a loose accusation. It is a short hook, a link, a source
              standard, and a page that brings people back to the record.
            </p>
            <div className="mt-5">
              <CopySnippetButton text={shareSnippet} label="Copy election post" />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-amber-300">Post copy</p>
            <p className="mt-3 whitespace-pre-line text-sm font-bold leading-7 text-white">{shareSnippet}</p>
            <div className="mt-5 border-t border-white/10 pt-5">
              <ShareButtons
                title="Before you vote, check the record."
                description="RepWatchr Election Command Center: officials, votes, money, red flags, school boards, stories, and source links."
                path="/elections"
                template="public_question"
                subject="RepWatchr election source packet"
                sourceLabel="officials, votes, money, red flags, school boards, stories, and source links"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
