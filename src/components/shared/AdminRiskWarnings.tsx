import type { TrustSafetyWarning } from "@/lib/trust-safety";

export default function AdminRiskWarnings({ warnings }: { warnings: TrustSafetyWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
      <p className="text-xs font-black uppercase tracking-wide text-amber-900">Review language before publishing</p>
      <ul className="mt-2 space-y-1">
        {warnings.map((warning) => (
          <li key={`${warning.id}-${warning.matchedText ?? "match"}`}>
            <span className={warning.severity === "block" ? "font-black text-red-800" : "font-black"}>
              {warning.label}
            </span>
            {warning.matchedText ? `: "${warning.matchedText}"` : ""} - {warning.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}

