import type { CorrectionStatus } from "@/lib/trust-safety";

const toneByStatus: Record<CorrectionStatus, string> = {
  new: "border-blue-200 bg-blue-50 text-blue-800",
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  needs_more_info: "border-amber-200 bg-amber-50 text-amber-800",
  attached_source: "border-emerald-200 bg-emerald-50 text-emerald-800",
  entity_updated: "border-emerald-200 bg-emerald-50 text-emerald-800",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  archived: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function CorrectionStatusBadge({
  status,
  className = "",
}: {
  status: CorrectionStatus | string;
  className?: string;
}) {
  const key = status as CorrectionStatus;
  const tone = toneByStatus[key] ?? "border-slate-200 bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${tone} ${className}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
