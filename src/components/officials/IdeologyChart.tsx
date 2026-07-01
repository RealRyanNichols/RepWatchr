import type { OfficialIdeologyProfile } from "@/types";

function clampPercent(score: number | null): number {
  if (score === null) return 50;
  return Math.max(0, Math.min(100, (score + 100) / 2));
}

function formatScore(score: number | null): string {
  if (score === null) return "Center pending";
  if (score === 0) return "Center";
  return `${score > 0 ? "Right" : "Left"} ${Math.abs(score)}`;
}

function statusLabel(value: boolean): string {
  return value ? "Loaded" : "Missing";
}

function statusClass(value: boolean): string {
  return value
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

export default function IdeologyChart({
  profile,
  publicVoteCount = 0,
  publicVoteSession,
  completionPercent,
}: {
  profile: OfficialIdeologyProfile;
  publicVoteCount?: number;
  publicVoteSession?: string;
  completionPercent?: number;
}) {
  const markerPercent = clampPercent(profile.ideologyScore);
  const hasVotePosition = profile.ideologyScore !== null;
  const hasPublicVoteGap = publicVoteCount > profile.mappedVoteCount;
  const displayedCompletionPercent = completionPercent ?? profile.buildout.completionPercent;
  const headline = hasPublicVoteGap ? "Reviewed vote subset - full mapping needed" : profile.ideologyLabel;
  const scoreLabel = hasPublicVoteGap ? `Subset ${formatScore(profile.ideologyScore)}` : formatScore(profile.ideologyScore);
  const confidenceLabel = hasPublicVoteGap ? "mapping incomplete" : `${profile.confidence} confidence`;
  const mappedCoverageLabel = publicVoteCount > 0
    ? `${profile.mappedVoteCount}/${publicVoteCount} public roll-call rows mapped to the left/right axis`
    : `${profile.mappedVoteCount}/${profile.totalScorecardVotes} scorecard votes mapped to the left/right axis`;
  const buildoutItems = [
    ["Photo", profile.buildout.hasPhoto],
    ["Bio", profile.buildout.hasBio],
    ["Sources", profile.buildout.hasPublicSources],
    ["Website", profile.buildout.hasContactWebsite],
    ["Scorecard", profile.buildout.hasScorecard],
    ["Votes", profile.buildout.hasVoteRecord],
    ["Funding", profile.buildout.hasFundingSummary],
    ["Red-flag review", profile.buildout.hasRedFlagReview],
  ] as const;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Vote-weighted left/right chart</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{headline}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {profile.basis}
          </p>
          {publicVoteSession ? (
            <p className="mt-2 text-xs font-black uppercase tracking-wide text-slate-500">
              Vote file: {publicVoteSession}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-2xl font-black text-slate-950">{scoreLabel}</p>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{confidenceLabel}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-500">
          <span>Left voting record</span>
          <span>Center / not enough data</span>
          <span>Right voting record</span>
        </div>
        <div className="relative mt-3 h-4 rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#e5e7eb_50%,#dc2626_100%)]">
          <span
            className={`absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white shadow ${hasVotePosition && !hasPublicVoteGap ? "bg-slate-950" : "bg-amber-500"}`}
            style={{ left: `${markerPercent}%` }}
            aria-label={`Ideology marker: ${scoreLabel}`}
          />
        </div>
        <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-3">
          <span>{profile.leftVoteCount} left-coded vote{profile.leftVoteCount === 1 ? "" : "s"}</span>
          <span>{profile.centerVoteCount} center/non-directional vote{profile.centerVoteCount === 1 ? "" : "s"}</span>
          <span>{profile.rightVoteCount} right-coded vote{profile.rightVoteCount === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Master profile buildout</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {displayedCompletionPercent}% complete from the current public data files.
            </p>
          </div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {mappedCoverageLabel}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-slate-950"
            style={{ width: `${Math.max(0, Math.min(100, displayedCompletionPercent))}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {buildoutItems.map(([label, value]) => (
            <div key={label} className={`rounded-lg border px-3 py-2 text-xs font-black ${statusClass(value)}`}>
              {label}: {statusLabel(value)}
            </div>
          ))}
        </div>
        {profile.buildout.missingItems.length > 0 ? (
          <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">
            Missing next: {profile.buildout.missingItems.slice(0, 6).join(", ")}
            {profile.buildout.missingItems.length > 6 ? "." : ""}
          </p>
        ) : null}
        {hasPublicVoteGap ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
            Vote rows are loaded, but the chart only moves after a reviewed issue rule maps that roll call left,
            right, or center. This keeps RepWatchr from turning raw votes into fake certainty.
          </div>
        ) : null}
      </div>

      {profile.evidence.length > 0 ? (
        <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-black text-slate-950">
            Open vote-axis evidence ({profile.evidence.length})
          </summary>
          <div className="mt-3 space-y-2">
            {profile.evidence.slice(0, 8).map((vote) => (
              <div key={`${vote.billId}-${vote.date}-${vote.category}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-black text-slate-950">{vote.billTitle}</p>
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    {vote.direction} {vote.impact > 0 ? "+" : ""}{vote.impact}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Voted {vote.officialVote}. {vote.rationale}
                </p>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
