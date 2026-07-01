"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

type StaticPackage = {
  slug: string;
  name: string;
  category: string;
  audience: string;
  internalPurpose: string;
  flagKey: string;
  capabilities: string[];
  status: "hidden";
  enabled: boolean;
  masterEnabled: boolean;
  envFlag: string;
};

type DbPackage = {
  slug: string;
  name: string;
  category: string;
  audience: string;
  internal_purpose: string;
  status: string;
  public_copy_allowed: boolean;
  checkout_enabled: boolean;
  stripe_enabled: boolean;
  api_enabled: boolean;
  capabilities: string[];
  flag_key: string | null;
  flag_enabled: boolean;
  flag_activation_status: string;
  updated_at: string;
};

type FeatureFlag = {
  flag_key: string;
  label: string;
  enabled: boolean;
  scope: string;
  activation_status: string;
  updated_at: string;
};

type TableCount = {
  table: string;
  status: "ok" | "error";
  count: number | null;
  error: string | null;
};

type Payload = {
  generatedAt: string;
  staticFlags: {
    masterFlag: string;
    masterEnv: string;
    masterEnabled: boolean;
    totalPackages: number;
    enabledPackages: number;
    hiddenPackages: number;
    registry: StaticPackage[];
  };
  summary: {
    package_count: number;
    hidden_package_count: number;
    enabled_flag_count: number;
    organization_count: number;
    live_subscription_count: number;
    active_api_key_count: number;
    export_job_count: number;
    paid_invoice_cents: number;
  } | null;
  packages: DbPackage[];
  featureFlags: FeatureFlag[];
  tableCounts: TableCount[];
  migrationReady: boolean;
  errors: string[];
  guardrails: string[];
};

function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString();
}

function formatMoney(cents: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(cents ?? 0) / 100);
}

