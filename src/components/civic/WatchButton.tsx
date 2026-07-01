"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getOrCreateAnonymousId, trackEvent } from "@/lib/analytics-client";
import { type CivicWatchEntityType, watchReasons, type WatchReason } from "@/lib/civic-actions";

const pendingStorageKey = "repwatchr.pending.watchIntents.v1";

type PendingWatchIntent = {
  entityType: CivicWatchEntityType;
  entityId: string;
  entityName?: string;
  entitySlug?: string;
  reason?: string;
  sourceRoute?: string;
  createdAt: string;
};

export type WatchButtonProps = {
  entityType: CivicWatchEntityType;
  entityId: string;
  entityName: string;
  entitySlug?: string;
  sourceRoute?: string;
  interestTags?: string[];
  compact?: boolean;
};

function readPendingIntents(): PendingWatchIntent[] {
  try {
    const raw = window.localStorage.getItem(pendingStorageKey);
    const parsed = raw ? (JSON.parse(raw) as PendingWatchIntent[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
  } catch {
    return [];
  }
}

function writePendingIntents(intents: PendingWatchIntent[]) {
  try {
    window.localStorage.setItem(pendingStorageKey, JSON.stringify(intents.slice(-50)));
  } catch {
    // Watch intent remains server-side when storage is blocked.
  }
}

export function AnonymousWatchIntentConverter() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const anonymousId = getOrCreateAnonymousId();
    const pending = readPendingIntents();
    if (!anonymousId || !pending.length) return;

    let mounted = true;
    fetch("/api/watch", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousId }),
    })
      .then((response) => response.json())
      .then((data: { ok?: boolean; converted?: number }) => {
        if (!mounted || !data.ok) return;
        writePendingIntents([]);
        void trackEvent("anonymous_watch_converted", { converted_count: data.converted ?? 0 });
      })
      .catch(() => null);

    return () => {
      mounted = false;
    };
  }, [user]);

  return null;
}

export function WatchReasonSelector({
  value,
  onChange,
}: {
  value: WatchReason;
  onChange: (value: WatchReason) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {watchReasons.map((reason) => (
        <button
          key={reason}
          type="button"
          onClick={() => onChange(reason)}
          className={`rounded-xl border px-3 py-2 text-left text-xs font-black uppercase tracking-wide transition ${
            value === reason
              ? "border-blue-500 bg-blue-50 text-blue-950"
              : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-700"
          }`}
        >
          {reason}
        </button>
      ))}
    </div>
  );
}

export function AnonymousWatchPrompt({ entityName }: { entityName: string }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
      <p className="text-sm font-black">Watch intent saved for {entityName}.</p>
      <p className="mt-1 text-xs font-semibold leading-5">
        Create a free account or log in to attach this watch to your dashboard.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/auth/signup" className="rounded-lg bg-blue-950 px-3 py-2 text-xs font-black uppercase text-white hover:bg-red-700">
          Create account
        </Link>
        <Link href="/auth/login" className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-black uppercase text-blue-950 hover:text-red-700">
          Log in
        </Link>
      </div>
    </div>
  );
}

export function WatchlistPicker() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
      Saved watches go into <span className="font-black text-slate-950">My Civic Watch</span>. Full watchlist selection lives in the dashboard.
    </div>
  );
}

export function CreateWatchlistInline() {
  return (
    <Link
      href="/dashboard/watchlists"
      className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase text-blue-950 hover:border-red-300 hover:text-red-700"
    >
      Manage watchlists
    </Link>
  );
}

export function WatchModal({
  open,
  entityName,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  saving,
  anonymousSaved,
}: {
  open: boolean;
  entityName: string;
  reason: WatchReason;
  onReasonChange: (value: WatchReason) => void;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
  anonymousSaved: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 p-3 backdrop-blur sm:place-items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Watch this record</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{entityName}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              This is civic/product feedback and update intent, not election voting.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-black text-slate-600">
            X
          </button>
        </div>
        <div className="mt-4">
          <WatchReasonSelector value={reason} onChange={onReasonChange} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="rounded-xl bg-red-700 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-blue-950 disabled:bg-slate-300"
          >
            {saving ? "Saving..." : "Save watch"}
          </button>
          <CreateWatchlistInline />
        </div>
        <div className="mt-4">
          <WatchlistPicker />
        </div>
        {anonymousSaved ? <div className="mt-4"><AnonymousWatchPrompt entityName={entityName} /></div> : null}
      </div>
    </div>
  );
}

export default function WatchButton({
  entityType,
  entityId,
  entityName,
  entitySlug,
  sourceRoute,
  interestTags = [],
  compact = false,
}: WatchButtonProps) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState<WatchReason>("Research");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [anonymousSaved, setAnonymousSaved] = useState(false);
  const [error, setError] = useState("");

  async function submitWatch() {
    setSaving(true);
    setError("");
    const anonymousId = getOrCreateAnonymousId();
    void trackEvent("watch_reason_selected", { entity_type: entityType, entity_id: entityId, reason });

    try {
      const response = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousId,
          entityType,
          entityId,
          entityName,
          entitySlug,
          sourceRoute: sourceRoute ?? window.location.pathname,
          reason,
          interestTags,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; mode?: string; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Watch could not be saved.");

      setSaved(true);
      setAnonymousSaved(data.mode === "anonymous");
      void trackEvent(data.mode === "anonymous" ? "anonymous_watch_intent_created" : "watchlist_add", {
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        reason,
      });

      if (data.mode === "anonymous") {
        writePendingIntents([
          ...readPendingIntents(),
          { entityType, entityId, entityName, entitySlug, reason, sourceRoute: sourceRoute ?? window.location.pathname, createdAt: new Date().toISOString() },
        ]);
      } else {
        window.setTimeout(() => setModalOpen(false), 800);
      }
    } catch (watchError) {
      setError(watchError instanceof Error ? watchError.message : "Watch could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function openModal() {
    setModalOpen(true);
    void trackEvent("watch_button_clicked", { entity_type: entityType, entity_id: entityId, logged_in: Boolean(user) });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`rounded-xl font-black uppercase tracking-wide transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          saved
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
            : "bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-red-700"
        } ${compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"}`}
      >
        {saved ? "Watching" : "Watch"}
      </button>
      {error ? (
        <span className="ml-2 align-middle text-xs font-bold text-red-200">{error}</span>
      ) : null}
      <WatchModal
        open={modalOpen}
        entityName={entityName}
        reason={reason}
        onReasonChange={setReason}
        onClose={() => setModalOpen(false)}
        onConfirm={submitWatch}
        saving={saving}
        anonymousSaved={anonymousSaved}
      />
    </>
  );
}
