import Link from "next/link";
import type { GovernmentLevel, Party } from "@/types";
import OfficialPhotoImage from "@/components/shared/OfficialPhotoImage";
import PartyBadge from "@/components/officials/PartyBadge";
import { formatLevelName } from "@/lib/formatting";

export type RelatedProfileCardRecord = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  photo?: string;
  party: Party;
  level: GovernmentLevel;
  position: string;
  jurisdiction: string;
  district?: string;
  reason: string;
};

type RelatedProfileCardProps = {
  profile: RelatedProfileCardRecord;
};

export default function RelatedProfileCard({ profile }: RelatedProfileCardProps) {
  return (
    <Link
      href={`/officials/${profile.id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
    >
      <div className="relative flex gap-4 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-200">
          <OfficialPhotoImage
            official={profile}
            sizes="80px"
            className="object-cover transition duration-300 group-hover:scale-105"
            fallbackClassName="grid h-full w-full place-items-center text-center text-xl font-black uppercase tracking-wide text-slate-600"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-1 text-base font-black text-slate-950 group-hover:text-blue-700">
              {profile.name}
            </h3>
            <PartyBadge party={profile.party} />
          </div>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">
            {profile.position}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
            {profile.district ? `${profile.district} | ` : ""}
            {profile.jurisdiction} | {formatLevelName(profile.level)}
          </p>
          <p className="mt-2 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-800">
            {profile.reason}
          </p>
        </div>
      </div>
    </Link>
  );
}
