"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import {
  getProfileScorecardLabel,
  type ProfileScorecardTargetType,
} from "@/lib/universal-scorecards";

type Grade = "A" | "B" | "C" | "D" | "F";

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
};

type ProfileScorecardVoteProps = {
  targetType: ProfileScorecardTargetType;
  targetId: string;
  targetName: string;
  targetPath: string;
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
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);
  const [rationale, setRationale] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const targetLabel = getProfileScorecardLabel(targetType);

  useEffect(() => {
    let cancelled = false;

    async function loadScorecard() {
      setLoading(true);
      setUnavailable(false);
      setMessage("");

      const [summaryResult, mineResult] = await Promise.all([
        supabase
          .from("profile_scorecard_summary")
          .select("*")
          .eq("target_type", targetType)
          .eq("target_id", targetId)
          .maybeSingle(),
        user
          ? supabase
              .from("profile_scorecard_votes")
              .select("grade, rationale")
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
      const mine = mineResult.data as MyVoteRow | null;
      setCurrentGrade(mine?.grade ?? null);
      setRationale(mine?.rationale ?? "");
      setLoading(false);
    }

    loadScorecard();
    return () => {
      cancelled = true;
    };
  }, [supabase, targetId, targetType, user]);

  async function saveGrade(grade: Grade) {
    if (!user || !profile?.verified || saving) return;

    setSaving(true);
    setMessage("");

    const trimmedRationale = compact ? "" : rationale.trim();

    if (currentGrade === grade && !trimmedRationale) {
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

    const { error } = await supabase.from("profile_scorecard_votes").upsert(
      {
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        target_path: targetPath,
        grade,
        score: gradeScores[grade],
        county: profile.county,
        rationale: trimmedRationale || null,
      },
      { onConflict: "user_id,target_type,target_id" },
    );

    if (error) {
      setMessage(error.message);
    } else {
      setSummary((current) => applySummaryChange(current, targetType, targetId, currentGrade, grade));
      setCurrentGrade(grade);
      setMessage("Your verified scorecard vote is saved.");
    }

    setSaving(false);
  }

  if (loading || authLoading) {
    return (
      <div className={compact ? "rounded-xl border border-slate-200 bg-white p-3" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className={compact ? "rounded-xl border border-amber-200 bg-amber-50 p-3" : "rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"}>
        <p className="text-xs font-black uppercase tracking-wide text-amber-800">Universal scorecard</p>
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
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Universal scorecard</p>
          <h3 className={compact ? "mt-1 text-sm font-black text-slate-950" : "mt-1 text-lg font-black text-slate-950"}>
            {compact ? targetName : `${targetName} scorecard vote`}
          </h3>
          {!compact ? (
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Verified RepWatchr profiles can vote once on this {targetLabel.toLowerCase()}. Updating a grade replaces the old vote.
            </p>
          ) : null}
        </div>
        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
          <p className="text-xs font-black uppercase text-slate-500">Avg</p>
          <p className="text-2xl font-black text-blue-950">{averageToGrade(summary?.average_score)}</p>
        </div>
      </div>

      {!compact ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Verified votes</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{summary?.total_votes ?? 0}</p>
            <p className="text-xs font-semibold text-slate-500">
              Average score {summary?.average_score?.toFixed(1) ?? "-"} / 100
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <GradeBars row={summary} />
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <GradeBars row={summary} compact />
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
            <p>Verify your profile before your scorecard vote counts.</p>
            {!compact ? (
              <Link href="/auth/verify" className="mt-2 inline-flex rounded-lg bg-amber-600 px-3 py-2 text-sm font-black text-white hover:bg-amber-700">
                Verify profile
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Your one verified vote</p>
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
                <textarea
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  placeholder="Optional: add a public-source link or short reason for your score."
                  maxLength={500}
                  rows={2}
                  className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {rationale.length}/500. Click the active grade again with no note to remove your vote.
                </p>
              </>
            ) : null}
          </>
        )}
        {message ? <p className="mt-2 text-xs font-bold text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
}
