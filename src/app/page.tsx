import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllOfficials, getScoreCard, getIssueCategories, getAllNews, getRepWatchrDataStats, getOfficialById } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import OfficialCard from "@/components/officials/OfficialCard";
import EditorialThumbnail from "@/components/shared/EditorialThumbnail";
import FarettaSearchBox from "@/components/shared/FarettaSearchBox";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import NextUsefulMove from "@/components/shared/NextUsefulMove";
import { getOfficialVerifiedBrief } from "@/data/official-verified-briefs";
import { getRepWatchrServices } from "@/data/repwatchr-services";
import { getDailyWireClips, type DailyWireClip } from "@/lib/daily-wire";
import { articleThumbnailMessage, toEditorialThumbnailMessage } from "@/lib/editorial-visuals";
import { getPublishedArticles } from "@/lib/published-articles";
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

function isOfficial(value: Official | undefined): value is Official {
  return Boolean(value);
}

function publicAssetExists(assetPath?: string) {
  if (!assetPath) return false;
  if (/^https?:\/\//.test(assetPath)) return true;

  const normalizedPath = assetPath.replace(/^\/+/, "");
  if (!normalizedPath || normalizedPath.startsWith("..")) return false;

  return publicAssetAllowlist.has(`/${normalizedPath}`);
}

function officialWithSafePhoto(official: Official): Official {
  if (!official.photo || publicAssetExists(official.photo)) return official;
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
};

function articleScope(article: NewsArticle) {
  if (article.scope) return article.scope;
  return article.state?.toUpperCase() === "TX" ? "texas" : "national";
}

function storyDateLabel(value: string | null) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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
  };
}

function LiveDeskTicker({ items }: { items: HomeDeskItem[] }) {
  if (!items.length) return null;
  const rows = [...items, ...items];

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] border-y border-red-500/35 bg-[#07101f] text-white">
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
  const articleImage = article.imageUrl?.startsWith("/") ? article.imageUrl : undefined;
  const officialsWithPhotos = article.officialIds
    .map((id) => getOfficialById(id))
    .filter(isOfficial)
    .map(officialWithSafePhoto)
    .filter((official) => official.photo)
    .slice(0, 3);
  const message = articleThumbnailMessage(article);
  const variant = articleScope(article) === "national" ? "federal" : "local";

  if (articleImage) {
    return (
      <EditorialThumbnail
        message={message}
        eyebrow={article.locationLabel ?? "RepWatchr story"}
        support={article.sourceName ? `Source: ${article.sourceName}` : "Open the sourced record"}
        variant={variant}
        className="aspect-video rounded-sm border border-slate-300 sm:aspect-square"
        contentClassName="px-3 pb-3"
        messageClassName="text-base sm:text-lg"
      >
        <Image
          src={articleImage}
          alt={article.imageAlt ?? `${article.title} visual`}
          fill
          sizes="(min-width: 640px) 132px, 100vw"
          quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
          className="object-cover"
        />
      </EditorialThumbnail>
    );
  }

  if (!officialsWithPhotos.length) {
    return (
      <EditorialThumbnail
        message={message}
        eyebrow={article.locationLabel ?? "RepWatchr story"}
        support={article.sourceName ? `Source: ${article.sourceName}` : "Open the sourced record"}
        variant={variant}
        className="aspect-video rounded-sm sm:aspect-square"
        contentClassName="px-3 pb-3"
        messageClassName="text-base sm:text-lg"
      />
    );
  }

  return (
    <EditorialThumbnail
      message={message}
      eyebrow={article.locationLabel ?? "RepWatchr story"}
      support={article.sourceName ? `Source: ${article.sourceName}` : "Open the sourced record"}
      variant={variant}
      className="aspect-video rounded-sm border border-slate-300 sm:aspect-square"
      contentClassName="px-3 pb-3"
      messageClassName="text-base sm:text-lg"
    >
      <div className="grid h-full grid-cols-3">
          {officialsWithPhotos.map((official) => (
            <div key={official.id} className="relative min-h-0 border-r border-white/10 last:border-r-0">
              <OfficialPhotoImage
                official={official}
                sizes="(min-width: 640px) 96px, 33vw"
                quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
                className="object-cover opacity-95"
              />
            </div>
          ))}
      </div>
    </EditorialThumbnail>
  );
}

