"use client";

import type { RepWatchrPackage } from "@/data/repwatchr-packages";
import { trackEvent } from "@/lib/analytics-client";

export default function PackageFAQ({ packageItem }: { packageItem: RepWatchrPackage }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">FAQ</p>
      <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
        {packageItem.faqs.map((faq) => (
          <details
            key={faq.question}
            className="group bg-white p-4 open:bg-slate-50"
            onToggle={(event) => {
              if ((event.currentTarget as HTMLDetailsElement).open) {
                void trackEvent("package_faq_open", {
                  package_key: packageItem.packageKey,
                  package_slug: packageItem.slug,
                  question: faq.question,
                });
              }
            }}
          >
            <summary className="cursor-pointer list-none text-sm font-black text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
              <span className="inline-flex w-full items-center justify-between gap-4">
                {faq.question}
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-500 group-open:bg-blue-950 group-open:text-white">
                  Open
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
