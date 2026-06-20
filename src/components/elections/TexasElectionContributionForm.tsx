"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isTexasElectionDbSubmissionsEnabled } from "@/lib/supabase";

type ContributionRace = {
  slug: string;
  title: string;
  shortTitle: string;
  region: string;
};

type ContributionType =
  | "candidate_info"
  | "source_link"
  | "event"
  | "debate_clip"
  | "funding_record"
  | "local_issue"
  | "county_result"
  | "question_for_candidate"
  | "correction"
  | "other";

type TexasElectionContributionFormProps = {
  races: ContributionRace[];
  defaultRaceSlug?: string;
};

type SavedSourcePacket = {
  id: string;
  title: string;
  raceTitle: string;
  raceSlug: string;
  sourceUrl: string;
  createdAt: string;
  packet: string;
};

const contributionTypes: Array<{ value: ContributionType; label: string }> = [
  { value: "candidate_info", label: "Candidate info" },
  { value: "source_link", label: "Source link" },
  { value: "event", label: "Event or town hall" },
  { value: "debate_clip", label: "Debate or video clip" },
  { value: "funding_record", label: "Funding record" },
  { value: "local_issue", label: "Local issue" },
  { value: "county_result", label: "County result" },
  { value: "question_for_candidate", label: "Question for candidate" },
  { value: "correction", label: "Correction" },
  { value: "other", label: "Other source-backed item" },
];

