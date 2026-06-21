import Link from "next/link";
import type { ConstitutionalAlignmentProfile } from "@/types";

function markerPercent(score: number | null): number {
  if (score === null) return 50;
  return Math.max(0, Math.min(100, score));
}

function scoreText(score: number | null): string {
  return score === null ? "Review" : `${score}%`;
}

function confidenceClass(confidence: ConstitutionalAlignmentProfile["confidence"]): string {
  if (confidence === "high") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (confidence === "medium") return "border-blue-200 bg-blue-50 text-blue-800";
  if (confidence === "low") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function statusClass(status: string): string {
  if (status === "scored") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "needs-policy-review") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function dimensionWidth(score: number | null): string {
  return `${Math.max(4, Math.min(100, score ?? 4))}%`;
}

export default function ConstitutionalAlignmentMeter({
  profile,
}: {
  profile: ConstitutionalAlignmentProfile;
}) {
  const scoredEvidence = profile.evidence.filter((item) => item.reviewStatus === "scored");
  const reviewEvidence = profile.evidence.filter((item) => item.reviewStatus !== "scored");
  const hasThinEvidence =
    profile.confidence === "none" ||
    profile.confidence === "low" ||
    profile.scoredVoteCount < 3;
  const displayScore = hasThinEvidence ? "Review" : scoreText(profile.score);
  const markerPosition = hasThinEvidence ? 50 : markerPercent(profile.score);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Constitutional alignment meter
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{profile.label}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {profile.basis}
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-3xl font-black text-slate-950">{displayScore}</p>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {profile.confidence} confidence
          </p>
        </div>
      </div>

      {hasThinEvidence ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-950">
            Do not read this as a final constitutional grade yet.
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">
            {profile.scoredVoteCount} of {profile.totalVotesLoaded} loaded votes are currently scored by reviewed constitutional rules.
            The unreviewed votes stay visible below, but they do not move this meter until a human policy rule is added.
            Current scored sample: {scoreText(profile.score)}.
          </p>
        </div>
      ) : null}

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-500">
          <span>Needs scrutiny</span>
          <span>Mixed / review</span>
          <span>Aligned</span>
        </div>
        <div className="relative mt-3 h-4 rounded-full bg-[linear-gradient(90deg,#dc2626_0%,#f59e0b_50%,#059669_100%)]">
          <span
            className={`absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white shadow ${hasThinEvidence || profile.score === null ? "bg-amber-500" : "bg-slate-950"}`}
            style={{ left: `${markerPosition}%` }}
            aria-label={`Constitutional alignment marker: ${displayScore}`}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Metric label="Votes loaded" value={profile.totalVotesLoaded} />
        <Metric label="Scored" value={profile.scoredVoteCount} />
        <Metric label="Needs review" value={profile.reviewVoteCount} />
        <Metric label="Not scoreable" value={profile.notScoreableVoteCount} />
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Rubric dimensions</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
              Only reviewed issue rules move these bars. Broad bills and procedural votes wait for source review.
            </p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${confidenceClass(profile.confidence)}`}>
            {profile.confidence}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {profile.dimensions.map((dimension) => (
            <div key={dimension.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950">{dimension.name}</p>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  {dimension.score === null ? "Pending" : `${dimension.score}%`}
                </p>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${dimension.score === null ? "bg-slate-300" : "bg-slate-950"}`}
                  style={{ width: dimensionWidth(dimension.score) }}
                />
              </div>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                {dimension.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-slate-950">
          Open constitutional vote evidence ({profile.evidence.length})
        </summary>
        <div className="mt-3 space-y-2">
          {[...scoredEvidence, ...reviewEvidence].slice(0, 10).map((vote) => (
            <a
              key={`${vote.sourceId}-${vote.reviewStatus}`}
              href={vote.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusClass(vote.reviewStatus)}`}>
                      {vote.reviewStatus.replace(/-/g, " ")}
                    </span>
                    {vote.reviewStatus === "scored" ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-700">
                        pro-constitutional: {vote.constitutionalPosition}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-black text-slate-950">{vote.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Voted {vote.voteCast}. {vote.rationale}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
                  {vote.date}
                </span>
              </div>
            </a>
          ))}
        </div>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href="/methodology#constitutional-alignment"
          className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-800 hover:bg-blue-100"
        >
          Read methodology
        </Link>
        {profile.sourceLinks.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700 hover:bg-slate-100"
          >
            {source.title}
          </a>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
