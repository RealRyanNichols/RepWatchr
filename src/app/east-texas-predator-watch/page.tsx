import type { Metadata } from "next";
import Link from "next/link";
import PredatorAlertScroller from "@/components/predator-watch/PredatorAlertScroller";
import PredatorProfileCard from "@/components/predator-watch/PredatorProfileCard";
import PredatorWatchReportForm from "@/components/predator-watch/PredatorWatchReportForm";
import { eastTexasPredatorWatchCounties, predatorWatchImportPlan } from "@/data/predator-watch";
import {
  filterPredatorWatchProfiles,
  getPredatorWatchProfiles,
  getPredatorWatchStats,
} from "@/lib/predator-watch";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "East Texas Predator Watch | RepWatchr",
  description:
    "Source-backed East Texas Predator Watch profiles, registry records, watch-priority alerts, and private community report intake.",
  path: "/east-texas-predator-watch",
  imagePath: buildOgImageUrl("home"),
  imageAlt: "RepWatchr East Texas Predator Watch preview",
});

type SearchParams = Record<string, string | string[] | undefined>;

function paramValue(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-white shadow-sm">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-red-200">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-200">{detail}</p>
    </div>
  );
}

function EmptyProfileState() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-600 text-white">
          <span aria-hidden="true" className="text-sm font-black">DB</span>
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Official profiles pending</p>
          <h2 className="mt-1 text-2xl font-black text-amber-950">
            The page is live. No offender profiles publish until official records are imported.
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-900">
            This avoids fake records, stale mugshot scraping, and unsourced accusations. Load Texas DPS, NSOPW, court,
            sheriff, or police records through the official import path, then the watch-priority grid will populate.
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function EastTexasPredatorWatchPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const profiles = await getPredatorWatchProfiles();
  const filters = {
    q: paramValue(params, "q"),
    county: paramValue(params, "county"),
    risk: paramValue(params, "risk"),
    status: paramValue(params, "status"),
    offense: paramValue(params, "offense"),
    freshness: paramValue(params, "freshness"),
  };
  const filteredProfiles = filterPredatorWatchProfiles(profiles, filters);
  const stats = getPredatorWatchStats(profiles);
  const topProfiles = profiles.slice(0, 10);
  const countyOptions = [...eastTexasPredatorWatchCounties];
  const offenseOptions = Array.from(new Set(profiles.map((profile) => profile.offenseCategory))).sort();

  return (
    <div className="rw-page-shell">
      <PredatorAlertScroller profiles={profiles} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#7f1d1d_0%,#dc2626_42%,#d6b35a_42%,#d6b35a_52%,#ffffff_52%,#ffffff_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1.05fr_0.95fr] lg:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">East Texas Predator Watch</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Official records. Public accountability. No rumor board.
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
                Registered sex offender profiles, official source trails, watch-priority alerts, and private community
                reports for East Texas. Every public claim must point back to a registry, court, sheriff, police, or
                other official record.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="#top-10"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-black text-white transition hover:bg-red-800"
                >
                  <span aria-hidden="true" className="text-base leading-none">!</span>
                  Top 10 Watch Priority
                </Link>
                <Link
                  href="#report"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white hover:text-red-800"
                >
                  <span aria-hidden="true" className="text-base leading-none">!</span>
                  Report behavior
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Profiles" value={stats.totalProfiles} detail="Official-source profiles approved for public display." />
              <StatCard label="High risk" value={stats.highRiskOrCivil} detail="High-risk or civil commitment records." />
              <StatCard label="Wanted flags" value={stats.wantedOrFailureToRegister} detail="Wanted or failure-to-register records with source support." />
              <StatCard label="Reports public" value={stats.reportsPublished} detail="Approved, redacted community notes." />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Coverage boundary</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Core East Texas counties first.</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              The page starts with the Longview/Tyler/East Texas region, then expands after the official-source import
              and review workflow is proven.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {countyOptions.map((county) => (
              <span key={county} className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-800">
                {county}
              </span>
            ))}
          </div>
        </section>

        <section id="top-10" className="mt-8 scroll-mt-28">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Most Wanted style</p>
              <h2 className="text-2xl font-black text-slate-950">Top 10 Watch Priority</h2>
            </div>
            <p className="max-w-xl text-xs font-bold leading-5 text-slate-500">
              &quot;Wanted&quot; appears only when an official warrant or fugitive source supports it. Otherwise, this is a watch-priority ranking.
            </p>
          </div>
          {topProfiles.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {topProfiles.map((profile, index) => (
                <PredatorProfileCard key={profile.slug} profile={profile} rank={index + 1} />
              ))}
            </div>
          ) : (
            <EmptyProfileState />
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
              <span aria-hidden="true" className="text-sm font-black">#</span>
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Directory</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Search approved official profiles</h2>
            </div>
          </div>
          <form className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <label className="block md:col-span-2 xl:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-700">Search</span>
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Name, city, offense, alias"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none ring-red-200 focus:ring-4"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-700">County</span>
              <select
                name="county"
                defaultValue={filters.county}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none ring-red-200 focus:ring-4"
              >
                <option value="">All counties</option>
                {countyOptions.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-700">Risk</span>
              <select
                name="risk"
                defaultValue={filters.risk}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none ring-red-200 focus:ring-4"
              >
                <option value="">All risk levels</option>
                <option value="low">Level one</option>
                <option value="moderate">Level two</option>
                <option value="high">Level three</option>
                <option value="civil_commitment">Civil commitment</option>
                <option value="not_reported">Not reported</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-700">Status</span>
              <select
                name="status"
                defaultValue={filters.status}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none ring-red-200 focus:ring-4"
              >
                <option value="">All statuses</option>
                <option value="registered">Registered</option>
                <option value="wanted">Wanted</option>
                <option value="failure_to_register">Failure to register</option>
                <option value="address_change">Address change</option>
                <option value="under_review">Under review</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-700">Source age</span>
              <select
                name="freshness"
                defaultValue={filters.freshness}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none ring-red-200 focus:ring-4"
              >
                <option value="">Any</option>
                <option value="checked_30_days">30 days</option>
                <option value="checked_90_days">90 days</option>
                <option value="stale">Stale</option>
                <option value="needs_recheck">Needs recheck</option>
              </select>
            </label>
            {offenseOptions.length ? (
              <label className="block md:col-span-2">
                <span className="text-xs font-black uppercase tracking-wide text-slate-700">Offense category</span>
                <select
                  name="offense"
                  defaultValue={filters.offense}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none ring-red-200 focus:ring-4"
                >
                  <option value="">All categories</option>
                  {offenseOptions.map((offense) => (
                    <option key={offense} value={offense}>
                      {offense}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-red-800"
              >
                <span aria-hidden="true" className="text-base leading-none">?</span>
                Filter
              </button>
            </div>
          </form>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProfiles.map((profile) => (
              <PredatorProfileCard key={profile.slug} profile={profile} />
            ))}
          </div>
          {profiles.length && filteredProfiles.length === 0 ? (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-950">
              No profiles match those filters.
            </p>
          ) : null}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Source rules</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">No fake records. No open accusation pile.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Predator Watch publishes official-record facts and approved, redacted public notes. Private reports stay
              private until reviewed. Official source pages remain the current-record authority.
            </p>
            <div className="mt-4 space-y-2">
              {predatorWatchImportPlan.sourceLinks.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-black text-blue-800 hover:border-blue-400 hover:bg-blue-50"
                >
                  {source.title}
                  <span className="block pt-1 text-xs font-semibold text-slate-500">
                    {source.sourceType} / checked {source.lastCheckedAt}
                  </span>
                </a>
              ))}
            </div>
          </div>
          <PredatorWatchReportForm />
        </section>
      </main>
    </div>
  );
}