const databaseSubmissionsEnabled = isTexasElectionDbSubmissionsEnabled;
const packetStorageKey = "repwatchr.texasElectionSourcePackets.v1";

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "repwatchr-source-packet";
}

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function TexasElectionContributionForm({
  races,
  defaultRaceSlug,
}: TexasElectionContributionFormProps) {
  const { user, profile, loading } = useAuth();
  const supabase = useMemo(() => (databaseSubmissionsEnabled ? createClient() : null), []);
  const initialRaceSlug = races.some((race) => race.slug === defaultRaceSlug)
    ? defaultRaceSlug!
    : races[0]?.slug ?? "";

  const [raceSlug, setRaceSlug] = useState(initialRaceSlug);
  const [contributionType, setContributionType] = useState<ContributionType>("source_link");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [county, setCounty] = useState(profile?.county ?? "");
  const [city, setCity] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successRaceSlug, setSuccessRaceSlug] = useState("");
  const [generatedPacket, setGeneratedPacket] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedPackets, setSavedPackets] = useState<SavedSourcePacket[]>([]);

  useEffect(() => {
    let mounted = true;

    function setPacketsSafely(packets: SavedSourcePacket[]) {
      window.setTimeout(() => {
        if (mounted) setSavedPackets(packets);
      }, 0);
    }

    try {
      const stored = window.localStorage.getItem(packetStorageKey);
      if (!stored) {
        return () => {
          mounted = false;
        };
      }
      const parsed = JSON.parse(stored) as SavedSourcePacket[];
      if (Array.isArray(parsed)) {
        setPacketsSafely(parsed.filter((item) => item?.id && item?.packet).slice(0, 20));
      }
    } catch {
      setPacketsSafely([]);
    }

    return () => {
      mounted = false;
    };
  }, []);

  const selectedRace = races.find((race) => race.slug === raceSlug);
  const canBuildPacket =
    Boolean(selectedRace) &&
    title.trim().length > 0 &&
    summary.trim().length > 0 &&
    isValidUrl(sourceUrl.trim()) &&
    acknowledged &&
    !submitting;
  const canSubmit =
    canBuildPacket && (!databaseSubmissionsEnabled || Boolean(user));

  function buildPacket() {
    const typeLabel = contributionTypes.find((type) => type.value === contributionType)?.label ?? contributionType;

    return [
      "RepWatchr Texas Election Source Packet",
      "",
      `Race: ${selectedRace?.title ?? "Unknown race"}`,
      `Race page: https://www.repwatchr.com/elections/texas/${selectedRace?.slug ?? ""}`,
      `Type: ${typeLabel}`,
      `Title: ${title.trim()}`,
      `Source: ${sourceLabel.trim() || sourceUrl.trim()}`,
      `Source URL: ${sourceUrl.trim()}`,
      `County: ${county.trim() || "Not supplied"}`,
      `City: ${city.trim() || "Not supplied"}`,
      `Contact email: ${contactEmail.trim() || user?.email || "Not supplied"}`,
      "",
      "What this source shows:",
      summary.trim(),
      "",
      "Review guardrail:",
      "Public, source-backed election information only. No private addresses, minors' information, sealed records, threats, or unsupported accusations.",
    ].join("\n");
  }

  async function copyPacket(packet: string) {
    try {
      await navigator.clipboard.writeText(packet);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function savePacket(packet: string) {
    if (!selectedRace) return;

    const savedPacket: SavedSourcePacket = {
      id: `${Date.now()}-${selectedRace.slug}`,
      title: title.trim(),
      raceTitle: selectedRace.title,
      raceSlug: selectedRace.slug,
      sourceUrl: sourceUrl.trim(),
      createdAt: new Date().toISOString(),
      packet,
    };
    const nextPackets = [savedPacket, ...savedPackets].slice(0, 20);
    setSavedPackets(nextPackets);
    try {
      window.localStorage.setItem(packetStorageKey, JSON.stringify(nextPackets));
      window.localStorage.setItem("repwatchr.latestTexasElectionSourcePacket", packet);
    } catch {
      // Packet remains visible in the form even if browser storage is blocked.
    }
  }

  function removeSavedPacket(id: string) {
    const nextPackets = savedPackets.filter((packet) => packet.id !== id);
    setSavedPackets(nextPackets);
    try {
      window.localStorage.setItem(packetStorageKey, JSON.stringify(nextPackets));
    } catch {
      // In-memory list still updates when storage is unavailable.
    }
  }

  function downloadPacket(packet: SavedSourcePacket) {
    downloadTextFile(`${safeFileName(packet.title)}.txt`, packet.packet);
  }

  function exportAllPackets() {
    downloadTextFile(
      `repwatchr-texas-source-packets-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(savedPackets, null, 2)
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRace) return;

    const trimmedSourceUrl = sourceUrl.trim();
    if (!isValidUrl(trimmedSourceUrl)) {
      setError("Add a public source URL that starts with http:// or https://.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessRaceSlug("");
    setGeneratedPacket("");
    setCopied(false);

    if (!databaseSubmissionsEnabled) {
      const packet = buildPacket();
      setGeneratedPacket(packet);
      await copyPacket(packet);
      savePacket(packet);
      setSubmitting(false);
      return;
    }

    if (!user) {
      setError("Live database submission requires an account. Create an account or use packet mode if the kill switch is turned on.");
      setSubmitting(false);
      return;
    }

    if (!supabase) {
      setError("Database submissions are not available in this browser session.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("texas_election_contributions").insert({
      user_id: user.id,
      race_slug: selectedRace.slug,
      race_title: selectedRace.title,
      contribution_type: contributionType,
      title: title.trim(),
      summary: summary.trim(),
      source_url: trimmedSourceUrl,
      source_label: sourceLabel.trim() || null,
      county: county.trim() || null,
      city: city.trim() || null,
      contact_email: contactEmail.trim() || user.email || null,
      metadata: {
        intake: "texas_election_contribution_form",
        page_path: `/elections/texas/${selectedRace.slug}`,
      },
    });

    if (insertError) {
      setError(
        insertError.message.includes("texas_election_contributions")
          ? "The Texas election contribution table is not reachable yet. Check Supabase env vars, Data API grants, and RLS policies."
          : insertError.message
      );
      setSubmitting(false);
      return;
    }

    setSuccessRaceSlug(selectedRace.slug);
    setTitle("");
    setSummary("");
    setSourceUrl("");
    setSourceLabel("");
    setCity("");
    setAcknowledged(false);
    setSubmitting(false);
  }

  if (loading && databaseSubmissionsEnabled) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-11 rounded bg-slate-100" />
        <div className="mt-3 h-28 rounded bg-slate-100" />
        <div className="mt-3 h-11 rounded bg-slate-100" />
      </div>
    );
  }

  if (databaseSubmissionsEnabled && !user) {
    return (
      <div className="rounded-lg border border-blue-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Contributor access</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
          Create an account before submitting Texas election records.
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
          Database submissions are enabled. Create an account so your source can be tied to a review queue
          before anything is amplified.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/create-account"
            className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-red-700"
          >
            Create account
          </Link>
          <Link
            href="/auth/login"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Texas contributor desk</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
            {databaseSubmissionsEnabled ? "Add a source to the Texas election record." : "Build a Texas election source packet."}
          </h2>
        </div>
        {!databaseSubmissionsEnabled ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-900">
            Packet mode
          </span>
        ) : profile?.verified ? (
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-green-800">
            Verified Texas voter
          </span>
        ) : (
          <Link
            href="/auth/verify"
            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-900 hover:border-red-300 hover:text-red-700"
          >
            Verify county
          </Link>
        )}
      </div>

      {!databaseSubmissionsEnabled ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-950">Current mode: source-packet builder.</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">
            Supabase submissions are off only when the public env vars are missing or the kill switch is set to false.
            This form still builds a clean review packet, copies it, and saves the latest packet in this browser.
          </p>
        </div>
      ) : null}

      {successRaceSlug ? (
        <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-black text-green-900">Submission received for review.</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-green-800">
            It is private until a RepWatchr operator checks the source and decides whether it belongs
            on a public race page.
          </p>
          <Link
            href={`/elections/texas/${successRaceSlug}`}
            className="mt-3 inline-flex text-sm font-black text-green-900 underline"
          >
            Open that race page
          </Link>
        </div>
      ) : null}

      {generatedPacket ? (
        <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-950">
            Source packet ready{copied ? " and copied." : "."}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-blue-900">
            Keep this packet for the review queue. When Supabase env vars are present, this same form submits directly.
          </p>
          <textarea
            readOnly
            value={generatedPacket}
            rows={10}
            className="mt-3 w-full resize-none rounded-lg border border-blue-200 bg-white px-3 py-3 text-xs font-semibold leading-5 text-slate-900"
          />
          <button
            type="button"
            onClick={() => copyPacket(generatedPacket)}
            className="mt-3 rounded-xl bg-blue-950 px-4 py-2 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700"
          >
            {copied ? "Copied" : "Copy packet"}
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile(`${safeFileName(title)}.txt`, generatedPacket)}
            className="ml-2 mt-3 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
          >
            Download
          </button>
          <a
            href={`mailto:Ryan@RealRyanNichols.com?subject=${encodeURIComponent(`RepWatchr Texas Source: ${title || selectedRace?.shortTitle || "Election packet"}`)}&body=${encodeURIComponent(generatedPacket)}`}
            className="ml-2 mt-3 inline-flex rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
          >
            Email packet
          </a>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <div>
          <label htmlFor="race_slug" className="block text-xs font-black uppercase tracking-wide text-slate-600">
            Race lane
          </label>
          <select
            id="race_slug"
            value={raceSlug}
            onChange={(event) => setRaceSlug(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-bold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            {races.map((race) => (
              <option key={race.slug} value={race.slug}>
                {race.shortTitle} - {race.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contribution_type" className="block text-xs font-black uppercase tracking-wide text-slate-600">
              Type
            </label>
            <select
              id="contribution_type"
              value={contributionType}
              onChange={(event) => setContributionType(event.target.value as ContributionType)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-bold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {contributionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="source_label" className="block text-xs font-black uppercase tracking-wide text-slate-600">
              Source label
            </label>
            <input
              id="source_label"
              value={sourceLabel}
              onChange={(event) => setSourceLabel(event.target.value)}
              maxLength={180}
              placeholder="County page, filing, article, video"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-xs font-black uppercase tracking-wide text-slate-600">
            Short title
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={180}
            placeholder="What should the reviewer notice?"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div>
          <label htmlFor="summary" className="block text-xs font-black uppercase tracking-wide text-slate-600">
            What this source shows
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            required
            rows={5}
            maxLength={3000}
            placeholder="State what happened, who is involved, the date, and why this belongs on the race page. Stick to what the source shows."
            className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div>
          <label htmlFor="source_url" className="block text-xs font-black uppercase tracking-wide text-slate-600">
            Public source URL
          </label>
          <input
            id="source_url"
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            required
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="county" className="block text-xs font-black uppercase tracking-wide text-slate-600">
              County
            </label>
            <input
              id="county"
              value={county}
              onChange={(event) => setCounty(event.target.value)}
              maxLength={120}
              placeholder="Gregg"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-xs font-black uppercase tracking-wide text-slate-600">
              City
            </label>
            <input
              id="city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={120}
              placeholder="Longview"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label htmlFor="contact_email" className="block text-xs font-black uppercase tracking-wide text-slate-600">
              Email
            </label>
            <input
              id="contact_email"
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              maxLength={240}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <label className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-amber-500 text-blue-900 focus:ring-blue-800"
          />
          <span className="text-sm font-bold leading-6 text-amber-950">
            I understand this is for public, source-backed election information. I am not submitting
            private addresses, minors&apos; information, sealed records, threats, or unsupported accusations.
          </span>
        </label>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-800">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {submitting ? "Working..." : databaseSubmissionsEnabled ? "Submit for review" : "Build source packet"}
        </button>

        {!databaseSubmissionsEnabled ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">Local packet queue</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {savedPackets.length} packet{savedPackets.length === 1 ? "" : "s"} saved in this browser.
                </p>
              </div>
              <button
                type="button"
                onClick={exportAllPackets}
                disabled={savedPackets.length === 0}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Export JSON
              </button>
            </div>
            {savedPackets.length ? (
              <div className="mt-4 grid gap-2">
                {savedPackets.slice(0, 5).map((packet) => (
                  <div key={packet.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-sm font-black text-blue-950">{packet.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-600">
                      {packet.raceTitle} / {new Date(packet.createdAt).toLocaleString()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyPacket(packet.packet)}
                        className="rounded-lg bg-blue-950 px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPacket(packet)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSavedPacket(packet.id)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-500 hover:border-red-300 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
