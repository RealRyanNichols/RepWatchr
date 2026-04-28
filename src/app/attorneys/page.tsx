import type { Metadata } from "next";
import Link from "next/link";
import PowerProfileCard from "@/components/power-watch/PowerProfileCard";
import { attorneyWatchImportPlan } from "@/data/attorney-watch";
import { getAttorneyWatchProfiles, getPowerWatchStats } from "@/lib/power-watch";

export const metadata: Metadata = {
  title: "Texas Attorneys and Law Firms | RepWatchr",
  description:
    "Track Texas attorneys and law firms with source-backed profiles, starting in East Texas and expanding statewide through public bar, court, and representation records.",
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

export default function AttorneysPage() {
  const profiles = getAttorneyWatchProfiles();
  const stats = getPowerWatchStats(profiles);
  const firms = profiles.filter((profile) => profile.kind === "law-firm" || profile.kind === "bar-source");
  const people = profiles.filter((profile) => profile.kind === "attorney");

  return (
    <div className="bg-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
                RepWatchr is adding Texas attorneys, firms, and bar-source records the same way school boards were built: public source first, profile second, scoring or flags only after the evidence is attached. East Texas is the first pass.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="#profiles" className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800">
                  Open profiles
                </Link>
                <a
                  href={attorneyWatchImportPlan.sourceLinks[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-red-300 hover:bg-red-50"
                >
                  State Bar source
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
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">East Texas first pass</p>
              <h2 className="text-2xl font-black text-slate-950">Law-firm and attorney profiles</h2>
            </div>
            <p className="text-xs font-bold text-slate-500">Statewide Texas import path is active.</p>
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
