import type { Metadata } from "next";
import Link from "next/link";
import PartnerInterestForm from "@/components/investors/PartnerInterestForm";
import { getAllNews, getAllOfficials, getRepWatchrDataStats } from "@/lib/data";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "RepWatchr Investors and Partners",
  description:
    "RepWatchr is a public-record accountability platform, citizen research workflow, data product, and civic media engine.",
  path: "/investors",
  imagePath: buildOgImageUrl("services", { slug: "investors" }),
  imageAlt: "RepWatchr investor and partner preview",
});

const sections = [
  {
    title: "Mission",
    body: "RepWatchr helps citizens search, grade, source, and share public records without turning weak claims into public certainty.",
  },
  {
    title: "Problem",
    body: "Local voters see claims, clips, donor screenshots, meeting arguments, and election noise, but the receipt is usually scattered or missing.",
  },
  {
    title: "Product",
    body: "The product combines official profiles, race hubs, source packets, public-record request drafts, dashboards, admin review queues, and share-safe snippets.",
  },
  {
    title: "Contributor Flywheel",
    body: "Users submit public sources, build packets, watch profiles, share receipt-backed snippets, and create more source trails for admin review.",
  },
  {
    title: "Data Moat",
    body: "The long-term advantage is structured source trails: officials, votes, funding, public questions, race records, corrections, and review history.",
  },
  {
    title: "Trust Standards",
    body: "Public records first. No private addresses, minor children, threats, doxxing, sealed records, or unsourced allegations.",
  },
];

const roadmap = [
  "Texas and East Texas race hubs",
  "State House, State Senate, school board, and county profile expansion",
  "Verified citizen scoring and constituent/out-of-district segmentation",
  "Daily Watch wire moderation and story promotion",
  "Paid source packets, official briefs, and election watch desk fulfillment",
  "Data/API possibilities once source quality and access controls are mature",
];

export default function InvestorsPage() {
  const stats = getRepWatchrDataStats();
  const officials = getAllOfficials();
  const stories = getAllNews();

  const traction = [
    { label: "Loaded public profiles", value: officials.length.toLocaleString(), detail: "Officials and authority-profile records currently in the static data layer." },
    { label: "Public source URLs", value: stats.publicSourceUrls.toLocaleString(), detail: "Unique loaded public URLs across profile, story, school-board, and issue data." },
    { label: "Stories / review items", value: stories.length.toLocaleString(), detail: "Source-linked public articles and review drafts in the content system." },
    { label: "Member tools", value: "7", detail: "Watchlist, source packets, records drafts, timeline starter, Faretta helper, submissions, paid-service cards." },
  ];

  const revenueLines = [
    "Quick Record Check",
    "Local Race Source Pack",
    "Official Record Brief",
    "Election Watch Desk",
    "Memberships and team workspaces",
    "Future data/API access where public-source quality supports it",
    "Clearly labeled sponsored civic education only if it does not compromise source standards",
  ];

  return (
    <main className="min-h-screen bg-[#f6f9fc]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Investor / partner brief</p>
            <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
              Public-record accountability, built like a workflow.
            </h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
              RepWatchr is a civic accountability platform, data product, citizen research desk, and media engine. The promise is simple: the hook can travel, but the receipt stays attached.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/services" className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950">
                Revenue Packages
              </Link>
              <Link href="/free-packet" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700">
                Growth Funnel
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="grid content-start gap-6">
          <section className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <div key={section.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-blue-950">{section.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{section.body}</p>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Current traction</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {traction.map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-3xl font-black text-blue-950">{item.value}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Revenue lines</p>
              <div className="mt-4 grid gap-2">
                {revenueLines.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Roadmap</p>
              <div className="mt-4 grid gap-2">
                {roadmap.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-900">Founder note</p>
            <p className="mt-3 text-sm font-bold leading-6 text-amber-950">
              RepWatchr is being built around a public-record discipline: do not ask citizens to trust outrage. Give them the source trail, the score logic, the missing-record list, and a way to improve the record.
            </p>
            <p className="mt-3 text-xs font-black uppercase tracking-wide text-amber-900">
              This page is for interest and partnership discussions. It is not a public securities offering.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PartnerInterestForm />
        </aside>
      </div>
    </main>
  );
}
