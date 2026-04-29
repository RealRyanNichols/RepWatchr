import type { Metadata } from "next";
import Link from "next/link";
import PowerProfileCard from "@/components/power-watch/PowerProfileCard";
import AttorneyBuildoutTracker from "@/components/attorneys/AttorneyBuildoutTracker";
import AttorneyLearningQuestions from "@/components/attorneys/AttorneyLearningQuestions";
import {
  attorneyBarSources,
  getAttorneyBuildoutDashboard,
} from "@/data/attorney-buildout";
import { attorneyWatchImportPlan } from "@/data/attorney-watch";
import { getAllNationalJurisdictions } from "@/data/national-buildout";
import { getAttorneyWatchProfiles, getPowerWatchStats } from "@/lib/power-watch";
import { countByState, getSelectedStateCode } from "@/lib/state-scope";
import type { PublicPowerProfile } from "@/types/power-watch";

export const metadata: Metadata = {
  title: "National Attorneys, Public Defenders, and Law Firms | RepWatchr",
  description:
    "Track attorney, public-defender, and law-firm profiles state by state with bar-license sources, completion stages, cross-links, intake questions, and correction review.",
};

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rw-card min-w-0 rounded-xl p-4">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function isPublicDefenseProfile(profile: PublicPowerProfile) {
  const joined = `${profile.categoryLabel} ${profile.profileTags?.join(" ") ?? ""} ${profile.summary} ${profile.whyTracked}`.toLowerCase();
  return joined.includes("public defender") || joined.includes("public defense") || joined.includes("federal defender");
}

function isLicenseLinkedPerson(profile: PublicPowerProfile) {
  if (profile.kind !== "attorney") return false;
  return profile.sourceLinks.some((source) => {
    const joined = `${source.title} ${source.url}`.toLowerCase();
    return joined.includes("state bar") || joined.includes("texasbar.com/attorneys") || joined.includes("bar profile");
  });
}

function stateSourceFor(code: string) {
  return attorneyBarSources.find((source) => source.code === code);
}

