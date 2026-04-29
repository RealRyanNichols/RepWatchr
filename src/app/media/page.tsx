import type { Metadata } from "next";
import Link from "next/link";
import PowerProfileCard from "@/components/power-watch/PowerProfileCard";
import PowerProfileRail from "@/components/power-watch/PowerProfileRail";
import { mediaWatchImportPlan } from "@/data/media-watch";
import { getMediaWatchProfiles, getPowerWatchStats } from "@/lib/power-watch";

export const metadata: Metadata = {
  title: "Texas Media Watch | RepWatchr",
  description:
    "Track Texas media companies, editors, reporters, newsroom leadership, bylines, corrections, and official coverage with source-backed public profiles.",
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

export default function MediaPage() {
  const profiles = getMediaWatchProfiles();
  const stats = getPowerWatchStats(profiles);
  const companies = profiles.filter((profile) => profile.kind === "media-company");
  const people = profiles.filter((profile) => profile.kind !== "media-company");
  const topProfiles = profiles
    .sort((a, b) => b.buildoutPercent - a.buildoutPercent || a.name.localeCompare(b.name))
    .slice(0, 12);

  return (
    <div className="bg-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PowerProfileRail
          profiles={topProfiles}
          basePath="/media"
          kicker="Media watch roll"
          title="Newsrooms, editors, reporters, and public media profiles."
          detail="Companies and people first; methodology stays below the roll."
        />

        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-950 shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_48%,#ffffff_48%,#ffffff_52%,#1d4ed8_52%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1.08fr_0.92fr] lg:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Media power map
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Newsrooms, editors, and reporters get profiles too.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                Local media can decide which public records get seen, which officials get pressure, and which stories disappear. RepWatchr will track companies and public newsroom people with source links, bylines, corrections, and official-coverage records.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="#profiles" className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800">
                  Open profiles
                </Link>
                <a
                  href={mediaWatchImportPlan.sourceLinks[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-red-300 hover:bg-red-50"
                >
                  Newsroom source
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Profiles seeded" value={stats.totalProfiles} detail={`${stats.organizations} companies and ${stats.people} newsroom people started.`} />
              <StatCard label="Source links" value={stats.sourceLinks} detail="Newsroom contact pages, team pages, article records, public files, and correction logs." />
              <StatCard label="Counties touched" value={stats.counties} detail={`${stats.cities} East Texas cities in this first import batch.`} />
              <StatCard label="Need buildout" value={stats.needsBuildout} detail="These need bylines, correction history, ownership context, and official coverage mapping." />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Coverage rules
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">
                Scrutiny means source-backed accountability.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                The media page is for public influence: bylines, public corrections, named newsroom roles, ownership, public files, article sourcing, and documented relationships with officials or agencies. It is not for private harassment or unsourced claims.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Company and ownership profile",
                "Editor and reporter profile",
                "Byline and article index",
                "Correction and update history",
                "Official coverage map",
                "Reader challenge and source-review log",
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
              <h2 className="text-2xl font-black text-slate-950">Media company and newsroom profiles</h2>
            </div>
            <p className="text-xs font-bold text-slate-500">Companies first, then every public-facing newsroom person.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((profile) => (
              <PowerProfileCard key={profile.slug} profile={profile} basePath="/media" />
            ))}
            {people.map((profile) => (
              <PowerProfileCard key={profile.slug} profile={profile} basePath="/media" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
