import type { SchoolBoardScoreResult, ScoreContribution } from "@/lib/school-board-scoring";

interface WhyThisScoreProps {
  score: SchoolBoardScoreResult;
}

const SEVERITY_COLOR: Record<ScoreContribution["severity"], string> = {
  critical: "bg-red-700 text-white",
  high: "bg-red-600 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-blue-600 text-white",
};

function formatCategory(cat: string): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDelta(delta: number, direction: ScoreContribution["direction"]): string {
  if (delta === 0) return "0 (informational)";
  const sign = direction === "positive" ? "+" : direction === "negative" ? "-" : "±";
  return `${sign}${Math.abs(delta)} pts`;
}

export default function WhyThisScore({ score }: WhyThisScoreProps) {
  const { contributions, score: finalScore, grade, hasNoScoreMovingEvidence, praiseWiped, overrideReason } = score;
  const positives = contributions.filter((c) => c.direction === "positive" && c.delta !== 0);
  const negatives = contributions.filter((c) => c.direction === "negative" && c.delta !== 0);
  const neutrals = contributions.filter((c) => c.delta === 0);

  return (
    <details className="group rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between text-left">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Algorithm transparency</p>
          <h3 className="mt-1 text-base font-black text-blue-950">
            Why this score? ({grade === "Pending" ? "Pending - see below" : `${finalScore}, grade ${grade}`})
          </h3>
          <p className="mt-1 text-xs font-semibold text-blue-900/70">
            Every score-moving evidence item, with its weight, source, and any fairness adjustment. Click to open.
          </p>
        </div>
        <span className="text-sm font-bold text-blue-700 group-open:hidden">Open &rarr;</span>
        <span className="hidden text-sm font-bold text-blue-700 group-open:inline">Close</span>
      </summary>

      <div className="mt-5 border-t border-blue-200 pt-5">
        {hasNoScoreMovingEvidence ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            No score-moving evidence has been loaded yet. Every category sits at the neutral baseline (50). The grade stays
            <strong> Pending</strong> until at least one sourced positive or negative item is added.
          </div>
        ) : null}

        {praiseWiped ? (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4">
            <p className="text-sm font-black text-red-900">Hard override active</p>
            <p className="mt-1 text-sm leading-6 text-red-800">{overrideReason}</p>
            <p className="mt-2 text-xs font-bold text-red-900/80">
              Hard overrides only apply to documented child-safety, parent-rights, or sex-based privacy violations.
            </p>
          </div>
        ) : null}

        {negatives.length > 0 ? (
          <ContributionGroup
            title="What is pulling the score down"
            tone="negative"
            contributions={negatives}
          />
        ) : null}

        {positives.length > 0 ? (
          <ContributionGroup
            title="What is pulling the score up"
            tone="positive"
            contributions={positives}
          />
        ) : null}

        {neutrals.length > 0 ? (
          <ContributionGroup
            title="Recorded but informational only"
            tone="neutral"
            contributions={neutrals}
          />
        ) : null}

        <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4 text-xs leading-6 text-blue-900">
          <p className="font-black uppercase tracking-wide text-blue-700">Fairness rules currently active</p>
          <ul className="mt-2 space-y-1.5">
            <li>· Conflict-of-interest items (family employment, vendor ties, disclosure questions) are scored under <strong>transparency</strong>, not <strong>faith and family alignment</strong>.</li>
            <li>· Extended-family ecosystem connections (sibling, cousin, in-law, etc.) cap at <strong>low</strong> severity unless evidence shows failure to disclose under TX Local Government Code Ch. 171 or failure to recuse on a relevant vote.</li>
            <li>· Household conflicts (spouse / partner / dependent on payroll) keep their recorded severity because the financial nexus is direct.</li>
            <li>· Hard overrides only apply to documented child-safety, parent-rights, or sex-based privacy violations with FACT or DOCUMENTED_INFERENCE labels.</li>
          </ul>
          <p className="mt-3">
            See something that looks unfair? Use the public discussion below this profile or the report button at the top to flag it. Sourced corrections will update the dossier and the score.
          </p>
        </div>
      </div>
    </details>
  );
}

function ContributionGroup({
  title,
  tone,
  contributions,
}: {
  title: string;
  tone: "positive" | "negative" | "neutral";
  contributions: ScoreContribution[];
}) {
  const toneClass = {
    positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
    negative: "border-red-200 bg-red-50 text-red-900",
    neutral: "border-gray-200 bg-gray-50 text-gray-900",
  }[tone];
  return (
    <div className={`mb-4 rounded-xl border p-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-wide">{title}</p>
      <ul className="mt-3 space-y-3">
        {contributions.map((c) => (
          <li key={c.evidenceId} className="rounded-lg bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-black uppercase tracking-wide ${SEVERITY_COLOR[c.severity]}`}>
                {c.severity}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-700">{formatCategory(c.category)}</span>
              <span className="text-xs font-black text-gray-700">{formatDelta(c.delta, c.direction)}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-800">{c.summary}</p>
            {c.fairnessNote ? (
              <p className="mt-2 rounded-md border-l-4 border-blue-400 bg-blue-50 p-2 text-xs font-semibold leading-5 text-blue-900">
                Fairness note: {c.fairnessNote}
              </p>
            ) : null}
            {c.source_url ? (
              <a
                href={c.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                Source &rarr;
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