function ActionCard({ label, title, detail, href }: { label: string; title: string; detail: string; href: string }) {
  const external = href.startsWith("http");
  const classes =
    "rw-card rw-card-blue block rounded-xl p-4 transition hover:-translate-y-0.5";
  const content = (
    <>
      <p className="text-[11px] font-black uppercase tracking-wide text-red-700">{label}</p>
      <h3 className="mt-1 text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

function LoadedStateChips({
  selectedStateCode,
  jurisdictions,
  profileCountsByState,
}: {
  selectedStateCode: string;
  jurisdictions: ReturnType<typeof getAllNationalJurisdictions>;
  profileCountsByState: Record<string, number>;
}) {
  const loadedStates = jurisdictions.filter((state) => (profileCountsByState[state.code] ?? 0) > 0);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {loadedStates.map((state) => {
        const selected = state.code === selectedStateCode;
        return (
          <Link
            key={state.code}
            href={`/attorneys?state=${state.code}`}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black transition ${
              selected
                ? "border-[#d6b35a] bg-[#0b2a55] text-white shadow-lg shadow-blue-950/25"
                : "border-slate-300 bg-[#f8fbff] text-slate-950 hover:border-[#d6b35a] hover:bg-[#fff7df] hover:text-blue-950"
            }`}
          >
            {state.name}: {(profileCountsByState[state.code] ?? 0).toLocaleString()}
          </Link>
        );
      })}
    </div>
  );
}

function QueuedStatePanel({
  stateName,
  stateCode,
}: {
  stateName: string;
  stateCode: string;
}) {
  const source = stateSourceFor(stateCode);

  return (
    <section className="rw-card rw-card-gold mt-8 rounded-2xl p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">State import queued</p>
      <h2 className="mt-2 text-2xl font-black text-amber-950">{stateName} has a source path, not profile cards yet.</h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-950">
        RepWatchr should not show attorney cards for this state until public records are attached. The next pass is license lookup,
        public defender office source, firm roster, court/cause context, and correction path.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ActionCard
          label="License source"
          title={source?.licensingAuthority ?? "State bar source pending"}
          detail={source?.notes ?? "Add the state licensing authority before person profiles are imported."}
          href={source?.licenseLookupUrl ?? attorneyWatchImportPlan.sourceLinks[2].url}
        />
        <ActionCard
          label="Public defense"
          title="Find official defender office"
          detail="Start with public defender offices, assigned-counsel lists, and county or federal appointment sources."
          href="/attorneys"
        />
        <ActionCard
          label="Person profile rule"
          title="Roster plus bar match"
          detail="Do not publish a named public defender profile until the office roster and license/admission source are both attached."
          href="/attorneys#teach-model"
        />
      </div>
    </section>
  );
}

export default async function AttorneysPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const selectedStateCode = getSelectedStateCode(params);
  const activeStateCode = selectedStateCode ?? "TX";
  const jurisdictions = getAllNationalJurisdictions();
  const selectedState = jurisdictions.find((state) => state.code === activeStateCode);
  const profiles = getAttorneyWatchProfiles();
  const attorneyBuildout = getAttorneyBuildoutDashboard(profiles);
  const profileCountsByState = countByState(profiles, (profile) => profile.state);
  const selectedProfiles = profiles.filter((profile) => profile.state.toUpperCase() === activeStateCode);
  const stats = getPowerWatchStats(selectedProfiles);
  const firms = selectedProfiles.filter((profile) => profile.kind === "law-firm" || profile.kind === "bar-source");
  const people = selectedProfiles.filter((profile) => profile.kind === "attorney");
  const publicDefenseProfiles = selectedProfiles.filter(isPublicDefenseProfile);
  const nonPublicDefenseFirms = firms.filter((profile) => !isPublicDefenseProfile(profile));
  const licenseLinkedPeople = selectedProfiles.filter(isLicenseLinkedPerson);
  const primarySource = selectedProfiles[0]?.sourceLinks[0] ?? attorneyWatchImportPlan.sourceLinks[0];

  return (
    <div className="rw-page">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rw-hero-panel overflow-hidden rounded-2xl text-slate-950">
          <div className="grid gap-6 p-5 lg:grid-cols-[1.08fr_0.92fr] lg:p-7">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                {selectedStateCode ? `${selectedState?.name ?? activeStateCode} active pass` : "Texas active pass"}
              </p>
              <h1 className="mt-3 max-w-full break-words text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                {selectedState?.name ?? activeStateCode} attorney watch starts with public records.
              </h1>
              <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                Public defenders, court-appointed counsel, private attorneys, firms, and bar sources belong in the same legal-power map. The rule is simple: public source first, profile second, and no named public defender page until an official roster and license source are attached.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link href="#profiles" className="rw-action-button rounded-xl px-4 py-3 text-center text-sm font-black transition">
                  Open loaded records
                </Link>
                <a
                  href={primarySource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rw-secondary-button rounded-xl px-4 py-3 text-center text-sm font-black transition"
                >
                  Primary source
                </a>
                <Link
                  href="/buildout"
                  className="rw-secondary-button rounded-xl px-4 py-3 text-center text-sm font-black transition"
                >
                  Buildout dashboard
                </Link>
              </div>
              <div className="mt-5">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-600">Loaded states</p>
                <LoadedStateChips
                  selectedStateCode={activeStateCode}
                  jurisdictions={jurisdictions}
                  profileCountsByState={profileCountsByState}
                />
              </div>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <StatCard label="Profiles seeded" value={stats.totalProfiles} detail={`${stats.organizations} organizations/public-defense sources and ${stats.people} individual attorney records started.`} />
              <StatCard label="Public defense" value={publicDefenseProfiles.length} detail="Public defender offices, oversight sources, and defender directories already visible." />
              <StatCard label="Source links" value={stats.sourceLinks} detail="Official bar, firm, court, public-defense, and public-record links are the starting point." />
              <StatCard label="Bar-linked people" value={`${licenseLinkedPeople.length}/${people.length}`} detail="Named attorney profiles with a visible licensing or bar-source path." />
            </div>
          </div>
        </section>

        {selectedProfiles.length > 0 ? (
          <>
            <section className="mt-6 grid gap-3 md:grid-cols-3">
              <ActionCard
                label="Public defense first"
                title={`${attorneyBuildout.publicDefenderProfiles} defender records seeded`}
                detail="Offices and directories are being mapped before individual public defenders are published."
                href="#public-defense"
              />
              <ActionCard
                label="Texas license layer"
                title={`${attorneyBuildout.licenseLinkedPeople}/${attorneyBuildout.texasAttorneyPeople} people bar-linked`}
                detail="The next named-attorney pass is license source, court context, discipline check, and correction path."
                href={attorneyWatchImportPlan.sourceLinks[0].url}
              />
              <ActionCard
                label="Learning loop"
                title={`${attorneyBuildout.questions.length} intake questions live`}
                detail="Answers teach the model what to ask for next when a new attorney or defender name is submitted."
                href="#teach-model"
              />
            </section>
          </>
        ) : (
          <QueuedStatePanel stateName={selectedState?.name ?? activeStateCode} stateCode={activeStateCode} />
        )}

        {selectedProfiles.length > 0 ? (
          <section id="profiles" className="mt-8 scroll-mt-28">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d6b35a]">{selectedState?.name ?? activeStateCode} pass</p>
                <h2 className="text-2xl font-black text-white">Bar-source, firm, and attorney profiles</h2>
              </div>
              <p className="text-xs font-bold text-slate-300">{selectedProfiles.length} source-seeded records loaded.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {nonPublicDefenseFirms.map((profile) => (
                <PowerProfileCard key={profile.slug} profile={profile} basePath="/attorneys" />
              ))}
              {people.map((profile) => (
                <PowerProfileCard key={profile.slug} profile={profile} basePath="/attorneys" />
              ))}
            </div>
          </section>
        ) : null}

        {publicDefenseProfiles.length > 0 ? (
          <section id="public-defense" className="rw-dark-panel mt-8 scroll-mt-28 rounded-2xl p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d6b35a]">Public defender pass</p>
                <h2 className="text-2xl font-black text-white">Loaded offices and defender sources</h2>
              </div>
              <p className="text-xs font-bold text-slate-300">{publicDefenseProfiles.length} records in {selectedState?.name ?? activeStateCode}</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {publicDefenseProfiles.map((profile) => (
                <PowerProfileCard key={profile.slug} profile={profile} basePath="/attorneys" />
              ))}
            </div>
          </section>
        ) : null}

        <section className="rw-panel mt-8 overflow-hidden rounded-2xl p-5">
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
                "Public defender office roster and appointment source",
                "Firm website and public roster",
                "Court appearances and filed pleadings",
                "Government clients and contracts",
                "Public grievance or discipline records",
                "Correction and source-review log",
              ].map((item) => (
                <div key={item} className="rw-card rounded-lg px-3 py-2 text-sm font-black text-slate-800">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <AttorneyBuildoutTracker profiles={profiles} />

        <AttorneyLearningQuestions />
      </main>
    </div>
  );
}
