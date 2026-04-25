"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface LiveEngagement {
  totalVotes: number;
  approveCount: number;
  disapproveCount: number;
  approvalPercentage: number;
  totalGrades: number;
  averageGpa: number | null;
  totalComments: number;
  lastVoteAt: string | null;
  lastCommentAt: string | null;
}

const initialState: LiveEngagement = {
  totalVotes: 0,
  approveCount: 0,
  disapproveCount: 0,
  approvalPercentage: 0,
  totalGrades: 0,
  averageGpa: null,
  totalComments: 0,
  lastVoteAt: null,
  lastCommentAt: null,
};

export default function LiveEngagementCounter() {
  const [data, setData] = useState<LiveEngagement>(initialState);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [votesAgg, gradesAgg, commentsAgg, lastVote, lastComment] = await Promise.all([
        supabase.from("approval_ratings").select("total_votes, approve_count, disapprove_count"),
        supabase.from("citizen_grade_summary").select("total_grades, gpa, a_count, b_count, c_count, d_count, f_count"),
        supabase.from("comments").select("id", { count: "exact", head: true }),
        supabase.from("citizen_votes").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("comments").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (cancelled) return;

      const votes = (votesAgg.data ?? []) as Array<{ total_votes: number; approve_count: number; disapprove_count: number }>;
      const totalVotes = votes.reduce((sum, row) => sum + Number(row.total_votes ?? 0), 0);
      const approveCount = votes.reduce((sum, row) => sum + Number(row.approve_count ?? 0), 0);
      const disapproveCount = votes.reduce((sum, row) => sum + Number(row.disapprove_count ?? 0), 0);
      const approvalPercentage = totalVotes > 0 ? Math.round((approveCount / totalVotes) * 1000) / 10 : 0;

      const grades = (gradesAgg.data ?? []) as Array<{
        total_grades: number;
        a_count: number;
        b_count: number;
        c_count: number;
        d_count: number;
        f_count: number;
      }>;
      const totalGrades = grades.reduce((sum, row) => sum + Number(row.total_grades ?? 0), 0);
      const totalGradePoints = grades.reduce(
        (sum, row) =>
          sum +
          4 * Number(row.a_count ?? 0) +
          3 * Number(row.b_count ?? 0) +
          2 * Number(row.c_count ?? 0) +
          1 * Number(row.d_count ?? 0),
        0
      );
      const averageGpa = totalGrades > 0 ? Math.round((totalGradePoints / totalGrades) * 100) / 100 : null;

      const totalComments = commentsAgg.count ?? 0;
      const lastVoteAt = (lastVote.data as { updated_at?: string } | null)?.updated_at ?? null;
      const lastCommentAt = (lastComment.data as { created_at?: string } | null)?.created_at ?? null;

      setData({
        totalVotes,
        approveCount,
        disapproveCount,
        approvalPercentage,
        totalGrades,
        averageGpa,
        totalComments,
        lastVoteAt,
        lastCommentAt,
      });
      setLoading(false);
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    }

    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [supabase]);

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-100/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Live citizen engagement</p>
          <p className="mt-1 text-xs font-semibold text-gray-500">
            Updates every 30 seconds · only verified Texans count
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 transition ${pulse ? "ring-2 ring-emerald-300" : ""}`}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {loading ? "Loading" : "Live"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link
          href="#sentiment"
          className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
        >
          <p className="text-3xl font-black text-blue-950">{data.totalVotes.toLocaleString()}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">Verified votes cast</p>
          <p className="mt-2 text-xs font-semibold text-blue-700">View leaderboard &rarr;</p>
        </Link>
        <Link
          href="#sentiment"
          className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow"
        >
          <p className="text-3xl font-black text-emerald-700">{data.approvalPercentage.toFixed(1)}%</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">Approve rate</p>
          <p className="mt-2 text-xs font-semibold text-emerald-700">{data.approveCount.toLocaleString()} approve · {data.disapproveCount.toLocaleString()} disapprove</p>
        </Link>
        <Link
          href="#sentiment"
          className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow"
        >
          <p className="text-3xl font-black text-red-700">{data.totalGrades.toLocaleString()}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">Letter grades cast</p>
          <p className="mt-2 text-xs font-semibold text-red-700">{data.averageGpa !== null ? `Statewide GPA ${data.averageGpa.toFixed(2)}` : "First grade pending"}</p>
        </Link>
        <Link
          href="#discussion"
          className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow"
        >
          <p className="text-3xl font-black text-amber-700">{data.totalComments.toLocaleString()}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">Public comments + Q&amp;A</p>
          <p className="mt-2 text-xs font-semibold text-amber-700">Read the discussion &rarr;</p>
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow"
        >
          <p className="text-3xl font-black text-blue-900">Free</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-blue-700">Cast your vote</p>
          <p className="mt-2 text-xs font-semibold text-blue-700">Sign up &rarr;</p>
        </Link>
        <Link
          href="/auth/verify"
          className="rounded-xl border border-red-200 bg-red-50 p-4 transition hover:-translate-y-0.5 hover:border-red-400 hover:shadow"
        >
          <p className="text-3xl font-black text-red-700">Verify</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-red-700">Make your vote count</p>
          <p className="mt-2 text-xs font-semibold text-red-700">Texas DL &rarr;</p>
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-semibold text-gray-600 sm:grid-cols-2">
        <div>
          Last verified vote: <span className="font-bold text-gray-900">{formatRelative(data.lastVoteAt)}</span>
        </div>
        <div>
          Last public comment: <span className="font-bold text-gray-900">{formatRelative(data.lastCommentAt)}</span>
        </div>
      </div>
    </div>
  );
}

function formatRelative(iso: string | null): string {
  if (!iso) return "no activity yet";
  const then = new Date(iso).getTime();
  const seconds = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
