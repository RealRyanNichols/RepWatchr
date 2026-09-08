import type { Metadata } from "next";
import Link from "next/link";
import ArticleThumbnail from "@/components/news/ArticleThumbnail";
import { getPublicArticleCatalog } from "@/lib/article-catalog";
import { absoluteRepWatchrUrl, buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { jsonLd } from "@/lib/structured-data";
import type { NewsArticle } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildRepWatchrMetadata({
  title: "Blog | Records and Political Accountability",
  description: "Read sourced reporting and clearly labeled commentary on elected officials, school boards, public spending, and elections from East Texas to Washington.",
  path: "/blog", imagePath: buildOgImageUrl("news"), imageAlt: "RepWatchr reporting and public records",
});

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric" });
}
function scopeLabel(article: NewsArticle) {
  return article.scope === "east-texas" ? "East Texas" : article.scope === "texas" ? "Texas" : "United States";
}
function ArticleCard({ article, featured = false }: { article: NewsArticle; featured?: boolean }) {
  const sources = new Set([article.sourceUrl, ...(article.sourceLinks ?? []).map((source) => source.url)].filter(Boolean)).size;
  return (
    <article className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${featured ? "lg:grid lg:grid-cols-2" : "flex h-full flex-col"}`}>
      <Link href={`/news/${article.id}`} aria-label={`Read ${article.title}`} className="relative block w-full self-start overflow-hidden bg-slate-100 focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-700">
        <ArticleThumbnail article={article} featured={featured} priority={featured} sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"} />
      </Link>
      <div className={`flex min-w-0 flex-1 flex-col ${featured ? "p-6 sm:p-8" : "p-5"}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold uppercase tracking-wide text-slate-600">
          <span className="text-red-700">{article.tags.includes("opinion") ? "Commentary" : "Reporting"}</span><span>{scopeLabel(article)}</span>
          <time dateTime={article.publishedAt}>{dateLabel(article.publishedAt)}</time>
        </div>
        <h2 className={`mt-3 font-bold leading-tight tracking-tight text-blue-950 ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
          <Link href={`/news/${article.id}`} className="hover:text-red-700 focus-visible:outline-2 focus-visible:outline-blue-700">{article.title}</Link>
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-700">{article.summary}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5 text-xs font-semibold text-slate-500"><span>{article.author || "RepWatchr"}</span><span>{sources} public {sources === 1 ? "source" : "sources"}</span></div>
      </div>
    </article>
  );
}

export default async function BlogPage() {
  const articles = await getPublicArticleCatalog();
  const [lead, ...rest] = articles;
  const structured = {
    "@context": "https://schema.org", "@type": "Blog", name: "RepWatchr Blog", url: absoluteRepWatchrUrl("/blog"),
    description: "Sourced political reporting and clearly labeled commentary from East Texas to Washington.",
    publisher: { "@type": "Organization", name: "RepWatchr", url: absoluteRepWatchrUrl("/") },
    blogPost: articles.slice(0, 12).map((article) => ({
      "@type": "BlogPosting", headline: article.title, description: article.summary, datePublished: article.publishedAt,
      url: absoluteRepWatchrUrl(`/news/${article.id}`), image: buildOgImageUrl("news", { id: article.id }),
      author: { "@type": article.author === "Ryan Nichols" ? "Person" : "Organization", name: article.author || "RepWatchr" },
    })),
  };
  return (
    <main className="min-h-screen bg-[#f5f7fa] pb-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <div className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">The RepWatchr desk</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-blue-950 sm:text-6xl">Power answers to the public.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">Start with the record. Follow the money. Ask the questions elected officials should be able to answer. Reporting from Harleton and East Texas to Washington.</p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">An independent, America First editorial perspective. Opinion is labeled. Factual claims need sources, and corrections stay visible.</p>
        <nav aria-label="Reporting topics" className="mt-7 flex flex-wrap gap-2">{[["All reporting", "/news"], ["East Texas", "/news?scope=east-texas"], ["Texas", "/news?scope=texas"], ["National", "/news?scope=national"], ["School boards", "/school-boards"], ["RSS feed", "/rss.xml"]].map(([label, href]) => <Link key={href} href={href} className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-950 hover:border-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700">{label}</Link>)}</nav>
      </div></div>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {lead ? <ArticleCard article={lead} featured /> : <div className="rounded-2xl border border-slate-200 bg-white p-8"><h2 className="text-2xl font-bold text-blue-950">The next report is being prepared.</h2><p className="mt-3 text-slate-700">Explore official profiles and public records while the desk checks its sources.</p><Link href="/officials" className="mt-4 inline-block font-semibold text-blue-800 underline">Find an official</Link></div>}
        {rest.length > 0 && <section aria-label="Latest reporting" className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rest.slice(0, 12).map((article) => <ArticleCard key={article.id} article={article} />)}</section>}
        <section className="mt-10 grid gap-6 rounded-2xl bg-blue-950 p-6 text-white sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div><h2 className="text-2xl font-bold">Bring the public record.</h2><p className="mt-3 max-w-2xl leading-7 text-blue-100">A meeting agenda. A recorded vote. A budget. A filing. If something is missing or wrong, send the source so the record can be corrected.</p></div>
          <Link href="/submit-source" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-5 py-3 font-bold text-blue-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Submit a source or correction</Link>
        </section>
        <div className="mt-6 flex flex-wrap justify-between gap-4 text-sm text-slate-600"><Link href="/news" className="font-semibold text-blue-900 underline">Browse the full archive</Link><Link href="/methodology" className="font-semibold text-blue-900 underline">How we handle sources and corrections</Link></div>
      </div>
    </main>
  );
}
