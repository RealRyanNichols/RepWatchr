"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

type Grade = "A" | "B" | "C" | "D" | "F";

const GRADE_OPTIONS: Grade[] = ["A", "B", "C", "D", "F"];

const GRADE_LABEL: Record<Grade, string> = {
  A: "Outstanding",
  B: "Solid",
  C: "Mixed",
  D: "Concerning",
  F: "Failing constituents",
};

const GRADE_COLOR: Record<Grade, string> = {
  A: "bg-emerald-600",
  B: "bg-lime-600",
  C: "bg-amber-500",
  D: "bg-orange-600",
  F: "bg-red-600",
};

interface GradeRow {
  official_id: string;
  total_grades: number;
  a_count: number;
  b_count: number;
  c_count: number;
  d_count: number;
  f_count: number;
  gpa: number | null;
}

interface GradeOfficialSectionProps {
  officialId: string;
  officialCounties: string[];
  officialName: string;
}

function gpaToLetter(gpa: number | null | undefined): string {
  if (gpa === null || gpa === undefined) return "-";
  if (gpa >= 3.5) return "A";
  if (gpa >= 2.5) return "B";
  if (gpa >= 1.5) return "C";
  if (gpa >= 0.5) return "D";
  return "F";
}

function GradeBars({ row }: { row: GradeRow | null }) {
  if (!row || row.total_grades === 0) {
    return (
      <p className="text-sm text-gray-500">No verified grades yet.</p>
    );
  }
  const counts: Array<{ grade: Grade; count: number }> = [
    { grade: "A", count: row.a_count },
    { grade: "B", count: row.b_count },
    { grade: "C", count: row.c_count },
    { grade: "D", count: row.d_count },
    { grade: "F", count: row.f_count },
  ];
  return (
    <div className="space-y-1">
      {counts.map(({ grade, count }) => {
        const pct = row.total_grades > 0 ? Math.round((count / row.total_grades) * 100) : 0;
        return (
          <div key={grade} className="flex items-center gap-2">
            <span className="w-4 text-xs font-black text-gray-700">{grade}</span>
            <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full ${GRADE_COLOR[grade]} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-12 text-right text-xs font-semibold text-gray-500">
              {count} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function GradeOfficialSection({
  officialId,
  officialCounties,
  officialName,
}: GradeOfficialSectionProps) {
  const { user, profile } = useAuth();
  const [statewide, setStatewide] = useState<GradeRow | null>(null);
  const [inDistrict, setInDistrict] = useState<GradeRow | null>(null);
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);
  const [rationale, setRationale] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [stateResult, districtResult, mineResult] = await Promise.all([
        supabase
          .from("citizen_grade_summary")
          .select("*")
          .eq("official_id", officialId)
          .single(),
        officialCounties.length
          ? supabase
              .from("citizen_grade_summary_by_county")
              .select("*")
              .eq("official_id", officialId)
              .in("county", officialCounties)
          : Promise.resolve({ data: [], error: null } as { data: GradeRow[] | null; error: null }),
        user
          ? supabase
              .from("citizen_grades")
              .select("grade, rationale")
              .eq("user_id", user.id)
              .eq("official_id", officialId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as { data: { grade: Grade; rationale: string | null } | null; error: null }),
      ]);

      if (cancelled) return;

      setStatewide((stateResult.data as GradeRow | null) ?? null);

      const districtRows = (districtResult.data as GradeRow[] | null) ?? [];
      if (districtRows.length > 0) {
        const totals = districtRows.reduce<GradeRow>(
          (acc, row) => ({
            official_id: officialId,
            total_grades: acc.total_grades + row.total_grades,
            a_count: acc.a_count + row.a_count,
            b_count: acc.b_count + row.b_count,
            c_count: acc.c_count + row.c_count,
            d_count: acc.d_count + row.d_count,
            f_count: acc.f_count + row.f_count,
            gpa: null,
          }),
          {
            official_id: officialId,
            total_grades: 0,
            a_count: 0,
            b_count: 0,
            c_count: 0,
            d_count: 0,
            f_count: 0,
            gpa: null,
          }
        );
        const gpa =
          totals.total_grades > 0
            ? Math.round(
                ((4 * totals.a_count +
                  3 * totals.b_count +
                  2 * totals.c_count +
                  1 * totals.d_count) /
                  totals.total_grades) *
                  100
              ) / 100
            : null;
        setInDistrict({ ...totals, gpa });
      } else {
        setInDistrict(null);
      }

      if (mineResult.data) {
        setCurrentGrade((mineResult.data as { grade: Grade }).grade);
        setRationale((mineResult.data as { rationale: string | null }).rationale ?? "");
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [officialId, officialCounties, supabase, user]);

  async function handleGrade(grade: Grade) {
    if (!user || !profile?.verified) return;
    setSaving(true);
    setError("");

    const trimmedRationale = rationale.trim();

    if (currentGrade === grade && !trimmedRationale) {
      const { error: deleteError } = await supabase
        .from("citizen_grades")
        .delete()
        .eq("user_id", user.id)
        .eq("official_id", officialId);
      if (deleteError) setError(deleteError.message);
      else setCurrentGrade(null);
    } else {
      const { error: upsertError } = await supabase.from("citizen_grades").upsert(
        {
          user_id: user.id,
          official_id: officialId,
          grade,
          county: profile.county,
          rationale: trimmedRationale || null,
        },
        { onConflict: "user_id,official_id" }
      );
      if (upsertError) setError(upsertError.message);
      else setCurrentGrade(grade);
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-3 w-full animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
          Citizen letter grade
        </h3>
        <p className="text-xs text-gray-500">
          {statewide?.total_grades ?? 0} statewide · {inDistrict?.total_grades ?? 0} in-district
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">All Texas</p>
          <p className="mt-1 text-3xl font-black text-blue-950">{gpaToLetter(statewide?.gpa)}</p>
          <p className="text-xs text-gray-500">
            GPA {statewide?.gpa?.toFixed(2) ?? "-"} · {statewide?.total_grades ?? 0} grades
          </p>
          <div className="mt-3"><GradeBars row={statewide} /></div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">In-district constituents</p>
          <p className="mt-1 text-3xl font-black text-red-700">{gpaToLetter(inDistrict?.gpa)}</p>
          <p className="text-xs text-gray-500">
            GPA {inDistrict?.gpa?.toFixed(2) ?? "-"} · {inDistrict?.total_grades ?? 0} grades
          </p>
          <div className="mt-3"><GradeBars row={inDistrict} /></div>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        {!user ? (
          <div className="text-center">
            <p className="text-sm text-gray-600">Sign in to grade {officialName}.</p>
            <Link
              href="/auth/login"
              className="mt-2 inline-block rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Log in
            </Link>
          </div>
        ) : !profile?.verified ? (
          <div className="text-center">
            <p className="text-sm text-orange-700">Verify your Texas ID to assign a grade.</p>
            <Link
              href="/auth/verify"
              className="mt-2 inline-block rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700"
            >
              Verify identity
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Your grade</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {GRADE_OPTIONS.map((grade) => {
                const active = currentGrade === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => handleGrade(grade)}
                    disabled={saving}
                    className={`rounded-lg border px-2 py-2 text-center text-base font-black transition-all ${
                      active
                        ? `${GRADE_COLOR[grade]} text-white border-transparent shadow`
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    } disabled:opacity-50`}
                    aria-label={`Grade ${grade} - ${GRADE_LABEL[grade]}`}
                    title={GRADE_LABEL[grade]}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Optional: link a vote, news story, or personal experience that backs your grade."
              maxLength={500}
              rows={2}
              className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              {rationale.length}/500 · click your active grade again to remove it.
            </p>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}
