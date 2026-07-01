import type { Metadata } from "next";
import Link from "next/link";
import PackageInterestCard from "@/components/packages/PackageInterestCard";
import { getRepWatchrPackages } from "@/data/repwatchr-packages";
import { breadcrumbJsonLd, getPageMetadata, organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata({
  title: "RepWatchr Packages | Public-Record Research Demand",
  description:
    "RepWatchr is collecting demand for public-record packages, local monitoring, research desks, and future data products before checkout opens.",
  path: "/packages",
  imagePath: "/api/og?type=package&title=RepWatchr%20Packages&label=Demand%20capture",
});

export default function PackagesPage() {
  const packages = getRepWatchrPackages();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            organizationJsonLd(),
            breadcrumbJsonLd([
              { name: "RepWatchr", path: "/" },
              { name: "Packages", path: "/packages" },
            ]),
          ]),
        }}
      />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(37,99,235,0.38),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(220,38,38,0.20),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-red-200">Monetization readiness</p>
              <h1 className="mt-4 text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                Public-record packages are in demand-capture mode.
              </h1>
              <p className="mt-5 text-base font-semibold leading-7 text-slate-200 sm:text-lg">
                RepWatchr is not pushing checkout by default. The first job is to learn what people need:
                officials, races, counties, school boards, money trails, source packets, dashboards, and data access.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/free-packet"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:text-red-700"
                >
                  Build Free Packet
                </Link>
                <Link
                  href="/submit-source"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  Submit Source
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((packageItem) => (
              <PackageInterestCard key={packageItem.packageKey} packageItem={packageItem} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Data boundary</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Aggregate demand can guide the business. Private political-interest profiles are not for sale.</h2>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200">
              Package interest tells RepWatchr which jurisdictions, roles, races, and workflows people need. That demand should guide product and fulfillment decisions. It should not become a market for private individual political behavior.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
