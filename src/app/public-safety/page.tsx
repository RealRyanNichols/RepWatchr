import type { Metadata } from "next";
import Link from "next/link";
import PowerProfileCard from "@/components/power-watch/PowerProfileCard";
import PowerProfileRail from "@/components/power-watch/PowerProfileRail";
import NationalSpotlightSelector from "@/components/shared/NationalSpotlightSelector";
import { publicSafetyWatchImportPlan } from "@/data/public-safety-watch";
import { getAllNationalJurisdictions } from "@/data/national-buildout";
import { getPowerWatchStats, getPublicSafetyWatchProfiles } from "@/lib/power-watch";
import { countByState, getSelectedStateCode } from "@/lib/state-scope";
import type { PublicPowerProfile } from "@/types/power-watch";

export const metadata: Metadata = {
  title: "Public Safety Watch | RepWatchr",
  description:
    "Track public-safety agencies, elected sheriffs, police chiefs, complaint paths, policy records, jail records, and source-backed badge-power profiles.",
};

const personKinds = new Set<PublicPowerProfile["kind"]>([
  "sheriff",
  "police-chief",
  "public-safety-official",
]);

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

export default async function PublicSafetyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const selectedStateCode = getSelectedStateCode(params);
  const jurisdictions = getAllNationalJurisdictions();
  const selectedState = jurisdictions.find((state) => state.code === selectedStateCode);
  const profiles = getPublicSafetyWatchProfiles();
  const profileCountsByState = countByState(profiles, (profile) => profile.state);
  const selectedProfiles = selectedStateCode
    ? profiles.filter((profile) => profile.state.toUpperCase() === selectedStateCode)
    : [];
  const stats = getPowerWatchStats(selectedProfiles);
  const agencies = selectedProfiles.filter((profile) => !personKinds.has(profile.kind));
  const people = selectedProfiles.filter((profile) => personKinds.has(profile.kind));
  const topProfiles = selectedProfiles
    .sort((a, b) => b.buildoutPercent - a.buildoutPercent || a.name.localeCompare(b.name))
    .slice(0, 14);
  const primarySource = selectedProfiles[0]?.sourceLinks[0] ?? publicSafetyWatchImportPlan.sourceLinks[0];
  const stateSelector = (
    <NationalSpotlightSelector
      basePath="/public-safety"
      selectedStateCode={selectedStateCode}
      jurisdictions={jurisdictions}
      pageLabel="Public safety and badge-power records"
      title="Badge power, mapped by place."
      description="RepWatchr opens public-safety watch on the national map first. Choose a state, then open source-backed agencies, elected sheriffs, police chiefs, oversight sources, complaint paths, policy records, and public safety profiles."
      profileNoun="public-safety profiles"
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
                ? "Public safety watch now starts from the national map."
                : `${selectedState?.name ?? selectedStateCode} public-safety profiles are not loaded yet.`}
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-900">
              {!selectedStateCode
                ? "Texas has the first public-safety records. Every other state is turned on for source import, but visitors must choose their state before profile cards appear."
                : "This state still needs sheriff directories, police department pages, chief pages, complaint paths, jail/custody sources, oversight sources, and policy records before cards appear here."}
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
          basePath="/public-safety"
          kicker="Public safety roll"
          title={`${selectedState?.name ?? selectedStateCode} agencies, sheriffs, chiefs, and oversight sources.`}
          detail="Public roles first; source review and method stay below."
        />

        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-950 shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_43%,#d6b35a_43%,#d6b35a_52%,#ffffff_52%,#ffffff_60%,#1d4ed8_60%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1.08fr_0.92fr] lg:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Badge-power map
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Agencies, sheriffs, chiefs, complaints, policies, and jail power.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                Police departments, sheriff offices, jail authorities, state agencies, and oversight bodies make decisions that shape liberty, records, public safety, and court outcomes. RepWatchr will track public sources, complaint paths, policy records, public statements, lawsuits, and news links by place.
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
              <StatCard label="Profiles seeded" value={stats.totalProfiles} detail={`${agencies.length} agencies or sources and ${people.length} public-safety people started.`} />
              <StatCard label="Source links" value={stats.sourceLinks} detail="Agency pages, chief pages, complaint paths, oversight sources, and public records." />
              <StatCard label="Counties touched" value={stats.counties} detail={`${stats.cities} East Texas cities in this first source-backed pass.`} />
              <StatCard label="Need buildout" value={stats.needsBuildout} detail="These need photos, TCOLE checks, policy docs, complaint data, statements, and case links." />
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
                Public power only. Source-backed or it stays in review.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                This page is for public agencies, elected sheriffs, appointed chiefs, official complaint paths, policy records, court records, news records, and public statements. No private addresses, family details, or unsourced accusations belong here.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Agency and leadership profile",
                "Complaint and discipline source path",
                "Jail and custody record queue",
                "Use-of-force and policy library",
                "Court and lawsuit footprint",
                "Official statements and news links",
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
              <h2 className="text-2xl font-black text-slate-950">Public-safety agencies and public roles</h2>
            </div>
            <p className="text-xs font-bold text-slate-500">Agencies first, then sheriffs, chiefs, and oversight people.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agencies.map((profile) => (
              <PowerProfileCard key={profile.slug} profile={profile} basePath="/public-safety" />
            ))}
            {people.map((profile) => (
              <PowerProfileCard key={profile.slug} profile={profile} basePath="/public-safety" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
