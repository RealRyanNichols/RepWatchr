import type { RepWatchrPackage } from "@/data/repwatchr-packages";

export default function PackageDeliverablePreview({ packageItem }: { packageItem: RepWatchrPackage }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.09)] sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Example deliverable outline</p>
      <div className="mt-5 grid gap-3">
        {packageItem.deliverableOutline.map((item, index) => (
          <div
            key={item}
            className="group grid grid-cols-[2.75rem_1fr] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-950 text-sm font-black text-white shadow-[0_0_22px_rgba(30,64,175,0.24)]">
              {index + 1}
            </span>
            <span className="text-sm font-black text-slate-900">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
