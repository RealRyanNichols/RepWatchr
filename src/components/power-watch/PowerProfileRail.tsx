import Link from "next/link";
import type { PublicPowerProfile } from "@/types/power-watch";
import PowerProfileAvatar from "@/components/power-watch/PowerProfileAvatar";

interface PowerProfileRailProps {
  profiles: PublicPowerProfile[];
  basePath: "/attorneys" | "/media";
  kicker: string;
  title: string;
  detail: string;
}

export default function PowerProfileRail({
  profiles,
  basePath,
  kicker,
  title,
  detail,
}: PowerProfileRailProps) {
  const rows = profiles.length > 0 ? [...profiles, ...profiles] : [];

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{kicker}</p>
        <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="text-xs font-bold text-slate-500">{detail}</p>
        </div>
      </div>
      <div className="overflow-hidden px-3 sm:px-4">
        <div className="repwatchr-profile-marquee flex w-max gap-3 py-4">
          {rows.map((profile, index) => (
            <Link
              key={`${profile.slug}-${index}`}
              href={`${basePath}/${profile.slug}`}
              className="group flex min-w-[255px] items-center gap-3 rounded-full border border-slate-200 bg-slate-50 py-2 pl-2 pr-4 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
            >
              <PowerProfileAvatar profile={profile} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {profile.watchMark ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-700 text-sm font-black leading-none text-white">
                      *
                    </span>
                  ) : null}
                  <p className="truncate text-sm font-black text-slate-950 group-hover:text-blue-800">
                    {profile.name}
                  </p>
                </div>
                <p className="truncate text-[11px] font-bold text-slate-500">
                  {profile.categoryLabel} / {profile.city ?? profile.region}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
