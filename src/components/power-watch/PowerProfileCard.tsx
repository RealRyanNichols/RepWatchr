import Link from "next/link";
import type { PublicPowerProfile } from "@/types/power-watch";
import PowerProfileAvatar from "@/components/power-watch/PowerProfileAvatar";

interface PowerProfileCardProps {
  profile: PublicPowerProfile;
  basePath: "/attorneys" | "/media" | "/public-safety";
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
  const topChecks = profile.scrutinyAreas.slice(0, 2);

  return (
    <Link
      href={`${basePath}/${profile.slug}`}
      className="rw-card group flex h-full min-w-0 flex-col overflow-hidden rounded-xl p-4 transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <PowerProfileAvatar profile={profile} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-700">
              {profile.categoryLabel}
            </p>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-950">
              {statusLabel(profile.profileStatus)}
            </span>
          </div>
          <h3 className="mt-1 break-words text-base font-black leading-tight text-slate-950 group-hover:text-blue-800 sm:text-lg">
            {profile.name}
          </h3>
          {profile.profileImageSource ? (
            <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Image: {profile.profileImageSource}
            </p>
          ) : null}
        </div>
      </div>

      {profile.watchMark ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-700 text-lg font-black leading-none text-white">
              *
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-800">
                {profile.watchMark.label}
              </p>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-red-950">
                {profile.watchMark.reason}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-600">
        {profile.summary}
      </p>

      <div className="rw-card-blue mt-3 rounded-xl p-3">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Why it is here</p>
        <p className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-slate-700">{profile.whyTracked}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[profile.city, profile.county ? `${profile.county} County` : undefined, profile.region]
          .filter(Boolean)
          .map((item) => (
            <span key={item} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-900">
              {item}
            </span>
          ))}
      </div>

      {topChecks.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topChecks.map((item) => (
            <span key={item} className="rounded-full border border-slate-300 bg-[#f8fbff] px-2.5 py-1 text-[11px] font-black capitalize text-slate-700">
              {item}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#b42318,#1d4ed8)]"
            style={{ width: `${Math.min(100, Math.max(0, profile.buildoutPercent))}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] font-bold text-slate-500">
          {profile.buildoutPercent}% profile buildout / {profile.sourceLinks.length} source{profile.sourceLinks.length === 1 ? "" : "s"}
        </p>
      </div>

      <p className="mt-auto pt-4 text-xs font-black uppercase tracking-wide text-blue-700">
        Open profile
      </p>
    </Link>
  );
}
