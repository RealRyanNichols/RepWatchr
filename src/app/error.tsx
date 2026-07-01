"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[72vh] bg-[#f5f8fc] px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-red-100 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
        <div className="h-2 bg-[linear-gradient(90deg,#b91c1c_0%,#f5d061_35%,#f8fafc_50%,#2563eb_100%)]" />
        <div className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Page error</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            This record hit a loading problem.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-700">
            Try again, search the public record, or submit the missing source. RepWatchr should never leave you at a
            dead end.
          </p>
          {error.digest ? (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
              Error reference: {error.digest}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-2xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Try again
            </button>
            <Link
              href="/search"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Search records
            </Link>
            <Link
              href="/submit-source"
              className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-amber-950 transition hover:-translate-y-0.5 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Submit source
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
