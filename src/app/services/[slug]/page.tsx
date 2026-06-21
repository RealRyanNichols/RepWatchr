import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import ServiceCheckoutButton from "@/components/services/ServiceCheckoutButton";
import ServiceRequestPacketBuilder from "@/components/services/ServiceRequestPacketBuilder";
import SourceSubmissionForm from "@/components/source-submissions/SourceSubmissionForm";
import { getRepWatchrService, getRepWatchrServiceLanding, getRepWatchrServices } from "@/data/repwatchr-services";
import { isRepWatchrServiceCheckoutConfigured } from "@/lib/repwatchr-payment-products";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

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

  return buildRepWatchrMetadata({
    title: `${service.name} | RepWatchr Services`,
    description: service.summary,
    path: `/services/${service.slug}`,
    imagePath: buildOgImageUrl("services", { slug: service.slug }),
    imageAlt: `${service.name} RepWatchr service preview`,
  });
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
  const landing = getRepWatchrServiceLanding(service.slug);

  const paymentsEnabled = isRepWatchrServiceCheckoutConfigured();

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
                {landing.headline}
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                {service.summary}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {service.priceCents > 0 ? (
                  <ServiceCheckoutButton
                    serviceSlug={service.slug}
                    label={service.ctaLabel}
                    fallbackHref={service.fallbackHref}
                    paymentsEnabled={paymentsEnabled}
                    className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300"
                  />
                ) : (
                  <Link
                    href={service.fallbackHref}
                    className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
                  >
                    {service.ctaLabel}
                  </Link>
                )}
                <a
                  href="#request-package"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
                >
                  Request form fallback
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

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <LandingPanel eyebrow="Who it is for" title="Use this when">
            <BulletList items={landing.whoItIsFor} />
          </LandingPanel>
          <LandingPanel eyebrow="What you get" title="The paid output">
            <BulletList items={landing.whatYouGet} />
          </LandingPanel>
          <LandingPanel eyebrow="What you do not get" title="Boundaries matter">
            <BulletList items={landing.whatYouDoNotGet} tone="warn" />
          </LandingPanel>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <LandingPanel eyebrow="Turnaround expectation" title={service.turnaround}>
            <p className="text-sm font-semibold leading-6 text-slate-700">{landing.expectation}</p>
          </LandingPanel>
          <LandingPanel eyebrow="Source-first guarantee" title="The receipt stays attached">
            <p className="text-sm font-semibold leading-6 text-slate-700">{landing.sourceFirstGuarantee}</p>
          </LandingPanel>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid content-start gap-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Sample deliverable outline</p>
              <div className="mt-4 grid gap-2">
                {landing.sampleOutline.map((item, index) => (
                  <div key={item} className="grid grid-cols-[42px_1fr] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-950 text-xs font-black text-white">{index + 1}</span>
                    <span className="text-sm font-black text-slate-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-900">Safety / disclaimer</p>
              <p className="mt-3 text-sm font-bold leading-6 text-amber-950">{landing.safetyLanguage}</p>
            </div>
          </div>
          <div className="grid content-start gap-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">FAQ</p>
              <div className="mt-4 grid gap-3">
                {landing.faq.map((item) => (
                  <details key={item.question} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <summary className="cursor-pointer text-sm font-black text-blue-950">{item.question}</summary>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-900">Next best path</p>
              <div className="mt-4 grid gap-3">
                {landing.crossSell.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-lg border border-blue-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-red-300">
                    <p className="text-sm font-black text-blue-950">{item.label}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{item.note}</p>
                  </Link>
                ))}
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
          <div id="request-package">
            {service.slug === "free-source-packet" ? (
              <SourceSubmissionForm
                defaultSourceType="official_record"
                defaultTargetType="free_source_packet"
                defaultTargetPageUrl={`/services/${service.slug}`}
              />
            ) : (
              <ServiceRequestPacketBuilder service={service} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function LandingPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BulletList({ items, tone = "default" }: { items: string[]; tone?: "default" | "warn" }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item}
          className={`rounded-lg border px-3 py-2 text-sm font-bold leading-6 ${
            tone === "warn"
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
