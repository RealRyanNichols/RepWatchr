import Link from "next/link";
import { LeadRepPackageCard } from "@/components/leadrep/LeadRepPackageCard";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const metrics = [
  ["5", "sellable verified data-package ideas"],
  ["2", "packages ready for buyers"],
  ["1", "paying buyer or serious sales opportunity"],
  ["50%+", "research time savings target"],
  ["Weekly", "recurring lead-drop category"],
];

export default function LeadRepDashboardPage() {
  return (
    <main className="min-h-screen bg-[#f6f9fc] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">LeadRep package desk</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">ProofRanker to PackageCloser</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Issues are tasks. PR comments are handoff notes. Actions are triggers. Commits are proof of work.
            Grok stays useful only if it produces sellable packages, buyer-ready offers, and recurring lead drops.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {metrics.map(([value, label]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-black text-red-700">{value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <LeadRepPackageCard
            eyebrow="LeadFlow"
            title="LeadSource Clarity Report"
            body="Source clarity score, fraud-risk flags, geo placeholder, response-time placeholder, and $79 audit CTA."
            price="$79"
            recurring="Source Guardian $149/mo"
            href="https://www.theleadflowpro.com/tools/leadsource-clarity"
            cta="Open LeadFlow"
            bullets={["SignalScout", "Business lead-source buyers", "Deployable now"]}
          />
          <LeadRepPackageCard
            eyebrow="Build second"
            title="VendorTrust Badge"
            body="Public-source vendor confidence preview with a $29 check and Family Vendor Shield upsell."
            price="$29"
            recurring="Family Vendor Shield $39/mo"
            href="/tools/vendortrust"
            cta="Open Tool"
            bullets={["ProofRanker", "Family and local vendor buyers", "Public-source only"]}
          />
          <LeadRepPackageCard
            eyebrow="Waitlist"
            title="Sales Rep Signal Profile"
            body="Opt-in self-submitted profile pilot. Not a background check, consumer report, or employment decision tool."
            price="Pilot"
            href="/tools/sales-rep-signal"
            cta="Open Waitlist"
            bullets={["PredictivePulse", "Consent required", "No report sale"]}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Cancel rule</p>
          <h2 className="mt-2 text-2xl font-black text-blue-950">Grok must move toward revenue.</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            If Grok only creates research notes and no sellable packages, downgrade it or cancel it.
          </p>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-lg border border-blue-200 px-4 py-2 text-sm font-black text-blue-950 hover:bg-blue-50">
            Back to dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}
