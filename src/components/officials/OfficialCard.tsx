"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import type { Official, ScoreCard } from "@/types";
import PartyBadge from "@/components/officials/PartyBadge";
import LetterGradeBadge from "@/components/scores/LetterGradeBadge";
import OfficialPhotoImage from "@/components/shared/OfficialPhotoImage";

const partyAccent: Record<string, string> = {
  R: "from-red-700 via-red-500 to-amber-300",
  D: "from-blue-700 via-blue-500 to-sky-300",
  I: "from-purple-700 via-purple-500 to-amber-300",
  NP: "from-slate-600 via-slate-400 to-amber-300",
  VR: "from-red-700 via-orange-500 to-amber-300",
  VD: "from-blue-700 via-sky-500 to-amber-300",
};

function scoreTone(scoreCard?: ScoreCard) {
  if (!scoreCard) {
    return {
      shell: "border-blue-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef6ff_58%,#fff7ed_100%)] rw-source-glow",
      badge: "bg-blue-950 text-white",
      label: "Source review",
      sublabel: "Needs score",
      meter: "from-blue-700 to-amber-300",
    };
  }

  if (scoreCard.overall < 60) {
    return {
      shell: "border-red-300 bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_50%,#fff7ed_100%)] rw-bad-glow",
      badge: "bg-red-700 text-white",
      label: "Bad record",
      sublabel: `${scoreCard.letterGrade} / ${scoreCard.overall}`,
      meter: "from-red-700 to-orange-400",
    };
  }

  if (scoreCard.overall >= 80) {
    return {
      shell: "border-emerald-300 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_50%,#eff6ff_100%)] rw-good-glow",
      badge: "bg-emerald-700 text-white",
      label: "Strong record",
      sublabel: `${scoreCard.letterGrade} / ${scoreCard.overall}`,
      meter: "from-emerald-600 to-blue-500",
    };
  }

  return {
    shell: "border-amber-300 bg-[linear-gradient(135deg,#fffbeb_0%,#ffffff_52%,#eff6ff_100%)] rw-source-glow",
    badge: "bg-amber-500 text-blue-950",
    label: "Mixed record",
    sublabel: `${scoreCard.letterGrade} / ${scoreCard.overall}`,
    meter: "from-amber-500 to-blue-500",
  };
}

interface OfficialCardProps {
  official: Official;
  scoreCard?: ScoreCard;
}

export default function OfficialCard({
  official,
  scoreCard,
}: OfficialCardProps) {
  const accent = partyAccent[official.party] ?? "from-slate-600 via-slate-400 to-amber-300";
  const tone = scoreTone(scoreCard);
  const sourceCount = official.sourceLinks?.length ?? 0;
  const hasPhoto = Boolean(official.photo);

  return (
    <Link
      href={`/officials/${official.id}`}
      onClick={() =>
        track("official_profile_click", {
          profile_id: official.id,
          profile_name: official.name,
          level: official.level,
          party: official.party,
          path: `/officials/${official.id}`,
        })
      }
      className={`rw-shine-card group relative block overflow-hidden rounded-2xl border ${tone.shell} shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl`}
    >
      <div className={`h-2 w-full bg-gradient-to-r ${accent}`} />
      <div className="rw-party-wave absolute inset-x-0 top-2 h-24 opacity-70" />
      <div className="rw-shine-content p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`rw-pulse-ring relative flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 bg-slate-100 text-lg font-black text-slate-600 shadow-lg transition-colors group-hover:bg-blue-50 group-hover:text-blue-700 ${official.party === "D" || official.party === "VD" ? "border-blue-300" : official.party === "R" || official.party === "VR" ? "border-red-300" : "border-slate-300"}`}>
              <OfficialPhotoImage
                official={official}
                sizes="164px"
                className="object-cover transition duration-300 group-hover:scale-105"
                fallbackClassName="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(135deg,#0b2a55,#bf0d3e)] text-center text-xl font-black uppercase tracking-wide text-white"
              />
              <div className="absolute bottom-1 right-1 rounded-full border border-white bg-slate-950 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                {hasPhoto ? "Photo" : "ID"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <PartyBadge party={official.party} />
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${tone.badge}`}>
                  {tone.label}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-black leading-tight text-slate-950 transition-colors group-hover:text-blue-800">
                {official.name}
              </h3>
              <p className="mt-1 text-sm font-bold leading-5 text-slate-700">
                {official.position}
              </p>
            </div>
          </div>
          {scoreCard && (
            <div className="ml-3 shrink-0">
              <LetterGradeBadge grade={scoreCard.letterGrade} score={scoreCard.overall} />
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full bg-gradient-to-r ${tone.meter}`} style={{ width: `${scoreCard ? Math.max(8, scoreCard.overall) : Math.max(18, Math.min(100, sourceCount * 24))}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/70 bg-white/80 p-2 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">District</p>
              <p className="truncate text-xs font-black text-blue-950">{official.district ?? official.state ?? "Open"}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-2 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Sources</p>
              <p className="truncate text-xs font-black text-blue-950">{sourceCount}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-2 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Grade</p>
              <p className="truncate text-xs font-black text-blue-950">{tone.sublabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-3">
          <span className="min-w-0 truncate text-xs font-bold text-slate-600">
            {official.jurisdiction}
          </span>
          <span className="shrink-0 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white transition group-hover:bg-red-700">
            Open dossier
          </span>
        </div>
      </div>
    </Link>
  );
}
