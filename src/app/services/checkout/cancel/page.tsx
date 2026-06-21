import type { Metadata } from "next";
import Link from "next/link";
import CheckoutAnalytics from "@/components/services/CheckoutAnalytics";
import { getRepWatchrService } from "@/data/repwatchr-services";

export const metadata: Metadata = {
  title: "Checkout Canceled | RepWatchr Services",
  description: "RepWatchr service checkout was canceled. You can retry checkout or send a package request with public-record context.",
  robots: {
    index: false,
    follow: false,
  },
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ServiceCheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const serviceSlug = firstParam(params.service) ?? "";
  const service = getRepWatchrService(serviceSlug);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <CheckoutAnalytics
        eventName="checkout_canceled"
        serviceSlug={service?.slug}
        payload={{ page: "service_checkout_cancel" }}
      />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-amber-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Checkout canceled</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-blue-950">
            No payment was completed.
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-700">
            You can restart checkout or send the request context first. Keep it to public links, dates, jurisdictions, and the specific record question.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={service ? `/services/${service.slug}` : "/services"}
              className="inline-flex justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
            >
              Restart Checkout
            </Link>
            <Link
              href={service ? `/services/${service.slug}#request-package` : "/services"}
              className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
            >
              Request Package
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
