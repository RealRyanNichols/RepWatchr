"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import type { DigestPreview, NotificationPreferences } from "@/lib/digest-notifications";

const preferenceFields: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
  { key: "weekly_digest", label: "Weekly digest", description: "One weekly utility summary from watched records and submissions." },
  { key: "daily_digest", label: "Daily digest", description: "More frequent digest preview for active watchers." },
  { key: "breaking_alerts", label: "Breaking alerts", description: "Only real watched-record updates. No fake urgency." },
  { key: "watched_official_updates", label: "Watched official updates", description: "Profile, source, correction, and status updates." },
  { key: "watched_race_updates", label: "Watched race updates", description: "Candidate, source, filing, and race changes." },
  { key: "watched_jurisdiction_updates", label: "Watched jurisdiction updates", description: "County, city, school board, and agency changes." },
  { key: "source_review_updates", label: "Source review updates", description: "Your submitted sources and review status." },
  { key: "contribution_updates", label: "Contribution updates", description: "Contributor reputation and accepted-source updates." },
  { key: "records_request_updates", label: "Records request updates", description: "Draft, sent, response, overdue, and response-intake reminders." },
  { key: "package_updates", label: "Package updates", description: "Only relevant service-package signals. No spammy sales push." },
];

type DigestPreferencesPanelProps = {
  initialPreferences: NotificationPreferences;
  initialPreview: DigestPreview;
};

function statusText(value: string) {
  return value.replaceAll("_", " ");
}

export default function DigestPreferencesPanel({ initialPreferences, initialPreview }: DigestPreferencesPanelProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [preview, setPreview] = useState(initialPreview);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    trackRepWatchrEvent("digest_preferences_open", {
      sending_enabled: initialPreview.sendingEnabled,
      consent_required: initialPreview.consentRequired,
    });
  }, [initialPreview.consentRequired, initialPreview.sendingEnabled]);

  function setBoolean(key: keyof NotificationPreferences, value: boolean) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  async function savePreferences(patch: Record<string, unknown> = {}) {
    setBusy("preferences");
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(preferenceFields.map((field) => [field.key, Boolean(preferences[field.key])])),
          email: preferences.email || "",
          email_consent: Boolean(preferences.email_consent_at),
          ...patch,
        }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; preferences?: NotificationPreferences; error?: string } | null;
      if (!response.ok || !data?.ok || !data.preferences) throw new Error(data?.error || "Preference save failed.");
      setPreferences(data.preferences);
      trackRepWatchrEvent(patch.unsubscribe ? "digest_unsubscribe_clicked" : "digest_preference_changed", {
        weekly_digest: Boolean(data.preferences.weekly_digest),
        daily_digest: Boolean(data.preferences.daily_digest),
      });
      setNotice(patch.unsubscribe ? "Digest email unsubscribed. You can turn it back on later." : "Digest preferences saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Preference save failed.");
    } finally {
      setBusy("");
    }
  }

  async function refreshPreview() {
    setBusy("preview");
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/notifications/digest-preview");
      const data = (await response.json().catch(() => null)) as { ok?: boolean; preview?: DigestPreview; error?: string } | null;
      if (!response.ok || !data?.ok || !data.preview) throw new Error(data?.error || "Digest preview failed.");
      setPreview(data.preview);
      trackRepWatchrEvent("digest_preview_generated", {
        digest_type: data.preview.digestType,
        sections: data.preview.sections.length,
      });
      setNotice("Digest preview refreshed.");
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Digest preview failed.");
    } finally {
      setBusy("");
    }
  }

  async function savePreviewToQueue() {
    setBusy("queue");
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/notifications/digest-queue", { method: "POST" });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; digestQueueId?: string; status?: string; preview?: DigestPreview; error?: string } | null;
      if (!response.ok || !data?.ok || !data.digestQueueId) throw new Error(data?.error || "Digest queue save failed.");
      if (data.preview) setPreview(data.preview);
      trackRepWatchrEvent("digest_queue_created", {
        digest_queue_id: data.digestQueueId,
        status: data.status || "",
      });
      setNotice(`Digest preview saved to queue as ${statusText(data.status || "pending")}. Email was not sent.`);
    } catch (queueError) {
      setError(queueError instanceof Error ? queueError.message : "Digest queue save failed.");
    } finally {
      setBusy("");
    }
  }

  const consentActive = Boolean(preferences.email_consent_at) && !preferences.unsubscribed_at;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Digest preferences</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Choose useful updates only.</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          RepWatchr will not send emails unless consent is active, email sending is enabled server-side, and your address is present.
        </p>

        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-950">
          {preview.sendingStatus}
          {consentActive ? " Consent is active." : " Consent is not active."}
        </div>

        {notice ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-950">{notice}</p> : null}
        {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-black text-red-950">{error}</p> : null}

        <div className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Email
            <input
              value={preferences.email ?? ""}
              onChange={(event) => setPreferences((current) => ({ ...current, email: event.target.value }))}
              className="field"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={consentActive}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  email_consent_at: event.target.checked ? current.email_consent_at || new Date().toISOString() : null,
                  unsubscribed_at: event.target.checked ? null : current.unsubscribed_at,
                }))
              }
              className="mt-1 h-4 w-4"
            />
            I consent to receive RepWatchr digest email based on my own watchlist, submissions, and dashboard activity.
          </label>
        </div>

        <div className="mt-5 grid gap-3">
          {preferenceFields.map((field) => (
            <label key={field.key} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(preferences[field.key])}
                onChange={(event) => setBoolean(field.key, event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block font-black text-slate-950">{field.label}</span>
                <span className="block text-xs font-semibold leading-5 text-slate-500">{field.description}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => savePreferences()} disabled={busy === "preferences"} className="primary-button disabled:opacity-50">
            {busy === "preferences" ? "Saving..." : "Save preferences"}
          </button>
          <button type="button" onClick={() => savePreferences({ unsubscribe: true })} disabled={busy === "preferences"} className="secondary-button disabled:opacity-50">
            Unsubscribe
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Digest preview</p>
            <h2 className="mt-2 text-3xl font-black">{preview.subject}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
              Generated {new Date(preview.generatedAt).toLocaleString("en-US")}. Preview only until email is enabled and consent is active.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={refreshPreview} disabled={busy === "preview"} className="secondary-button bg-white text-blue-950 disabled:opacity-50">
              {busy === "preview" ? "Refreshing..." : "Preview"}
            </button>
            <button type="button" onClick={savePreviewToQueue} disabled={busy === "queue"} className="secondary-button bg-white text-blue-950 disabled:opacity-50">
              {busy === "queue" ? "Saving..." : "Save queue row"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {preview.sections.map((section) => (
            <article key={section.key} className="rounded-3xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d6b35a]">{section.title}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">{section.summary}</p>
              <div className="mt-3 grid gap-2">
                {section.items.map((item) => (
                  <Link
                    key={`${section.key}-${item.entityType}-${item.entityId}-${item.title}`}
                    href={item.url}
                    onClick={() =>
                      trackRepWatchrEvent("digest_item_clicked", {
                        section: section.key,
                        entity_type: item.entityType,
                      })
                    }
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 hover:border-[#d6b35a]"
                  >
                    <span className="block text-sm font-black text-white">{item.title}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-300">{item.summary}</span>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