export default async function HomePage() {
  const officials = getAllOfficials();
  const issueCategories = getIssueCategories();
  const schoolBoardStats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();
  const staticArticles = getAllNews();
  const [databaseArticles, wireResult] = await Promise.all([
    getPublishedArticles(20),
    getDailyWireClips(24),
  ]);
  const articleMap = new Map<string, NewsArticle>();
  for (const article of [...staticArticles, ...databaseArticles]) articleMap.set(article.id, article);
  const allNews = [...articleMap.values()].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const latestNews = allNews.slice(0, 3);
  const trustedWireClips = wireResult.clips
    .filter((clip) => clip.publicStatus === "source_linked")
    .filter((clip) => ["local", "texas", "national"].includes(clip.jurisdictionMatch))
    .filter((clip) => clip.geographicRelevance !== "weak" && clip.qualityScore >= 60);
  const nationalLeadWire = trustedWireClips.find((clip) => clip.jurisdictionMatch === "national");
  const nationalLeadArticle =
    allNews.find((article) => articleScope(article) === "national") ?? allNews[0];
  const leadItem = nationalLeadWire
    ? homeDeskItemFromWire(nationalLeadWire)
    : nationalLeadArticle
      ? homeDeskItemFromArticle(nationalLeadArticle)
      : {
          id: "washington-watch",
          title: "Washington decisions, votes, and public records",
          summary: "Open the latest federal accountability record.",
          href: "/daily-wire",
          sourceName: "RepWatchr source desk",
          publishedAt: null,
          lane: "Washington",
        };
  const tickerMap = new Map<string, HomeDeskItem>();
  for (const item of [
    ...trustedWireClips.slice(0, 8).map(homeDeskItemFromWire),
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

  const featuredOfficials = officials
    .filter((o) => o.level === "federal" || o.level === "state")
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
      <section className="overflow-hidden border-b border-slate-800 bg-[#050c17] text-white">
        <div className="h-1.5 bg-[linear-gradient(90deg,#b91c1c_0%,#b91c1c_33%,#d6b35a_33%,#d6b35a_50%,#0f3a73_50%,#0f3a73_100%)]" />
        <LiveDeskTicker items={tickerItems} />

        <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 lg:px-7">
          <div className="mb-4 flex flex-col gap-3 border-b border-white/15 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#e1be64]">
                RepWatchr live desk
              </p>
              <h1 className="mt-1 font-serif text-3xl font-black leading-none tracking-[-0.035em] text-white sm:text-4xl">
                East Texas. Texas. Washington.
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-black">
              <Link
                href="/daily-wire"
                className="border border-red-500/60 bg-red-700 px-4 py-2.5 text-white transition hover:bg-red-600"
              >
                Open live wire
              </Link>
              <Link
                href="/east-texas"
                className="border border-white/20 bg-white/5 px-4 py-2.5 text-white transition hover:bg-white/10"
              >
                East Texas desk
              </Link>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <Link href={leadItem.href} className="group block min-h-[360px] lg:min-h-[510px]">
              <EditorialThumbnail
                message={toEditorialThumbnailMessage(leadItem.title, { maxWords: 11, maxCharacters: 78 })}
                eyebrow="Washington watch"
                support={`${leadItem.sourceName} â€¢ ${storyDateLabel(leadItem.publishedAt)}`}
                variant="federal"
                className="h-full border border-white/15"
                contentClassName="px-5 pb-6 sm:px-7 sm:pb-7"
                messageClassName="max-w-[21ch] text-3xl sm:text-5xl lg:text-6xl"
              >
                <Image
                  src="/images/editorial/washington-accountability-blue-hour.webp"
                  alt="The United States Capitol and press cameras at blue hour"
                  fill
                  priority
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              </EditorialThumbnail>
            </Link>

            <div className="grid gap-3">
              <Link
                href="/elections/texas/marion-county-judge-2026"
                className="group block min-h-[245px]"
              >
                <EditorialThumbnail
                  message="Who should lead Marion County?"
                  eyebrow="East Texas race"
                  support="Dina Carroll vs. Leward LaFleur â€¢ Community poll"
                  variant="local"
                  className="h-full border border-[#c87443]/60"
                  messageClassName="text-2xl sm:text-3xl"
                >
                  <Image
                    src="/images/races/marion-county-judge-2026-hero.webp"
                    alt="Illustrated Marion County courthouse, pine country, and a judge's gavel"
                    fill
                    sizes="(min-width: 1024px) 34vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                </EditorialThumbnail>
              </Link>

              <div className="grid gap-3 sm:grid-cols-2">
                {jayDeanMedia ? (
                  <a
                    href={jayDeanMedia.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block min-h-[200px]"
                  >
                    <EditorialThumbnail
                      message="Jay Dean answers on camera"
                      eyebrow="Video"
                      support="KETK 2026 profile interview"
                      variant="video"
                      className="h-full border border-white/15"
                      contentClassName="px-3 pb-3"
                      messageClassName="text-lg sm:text-xl"
                    >
                      {jayDeanWithPhoto?.photo ? (
                        <OfficialPhotoImage
                          official={jayDeanWithPhoto}
                          sizes="(min-width: 1024px) 18vw, 50vw"
                          quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
                          className="object-cover object-top opacity-90 transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : null}
                    </EditorialThumbnail>
                  </a>
                ) : (
                  <Link href="/officials/jay-dean" className="block min-h-[200px]">
                    <EditorialThumbnail
                      message="Open Jay Dean's public record"
                      eyebrow="East Texas profile"
                      variant="video"
                      className="h-full border border-white/15"
                      contentClassName="px-3 pb-3"
                      messageClassName="text-lg sm:text-xl"
                    />
                  </Link>
                )}

                {socialPulse ? (
                  <a
                    href={socialPulse.post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block min-h-[200px]"
                  >
                    <EditorialThumbnail
                      message={toEditorialThumbnailMessage(
                        socialPulse.article.thumbnailMessage || socialPulse.article.title,
                      )}
                      eyebrow="Social pulse"
                      support={`${socialPulse.post.author} on X â€¢ Open the public post`}
                      variant="social"
                      className="h-full border border-sky-400/35"
                      contentClassName="px-3 pb-3"
                      messageClassName="text-lg sm:text-xl"
                    />
                  </a>
                ) : (
                  <Link href="/feed" className="block min-h-[200px]">
                    <EditorialThumbnail
                      message="Follow the sourced political conversation"
                      eyebrow="Social pulse"
                      support="Public posts stay separate from verified facts"
                      variant="social"
                      className="h-full border border-sky-400/35"
                      contentClassName="px-3 pb-3"
                      messageClassName="text-lg sm:text-xl"
                    />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 border-y border-white/15 bg-white/[0.04] p-3 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-300">
                Search the record
              </p>
              <p className="mt-1 text-sm font-bold text-slate-300">
                Names, offices, votes, money, and sources
              </p>
            </div>
            <FarettaSearchBox
              compact
              placeholder="Search an official, judge, county office, vote, funder, or public record..."
            />
            <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-black sm:flex">
              <Link href="/officials" className="border border-white/15 px-3 py-2.5 text-white hover:bg-white/10">
                Officials
              </Link>
              <Link href="/elections" className="border border-white/15 px-3 py-2.5 text-white hover:bg-white/10">
                Elections
              </Link>
              <Link href="/news" className="border border-white/15 px-3 py-2.5 text-white hover:bg-white/10">
                Top stories
              </Link>
              <Link href="/submit-source" className="border border-[#d6b35a]/50 px-3 py-2.5 text-[#f3d47c] hover:bg-white/10">
                Send a tip
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <NextUsefulMove
            recordPath="/dashboard"
            sourcePath="/submit-source"
            packetPath="/free-packet"
            safeShareLine="RepWatchr is for public records first: search the profile, check the receipt, and submit a better source when something is missing."
            meetingQuestion="What public record supports this decision, and where can citizens inspect it before the next meeting?"
          />
        </div>
      </section>

      {/* Proof Bar */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Proof people can check</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
              The database has depth. The first page should make that depth easy to enter.
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
                Read Blog
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
        m«ëŒ+Š×ž®º+º$zzb¥