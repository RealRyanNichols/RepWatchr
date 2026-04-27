"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

type Claim = {
  id: string;
  profile_id: string;
  profile_name: string;
  profile_type: string;
  district_slug: string | null;
  status: "pending" | "approved" | "rejected" | "revoked";
  reviewer_notes: string | null;
  created_at: string;
};

export default function MyClaimsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      return;
    }

    let mounted = true;

    async function loadClaims() {
      const claimsResult = await supabase
        .from("profile_claims")
        .select("id, profile_id, profile_name, profile_type, district_slug, status, reviewer_notes, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      setClaims((claimsResult.data ?? []) as Claim[]);
      setLoading(false);
    }

    loadClaims();

    return () => {
      mounted = false;
    };
  }, [authLoading, supabase, user]);

  const isLoading = authLoading || (!!user && loading);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="h-56 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-gray-950">Log in required</h1>
        <p className="mt-2 text-sm font-semibold text-gray-600">
          You must be logged in to see profile claims.
        </p>
        <Link
          href="/auth/login"
          className="mt-5 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-blue-700">
            My profile claims
          </p>
          <h1 className="text-3xl font-black text-gray-950">
            Claimed profile workspace
          </h1>
        </div>
        <Link
          href="/profiles/claim"
          className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
        >
          Claim another profile
        </Link>
      </div>

      {claims.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-black text-gray-950">
            No profile claims yet
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
            Submit a claim to request verified ownership of a public official,
            school board, candidate, or journalist profile.
          </p>
          <Link
            href="/profiles/claim"
            className="mt-5 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700"
          >
            Start a claim
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {claims.map((claim) => {
            const publicHref = claim.district_slug
              ? `/school-boards/${claim.district_slug}/${claim.profile_id}`
              : `/officials/${claim.profile_id}`;

            return (
              <article key={claim.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-800">
                        {claim.profile_type.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-gray-700">
                        {claim.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-gray-950">
                      {claim.profile_name}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-gray-600">
                      Submitted {new Date(claim.created_at).toLocaleDateString()}
                    </p>
                    {claim.reviewer_notes ? (
                      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
                        Reviewer note: {claim.reviewer_notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={publicHref}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-900 hover:text-red-700"
                    >
                      Public profile
                    </Link>
                    <Link
                      href={`/dashboard/official-profile/${claim.id}`}
                      className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
                    >
                      Manage claim
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
