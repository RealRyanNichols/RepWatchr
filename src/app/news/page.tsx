import type { Metadata } from "next";
import Link from "next/link";
import { getAllNews, getOfficialById } from "@/lib/data";

export const metadata: Metadata = {
  title: "News",
  description:
    "Breaking news, investigations, and updates about elected officials in Texas.",
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

export default function NewsPage() {
  const articles = getAllNews();
  const featured = articles.filter((a) => a.featured);
  const rest = articles.filter((a) => !a.featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">News & Reports</h1>
        <p className="mt-2 text-gray-500">
          Breaking news, investigations, and accountability reports on Texas
          elected officials.
        </p>
      </div>

      {/* Featured Articles */}
      {featured.length > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4">
            Featured
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((article) => {
              const linkedOfficials = article.officialIds
                .map((id) => getOfficialById(id))
                .filter(Boolean);

              return (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="group block rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tagColors[tag] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {article.title}
                    </h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">
                      {article.summary}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(article.publishedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}{" "}
                        &middot; {article.author}
                      </span>
                    </div>
                    {linkedOfficials.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {linkedOfficials.map((o) => (
                          <span
                            key={o!.id}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                          >
                            {o!.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {articles.length === 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700">
            Source review active
          </p>
          <h2 className="mt-2 text-2xl font-black text-gray-950">
            No reports are public until source review is complete.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-700">
            RepWatchr will not publish a bill, vote count, savings estimate,
            red flag, praise report, or article unless the exact public source
            supports the exact claim. Drafts stay hidden until reviewed.
          </p>
        </section>
      )}

      {/* All Articles */}
      {articles.length > 0 && <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          All Articles
        </h2>
        <div className="space-y-4">
          {(rest.length > 0 ? rest : articles).map((article) => {
            const linkedOfficials = article.officialIds
              .map((id) => getOfficialById(id))
              .filter(Boolean);

            return (
              <Link
                key={article.id}
                href={`/news/${article.id}`}
                className="group flex gap-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tagColors[tag] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                    <span>&middot;</span>
                    <span>{article.author}</span>
                    {linkedOfficials.length > 0 && (
                      <>
                        <span>&middot;</span>
                        <span>
                          {linkedOfficials.map((o) => o!.name).join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>}
    </div>
  );
}
