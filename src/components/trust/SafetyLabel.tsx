import { safetyLabelTone, type SafetyLabelValue } from "@/lib/trust-safety";

export default function SafetyLabel({ label, className = "" }: { label: SafetyLabelValue; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${safetyLabelTone(label)} ${className}`}
    >
      {label}
    </span>
  );
}
