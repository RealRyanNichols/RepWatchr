import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LeadRepPackageCard } from "@/components/leadrep/LeadRepPackageCard";
import { VendorTrustWidget } from "@/components/leadrep/VendorTrustWidget";

export const metadata = {
  title: "VendorTrust Badge | RepWatchr",
  description:
    "Run a public-source vendor confidence preview with license, registry, review, and complaint-source placeholders before trusting a local vendor.",
};

export default function VendorTrustPage() {
  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-950">
      <Header />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:items-end lg:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Package 2</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-blue-950 sm:text-6xl">
                VendorTrust Badge checks public-source signals before a family pays or schedules work blind.
              </h1>
              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-700">
                Run a preview from vendor name, website, location, optional license, optional insurance proof,
                and public-source consent. A badge stays pending until proof is reviewed.
              </p>
            </div>
            <LeadRepPackageCard
              eyebrow="Sellable MVP"
              title="VendorTrust Badge"
              body="A public-source vendor confidence check for families and local buyers."
              price="$29"
              recurring="Family Vendor Shield $39/mo"
              href="#tool"
              cta="Run Vendor Check"
              bullets={["ProofRanker", "License/registry placeholder", "Review and complaint placeholders", "Embeddable widget"]}
            />
          </div>
        </section>
        <section id="tool" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <VendorTrustWidget />
        </section>
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Embed component</p>
            <h2 className="mt-2 text-2xl font-black text-blue-950">Embeddable VendorTrust widget</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              The reusable component lives at `src/components/leadrep/VendorTrustWidget.tsx` and can be embedded
              into partner, service, or family-safety pages without exposing service keys client-side.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
