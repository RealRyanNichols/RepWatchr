import type { RepWatchrPackage } from "@/data/repwatchr-packages";

const categoryLabels: Record<RepWatchrPackage["category"], string> = {
  one_time: "One-time packet",
  monitoring: "Monitoring concept",
  desk: "Research desk",
  data: "Future data product",
  partner: "Partner pipeline",
};

export default function PackageDemandBadge({ packageItem }: { packageItem: RepWatchrPackage }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100 shadow-[0_0_26px_rgba(34,211,238,0.15)]">
      <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
      {categoryLabels[packageItem.category]}
    </div>
  );
}
