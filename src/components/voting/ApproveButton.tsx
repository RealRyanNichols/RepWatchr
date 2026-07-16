"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import type { CitizenVote } from "@/types";
import { repwatchrFeatureFlags } from "@/lib/repwatchr-feature-flags";

interface ApproveButtonProps {
  officialId: string;
}

export default function ApproveButton({ officialId }: ApproveButtonProps) {
  const { user, profile } = useAuth();
  const [currentVote, setCurrentVote] = useState<CitizenVote | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(
    repwatchrFeatureFlags.communityVotingV2,
  );
  const supabase = createClient();

  // Load user's existing vote for this official
  useEffect(() => {
    if (!repwatchrFeatureFlags.communityVotingV2) {
      return;
    }
    if (!user) return;

    async function loadVote() {
      const { data } = await supabase
        .from("citizen_votes")
        .select("vote")
        .eq("user_id", user!.id)
        .eq("official_id", officialId)
        .single();

      if (data) {
        setCurrentVote(data.vote as CitizenVote);
      }
      setInitialLoading(false);
    }

    loadVote();
  }, [user, officialId, supabase]);

  async function handleVote(vote: CitizenVote) {
    if (!repwatchrFeatureFlags.communityVotingV2 || !user || !profile?.verified) return;

    setLoading(true);

    if (currentVote === vote) {
      // Remove vote if clicking the same button
      const { error } = await supabase
        .from("citizen_votes")
        .delete()
        .eq("user_id", user.id)
        .eq("official_id", officialId);

      if (!error) {
        setCurrentVote(null);
      }
    } else {
      // Upsert vote
      const { error } = await supabase.from("citizen_votes").upsert(
        {
          user_id: user.id,
          official_id: officialId,
          vote,
        },
        { onConflict: "user_id,official_id" }
      );

      if (!error) {
        setCurrentVote(vote);
      }
    }

    setLoading(false);
  }

  if (!repwatchrFeatureFlags.communityVotingV2) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-sm font-semibold text-amber-900">
          Community voting is paused while secure verification and audited vote counting are completed.
        </p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-600">
          Sign in to vote on this official
        </p>
        <Link
          href="/auth/login"
          className="mt-2 inline-block rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Log In to Vote
        </Link>
      </div>
    );
  }

  // Not verified
  if (!profile?.verified) {
    return (
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
        <p className="text-sm text-orange-700">
          Verify your Texas identity to vote
        </p>
        <Link
          href="/auth/verify"
          className="mt-2 inline-block rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700"
        >
          Verify Identity
        </Link>
      </div>
    );
  }

  if (user && initialLoading) {
    return (
      <div className="flex gap-2">
        <div className="h-10 flex-1 animate-pulse rounded-md bg-gray-200" />
        <div className="h-10 flex-1 animate-pulse rounded-md bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Your Vote
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handleVote("approve")}
          disabled={loading}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${
            currentVote === "approve"
              ? "bg-green-600 text-white shadow-md ring-2 ring-green-300"
              : "border border-green-300 bg-white text-green-700 hover:bg-green-50"
          } disabled:opacity-50`}
        >
          {currentVote === "approve" ? "Approved" : "Approve"}
        </button>
        <button
          onClick={() => handleVote("disapprove")}
          disabled={loading}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${
            currentVote === "disapprove"
              ? "bg-red-600 text-white shadow-md ring-2 ring-red-300"
              : "border border-red-300 bg-white text-red-700 hover:bg-red-50"
          } disabled:opacity-50`}
        >
          {currentVote === "disapprove" ? "Disapproved" : "Disapprove"}
        </button>
      </div>
      {currentVote && (
        <p className="text-xs text-gray-500 text-center">
          Click again to remove your vote
        </p>
      )}
    </div>
  );
}
