import { sourceConfidenceTone, type SourceConfidenceLabelValue } from "@/lib/trust-safety";

export default function SourceConfidenceLabel({
  label,
  className = "",
}: {
  label: SourceConfidenceLabelValue;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${sourceConfidenceTone(label)} ${className}`}
    >
      {label}
    </span>
  );
}
