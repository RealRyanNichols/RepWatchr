import type { Metadata } from "next";
import Link from "next/link";
import {
  getRepWatchrServiceCtaLabel,
  getRepWatchrServicePaymentHref,
  getRepWatchrServicePriceLabel,
  getRepWatchrServices,
} from "@/data/repwatchr-services";
import { getPricingPackageCandidate } from "@/data/pricing-experiments";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "RepWatchr Services | Free Source Packets and Paid Research",
  description:
    "Free source-packet tools and paid RepWatchr research services for Texas elections, East Texas races, public officials, school boards, and source-backed accountability records.",
  alternates: {
    canonical: "https://www.repwatchr.com/services",
  },
  openGraph: {
    title: "RepWatchr Services | Free Source Packets and Paid Research",
    description:
      "Start free with a source packet, then request paid research for local races, officials, school boards, and election watch lanes.",
    url: "https://www.repwatchr.com/services",
    siteName: "RepWatchr",
    type: "website",
    images: [
      {
        url: "/images/repwatchr-cover-america-first.png",
        width: 2172,
        height: 724,
        alt: "RepWatchr services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWatchr Services | Free Source Packets and Paid Research",
    description:
      "Free source-packet tools and paid public-record research services for Texas elections and public accountability.",
    images: ["/images/repwatchr-cover-america-first.png"],
  },
};

function serviceJsonLd(paymentsEnabled: boolean) {
  const services = getRepWatchrServices().map((service) => ({
    "@type": "Service",
    name: service.name,
    description: service.summary,
    provider: {
      "@type": "Organization",
      name: "RepWatchr",
      url: "https://www.repwatchr.com",
    },
    areaServed: service.slug.includes("local") || service.slug.includes("election")
      ? "Texas and East Texas"
      : "United States",
    ...(paymentsEnabled || service.priceCents === 0
      ? {
          offers: {
            "@type": "Offer",
            price: (service.priceCents / 100).toFixed(2),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `https://www.repwatchr.com/services/${service.slug}`,
          },
        }
      : {}),
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "RepWatchr services",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: service,
    })),
  };
}

export default async function ServicesPage() {
  const paymentsEnabled = await isFeatureEnabled("ENABLE_PAYMENTS");
  const showExpectedRange = await isFeatureEnabled("ENABLE_BETA_PACKAGES");
  const services = getRepWatchrServices();
  const featured = services.filter((service) => service.featured);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd(paymentsEnabled)) }}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                Free first. Paid when the record needs work.
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
                Source packets, race research, and official record briefs.
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                RepWatchr is not legal advice and not a rumor board. The service lane is for public-record
                research, source organization, race pages, official briefs, and share-ready accountability
                packets people can inspect.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/elections/texas/contribute"
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
                >
                  Start Free
                </Link>
                <Link
                  href="/blog"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
                >
                  Read Blog
                </Link>
                <Link
                  href="/data-reports"
                  className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
                >
                  Data Reports
                </Link>
              </div>
            </div>
            <div className="grid gap-3">
              {featured.map((service) => (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                      {service.eyebrow}
                    </span>
                    <span className="text-lg font-black text-red-700">
                      {getRepWatchrServicePriceLabel(service, {
                        paymentsEnabled,
                        showExpectedRange,
                        expectedRange: getPricingPackageCandidate(service.slug)?.expectedRange,
                      })}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-blue-950">{service.name}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{service.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const pricingCandidate = getPricingPackageCandidate(service.slug);
            const href = getRepWatchrServicePaymentHref(service, { paymentsEnabled });
            const external = href.startsWith("http");
            const priceLabel = getRepWatchrServicePriceLabel(service, {
              paymentsEnabled,
              showExpectedRange,
              expectedRange: pricingCandidate?.expectedRange,
            });
            const ctaLabel = getRepWatchrServiceCtaLabel(service, { paymentsEnabled });
            return (
              <article key={service.slug} className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700">
                    {service.eyebrow}
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-950">{priceLabel}</p>
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{service.billingLabel}</p>
                  </div>
                </div>
                <h2 className="mt-4 text-xl font-black leading-tight text-blue-950">{service.name}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{service.summary}</p>
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-900">Best for</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-blue-950">{service.bestFor}</p>
                </div>
                <div className="mt-4 grid gap-2">
                  {service.deliverables.slice(0, 4).map((item) => (
                    <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-5">
                  <Link
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="inline-flex w-full justify-center rounded-xl bg-blue-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-red-700"
                  >
                    {ctaLabel}
                  </Link>
                  {service.priceCents > 0 && !paymentsEnabled ? (
                    <p className="mt-2 text-center text-xs font-bold text-slate-500">
                      RepWatchr is collecting beta demand before paid checkout opens.
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
