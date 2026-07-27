"use client";

import { useCallback, useEffect, useState } from "react";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import TurnstileChallenge from "@/components/auth/TurnstileChallenge";
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./FlagshipRaceExperience.module.css";

type OptionId = "dina-k-carroll" | "leward-j-lafleur-ii";
type SegmentKey = "all" | "verified_marion" | "verified_outside" | "residence_unverified";

type PollResult = {
  optionId: OptionId;
  label: string;
  votes: number;
  percent: number;
};

type PollSegment = {
  key: SegmentKey;
  label: string;
  total: number;
  suppressed: boolean;
  results: PollResult[];
};

type PollPayload = {
  enabled: boolean;
  asOf: string | null;
  minimumSample: number;
  segments: PollSegment[];
  message?: string;
};

const segmentLabels: Record<SegmentKey, string> = {
  all: "All participants",
  verified_marion: "Verified Marion residents",
  verified_outside: "Verified outside Marion",
  residence_unverified: "Residence unverified",
};

const options: Array<{ id: OptionId; label: string; detail: string }> = [
  { id: "dina-k-carroll", label: "Dina K. Carroll", detail: "Declared write-in" },
  { id: "leward-j-lafleur-ii", label: "Leward J. LaFleur II", detail: "Republican incumbent" },
];

export default function RaceCommunityPoll({
  enabled,
  siteKey,
}: {
  enabled: boolean;
  siteKey: string;
}) {
  const { user } = useAuth();
  const [payload, setPayload] = useState<PollPayload | null>(null);
  const [segment, setSegment] = useState<SegmentKey>("verified_marion");
  const [choice, setChoice] = useState<OptionId | null>(null);
  const [token, setToken] = useState("");
  const [resetNonce, setResetNonce] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const onToken = useCallback((value: string) => setToken(value), []);

  const loadPoll = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const response = await fetch("/api/races/marion-county-judge-2026/poll", {
        cache: "no-store",
      });
      const data = (await response.json()) as PollPayload;
      setPayload(data);
      if (!response.ok) setMessage(data.message ?? "The community pulse is not available yet.");
    } catch {
      setMessage("The community pulse could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPoll();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadPoll]);

  async function submitVote() {
    if (!choice || !token || submitting) return;
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/races/marion-county-judge-2026/poll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId: choice, turnstileToken: token }),
      });
      const result = (await response.json()) as { message?: string };
      setMessage(
        response.ok
          ? result.message ?? "Your response is recorded. You can change it later."
          : result.message ?? "Your response could not be recorded.",
      );
      if (response.ok) {
        setChoice(null);
        await loadPoll();
      }
    } catch {
      setMessage("Your response could not be recorded.");
    } finally {
      setSubmitting(false);
      setToken("");
      setResetNonce((value) => value + 1);
    }
  }

  if (!enabled) {
    return (
      <div className={styles.pollUnavailable}>
        <div>
          <span>Integrity gate</span>
          <strong>The poll interface is built; verified voting is not switched on in this preview.</strong>
        </div>
        <p>
          Launch requires the staged database migration, Turnstile keys and server-owned
          residence verification. RepWatchr will not collect a misleading “local” result from
          self-reported geography.
        </p>
        <ul>
          <li>One signed-in account, one current response</li>
          <li>Facebook, X or email login plus bot challenge</li>
          <li>County segment determined on the server</li>
          <li>Small segments hidden below the privacy threshold</li>
        </ul>
      </div>
    );
  }

  const selectedSegment = payload?.segments.find((item) => item.key === segment);

  return (
    <div className={styles.pollCard}>
      <div className={styles.pollControls}>
        <div className={styles.pollChoices} role="radiogroup" aria-label="Candidate choice">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={choice === option.id}
              className={choice === option.id ? styles.choiceSelected : ""}
              onClick={() => setChoice(option.id)}
            >
              <span>{option.label}</span>
              <small>{option.detail}</small>
            </button>
          ))}
        </div>

        {!user ? (
          <div className={styles.pollSignIn}>
            <strong>Sign in to participate</strong>
            <p>Your public social profile does not determine your county verification.</p>
            <SocialAuthButtons compact nextPath="/elections/texas/marion-county-judge-2026#community-poll" />
          </div>
        ) : (
          <div className={styles.pollVerify}>
            <TurnstileChallenge
              siteKey={siteKey}
              action="marion_county_race_poll"
              resetNonce={resetNonce}
              onToken={onToken}
            />
            <button
              type="button"
              onClick={submitVote}
              disabled={!choice || !token || submitting}
            >
              {submitting ? "Recording…" : "Record my response"}
            </button>
          </div>
        )}
        {message ? <p className={styles.pollMessage}>{message}</p> : null}
      </div>

      <div className={styles.pollResults} aria-live="polite">
        <div className={styles.segmentTabs} role="tablist" aria-label="Poll result segment">
          {(Object.keys(segmentLabels) as SegmentKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={segment === key}
              onClick={() => setSegment(key)}
            >
              {segmentLabels[key]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={styles.pollEmpty}>Loading the reviewed aggregate…</p>
        ) : selectedSegment?.suppressed ? (
          <div className={styles.pollEmpty}>
            <strong>Results hidden until at least {payload?.minimumSample ?? 25} responses</strong>
            <p>
              Current sample: {selectedSegment.total}. This reduces the risk of identifying
              individual participants or overstating a tiny sample.
            </p>
          </div>
        ) : selectedSegment && selectedSegment.total > 0 ? (
          <div className={styles.resultBars}>
            {selectedSegment.results.map((result) => (
              <div key={result.optionId}>
                <p><strong>{result.label}</strong><span>{result.percent}%</span></p>
                <div><span style={{ width: `${result.percent}%` }} /></div>
                <small>{result.votes} responses</small>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.pollEmpty}>No reviewed responses in this segment yet.</p>
        )}

        <footer>
          RepWatchr community pulse—not an official election or scientific poll.
          Results show signed-in, Turnstile-confirmed responses; residence labels require
          separate verification. One current response per account. Updated{" "}
          {payload?.asOf ? new Date(payload.asOf).toLocaleString() : "when responses arrive"}.
        </footer>
      </div>
    </div>
  );
}
