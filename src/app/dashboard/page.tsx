"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import MemberCommandCenter from "@/components/dashboard/MemberCommandCenter";
import MemberProfilePanel from "@/components/dashboard/MemberProfilePanel";
import MemberBuildoutPanel from "@/components/dashboard/MemberBuildoutPanel";
import DashboardCoveragePanel from "@/components/dashboard/DashboardCoveragePanel";
import MemberTheoryLab from "@/components/dashboard/MemberTheoryLab";
import MemberFreeToolsOffice from "@/components/dashboard/MemberFreeToolsOffice";
import MemberSignalMap from "@/components/dashboard/MemberSignalMap";
import {
  displayNameFromId,
  urlForOfficialOrCandidate,
  detectSchoolBoardCandidate,
} from "@/data/school-board-district-slugs";

interface VoteRecord {
  official_id: string;
  vote: string;
  updated_at: string;
}

interface GradeRecord {
  official_id: string;
  grade: string;
  rationale: string | null;
  updated_at: string;
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user) return;

    async function loadActivity() {
      const [votesResult, gradesResult] = await Promise.all([
        supabase
          .from("citizen_votes")
          .select("official_id, vote, updated_at")
          .eq("user_id", user!.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("citizen_grades")
          .select("official_id, grade, rationale, updated_at")
          .eq("user_id", user!.id)
          .order("updated_at", { ascending: false }),
      ]);

      if (votesResult.data) setVotes(votesResult.data);
      if (gradesResult.data) setGrades(gradesResult.data as GradeRecord[]);
      setLoadingActivity(false);
    }

    loadActivity();
  }, [user, supabase]);

  // Derive loading state from auth + data
  const isLoading = authLoading || (!!user && loadingActivity);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-96 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Sign In Required
        </h1>
        <p className="mt-2 text-gray-600">
          You need to be logged in to view your dashboard.
        </p>
        <Link
          href="/auth/login"
          className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Log In
        </Link>
      </div>
    );
  }

  const dashboardMetrics = [
    {
      label: "Votes pulled",
      value: votes.length.toLocaleString(),
      detail: "Your rows from citizen_votes",
      href: "/officials",
    },
    {
      label: "Grades pulled",
      value: grades.length.toLocaleString(),
      detail: "Your rows from citizen_grades",
      href: "/school-boards",
    },
    {
      label: "Verification",
      value: profile?.verified ? "Verified" : "Pending",
      detail: profile?.verified ? "Verified member status is active" : "Verify before scorecard votes count",
      href: profile?.verified ? "/dashboard/settings" : "/auth/verify",
    },
    {
      label: "County context",
      value: profile?.county ?? "Unset",
      detail: "Used for local vote, grade, and research context",
      href: "/dashboard/settings",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_54%,#fff7ed_100%)] p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-wide text-red-700">Member command center</p>
        <h1 className="mt-2 text-3xl font-black text-blue-950 sm:text-5xl">Track the people who make decisions.</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-blue-950/75">
          Your RepWatchr workspace is where profile, tracking, map, claims, votes, and Faretta AI research tools come together.
        </p>
      </div>

      <DashboardCoveragePanel />

      <MemberFreeToolsOffice />

      <MemberSignalMap />

      <MemberTheoryLab />

      {/* Profile Section */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-gray-900">Your Profile</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">County</p>
            <p className="font-medium text-gray-900">
              {profile?.county ?? "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Verification Status</p>
            {profile?.verified ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                Verified Member
              </span>
            ) : (
              <div>
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-sm font-medium text-orange-800">
                  Not Verified
                </span>
                <Link
                  href="/auth/verify"
                  className="ml-2 text-sm text-blue-600 hover:underline"
                >
                  Verify now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
          >
            <p className="text-2xl font-black text-blue-950">{metric.value}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{metric.label}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{metric.detail}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/profiles/claim"
          className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300"
        >
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Profile ownership
          </p>
          <h2 className="mt-2 text-xl font-black text-blue-950">
            Claim a public profile
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-blue-950/75">
            Officials, candidates, and journalists can request manual
            verification. Reviewed submissions unlock only after approval.
          </p>
        </Link>
        <Link
          href="/dashboard/claims"
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"
        >
          <p className="text-xs font-black uppercase tracking-wide text-red-700">
            Claimed profile office
          </p>
          <h2 className="mt-2 text-xl font-black text-gray-950">
            My claims and submissions
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
            Track claim status and reviewed bio or media submissions.
          </p>
        </Link>
        <Link
          href="/dashboard/settings"
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"
        >
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Watch defaults
          </p>
          <h2 className="mt-2 text-xl font-black text-gray-950">
            Settings
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
            Set the state you want to watch first. Public pages still open on
            the national selector before a state is chosen.
          </p>
        </Link>
      </div>

      <div className="mt-8">
        <MemberProfilePanel />
      </div>

      <MemberCommandCenter />

      <MemberBuildoutPanel />

      {/* Votes Section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Your Votes ({votes.length})
          </h2>

          {!profile?.verified && (
            <div className="mt-3 rounded-md bg-orange-50 p-4 text-sm text-orange-700">
              You need to{" "}
              <Link href="/auth/verify" className="font-medium underline">
                verify your account
              </Link>{" "}
              before you can vote on officials.
            </div>
          )}

          {votes.length === 0 ? (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">
                You haven&apos;t voted on any officials yet.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Link
                  href="/officials"
                  className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Browse Officials
                </Link>
                <Link
                  href="/school-boards"
                  className="inline-block rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  Browse School Boards
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {votes.map((v) => {
                const isSchoolBoard = Boolean(detectSchoolBoardCandidate(v.official_id));
                return (
                  <Link
                    key={v.official_id}
                    href={urlForOfficialOrCandidate(v.official_id)}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {displayNameFromId(v.official_id)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isSchoolBoard ? "School Board · " : "Official · "}
                        Voted{" "}
                        {new Date(v.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        v.vote === "approve"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {v.vote === "approve" ? "Approved" : "Disapproved"}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Your Grades ({grades.length})
          </h2>
          {grades.length === 0 ? (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">
                You haven&apos;t graded anyone yet. Verified Texans can assign A-F grades on
                any official or school-board profile.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {grades.map((g) => {
                const isSchoolBoard = Boolean(detectSchoolBoardCandidate(g.official_id));
                const gradeColor =
                  g.grade === "A"
                    ? "bg-emerald-100 text-emerald-800"
                    : g.grade === "B"
                      ? "bg-lime-100 text-lime-800"
                      : g.grade === "C"
                        ? "bg-amber-100 text-amber-800"
                        : g.grade === "D"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800";
                return (
                  <Link
                    key={g.official_id}
                    href={urlForOfficialOrCandidate(g.official_id)}
                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {displayNameFromId(g.official_id)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isSchoolBoard ? "School Board · " : "Official · "}
                        Graded{" "}
                        {new Date(g.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {g.rationale ? (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                          &ldquo;{g.rationale}&rdquo;
                        </p>
                      ) : null}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-black ${gradeColor}`}>
                      {g.grade}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
