"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import {
  getProfileScorecardLabel,
  type ProfileScorecardTargetType,
} from "@/lib/universal-scorecards";
import { repwatchrFeatureFlags } from "@/lib/repwatchr-feature-flags";

type Grade = "A" | "B" | "C" | "D" | "F";
type VoterScope = "in_district" | "in_state" | "out_of_district" | "out_of_state" | "verified_unknown";
type VoteAgain = "yes" | "no" | "unsure" | "not_eligible";
type LastVoteChoice = "voted_for" | "voted_against" | "did_not_vote" | "not_eligible" | "prefer_not_to_say";
type ApprovalAfterVote = "approve" | "disapprove" | "mixed" | "not_applicable";

type SummaryRow = {
  target_type: ProfileScorecardTargetType;
  target_id: string;
  total_votes: number;
  a_count: number;
  b_count: number;
  c_count: number;
  d_count: number;
  f_count: number;
  average_score: number | null;
};

type MyVoteRow = {
  grade: Grade;
  rationale: string | null;
  voter_scope?: VoterScope | null;
  would_vote_again?: VoteAgain | null;
  voted_for_last_time?: LastVoteChoice | null;
  approval_after_vote?: ApprovalAfterVote | null;
  top_issue?: string | null;
};

type ScopeSummaryRow = SummaryRow & {
  voter_scope: VoterScope;
};

type ProfileScorecardVoteProps = {
  targetType: ProfileScorecardTargetType;
  targetId: string;
  targetName: string;
  targetPath: string;
  officialState?: string;
  officialDistrict?: string;
  officialCounties?: string[];
  compact?: boolean;
};

const gradeScores: Record<Grade, number> = {
  A: 100,
  B: 80,
  C: 60,
  D: 40,
  F: 0,
};

const gradeLabels: Record<Grade, string> = {
  A: "Strong record",
  B: "Good record",
  C: "Mixed record",
  D: "Concerning record",
  F: "Failing record",
};

const gradeColors: Record<Grade, string> = {
  A: "bg-emerald-600",
  B: "bg-lime-600",
  C: "bg-amber-500",
  D: "bg-orange-600",
  F: "bg-red-600",
};

const grades: Grade[] = ["A", "B", "C", "D", "F"];

const scopeLabels: Record<VoterScope, string> = {
  in_district: "In-district constituent",
  in_state: "In-state constituent",
  out_of_district: "Out-of-district voter",
  out_of_state: "Out-of-state voter",
  verified_unknown: "Verified resident",
};

const voteAgainLabels: Record<VoteAgain, string> = {
  yes: "Yes",
  no: "No",
  unsure: "Unsure",
  not_eligible: "Not eligible",
};

const lastVoteLabels: Record<LastVoteChoice, string> = {
  voted_for: "I voted for this official",
  voted_against: "I voted against this official",
  did_not_vote: "I did not vote in that race",
  not_eligible: "I was not eligible",
  prefer_not_to_say: "Prefer not to say",
};

const approvalAfterVoteLabels: Record<ApprovalAfterVote, string> = {
  approve: "I like what they are doing",
  disapprove: "I do not like what they are doing",
  mixed: "Mixed / depends on the issue",
  not_applicable: "Not applicable",
};

