import Link from "next/link";
import type { ReactNode } from "react";

export type AdminTableRow = {
  id: string;
  cells: Array<ReactNode>;
};

export function AdminPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl shadow-blue-950/20">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
          <div className="p-6 lg:p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">{description}</p>
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}

export function AdminSetupBlocked({ detail }: { detail: string }) {
  return (
    <AdminPageShell
      eyebrow="Setup blocked"
      title="Service-role data is not configured."
      description="The admin route is still server-protected, but this module needs the Supabase service-role key before it can read private operator tables."
    >
      <section className="mt-6 rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold leading-6 text-slate-700">{detail}</p>
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-xs font-black uppercase tracking-wide text-amber-900">
          Needed: SUPABASE_SERVICE_ROLE_KEY
        </p>
      </section>
    </AdminPageShell>
  );
}

export function AdminMetricCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-950">{displayValue}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
    </div>
  );
}

export function AdminPanel({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black text-blue-950">{title}</h2>
          {description ? <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{description}</p> : null}
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="rounded-xl bg-blue-900 px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-700"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AdminSimpleTable({
  columns,
  rows,
  emptyLabel = "No rows loaded yet.",
}: {
  columns: string[];
  rows: AdminTableRow[];
  emptyLabel?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead>
          <tr className="text-xs font-black uppercase tracking-wide text-slate-500">
            {columns.map((column) => (
              <th key={column} className="py-3 pr-4">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${index}`} className="py-3 pr-4 align-top font-semibold text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-6 text-sm font-semibold text-slate-500">
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AdminStatusPill({ value }: { value: string }) {
  const clean = value || "unknown";
  const tone = clean.includes("fail") || clean.includes("error") || clean.includes("open")
    ? "border-red-200 bg-red-50 text-red-800"
    : clean.includes("pending") || clean.includes("review") || clean.includes("new")
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${tone}`}>
      {clean}
    </span>
  );
}

export function safeText(value: unknown, fallback = "Unknown") {
  if (typeof value !== "string") return fallback;
  const clean = value.trim();
  return clean || fallback;
}

export function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function formatAdminDate(value: unknown) {
  if (typeof value !== "string") return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}
