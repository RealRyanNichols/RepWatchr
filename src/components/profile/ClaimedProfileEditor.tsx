"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

type Claim = {
  id: string;
  profile_id: string;
  profile_name: string;
  district_slug: string | null;
  status: "pending" | "approved" | "rejected" | "revoked";
  reviewer_notes: string | null;
};

type Subscription = {
  status: string;
  current_period_end: string | null;
};

type ClaimedContent = {
  about_me: string | null;
  personal_statement: string | null;
  official_website: string | null;
  campaign_website: string | null;
  facebook_url: string | null;
  x_url: string | null;
  youtube_url: string | null;
  status: string;
  version: number;
  updated_at: string;
};

type MediaItem = {
  id: string;
  media_type: string;
  caption: string | null;
  credit: string | null;
  status: string;
  updated_at: string;
};

function cleanPathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

export default function ClaimedProfileEditor({
  claimId,
  checkoutStatus,
}: {
  claimId: string;
  checkoutStatus?: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [latestContent, setLatestContent] = useState<ClaimedContent | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [personalStatement, setPersonalStatement] = useState("");
  const [officialWebsite, setOfficialWebsite] = useState("");
  const [campaignWebsite, setCampaignWebsite] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaCredit, setMediaCredit] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadEditorState() {
      const [claimResult, subscriptionResult, contentResult, mediaResult] =
        await Promise.all([
          supabase
            .from("profile_claims")
            .select("id, profile_id, profile_name, district_slug, status, reviewer_notes")
            .eq("id", claimId)
            .eq("user_id", user!.id)
            .maybeSingle(),
          supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("claim_id", claimId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("claimed_profile_content")
            .select(
              "about_me, personal_statement, official_website, campaign_website, facebook_url, x_url, youtube_url, status, version, updated_at"
            )
            .eq("claim_id", claimId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("profile_media")
            .select("id, media_type, caption, credit, status, updated_at")
            .eq("claim_id", claimId)
            .order("updated_at", { ascending: false }),
        ]);

      if (!mounted) return;

      if (claimResult.data) {
        setClaim(claimResult.data as Claim);
      }
      if (subscriptionResult.data) {
        setSubscription(subscriptionResult.data as Subscription);
      }
      if (contentResult.data) {
        const content = contentResult.data as ClaimedContent;
        setLatestContent(content);
        setAboutMe(content.about_me ?? "");
        setPersonalStatement(content.personal_statement ?? "");
        setOfficialWebsite(content.official_website ?? "");
        setCampaignWebsite(content.campaign_website ?? "");
        setFacebookUrl(content.facebook_url ?? "");
        setXUrl(content.x_url ?? "");
        setYoutubeUrl(content.youtube_url ?? "");
      }
      if (mediaResult.data) {
        setMedia(mediaResult.data as MediaItem[]);
      }
      setLoading(false);
    }

    loadEditorState();

    return () => {
      mounted = false;
    };
  }, [claimId, supabase, user]);

  async function startCheckout() {
    setCheckoutLoading(true);
    setError("");

    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId }),
    });
    const payload = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !payload.url) {
      setError(payload.error ?? "Unable to start Stripe checkout.");
      setCheckoutLoading(false);
      return;
    }

    window.location.href = payload.url;
  }

  async function uploadPendingMedia(file: File, mediaType: "headshot" | "photo") {
    if (!user || !claim) return;

    const storagePath = `${user.id}/${claim.id}/${Date.now()}-${cleanPathSegment(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-submissions")
      .upload(storagePath, file, { upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { error: mediaError } = await supabase.from("profile_media").insert({
      claim_id: claim.id,
      user_id: user.id,
      profile_id: claim.profile_id,
      media_type: mediaType,
      storage_bucket: "profile-submissions",
      storage_path: storagePath,
      caption: mediaCaption.trim() || null,
      credit: mediaCredit.trim() || null,
      status: "pending_review",
    });

    if (mediaError) throw new Error(mediaError.message);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user || !claim) return;

    setSubmitting(true);

    const { error: contentError } = await supabase
      .from("claimed_profile_content")
      .insert({
        claim_id: claim.id,
        user_id: user.id,
        profile_id: claim.profile_id,
        about_me: aboutMe.trim() || null,
        personal_statement: personalStatement.trim() || null,
        official_website: officialWebsite.trim() || null,
        campaign_website: campaignWebsite.trim() || null,
        facebook_url: facebookUrl.trim() || null,
        x_url: xUrl.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
        status: "pending_review",
        version: (latestContent?.version ?? 0) + 1,
      });

    if (contentError) {
      setError(contentError.message);
      setSubmitting(false);
      return;
    }

    try {
      if (headshotFile) {
        await uploadPendingMedia(headshotFile, "headshot");
      }
      if (photoFile) {
        await uploadPendingMedia(photoFile, "photo");
      }
      if (videoUrl.trim()) {
        const { error: videoError } = await supabase.from("profile_media").insert({
          claim_id: claim.id,
          user_id: user.id,
          profile_id: claim.profile_id,
          media_type: "video",
          public_url: videoUrl.trim(),
          caption: mediaCaption.trim() || null,
          credit: mediaCredit.trim() || null,
          status: "pending_review",
        });

        if (videoError) throw new Error(videoError.message);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Media upload failed.");
      setSubmitting(false);
      return;
    }

    setMessage("Submission sent for RepWatchr review. It stays hidden until approved.");
    setHeadshotFile(null);
    setPhotoFile(null);
    setVideoUrl("");
    setMediaCaption("");
    setMediaCredit("");
    setSubmitting(false);
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-gray-950">Log in required</h1>
        <p className="mt-2 text-sm font-semibold text-gray-600">
          You must be logged in to manage a claimed profile.
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

  if (!claim) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-gray-950">Claim not found</h1>
        <Link href="/dashboard/claims" className="mt-4 inline-flex text-sm font-black text-blue-700">
          Back to my claims
        </Link>
      </div>
    );
  }

  const subscriptionActive = subscription?.status === "active" || subscription?.status === "trialing";
  const checkoutNotice =
    checkoutStatus === "success"
      ? {
          className: "border-emerald-200 bg-emerald-50 text-emerald-800",
          text: "Stripe checkout finished. If the subscription still shows pending, wait a moment for the webhook to update this claim.",
        }
      : checkoutStatus === "cancelled"
        ? {
            className: "border-amber-200 bg-amber-50 text-amber-950",
            text: "Checkout was cancelled. The profile tools stay locked until the subscription is active.",
          }
        : null;
  const profilePath = claim.district_slug
    ? `/school-boards/${claim.district_slug}/${claim.profile_id}`
    : `/officials/${claim.profile_id}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-700">
              Claimed profile office
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-950">
              {claim.profile_name}
            </h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
              Status:{" "}
              <span className="font-black text-blue-900">
                {claim.status.replaceAll("_", " ")}
              </span>
            </p>
          </div>
          <Link
            href={profilePath}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-900 hover:border-red-300 hover:text-red-700"
          >
            View public profile
          </Link>
        </div>

        {claim.reviewer_notes ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
            Reviewer note: {claim.reviewer_notes}
          </div>
        ) : null}

        {checkoutNotice ? (
          <div className={`mt-5 rounded-xl border p-4 text-sm font-bold leading-6 ${checkoutNotice.className}`}>
            {checkoutNotice.text}
          </div>
        ) : null}

        {claim.status !== "approved" ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-xl font-black text-gray-950">
              Publishing tools are locked
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
              Claims must be manually approved before subscription checkout and
              public profile submissions unlock. Rejected or revoked claims
              cannot publish content.
            </p>
          </div>
        ) : !subscriptionActive ? (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-xl font-black text-blue-950">
              Subscription required after approval
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-blue-950/75">
              Your claim is approved. Start the Stripe subscription to submit a
              reviewed bio, statement, photos, videos, and links. This never
              unlocks edits to RepWatchr facts or evidence.
            </p>
            {error ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={startCheckout}
              disabled={checkoutLoading}
              className="mt-5 rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {checkoutLoading ? "Opening checkout..." : "Start member subscription"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="text-xl font-black text-emerald-950">
                Approved claimant workspace
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-emerald-900">
                Every submission creates a new pending revision. Nothing goes
                public until RepWatchr review approves it.
              </p>
            </div>

            {message ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
                {error}
              </div>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-gray-700">About me</span>
                <textarea
                  value={aboutMe}
                  onChange={(event) => setAboutMe(event.target.value)}
                  rows={8}
                  maxLength={2500}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold leading-6 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-black text-gray-700">
                  Personal statement
                </span>
                <textarea
                  value={personalStatement}
                  onChange={(event) => setPersonalStatement(event.target.value)}
                  rows={8}
                  maxLength={5000}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold leading-6 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <UrlInput label="Official website" value={officialWebsite} onChange={setOfficialWebsite} />
              <UrlInput label="Campaign website" value={campaignWebsite} onChange={setCampaignWebsite} />
              <UrlInput label="Facebook URL" value={facebookUrl} onChange={setFacebookUrl} />
              <UrlInput label="X URL" value={xUrl} onChange={setXUrl} />
              <UrlInput label="YouTube URL" value={youtubeUrl} onChange={setYoutubeUrl} />
              <UrlInput label="Approved video URL" value={videoUrl} onChange={setVideoUrl} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FileInput label="Headshot upload" onChange={setHeadshotFile} />
              <FileInput label="Public photo upload" onChange={setPhotoFile} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-gray-700">Media caption</span>
                <input
                  value={mediaCaption}
                  onChange={(event) => setMediaCaption(event.target.value)}
                  maxLength={1000}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-black text-gray-700">Media credit</span>
                <input
                  value={mediaCredit}
                  onChange={(event) => setMediaCredit(event.target.value)}
                  maxLength={250}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {submitting ? "Submitting for review..." : "Submit profile revision for review"}
            </button>

            {media.length ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <h2 className="text-lg font-black text-gray-950">
                  Media review history
                </h2>
                <div className="mt-3 grid gap-2">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-700"
                    >
                      {item.media_type} - {item.status.replaceAll("_", " ")}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}

function UrlInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-gray-700">{label}</span>
      <input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  );
}

function FileInput({
  label,
  onChange,
}: {
  label: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="block rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
      <span className="text-sm font-black text-gray-700">{label}</span>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="mt-2 w-full text-sm font-semibold text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-900 file:px-3 file:py-2 file:text-sm file:font-black file:text-white"
      />
    </label>
  );
}
