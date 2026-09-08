import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllOfficials, getScoreCard, getIssueCategories, getRepWatchrDataStats, getOfficialById } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import OfficialCard from "@/components/officials/OfficialCard";
import EditorialThumbnail from "@/components/shared/EditorialThumbnail";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import { getOfficialVerifiedBrief } from "@/data/official-verified-briefs";
import { getRepWatchrServices } from "@/data/repwatchr-services";
import { getDailyWireClips, type DailyWireClip } from "@/lib/daily-wire";
import { isInEastTexasLaunchTerritory } from "@/lib/east-texas-launch-territory";
import { articleThumbnailMessage, toEditorialThumbnailMessage } from "@/lib/editorial-visuals";
import { getPublicArticleCatalog } from "@/lib/article-catalog";
import ArticleThumbnail from "@/components/news/ArticleThumbnail";
import styles from "./HomePage.module.css";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import type { NewsArticle, Official } from "@/types";

export const revalidate = 3600;

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "RepWatchr - Public Officials on the Record",
  description:
    "Find public officials, school boards, votes, funding, red flags, and source-backed accountability records voters can inspect and share.",
  path: "/",
  imagePath: buildOgImageUrl("home"),
  imageAlt: "RepWatchr homepage social preview",
});

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

const publicAssetAllowlist = new Set([
  "/images/repwatchr-logo-america-first.png",
  "/images/repwatchr-cover-america-first.png",
  "/images/RepWatchr Profile Pic.png",
  "/images/repwatchr_cover.png",
  "/images/logo.png",
  "/images/profile.png",
  "/images/banner.png",
  "/images/icon.png",
]);

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function publicAssetExists(assetPath?: string) {
  if (!assetPath) return false;
  if (/^https?:\/\//.test(assetPath)) return true;

  const normalizedPath = assetPath.replace(/^\/+/, "");
  if (!normalizedPath || normalizedPath.startsWith("..")) return false;

  return publicAssetAllowlist.has(`/${normalizedPath}`);
}

function officialWithSafePhoto(official: Official): Official {
  if (!official.photo || official.photoMetadata || publicAssetExists(official.photo)) return official;
  return { ...official, photo: undefined };
}

type HomeDeskItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  sourceName: string;
  publishedAt: string | null;
  lane: string;
  imageUrl?: string;
  imageAlt?: string;
  thumbnailMessage?: string;
};

function articleScope(article: NewsArticle) {
  if (article.scope) return article.scope;
  return article.state?.toUpperCase() === "TX" ? "texas" : "national";
}

function storyDateLabel(value: string | null) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
  });
}

// Reserved live-wire slots by lane. RepWatchr is an East Texas desk first, so the
// ticker guarantees East Texas and Texas coverage instead of letting the national
// query lanes win on recency alone.
const HOME_WIRE_EAST_TEXAS_SLOTS = 4;
const HOME_WIRE_TEXAS_SLOTS = 3;
const HOME_WIRE_NATIONAL_SLOTS = 3;
const HOME_WIRE_TICKER_SLOTS = 10;

function wireLaneLabel(clip: DailyWireClip) {
  if (clip.jurisdictionMatch === "local") return "East Texas";
  if (clip.jurisdictionMatch === "texas") return "Texas";
  if (clip.jurisdictionMatch === "national") return "Washington";
  return "State watch";
}

function homeDeskItemFromWire(clip: DailyWireClip): HomeDeskItem {
  return {
    id: `wire-${clip.id}`,
    title: clip.title,
    summary: clip.summary,
    href: `/daily-wire#clip-${clip.id}`,
    sourceName: clip.sourceName,
    publishedAt: clip.publishedAt,
    lane: wireLaneLabel(clip),
  };
}

function homeDeskItemFromArticle(article: NewsArticle): HomeDeskItem {
  const scope = articleScope(article);
  return {
    id: `article-${article.id}`,
    title: article.title,
    summary: article.summary,
    href: `/news/${article.id}`,
    sourceName: article.sourceName ?? "RepWatchr source desk",
    publishedAt: article.publishedAt,
    lane: scope === "national" ? "Washington" : scope === "east-texas" ? "East Texas" : "Texas",
    imageUrl: article.imageUrl,
    imageAlt: article.imageAlt,
    thumbnailMessage: articleThumbnailMessage(article),
  };
}

