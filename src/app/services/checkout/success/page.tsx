import type { Metadata } from "next";
import Link from "next/link";
import CheckoutAnalytics from "@/components/services/CheckoutAnalytics";
import { getRepWatchrService } from "@/data/repwatchr-services";

export const metadata: Metadata = {
  title: "Checkout Complete | RepWatchr Services",
  description: "Your RepWatchr service checkout is complete. Send any public links, dates, and source context needed for the package.",
  robots: {
    index: false,
    follow: false,
  },
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ServiceCheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const serviceSlug = firstParam(params.service) ?? "";
  const sessionId = firstParam(params.session_id) ?? "";
  const service = getRepWatchrService(serviceSlug);
  const isSubscription = service?.slug === "election-watch-desk";

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <CheckoutAnalytics
        eventName="checkout_completed"
        serviceSlug={service?.slug}
        stripeCheckoutSessionId={sessionId}
        payload={{ page: "service_checkout_success" }}
      />
      {isSubscription ? (
        <CheckoutAnalytics
          eventName="subscription_started"
          serviceSlug={service?.slug}
          stripeCheckoutSessionId={sessionId}
          payload={{ page: "service_checkout_success" }}
        />
      ) : null}

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-green-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Checkout complete</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-blue-950">
            {service ? `${service.name} is started.` : "Your RepWatchr service is started."}
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-700">
            Send the public links, dates, jurisdiction, official names, and the exact record question. RepWatchr will keep the work in the public-record lane.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={service ? `/services/${service.slug}#request-package` : "/services"}
              className="inline-flex justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
            >
              Add Source Context
            </Link>
            <a
              href={`mailto:Ryan@RealRyanNichols.com?subject=${encodeURIComponent(
                `RepWatchr Checkout Complete${service ? `: ${service.name}` : ""}`
              )}`}
              className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
            >
              Email Context
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
