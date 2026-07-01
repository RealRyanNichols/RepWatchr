import type { Metadata } from "next";
import Link from "next/link";
import GrowthQuestionIntakeForm from "@/components/growth/GrowthQuestionIntakeForm";
import {
  GROWTH_ENGINE_GUARDRAILS,
  getGrowthEngineSteps,
  getGrowthRevenueLanes,
  getPredictionSignals,
  getStoryOpportunityLanes,
} from "@/data/repwatchr-growth-engine";
import { getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";

export const metadata: Metadata = {
  title: "Growth Engine and Prediction Desk",
  description:
    "RepWatchr growth engine for question intake, source review, forecasts, story opportunities, graphics, data reports, and public-record accountability loops.",
  alternates: {
    canonical: "https://www.repwatchr.com/growth-engine",
  },
  openGraph: {
    title: "RepWatchr Growth Engine",
    description:
      "Question intake, source review, forecasts, story queues, graphics, and data reports built around public records first.",
    url: "https://www.repwatchr.com/growth-engine",
    siteName: "RepWatchr",
    type: "website",
    images: [
      {
        url: "/images/repwatchr-cover-america-first.png",
        width: 2172,
        height: 724,
        alt: "RepWatchr growth engine and prediction desk",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWatchr Growth Engine",
    description:
      "Turn questions into sources, forecasts, stories, visuals, and aggregate civic data without publishing unsupported claims.",
    images: ["/images/repwatchr-cover-america-first.png"],
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function GrowthEnginePage() {
  const dataStats = getRepWatchrDataStats();
  const schoolBoardStats = getSchoolBoardStats();
  const steps = getGrowthEngineSteps();
  const predictionSignals = getPredictionSignals();
  const storyLanes = getStoryOpportunityLanes();
  const revenueLanes = getGrowthRevenueLanes();
  const sourceTotal = dataStats.publicSourceUrls + schoolBoardStats.sourceCount;
  const profileTotal = dataStats.nonSchoolOfficialFiles + schoolBoardStats.candidates + dataStats.publicPowerProfiles;
  const voteRows = dataStats.publicVoteRecordRows + dataStats.scoredVoteRows;

  const stats = [
    { label: "Profiles to enrich", value: profileTotal, tone: "bg-blue-600" },
    { label: "Source URLs to read", value: sourceTotal, tone: "bg-red-700" },
    { label: "Vote rows to score", value: voteRows, tone: "bg-amber-500" },
    { label: "Story records loaded", value: dataStats.newsArticles, tone: "bg-slate-950" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "RepWatchr Growth Engine",
    url: "https://www.repwatchr.com/growth-engine",
    description:
      "A source-first growth system for question intake, public-record review, forecasts, story opportunities, graphics, and aggregate civic data reports.",
    publisher: {
      "@type": "Organization",
      name: "RepWatchr",
      url: "https://www.repwatchr.com",
    },
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="h-2 bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_31%,#d6b35a_31%,#d6b35a_42%,#ffffff_42%,#ffffff_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
          <div className="grid gap-8 p-6 lg:grid-cols-[1fr_0.95fr] lg:p-8">
            <div>
              <p className="inline-flex rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                RepWatchr growth engine
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-normal text-blue-950 sm:text-6xl">
                Turn public questions into sources, forecasts, stories, graphics, and data reports.
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                The self-growing loop is simple: users ask a public-record question, RepWatchr attaches sources,
                the system creates forecast/story/graphic tasks, admins review the proof, and the output feeds better
                profiles, better share cards, paid reports, and aggregate civic data.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="#growth-intake"
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
                >
                  Submit a growth question
                </Link>
                <Link
                  href="/data-reports"
                  className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
                >
                  Data reports
                </Link>
                <Link
                  href="/submit-source"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-400"
                >
                  Submit source
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">Current data surface</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-2xl font-black text-blue-950">{formatNumber(stat.value)}</p>
                      <span className={`h-3 w-12 rounded-full ${stat.tone}`} />
                    </div>
                    <p className="mt-2 text-xs font-black uppercase tracking-wide text-slate-600">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-900">Prediction rule</p>
                <p className="mt-2 text-sm font-bold leading-6 text-amber-950">
                  RepWatchr can forecast pressure, story likelihood, issue salience, and profile value, but every
                  forecast must show confidence, source gaps, and a public resolution rule.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Operating loop</p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
            The hook travels. The receipt stays attached.
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-blue-950 px-2.5 py-1 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-red-700">
                    {step.eyebrow}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-black leading-tight text-blue-950">{step.name}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{step.summary}</p>
                <p className="mt-3 rounded-lg bg-white p-3 text-xs font-bold leading-5 text-slate-600">
                  <span className="font-black text-blue-950">Output:</span> {step.output}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div id="growth-intake">
            <GrowthQuestionIntakeForm />
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">Predictive desk</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
              What RepWatchr can predict without pretending it knows more than the record.
            </h2>
            <div className="mt-4 grid gap-3">
              {predictionSignals.map((signal) => (
                <article key={signal.name} className="rounded-lg border border-blue-100 bg-white p-4">
                  <h3 className="text-lg font-black text-blue-950">{signal.name}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    <span className="font-black text-red-700">Input:</span> {signal.input}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                    <span className="font-black text-blue-900">Forecast:</span> {signal.forecast}
                  </p>
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">
                    {signal.resolutionRule}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Story and graphics</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
              Every blog, race hub, school board, and profile needs a visual loop.
            </h2>
            <div className="mt-4 grid gap-3">
              {storyLanes.map((lane) => (
                <article key={lane.name} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-black text-blue-950">{lane.name}</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{lane.trigger}</p>
                  <p className="mt-3 rounded-lg border border-blue-100 bg-white p-3 text-sm font-semibold leading-6 text-slate-600">
                    {lane.visual}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Sustainable revenue</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
              Monetize data and work product without turning RepWatchr into an ad farm.
            </h2>
            <div className="mt-4 grid gap-3">
              {revenueLanes.map((lane) => (
                <article key={lane.name} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-blue-950">{lane.name}</h3>
                    <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                      {lane.product}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    <span className="font-black text-red-700">Buyer:</span> {lane.buyer}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                    <span className="font-black text-blue-900">Signal:</span> {lane.signal}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-red-200 bg-white p-5 shadow-sm lg:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Hard guardrails</p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
            Growth only works if the proof survives a hostile read.
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {GROWTH_ENGINE_GUARDRAILS.map((guardrail) => (
              <div key={guardrail} className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-red-950">
                {guardrail}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
