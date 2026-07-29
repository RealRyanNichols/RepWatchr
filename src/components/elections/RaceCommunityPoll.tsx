"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./FlagshipRaceExperience.module.css";

type OptionId = "dina-k-carroll" | "leward-j-lafleur-ii";

type PollOption = {
  optionId: OptionId;
  label: string;
  votes: number | null;
  percent: number | null;
};

type PollPayload = {
  enabled: boolean;
  status: "draft" | "open" | "closed" | "unavailable";
  canVote: boolean;
  question?: string;
  asOf: string | null;
  closesAt: string | null;
  minimumSample: number;
  responseCount: number;
  resultsVisible?: boolean;
  profileComplete?: boolean;
  myVote: OptionId | null;
  options: PollOption[];
  message?: string;
};

const pollEndpoint = "/api/races/marion-county-judge-2026/poll";
const returnPath =
  "/elections/texas/marion-county-judge-2026#community-poll";
const savedChoiceKey = "repwatchr:marion-county-judge-2026:choice";

const optionDetails: Record<OptionId, string> = {
  "dina-k-carroll": "Announced write-in challenger",
  "leward-j-lafleur-ii": "Republican nominee · incumbent",
};

const fallbackOptions: PollOption[] = [
  {
    optionId: "dina-k-carroll",
    label: "Dina K. Carroll",
    votes: null,
    percent: null,
  },
  {
    optionId: "leward-j-lafleur-ii",
    label: "Leward J. LaFleur II",
    votes: null,
    percent: null,
  },
];

function leaderLine(options: PollOption[]) {
  const [first, second] = options;
  if (
    !first ||
    !second ||
    first.percent === null ||
    second.percent === null
  ) {
    return "";
  }
  if (first.percent === second.percent) {
    return "This community pulse is currently tied.";
  }

  const firstPercent = first.percent;
  const secondPercent = second.percent;
  const leader = firstPercent > secondPercent ? first : second;
  const points = Math.abs(firstPercent - secondPercent);
  const shortName =
    leader.optionId === "dina-k-carroll" ? "Dina Carroll" : "Leward LaFleur";
  return `${shortName} leads this community pulse by ${points} ${
    points === 1 ? "point" : "points"
  }.`;
}

function formatUpdated(value: string | null) {
  if (!value) return "Updates after each recorded response";
  return `Updated ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))}`;
}

