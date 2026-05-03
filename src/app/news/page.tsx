import type { Metadata } from "next";
import Link from "next/link";
import { DAILY_NEWS_WATCH_SOURCES } from "@/data/daily-news-watch-sources";
import { getAllNews, getOfficialById } from "@/lib/data";
import type { NewsArticle, NewsPowerChannel, NewsScope } from "@/types";

export const metadata: Metadata = {
  title: "Geo News Watch | RepWatchr",
  description:
    "Top East Texas, Texas, and United States public-accountability stories organized by officials, school boards, attorneys, media, public safety, elections, courts, and money.",
};

const tagColors: Record<string, string> = {
  breaking: "bg-red-100 text-red-700",
  investigation: "bg-orange-100 text-orange-700",
  watchdog: "bg-amber-100 text-amber-700",
  update: "bg-blue-100 text-blue-700",
  opinion: "bg-purple-100 text-purple-700",
  election: "bg-green-100 text-green-700",
  corruption: "bg-red-100 text-red-800",
  transparency: "bg-emerald-100 text-emerald-700",
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
  "public-safety",
  "attorneys",
  "media",
  "elections",
  "courts",
  "money",
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sourceLabel(article: NewsArticle) {
  if (article.sourceUrl && article.sourceName) return `Source: ${article.sourceName}`;
  if (article.sourceName) return `Source: ${article.sourceName}`;
  return "Needs source URL";
}

function matchesGeo(
  article: NewsArticle,
  scope?: string,
  state?: string,
  county?: string,
  city?: string,
) {
  const normalizedScope = scope as NewsScope | undefined;
  const normalizedState = state?.toUpperCase();
  const normalizedCounty = county?.toLowerCase();
  const normalizedCity = city?.toLowerCase();

  if (normalizedScope && articleScope(article) !== normalizedScope) return false;
  if (normalizedState && article.state?.toUpperCase() !== normalizedState) return false;
  if (normalizedCounty && !(article.counties ?? []).some((item) => item.toLowerCase() === normalizedCounty)) return false;
  if (normalizedCity && !(article.cities ?? []).some((item) => item.toLowerCase() === normalizedCity)) return false;

  return true;
}

function queryFor(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const serialized = query.toString();
  return serialized ? `/news?${serialized}` : "/news";
}

function ArticleCard({ article, compact = false }: { article: NewsArticle; compact?: boolean }) {
  const linkedOfficials = article.officialIds
    .map((id) => getOfficialById(id))
    .filter(Boolean);

  return (
    <Link
      href={`/news/${article.id}`}
      className="group flex h-full min-w-0 flex-col rounded-xl border border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
    >
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          {scopeLabels[articleScope(article)]}
        </span>
        {articleChannels(article).slice(0, compact ? 1 : 3).map((channel) => (
          <span key={channel} className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-900">
            {channelLabels[channel]}
          </span>
        ))}
      </div>

      <h3 className="mt-3 text-base font-black leading-tight text-slate-950 group-hover:text-blue-800 sm:text-lg">
        {article.title}
      </h3>
      <p className={`mt-2 text-sm font-semibold leading-6 text-slate-600 ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
        {article.summary}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {article.tags.slice(0, compact ? 2 : 4).map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tagColors[tag] ?? "bg-slate-100 text-slate-700"}`}
          >
            {tag}
          </span>
        ))}
      </div>

      {linkedOfficials.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {linkedOfficials.slice(0, 3).map((official) => (
            <span
              key={official!.id}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700"
            >
              {official!.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-4 text-xs font-bold text-slate-500">
        <p>{article.locationLabel ?? scopeLabels[articleScope(article)]} / {dateLabel(article.publishedAt)}</p>
        <p className={article.sourceUrl ? "mt-1 text-blue-800" : "mt-1 text-red-700"}>
          {sourceLabel(article)}
        </p>
      </div>
    </Link>
  );
}

function Section({
  title,
  kicker,
  articles,
  empty,
}: {
  title: string;
  kicker: string;
  articles: NewsArticle[];
  empty: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-300 bg-slate-50 p-4 shadow-sm">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{kicker}</p>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">
          {articles.length}
        </span>
      </div>
      {articles.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {articles.slice(0, 6).map((article) => (
            <ArticleCard key={article.id} article={article} compact />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold leading-6 text-slate-600">
          {empty}
        </div>
      )}
    </section>
  );
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const selectedScope = firstParam(params.scope);
  const selectedState = firstParam(params.state);
  const selectedCounty = firstParam(params.county);
  const selectedCity = firstParam(params.city);
  const articles = getAllNews();
  const filtered = articles.filter((article) =>
    matchesGeo(article, selectedScope, selectedState, selectedCounty, selectedCity),
  );
  const activeArticles = filtered.length ? filtered : articles;
  const sourceLinkedCount = articles.filter((article) => Boolean(article.sourceUrl)).length;
  const eastTexasArticles = articles.filter((article) => articleScope(article) === "east-texas");
  const texasArticles = articles.filter((article) => articleScope(article) === "texas");
  const nationalArticles = articles.filter((article) => articleScope(article) === "national");
  const topStories = activeArticles.filter((article) => article.featured).slice(0, 6);
  const clippingLanes = new Set(DAILY_NEWS_WATCH_SOURCES.flatMap((source) => source.powerChannels));

  return (
    <div className="bg-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_30%,#d6b35a_30%,#d6b35a_42%,#ffffff_42%,#ffffff_55%,#1d4ed8_55%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1.08fr_0.92fr] lg:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Geo news watch
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Top stories by place and power lane.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                RepWatchr news should not be a generic feed. It should connect public stories to officials, school boards, attorneys, media, public safety, elections, courts, and money where people live.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {([
                  ["East Texas", queryFor({ scope: "east-texas" })],
                  ["Texas", queryFor({ scope: "texas", state: "TX" })],
                  ["United States", queryFor({ scope: "national" })],
                  ["All", "/news"],
                ] as const).map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-black text-slate-800 transition hover:border-blue-400 hover:bg-blue-50"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
                <p className="text-2xl font-black text-slate-950">{articles.length}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">Stories loaded</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">News records in the public feed.</p>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
                <p className="text-2xl font-black text-slate-950">{sourceLinkedCount}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">Source linked</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Stories with public source URLs.</p>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
                <p className="text-2xl font-black text-slate-950">{eastTexasArticles.length}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">East Texas</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Local power stories.</p>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
                <p className="text-2xl font-black text-slate-950">{filtered.length || articles.length}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">Active feed</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Current geo selection.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Geo preference</p>
              <h2 className="text-xl font-black text-slate-950">
                {selectedScope || selectedState || selectedCounty || selectedCity
                  ? "Filtered feed is active."
                  : "Pick a place. Saved-location preference comes next."}
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                Browser location should stay opt-in. This version uses place filters now, then member profiles can save county, city, district, and state preferences.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["Smith County", queryFor({ scope: "east-texas", state: "TX", county: "Smith" })],
                ["Gregg County", queryFor({ scope: "east-texas", state: "TX", county: "Gregg" })],
                ["Dallas/Fort Worth", queryFor({ scope: "texas", state: "TX", city: "Dallas" })],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-black text-slate-800 hover:border-[#d6b35a] hover:bg-[#fff7df]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Daily clipping system</p>
              <h2 className="text-xl font-black text-amber-950">Breaking public-source watch runs every morning.</h2>
              <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-amber-900">
                RepWatchr now has a daily cron queue for public RSS and news-search links. It captures source-linked stories for review before they become public RepWatchr articles.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniMetric label="Sources" value={DAILY_NEWS_WATCH_SOURCES.length} />
              <MiniMetric label="Lanes" value={clippingLanes.size} />
              <MiniMetric label="Status" value="Review" />
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Top stories</p>
              <h2 className="text-2xl font-black text-slate-950">What people should see first</h2>
            </div>
            <Link href="/news?scope=east-texas" className="text-sm font-black text-blue-800 hover:text-red-700">
              East Texas feed
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(topStories.length ? topStories : activeArticles.slice(0, 6)).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-5">
          <Section
            kicker="East Texas"
            title="Local stories with officials, schools, public safety, and money attached"
            articles={eastTexasArticles}
            empty="No East Texas stories are loaded for this lane yet."
          />
          <Section
            kicker="Texas"
            title="Statewide Texas stories"
            articles={texasArticles}
            empty="No Texas-wide stories are loaded for this lane yet."
          />
          <Section
            kicker="United States"
            title="National public-accountability stories"
            articles={nationalArticles}
            empty="No national stories are loaded for this lane yet."
          />
        </div>

        <section className="mt-8 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Power lanes</p>
            <h2 className="text-2xl font-black text-slate-950">Every tab gets its own news lane</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {channelOrder.map((channel) => {
              const laneArticles = articles.filter((article) => articleChannels(article).includes(channel));
              return (
                <div key={channel} className="rounded-xl border border-slate-300 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-black text-slate-950">{channelLabels[channel]}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">
                      {laneArticles.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {laneArticles.slice(0, 3).map((article) => (
                      <Link key={article.id} href={`/news/${article.id}`} className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold leading-5 text-slate-700 hover:border-blue-300 hover:text-blue-800">
                        {article.title}
                      </Link>
                    ))}
                    {!laneArticles.length ? (
                      <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-semibold leading-5 text-slate-500">
                        Needs source-linked stories.
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <div className="rounded-xl border border-amber-200 bg-white px-3 py-3">
      <p className="text-xl font-black text-amber-950">{displayValue}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-amber-800">{label}</p>
    </div>
  );
}
