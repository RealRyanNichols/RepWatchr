import type { Metadata } from "next";
import Link from "next/link";
import PredictiveSearchBox from "@/components/shared/PredictiveSearchBox";

export const metadata: Metadata = {
  title: "Search RepWatchr | Officials, Votes, Funding, Boards",
  description: "Search RepWatchr for public officials, school boards, counties, agencies, stories, issues, votes, funding, campaigns, and source-backed records.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Search RepWatchr",
    description: "Predictive search for officials, boards, votes, funding, campaigns, stories, and public records.",
    url: "/search",
    type: "website",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; search?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const query = (params?.q ?? params?.search ?? "").trim();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-blue-100 bg-gradient-to-b from-white to-blue-50/70">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-700">RepWatchr Search</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-blue-950 sm:text-5xl">
                Find the official, vote, money trail, story, or missing source.
              </h1>
              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
                Predictive search now opens every public lane: officials, boards, counties, agencies, issues, votes,
                funding, campaigns, news, recent searches, saved searches, and shareable search links.
              </p>
            </div>
            <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-xl shadow-blue-950/10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-900">Your next useful move</p>
              <p className="mt-2 text-sm font-semibold text-gray-600">
                Search once, save the lane, share the clean link, or submit the missing source.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <PredictiveSearchBox
              defaultQuery={query}
              autoFocus
              sourceSurface="search_page"
              placeholder="Type a name, county, issue, donor, vote, agency, race, school board, or source..."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {[
          { title: "Open officials", href: "/officials", text: "Search by office, state, party, score, source count, and missing data." },
          { title: "Compare votes", href: "/votes", text: "Open roll calls, issue tags, source links, and score impact." },
          { title: "Track funding", href: "/funding", text: "Follow donors, PACs, vendors, and campaign finance source lanes." },
          { title: "Submit a source", href: "/submit-source", text: "Send the public record RepWatchr should verify next." },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-950/10 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <p className="text-lg font-black text-blue-950">{card.title}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">{card.text}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
