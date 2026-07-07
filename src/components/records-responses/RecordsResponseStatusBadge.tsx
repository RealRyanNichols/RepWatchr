import { responseStatusLabel, type RecordsSensitivityStatus } from "@/lib/records-response-intake";

const sensitivityTone: Record<RecordsSensitivityStatus, string> = {
  needs_review: "border-amber-200 bg-amber-50 text-amber-950",
  safe_public_record: "border-emerald-200 bg-emerald-50 text-emerald-950",
  contains_private_info: "border-orange-200 bg-orange-50 text-orange-950",
  redaction_needed: "border-red-200 bg-red-50 text-red-950",
  do_not_publish: "border-slate-300 bg-slate-100 text-slate-950",
  published_summary_only: "border-blue-200 bg-blue-50 text-blue-950",
};

export default function RecordsResponseStatusBadge({
  status,
  sensitivityStatus,
}: {
  status?: string | null;
  sensitivityStatus?: string | null;
}) {
  const sensitivity = (sensitivityStatus || "needs_review") as RecordsSensitivityStatus;
  const tone = sensitivityTone[sensitivity] ?? sensitivityTone.needs_review;

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${tone}`}>
      {responseStatusLabel(status || "new")} / {responseStatusLabel(sensitivity)}
    </span>
  );
}
