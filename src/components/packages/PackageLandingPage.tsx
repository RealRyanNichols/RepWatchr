import Link from "next/link";
import type { RepWatchrPackage } from "@/data/repwatchr-packages";
import FreeToolCrossSell from "@/components/packages/FreeToolCrossSell";
import PackageDeliverablePreview from "@/components/packages/PackageDeliverablePreview";
import PackageDemandBadge from "@/components/packages/PackageDemandBadge";
import PackageFAQ from "@/components/packages/PackageFAQ";
import PackageInterestModal from "@/components/packages/PackageInterestModal";
import PackagePageTracker from "@/components/packages/PackagePageTracker";

export default function PackageLandingPage({
  packageItem,
  paymentsEnabled,
}: {
  packageItem: RepWatchrPackage;
  paymentsEnabled: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <PackagePageTracker packageItem={packageItem} />
      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.35),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(220,38,38,0.20),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(245,248,252,0.08))]" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
            <div>
              <Link href="/packages" className="text-sm font-black text-cyan-100 hover:text-white">
                &larr; Packages
              </Link>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <PackageDemandBadge packageItem={packageItem} />
                <span className="rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-100">
                  Demand capture
                </span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                {packageItem.headline}
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-200 sm:text-lg">
                {packageItem.summary}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <PackageInterestModal
                  packageItem={packageItem}
                  buttonLabel={packageItem.ctaLabels[0] ?? "I want this"}
                />
                <Link
                  href="/free-packet"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  Build free packet
                </Link>
              </div>
            </div>

            <div className="grid content-start gap-4">
              <div className="rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">Demand capture mode</p>
                <p className="mt-3 text-3xl font-black">No payment collected.</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">
                  RepWatchr is measuring demand, scope, urgency, organization type, geography, and fulfillment fit.
                </p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-300">Package status</p>
                  <p className="mt-1 text-lg font-black">{paymentsEnabled ? "Launch review active" : "Interest capture"}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
                    {paymentsEnabled
                      ? "RepWatchr is reviewing this package for controlled checkout release."
                      : "Public CTAs collect interest and beta demand before checkout appears."}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Source-first promise</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-cyan-50">{packageItem.sourceFirstPromise}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="grid content-start gap-6">
            <InfoPanel title="Problem it solves" items={[packageItem.problem]} accent="red" />
            <InfoPanel title="Who it is for" items={packageItem.whoFor} accent="blue" />
            <InfoPanel title="What you would get" items={packageItem.whatYouGet} accent="green" />
          </div>

          <div className="grid content-start gap-6">
            <PackageDeliverablePreview packageItem={packageItem} />
            <InfoPanel title="What it does not include" items={packageItem.notIncluded} accent="amber" />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Trust and safety boundaries</p>
            <div className="mt-4 grid gap-2">
              {packageItem.trustBoundaries.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-800">
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
              {packageItem.disclaimer}
            </p>
          </div>

          <div className="grid content-start gap-6">
            <FreeToolCrossSell packageItem={packageItem} />
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-800">Readiness signal</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {packageItem.demandSignal}
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                {packageItem.expectedTiming}
              </p>
              <div className="mt-5">
                <PackageInterestModal
                  packageItem={packageItem}
                  buttonLabel={packageItem.ctaLabels[1] ?? "Request early access"}
                  buttonClassName="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_16px_35px_rgba(30,64,175,0.24)] transition hover:-translate-y-0.5 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                />
              </div>
            </section>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <PackageFAQ packageItem={packageItem} />
        </section>
      </main>
    </div>
  );
}

function InfoPanel({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "red" | "blue" | "green" | "amber";
}) {
  const colorClass =
    accent === "red"
      ? "text-red-700"
      : accent === "blue"
        ? "text-blue-800"
        : accent === "green"
          ? "text-emerald-700"
          : "text-amber-700";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-6">
      <p className={`text-xs font-black uppercase tracking-[0.22em] ${colorClass}`}>{title}</p>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-800">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
