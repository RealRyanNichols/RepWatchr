import type { Metadata } from "next";
import Link from "next/link";
import {
  getEditorialLoopSteps,
  getSeoTopicClusters,
  type SeoTopicCluster,
} from "@/data/seo-content-plan";
import { getAllNews } from "@/lib/data";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import type { NewsArticle, NewsPowerChannel, NewsScope } from "@/types";

export const metadata: Metadata = {
  ...buildRepWatchrMetadata({
    title: "RepWatchr Blog | Texas Election Records and Accountability",
    description:
      "Source-backed articles for Texas elections, East Texas officials, school boards, public records, and public accountability.",
    path: "/blog",
    imagePath: buildOgImageUrl("news"),
    imageAlt: "RepWatchr blog social preview",
  }),
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

function sourceLabel(article: NewsArticle) {
  if (article.sourceUrl && article.sourceName) return article.sourceName;
  if (article.sourceLinks?.length) return `${article.sourceLinks.length} source links`;
  if (article.sourceName) return article.sourceName;
  return "Source review needed";
}

function clusterMatchesArticle(cluster: SeoTopicCluster, article: NewsArticle) {
  const haystack = [
    article.title,
    article.summary,
    article.locationLabel ?? "",
    ...(article.tags ?? []),
    ...articleChannels(article),
  ]
    .join(" ")
    .toLowerCase();

  return [cluster.primaryKeyword, ...cluster.supportingKeywords, cluster.name]
    .some((keyword) => haystack.includes(keyword.toLowerCase().split(" ")[0]));
}

function BlogJsonLd({ articles, clusters }: { articles: NewsArticle[]; clusters: SeoTopicCluster[] }) {
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "RepWatchr Blog",
    url: "https://www.repwatchr.com/blog",
    description:
      "Source-backed public accountability articles on Texas elections, East Texas officials, school boards, public records, votes, money, and public power.",
    publisher: {
      "@type": "Organization",
      name: "RepWatchr",
      url: "https://www.repwatchr.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.repwatchr.com/images/repwatchr-logo-america-first.png",
      },
    },
    about: clusters.map((cluster) => cluster.primaryKeyword),
    blogPost: articles.slice(0, 10).map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.summary,
      datePublished: article.publishedAt,
      author: {
        "@type": "Organization",
        name: article.author || "RepWatchr",
      },
      url: `https://www.repwatchr.com/news/${article.id}`,
      mainEntityOfPage: `https://www.repwatchr.com/news/${article.id}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
    />
  );
}

function ArticleCard({ article, prominent = false }: { article: NewsArticle; prominent?: boolean }) {
  return (
    <Link
      href={`/news/${article.id}`}
      className={`group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-lg ${
        prominent ? "md:grid md:grid-cols-[0.74fr_1fr] md:gap-5 md:p-5" : ""
      }`}
    >
      <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
          {scopeLabels[articleScope(article)]}
        </p>
        <p className="mt-3 text-3xl font-black leading-none text-white">
          {dateLabel(article.publishedAt).split(",")[0]}
        </p>
        <p className="mt-3 text-xs font-bold leading-5 text-slate-300">
          Receipt: {sourceLabel(article)}
        </p>
      </div>
      <div className="mt-4 flex min-w-0 flex-col md:mt-0">
        <div className="flex flex-wrap gap-2">
          {articleChannels(article).slice(0, 3).map((channel) => (
            <span
              key={channel}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-900"
            >
              {channelLabels[channel]}
            </span>
          ))}
        </div>
        <h2 className={`mt-3 font-black leading-tight text-slate-950 group-hover:text-red-700 ${prominent ? "text-2xl sm:text-3xl" : "text-xl"}`}>
          {article.title}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          {article.summary}
        </p>
        <span className="mt-auto pt-4 text-xs font-black uppercase tracking-wide text-blue-800 group-hover:text-red-700">
          Read the source-backed story
        </span>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const articles = getAllNews();
  const clusters = getSeoTopicClusters();
  const editorialLoop = getEditorialLoopSteps();
  const latestArticles = articles.slice(0, 8);
  const featuredArticle = articles.find((article) => article.featured) ?? latestArticles[0];
  const texasArticles = articles
    .filter((article) => articleScope(article) === "texas" || articleScope(article) === "east-texas")
    .slice(0, 6);
  const sourceLinkedCount = articles.filter((article) => article.sourceUrl || article.sourceLinks?.length).length;

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <BlogJsonLd articles={articles} clusters={clusters} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                Source-backed blog
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
                Articles built to rank because the record is worth reading.
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                RepWatchr articles should answer the search fast: what happened, who is involved,
                where the public source is, what still needs a record, and what a voter can do next.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/elections/texas"
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
                >
                  Texas Election Hub
                </Link>
                <Link
                  href="/services"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
                >
                  Services
                </Link>
                <Link
                  href="/elections/texas/contribute"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-amber-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
                >
                  Build Free Packet
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-3xl font-black text-blue-950">{articles.length}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">Published stories</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Only source-backed records appear here.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-3xl font-black text-blue-950">{sourceLinkedCount}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">Source linked</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Public receipts attached to story records.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-3xl font-black text-blue-950">{clusters.length}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">SEO clusters</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Topics tied to races, officials, schools, and records.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-3xl font-black text-blue-950">TX</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">First focus</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Texas and East Texas lead the buildout.</p>
              </div>
            </div>
          </div>
        </section>

        {featuredArticle ? (
          <section className="mt-7">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Lead story</p>
                <h2 className="text-2xl font-black text-slate-950">Start with the strongest record</h2>
              </div>
              <Link href="/news" className="text-sm font-black text-blue-800 hover:text-red-700">
                Story archive
              </Link>
            </div>
            <ArticleCard article={featuredArticle} prominent />
          </section>
        ) : null}

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Editorial loop</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
              The ranking strategy is source depth, not filler.
            </h2>
            <div className="mt-4 grid gap-3">
              {editorialLoop.map((item, index) => (
                <div key={item.step} className="grid grid-cols-[38px_1fr] gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-950 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-blue-950">{item.title}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">{item.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {latestArticles.slice(0, 4).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Topic clusters</p>
            <h2 className="text-2xl font-black text-slate-950">What RepWatchr should own in search</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clusters.map((cluster) => {
              const matchingCount = articles.filter((article) => clusterMatchesArticle(cluster, article)).length;
              return (
                <article key={cluster.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                      {cluster.primaryKeyword}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">
                      {matchingCount}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-slate-950">{cluster.name}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{cluster.searchIntent}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cluster.internalLinks.slice(0, 3).map((href) => (
                      <Link
                        key={href}
                        href={href}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-blue-800 hover:border-red-300 hover:text-red-700"
                      >
                        {href.replace("/", "") || "home"}
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Texas first</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-amber-950">
                The fastest growth path is local search plus shareable receipts.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
                Build Texas and East Texas pages around offices, races, meetings, filings, money,
                votes, and public-source gaps. Social snippets bring people in. The source page keeps them here.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {texasArticles.slice(0, 4).map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="rounded-lg border border-amber-200 bg-white p-3 text-sm font-black leading-5 text-amber-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
                >
                  {article.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
