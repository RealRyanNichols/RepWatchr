import type { Metadata } from "next";
import Link from "next/link";
import MoneyTrailAnalytics from "@/components/money/MoneyTrailAnalytics";
import ShareButtons from "@/components/shared/ShareButtons";
import {
  getAllCommitteeRecords,
  getAllDonorEntities,
  getAllFinanceRecords,
  getAllMoneyTrailDossiers,
} from "@/lib/money-trail";
import { formatCurrency } from "@/lib/formatting";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, datasetJsonLd, jsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  ...buildRepWatchrMetadata({
    title: "Money Trail | RepWatchr",
    description: "Source-backed campaign finance, committee, donor, and public vendor records without unsupported claims.",
    path: "/money",
    imagePath: buildOgImageUrl("funding"),
    imageAlt: "RepWatchr money trail social preview",
  }),
};

export default function MoneyTrailPage() {
  const dossiers = getAllMoneyTrailDossiers();
  const records = getAllFinanceRecords();
  const committees = getAllCommitteeRecords();
  const donors = getAllDonorEntities();
  const totalRaised = dossiers.reduce((sum, trail) => sum + (trail.totalAmount ?? 0), 0);
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Money Trail", path: "/money" },
  ]);
  const datasetStructuredData = datasetJsonLd({
    name: "RepWatchr money trail",
    path: "/money",
    description: "Campaign finance records, filing sources, donor/source aggregates, committees, and source gaps.",
    keywords: ["campaign finance", "money trail", "public filings", "donors", "committees"],
  });

  return (
    <main className="rw-page-shell">
      <MoneyTrailAnalytics
        entityId="money-index"
        entityType="money"
        recordCount={records.length}
        sourceCount={committees.length + donors.length}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(datasetStructuredData) }} />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Money trail</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">Campaign finance records without the spin.</h1>
          <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-700">
            RepWatchr tracks public filings, committees, donor/source aggregates, source gaps, and future public vendor records.
            A contribution or expenditure is context, not proof of wrongdoing by itself.
          </p>
          <div className="mt-5">
            <ShareButtons
              title="RepWatchr Money Trail"
              description="Source-backed campaign finance and public money records. Open the filing before making stronger claims."
              path="/money"
              template="funding_trail"
              subject="RepWatchr money trail"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Profiles with source paths" value={dossiers.length.toLocaleString()} />
          <Metric label="Finance records" value={records.length.toLocaleString()} />
          <Metric label="Committees / filing sources" value={committees.length.toLocaleString()} />
          <Metric label="Reported total raised" value={formatCurrency(totalRaised)} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["Candidates with funding", "/officials?funding=1"],
            ["Most sourced officials", "/officials?sort=most-sourced"],
            ["Missing finance sources", "/officials?missingSources=1&funding=0"],
            ["Race finance gaps", "/elections/texas"],
            ["Submit finance source", "/submit-source?type=funding_record"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              data-finance-filter={label}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-800"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Officials</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Loaded campaign finance profiles</h2>
              </div>
              <Link href="/funding" className="mini-button">Funding index</Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {dossiers.slice(0, 12).map((trail) => (
                <Link key={trail.official.id} href={`/funding/${trail.official.id}`} data-finance-record="official_money_profile" className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50">
                  <p className="text-lg font-black text-blue-950">{trail.official.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{trail.official.position}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                    <span>{trail.cycles[0] ?? "cycle needed"}</span>
                    <span>{trail.totalRecords} rows</span>
                    <span>{trail.sourceCount} sources</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-amber-800">Language rule</p>
              <h2 className="mt-1 text-xl font-black text-amber-950">Do not overstate the money.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
                Campaign finance records show public filings. RepWatchr does not imply wrongdoing from a contribution or expenditure by itself.
              </p>
              <Link href="/methodology" className="mini-button mt-4 bg-white">Open methodology</Link>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">Top donor/source aggregates</p>
              <div className="mt-3 space-y-2">
                {donors.slice(0, 8).map((donor) => (
                  <Link key={donor.slug} href={`/money/donors/${donor.slug}`} data-finance-source={donor.name} className="block rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-blue-300">
                    <p className="font-black text-slate-950">{donor.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatCurrency(donor.totalAmount)} / {donor.recordCount} public filing row{donor.recordCount === 1 ? "" : "s"}</p>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-blue-800">Need a deeper review?</p>
          <h2 className="mt-1 text-2xl font-black text-blue-950">Turn filings into a source packet.</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["Campaign Finance Tracker", "/services/official-record-brief"],
              ["Local Race Source Pack", "/services/local-race-source-pack"],
              ["Election Watch Desk", "/services/election-watch-desk"],
              ["Submit a finance source", "/submit-source?type=funding_record"],
            ].map(([label, href]) => (
              <Link key={label} href={href} data-money-package={label} className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-900 hover:border-red-300">
                {label}
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
    </div>
  );
}
