"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import GideonSearchBox from "@/components/shared/GideonSearchBox";
import { collectGideonInteraction } from "@/lib/gideon-client";

type GideonConsoleProps = {
  initialQuery?: string;
};

type Message = {
  role: "user" | "gideon";
  content: string;
};

const promptButtons = [
  "Find who represents me",
  "Build a school-board research path",
  "Track a county race",
  "Collect evidence for a concern",
  "Show me what to search next",
];

function buildAnswer(input: string): string {
  const text = input.toLowerCase();

  if (text.includes("school") || text.includes("board") || text.includes("isd")) {
    return "Start with the district profile. I need the district name, county, and any person or issue you are checking. Then I can point you to board members, source links, public questions, claims, and open research gaps.";
  }

  if (text.includes("county") || text.includes("city") || text.includes("mayor") || text.includes("commissioner")) {
    return "Give me the county or city first. I will narrow it to county judge, sheriff, district attorney, commissioners, mayor, council members, and related school-board records where RepWatchr has them loaded.";
  }

  if (text.includes("race") || text.includes("election") || text.includes("candidate")) {
    return "For a race, I need office, district, county, election date, and candidate names if you have them. The useful output is a race file: candidate profiles, funding, votes, public statements, praise, concerns, and missing records.";
  }

  if (text.includes("evidence") || text.includes("concern") || text.includes("bad") || text.includes("wrong")) {
    return "Keep it source-backed. Give me what happened, who was involved, where it happened, dates, public links, and documents. RepWatchr should separate facts, allegations, missing records, and questions that deserve a public answer.";
  }

  return "I can help search RepWatchr and shape the next question. Start with a name, school, county, city, district, race, issue, vote, donor, or source link.";
}

export default function GideonConsole({ initialQuery = "" }: GideonConsoleProps) {
  const [input, setInput] = useState(initialQuery);
  const [isAsking, setIsAsking] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "gideon",
      content:
        "I am Gideon inside RepWatchr. Ask for a rep, school board, city, county, district, race, vote, donor, red flag, praise report, or research path.",
    },
  ]);
  const nextAnswer = useMemo(() => buildAnswer(input), [input]);

  async function send(nextInput = input, kind: "chat" | "prompt_button" = "chat") {
    const trimmed = nextInput.trim();
    if (!trimmed || isAsking) return;

    const visibleHistory = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(visibleHistory);
    setIsAsking(true);
    setLiveError(null);
    collectGideonInteraction({ kind, content: trimmed, metadata: { source: "gideon_console" } });
    setInput("");

    try {
      const response = await fetch("/api/gideon/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
          tier: "free",
          userContext: { page: "gideon_console" },
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Gideon is not reachable.");
      }

      const body = (await response.json()) as { reply?: string | null; fallback?: boolean };
      const reply = body.reply?.trim() || buildAnswer(trimmed);
      setMessages((current) => [...current, { role: "gideon", content: reply }]);
      if (body.fallback) {
        setLiveError("Live Gideon endpoint is not configured yet. Showing RepWatchr fallback guidance.");
      }
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Gideon is not reachable.");
      setMessages((current) => [...current, { role: "gideon", content: buildAnswer(trimmed) }]);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#2b3247] bg-[#0A0E1A] text-[#F4EFE4] shadow-2xl">
      <div className="border-b border-white/10 bg-[linear-gradient(135deg,#0A0E1A_0%,#131826_48%,#1E2538_100%)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4A855]">GideonAI</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#F4EFE4]">Truth, tested.</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#9CA3B8]">
              This first RepWatchr integration searches the public data, collects research direction, and prompts the member for the facts needed to find the right official or school-board record.
            </p>
          </div>
          <Link
            href="/search"
            className="rounded-xl bg-[#D4A855] px-4 py-3 text-sm font-black text-[#0A0E1A] transition hover:bg-[#FF6B2C]"
          >
            Open full search
          </Link>
        </div>
        <div className="mt-5">
          <GideonSearchBox compact placeholder="Search RepWatchr, or ask Gideon what to find..." />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "gideon" ? "rounded-2xl bg-white/10 p-4" : "ml-auto max-w-[86%] rounded-2xl bg-[#D4A855] p-4 text-[#0A0E1A]"}
              >
                <p className="text-xs font-black uppercase tracking-wide opacity-70">
                  {message.role === "gideon" ? "Gideon" : "You"}
                </p>
                <p className="mt-1 text-sm font-semibold leading-6">{message.content}</p>
              </div>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
            className="mt-5"
          >
            <label htmlFor="gideon-chat-input" className="sr-only">
              Ask Gideon
            </label>
            <textarea
              id="gideon-chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
              placeholder="Tell Gideon what you are trying to find..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-[#F4EFE4] placeholder:text-[#9CA3B8] focus:border-[#D4A855] focus:outline-none focus:ring-1 focus:ring-[#D4A855]"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold leading-5 text-[#9CA3B8]">
                {liveError ? liveError : `Next answer preview: ${nextAnswer.slice(0, 92)}...`}
              </p>
              <button
                type="submit"
                disabled={isAsking}
                className="rounded-xl bg-[#D4A855] px-5 py-2.5 text-sm font-black text-[#0A0E1A] transition hover:bg-[#FF6B2C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAsking ? "Asking..." : "Ask Gideon"}
              </button>
            </div>
          </form>
        </div>

        <aside className="p-5">
          <p className="text-sm font-black text-[#D4A855]">Answer buttons</p>
          <div className="mt-4 grid gap-2">
            {promptButtons.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setInput(prompt);
                  void send(prompt, "prompt_button");
                }}
                disabled={isAsking}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-black text-[#F4EFE4] transition hover:border-[#D4A855] hover:bg-white/10"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-[#D4A855]/40 bg-[#D4A855]/10 p-4">
            <p className="text-sm font-black text-[#F4EFE4]">Data Gideon should collect</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-[#9CA3B8]">
              <li>Name, school, city, county, district, race, or office.</li>
              <li>What happened, when, and who was involved.</li>
              <li>Public links, documents, board minutes, videos, and filings.</li>
              <li>Whether the member wants to track, ask, report, or publish.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
