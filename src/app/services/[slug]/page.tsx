import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ServiceRequestPacketBuilder from "@/components/services/ServiceRequestPacketBuilder";
import {
  getRepWatchrService,
  getRepWatchrServicePaymentHref,
  getRepWatchrServices,
} from "@/data/repwatchr-services";

export function generateStaticParams() {
  return getRepWatchrServices().map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getRepWatchrService(slug);
  if (!service) return { title: "Service Not Found" };
  const canonicalUrl = `https://www.repwatchr.com/services/${service.slug}`;

  return {
    title: `${service.name} | RepWatchr Services`,
    description: service.summary,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${service.name} | RepWatchr Services`,
      description: service.summary,
      url: canonicalUrl,
      siteName: "RepWatchr",
      type: "website",
      images: [
        {
          url: "/images/repwatchr-cover-america-first.png",
          width: 2172,
          height: 724,
          alt: `${service.name} RepWatchr service`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.name} | RepWatchr Services`,
      description: service.summary,
      images: ["/images/repwatchr-cover-america-first.png"],
    },
  };
}

function serviceStructuredData(service: NonNullable<ReturnType<typeof getRepWatchrService>>) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.summary,
    provider: {
      "@type": "Organization",
      name: "RepWatchr",
      url: "https://www.repwatchr.com",
      logo: "https://www.repwatchr.com/images/repwatchr-logo-america-first.png",
    },
    serviceType: "Public-record research and election accountability packet",
    areaServed: service.slug.includes("local") || service.slug.includes("election")
      ? "Texas and East Texas"
      : "United States",
    offers: {
      "@type": "Offer",
      price: (service.priceCents / 100).toFixed(2),
      priceCurrency: "USD",
      url: `https://www.repwatchr.com/services/${service.slug}`,
      availability: "https://schema.org/InStock",
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getRepWatchrService(slug);
  if (!service) notFound();

  const paymentHref = getRepWatchrServicePaymentHref(service);
  const paymentExternal = paymentHref.startsWith("http");

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceStructuredData(service)) }}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/services" className="text-sm font-black text-blue-800 hover:text-red-700">
          &larr; Services
        </Link>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                  {service.eyebrow}
                </span>
                <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                  {service.turnaround}
                </span>
              </div>
              <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
                {service.name}
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                {service.summary}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={paymentHref}
                  target={paymentExternal ? "_blank" : undefined}
                  rel={paymentExternal ? "noopener noreferrer" : undefined}
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
                >
                  {service.ctaLabel}
                </Link>
                <a
                  href={`mailto:Ryan@RealRyanNichols.com?subject=${encodeURIComponent(`RepWatchr Service: ${service.name}`)}`}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
                >
                  Request invoice
                </a>
              </div>
            </div>
            <div className="grid content-start gap-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-blue-900">Price</p>
                <p className="mt-1 text-4xl font-black text-blue-950">{service.priceLabel}</p>
                <p className="mt-1 text-sm font-black uppercase tracking-wide text-slate-600">{service.billingLabel}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Best for</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{service.bestFor}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid content-start gap-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Deliverables</p>
              <div className="mt-4 grid gap-2">
                {service.deliverables.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">What to send</p>
              <div className="mt-4 grid gap-2">
                {service.inputs.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ServiceRequestPacketBuilder service={service} />
        </section>
      </main>
    </div>
  );
}
