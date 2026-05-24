import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CopySnippetButton from "@/components/shared/CopySnippetButton";
import ShareButtons from "@/components/shared/ShareButtons";
import { getAllNews, getOfficialById, getRepWatchrDataStats } from "@/lib/data";
import type { NewsArticle, NewsPowerChannel, NewsScope, Official } from "@/types";

export const metadata: Metadata = {
  title: "RepWatchr Feed | Political Attention Engine",
  description:
    "A source-backed political attention feed built for stories, snippets, public records, officials, school boards, votes, money, red flags, and shareable accountability posts.",
  alternates: {
    canonical: "https://www.repwatchr.com/feed",
  },
  openGraph: {
    title: "RepWatchr Feed | Political Attention Engine",
    description:
      "Stories that travel like social posts and land like evidence packets: public records, officials, votes, money, school boards, and source-backed accountability.",
    url: "https://www.repwatchr.com/feed",
    siteName: "RepWatchr",
    type: "website",
    images: [
      {
        url: "/feed/opengraph-image",
        width: 1200,
        height: 630,
        alt: "RepWatchr Feed - Political Attention Engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWatchr Feed | Political Attention Engine",
    description:
      "Follow source-backed political stories, social snippets, public records, officials, school boards, votes, money, and red flags.",
    images: ["/feed/opengraph-image"],
  },
};

const scopeLabels: Record<NewsScope, string> = {
  "east-texas": "East Texas",
  texas: "Texas",
  national: "United States",
};

const channelLabels: Record<NewsPowerChannel, string> = {
  attorneys: "Attorneys",
  courts: "Courts",
  elections: "Elections",
  media: "Media",
  money: "Money",
  officials: "Officials",
  "public-safety": "Public safety",
  "school-boards": "School boards",
};

const channelOrder: NewsPowerChannel[] = [
  "officials",
  "school-boards",
  "elections",
  "money",
  "public-safety",
  "courts",
  "attorneys",
  "media",
];

const storyFormats = [
  {
    name: "Receipts post",
    detail: "One public claim, one source line, one profile link.",
  },
  {
    name: "Before the meeting",
    detail: "A short record people can open before a board, council, hearing, or town hall.",
  },
  {
    name: "Who benefits thread",
    detail: "Money, votes, officials, agencies, and source gaps in one trail.",
  },
  {
    name: "Election memory",
    detail: "The record voters can revisit when the flyer, debate, or ballot shows up.",
  },
];

const consumerNeeds = [
  "Read the story",
  "Open the source",
  "Find the official",
  "Share the snippet",
  "Submit the missing record",
  "Come back when it changes",
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isFeedChannel(value: string | undefined): value is NewsPowerChannel {
  return Boolean(value && channelOrder.includes(value as NewsPowerChannel));
}

function isOfficial(value: Official | undefined): value is Official {
  return Boolean(value);
}

function articleScope(article: NewsArticle): NewsScope {
  if (article.scope) return article.scope;
  if (article.state?.toUpperCase() === "TX") return "texas";
  return "texas";
}

function articleChannels(article: NewsArticle): NewsPowerChannel[] {
  return article.powerChannels?.length ? article.powerChannels : ["officials"];
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeValue(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function initialsFor(official: Official) {
  return `${official.firstName[0] ?? ""}${official.lastName[0] ?? ""}`;
}

function sourceLine(article: NewsArticle) {
  if (article.sourceUrl && article.sourceName) return `Source: ${article.sourceName}`;
  if (article.sourceName) return `Source named: ${article.sourceName}`;
  return "Source status: needs review";
}

function storyWeight(article: NewsArticle, linkedOfficials: Official[]) {
  let score = 30;
  if (article.featured) score += 18;
  if (article.sourceUrl) score += 18;
  score += Math.min(linkedOfficials.length * 8, 24);
  score += Math.min(articleChannels(article).length * 4, 12);
  return Math.min(score, 100);
}

function socialSnippet(article: NewsArticle) {
  const receipt = article.sourceUrl
    ? sourceLine(article)
    : "Source review needed before amplification.";

  return [
    `RepWatchr story: ${article.title}`,
    "",
    `Why it matters: ${article.summary}`,
    "",
    `Receipt: ${receipt}`,
    "",
    `Open the record: https://www.repwatchr.com/news/${article.id}`,
  ].join("\n");
}

function localImageUrl(value: string | undefined) {
  return value?.startsWith("/") ? value : undefined;
}

function FeedMedia({
  article,
  linkedOfficials,
}: {
  article: NewsArticle;
  linkedOfficials: Official[];
}) {
  const articleImage = localImageUrl(article.imageUrl);
  const officialsWithPhotos = linkedOfficials.filter((official) => localImageUrl(official.photo)).slice(0, 3);

  if (articleImage) {
    return (
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Image
          src={articleImage}
          alt={`${article.title} visual`}
          fill
          sizes="(min-width: 1024px) 720px, 100vw"
          className="object-cover"
        />
      </div>
    );
  }

  if (officialsWithPhotos.length) {
    return (
      <div className="grid aspect-[16/9] grid-cols-3 overflow-hidden bg-slate-900">
        {officialsWithPhotos.map((official) => (
          <div key={official.id} className="relative border-r border-white/10 last:border-r-0">
            <Image
              src={official.photo!}
              alt={`${official.name} profile photo`}
              fill
              sizes="240px"
              className="object-cover opacity-90"
            />
            <div className="absolute inset-x-0 bottom-0 bg-slate-950/78 p-2">
              <p className="truncate text-[11px] font-black text-white">{official.name}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid aspect-[16/9] grid-cols-[0.72fr_1fr] overflow-hidden bg-slate-950">
      <div className="grid place-items-center border-r border-white/10 bg-white">
        <Image
          src="/images/profile.png"
          alt="RepWatchr"
          width={180}
          height={180}
          className="h-28 w-28 object-contain"
        />
      </div>
      <div className="flex flex-col justify-between p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
          Source-backed story
        </p>
        <p className="text-2xl font-black leading-tight text-white">
          {article.locationLabel ?? scopeLabels[articleScope(article)]}
        </p>
        <p className="text-sm font-bold text-slate-300">
          {sourceLine(article)}
        </p>
      </div>
    </div>
  );
}

function FeedPostCard({ article }: { article: NewsArticle }) {
  const linkedOfficials = article.officialIds.map((id) => getOfficialById(id)).filter(isOfficial);
  const channels = articleChannels(article);
  const weight = storyWeight(article, linkedOfficials);
  const snippet = socialSnippet(article);
  const primaryOfficial = linkedOfficials[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-700 text-sm font-black text-white">
            RW
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">RepWatchr Story Desk</p>
            <p className="text-xs font-bold text-slate-500">
              {dateLabel(article.publishedAt)} / {scopeLabels[articleScope(article)]}
            </p>
          </div>
        </div>
        <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
          {weight}% weight
        </div>
      </div>

      <FeedMedia article={article} linkedOfficials={linkedOfficials} />

      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap gap-2">
          {channels.slice(0, 3).map((channel) => (
            <span key={channel} className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-900">
              {channelLabels[channel]}
            </span>
          ))}
          {article.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-900">
              {tag}
            </span>
          ))}
        </div>

        <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
          {article.title}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700 sm:text-base">
          {article.summary}
        </p>

        {linkedOfficials.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {linkedOfficials.slice(0, 5).map((official) => (
              <Link
                key={official.id}
                href={`/officials/${official.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-800 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-100 text-[10px] text-blue-900">
                  {initialsFor(official)}
                </span>
                {official.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-5 border-y border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">
              Social snippet
            </p>
            <CopySnippetButton text={snippet} />
          </div>
          <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-slate-800">
            {snippet}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ShareButtons
            title={article.title}
            description={article.summary}
            path={`/news/${article.id}`}
          />
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/news/${article.id}`}
              className="rounded-xl bg-blue-950 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-700"
            >
              Read story
            </Link>
            {primaryOfficial ? (
              <Link
                href={`/officials/${primaryOfficial.id}`}
                className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wide text-blue-950 transition hover:border-red-300 hover:bg-red-50"
              >
                Open profile
              </Link>
            ) : (
              <Link
                href="/feedback"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-amber-950 transition hover:border-red-300 hover:bg-white"
              >
                Add source
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const selectedLaneParam = firstParam(params.lane);
  const selectedLane = isFeedChannel(selectedLaneParam) ? selectedLaneParam : undefined;
  const articles = getAllNews().slice().sort((a, b) => timeValue(b.publishedAt) - timeValue(a.publishedAt));
  const visibleArticles = selectedLane
    ? articles.filter((article) => articleChannels(article).includes(selectedLane))
    : articles;
  const dataStats = getRepWatchrDataStats();
  const featured = visibleArticles.filter((article) => article.featured);
  const sourceLinked = visibleArticles.filter((article) => article.sourceUrl);
  const feedArticles = [
    ...featured.filter((article) => article.sourceUrl),
    ...visibleArticles.filter((article) => !article.featured && article.sourceUrl),
    ...featured.filter((article) => !article.sourceUrl),
    ...visibleArticles.filter((article) => !article.featured && !article.sourceUrl),
  ];
  const profileLinkedCount = new Set(visibleArticles.flatMap((article) => article.officialIds)).size;
  const laneStats = channelOrder.map((channel) => ({
    channel,
    count: articles.filter((article) => articleChannels(article).includes(channel)).length,
  }));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: selectedLane ? `${channelLabels[selectedLane]} RepWatchr Feed` : "RepWatchr Feed",
    url: selectedLane ? `https://www.repwatchr.com/feed?lane=${selectedLane}` : "https://www.repwatchr.com/feed",
    description:
      "A source-backed political attention feed of RepWatchr stories, public records, official profiles, snippets, and shareable accountability posts.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: feedArticles.slice(0, 12).map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://www.repwatchr.com/news/${article.id}`,
        name: article.title,
      })),
    },
  };

  return (
    <div className="rw-page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_32%,#d6b35a_32%,#d6b35a_44%,#ffffff_44%,#ffffff_58%,#002868_58%,#002868_100%)]" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_0.82fr] lg:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                {selectedLane ? `${channelLabels[selectedLane]} lane` : "RepWatchr feed"}
              </p>
              <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl">
                {selectedLane ? `${channelLabels[selectedLane]} attention feed.` : "The political attention feed."}
              </h1>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
                Stories should travel like social posts and land like evidence packets.
                RepWatchr turns public records, officials, votes, money, school boards,
                source gaps, and citizen pressure into posts people can read, share, and trace.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/feed"
                  className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                    selectedLane
                      ? "border border-slate-300 bg-slate-50 text-slate-800 hover:border-red-300 hover:bg-red-50"
                      : "bg-slate-950 text-white"
                  }`}
                >
                  All feed
                </Link>
                {channelOrder.map((channel) => (
                  <Link
                    key={channel}
                    href={`/feed?lane=${channel}`}
                    className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                      selectedLane === channel
                        ? "bg-red-700 text-white"
                        : "border border-slate-300 bg-slate-50 text-slate-800 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    {channelLabels[channel]}
                  </Link>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/news"
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-950"
                >
                  Article archive
                </Link>
                <Link
                  href="/daily-wire"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-amber-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
                >
                  Daily Watch
                </Link>
                <Link
                  href="/feedback"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-amber-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
                >
                  Submit source
                </Link>
                <Link
                  href="/officials"
                  className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-950 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                >
                  Find target
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric label="Posts" value={visibleArticles.length} />
              <Metric label="Featured" value={featured.length} />
              <Metric label="Sources" value={sourceLinked.length} />
              <Metric label="Profiles tied" value={profileLinkedCount} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {feedArticles.length ? (
              feedArticles.slice(0, 8).map((article) => (
                <FeedPostCard key={article.id} article={article} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-red-700">
                  Lane needs records
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  No stories are loaded in this lane yet.
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                  Submit a source, article, filing, meeting clip, agenda, vote, or public record and turn this lane into a shareable story trail.
                </p>
                <Link
                  href="/feedback"
                  className="mt-5 inline-flex rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white"
                >
                  Submit source
                </Link>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Daily Watch
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">
                New source-linked political wire every morning.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Cron watches officials, oversight, UAP transparency, whistleblowers, ethics, money, courts, school boards, and public-safety signals.
              </p>
              <Link
                href="/daily-wire"
                className="mt-4 inline-flex rounded-xl bg-red-700 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-blue-950"
              >
                Open daily wire
              </Link>
            </section>

            <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Story machine
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">
                One package for political attention.
              </h2>
              <div className="mt-4 grid gap-2">
                {consumerNeeds.map((need) => (
                  <div key={need} className="border-b border-slate-100 py-2 text-sm font-black text-slate-800 last:border-b-0">
                    {need}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-300 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                Story formats
              </p>
              <div className="mt-4 space-y-4">
                {storyFormats.map((format) => (
                  <div key={format.name} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                    <h3 className="text-sm font-black text-white">{format.name}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">
                      {format.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Power lanes
              </p>
              <div className="mt-3 space-y-2">
                {laneStats.map((lane) => (
                  <Link
                    key={lane.channel}
                    href={`/feed?lane=${lane.channel}`}
                    className={`flex items-center justify-between border-b border-slate-100 py-2 text-sm font-black last:border-b-0 hover:text-red-700 ${
                      selectedLane === lane.channel ? "text-red-700" : "text-slate-800"
                    }`}
                  >
                    <span>{channelLabels[lane.channel]}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {lane.count}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-900">
                Loaded record base
              </p>
              <p className="mt-2 text-3xl font-black text-amber-950">
                {dataStats.publicSourceUrls.toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-amber-900">
                public source URLs feeding profiles, articles, votes, funding, red flags, and watch lanes.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
      <p className="text-3xl font-black text-slate-950">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
    </div>
  );
}
