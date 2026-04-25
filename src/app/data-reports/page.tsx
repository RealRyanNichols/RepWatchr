import type { Metadata } from "next";
import Link from "next/link";
import GideonSearchBox from "@/components/shared/GideonSearchBox";

export const metadata: Metadata = {
  title: "RepWatchr Data Desk",
  description:
    "Request location-specific public data packs for school boards, races, counties, cities, and officials while RepWatchr remains free to use.",
};

const packages = [
  {
    name: "Local Starter File",
    price: "$49",
    bestFor: "One city, county, school, district, or race",
    includes: ["Roster and public links", "Top officials and seats", "Open records still needed", "Shareable one-page summary"],
  },
  {
    name: "School Board Watch Pack",
    price: "$99",
    bestFor: "One ISD or school-board race",
    includes: ["Board-member profile index", "Meeting/source queue", "Praise/concern lanes", "Parent question starter list"],
  },
  {
    name: "County Power Map",
    price: "$149",
    bestFor: "County-wide political landscape",
    includes: ["County, city, school-board map", "Key races and offices", "Funding/source checklist", "Research gaps report"],
  },
  {
    name: "Custom Data Pull",
    price: "Quote",
    bestFor: "Campaigns, journalists, local groups, and investigators",
    includes: ["Custom geography", "Custom office set", "Evidence/source formatting", "Export-ready spreadsheet"],
  },
];

export default function DataReportsPage() {
  return (
    <div className="bg-[#fbfcff]">
      <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_52%,#fff7ed_100%)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-red-700">RepWatchr Data Desk</p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-blue-950 sm:text-5xl">
              The app stays free. The data work can fund the mission.
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-gray-700">
              Users should never need a credit card to search, track, comment, or use the public tools. The paid lane is location-specific public-data work for people who need a clean file now.
            </p>
            <div className="mt-6 max-w-4xl">
              <GideonSearchBox compact placeholder="Search a location before requesting a data pack..." />
            </div>
          </div>
          <aside className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-100/70">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">What we sell</p>
            <h2 className="mt-2 text-2xl font-black text-gray-950">Specific-location data, not access to the site.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-gray-600">
              A campaign, parent group, reporter, watchdog, or local citizen can request a researched data pack for a place, race, district, or school board.
            </p>
            <Link href="mailto:Ryan@RealRyanNichols.com?subject=RepWatchr%20Data%20Pack%20Request" className="mt-5 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700">
              Request a data pack
            </Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-black uppercase tracking-wide text-red-700">Low-cost packages</p>
          <h2 className="mt-2 text-3xl font-black text-gray-950">Paid research without paywalling voters.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {packages.map((item) => (
            <article key={item.name} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-black text-blue-950">{item.price}</p>
              <h3 className="mt-3 text-xl font-black text-gray-950">{item.name}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">{item.bestFor}</p>
              <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-gray-700">
                {item.includes.map((line) => (
                  <li key={line}>+ {line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 text-white sm:px-6 lg:grid-cols-3 lg:px-8">
          <ValueCard title="Free stays free" body="Search, dashboards, public profiles, comments, tracking, and Gideon entry tools stay open to users." />
          <ValueCard title="Data packs are specific" body="The paid product is a location, race, district, school, or official file that someone needs cleaned up fast." />
          <ValueCard title="No ads required" body="The site can grow without turning voters into the product or burying the public tools behind memberships." />
        </div>
      </section>
    </div>
  );
}

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{body}</p>
    </div>
  );
}
