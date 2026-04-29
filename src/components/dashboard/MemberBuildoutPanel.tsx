"use client";

import Link from "next/link";
import {
  getNationalBuildoutSummary,
  nationalGovernmentScopes,
  nationalJurisdictionBuildouts,
  socialMonitoringConnections,
} from "@/data/national-buildout";

export default function MemberBuildoutPanel() {
  const summary = getNationalBuildoutSummary();
  const nextStates = nationalJurisdictionBuildouts.filter((state) => state.status !== "loaded").slice(0, 8);
  const sourceTasks = [
    "Submit an official roster source URL",
    "Add a verified public profile photo source",
    "Add a public X/social account source",
    "Flag a broken profile, missing district, or stale officeholder",
    "Attach a public vote, funding, agenda, or statement record",
  ];

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Member buildout office</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Help complete the national record</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Members can see more of the buildout path than anonymous visitors: source gaps, profile-claim tools,
              social-link needs, and research queues. Admin-only analytics and internal flags stay behind the admin control center.
            </p>
          </div>
          <Link
            href="/buildout"
            className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-red-700"
          >
            Public buildout page
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Enabled jurisdictions" value={summary.enabledJurisdictions} detail="States, D.C., and territories in the model" />
          <Metric label="Public-power lanes" value={summary.governmentScopeCount} detail="Government and accountability categories" />
          <Metric label="Queued jurisdictions" value={summary.queuedJurisdictions} detail="Need official source imports" />
          <Metric label="Social links" value={summary.socialConnectionCount} detail="Connection types wired or planned" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Source tasks</p>
            <div className="mt-3 space-y-2">
              {sourceTasks.map((task) => (
                <div key={task} className="rounded-xl border border-white bg-white p-3 text-sm font-bold text-slate-700">
                  {task}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Next jurisdictions</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {nextStates.map((state) => (
                <div key={state.code} className="rounded-xl border border-white bg-white p-3">
                  <p className="text-sm font-black text-slate-950">{state.name}</p>
                  <p className="text-xs font-semibold text-slate-500">{state.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Profile systems</p>
            <div className="mt-3 space-y-2">
              {nationalGovernmentScopes.slice(0, 5).map((scope) => (
                <div key={scope.id} className="rounded-xl border border-white bg-white p-3">
                  <p className="text-sm font-black text-slate-950">{scope.label}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{scope.buildoutNeed}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-blue-800">Social statement tracking</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {socialMonitoringConnections.map((connection) => (
              <div key={connection.label} className="rounded-xl border border-blue-100 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-slate-950">{connection.label}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
                    {connection.status}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{connection.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-2xl font-black text-blue-950">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}
