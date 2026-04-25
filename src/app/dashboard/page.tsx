"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import MemberCommandCenter from "@/components/dashboard/MemberCommandCenter";
import MemberProfilePanel from "@/components/dashboard/MemberProfilePanel";

interface VoteRecord {
  official_id: string;
  vote: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [loadingVotes, setLoadingVotes] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user) return;

    async function loadVotes() {
      const { data } = await supabase
        .from("citizen_votes")
        .select("official_id, vote, updated_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      if (data) {
        setVotes(data);
      }
      setLoadingVotes(false);
    }

    loadVotes();
  }, [user, supabase]);

  // Derive loading state from auth + data
  const isLoading = authLoading || (!!user && loadingVotes);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_54%,#fff7ed_100%)] p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-wide text-red-700">Member command center</p>
        <h1 className="mt-2 text-3xl font-black text-blue-950 sm:text-5xl">Track the people who make decisions.</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-blue-950/75">
          Your RepWatchr workspace is where profile, tracking, map, claims, votes, and GideonAI research tools come together.
        </p>
      </div>

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
                Verified Texas Voter
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
            verification. Paid tools unlock only after approval.
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
            Track claim status, subscription state, and reviewed bio or media
            submissions.
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
            Set the School Board Watch state that opens first. Texas is the
            default unless you change it.
          </p>
        </Link>
      </div>

      <div className="mt-8">
        <MemberProfilePanel />
      </div>

      <MemberCommandCenter />

      {/* Votes Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Your Votes ({votes.length})
        </h2>

        {!profile?.verified && (
          <div className="mt-3 rounded-md bg-orange-50 p-4 text-sm text-orange-700">
            You need to{" "}
            <Link href="/auth/verify" className="font-medium underline">
              verify your Texas identity
            </Link>{" "}
            before you can vote on officials.
          </div>
        )}

        {votes.length === 0 ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">
              You haven&apos;t voted on any officials yet.
            </p>
            <Link
              href="/officials"
              className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Browse Officials
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {votes.map((v) => (
              <Link
                key={v.official_id}
                href={`/officials/${v.official_id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {v.official_id.replace(/-/g, " ")}
                  </p>
                  <p className="text-xs text-gray-500">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
