import type { Metadata } from "next";
import Link from "next/link";
import PartnerInterestForm from "@/components/investors/PartnerInterestForm";
import { getAllNews, getAllOfficials, getRepWatchrDataStats } from "@/lib/data";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "RepWatchr Investors and Partners",
  description:
    "RepWatchr is building public-record infrastructure for civic accountability, source trails, watchlists, packets, dashboards, and data workflows.",
  path: "/investors",
  imagePath: buildOgImageUrl("services", { slug: "investors" }),
  imageAlt: "RepWatchr investor and partner preview",
});

const problemPoints = [
  "Public records are scattered across official sites, filings, agendas, videos, PDFs, and local pages.",
  "Local offices are hard to track, especially school boards, county offices, agencies, courts, and races.",
  "Officials, agencies, races, boards, and votes are fragmented when citizens need one source trail.",
  "Citizens need source-backed tools, not outrage.",
  "Organizations need dashboards, alerts, structured data, and a clear record of what changed.",
];

const productPoints = [
  "Official and public-power profiles",
  "Source trails and correction history",
  "Watchlists for officials, races, jurisdictions, school boards, and issues",
  "Free source packet builder",
  "Public-records request tools",
  "Member and admin dashboards",
  "Safe public questions",
  "Usage analytics and demand signals",
  "Public data import and health workflows",
];

const revenuePaths = [
  "Memberships",
  "Research packets",
  "Election Watch Desk",
  "County Monitor",
  "School Board Monitor",
  "Journalist dashboard",
  "Organization dashboard",
  "Public Data API",
  "Enterprise subscriptions",
  "Aggregate non-identifying reports",
];

const trustStandards = [
  "Source labels",
  "Correction workflow",
  "Privacy rules",
  "No doxxing",
  "No unsourced accusations",
  "No private political-interest profile sales",
  "Sponsored civic education must be clearly labeled if added later",
];

export default function InvestorsPage() {
  const stats = getRepWatchrDataStats();
  const officials = getAllOfficials();
  const stories = getAllNews();

  const currentAssets = [
    {
      label: "Public profiles",
      value: officials.length.toLocaleString(),
      detail: "Loaded officials and public-power profile records in the current data layer.",
    },
    {
      label: "Source URLs",
      value: stats.publicSourceUrls.toLocaleString(),
      detail: "Unique loaded public URLs across profiles, stories, school boards, issues, and record pages.",
    },
    {
      label: "Story records",
      value: stories.length.toLocaleString(),
      detail: "Source-linked articles and civic record explainers in the content system.",
    },
    {
      label: "Submissions",
      value: "Tracking now being built.",
      detail: "Partner, source, correction, packet, and package-intent queues are being wired into admin review.",
    },
    {
      label: "Packets",
      value: "Tracking now being built.",
      detail: "Free source packet creation now has queue and conversion tracking paths.",
    },
    {
      label: "Users / traffic",
      value: "Tracking now being built.",
      detail: "Visitor intelligence, referrals, and analytics events are being built before public demand claims.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f9fc]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Investor / partner pipeline</p>
            <h1 className="mt-3 max-w-5xl text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
              RepWatchr is building public-record infrastructure for civic accountability.
            </h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
              Search profiles, attach sources, watch officials, build packets, and turn public records into usable civic intelligence.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#interest-form" className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950">
                Start Conversation
              </Link>
              <Link href="/free-packet" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700">
                Try Source Packet
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-900">The flywheel</p>
            <div className="mt-4 grid gap-2">
              {["Search", "Source", "Watch", "Share", "Submit", "Dashboard", "Return", "Package Interest"].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-950 text-sm font-black text-white">{index + 1}</span>
                  <span className="text-sm font-black uppercase tracking-wide text-blue-950">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="grid content-start gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">The problem</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {problemPoints.map((point) => (
                <div key={point} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">
                  {point}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">The product</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {productPoints.map((point) => (
                <div key={point} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black leading-6 text-blue-950 shadow-sm">
                  {point}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Current assets</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {currentAssets.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-3xl font-black text-blue-950">{item.value}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Future revenue paths</p>
              <div className="mt-4 grid gap-2">
                {revenuePaths.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Trust and safety</p>
              <div className="mt-4 grid gap-2">
                {trustStandards.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-900">Boundary</p>
            <p className="mt-3 text-sm font-bold leading-6 text-amber-950">
              This page is for interest collection and partnership conversations. It is not a public securities offering and does not offer investment terms.
            </p>
            <p className="mt-3 text-sm font-bold leading-6 text-amber-950">
              RepWatchr can explore sponsored civic education later only if sponsorship is clearly labeled and does not change source standards, correction workflow, or public-record labels.
            </p>
          </section>
        </div>

        <aside id="interest-form" className="lg:sticky lg:top-24 lg:self-start">
          <PartnerInterestForm />
        </aside>
      </div>
    </main>
  );
}
