"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

type ConnectionStatus = {
  label: string;
  status: string;
  detail: string;
};

type TableCount = {
  table: string;
  status: "ok" | "error" | "missing-service-role";
  count: number | null;
  error: string | null;
};

type AdminWatchItem = {
  label: string;
  type: string;
  detail: string;
  profilePath: string;
};

type ControlCenterPayload = {
  generatedAt: string;
  coverage: {
    officials: {
      officialFiles: number;
      federalAndStateSeatProfilesLoaded: number;
      officialsWithPhotos: number;
      officialsWithScoreCards: number;
      officialsWithFundingSummaries: number;
      officialsWithRedFlags: number;
      publicSourceUrls: number;
    };
    schoolBoards: {
      districts: number;
      candidates: number;
      gapCount: number;
      stubProfiles: number;
    };
    attorneys: {
      totalProfiles: number;
      needsBuildout: number;
      sourceLinks: number;
    };
    media: {
      totalProfiles: number;
      needsBuildout: number;
      sourceLinks: number;
    };
    national: {
      enabledJurisdictions: number;
      loadedJurisdictions: number;
      partialJurisdictions: number;
      queuedJurisdictions: number;
      governmentScopeCount: number;
    };
  };
  connections: ConnectionStatus[];
  tableCounts: TableCount[];
  adminOnlyWatchItems: AdminWatchItem[];
};

export default function AdminControlCenterClient() {
  const { user, roles, loading } = useAuth();
  const [payload, setPayload] = useState<ControlCenterPayload | null>(null);
  const [error, setError] = useState("");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!isAdmin) return;

    let mounted = true;

    async function loadControlCenter() {
      setError("");
      const response = await fetch("/api/admin/control-center", { cache: "no-store" });
      const data = await response.json();

      if (!mounted) return;

      if (!response.ok) {
        setError(data.error ?? "Control center request failed.");
        return;
      }

      setPayload(data as ControlCenterPayload);
    }

    loadControlCenter().catch((loadError: Error) => {
      if (!mounted) return;
      setError(loadError.message);
    });

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <AccessMessage
        title="Login required"
        body="The RepWatchr control center is only available after login."
        href="/auth/login"
        linkLabel="Log in"
      />
    );
  }

  if (!isAdmin) {
    return (
      <AccessMessage
        title="Admin role required"
        body="This page is hidden from normal member accounts and reviewers. It requires the admin role in Supabase."
        href="/dashboard"
        linkLabel="Back to dashboard"
      />
    );
  }

  const coverageCards = payload
    ? [
        {
          label: "Official files",
          value: payload.coverage.officials.officialFiles,
          detail: `${payload.coverage.officials.federalAndStateSeatProfilesLoaded} federal/state seat profiles loaded`,
        },
        {
          label: "School-board profiles",
          value: payload.coverage.schoolBoards.candidates,
          detail: `${payload.coverage.schoolBoards.districts} districts; ${payload.coverage.schoolBoards.gapCount} open gaps`,
        },
        {
          label: "Attorney/media profiles",
          value: payload.coverage.attorneys.totalProfiles + payload.coverage.media.totalProfiles,
          detail: `${payload.coverage.attorneys.sourceLinks + payload.coverage.media.sourceLinks} unique source URLs`,
        },
        {
          label: "National jurisdictions",
          value: payload.coverage.national.enabledJurisdictions,
          detail: `${payload.coverage.national.loadedJurisdictions} loaded, ${payload.coverage.national.partialJurisdictions} partial, ${payload.coverage.national.queuedJurisdictions} queued`,
        },
      ]
    : [];

  return (
    <div className="bg-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Admin-only</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">RepWatchr data control center</h1>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
              This is the private operator view for coverage, missing records, social-source readiness, analytics wiring,
              Supabase table health, and action items needed to finish the site. No public visitor sees this page.
            </p>
            {payload ? (
              <p className="mt-3 text-xs font-bold text-slate-400">
                Last refreshed {new Date(payload.generatedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        </section>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
            {error}
          </div>
        ) : null}

        {!payload && !error ? (
          <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white" />
        ) : null}

        {payload ? (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {coverageCards.map((card) => (
                <Metric key={card.label} label={card.label} value={card.value} detail={card.detail} />
              ))}
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Connection status</p>
                <div className="mt-3 space-y-2">
                  {payload.connections.map((connection) => (
                    <div key={connection.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-black text-slate-950">{connection.label}</p>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-blue-800">
                          {connection.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{connection.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Action links</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <ActionLink href="/admin/claims" label="Claim queue" detail="Review profile access requests" />
                  <ActionLink href="/admin/content-review" label="Content review" detail="Review claimed-profile submissions" />
                  <ActionLink href="/buildout" label="Public buildout" detail="See public coverage and missing data" />
                  <ActionLink href="/scorecards" label="Scorecards" detail="Open universal scorecard surface" />
                  <ActionLink href="https://vercel.com/theflashflash24-9833s-projects/repwatchr" label="Vercel project" detail="Open deployments, analytics, logs" external />
                  <ActionLink href="/admin/control-center" label="Social SQL file" detail="Run supabase-social-monitoring.sql from the repo before enabling scans" />
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Supabase table health</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {payload.tableCounts.map((table) => (
                  <div key={table.table} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-black text-slate-950">{table.table}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                          table.status === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {table.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-black text-blue-950">{table.count ?? "Needs setup"}</p>
                    {table.error ? <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">{table.error}</p> : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Internal-only watch items</p>
                <div className="mt-3 space-y-2">
                  {payload.adminOnlyWatchItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.profilePath}
                      className="block rounded-xl border border-amber-200 bg-amber-50 p-3 transition hover:border-red-300 hover:bg-red-50"
                    >
                      <p className="text-sm font-black text-amber-950">{item.label}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-wide text-amber-800">{item.type}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-amber-900">{item.detail}</p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">X/public statement scanner</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Policy-safe next steps</h2>
                <div className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-700">
                  <p>1. Store official social account URLs with source proof.</p>
                  <p>2. Apply `supabase-social-monitoring.sql` to create account, statement, and job tables.</p>
                  <p>3. Add X API credentials only if the plan allows the needed public-account monitoring.</p>
                  <p>4. Run a backend collector that saves URLs, dates, excerpts, and review status, then publish only approved public-source context.</p>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function AccessMessage({ title, body, href, linkLabel }: { title: string; body: string; href: string; linkLabel: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-black text-slate-950">{title}</h1>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{body}</p>
      <Link href={href} className="mt-5 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700">
        {linkLabel}
      </Link>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
      <p className="text-3xl font-black text-blue-950">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function ActionLink({
  href,
  label,
  detail,
  external = false,
}: {
  href: string;
  label: string;
  detail: string;
  external?: boolean;
}) {
  const className = "rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-blue-50";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <p className="text-sm font-black text-blue-900">{label}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <p className="text-sm font-black text-blue-900">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </Link>
  );
}
