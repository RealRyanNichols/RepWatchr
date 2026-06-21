type VisualVariant =
  | "race"
  | "county"
  | "district"
  | "story"
  | "school"
  | "service"
  | "funding"
  | "vote";

type RecordVisualMetric = {
  label: string;
  value: string | number;
};

type RecordVisualProps = {
  eyebrow: string;
  title: string;
  label?: string;
  variant?: VisualVariant;
  metric?: RecordVisualMetric;
  secondaryMetric?: RecordVisualMetric;
  compact?: boolean;
  className?: string;
};

type SourceNeededAvatarProps = {
  name: string;
  label?: string;
  className?: string;
};

const variantStyles: Record<VisualVariant, {
  shell: string;
  badge: string;
  bar: string;
  dot: string;
}> = {
  race: {
    shell: "from-blue-950 via-blue-900 to-red-800",
    badge: "bg-white text-blue-950",
    bar: "bg-[#d6b35a]",
    dot: "bg-red-500",
  },
  county: {
    shell: "from-slate-950 via-blue-950 to-emerald-800",
    badge: "bg-emerald-50 text-emerald-900",
    bar: "bg-emerald-300",
    dot: "bg-[#d6b35a]",
  },
  district: {
    shell: "from-blue-950 via-slate-900 to-sky-800",
    badge: "bg-sky-50 text-blue-950",
    bar: "bg-sky-300",
    dot: "bg-red-500",
  },
  story: {
    shell: "from-slate-950 via-slate-900 to-blue-900",
    badge: "bg-amber-100 text-amber-950",
    bar: "bg-red-500",
    dot: "bg-[#d6b35a]",
  },
  school: {
    shell: "from-[#06172f] via-[#0b2a55] to-[#7a1d1d]",
    badge: "bg-[#f8d884] text-[#06172f]",
    bar: "bg-[#f8d884]",
    dot: "bg-red-500",
  },
  service: {
    shell: "from-blue-950 via-slate-900 to-indigo-800",
    badge: "bg-white text-blue-950",
    bar: "bg-blue-300",
    dot: "bg-[#d6b35a]",
  },
  funding: {
    shell: "from-slate-950 via-emerald-950 to-blue-900",
    badge: "bg-emerald-50 text-emerald-950",
    bar: "bg-emerald-300",
    dot: "bg-red-500",
  },
  vote: {
    shell: "from-red-800 via-slate-950 to-blue-900",
    badge: "bg-white text-red-800",
    bar: "bg-red-400",
    dot: "bg-blue-300",
  },
};

function clampTitle(title: string) {
  return title.length > 62 ? `${title.slice(0, 59)}...` : title;
}

function metricValue(value: string | number) {
  return typeof value === "number" ? value.toLocaleString() : value;
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function SourceNeededAvatar({
  name,
  label = "Photo source needed",
  className = "",
}: SourceNeededAvatarProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#e0e7ff)] ${className}`}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#bf0d3e,#d6b35a,#1d4ed8)]" />
      <div className="grid h-full min-h-[72px] place-items-center p-2 text-center">
        <div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white bg-blue-950 text-sm font-black text-white shadow-sm">
            {getInitials(name) || "?"}
          </div>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RecordVisual({
  eyebrow,
  title,
  label = "Search. Grade. Source. Share.",
  variant = "story",
  metric,
  secondaryMetric,
  compact = false,
  className = "",
}: RecordVisualProps) {
  const styles = variantStyles[variant];
  const bars = compact ? [44, 70, 58, 82] : [36, 64, 48, 78, 56];

  return (
    <div
      className={`relative isolate overflow-hidden rounded-lg bg-gradient-to-br ${styles.shell} text-white shadow-sm ${compact ? "min-h-[128px]" : "min-h-[172px]"} ${className}`}
    >
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[18px] border-white/10" />
      <div className="absolute bottom-4 right-4 flex h-20 w-20 items-center justify-center rounded-full border-[12px] border-white/15">
        <span className={`h-3 w-3 rounded-full ${styles.dot}`} />
      </div>
      <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${styles.badge}`}>
              {eyebrow}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              {label}
            </span>
          </div>
          <h3 className={`${compact ? "mt-3 text-lg" : "mt-4 text-2xl"} max-w-[86%] font-black leading-tight text-white`}>
            {clampTitle(title)}
          </h3>
        </div>
        <div className="mt-4 grid gap-3">
          <div className="flex h-12 items-end gap-1.5">
            {bars.map((height, index) => (
              <span
                key={`${height}-${index}`}
                className={`w-full rounded-t-sm ${styles.bar}`}
                style={{ height: `${height}%`, opacity: 0.58 + index * 0.08 }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {metric ? (
              <div className="rounded-md border border-white/15 bg-white/10 px-2.5 py-2">
                <p className="text-lg font-black leading-none">{metricValue(metric.value)}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-white/70">{metric.label}</p>
              </div>
            ) : null}
            {secondaryMetric ? (
              <div className="rounded-md border border-white/15 bg-white/10 px-2.5 py-2">
                <p className="text-lg font-black leading-none">{metricValue(secondaryMetric.value)}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-white/70">{secondaryMetric.label}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
