import { getContentLabel, type ContentLabelId, type TrustLabelTone } from "@/lib/trust-safety";

const toneClass: Record<TrustLabelTone, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  red: "border-red-200 bg-red-50 text-red-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function TrustLabel({ id, className = "" }: { id: ContentLabelId | string; className?: string }) {
  const label = getContentLabel(id);

  return (
    <span
      title={label.description}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${toneClass[label.tone]} ${className}`}
    >
      {label.label}
    </span>
  );
}

