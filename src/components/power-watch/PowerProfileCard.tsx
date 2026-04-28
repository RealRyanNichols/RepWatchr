import Link from "next/link";
import type { PublicPowerProfile } from "@/types/power-watch";

interface PowerProfileCardProps {
  profile: PublicPowerProfile;
  basePath: "/attorneys" | "/media";
}

function statusLabel(status: PublicPowerProfile["profileStatus"]) {
  switch (status) {
    case "source_seeded":
      return "Source seeded";
    case "needs_profile_buildout":
      return "Needs buildout";
    case "profiled":
      return "Profiled";
    case "needs_source_review":
      return "Needs review";
  }
}

export default function PowerProfileCard({ profile, basePath }: PowerProfileCardProps) {
  return (
    <Link
      href={`${basePath}/${profile.slug}`}
      className="group flex h-full flex-col rounded-xl border border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-700">
            {profile.categoryLabel}
          </p>
          <h3 className="mt-1 text-lg font-black leading-tight text-slate-950 group-hover:text-blue-800">
            {profile.name}
          </h3>
        </div>
        <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700">
          {statusLabel(profile.profileStatus)}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-650">
        {profile.summary}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[profile.city, profile.county ? `${profile.county} County` : undefined, profile.region]
          .filter(Boolean)
          .map((item) => (
            <span key={item} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-900">
              {item}
            </span>
          ))}
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#b42318,#1d4ed8)]"
            style={{ width: `${Math.min(100, Math.max(0, profile.buildoutPercent))}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] font-bold text-slate-500">
          {profile.buildoutPercent}% profile buildout
        </p>
      </div>

      <p className="mt-auto pt-4 text-xs font-black uppercase tracking-wide text-blue-700">
        Open profile
      </p>
    </Link>
  );
}