export default function RaceCommunityPoll() {
  const { user, loading: authLoading } = useAuth();
  const [payload, setPayload] = useState<PollPayload | null>(null);
  const [choice, setChoice] = useState<OptionId | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadPoll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(pollEndpoint, { cache: "no-store" });
      const data = (await response.json()) as PollPayload;
      setPayload(data);
      if (!response.ok) {
        setMessage(data.message ?? "The community pulse is temporarily unavailable.");
      }
      if (data.myVote) {
        setChoice((current) => current ?? data.myVote);
      }
    } catch {
      setMessage("The community pulse could not be loaded.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedChoice = window.sessionStorage.getItem(savedChoiceKey);
    if (
      savedChoice === "dina-k-carroll" ||
      savedChoice === "leward-j-lafleur-ii"
    ) {
      setChoice(savedChoice);
    }
    void loadPoll();

    const refresh = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadPoll(true);
    }, 60_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void loadPoll(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadPoll]);

  useEffect(() => {
    if (choice) window.sessionStorage.setItem(savedChoiceKey, choice);
  }, [choice]);

  const options = payload?.options ?? fallbackOptions;
  const recordedChoice = payload?.myVote ?? null;
  const resultSummary = leaderLine(options);
  const responseCount = payload?.responseCount ?? 0;
  const canSubmit =
    Boolean(user) &&
    Boolean(choice) &&
    choice !== recordedChoice &&
    payload?.profileComplete === true &&
    payload?.canVote === true &&
    !submitting;

  async function submitVote() {
    if (!choice || !canSubmit) return;
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(pollEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId: choice }),
      });
      const data = (await response.json()) as PollPayload;
      if (response.ok) {
        setPayload(data);
        setMessage(data.message ?? "Your response is recorded.");
        window.sessionStorage.removeItem(savedChoiceKey);
      } else {
        setMessage(data.message ?? "Your response could not be recorded.");
      }
    } catch {
      setMessage("Your response could not be recorded.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="community-poll"
      className={styles.heroPoll}
      aria-labelledby="poll-heading"
    >
      <header className={styles.heroPollHeader}>
        <div>
          <p className={styles.pollLiveLabel}>
            <span aria-hidden="true" />
            Live Marion County poll
          </p>
          <strong className={styles.pollCallout}>Cast your vote</strong>
          <h2 id="poll-heading">
            {payload?.question ??
              "If the election were today, who would you support?"}
          </h2>
        </div>
        <span className={styles.pollResponseCount}>
          {responseCount}
          <small>profile-backed {responseCount === 1 ? "vote" : "votes"}</small>
        </span>
      </header>

      <fieldset
        className={styles.heroPollChoices}
        disabled={!payload?.canVote && !loading}
      >
        <legend className={styles.srOnly}>Choose one candidate</legend>
        {options.map((option) => {
          const selected = choice === option.optionId;
          const recorded = recordedChoice === option.optionId;
          return (
            <label
              key={option.optionId}
              className={selected ? styles.pollChoiceSelected : undefined}
            >
              <input
                type="radio"
                name="marion-county-judge-choice"
                value={option.optionId}
                checked={selected}
                onChange={() => setChoice(option.optionId)}
              />
              <span className={styles.pollChoiceCopy}>
                <strong>{option.label}</strong>
                <small>{optionDetails[option.optionId]}</small>
              </span>
              <span className={styles.pollChoiceState}>
                {recorded ? "Recorded" : selected ? "Selected" : "Choose"}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className={styles.heroPollResults} aria-live="polite">
        <div className={styles.pollLeaderRow}>
          <span>Live result</span>
          <strong>
            {responseCount === 0
              ? "Waiting for the first verified vote"
              : resultSummary}
          </strong>
        </div>
        <div
          className={styles.pollSplit}
          role="img"
          aria-label={
            responseCount === 0
              ? "No recorded votes yet"
              : options
                  .map((option) => `${option.label}: ${option.percent ?? 0}%`)
                  .join("; ")
          }
        >
          <span
            className={styles.pollSplitDina}
            style={{ width: `${options[0]?.percent ?? 0}%` }}
          />
          <span
            className={styles.pollSplitLafleur}
            style={{ width: `${options[1]?.percent ?? 0}%` }}
          />
        </div>
        <div className={styles.pollResultLabels}>
          {options.map((option) => (
            <span key={option.optionId}>
              <strong>{option.percent ?? 0}%</strong>
              <small>
                {option.optionId === "dina-k-carroll"
                  ? "Dina Carroll"
                  : "Leward LaFleur"}
                {" · "}
                {option.votes ?? 0} {option.votes === 1 ? "vote" : "votes"}
              </small>
            </span>
          ))}
        </div>
      </div>

      {!authLoading && !user && choice ? (
        <div className={styles.heroPollSignIn}>
          <strong>Create a free profile for your vote to count</strong>
          <p>
            Your selection is saved in this browser. Sign in or create a profile,
            then return here to record one real vote.
          </p>
          <SocialAuthButtons compact nextPath={returnPath} />
          <Link
            className={styles.heroPollCreateProfile}
            href={`/auth/signup?next=${encodeURIComponent(returnPath)}`}
          >
            Create my RepWatchr profile
          </Link>
        </div>
      ) : user && payload?.profileComplete === false ? (
        <div className={styles.heroPollSignIn}>
          <strong>Finish your profile to make this vote count</strong>
          <p>
            Add your display name and home location. RepWatchr will not count
            account-only or automated responses.
          </p>
          <Link
            className={styles.heroPollCreateProfile}
            href="/dashboard#member-profile"
          >
            Complete my profile
          </Link>
        </div>
      ) : user ? (
        <button
          type="button"
          className={styles.heroPollSubmit}
          onClick={submitVote}
          disabled={!canSubmit}
        >
          {submitting
            ? "Recording…"
            : choice === recordedChoice
              ? "Response recorded"
              : recordedChoice
                ? "Update my response"
                : "Record my response"}
        </button>
      ) : (
        <p className={styles.pollChoicePrompt}>
          Tap a candidate. A free RepWatchr profile is required before it counts.
        </p>
      )}

      {message ? (
        <p className={styles.heroPollMessage} role="status">
          {message}
        </p>
      ) : null}

      <footer className={styles.heroPollFooter}>
        <span>
          One current vote per completed profile · invisible bot screening
        </span>
        <span>{formatUpdated(payload?.asOf ?? null)}</span>
        <small>
          Real profile-backed votes only. This is a self-selected community poll,
          not a scientific survey or official election result.
        </small>
      </footer>
    </section>
  );
}