function averageToGrade(score: number | null | undefined): string {
  if (score === null || score === undefined) return "-";
  if (score >= 90) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

function applySummaryChange(
  row: SummaryRow | null,
  targetType: ProfileScorecardTargetType,
  targetId: string,
  previousGrade: Grade | null,
  nextGrade: Grade | null,
): SummaryRow {
  const next: SummaryRow = row
    ? { ...row }
    : {
        target_type: targetType,
        target_id: targetId,
        total_votes: 0,
        a_count: 0,
        b_count: 0,
        c_count: 0,
        d_count: 0,
        f_count: 0,
        average_score: null,
      };

  const countKeys: Record<Grade, keyof Pick<SummaryRow, "a_count" | "b_count" | "c_count" | "d_count" | "f_count">> = {
    A: "a_count",
    B: "b_count",
    C: "c_count",
    D: "d_count",
    F: "f_count",
  };

  if (previousGrade) {
    const key = countKeys[previousGrade];
    next[key] = Math.max(0, next[key] - 1);
    next.total_votes = Math.max(0, next.total_votes - 1);
  }

  if (nextGrade) {
    const key = countKeys[nextGrade];
    next[key] += 1;
    next.total_votes += 1;
  }

  if (next.total_votes === 0) {
    next.average_score = null;
    return next;
  }

  const totalScore =
    next.a_count * gradeScores.A +
    next.b_count * gradeScores.B +
    next.c_count * gradeScores.C +
    next.d_count * gradeScores.D +
    next.f_count * gradeScores.F;
  next.average_score = Math.round((totalScore / next.total_votes) * 10) / 10;
  return next;
}

function combineScopeRows(rows: ScopeSummaryRow[], scopes: VoterScope[]): SummaryRow | null {
  const matching = rows.filter((row) => scopes.includes(row.voter_scope));
  if (matching.length === 0) return null;

  const combined = matching.reduce<SummaryRow>(
    (acc, row) => ({
      target_type: row.target_type,
      target_id: row.target_id,
      total_votes: acc.total_votes + row.total_votes,
      a_count: acc.a_count + row.a_count,
      b_count: acc.b_count + row.b_count,
      c_count: acc.c_count + row.c_count,
      d_count: acc.d_count + row.d_count,
      f_count: acc.f_count + row.f_count,
      average_score: null,
    }),
    {
      target_type: matching[0].target_type,
      target_id: matching[0].target_id,
      total_votes: 0,
      a_count: 0,
      b_count: 0,
      c_count: 0,
      d_count: 0,
      f_count: 0,
      average_score: null,
    },
  );

  if (combined.total_votes === 0) return combined;
  const totalScore =
    combined.a_count * gradeScores.A +
    combined.b_count * gradeScores.B +
    combined.c_count * gradeScores.C +
    combined.d_count * gradeScores.D +
    combined.f_count * gradeScores.F;
  combined.average_score = Math.round((totalScore / combined.total_votes) * 10) / 10;
  return combined;
}

function GradeBars({ row, compact }: { row: SummaryRow | null; compact?: boolean }) {
  if (!row || row.total_votes === 0) {
    return <p className="text-xs font-semibold text-slate-500">No verified scorecard votes yet.</p>;
  }

  const counts: Array<{ grade: Grade; count: number }> = [
    { grade: "A", count: row.a_count },
    { grade: "B", count: row.b_count },
    { grade: "C", count: row.c_count },
    { grade: "D", count: row.d_count },
    { grade: "F", count: row.f_count },
  ];

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      {counts.map(({ grade, count }) => {
        const pct = row.total_votes > 0 ? Math.round((count / row.total_votes) * 100) : 0;
        return (
          <div key={grade} className="flex items-center gap-2">
            <span className="w-4 text-xs font-black text-slate-700">{grade}</span>
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full ${gradeColors[grade]}`} style={{ width: `${pct}%` }} />
            </div>
            {!compact ? (
              <span className="w-14 text-right text-xs font-semibold text-slate-500">
                {count} / {pct}%
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ScopeCards({ rows }: { rows: ScopeSummaryRow[] }) {
  const orderedScopes: VoterScope[] = [
    "in_district",
    "in_state",
    "out_of_district",
    "out_of_state",
    "verified_unknown",
  ];
  const rowByScope = new Map(rows.map((row) => [row.voter_scope, row]));

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {orderedScopes.map((scope) => {
        const row = rowByScope.get(scope);
        return (
          <div key={scope} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
              {scopeLabels[scope]}
            </p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="text-2xl font-black text-slate-950">
                {averageToGrade(row?.average_score)}
              </p>
              <p className="text-xs font-bold text-slate-500">
                {row?.total_votes ?? 0} vote{row?.total_votes === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProfileScorecardVote({
  targetType,
  targetId,
  targetName,
  targetPath,
  compact = false,
}: ProfileScorecardVoteProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [summary, setSummary] = useState<SummaryRow | null>(null);
  const [scopeRows, setScopeRows] = useState<ScopeSummaryRow[]>([]);
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);
  const [rationale, setRationale] = useState("");
  const [wouldVoteAgain, setWouldVoteAgain] = useState<VoteAgain>("unsure");
  const [votedForLastTime, setVotedForLastTime] = useState<LastVoteChoice>("prefer_not_to_say");
  const [approvalAfterVote, setApprovalAfterVote] = useState<ApprovalAfterVote>("mixed");
  const [topIssue, setTopIssue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const targetLabel = getProfileScorecardLabel(targetType);
  // Geography is trusted only after the database/server stamps it from a
  // verified profile. The browser deliberately does not classify itself.
  const voterScope: VoterScope = "verified_unknown";
  const constituentSummary = useMemo(
    () => combineScopeRows(scopeRows, ["in_district", "in_state"]),
    [scopeRows],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadScorecard() {
      if (!repwatchrFeatureFlags.communityVotingV2) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setUnavailable(false);
      setMessage("");

      const [summaryResult, scopeResult, mineResult] = await Promise.all([
        supabase
          .from("profile_scorecard_summary")
          .select("*")
          .eq("target_type", targetType)
          .eq("target_id", targetId)
          .maybeSingle(),
        supabase
          .from("profile_scorecard_summary_by_scope")
          .select("*")
          .eq("target_type", targetType)
          .eq("target_id", targetId),
        user
          ? supabase
              .from("profile_scorecard_votes")
              .select("*")
              .eq("user_id", user.id)
              .eq("target_type", targetType)
              .eq("target_id", targetId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (cancelled) return;

      if (summaryResult.error || mineResult.error) {
        setUnavailable(true);
        setLoading(false);
        return;
      }

      setSummary((summaryResult.data as SummaryRow | null) ?? null);
      setScopeRows(scopeResult.error ? [] : ((scopeResult.data as ScopeSummaryRow[] | null) ?? []));
      const mine = mineResult.data as MyVoteRow | null;
      setCurrentGrade(mine?.grade ?? null);
      setRationale(mine?.rationale ?? "");
      setWouldVoteAgain(mine?.would_vote_again ?? "unsure");
      setVotedForLastTime(mine?.voted_for_last_time ?? "prefer_not_to_say");
      setApprovalAfterVote(mine?.approval_after_vote ?? "mixed");
      setTopIssue(mine?.top_issue ?? "");
      setLoading(false);
    }

    loadScorecard();
    return () => {
      cancelled = true;
    };
  }, [supabase, targetId, targetType, user]);

  async function saveGrade(grade: Grade) {
    if (!repwatchrFeatureFlags.communityVotingV2 || !user || !profile?.verified || saving) return;

    setSaving(true);
    setMessage("");

    const trimmedRationale = compact ? "" : rationale.trim();

    if (compact && currentGrade === grade && !trimmedRationale) {
      const { error } = await supabase
        .from("profile_scorecard_votes")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);

      if (error) {
        setMessage(error.message);
      } else {
        setSummary((current) => applySummaryChange(current, targetType, targetId, currentGrade, null));
        setCurrentGrade(null);
        setMessage("Your scorecard vote was removed.");
      }
      setSaving(false);
      return;
    }

    const basePayload = {
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      target_path: targetPath,
      grade,
      score: gradeScores[grade],
      rationale: trimmedRationale || null,
    };

    const richPayload = {
      ...basePayload,
      would_vote_again: compact ? null : wouldVoteAgain,
      voted_for_last_time: compact ? null : votedForLastTime,
      approval_after_vote: compact ? null : approvalAfterVote,
      top_issue: compact ? null : topIssue.trim() || null,
    };

    let { error } = await supabase.from("profile_scorecard_votes").upsert(
      richPayload,
      { onConflict: "user_id,target_type,target_id" },
    );

    if (error && /column|schema|cache|voter_|would_vote_again|voted_for_last_time|approval_after_vote|top_issue/i.test(error.message)) {
      const fallback = await supabase.from("profile_scorecard_votes").upsert(
        basePayload,
        { onConflict: "user_id,target_type,target_id" },
      );
      error = fallback.error;
    }

    if (error) {
      setMessage(error.message);
    } else {
      setSummary((current) => applySummaryChange(current, targetType, targetId, currentGrade, grade));
      setCurrentGrade(grade);
      setMessage("Your verified citizen scorecard is saved.");
    }

    setSaving(false);
  }

  async function removeVote() {
    if (!user || !profile?.verified || saving || !currentGrade) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profile_scorecard_votes")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId);

    if (error) {
      setMessage(error.message);
    } else {
      setSummary((current) => applySummaryChange(current, targetType, targetId, currentGrade, null));
      setCurrentGrade(null);
      setRationale("");
      setTopIssue("");
      setMessage("Your scorecard vote was removed.");
    }

    setSaving(false);
  }

  function saveCurrentQuestionnaire() {
    if (!currentGrade) {
      setMessage("Choose a letter grade before saving the questionnaire.");
      return;
    }
    void saveGrade(currentGrade);
  }

  if (!repwatchrFeatureFlags.communityVotingV2) {
    return (
      <div className={compact ? "rounded-xl border border-amber-200 bg-amber-50 p-3" : "rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"}>
        <p className="text-xs font-black uppercase tracking-wide text-amber-800">Community scorecard paused</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">
          This beta will reopen after secure verification and reproducible aggregate checks are in place.
        </p>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className={compact ? "rounded-xl border border-slate-200 bg-white p-3" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className={compact ? "rounded-xl border border-amber-200 bg-amber-50 p-3" : "rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"}>
        <p className="text-xs font-black uppercase tracking-wide text-amber-800">Verified citizen scorecard</p>
        <p className="mt-1 text-sm font-semibold text-amber-900">
          Scorecard vote storage is waiting on the Supabase migration.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "rounded-xl border border-slate-200 bg-white p-3" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Verified citizen scorecard</p>
          <h3 className={compact ? "mt-1 text-sm font-black text-slate-950" : "mt-1 text-lg font-black text-slate-950"}>
            {compact ? targetName : `${targetName} citizen grade`}
          </h3>
          {!compact ? (
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Verified residents can answer once on this {targetLabel.toLowerCase()}. Constituent, in-state, out-of-district, and out-of-state responses are tracked separately so outside responses do not control the local signal.
            </p>
          ) : null}
        </div>
        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
          <p className="text-xs font-black uppercase text-slate-500">Local avg</p>
          <p className="text-2xl font-black text-blue-950">{averageToGrade(constituentSummary?.average_score)}</p>
        </div>
      </div>

      {!compact ? (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Verified constituent votes</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{constituentSummary?.total_votes ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500">
                Average score {constituentSummary?.average_score?.toFixed(1) ?? "-"} / 100
                {summary?.total_votes ? ` | ${summary.total_votes} all verified responses` : ""}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <GradeBars row={constituentSummary} />
            </div>
          </div>
          <div className="mt-3">
            <ScopeCards rows={scopeRows} />
          </div>
        </>
      ) : (
        <div className="mt-3">
          <GradeBars row={summary} compact />
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">
            Based on {summary?.total_votes ?? 0} verified response{summary?.total_votes === 1 ? "" : "s"}.
            {constituentSummary?.total_votes
              ? ` Local average uses ${constituentSummary.total_votes} in-district or in-state response${constituentSummary.total_votes === 1 ? "" : "s"}.`
              : " A local sample has not been established yet."}
          </p>
        </div>
      )}

      <div className={compact ? "mt-3" : "mt-5 border-t border-slate-100 pt-4"}>
        {!user ? (
          <div className={compact ? "text-xs font-semibold text-slate-600" : "text-center"}>
            <p>Sign in to score this profile.</p>
            {!compact ? (
              <Link href="/auth/login" className="mt-2 inline-flex rounded-lg bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800">
                Log in
              </Link>
            ) : null}
          </div>
        ) : !profile?.verified ? (
          <div className={compact ? "text-xs font-semibold text-amber-700" : "text-center"}>
            <p>Verify your identity before your citizen scorecard counts.</p>
            {!compact ? (
              <p className="mx-auto mt-1 max-w-xl text-sm font-semibold leading-6 text-amber-800">
                RepWatchr should require real identity and voter-area verification before a profile can move constituent data. Outside responses can be collected, but they must stay labeled separately.
              </p>
            ) : null}
            {!compact ? (
              <Link href="/auth/verify" className="mt-2 inline-flex rounded-lg bg-amber-600 px-3 py-2 text-sm font-black text-white hover:bg-amber-700">
                Verify profile
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Your verified citizen response</p>
                {!compact ? (
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    Current scope: <span className="font-black text-slate-800">{scopeLabels[voterScope]}</span>.
                  </p>
                ) : null}
              </div>
              {!compact ? (
                <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-blue-800">
                  Real profile required
                </span>
              ) : null}
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {grades.map((grade) => {
                const active = currentGrade === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => saveGrade(grade)}
                    disabled={saving}
                    className={`rounded-lg border px-2 py-2 text-center text-sm font-black transition-all ${
                      active
                        ? `${gradeColors[grade]} border-transparent text-white shadow`
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                    } disabled:opacity-50`}
                    title={gradeLabels[grade]}
                    aria-label={`${targetName} scorecard grade ${grade}: ${gradeLabels[grade]}`}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
            {!compact ? (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Would you vote for this official again?
                    </span>
                    <select
                      value={wouldVoteAgain}
                      onChange={(event) => setWouldVoteAgain(event.target.value as VoteAgain)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {Object.entries(voteAgainLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                      How did you vote last time?
                    </span>
                    <select
                      value={votedForLastTime}
                      onChange={(event) => setVotedForLastTime(event.target.value as LastVoteChoice)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {Object.entries(lastVoteLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                      If you voted for them, how do you feel now?
                    </span>
                    <select
                      value={approvalAfterVote}
                      onChange={(event) => setApprovalAfterVote(event.target.value as ApprovalAfterVote)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {Object.entries(approvalAfterVoteLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Top issue driving your grade
                    </span>
                    <input
                      value={topIssue}
                      onChange={(event) => setTopIssue(event.target.value)}
                      maxLength={80}
                      placeholder="Example: border, taxes, war powers, spending"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <textarea
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  placeholder="Optional: add a specific vote, public-source link, or short reason for your score."
                  maxLength={500}
                  rows={2}
                  className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-slate-400">
                    {rationale.length}/500. Save replaces your prior response.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentGrade ? (
                      <button
                        type="button"
                        onClick={removeVote}
                        disabled={saving}
                        className="inline-flex w-fit rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-black text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove vote
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={saveCurrentQuestionnaire}
                      disabled={saving}
                      className="inline-flex w-fit rounded-lg bg-blue-700 px-3 py-2 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      Save questionnaire
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
        {message ? <p className="mt-2 text-xs font-bold text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
}
