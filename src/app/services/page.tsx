import type { Metadata } from "next";
import Link from "next/link";
import ServiceCheckoutButton from "@/components/services/ServiceCheckoutButton";
import NextUsefulMove from "@/components/shared/NextUsefulMove";
import RecordVisual from "@/components/shared/RecordVisual";
import { getRepWatchrServices } from "@/data/repwatchr-services";
import { isRepWatchrServiceCheckoutConfigured } from "@/lib/repwatchr-payment-products";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = {
  ...buildRepWatchrMetadata({
    title: "RepWatchr Services | Free Source Packets and Paid Research",
    description:
      "Free source-packet tools and paid public-record research services for Texas elections, East Texas races, public officials, school boards, and accountability records.",
    path: "/services",
    imagePath: buildOgImageUrl("services"),
    imageAlt: "RepWatchr services social preview",
  }),
};

function serviceJsonLd() {
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
    offers: {
      "@type": "Offer",
      price: (service.priceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://www.repwatchr.com/services/${service.slug}`,
    },
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

export default function ServicesPage() {
  const services = getRepWatchrServices();
  const featured = services.filter((service) => service.featured);
  const paymentsEnabled = isRepWatchrServiceCheckoutConfigured();

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd()) }}
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
                  href="/services/free-source-packet#request-package"
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
              </div>
            </div>
            <div className="grid gap-3">
              {featured.map((service) => (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
                >
                  <RecordVisual
                    eyebrow={service.eyebrow}
                    title={service.name}
                    variant="service"
                    metric={{ label: "Price", value: service.priceLabel }}
                    secondaryMetric={{ label: "Lane", value: service.billingLabel }}
                    compact
                    className="mb-4"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                      {service.eyebrow}
                    </span>
                    <span className="text-lg font-black text-red-700">{service.priceLabel}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-blue-950">{service.name}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{service.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-5">
          <NextUsefulMove
            recordPath="/dashboard"
            sourcePath="/submit-source"
            packetPath="/free-packet"
            safeShareLine="RepWatchr services organize public records, sources, and review questions. They do not promise legal advice, private investigation, or political results."
            meetingQuestion="What source packet would make this public question easier to verify?"
          />
        </div>

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
              <article key={service.slug} className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <RecordVisual
                  eyebrow={service.eyebrow}
                  title={service.name}
                  variant="service"
                  metric={{ label: "Price", value: service.priceLabel }}
                  secondaryMetric={{ label: "Billing", value: service.billingLabel }}
                  compact
                  className="mb-4"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700">
                    {service.eyebrow}
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-950">{service.priceLabel}</p>
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
                  {service.priceCents > 0 ? (
                    <ServiceCheckoutButton
                      serviceSlug={service.slug}
                      label={service.ctaLabel}
                      fallbackHref={service.fallbackHref}
                      paymentsEnabled={paymentsEnabled}
                      className="inline-flex w-full justify-center rounded-xl bg-blue-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    />
                  ) : (
                    <Link
                      href={service.fallbackHref}
                      className="inline-flex w-full justify-center rounded-xl bg-blue-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-red-700"
                    >
                      {service.ctaLabel}
                    </Link>
                  )}
                </div>
              </article>
          ))}
        </section>
      </main>
    </div>
  );
}
