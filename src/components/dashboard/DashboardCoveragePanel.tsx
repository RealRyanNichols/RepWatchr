"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SpotlightMetric = {
  id: string;
  label: string;
  value: number;
  loadedStates: number;
  href: string;
  detail: string;
  notTracked: string;
};

type DataQualityMetric = {
  label: string;
  value: number;
  detail: string;
};

type StateCoverageRow = {
  code: string;
  name: string;
  status: "loaded" | "partial" | "queued";
  officials: number;
  schoolBoards: number;
  attorneys: number;
  media: number;
  total: number;
};

type DashboardCoveragePayload = {
  generatedAt: string;
  national: {
    enabledJurisdictions: number;
    loadedSpotlightStates: number;
    queuedJurisdictions: number;
    governmentScopeCount: number;
  };
  spotlights: SpotlightMetric[];
  dataQuality: DataQualityMetric[];
  stateRows: StateCoverageRow[];
};

function stateHref(basePath: string, state: StateCoverageRow) {
  return state.total > 0 ? `${basePath}?state=${state.code}` : basePath;
}

function stateStatusClass(state: StateCoverageRow) {
  if (state.total > 0) return "bg-emerald-100 text-emerald-800";
  if (state.status === "partial") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export default function DashboardCoveragePanel() {
  const [payload, setPayload] = useState<DashboardCoveragePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCoverage() {
      setError("");
      const response = await fetch("/api/dashboard/coverage", { cache: "no-store" });
      const data = await response.json();

      if (!mounted) return;

      if (!response.ok) {
        setError(data.error ?? "Dashboard coverage analytics could not be loaded.");
        return;
      }

      setPayload(data as DashboardCoveragePayload);
    }

    loadCoverage().catch((loadError: Error) => {
      if (!mounted) return;
      setError(loadError.message);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-amber-800">Dashboard analytics</p>
        <p className="mt-2 text-sm font-bold text-amber-950">{error}</p>
      </section>
    );
  }

  if (!payload) {
    return (
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
        <div className="p-5">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const loadedRows = payload.stateRows
    .filter((state) => state.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const queuedRows = payload.stateRows
    .filter((state) => state.total === 0)
    .slice(0, 10);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Website analytics</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">National spotlight coverage</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              These dashboard numbers now match the national-first model: elected officials, school-board members,
              attorneys/law firms, and media profiles are counted separately from states that are only queued.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-950">
            Updated {new Date(payload.generatedAt).toLocaleString()}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Enabled jurisdictions" value={payload.national.enabledJurisdictions} detail="States, D.C., and territories in the model" />
          <Metric label="Loaded states" value={payload.national.loadedSpotlightStates} detail="States with at least one spotlight record" />
          <Metric label="Queued jurisdictions" value={payload.national.queuedJurisdictions} detail="Enabled but not imported on these pages yet" />
          <Metric label="Public-power lanes" value={payload.national.governmentScopeCount} detail="Government, attorney, media, and public-source lanes" />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {payload.spotlights.map((metric) => (
            <Link
              key={metric.id}
              href={metric.href}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
            >
              <p className="text-3xl font-black text-blue-950">{metric.value.toLocaleString()}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{metric.label}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{metric.detail}</p>
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] font-bold leading-4 text-amber-900">
                Not counted yet: {metric.notTracked}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">What is really tracked</p>
            <div className="mt-3 grid gap-2">
              {payload.dataQuality.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-white bg-white p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{metric.label}</p>
                    <p className="text-xl font-black text-blue-950">{metric.value.toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">State coverage</p>
            <div className="mt-3 grid gap-2">
              {loadedRows.map((state) => (
                <div key={state.code} className="rounded-xl border border-white bg-white p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">{state.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Officials {state.officials.toLocaleString()} / School boards {state.schoolBoards.toLocaleString()} / Attorneys {state.attorneys.toLocaleString()} / Media {state.media.toLocaleString()}
                      </p>
                    </div>
                    <span className={`w-fit rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${stateStatusClass(state)}`}>
                      {state.total.toLocaleString()} loaded
                    </span>
                  </div>
                </div>
              ))}
              {queuedRows.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {queuedRows.map((state) => (
                    <Link
                      key={state.code}
                      href={stateHref("/buildout", state)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600 hover:border-blue-300 hover:text-blue-800"
                    >
                      {state.code} queued
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
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