function LiveDeskTicker({ items }: { items: HomeDeskItem[] }) {
  if (!items.length) return null;
  const rows = [...items, ...items];

  return (
    <div className="hidden grid-cols-[auto_minmax(0,1fr)] border-y border-red-500/35 bg-[#07101f] text-white lg:grid">
      <div className="relative z-10 grid place-items-center bg-red-700 px-4 text-[11px] font-black uppercase tracking-[0.16em] sm:px-6">
        Live wire
      </div>
      <div className="overflow-hidden">
        <div className="repwatchr-live-wire-marquee flex w-max items-center py-2.5">
          {rows.map((item, index) => (
          <Link
            key={`${item.id}-${index}`}
            href={item.href}
            className="group flex min-w-[360px] max-w-[540px] items-center gap-3 border-r border-white/15 px-5 text-sm font-bold text-slate-100 transition hover:bg-white/5 hover:text-white"
          >
            <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-[#e1be64]">
              {item.lane}
            </span>
            <span className="line-clamp-1">{item.title}</span>
          </Link>
        ))}
        </div>
      </div>
    </div>
  );
}

function HomeStoryVisual({ article }: { article: NewsArticle }) {
  return <ArticleThumbnail article={article} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />;
}

export default async function HomePage() {
  const officials = getAllOfficials();
  const issueCategories = getIssueCategories();
  const schoolBoardStats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();
  const [allNews, wireResult] = await Promise.all([
    getPublicArticleCatalog(),
    getDailyWireClips(24),
  ]);
  const latestNews = allNews.slice(1, 4);
  const trustedWireClips = wireResult.clips
    .filter((clip) => clip.publicStatus === "source_linked")
    .filter((clip) => ["local", "texas", "national"].includes(clip.jurisdictionMatch))
    .filter((clip) => clip.geographicRelevance !== "weak" && clip.qualityScore >= 60);
  const nationalLeadWire = trustedWireClips.find((clip) => clip.jurisdictionMatch === "national");
  const leadArticle = allNews[0];
  const leadItem: HomeDeskItem = leadArticle
    ? homeDeskItemFromArticle(leadArticle)
    : nationalLeadWire
      ? homeDeskItemFromWire(nationalLeadWire)
      : {
          id: "washington-watch",
          title: "Washington decisions, votes, and public records",
          summary: "Open the latest federal accountability record.",
          href: "/daily-wire",
          sourceName: "RepWatchr source desk",
          publishedAt: null,
          lane: "Washington",
        };
  // RepWatchr leads with East Texas, then Texas, then Washington. Sorting the wire
  // purely by recency makes the ticker national by arithmetic, because national query
  // lanes outnumber East Texas lanes. Reserve slots by lane instead of hoping.
  const wireByJurisdiction = (match: string) =>
    trustedWireClips.filter((clip) => clip.jurisdictionMatch === match);
  const laneOrderedWireClips = [
    ...wireByJurisdiction("local").slice(0, HOME_WIRE_EAST_TEXAS_SLOTS),
    ...wireByJurisdiction("texas").slice(0, HOME_WIRE_TEXAS_SLOTS),
    ...wireByJurisdiction("national").slice(0, HOME_WIRE_NATIONAL_SLOTS),
  ];
  // Backfill from whatever is left so a quiet East Texas news day never empties the wire.
  const laneOrderedIds = new Set(laneOrderedWireClips.map((clip) => clip.id));
  const backfillWireClips = trustedWireClips.filter((clip) => !laneOrderedIds.has(clip.id));
  const tickerMap = new Map<string, HomeDeskItem>();
  for (const item of [
    ...laneOrderedWireClips.map(homeDeskItemFromWire),
    ...backfillWireClips.slice(0, HOME_WIRE_TICKER_SLOTS).map(homeDeskItemFromWire),
    ...allNews.slice(0, 6).map(homeDeskItemFromArticle),
  ]) {
    tickerMap.set(item.title.toLowerCase(), item);
  }
  const tickerItems = [...tickerMap.values()].slice(0, 10);
  const jayDean = getOfficialById("jay-dean");
  const jayDeanWithPhoto = jayDean ? officialWithSafePhoto(jayDean) : undefined;
  const jayDeanMedia = getOfficialVerifiedBrief("jay-dean")?.media;
  const socialPulse = allNews
    .flatMap((article) =>
      (article.publicPostEmbeds ?? []).map((post) => ({ article, post })),
    )
    .find(({ post }) => post.platform === "x");
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

  const serviceHighlights = getRepWatchrServices().slice(0, 3);

  // The previous selection was an accident of the global sort: at-large districts encode
  // as district 0, so six unrelated at-large House members permanently held the homepage.
  // RepWatchr is an East Texas and Texas desk, so lead with Texas and fall back outward.
  const featuredCandidates = officials.filter(
    (o) => o.level === "federal" || o.level === "state",
  );
  const eastTexasFeatured = featuredCandidates.filter(isInEastTexasLaunchTerritory);
  const texasFeatured = featuredCandidates.filter(
    (o) => o.state === "TX" && !eastTexasFeatured.includes(o),
  );
  const featuredPool = [
    ...eastTexasFeatured,
    ...texasFeatured,
    ...featuredCandidates.filter(
      (o) => !eastTexasFeatured.includes(o) && !texasFeatured.includes(o),
    ),
  ];
  // A face people recognize beats a placeholder, so prefer profiles that have a portrait.
  const featuredOfficials = [
    ...featuredPool.filter((o) => o.photo),
    ...featuredPool.filter((o) => !o.photo),
  ]
    .map(officialWithSafePhoto)
    .slice(0, 6);

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
      {/* Live accountability desk */}
      <section className="border-b border-slate-800 bg-[#050c17] text-white">
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className={styles.masthead}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e1be64]">On the public record</p>
              <h1 className={styles.heading}>
                East Texas. Texas. Washington.
              </h1>
            </div>
            <form action="/officials" role="search" aria-label="Find a public official" className="flex min-w-0 gap-2 rounded-xl border border-white/20 bg-white p-1.5">
              <label htmlFor="home-official-search" className="sr-only">Search by name, office, or school district</label>
              <input id="home-official-search" type="search" name="search" placeholder="Name, office, or school district" className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600" />
              <button type="submit" className="rounded-lg bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Search</button>
            </form>
          </div>

          <div className={styles.heroGrid}>
            <Link href={leadItem.href} aria-label={`Read ${leadItem.title}`} className="group block min-w-0 overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              {leadArticle ? (
                <ArticleThumbnail article={leadArticle} priority featured className={styles.leadThumbnail} sizes="(min-width: 1440px) 820px, (min-width: 1024px) 62vw, 100vw" />
              ) : (
                <EditorialThumbnail
                  message={leadItem.thumbnailMessage ?? toEditorialThumbnailMessage(leadItem.title)}
                  eyebrow={leadItem.lane}
                  support={`${leadItem.sourceName} · ${storyDateLabel(leadItem.publishedAt)}`}
                  variant="federal"
                  className={styles.leadThumbnail}
                  messageClassName="text-3xl sm:text-5xl"
                >
                  <Image src="/images/editorial/washington-accountability-blue-hour.webp" alt="The United States Capitol and press cameras at blue hour" fill priority sizes="(min-width: 1024px) 62vw, 100vw" className="object-cover" />
                </EditorialThumbnail>
              )}
            </Link>

            <div className={styles.sideGrid}>
              <Link href="/elections/texas/marion-county-judge-2026" className="group block overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                <EditorialThumbnail
                  message="Who should lead Marion County?"
                  eyebrow="East Texas race"
                  support="Dina Carroll vs. Leward LaFleur · Community poll"
                  variant="local"
                  className={`${styles.raceThumbnail} border border-[#c87443]/60`}
                  messageClassName="text-2xl sm:text-3xl"
                >
                  <Image
                    src="/images/races/marion-county-judge-2026-hero.webp"
                    alt="Illustrated Marion County courthouse, pine country, and a judge's gavel"
                    fill
                    sizes="(min-width: 1024px) 36vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                </EditorialThumbnail>
              </Link>

              <div className={styles.mediaGrid}>
                {jayDeanMedia ? (
                  <a href={jayDeanMedia.originalUrl} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                    <EditorialThumbnail
                      message="Jay Dean, on the record"
                      eyebrow="Video interview"
                      variant="video"
                      className={`${styles.mediaThumbnail} border border-white/15`}
                      contentClassName="px-4 pb-4"
                      messageClassName="text-2xl sm:text-xl"
                    >
                      {jayDeanWithPhoto?.featuredPhoto || jayDeanWithPhoto?.photo ? (
                        <OfficialPhotoImage official={jayDeanWithPhoto} sizes="(min-width: 1024px) 18vw, (min-width: 640px) 50vw, 100vw" quality={FEATURED_OFFICIAL_PHOTO_QUALITY} className="object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
                      ) : null}
                    </EditorialThumbnail>
                  </a>
                ) : (
                  <Link href="/officials/jay-dean" className="block overflow-hidden rounded-xl">
                    <EditorialThumbnail message="Jay Dean, on the record" eyebrow="East Texas profile" variant="video" className={`${styles.mediaThumbnail} border border-white/15`} messageClassName="text-2xl sm:text-xl" />
                  </Link>
                )}

                {socialPulse ? (
                  <a href={socialPulse.post.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                    <EditorialThumbnail message={articleThumbnailMessage(socialPulse.article)} eyebrow="Public conversation" variant="social" className={`${styles.mediaThumbnail} border border-sky-400/35`} contentClassName="px-4 pb-4" messageClassName="text-2xl sm:text-xl" />
                  </a>
                ) : (
                  <Link href="/feed" className="block overflow-hidden rounded-xl">
                    <EditorialThumbnail message="What does the record show?" eyebrow="Story feed" variant="social" className={`${styles.mediaThumbnail} border border-sky-400/35`} messageClassName="text-2xl sm:text-xl" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <nav aria-label="Explore RepWatchr" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-200">
            <Link href="/blog" className="py-1 underline-offset-4 hover:text-white hover:underline">Latest reporting</Link>
            <Link href="/east-texas" className="py-1 underline-offset-4 hover:text-white hover:underline">East Texas</Link>
            <Link href="/elections" className="py-1 underline-offset-4 hover:text-white hover:underline">Elections</Link>
            <Link href="/submit-source" className="py-1 text-[#f3d47c] underline-offset-4 hover:underline">Submit a source</Link>
          </nav>
        </div>
        <LiveDeskTicker items={tickerItems} />
      </section>

      {/* Story Records */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">Latest reporting</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-blue-950 sm:text-4xl">Follow the public record.</h2>
            </div>
            <Link href="/blog" className="text-sm font-bold text-blue-800 underline underline-offset-4">All reporting</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestNews.map((article) => (
              <Link key={article.id} href={`/news/${article.id}`} className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-red-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">
                <HomeStoryVisual article={article} />
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-700">{article.locationLabel ?? "RepWatchr"} · {storyDateLabel(article.publishedAt)}</p>
                  <h3 className="mt-2 text-xl font-bold leading-tight text-slate-950 group-hover:text-red-700">{article.title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{article.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Proof Bar */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-bold text-blue-950">Explore the public record</h2>
            <Link href="/coverage" className="text-sm font-semibold text-blue-800 underline underline-offset-4">Check coverage</Link>
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

      {/* Services Funnel */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Research services</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
                When a public record needs more work, request a packet.
              </h2>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-blue-950/70">
                Free tools cover search, source intake, and public lanes. Paid services are for
                deeper research, race pages, clean writeups, and source-backed public-record packets.
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
                View lane &rarr;
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
              Inspect a name, read the record, then share the profile.
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
