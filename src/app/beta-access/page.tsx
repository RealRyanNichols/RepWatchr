import type { Metadata } from "next";
import Link from "next/link";
import BetaAccessForm from "@/components/beta/BetaAccessForm";
import { getPricingPackageCandidate, getPricingPackageOptions } from "@/data/pricing-experiments";

export const metadata: Metadata = {
  title: "Request Beta Access | RepWatchr",
  description:
    "Request beta access for RepWatchr public-record research packages before paid checkout opens.",
  alternates: {
    canonical: "https://www.repwatchr.com/beta-access",
  },
  openGraph: {
    title: "Request Beta Access | RepWatchr",
    description:
      "Tell RepWatchr what public records, officials, races, boards, or monitoring work you need organized.",
    url: "https://www.repwatchr.com/beta-access",
    siteName: "RepWatchr",
    type: "website",
    images: [
      {
        url: "/images/repwatchr-cover-america-first.png",
        width: 2172,
        height: 724,
        alt: "RepWatchr beta access",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Request Beta Access | RepWatchr",
    description:
      "RepWatchr is collecting package demand before launching paid checkout.",
    images: ["/images/repwatchr-cover-america-first.png"],
  },
};

export default async function BetaAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const { package: packageParam } = await searchParams;
  const selectedPackage = getPricingPackageCandidate(packageParam);
  const packageOptions = getPricingPackageOptions();

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.28)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Pricing experiments</p>
          <h1 className="mt-4 text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
            Request beta access before checkout opens.
          </h1>
          <p className="mt-5 text-base font-semibold leading-7 text-slate-200">
            RepWatchr is testing package demand, messaging, scope, and pricing sensitivity. No payment is collected here,
            and access is not guaranteed.
          </p>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-300">Safe offer posture</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                Source organization, public-record review, local monitoring, and share-safe civic intelligence. No legal
                advice, private investigation, harassment, or guaranteed political results.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-300">Selected package</p>
              <p className="mt-2 text-2xl font-black">{selectedPackage?.name ?? "Pick a package"}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
                {selectedPackage?.betaUseCasePrompt ??
                  "Use the form to tell RepWatchr what needs to be monitored, checked, or organized."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/services"
              className="rounded-xl bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-950 hover:bg-red-50"
            >
              Compare Packages
            </Link>
            <Link
              href="/free-packet"
              className="rounded-xl border border-white/20 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white/10"
            >
              Build Free Packet
            </Link>
          </div>
        </section>

        <BetaAccessForm
          packageOptions={packageOptions}
          initialPackageKey={selectedPackage?.packageKey ?? packageParam}
        />
      </main>
    </div>
  );
}
