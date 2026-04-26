"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

type ProfileType = "school_board" | "official" | "journalist";

type ProfileClaimFormProps = {
  initialProfileType?: string;
  initialProfileId?: string;
  initialProfileName?: string;
  initialDistrictSlug?: string;
};

function normalizeProfileType(value?: string): ProfileType {
  if (value === "official" || value === "journalist" || value === "school_board") {
    return value;
  }

  return "school_board";
}

function cleanPathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

export default function ProfileClaimForm({
  initialProfileType,
  initialProfileId,
  initialProfileName,
  initialDistrictSlug,
}: ProfileClaimFormProps) {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [profileType, setProfileType] = useState<ProfileType>(
    normalizeProfileType(initialProfileType)
  );
  const [profileId, setProfileId] = useState(initialProfileId ?? "");
  const [profileName, setProfileName] = useState(initialProfileName ?? "");
  const [districtSlug, setDistrictSlug] = useState(initialDistrictSlug ?? "");
  const [officialEmail, setOfficialEmail] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successClaimId, setSuccessClaimId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-blue-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-blue-700">
            Login required
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-950">
            Claim a public profile
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-gray-600">
            Profile claims require a RepWatchr account, manual verification, and
            admin approval before reviewed submissions unlock.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-900 hover:border-red-300 hover:text-red-700"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!user) return;

    if (!profileId.trim() || !profileName.trim()) {
      setError("Profile name and profile ID are required.");
      return;
    }

    if (!officialEmail.trim() && !proofUrl.trim() && !proofFile) {
      setError("Add an official/campaign email, a public proof link, or a proof upload.");
      return;
    }

    if (proofNotes.trim().length < 20) {
      setError("Proof notes must explain the claim in at least 20 characters.");
      return;
    }

    if (!acknowledged) {
      setError("You must acknowledge that RepWatchr facts and evidence stay locked.");
      return;
    }

    setSubmitting(true);
    let proofStoragePath: string | null = null;

    if (proofFile) {
      const storagePath = `${user.id}/${Date.now()}-${cleanPathSegment(proofFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-submissions")
        .upload(storagePath, proofFile, { upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        setSubmitting(false);
        return;
      }

      proofStoragePath = storagePath;
    }

    const { data, error: insertError } = await supabase
      .from("profile_claims")
      .insert({
        user_id: user.id,
        profile_type: profileType,
        profile_id: profileId.trim(),
        profile_name: profileName.trim(),
        district_slug: districtSlug.trim() || null,
        official_email: officialEmail.trim() || null,
        role_title: roleTitle.trim() || null,
        proof_url: proofUrl.trim() || null,
        proof_storage_path: proofStoragePath,
        proof_notes: proofNotes.trim(),
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSuccessClaimId(data.id);
    setSubmitting(false);
  }

  if (successClaimId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
            Claim submitted
          </p>
          <h1 className="mt-2 text-3xl font-black text-emerald-950">
            Manual review is next
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-emerald-900">
            RepWatchr will review the proof. Submitted content remains hidden
            until it is reviewed.
          </p>
          <Link
            href="/dashboard/claims"
            className="mt-6 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700"
          >
            View my claims
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-black uppercase tracking-wide text-blue-700">
          Profile ownership request
        </p>
        <h1 className="mt-2 text-3xl font-black text-gray-950">
          Claim a RepWatchr profile
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-gray-600">
          Verification is strict and manual. Approved claimants can submit a
          reviewed public bio, statement, media, and links. They cannot edit
          RepWatchr facts, evidence, scores, source records, red flags, or
          research gaps.
        </p>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-gray-700">Profile type</span>
              <select
                value={profileType}
                onChange={(event) => setProfileType(normalizeProfileType(event.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="school_board">School board</option>
                <option value="official">Public official</option>
                <option value="journalist">Journalist / reporter</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-black text-gray-700">District slug</span>
              <input
                value={districtSlug}
                onChange={(event) => setDistrictSlug(event.target.value)}
                placeholder="harleton-isd"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-gray-700">Profile ID</span>
              <input
                value={profileId}
                onChange={(event) => setProfileId(event.target.value)}
                required
                placeholder="harleton-isd-jane-doe"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-black text-gray-700">Profile name</span>
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                required
                placeholder="Jane Doe"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-gray-700">
                Official or campaign email
              </span>
              <input
                type="email"
                value={officialEmail}
                onChange={(event) => setOfficialEmail(event.target.value)}
                placeholder="name@campaign.com"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-black text-gray-700">Role / title</span>
              <input
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="Trustee, candidate, superintendent, reporter"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-black text-gray-700">
              Public proof link
            </span>
            <input
              type="url"
              value={proofUrl}
              onChange={(event) => setProofUrl(event.target.value)}
              placeholder="Official district page, campaign site, filing, or public bio"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-black text-gray-700">
              Proof upload
            </span>
            <input
              type="file"
              onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded-xl border border-dashed border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-900 file:px-3 file:py-2 file:text-sm file:font-black file:text-white"
            />
            <span className="mt-1 block text-xs font-semibold text-gray-500">
              Pending proof uploads stay in the private profile-submissions
              bucket.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-black text-gray-700">Proof notes</span>
            <textarea
              value={proofNotes}
              onChange={(event) => setProofNotes(event.target.value)}
              rows={5}
              maxLength={5000}
              required
              placeholder="Explain who you are, what profile you are claiming, and how RepWatchr can verify the claim."
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold leading-6 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <label className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-700"
            />
            <span className="text-sm font-bold leading-6 text-amber-950">
              I understand that RepWatchr facts, source records, evidence,
              scores, research gaps, and red flags cannot be edited by a
              claimed profile. Submitted content is separate and must be
              reviewed before publication.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {submitting ? "Submitting claim..." : "Submit claim for review"}
          </button>
        </form>
      </div>
    </div>
  );
}
