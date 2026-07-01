"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  contributionKindLabels,
  contributionKinds,
  contributorBadgeCatalog,
  contributorDisplayName,
  contributorLevelDescriptions,
  contributorLevelLabels,
  contributorLevels,
  normalizeContributorHandle,
  type ContributionKind,
  type ContributorBadgeAward,
  type ContributorLevel,
  type ContributorRecord,
  type PublicContributorProfile,
} from "@/lib/contributors";

type ApiContributorProfile = PublicContributorProfile & {
  user_id: string;
  public_profile_enabled: boolean;
};

type BadgeCatalogRow = {
  badge_key: string;
  name: string;
  description: string;
  icon_label: string;
  accent: string;
};

const targetTypeOptions = [
  "official",
  "school_board",
  "race",
  "vote",
  "funding",
  "meeting",
  "issue",
  "agency",
  "court",
  "judge",
  "record",
] as const;

const accentClasses: Record<string, string> = {
  red: "border-red-200 bg-red-50 text-red-900",
  blue: "border-blue-200 bg-blue-50 text-blue-950",
  gold: "border-amber-200 bg-amber-50 text-amber-950",
  green: "border-emerald-200 bg-emerald-50 text-emerald-950",
  slate: "border-slate-200 bg-slate-50 text-slate-800",
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function levelFromXp(xp: number) {
  if (xp >= 1000) return "State Signal";
  if (xp >= 500) return "County Leader";
  if (xp >= 250) return "Verified Builder";
  if (xp >= 100) return "Record Builder";
  return "Starting Record";
}

function nextXpTarget(xp: number) {
  if (xp < 100) return 100;
  if (xp < 250) return 250;
  if (xp < 500) return 500;
  if (xp < 1000) return 1000;
  return Math.ceil((xp + 1) / 500) * 500;
}

function badgeFromAward(award: ContributorBadgeAward) {
  if (award.contributor_badges) {
    return {
      name: award.contributor_badges.name,
      description: award.contributor_badges.description,
      icon_label: award.contributor_badges.icon_label,
      accent: award.contributor_badges.accent,
    };
  }

  const fallback = contributorBadgeCatalog.find((badge) => badge.badgeKey === award.badge_key);
  return fallback
    ? {
        name: fallback.name,
        description: fallback.description,
        icon_label: fallback.iconLabel,
        accent: fallback.accent,
      }
    : null;
}

export default function MemberContributorOffice() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ApiContributorProfile | null>(null);
  const [records, setRecords] = useState<ContributorRecord[]>([]);
  const [badgeAwards, setBadgeAwards] = useState<ContributorBadgeAward[]>([]);
  const [badgeCatalog, setBadgeCatalog] = useState<BadgeCatalogRow[]>([]);
  const [status, setStatus] = useState("Loading contributor profile");
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState(false);

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [publicBio, setPublicBio] = useState("");
  const [county, setCounty] = useState("");
  const [state, setState] = useState("TX");
  const [primaryLevel, setPrimaryLevel] = useState<ContributorLevel>("source_runner");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(false);

  const [kind, setKind] = useState<ContributionKind>("source_submission");
  const [targetType, setTargetType] = useState("official");
  const [targetLabel, setTargetLabel] = useState("");
  const [contributionTitle, setContributionTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [summary, setSummary] = useState("");

  const earnedBadgeKeys = useMemo(() => new Set(badgeAwards.map((award) => award.badge_key)), [badgeAwards]);
  const xp = profile?.total_xp ?? 0;
  const nextTarget = nextXpTarget(xp);
  const progress = Math.max(5, Math.min(100, Math.round((xp / nextTarget) * 100)));
  const publicHref = profile?.handle ? `/contributors/${profile.handle}` : "/contributors";

  useEffect(() => {
    let mounted = true;

    async function loadContributorProfile() {
      if (!user) {
        setStatus("Login to build reputation");
        return;
      }

      try {
        const response = await fetch("/api/member/contributor-profile", { cache: "no-store" });
        const result = (await response.json()) as {
          ok?: boolean;
          profile?: ApiContributorProfile | null;
          records?: ContributorRecord[];
          badgeAwards?: ContributorBadgeAward[];
          badgeCatalog?: BadgeCatalogRow[];
          fallback?: boolean;
          error?: string;
        };

        if (!mounted) return;

        if (!response.ok || !result.ok) {
          setStatus(result.error ?? "Contributor profile is not available yet");
          return;
        }

        const loadedProfile = result.profile ?? null;
        setProfile(loadedProfile);
        setRecords(result.records ?? []);
        setBadgeAwards(result.badgeAwards ?? []);
        setBadgeCatalog(result.badgeCatalog ?? []);

        if (loadedProfile) {
          setHandle(cleanString(loadedProfile.handle));
          setDisplayName(cleanString(loadedProfile.display_name));
          setPublicBio(cleanString(loadedProfile.public_bio));
          setCounty(cleanString(loadedProfile.county));
          setState(cleanString(loadedProfile.state) || "TX");
          setPrimaryLevel(loadedProfile.primary_level);
          setPublicProfileEnabled(Boolean(loadedProfile.public_profile_enabled));
          setStatus(loadedProfile.public_profile_enabled ? "Public contributor profile is live" : "Contributor profile is private");
        } else {
          setStatus(result.fallback ? "Server reputation tables are not connected yet" : "Create your contributor profile");
        }
      } catch {
        if (!mounted) return;
        setStatus("Contributor profile API is not reachable yet");
      }
    }

    void loadContributorProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  async function saveContributorProfile(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    const normalizedHandle = normalizeContributorHandle(handle);
    if (publicProfileEnabled && !normalizedHandle) {
      setStatus("Use a public handle with 3-39 letters, numbers, dashes, or underscores.");
      return;
    }

    setSavingProfile(true);
    setStatus("Saving contributor profile");

    try {
      const response = await fetch("/api/member/contributor-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          displayName,
          publicBio,
          county,
          state,
          primaryLevel,
          publicProfileEnabled,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        profile?: ApiContributorProfile | null;
        records?: ContributorRecord[];
        badgeAwards?: ContributorBadgeAward[];
        badgeCatalog?: BadgeCatalogRow[];
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setStatus(result.error ?? "Contributor profile could not be saved");
        return;
      }

      setProfile(result.profile ?? null);
      setRecords(result.records ?? []);
      setBadgeAwards(result.badgeAwards ?? []);
      setBadgeCatalog(result.badgeCatalog ?? []);
      setStatus(result.profile?.public_profile_enabled ? "Public contributor profile is live" : "Contributor profile saved privately");
      track("contributor_profile_saved", {
        public_profile_enabled: Boolean(result.profile?.public_profile_enabled),
        primary_level: primaryLevel,
      });
    } catch {
      setStatus("Contributor profile API is not reachable yet");
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitContribution(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    setSubmittingRecord(true);
    setStatus("Submitting contribution");

    try {
      const response = await fetch("/api/member/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          targetType,
          targetLabel,
          title: contributionTitle,
          summary,
          sourceUrl,
          jurisdiction,
          county,
          state,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        profile?: ApiContributorProfile;
        record?: ContributorRecord;
        xpAwarded?: number;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.record) {
        setStatus(result.error ?? "Contribution could not be submitted");
        return;
      }

      if (result.profile) {
        setProfile(result.profile);
        setHandle(cleanString(result.profile.handle));
        setDisplayName(cleanString(result.profile.display_name));
        setPublicBio(cleanString(result.profile.public_bio));
        setCounty(cleanString(result.profile.county));
        setState(cleanString(result.profile.state) || "TX");
        setPrimaryLevel(result.profile.primary_level);
        setPublicProfileEnabled(Boolean(result.profile.public_profile_enabled));
      }

      setRecords((current) => [result.record!, ...current].slice(0, 20));
      setContributionTitle("");
      setTargetLabel("");
      setSourceUrl("");
      setJurisdiction("");
      setSummary("");
      setStatus(result.message ?? `Contribution logged. ${result.xpAwarded ?? 0} XP awarded.`);
      track("contributor_record_submitted", {
        kind,
        target_type: targetType,
        xp_awarded: result.xpAwarded ?? 0,
      });
    } catch {
      setStatus("Contribution API is not reachable yet");
    } finally {
      setSubmittingRecord(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Contributor reputation</p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">Reward the useful record. Never pay for contributions.</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Source Runners, Meeting Reporters, Vote Hunters, Funding Trackers, Researchers, Fact Checkers, Editors, and Community Builders earn
            public reputation for useful records. No bounties. No paid contribution market. Just XP, badges, accuracy, and rankings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/contributors"
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:border-red-300 hover:bg-white"
          >
            Leaderboards
          </Link>
          <Link
            href={publicHref}
            className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700"
          >
            Public Page
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="XP" value={xp.toLocaleString()} detail={levelFromXp(xp)} />
        <Metric label="Contributions" value={(profile?.contribution_count ?? records.length).toLocaleString()} detail="submitted for review" />
        <Metric label="Accepted Sources" value={(profile?.accepted_sources_count ?? 0).toLocaleString()} detail="review counted" />
        <Metric label="Accuracy" value={`${Math.round(profile?.accuracy_score ?? 100)}%`} detail="review signal" />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-800">Reputation track</p>
            <p className="mt-1 text-lg font-black text-blue-950">{levelFromXp(xp)}</p>
          </div>
          <p className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 shadow-sm">{status}</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#bf0d3e,#1d4ed8,#d6b35a)]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs font-bold text-slate-600">
          Next reputation marker: {nextTarget.toLocaleString()} XP. Accepted, verified, useful, and accurate records matter more than raw volume.
        </p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={saveContributorProfile} className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Public contributor profile</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Handle
              <input
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="east-texas-source-runner"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Display name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Name or public alias"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              County
              <input
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                placeholder="Gregg County"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              State
              <input
                value={state}
                onChange={(event) => setState(event.target.value)}
                placeholder="TX"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700 sm:col-span-2">
              Contributor lane
              <select
                value={primaryLevel}
                onChange={(event) => setPrimaryLevel(event.target.value as ContributorLevel)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {contributorLevels.map((level) => (
                  <option key={level} value={level}>
                    {contributorLevelLabels[level]}
                  </option>
                ))}
              </select>
              <span className="text-xs font-semibold leading-5 text-slate-500">{contributorLevelDescriptions[primaryLevel]}</span>
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700 sm:col-span-2">
              Public bio
              <textarea
                value={publicBio}
                onChange={(event) => setPublicBio(event.target.value)}
                rows={3}
                placeholder="Public-safe research focus. Do not include private addresses, private contact details, threats, or unsourced allegations."
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-950">
            <input
              type="checkbox"
              checked={publicProfileEnabled}
              onChange={(event) => setPublicProfileEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-blue-300"
            />
            Publish my contributor page
          </label>
          <button
            disabled={savingProfile}
            className="mt-3 rounded-xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700 disabled:bg-blue-300"
          >
            {savingProfile ? "Saving..." : "Save Contributor Profile"}
          </button>
        </form>

        <form onSubmit={submitContribution} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-blue-800">Log a contribution</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as ContributionKind)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {contributionKinds.map((item) => (
                <option key={item} value={item}>
                  {contributionKindLabels[item]}
                </option>
              ))}
            </select>
            <select
              value={targetType}
              onChange={(event) => setTargetType(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {targetTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <input
              value={targetLabel}
              onChange={(event) => setTargetLabel(event.target.value)}
              placeholder="Ted Cruz, Nacogdoches ISD, HB 12..."
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={jurisdiction}
              onChange={(event) => setJurisdiction(event.target.value)}
              placeholder="Texas, county, district, city..."
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={contributionTitle}
              onChange={(event) => setContributionTitle(event.target.value)}
              placeholder="Short contribution title"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:col-span-2"
            />
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="Public source URL when required"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:col-span-2"
            />
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={4}
              placeholder="What did you find, why does it matter, and what should RepWatchr check next?"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:col-span-2"
            />
          </div>
          <button
            disabled={submittingRecord}
            className="mt-3 rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-blue-950 disabled:bg-red-300"
          >
            {submittingRecord ? "Submitting..." : "Submit And Earn XP"}
          </button>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            Submission XP is reputation only. Accepted-source counts, verification, and accuracy update after review.
          </p>
        </form>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Badges</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(badgeAwards.length ? badgeAwards : []).map((award) => {
              const badge = badgeFromAward(award);
              if (!badge) return null;
              return (
                <div key={award.id} className={`rounded-xl border p-3 ${accentClasses[badge.accent] ?? accentClasses.slate}`}>
                  <p className="text-xs font-black uppercase tracking-wide">{badge.icon_label}</p>
                  <p className="mt-1 text-sm font-black">{badge.name}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{badge.description}</p>
                </div>
              );
            })}
            {!badgeAwards.length
              ? (badgeCatalog.length ? badgeCatalog : contributorBadgeCatalog.map((badge) => ({
                  badge_key: badge.badgeKey,
                  name: badge.name,
                  description: badge.description,
                  icon_label: badge.iconLabel,
                  accent: badge.accent,
                }))).slice(0, 4).map((badge) => (
                  <div key={badge.badge_key} className={`rounded-xl border p-3 opacity-70 ${accentClasses[badge.accent] ?? accentClasses.slate}`}>
                    <p className="text-xs font-black uppercase tracking-wide">{badge.icon_label}</p>
                    <p className="mt-1 text-sm font-black">{badge.name}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{earnedBadgeKeys.has(badge.badge_key) ? "Earned" : badge.description}</p>
                  </div>
                ))
              : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wide text-blue-800">Recent contribution records</p>
          <div className="mt-3 grid gap-3">
            {records.length ? (
              records.slice(0, 5).map((record) => (
                <div key={record.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-950">{record.title}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-900">
                      +{record.xp_awarded} XP / {record.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {contributionKindLabels[record.kind]} / {record.target_label}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-600">{record.summary}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                No contribution records yet. Submit one public source, vote, meeting, funding record, fact-check, edit, or community action to start reputation.
              </div>
            )}
          </div>
        </div>
      </div>

      {profile?.public_profile_enabled ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-blue-800">Public reputation page</p>
          <p className="mt-1 text-sm font-semibold text-blue-950">
            {contributorDisplayName(profile)} is public at{" "}
            <Link href={publicHref} className="font-black underline">
              {publicHref}
            </Link>
            .
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
      <p className="text-2xl font-black text-blue-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}
