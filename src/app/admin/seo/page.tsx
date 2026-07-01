import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { AdminModuleOpenTracker } from "@/components/admin/AdminDashboardTrackers";
import { getSeoAuditReport, getSitemapIndexEntries } from "@/lib/sitemap-builder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SEO Audit - Admin - RepWatchr",
  description: "Admin-only sitemap, metadata, Open Graph, and indexability audit.",
  robots: { index: false, follow: false },
};

type SimpleRow = {
  label: string;
  value: string | number;
  detail?: string;
};

export default function AdminSeoPage() {
  const report = getSeoAuditReport();
  const sitemapIndex = getSitemapIndexEntries();

  const statusRows: SimpleRow[] = [
    { label: "Sitemap index", value: "pass", detail: "/sitemap.xml route handler" },
    { label: "Robots private exclusions", value: "pass", detail: "Admin, dashboard, auth, API, temporary packet, and private user routes excluded" },
    { label: "Public source sitemap", value: report.groups.find((group) => group.key === "sources")?.count ?? 0, detail: "Intentionally empty until public source pages exist" },
    { label: "Jurisdiction sitemap", value: report.groups.find((group) => group.key === "jurisdictions")?.count ?? 0, detail: "Intentionally empty until jurisdiction hub pages ship" },
    { label: "News sitemap", value: "active", detail: "Recent stories only, capped at 1,000 entries" },
  ];

  return (
    <main className="rw-page-shell min-h-screen">
      <AdminModuleOpenTracker moduleName="SEO Audit" eventName="seo_audit_opened" route="/admin/seo" />
      <AdminModuleOpenTracker moduleName="Sitemap Generation" eventName="sitemap_generated" route="/admin/seo" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <Link href="/admin" className="text-sm font-black uppercase tracking-wide text-blue-700 hover:text-red-700">
            Back to admin
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl shadow-blue-950/20">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_20rem] lg:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">SEO command desk</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Index the useful public record. Keep private work out.
              </h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
                This report checks sitemap coverage, private-route exclusions, metadata gaps, Open Graph gaps, duplicate slug risk, orphan candidates, and low-completeness public pages.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Indexable URL count</p>
              <p className="mt-3 text-5xl font-black">{report.sitemapUrlCount.toLocaleString()}</p>
              <p className="text-sm font-bold text-slate-300">across public sitemap groups</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                Generated {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Sitemap groups" value={report.groups.length} detail="Child sitemap files" />
          <MetricCard label="Indexable profiles" value={report.sourceCountByIndexableProfile} detail="Useful official profiles" />
          <MetricCard label="Low-completeness pages" value={report.lowCompletenessIndexablePages} detail="Need source/buildout review" />
          <MetricCard label="Noindex rules" value={report.noindexRules.length} detail="Private route families" />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <Panel title="Sitemap URL Counts" eyebrow="Index files">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">URL count</th>
                    <th className="px-4 py-3">Sitemap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {report.groups.map((group) => (
                    <tr key={group.key}>
                      <td className="px-4 py-3 font-black text-blue-950">{group.label}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{group.count.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Link href={group.path} className="font-bold text-blue-700 hover:text-red-700">
                          {group.path}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Sitemap Generation Status" eyebrow="Current status">
            <SimpleList rows={statusRows} />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Sitemap index</p>
              <div className="mt-3 grid gap-2">
                {sitemapIndex.map((item) => (
                  <Link key={item.loc} href={item.loc.replace(report.siteUrl, "")} className="text-sm font-bold text-blue-700 hover:text-red-700">
                    {item.loc}
                  </Link>
                ))}
              </div>
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <Panel title="Metadata Gaps" eyebrow="Page quality">
            <SimpleList
              rows={[
                { label: "Missing titles", value: report.missingMetadata.length, detail: "Route-level audit list" },
                { label: "Missing descriptions", value: report.missingMetadata.length, detail: "Route-level audit list" },
                { label: "Missing canonical", value: report.missingCanonical.length, detail: "Route-level audit list" },
                { label: "Missing OG image", value: report.missingOgImage.length, detail: "Route-level audit list" },
              ]}
            />
          </Panel>

          <Panel title="Index Safety" eyebrow="Private and sparse pages">
            <SimpleList
              rows={[
                ...report.noindexRules.map((rule) => ({ label: rule, value: "noindex", detail: "Private/admin/auth/API family" })),
                { label: "Duplicate slugs", value: report.duplicateSlugs.length, detail: "No duplicates found by current static audit" },
              ]}
            />
          </Panel>

          <Panel title="Orphan Candidates" eyebrow="Source gaps">
            <SimpleList
              rows={report.orphanCandidates.map((item) => ({
                label: item.label,
                value: item.count,
                detail: "Profiles missing this source/buildout item",
              }))}
            />
          </Panel>

          <Panel title="Admin Notes" eyebrow="Next checks">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
              Jurisdictions and public source pages are intentionally excluded until those pages have enough public value. Keep sparse or under-review profiles noindexed until the profile has public sources, a correction path, and a useful next-click action.
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href="/sitemap.xml" className="rounded-xl bg-blue-950 px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700">
                Open sitemap index
              </Link>
              <Link href="/robots.txt" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-blue-950 transition hover:border-blue-300 hover:text-blue-700">
                Open robots.txt
              </Link>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-950">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
    </div>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-blue-950">{title}</h2>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function SimpleList({ rows }: { rows: SimpleRow[] }) {
  return (
    <div className="grid gap-2">
      {rows.length ? rows.map((row) => (
        <div key={row.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-950">{row.label}</p>
              {row.detail ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{row.detail}</p> : null}
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-blue-950">
              {typeof row.value === "number" ? row.value.toLocaleString() : row.value}
            </span>
          </div>
        </div>
      )) : (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          No rows found by the current audit.
        </p>
      )}
    </div>
  );
}
