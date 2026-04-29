"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  nationalJurisdictionBuildouts,
  socialMonitoringConnections,
} from "@/data/national-buildout";

const founderWindowEndsAt = new Date("2026-07-28T05:00:00.000Z").getTime();

const eventPings = [
  {
    label: "Board meeting radar",
    area: "School boards",
    status: "Source watch",
    detail: "Agendas, minutes, video links, public comments, and trustee votes.",
  },
  {
    label: "Money trail",
    area: "Funding",
    status: "Follow-up",
    detail: "Campaign donors, filings, PAC links, and public financial records.",
  },
  {
    label: "Statement watch",
    area: "Public posts",
    status: "Review queue",
    detail: "Approved public statement URLs and context before anything is published.",
  },
  {
    label: "Record gaps",
    area: "Buildout",
    status: "Member task",
    detail: "Broken source links, missing photos, stale rosters, and empty profile fields.",
  },
];

function statusClass(status: string) {
  if (status === "loaded") return "border-emerald-300 bg-emerald-100 text-emerald-900";
  if (status === "partial") return "border-amber-300 bg-amber-100 text-amber-950";
  return "border-blue-200 bg-blue-50 text-blue-950";
}

export default function MemberSignalMap() {
  const [daysLeft, setDaysLeft] = useState(90);

  useEffect(() => {
    function updateCountdown() {
      setDaysLeft(Math.max(0, Math.ceil((founderWindowEndsAt - Date.now()) / 86_400_000)));
    }

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const visibleStates = useMemo(
    () => [
      ...nationalJurisdictionBuildouts.filter((item) => item.status !== "queued"),
      ...nationalJurisdictionBuildouts.filter((item) => item.status === "queued").slice(0, 23),
    ],
    [],
  );

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 text-white shadow-xl">
      <div className="grid gap-0 xl:grid-cols-[1fr_0.85fr]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-300">Signal map</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">See the network light up as records come online.</h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
                This is the member-side view of political data coverage: loaded states, queued states, source gaps,
                meeting pings, funding trails, and review lanes.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-300/30 bg-amber-300 px-4 py-3 text-slate-950">
              <p className="text-[11px] font-black uppercase tracking-wide">Founder access window</p>
              <p className="mt-1 text-3xl font-black">{daysLeft}</p>
              <p className="text-xs font-black uppercase tracking-wide">days left</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {visibleStates.map((state) => (
              <Link
                key={state.code}
                href={state.code === "TX" ? "/officials" : "/buildout"}
                title={`${state.name}: ${state.status}`}
                className={`relative grid aspect-square place-items-center rounded-xl border text-xs font-black transition hover:-translate-y-0.5 ${statusClass(state.status)}`}
              >
                <span className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${state.status === "loaded" ? "bg-emerald-600" : state.status === "partial" ? "bg-amber-600" : "bg-blue-500"}`} />
                {state.code}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 p-5 sm:p-6 xl:border-l xl:border-t-0">
          <p className="text-xs font-black uppercase tracking-wide text-blue-200">Live lanes</p>
          <div className="mt-4 grid gap-3">
            {eventPings.map((ping) => (
              <div key={ping.label} className="rounded-xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{ping.label}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-blue-100">{ping.area}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-950">
                    {ping.status}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{ping.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-red-300">Social and statement rails</p>
            <div className="mt-3 grid gap-2">
              {socialMonitoringConnections.slice(0, 3).map((connection) => (
                <div key={connection.label} className="flex items-start justify-between gap-3 rounded-lg bg-white/5 p-3">
                  <div>
                    <p className="text-xs font-black text-white">{connection.label}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-400">{connection.detail}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase text-blue-950">
                    {connection.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
