"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CopySnippetButton from "@/components/shared/CopySnippetButton";

const authorLanes = [
  {
    id: "watchdog-story",
    label: "Watchdog Story",
    heat: "High share value",
    promise: "Turn one public record into a story people can repeat.",
    moves: [
      "Name the official, office, agency, board, or vote.",
      "Attach a public source URL people can open.",
      "Write the claim as a record question, not a verdict.",
      "Submit the source packet and share the clean snippet.",
    ],
  },
  {
    id: "profile-builder",
    label: "Profile Builder",
    heat: "Keeps people clicking",
    promise: "Help fill a profile with offices, dates, sources, scores, and missing context.",
    moves: [
      "Pick one profile that needs stronger public data.",
      "Add office, district, term dates, photo source, and official links.",
      "Flag missing votes, meetings, donors, or red flags.",
      "Claim your contributor path so the work can be reviewed.",
    ],
  },
  {
    id: "meeting-reporter",
    label: "Meeting Reporter",
    heat: "Local pressure",
    promise: "Convert a meeting, agenda, clip, or board vote into a useful record.",
    moves: [
      "Capture the meeting date, body, agenda item, and vote.",
      "Link the agenda, minutes, video, packet, or official notice.",
      "List who voted, who was absent, and what is still unclear.",
      "Submit the record before the next meeting cycle.",
    ],
  },
  {
    id: "money-trail",
    label: "Money Trail",
    heat: "Deep dwell time",
    promise: "Follow donors, vendors, contracts, PACs, and influence signals.",
    moves: [
      "Start with one donor, vendor, PAC, contract, or finance filing.",
      "Connect the money to an official, vote, board, agency, or race.",
      "Separate confirmed records from questions that need review.",
      "Send the source trail so voters can inspect the chain.",
    ],
  },
  {
    id: "oversight-clip",
    label: "Oversight Clip",
    heat: "Fast social hook",
    promise: "Turn a hearing, interview, clip, or official statement into a source-backed post.",
    moves: [
      "Save the original clip or transcript link.",
      "Write the timestamp, speaker, office, and exact topic.",
      "Link the related official profile or record page.",
      "Share the snippet with a route back to the full record.",
    ],
  },
] as const;

const targetTypes = [
  { id: "official", label: "Official", placeholder: "U.S. representative, state legislator, mayor, or board member" },
  { id: "board", label: "Board", placeholder: "School board, city council, county commission" },
  { id: "vote", label: "Vote", placeholder: "Bill, agenda item, amendment, funding vote" },
  { id: "money", label: "Money", placeholder: "Donor, vendor, PAC, contract, campaign filing" },
  { id: "clip", label: "Clip", placeholder: "Hearing clip, meeting video, interview, transcript" },
  { id: "record", label: "Record", placeholder: "Court filing, public-record response, official roster" },
] as const;

const sourceTypes = [
  "Official URL",
  "Meeting video",
  "Agenda or minutes",
  "Campaign filing",
  "Court or agency record",
  "News article",
  "Clip with timestamp",
  "Needs source",
] as const;

const outputGoals = [
  "Story pitch",
  "Share post",
  "Profile buildout",
  "Source submission",
  "Watchlist plan",
] as const;

type LaneId = (typeof authorLanes)[number]["id"];
type TargetTypeId = (typeof targetTypes)[number]["id"];
type SourceType = (typeof sourceTypes)[number];
type OutputGoal = (typeof outputGoals)[number];

function selectedOrFallback<T extends { id: string }>(items: readonly T[], id: string): T {
  return items.find((item) => item.id === id) ?? items[0]!;
}