export default function FutureRevenueDashboard() {
  const { user, roles, loading } = useAuth();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;

    async function loadFutureRevenue() {
      setError("");
      const response = await fetch("/api/admin/future-revenue", { cache: "no-store" });
      const data = await response.json();

      if (!mounted) return;
      if (!response.ok) {
        setError(data.error ?? "Future revenue request failed.");
        return;
      }

      setPayload(data as Payload);
    }

    loadFutureRevenue().catch((loadError: Error) => {
      if (!mounted) return;
      setError(loadError.message);
    });

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const staticPackages = payload?.staticFlags.registry ?? [];
  const dbPackagesBySlug = useMemo(() => {
    return new Map((payload?.packages ?? []).map((packageItem) => [packageItem.slug, packageItem]));
  }, [payload?.packages]);
  const liveLocks = payload
    ? [
        {
          label: "Public copy allowed",
          value: payload.packages.filter((packageItem) => packageItem.public_copy_allowed).length,
        },
        {
          label: "Checkout enabled",
          value: payload.packages.filter((packageItem) => packageItem.checkout_enabled).length,
        },
        {
          label: "Stripe enabled",
          value: payload.packages.filter((packageItem) => packageItem.stripe_enabled).length,
        },
        {
          label: "API enabled",
          value: payload.packages.filter((packageItem) => packageItem.api_enabled).length,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!user) {
    return <AccessMessage title="Login required" body="Future revenue infrastructure is admin-only." href="/auth/login" linkLabel="Log in" />;
  }

  if (!isAdmin) {
    return <AccessMessage title="Admin role required" body="This route is blocked unless Supabase says your account has the admin role." href="/dashboard" linkLabel="Back to dashboard" />;
  }

  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Admin-only dormant rails</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Future revenue infrastructure</h1>
                <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
                  Hidden feature flags, organization accounts, team accounts, subscriptions, API keys, credits, invoices,
                  licenses, export jobs, and audit trails. Nothing here should appear publicly until activation is approved.
                </p>
              </div>
              <StatusBadge
                label={payload?.staticFlags.masterEnabled ? "Master on" : "Master off"}
                tone={payload?.staticFlags.masterEnabled ? "danger" : "safe"}
              />
            </div>
            {payload ? (
              <p className="mt-3 text-xs font-bold text-slate-400">Last refreshed {new Date(payload.generatedAt).toLocaleString()}</p>
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
            {payload.staticFlags.masterEnabled || payload.staticFlags.enabledPackages > 0 ? (
              <section className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em]">Do not enable yet</p>
                <h2 className="mt-1 text-xl font-black">A future revenue flag is active.</h2>
                <p className="mt-2 text-sm font-semibold leading-6">
                  This request called for hidden infrastructure only. Turn off `{payload.staticFlags.masterEnv}` and any
                  package-specific flags before production traffic sees paid rails.
                </p>
              </section>
            ) : null}

            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Hidden packages" value={payload.staticFlags.hiddenPackages} detail={`${payload.staticFlags.totalPackages} registered in code`} />
              <Metric label="Enabled env flags" value={payload.staticFlags.enabledPackages} detail={payload.staticFlags.masterEnv} />
              <Metric label="DB hidden rows" value={payload.summary?.hidden_package_count ?? 0} detail={`${payload.summary?.package_count ?? 0} rows in registry`} />
              <Metric label="Paid invoice total" value={formatMoney(payload.summary?.paid_invoice_cents)} detail="Should stay $0 until launch" />
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-red-700">Activation locks</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">All public switches should read zero.</h2>
                  </div>
                  <StatusBadge label={payload.migrationReady ? "Schema ready" : "Needs SQL"} tone={payload.migrationReady ? "safe" : "warn"} />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {liveLocks.map((lock) => (
                    <div key={lock.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-2xl font-black text-blue-950">{formatNumber(lock.value)}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{lock.label}</p>
                    </div>
                  ))}
                </div>
                {payload.errors.length ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-900">Migration notes</p>
                    <div className="mt-2 space-y-1">
                      {payload.errors.slice(0, 8).map((item) => (
                        <p key={item} className="text-xs font-semibold leading-5 text-amber-900">{item}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Safety guardrails</p>
                <div className="mt-3 space-y-2">
                  {payload.guardrails.map((item) => (
                    <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/admin/control-center"
                  className="mt-4 inline-flex rounded-xl bg-blue-900 px-4 py-2 text-xs font-black text-white hover:bg-red-700"
                >
                  Back to control center
                </Link>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Hidden package registry</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {staticPackages.map((packageItem) => {
                  const dbPackage = dbPackagesBySlug.get(packageItem.slug);
                  return (
                    <div key={packageItem.slug} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black text-slate-950">{packageItem.name}</p>
                          <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-red-700">{packageItem.category}</p>
                        </div>
                        <StatusBadge
                          label={packageItem.enabled || dbPackage?.flag_enabled ? "Enabled" : "Hidden"}
                          tone={packageItem.enabled || dbPackage?.flag_enabled ? "danger" : "safe"}
                        />
                      </div>
                      <p className="mt-3 text-xs font-semibold leading-5 text-slate-700">{packageItem.internalPurpose}</p>
                      <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-blue-950">{packageItem.envFlag}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {packageItem.capabilities.slice(0, 4).map((capability) => (
                          <span key={capability} className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-900">
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Future revenue table health</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {payload.tableCounts.map((table) => (
                    <div key={table.table} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-black text-slate-950">{table.table}</p>
                        <StatusBadge label={table.status} tone={table.status === "ok" ? "safe" : "warn"} />
                      </div>
                      <p className="mt-1 text-xl font-black text-blue-950">{table.count ?? "Needs SQL"}</p>
                      {table.error ? <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">{table.error}</p> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Feature flags</p>
                <div className="mt-3 space-y-2">
                  {payload.featureFlags.length ? payload.featureFlags.map((flag) => (
                    <div key={flag.flag_key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-black text-slate-950">{flag.label}</p>
                        <StatusBadge label={flag.enabled ? "On" : flag.activation_status} tone={flag.enabled ? "danger" : "safe"} />
                      </div>
                      <p className="mt-1 text-[11px] font-black text-blue-950">{flag.flag_key}</p>
                    </div>
                  )) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-bold text-amber-900">Run `supabase-future-revenue.sql` to seed disabled hidden flags.</p>
                    </div>
                  )}
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

function Metric({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
      <p className="text-3xl font-black text-blue-950">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "safe" | "warn" | "danger" }) {
  const className =
    tone === "safe"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "warn"
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
}
