import type { Metadata } from "next";
import Link from "next/link";
import PublicDataApiAccessForm from "@/components/public-data-api/PublicDataApiAccessForm";
import { getAllOfficials } from "@/lib/data";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "Public Official Data Pilots",
  description: "Request a scoped public-official data pilot for your newsroom, agency or research team. See coverage, source fields and review requirements.",
  path: "/packages/public-data-api",
  imagePath: buildOgImageUrl("services", { slug: "public-data-api" }),
  imageAlt: "RepWatchr public official data pilot",
});

const packages = [
  { name: "Researcher", price: "$49 / month", detail: "Proposed pilot for up to 100 public records in an agreed jurisdiction.", includes: "Saved record lists, source-change digest and permitted public-field exports." },
  { name: "Local team", price: "$249 / month", detail: "Proposed pilot for one supported county, up to 500 records and five team members.", includes: "Office roster, source ledger, CSV delivery and an agreed review schedule." },
  { name: "Agency data", price: "From $999 / month", detail: "Proposed pilot for up to 2,500 agreed public office and term records.", includes: "Scoped delivery, a field dictionary, source dates and a refresh plan." },
];

const fields = [
  ["Record identity", "Stable person and office identifiers; name, office, jurisdiction and term where supported."],
  ["Public sources", "Direct source URL, source type, record date and the field or claim it supports."],
  ["Review status", "Imported, awaiting review or reviewed status; last checked date and unresolved gaps."],
  ["Changes", "Dated officeholder, term or source changes, with the prior record preserved."],
];

export default function PublicDataApiPackagePage() {
  const count = new Intl.NumberFormat("en-US").format(getAllOfficials().length);
  return (
    <main className="rw-page-shell text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex gap-2 text-sm text-slate-600">
          <Link href="/services" className="underline underline-offset-4">Services</Link><span aria-hidden="true">/</span><span>Public data</span>
        </nav>
        <section className="rounded-2xl bg-slate-950 px-6 py-9 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Public data pilots · requests open</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">Put the public record to work.</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200">Source-linked official profiles, office rosters and record changes for newsrooms, civic researchers and agencies. Tell us the place, fields and delivery you need.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#request-api-access" className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100">Request a scoped pilot</a>
            <Link href="/coverage" className="rounded-lg border border-slate-500 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Check current coverage</Link>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">The public API and paid data subscriptions have not launched. A request starts a scope review; it does not issue a key, reserve a dataset or collect payment.</p>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.6fr]" aria-labelledby="coverage-heading">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-4xl font-black tracking-tight">{count}</p>
            <h2 id="coverage-heading" className="mt-2 text-lg font-bold">Official records in the current directory</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Loaded records include source-seeded and incomplete profiles. This is not a count of verified officials or complete national coverage. School-board research has its own coverage and dates.</p>
            <Link href="/data-reports" className="mt-4 inline-block text-sm font-bold text-blue-800 underline underline-offset-4">Read the data report</Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-bold tracking-tight">Agree on the data before the price.</h2>
            <ol className="mt-5 grid gap-4 sm:grid-cols-3">
              {[["01", "Name the scope", "Jurisdiction, offices, fields and intended use."], ["02", "Review a sample", "Confirm dates, sources, gaps and permitted reuse."], ["03", "Set delivery terms", "Agree on format, refresh schedule and cost before any access."]].map(([step, title, detail]) => (
                <li key={step}><span className="text-sm font-bold text-blue-800">{step}</span><h3 className="mt-2 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="pilot-options">
          <h2 id="pilot-options" className="text-2xl font-bold tracking-tight">Pilot packages we are testing</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Proposed pricing for research and planning. Availability, record limits and review cadence require a written scope. These are not active subscriptions.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {packages.map((item) => (
              <article key={item.name} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-bold">{item.name}</h3><p className="mt-3 text-2xl font-black tracking-tight">{item.price}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{item.detail}</p><p className="mt-3 flex-1 text-sm leading-6 text-slate-700">{item.includes}</p>
                <a href="#request-api-access" className="mt-6 inline-flex text-sm font-bold text-blue-800 underline underline-offset-4">Discuss {item.name.toLowerCase()} scope</a>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid items-start gap-7 lg:grid-cols-2">
          <div className="grid gap-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6" aria-labelledby="fields-heading">
              <h2 id="fields-heading" className="text-2xl font-bold tracking-tight">What a sample should show</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">A proposed field dictionary, not an available export. Every pilot must identify missing fields and source restrictions.</p>
              <dl className="mt-5 divide-y divide-slate-200">{fields.map(([name, detail]) => <div key={name} className="py-4 first:pt-0"><dt className="font-bold">{name}</dt><dd className="mt-1 text-sm leading-6 text-slate-600">{detail}</dd></div>)}</dl>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-bold tracking-tight">Public records. Clear limits.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">A pilot can cover permitted public-role fields and source links. Private submissions, private addresses, individual voting preferences and identity-linked visitor histories are excluded.</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Community feedback is not currently offered as a dataset. Any future aggregate release needs consent, sample disclosure, verification labels and safeguards against identifying participants. Participation does not establish public consensus.</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-blue-800"><Link href="/methodology" className="underline underline-offset-4">Methodology</Link><Link href="/privacy" className="underline underline-offset-4">Privacy</Link><Link href="/for-candidates" className="underline underline-offset-4">Free candidate profile requests</Link></div>
            </section>
          </div>
          <PublicDataApiAccessForm />
        </section>
      </div>
    </main>
  );
}
