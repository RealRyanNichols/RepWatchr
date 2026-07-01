"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { RepWatchrPackage } from "@/data/repwatchr-packages";
import { packageRoute } from "@/data/repwatchr-packages";
import { trackEvent } from "@/lib/analytics-client";
import PackageInterestModal from "@/components/packages/PackageInterestModal";

export default function PackageInterestCard({ packageItem }: { packageItem: RepWatchrPackage }) {
  useEffect(() => {
    void trackEvent("package_card_viewed", {
      package_key: packageItem.packageKey,
      package_slug: packageItem.slug,
      package_name: packageItem.name,
    });
  }, [packageItem.packageKey, packageItem.name, packageItem.slug]);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-5 text-white shadow-[0_22px_70px_rgba(2,6,23,0.28)] backdrop-blur transition hover:-translate-y-1 hover:border-cyan-200/40 hover:bg-white/[0.12]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-300/15 blur-3xl transition group-hover:bg-red-400/20" />
      <div className="relative">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">{packageItem.eyebrow}</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight">{packageItem.name}</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">{packageItem.summary}</p>

        <div className="mt-5 grid gap-2">
          {packageItem.whatYouGet.slice(0, 3).map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-100">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={packageRoute(packageItem)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-700"
          >
            Open package
          </Link>
          <PackageInterestModal
            packageItem={packageItem}
            buttonLabel={packageItem.ctaLabels[0] ?? "I want this"}
            buttonClassName="inline-flex min-h-11 items-center justify-center rounded-2xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[0_14px_32px_rgba(220,38,38,0.22)] transition hover:-translate-y-0.5 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          />
        </div>
      </div>
    </article>
  );
}
