import type { Metadata } from "next";
import Link from "next/link";
import DataProductInterestForm from "@/components/data/DataProductInterestForm";
import {
  REPWATCHR_DATA_GUARDRAILS,
  getRepWatchrDataProducts,
  getRepWatchrFeedbackMechanisms,
} from "@/data/repwatchr-data-products";
import { getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";

export const metadata: Metadata = {
  title: "Political Data Reports and Licensing",
  description:
    "RepWatchr political data reports: verified civic feedback, official profiles, source trails, vote reactions, campaign research, and licensing.",
  alternates: {
    canonical: "https://www.repwatchr.com/data-reports",
  },
  openGraph: {
    title: "RepWatchr Political Data Reports and Licensing",
    description:
      "Aggregate political intelligence from public records, verified civic feedback, source trails, votes, funding, and profile claims.",
    url: "https://www.repwatchr.com/data-reports",
    siteName: "RepWatchr",
    type: "website",
    images: [
      {
        url: "/images/repwatchr-cover-america-first.png",
        width: 2172,
        height: 724,
        alt: "RepWatchr political data reports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWatchr Political Data Reports and Licensing",
    description:
      "Source-backed political data reports with verified feedback, constituency splits, and clear privacy guardrails.",
    images: ["/images/repwatchr-cover-america-first.png"],
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function DataReportsPage() {
  const dataReports = getRepWatchrDataProducts();
  const mechanisms = getRepWatchrFeedbackMechanisms();
  const dataStats = getRepWatchrDataStats();
  const schoolBoardStats = getSchoolBoardStats();
  const profileTotal = dataStats.nonSchoolOfficialFiles + schoolBoardStats.candidates + dataStats.publicPowerProfiles;
  const sourceTotal = dataStats.publicSourceUrls + schoolBoardStats.sourceCount;

  const stats = [
    {
      label: "Public profiles",
      value: formatNumber(profileTotal),
      note: "officials, school-board candidates, and public-power profiles",
    },
    {
      label: "Source URLs",
      value: formatNumber(sourceTotal),
      note: "public links attached to records, stories, rosters, funding, and votes",
    },
    {
      label: "Vote rows",
      value: formatNumber(dataStats.publicVoteRecordRows + dataStats.scoredVoteRows),
      note: "roll-call and scorecard rows available for signal building",
    },
    {
      label: "Funding files",
      value: formatNumber(dataStats.fundingSummaries),
      note: "campaign-finance summaries loaded where available",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "RepWatchr political data reports and licensing",
    url: "https://www.repwatchr.com/data-reports",
    description:
      "Source-backed political intelligence built from public profiles, public records, verified civic feedback, voting records, funding summaries, and source submissions.",
    creator: {
      "@type": "Organization",
      name: "RepWatchr",
      url: "https://www.repwatchr.com",
    },
    keywords: [
      "political data",
      "civic sentiment",
      "voting records",
      "campaign finance",
      "public officials",
      "constituent feedback",
      "data licensing",
    ],
    variableMeasured: [
      "approval",
      "vote-again intent",
      "issue sentiment",
      "left-right leaning",
      "source confidence",
      "profile completeness",
      "funding trails",
    ],
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="h-2 bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_31%,#d6b35a_31%,#d6b35a_42%,#ffffff_42%,#ffffff_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
          <div className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
            <div>
              <p className="inline-flex rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                Political data engine
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
                RepWatchr can monetize the record without turning into an ad wall.
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                The business is bigger than page views. RepWatchr can sell aggregate political intelligence,
                custom research, verified constituent panels, profile-claim tools, and source-backed reports while
                keeping public records and methodology attached.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="#data-interest"
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
                >
                  Request Data Access
                </Link>
                <Link
                  href="/profiles/claim"
                  className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
                >
                  Claim a Profile
                </Link>
                <Link
                  href="/methodology"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-400"
                >
                  Read Methodology
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">
                  Core rule
                </p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
                  Sell aggregate intelligence. Do not sell raw private identity data.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                  Verified feedback can be valuable because it separates constituent, district, state, outsider,
                  supporter, opponent, donor, volunteer, and claimed-profile signals. That does not require exposing
                  private documents on public pages.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-black text-blue-950">{stat.value}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{stat.label}</p>
                    <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{stat.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {dataReports.map((product) => (
            <article key={product.slug} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                {product.eyebrow}
              </span>
              <h2 className="mt-4 text-2xl font-black leading-tight text-blue-950">{product.name}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{product.summary}</p>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-amber-900">Buyer</p>
                <p className="mt-1 text-sm font-bold leading-6 text-amber-950">{product.buyer}</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {product.deliverables.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm font-bold leading-6 text-blue-950">
                {product.guardrail}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm lg:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Question mechanisms</p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
            Turn political attention into structured signals.
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {mechanisms.map((mechanism) => (
              <article key={mechanism.name} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                <h3 className="text-lg font-black text-blue-950">{mechanism.name}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{mechanism.question}</p>
                <p className="mt-3 text-xs font-black uppercase tracking-wide text-red-700">Signal</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">{mechanism.signal}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
              Trust guardrails
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
              The data only sells long term if people trust the rules.
            </h2>
            <div className="mt-5 grid gap-2">
              {REPWATCHR_DATA_GUARDRAILS.map((guardrail) => (
                <div key={guardrail} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-800">
                  {guardrail}
                </div>
              ))}
            </div>
          </div>
          <div id="data-interest">
            <DataProductInterestForm />
          </div>
        </section>
      </main>
    </div>
  );
}
