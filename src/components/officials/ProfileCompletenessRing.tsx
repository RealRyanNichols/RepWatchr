type ProfileCompletenessRingProps = {
  percent: number;
  label?: string;
  confidenceLabel?: string;
};

export default function ProfileCompletenessRing({
  percent,
  label = "Profile completeness",
  confidenceLabel,
}: ProfileCompletenessRingProps) {
  const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent)));
  const degrees = Math.round((normalizedPercent / 100) * 360);

  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-white/20 shadow-2xl shadow-blue-950/40"
        style={{
          background: `conic-gradient(#60a5fa ${degrees}deg, rgba(255,255,255,0.14) ${degrees}deg)`,
        }}
        aria-label={`${label}: ${normalizedPercent}%`}
      >
        <div className="grid h-[4.85rem] w-[4.85rem] place-items-center rounded-full bg-slate-950/95 text-center ring-1 ring-white/10">
          <span className="text-2xl font-black text-white">{normalizedPercent}%</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/80">
          {label}
        </p>
        {confidenceLabel ? (
          <p className="mt-1 text-sm font-black uppercase tracking-wide text-white">
            {confidenceLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