function cleanLine(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

export default function AuthorMissionBuilder() {
  const [laneId, setLaneId] = useState<LaneId>("watchdog-story");
  const [targetTypeId, setTargetTypeId] = useState<TargetTypeId>("official");
  const [sourceType, setSourceType] = useState<SourceType>("Official URL");
  const [outputGoal, setOutputGoal] = useState<OutputGoal>("Story pitch");
  const [targetName, setTargetName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [angle, setAngle] = useState("");

  const lane = selectedOrFallback(authorLanes, laneId);
  const targetType = selectedOrFallback(targetTypes, targetTypeId);

  const targetLabel = cleanLine(targetName, targetType.placeholder);
  const jurisdictionLabel = cleanLine(jurisdiction, "jurisdiction, district, seat, or agency");
  const sourceLabel = cleanLine(sourceUrl, "public source URL needed");
  const angleLabel = cleanLine(angle, "what voters need to inspect next");

  const shareSnippet = useMemo(() => {
    return [
      "RepWatchr author lead:",
      `${targetType.label}: ${targetLabel}`,
      `Place: ${jurisdictionLabel}`,
      `Record angle: ${angleLabel}`,
      `Source status: ${sourceType} - ${sourceLabel}`,
      "",
      "Read the profile, check the receipt, and submit better source links here:",
      "https://www.repwatchr.com/authors",
    ].join("\n");
  }, [angleLabel, jurisdictionLabel, sourceLabel, sourceType, targetLabel, targetType.label]);

  const sourceReady = sourceUrl.trim().startsWith("http");

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-blue-950/10">
      <div className="grid h-1.5 grid-cols-3">
        <div className="bg-red-700" />
        <div className="bg-white" />
        <div className="bg-blue-900" />
      </div>
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-slate-200 bg-[#f8fbff] p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-700 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
              Build your lane
            </span>
            <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-blue-950">
              Public-source first
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black leading-tight text-blue-950 sm:text-4xl">
            Become a RepWatchr author.
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-blue-950/70">
            Pick a role, name the target, add the receipt, and turn attention into
            a reviewable story packet. Strong submissions use dates, sources,
            jurisdictions, and careful language.
          </p>

          <div className="mt-5 grid gap-2">
            {authorLanes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLaneId(item.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  item.id === lane.id
                    ? "border-red-300 bg-red-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-blue-950">{item.label}</span>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-700">
                    {item.heat}
                  </span>
                </span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">
                  {item.promise}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Target type
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {targetTypes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTargetTypeId(item.id)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                      item.id === targetType.id
                        ? "border-blue-800 bg-blue-950 text-white"
                        : "border-slate-200 bg-white text-blue-950 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-950">
                  Name or record
                </span>
                <input
                  value={targetName}
                  onChange={(event) => setTargetName(event.target.value)}
                  placeholder={targetType.placeholder}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-950">
                  Place
                </span>
                <input
                  value={jurisdiction}
                  onChange={(event) => setJurisdiction(event.target.value)}
                  placeholder="Texas, district, county, city, board, or agency"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-950">
                  Source type
                </span>
                <select
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value as SourceType)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  {sourceTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-950">
                  Source URL
                </span>
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-950">
                  Output
                </span>
                <select
                  value={outputGoal}
                  onChange={(event) => setOutputGoal(event.target.value as OutputGoal)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  {outputGoals.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-950">
                  Story angle
                </span>
                <textarea
                  value={angle}
                  onChange={(event) => setAngle(event.target.value)}
                  placeholder="What should voters inspect, verify, or ask about?"
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.82fr]">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-900">
                  Your next 4 moves
                </p>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                  sourceReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                }`}>
                  {sourceReady ? "Source ready" : "Needs receipt"}
                </span>
              </div>
              <ol className="mt-3 grid gap-2">
                {lane.moves.map((move, index) => (
                  <li key={move} className="grid grid-cols-[28px_1fr] gap-2 rounded-xl bg-white p-3 text-sm font-semibold leading-5 text-slate-700">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-red-700 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span>{move}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                Share packet
              </p>
              <p className="mt-2 text-lg font-black leading-tight">
                {outputGoal}: {lane.label}
              </p>
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-white/10 p-3 text-xs font-semibold leading-5 text-slate-100">
                {shareSnippet}
              </pre>
              <div className="mt-3">
                <CopySnippetButton text={shareSnippet} label="Copy author snippet" copiedLabel="Author snippet copied" />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Link
              href="/feedback"
              className="rounded-xl bg-red-700 px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
            >
              Submit source
            </Link>
            <Link
              href="/profiles/claim"
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
            >
              Build profile
            </Link>
            <Link
              href="/create-account"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-amber-950 transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-100"
            >
              Join free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
