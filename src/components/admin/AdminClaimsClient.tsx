"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

type Claim = {
  id: string;
  user_id: string;
  profile_type: string;
  profile_id: string;
  profile_name: string;
  district_slug: string | null;
  official_email: string | null;
  role_title: string | null;
  proof_url: string | null;
  proof_storage_path: string | null;
  proof_notes: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

type AdminStatus = "checking" | "allowed" | "denied";

function publicHrefForClaim(claim: Claim) {
  if (claim.district_slug) {
    return `/school-boards/${claim.district_slug}/${claim.profile_id}`;
  }

  if (claim.profile_type === "attorney" || claim.profile_type === "law_firm") {
    return `/attorneys/${claim.profile_id}`;
  }

  if (
    claim.profile_type === "media_company" ||
    claim.profile_type === "journalist" ||
    claim.profile_type === "editor" ||
    claim.profile_type === "newsroom_leadership"
  ) {
    return `/media/${claim.profile_id}`;
  }

  if (
    claim.profile_type === "law_enforcement_agency" ||
    claim.profile_type === "sheriff" ||
    claim.profile_type === "police_chief" ||
    claim.profile_type === "public_safety_official" ||
    claim.profile_type === "oversight_agency"
  ) {
    return `/public-safety/${claim.profile_id}`;
  }

  return `/officials/${claim.profile_id}`;
}

function roleForClaim(claim: Claim) {
  if (
    claim.profile_type === "journalist" ||
    claim.profile_type === "editor" ||
    claim.profile_type === "newsroom_leadership" ||
    claim.profile_type === "media_company"
  ) {
    return "journalist";
  }

  if (
    claim.profile_type === "law_enforcement_agency" ||
    claim.profile_type === "sheriff" ||
    claim.profile_type === "police_chief" ||
    claim.profile_type === "public_safety_official" ||
    claim.profile_type === "oversight_agency"
  ) {
    return "researcher";
  }

  return "claimed_official";
}

export default function AdminClaimsClient() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [adminStatus, setAdminStatus] = useState<AdminStatus>("checking");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      return;
    }

    let mounted = true;

    async function loadClaims() {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .in("role", ["admin", "reviewer"]);

      if (!mounted) return;

      if (!roles?.length) {
        setAdminStatus("denied");
        return;
      }

      setAdminStatus("allowed");
      const { data } = await supabase
        .from("profile_claims")
        .select(
          "id, user_id, profile_type, profile_id, profile_name, district_slug, official_email, role_title, proof_url, proof_storage_path, proof_notes, status, reviewer_notes, created_at, reviewed_at"
        )
        .order("created_at", { ascending: false });

      setClaims((data ?? []) as Claim[]);
      setNotes(
        Object.fromEntries((data ?? []).map((claim) => [claim.id, claim.reviewer_notes ?? ""]))
      );
    }

    loadClaims();

    return () => {
      mounted = false;
    };
  }, [authLoading, supabase, user]);

  async function openProofUpload(claim: Claim) {
    if (!claim.proof_storage_path) return;
    const { data, error: signedError } = await supabase.storage
      .from("profile-submissions")
      .createSignedUrl(claim.proof_storage_path, 120);

    if (signedError || !data?.signedUrl) {
      setError(signedError?.message ?? "Could not create proof upload link.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function updateClaimStatus(claim: Claim, status: Claim["status"]) {
    if (!user) return;
    setError("");
    setMessage("");

    const reviewerNotes = notes[claim.id]?.trim() || null;
    const { error: updateError } = await supabase
      .from("profile_claims")
      .update({
        status,
        reviewer_notes: reviewerNotes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", claim.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (status === "approved") {
      const { error: roleError } = await supabase.from("user_roles").upsert(
        {
          user_id: claim.user_id,
          role: roleForClaim(claim),
          created_by: user.id,
        },
        { onConflict: "user_id,role" }
      );

      if (roleError) {
        setError(roleError.message);
        return;
      }
    }

    await supabase.from("profile_claim_audit").insert({
      claim_id: claim.id,
      actor_id: user.id,
      action: `claim_${status}`,
      details: { reviewer_notes: reviewerNotes },
    });

    setClaims((current) =>
      current.map((item) =>
        item.id === claim.id
          ? {
              ...item,
              status,
              reviewer_notes: reviewerNotes,
              reviewed_at: new Date().toISOString(),
            }
          : item
      )
    );
    setMessage(`Claim ${status.replaceAll("_", " ")}.`);
  }

  if (authLoading || (user && adminStatus === "checking")) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!user || adminStatus === "denied") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-gray-950">Admin access required</h1>
        <p className="mt-2 text-sm font-semibold text-gray-600">
          Claim review requires an admin or reviewer role in Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-red-700">
            Admin review
          </p>
          <h1 className="text-3xl font-black text-gray-950">Profile claim queue</h1>
        </div>
        <Link
          href="/admin/content-review"
          className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
        >
          Content review
        </Link>
      </div>

      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5">
        {claims.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm font-semibold text-gray-600">
            No claims are waiting in the queue.
          </div>
        ) : (
          claims.map((claim) => (
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
                    {claim.profile_id}
                    {claim.role_title ? ` - ${claim.role_title}` : ""}
                  </p>
                  <p className="mt-2 text-xs font-bold text-gray-500">
                    User: {claim.user_id} | Submitted{" "}
                    {new Date(claim.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={publicHrefForClaim(claim)}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-900 hover:text-red-700"
                  >
                    Public profile
                  </Link>
                  {claim.proof_url ? (
                    <a
                      href={claim.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-900 hover:text-red-700"
                    >
                      Proof link
                    </a>
                  ) : null}
                  {claim.proof_storage_path ? (
                    <button
                      type="button"
                      onClick={() => openProofUpload(claim)}
                      className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-900 hover:text-red-700"
                    >
                      Proof upload
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                    Claim proof notes
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-gray-700">
                    {claim.proof_notes}
                  </p>
                  {claim.official_email ? (
                    <p className="mt-3 text-sm font-bold text-gray-700">
                      Email: {claim.official_email}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="block">
                    <span className="text-sm font-black text-gray-700">
                      Reviewer notes
                    </span>
                    <textarea
                      value={notes[claim.id] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [claim.id]: event.target.value }))
                      }
                      rows={5}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold leading-6 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateClaimStatus(claim, "approved")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateClaimStatus(claim, "rejected")}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => updateClaimStatus(claim, "revoked")}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:border-red-300 hover:text-red-700"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
