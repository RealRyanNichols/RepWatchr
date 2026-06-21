import type { Metadata } from "next";
import Link from "next/link";
import { getRepWatchrDataStats } from "@/lib/data";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, datasetJsonLd, jsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "Data Reports",
  description:
    "RepWatchr data coverage, source inventory, and public-record buildout status for officials, votes, funding, news, and review overlays.",
  path: "/data-reports",
  imagePath: buildOgImageUrl("methodology"),
  imageAlt: "RepWatchr data reports preview",
});

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

export default function DataReportsPage() {
  const stats = getRepWatchrDataStats();
  const texasLegislators = stats.texasHouseProfilesLoaded + stats.texasSenateProfilesLoaded;
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Data Reports", path: "/data-reports" },
  ]);
  const datasetStructuredData = datasetJsonLd({
    name: "RepWatchr public data coverage report",
    path: "/data-reports",
    description:
      "RepWatchr data coverage, source inventory, and public-record buildout status for officials, votes, funding, news, and review overlays.",
    keywords: ["RepWatchr", "public records", "data coverage", "officials", "votes", "funding"],
  });

  return (
    <main className="rw-page-shell text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(datasetStructuredData) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-300 bg-slate-950 p-5 text-white shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
            Data coverage
          </p>
          <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
            What RepWatchr has loaded, and what still needs source review.
          </h1>
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
            This page is a public buildout report. Missing source data is shown as a gap, not as a clean record, zero
            dollars, or a neutral score.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/buildout"
              className="rounded-lg bg-[#d5aa3f] px-4 py-2 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#f0c75f]"
            >
              Open buildout dashboard
            </Link>
            <Link
              href="/submit-source"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
            >
              Submit a source
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Official profiles"
            value={formatNumber(stats.officialFiles)}
            detail={`${formatNumber(stats.officialsWithSourceLinks)} have public source links.`}
          />
          <StatCard
            label="Texas legislature"
            value={formatNumber(texasLegislators)}
            detail={`${formatNumber(stats.texasHouseProfilesLoaded)} House and ${formatNumber(stats.texasSenateProfilesLoaded)} Senate profiles.`}
          />
          <StatCard
            label="Public vote records"
            value={formatNumber(stats.publicVoteRecords)}
            detail={`${formatNumber(stats.publicVoteRecordRows)} roll-call rows loaded.`}
          />
          <StatCard
            label="Source URLs"
            value={formatNumber(stats.publicSourceUrls)}
            detail="Official, vote, funding, news, and public-record links in the static data set."
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Public-record layers
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatCard
                label="Funding summaries"
                value={formatNumber(stats.fundingSummaries)}
                detail={`${formatNumber(stats.officialsWithFundingSummaries)} officials have matched funding files.`}
              />
              <StatCard
                label="Red-flag items"
                value={formatNumber(stats.redFlagItems)}
                detail={`${formatNumber(stats.officialsWithRedFlags)} officials have source-linked review items.`}
              />
              <StatCard
                label="News articles"
                value={formatNumber(stats.newsArticles)}
                detail={`${formatNumber(stats.featuredNewsArticles)} featured stories are published.`}
              />
              <StatCard
                label="Trading rows"
                value={formatNumber(stats.congressTradingRowsParsed)}
                detail={`${formatNumber(stats.congressTradingCurrentProfilesWithRows)} current profiles have disclosure rows.`}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">
              Texas launch checklist
            </p>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
              <p>
                Texas federal profiles loaded:{" "}
                <span className="font-black text-slate-950">
                  {formatNumber(
                    stats.federalHouseProfilesLoaded + stats.federalSenateProfilesLoaded,
                  )}
                </span>
              </p>
              <p>
                Texas House coverage:{" "}
                <span className="font-black text-slate-950">
                  {formatNumber(stats.texasHouseProfilesLoaded)} / {formatNumber(stats.texasHouseExpectedSeats)}
                </span>
              </p>
              <p>
                Texas Senate coverage:{" "}
                <span className="font-black text-slate-950">
                  {formatNumber(stats.texasSenateProfilesLoaded)} / {formatNumber(stats.texasSenateExpectedSeats)}
                </span>
              </p>
              <p>
                State legislative vote snapshots:{" "}
                <span className="font-black text-slate-950">
                  {formatNumber(stats.stateLegislatorProfilesWithVoteRecords)}
                </span>
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/officials?state=TX"
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-900 transition hover:bg-white"
              >
                Open Texas officials
              </Link>
              <Link
                href="/state-reps"
                className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-900 transition hover:bg-white"
              >
                Open state reps
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
