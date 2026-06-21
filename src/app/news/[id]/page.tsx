import type { Metadata } from "next";
import Link from "next/link";
import { getAllNews, getNewsById, getOfficialById } from "@/lib/data";
import CopySnippetButton from "@/components/shared/CopySnippetButton";
import RouteEventTracker from "@/components/shared/RouteEventTracker";
import ShareButtons from "@/components/shared/ShareButtons";
import ReportButton from "@/components/shared/ReportButton";
import NextUsefulMove from "@/components/shared/NextUsefulMove";
import TrustLabel from "@/components/shared/TrustLabel";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, jsonLd, newsArticleJsonLd } from "@/lib/structured-data";

export async function generateStaticParams() {
  const articles = getAllNews();
  return articles.map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = getNewsById(id);
  if (!article) return { title: "Article Not Found" };
  return buildRepWatchrMetadata({
    title: article.title,
    description: article.summary,
    path: `/news/${article.id}`,
    imagePath: buildOgImageUrl("news", { id: article.id }),
    imageAlt: `${article.title} RepWatchr story preview`,
    type: "article",
    publishedTime: article.publishedAt,
    authors: [article.author],
  });
}

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

const scopeLabels: Record<string, string> = {
  "east-texas": "East Texas",
  texas: "Texas",
  national: "United States",
};

const channelLabels: Record<string, string> = {
  attorneys: "Attorneys",
  courts: "Courts",
  elections: "Elections",
  media: "Media",
  money: "Money",
  officials: "Officials",
  "public-safety": "Public safety",
  "school-boards": "School boards",
};

function articlePostSnippet(article: NonNullable<ReturnType<typeof getNewsById>>) {
  const receipt = article.sourceUrl
    ? articleSourceLine(article)
    : "Source review needed before amplification.";

  return [
    `RepWatchr story: ${article.title}`,
    "",
    `Why it matters: ${article.summary}`,
    "",
    `Receipt: ${receipt}`,
    "",
    `Source file: https://www.repwatchr.com/news/${article.id}`,
  ].join("\n");
}

