import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LeadRepPackageCard } from "@/components/leadrep/LeadRepPackageCard";
import { SalesRepSignalWaitlist } from "@/components/leadrep/SalesRepSignalWaitlist";

export const metadata = {
  title: "Sales Rep Signal Profile Pilot | RepWatchr",
  description:
    "Join the opt-in Sales Rep Signal Profile pilot. Self-submitted profile review only; not a background check or employment decision tool.",
};

export default function SalesRepSignalPage() {
  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-950">
      <Header />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:items-end lg:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Package 3 waitlist</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-blue-950 sm:text-6xl">
                Sales Rep Signal Profile is consent-first and waitlist only.
              </h1>
              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-700">
                The pilot accepts self-submitted LinkedIn, resume, or profile URLs for sales-signal review.
                It is not a report sale and cannot be used for employment decisions.
              </p>
            </div>
            <LeadRepPackageCard
              eyebrow="Waitlist only"
              title="Sales Rep Signal Profile"
              body="Opt-in pilot for self-submitted sales profile signal, proof, and positioning notes."
              price="Pilot"
              href="#pilot"
              cta="Join Pilot"
              bullets={["Self-submitted URL", "Consent required", "No screening use", "No employment eligibility score"]}
            />
          </div>
        </section>
        <section id="pilot" className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Compliance line</p>
            <h2 className="mt-2 text-2xl font-black text-amber-950">Not for employment decisions.</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-amber-950">
              Do not use this for hiring eligibility, background checks, employment screening, residential-history checks,
              employment-gap scoring, tenant screening, credit, insurance, or any consumer-report purpose.
            </p>
          </div>
          <SalesRepSignalWaitlist source="repwatchr" />
        </section>
      </main>
      <Footer />
    </div>
  );
}
