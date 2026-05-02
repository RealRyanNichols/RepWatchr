import type { Metadata } from "next";
import Link from "next/link";
import { getAllNews, getNewsById, getOfficialById } from "@/lib/data";
import ShareButtons from "@/components/shared/ShareButtons";

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
  return {
    title: article.title,
    description: article.summary,
  };
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
            <span className="font-bold text-emerald-700">Source linked</span>
          </>
        ) : !article.sourceUrl ? (
          <>
            <span>&middot;</span>
            <span className="font-bold text-red-700">Needs source review</span>
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
        />
      </div>

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
    </div>
  );
}