function articleSourceLine(article: NonNullable<ReturnType<typeof getNewsById>>) {
  if (article.sourceUrl && article.sourceName) return `Source: ${article.sourceName}`;
  if (article.sourceName) return `Source named: ${article.sourceName}`;
  return "Source status: needs review";
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = getNewsById(id);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Article Not Found
        </h1>
        <Link href="/news" className="mt-4 text-blue-600 hover:underline">
          Back to News
        </Link>
      </div>
    );
  }

  const linkedOfficials = article.officialIds
    .map((officialId) => getOfficialById(officialId))
    .filter(Boolean);
  const postSnippet = articlePostSnippet(article);
  const sourceStructuredLinks = article.sourceLinks?.length
    ? article.sourceLinks
    : article.sourceUrl
      ? [{ title: article.sourceName ?? "Public source", url: article.sourceUrl }]
      : undefined;
  const articleStructuredData = newsArticleJsonLd({
    headline: article.title,
    description: article.summary,
    path: `/news/${article.id}`,
    datePublished: article.publishedAt,
    authorName: article.author,
    image: buildOgImageUrl("news", { id: article.id }),
    sourceLinks: sourceStructuredLinks,
    about: linkedOfficials.map((official) => ({
      name: official!.name,
      path: `/officials/${official!.id}`,
      jobTitle: official!.position,
    })),
  });
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "News", path: "/news" },
    { name: article.title, path: `/news/${article.id}` },
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <RouteEventTracker eventName="article_open" metadata={{ article_id: article.id, source_status: article.sourceStatus }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }}
      />
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        &larr; Back to News
      </Link>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {article.scope ? (
          <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {scopeLabels[article.scope] ?? article.scope}
          </span>
        ) : null}
        {article.locationLabel ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
            {article.locationLabel}
          </span>
        ) : null}
        {article.tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${tagColors[tag] ?? "bg-gray-100 text-gray-600"}`}
          >
            {tag}
          </span>
        ))}
      </div>

      {article.powerChannels?.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {article.powerChannels.map((channel) => (
            <span
              key={channel}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700"
            >
              {channelLabels[channel] ?? channel}
            </span>
          ))}
        </div>
      ) : null}

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
        {article.title}
      </h1>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span>{article.author}</span>
        <span>&middot;</span>
        <span>
          {new Date(article.publishedAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        {article.sourceName && (
          <>
            <span>&middot;</span>
            {article.sourceUrl ? (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Source: {article.sourceName}
              </a>
            ) : (
              <span>Source: {article.sourceName}</span>
            )}
          </>
        )}
        {article.sourceStatus === "source_linked" ? (
          <>
            <span>&middot;</span>
            <TrustLabel id="confirmed_public_record" />
          </>
        ) : !article.sourceUrl ? (
          <>
            <span>&middot;</span>
            <TrustLabel id="needs_source" />
          </>
        ) : null}
      </div>

      {(article.counties?.length || article.cities?.length || article.state) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {article.state ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-900">
              {article.state}
            </span>
          ) : null}
          {(article.counties ?? []).map((county) => (
            <span key={county} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
              {county} County
            </span>
          ))}
          {(article.cities ?? []).map((city) => (
            <span key={city} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
              {city}
            </span>
          ))}
        </div>
      ) : null}

      {/* Share */}
      <div className="mt-4">
        <ShareButtons
          title={article.title}
          description={article.summary}
          path={`/news/${article.id}`}
          template={article.sourceStatus === "needs_source_review" ? "missing_source" : "confirmed_record"}
          subject={article.title}
          sourceLabel={article.sourceName || article.sourceLinks?.[0]?.title || "linked public sources"}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <NextUsefulMove
          recordPath={`/dashboard?watch=${encodeURIComponent(`/news/${article.id}`)}&target=${encodeURIComponent(article.title)}`}
          sourcePath={`/submit-source?target=${encodeURIComponent(article.id)}`}
          packetPath={`/free-packet?target=${encodeURIComponent(article.title)}`}
          safeShareLine={`RepWatchr story: ${article.title}. Read the receipt and source status before sharing a stronger claim.`}
          meetingQuestion="What public source confirms this story, and what record is still missing?"
        />
        <ReportButton
          pageUrl={`/news/${article.id}`}
          targetLabel={article.title}
          jurisdiction={article.locationLabel || article.state || article.scope}
        />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-300 bg-slate-50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
          Source file
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">
          This page is for the story, the receipt, and the next record to check.
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-800">Story</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
              {article.title}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-800">Receipt</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
              {articleSourceLine(article)}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-800">Follow-up</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
              Review linked profiles, source links, or missing public records.
            </p>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">
              Social snippet
            </p>
            <CopySnippetButton text={postSnippet} />
          </div>
          <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-slate-800">
            {postSnippet}
          </p>
        </div>
      </section>

      {/* Summary */}
      <p className="mt-8 text-lg text-gray-700 font-medium leading-relaxed border-l-4 border-blue-500 pl-4">
        {article.summary}
      </p>

      {/* Content */}
      <div className="mt-8 prose prose-gray max-w-none">
        {article.content.split("\n\n").map((paragraph, i) => (
          <p key={i} className="text-gray-700 leading-relaxed mb-4">
            {paragraph}
          </p>
        ))}
      </div>

      {article.sourceLinks?.length ? (
        <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Source Packet
          </h2>
          <div className="mt-4 grid gap-3">
            {article.sourceLinks.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-blue-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                {source.title}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* Linked Officials */}
      {linkedOfficials.length > 0 && (
        <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Officials Mentioned
          </h2>
          <div className="flex flex-wrap gap-3">
            {linkedOfficials.map((official) => (
              <Link
                key={official!.id}
                href={`/officials/${official!.id}`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {official!.firstName[0]}
                  {official!.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {official!.name}
                  </p>
                  <p className="text-xs text-gray-500">{official!.position}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <section className="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900">
          Open connected records
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/news" className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-800 transition hover:border-red-300 hover:text-red-700">
            More RepWatchr stories
          </Link>
          <Link href="/submit-source" className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-800 transition hover:border-red-300 hover:text-red-700">
            Submit a better source
          </Link>
          <Link href="/methodology" className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-800 transition hover:border-red-300 hover:text-red-700">
            Review the source rules
          </Link>
          <Link href="/funding" className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-800 transition hover:border-red-300 hover:text-red-700">
            Check funding trails
          </Link>
        </div>
      </section>
    </div>
  );
}
