import Link from "next/link";
import type { RepWatchrPackage } from "@/data/repwatchr-packages";

export default function FreeToolCrossSell({ packageItem }: { packageItem: RepWatchrPackage }) {
  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-[0_18px_55px_rgba(30,64,175,0.10)] sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-900">Start free first</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-blue-950">
        Build a source signal before you ask for a package.
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {packageItem.relatedTools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-2xl border border-blue-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
          >
            <span className="text-sm font-black text-blue-950">{tool.label}</span>
            <span className="mt-2 block text-sm font-semibold leading-6 text-slate-700">{tool.summary}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
