import type { Metadata } from "next";
import Link from "next/link";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";
import { getAudienceReport } from "@/lib/audience-report";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audience | RepWatchr Admin",
  description: "Where readers are: inside HD-7 and TX-01, the wider East Texas territory, or outside it.",
  robots: { index: false, follow: false },
};

const TIER_TONE: Record<string, string> = {
  "home-district": "bg-blue-950 text-white",
  "east-texas": "bg-blue-100 text-blue-950",
  texas: "bg-slate-200 text-slate-800",
  national: "bg-slate-100 text-slate-600",
  outside: "bg-slate-100 text-slate-500",
  unknown: "bg-amber-100 text-amber-900",
};

export default async function AdminAudiencePage() {
  try {
    await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-blue-950">Supabase auth is required for the audience report.</h1>
        </main>
      );
    }
    throw error;
  }

  const report = await getAudienceReport(30);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Audience</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-blue-950 sm:text-4xl">
        Who is actually reading this.
      </h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
        Last {report.sinceDays} days, by where the request came from. City level only. No IP address is stored and
        nothing here identifies a reader.
      </p>

      {!report.ok ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-900">
          {report.problem ?? "The report could not be loaded."}
        </div>
      ) : report.totalViews === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-black text-slate-900">No events recorded yet in this window.</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Geo is written from the request headers as events arrive. Run the visitor-geo migration and this fills in
            as people visit.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-blue-900">In HD-7 / TX-01</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-blue-950">
                {report.inDistrictShareOfKnown === null ? "—" : `${report.inDistrictShareOfKnown}%`}
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-blue-900">
                {report.inDistrictViews.toLocaleString()} of {report.knownViews.toLocaleString()} views where the
                location was recorded
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Views in window</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                {report.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-amber-900">Location not recorded</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-amber-950">
                {(report.totalViews - report.knownViews).toLocaleString()}
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-amber-900">
                Counted as unknown, never as out of district
              </p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-black text-slate-950">By coverage tier</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {report.tiers.map((row, index) => (
                <div
                  key={row.tier}
                  className={`flex items-center gap-4 p-4 ${index ? "border-t border-slate-200" : ""}`}
                >
                  <span
                    className={`w-44 shrink-0 rounded-full px-3 py-1 text-center text-[11px] font-black uppercase tracking-wide ${TIER_TONE[row.tier] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {row.label}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-800"
                      style={{ width: `${Math.max(row.share, 0.5)}%` }}
                    />
                  </div>
                  <span className="w-28 shrink-0 text-right font-mono text-sm font-black text-slate-700">
                    {row.views.toLocaleString()} · {row.share}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          {report.topCities.length ? (
            <section className="mt-8">
              <h2 className="text-xl font-black text-slate-950">Top towns</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                This is the list that tells you where the next post should be aimed.
              </p>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {report.topCities.map((row, index) => (
                  <div
                    key={`${row.city}-${row.region}`}
                    className={`flex items-center justify-between gap-4 p-4 ${index ? "border-t border-slate-200" : ""}`}
                  >
                    <div>
                      <p className="font-black text-slate-900">
                        {row.city}
                        {row.region ? <span className="font-semibold text-slate-500">, {row.region}</span> : null}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.tier}</p>
                    </div>
                    <span className="font-mono text-sm font-black text-slate-700">{row.views.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/admin" className="text-sm font-bold text-blue-700 hover:underline">
          Admin home &rarr;
        </Link>
        <Link href="/home-district" className="text-sm font-bold text-blue-700 hover:underline">
          The beat &rarr;
        </Link>
      </div>
    </main>
  );
}
