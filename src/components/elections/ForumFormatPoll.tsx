"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import TurnstileChallenge from "@/components/auth/TurnstileChallenge";

type Payload = {
  question?: string;
  canVote: boolean;
  status: string;
  profileComplete: boolean;
  myVote: string | null;
  responseCount: number;
  minimumSample: number;
  resultsVisible: boolean;
  verificationProvider?: string;
  verificationSiteKey?: string | null;
  options: { optionId: string; label: string; percent: number | null; votes: number | null }[];
  message?: string;
};

const endpoint = "/api/races/marion-county-forum-format-2026/poll";
const nextPath = "/elections/texas/marion-county-judge-2026#forum-format-poll";
const preparedOptions = [
  { optionId: "organizer-selected", label: "A moderator selected by the organizer", percent: null, votes: null },
  { optionId: "mutually-agreed", label: "A moderator agreed to by the candidates", percent: null, votes: null },
  { optionId: "moderator-panel", label: "A panel of moderators", percent: null, votes: null },
  { optionId: "no-preference", label: "No preference / not sure", percent: null, votes: null },
];

export default function ForumFormatPoll() {
  const { user } = useAuth();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [choice, setChoice] = useState("");
  const [token, setToken] = useState("");
  const [resetNonce, setResetNonce] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await response.json() as Payload;
      if (!response.ok) { setPayload(null); setMessage("The forum-format poll is being prepared. No responses are being collected here yet."); return; }
      setPayload(data);
      setMessage(data.message || "");
      if (data.myVote) setChoice((current) => current || data.myVote || "");
    } catch { setPayload(null); setMessage("The forum-format poll could not be loaded. Please try again later."); }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60_000);
    return () => window.clearInterval(timer);
  }, [load, user?.id]);

  const canSubmit = Boolean(user && payload?.profileComplete && payload.canVote && choice && choice !== payload.myVote && !busy && (payload.verificationProvider !== "turnstile" || token));
  const options = payload?.options?.length ? payload.options : preparedOptions;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ optionId: choice, verificationToken: token }) });
      const data = await response.json() as Payload;
      if (response.ok) setPayload(data);
      setMessage(data.message || (response.ok ? "Your response is recorded." : "Your response could not be recorded."));
    } catch { setMessage("Your response could not be recorded. Please try again."); }
    finally { setBusy(false); setToken(""); setResetNonce((value) => value + 1); }
  }

  return (
    <section id="forum-format-poll" className="mt-8 scroll-mt-24 border-t border-slate-200 pt-6" aria-labelledby="forum-format-heading">
      <p className="text-xs font-black uppercase tracking-wide text-red-700">Public question</p>
      <h3 id="forum-format-heading" className="mt-2 text-xl font-black text-slate-950">{payload?.question || "Which moderation format would you prefer for a local candidate forum?"}</h3>
      <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">Choose a forum moderation format</legend>
        {options.map((option) => <label key={option.optionId} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 p-4">
          <input type="radio" name="forum-format" value={option.optionId} disabled={!payload?.canVote} checked={choice === option.optionId} onChange={() => setChoice(option.optionId)} className="mt-1" />
          <span><strong className="text-sm text-slate-900">{option.label}</strong>{payload?.resultsVisible && <span className="mt-1 block text-xs text-slate-500">{option.percent}% · {option.votes} responses</span>}</span>
        </label>)}
      </fieldset>
      {user && payload?.canVote && payload.profileComplete && payload.verificationProvider === "turnstile" && payload.verificationSiteKey ? <div className="mt-4"><TurnstileChallenge siteKey={payload.verificationSiteKey} action="race_vote" resetNonce={resetNonce} onToken={setToken} purpose="automated poll responses" /></div> : null}
      {payload?.canVote && !user ? <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="mt-4 inline-block rounded-lg bg-blue-950 px-4 py-3 font-bold text-white">Sign in to respond</Link> : user && payload?.canVote && !payload.profileComplete ? <Link href="/dashboard#member-profile" className="mt-4 inline-block text-sm font-bold text-blue-800 underline">Complete your free profile to respond</Link> : payload?.canVote ? <button type="button" disabled={!canSubmit} onClick={submit} className="mt-4 rounded-lg bg-blue-950 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "Recording…" : payload.myVote ? "Update my response" : "Record my response"}</button> : null}
      {message ? <p role="status" className="mt-3 text-sm leading-6 text-slate-600">{message}</p> : null}
      <p className="mt-4 text-xs leading-5 text-slate-500">{payload ? `${payload.responseCount} signed-in responses. ` : "Response counts are not available yet. "}Results appear after {payload?.minimumSample ?? 25} responses. One current response per completed profile. This is a self-selected community poll, not a scientific survey, a measure of local residents, or an election result.</p>
    </section>
  );
}
