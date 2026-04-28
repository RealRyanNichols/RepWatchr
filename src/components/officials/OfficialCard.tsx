import Link from "next/link";
import Image from "next/image";
import type { Official, ScoreCard } from "@/types";
import PartyBadge from "@/components/officials/PartyBadge";
import LetterGradeBadge from "@/components/scores/LetterGradeBadge";

const partyAccent: Record<string, string> = {
  R: "from-red-500",
  D: "from-blue-500",
  I: "from-purple-500",
  NP: "from-gray-400",
  VR: "from-red-400",
  VD: "from-blue-400",
};

interface OfficialCardProps {
  official: Official;
  scoreCard?: ScoreCard;
}

export default function OfficialCard({
  official,
  scoreCard,
}: OfficialCardProps) {
  const accent = partyAccent[official.party] ?? "from-gray-400";
  const initials = `${official.firstName[0] ?? ""}${official.lastName[0] ?? ""}`;

  return (
    <Link
      href={`/officials/${official.id}`}
      className="group relative block rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {/* Top accent bar */}
      <div
        className={`h-1 w-full bg-gradient-to-r ${accent} to-transparent`}
      />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100 text-base font-bold text-gray-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
              {official.photo ? (
                <Image
                  src={official.photo}
                  alt={`${official.name} profile photo`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {official.name}
              </h3>
              <p className="text-sm text-gray-500">
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
        <div className="mt-4 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <PartyBadge party={official.party} />
            <span className="truncate text-xs text-gray-500">
              {official.jurisdiction}
            </span>
          </div>
          <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            View Profile &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
