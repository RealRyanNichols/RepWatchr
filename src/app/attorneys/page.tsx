import type { Metadata } from "next";
import Link from "next/link";
import PowerProfileCard from "@/components/power-watch/PowerProfileCard";
import PowerProfileRail from "@/components/power-watch/PowerProfileRail";
import NationalSpotlightSelector from "@/components/shared/NationalSpotlightSelector";
import { attorneyWatchImportPlan } from "@/data/attorney-watch";
import { getAllNationalJurisdictions } from "@/data/national-buildout";
import { getAttorneyWatchProfiles, getPowerWatchStats } from "@/lib/power-watch";
import { countByState, getSelectedStateCode } from "@/lib/state-scope";

export const metadata: Metadata = {
  title: "National Attorneys and Law Firms | RepWatchr",
  description:
    "Choose a state to track attorneys and law firms with source-backed public profiles, public bar records, court records, representation context, and correction review.",
};

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

export default async function AttorneysPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const selectedStateCode = getSelectedStateCode(params);
  const jurisdictions = getAllNationalJurisdictions();
  const selectedState = jurisdictions.find((state) => state.code === selectedStateCode);
  const profiles = getAttorneyWatchProfiles();
  const profileCountsByState = countByState(profiles, (profile) => profile.state);
  const selectedProfiles = selectedStateCode
    ? profiles.filter((profile) => profile.state.toUpperCase() === selectedStateCode)
    : [];
  const stats = getPowerWatchStats(selectedProfiles);
  const firms = selectedProfiles.filter((profile) => profile.kind === "law-firm" || profile.kind === "bar-source");
  const people = selectedProfiles.filter((profile) => profile.kind === "attorney");
  const topProfiles = selectedProfiles
    .filter((profile) => profile.slug !== "state-bar-of-texas-find-a-lawyer")
    .sort((a, b) => b.buildoutPercent - a.buildoutPercent || a.name.localeCompare(b.name))
    .slice(0, 14);
  const primarySource = selectedProfiles[0]?.sourceLinks[0] ?? attorneyWatchImportPlan.sourceLinks[0];
  const stateSelector = (
    <NationalSpotlightSelector
      basePath="/attorneys"
      selectedStateCode={selectedStateCode}
      jurisdictions={jurisdictions}
      pageLabel="Attorneys and law firms"
      title="Attorneys and law firms, nationwide."
      description="RepWatchr opens attorney watch on the national map first. Choose a state, then open source-backed attorney, law-firm, bar-source, ruling, review, and public-record buildout for that state."
      profileNoun="attorney profiles"
      profileCountsByState={profileCountsByState}
    />
  );

  if (!selectedStateCode || selectedProfiles.length === 0) {
    return (
      <div className="bg-slate-100">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {stateSelector}
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">
              {!selectedStateCode ? "Choose a state first" : "State buildout queued"}
            </p>
            <h2 className="mt-1 text-2xl font-black text-amber-950">
              {!selectedStateCode
                ? "Attorney watch now starts from the national map."
                : `${selectedState?.name ?? selectedStateCode} attorney profiles are not loaded yet.`}
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-900">
              {!selectedStateCode
                ? "Texas and New York have starter attorney records. Every other state is turned on for source import, but visitors must choose their state before profile cards appear."
                : "This state still needs bar-directory pulls, firm rosters, court-record sources, public-client context, review sources, and correction paths before cards appear here."}
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {stateSelector}

        <PowerProfileRail
          profiles={topProfiles}
          basePath="/attorneys"
          kicker="Attorney watch roll"
          title={`${selectedState?.name ?? selectedStateCode} attorneys, firms, and records people will search first.`}
          detail="Images are official-site media or visible placeholders until source-approved headshots are loaded."
        />

        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-950 shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_48%,#ffffff_48%,#ffffff_52%,#1d4ed8_52%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1.08fr_0.92fr] lg:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Legal power map
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Attorneys and law firms are part of the record.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                RepWatchr is adding attorneys, firms, and bar-source records state by state: public source first, profile second, scoring or flags only after the evidence is attached. Reviews, social sentiment, client outcomes, rulings, discipline, and client-rights findings each get their own evidence bucket.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="#profiles" className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800">
                  Open profiles
                </Link>
                <a
                  href={primarySource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-red-300 hover:bg-red-50"
                >
                  Primary source
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Profiles seeded" value={stats.totalProfiles} detail={`${stats.organizations} organizations and ${stats.people} individual attorney records started.`} />
              <StatCard label="Source links" value={stats.sourceLinks} detail="Official bar, firm, court, and public-record links are the required starting point." />
              <StatCard label="Counties touched" value={stats.counties} detail={`${stats.cities} East Texas cities in this first import batch.`} />
              <StatCard label="Need buildout" value={stats.needsBuildout} detail="These need State Bar profile pulls, court records, public clients, and corrections review." />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Import rules
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">
                No unsourced accusations. No private-data dumps.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Attorneys are open to scrutiny when they act in court, represent public officials, influence public records, handle public money, hold public roles, or appear in official proceedings. The page has to show what is verified, what is missing, and what needs a correction request.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "State Bar license profile",
                "Firm website and public roster",
                "Court appearances and filed pleadings",
                "Government clients and contracts",
                "Public grievance or discipline records",
                "Correction and source-review log",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="profiles" className="mt-8 scroll-mt-28">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{selectedState?.name ?? selectedStateCode} pass</p>
              <h2 className="text-2xl font-black text-slate-950">Law-firm and attorney profiles</h2>
            </div>
            <p className="text-xs font-bold text-slate-500">Statewide import path is active.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {firms.map((profile) => (
              <PowerProfileCard key={profile.slug} profile={profile} basePath="/attorneys" />
            ))}
            {people.map((profile) => (
              <PowerProfileCard key={profile.slug} profile={profile} basePath="/attorneys" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
