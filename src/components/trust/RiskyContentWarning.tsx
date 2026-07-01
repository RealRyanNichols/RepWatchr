import type { SafetyFlag } from "@/lib/trust-safety";

export default function RiskyContentWarning({
  flags,
  suggestedLanguage,
}: {
  flags: SafetyFlag[];
  suggestedLanguage?: string;
}) {
  if (!flags.length) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-black uppercase tracking-wide text-amber-800">Safety review needed</p>
      <div className="mt-3 grid gap-2">
        {flags.map((flag) => (
          <div key={flag.key} className="rounded-xl border border-amber-200 bg-white/70 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black uppercase text-amber-800">
                {flag.severity}
              </span>
              <span className="font-black text-slate-950">{flag.label}</span>
            </div>
            <p className="mt-1 font-semibold leading-5 text-slate-700">{flag.message}</p>
          </div>
        ))}
      </div>
      {suggestedLanguage ? (
        <p className="mt-3 rounded-xl bg-white p-3 font-semibold leading-6 text-slate-800">
          Safer wording: {suggestedLanguage}
        </p>
      ) : null}
    </div>
  );
}
