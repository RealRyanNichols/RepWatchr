import type { Metadata } from "next";
import Link from "next/link";
import CommentSection from "@/components/comments/CommentSection";
import LiveEngagementCounter from "@/components/school-board/LiveEngagementCounter";
import DrillDownPicker from "@/components/school-board/DrillDownPicker";
import ShareButtons from "@/components/shared/ShareButtons";
import { buildPickerStates } from "@/lib/picker-data";
import {
  getCandidateFlags,
  getCandidateGoodRecords,
  getSchoolBoardDistricts,
  getSchoolBoardDossiers,
  getSchoolBoardStats,
  getShareLine,
} from "@/lib/school-board-research";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";

export const metadata: Metadata = {
  title: "School Board Watch",
  description:
    "Find your Texas school board in three taps. Verified votes, A-F citizen grades, sourced trustee profiles, and 2026 ballot tracking.",
};

export default function SchoolBoardsPage() {
  const stats = getSchoolBoardStats();
  const districts = getSchoolBoardDistricts();
  const candidates = getSchoolBoardDossiers();
  const pickerStates = buildPickerStates();
  const ballotCandidates = candidates.filter((c) => c.on_2026_ballot || c.election_date?.includes("2026"));
  const quickDistricts = districts.slice(0, 8);
  const featuredDistricts = districts.slice(0, 9);
  const profiledCandidates = candidates.map((candidate) => ({
    candidate,
    flags: getCandidateFlags(candidate),
    good: getCandidateGoodRecords(candidate),
  }));
  const profileSpotlights = profiledCandidates.filter(
    ({ candidate, flags, good }) => flags.length > 0 || good.length > 1 || candidate.on_2026_ballot || candidate.election_date?.includes("2026")
  );
  const quickProfiles = (profileSpotlights.length > 0 ? profileSpotlights : profiledCandidates).slice(0, 8);
  const sharedShareLine = "Find your Texas school board on RepWatchr - sourced trustee profiles + verified citizen votes and grades.";

  return (
    <div className="bg-[#f8fbff]">
      {/* HERO - Texas-colored, compact, and click-first */}
      <section className="border-b border-[#d8e5f6] bg-[linear-gradient(135deg,#fffdf7_0%,#f7fbff_46%,#eaf3ff_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:items-start">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#bf0d3e]">Texas School Board Watch</p>
                  <h1 className="mt-1 text-2xl font-black leading-tight text-[#00205b] sm:text-4xl">
                    Schools and trustees, right up front.
                  </h1>
                </div>
                <ShareButtons
                  title="RepWatchr · School Board Watch"
                  description={sharedShareLine}
                  path="/school-boards"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <TopStat label="Schools" value={districts.length} />
                <TopStat label="Members" value={stats.candidates} />
                <TopStat label="Counties" value={stats.counties} />
                <TopStat label="2026 ballot" value={stats.onBallot} />
              </div>

              <div className="rounded-lg border border-[#d8e5f6] bg-white/90 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#bf0d3e]">Schools</p>
                    <h2 className="text-base font-black text-[#00205b]">Open a district fast</h2>
                  </div>
                  <Link href="#districts" className="text-xs font-black uppercase tracking-wide text-[#0057b8] hover:text-[#bf0d3e]">
                    View all
                  </Link>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {quickDistricts.map((district) => (
                    <Link
                      key={district.district_slug}
                      href={getSchoolBoardDistrictUrl(district)}
                      className="min-w-[178px] rounded-lg border border-[#d8e5f6] bg-[#f7fbff] px-3 py-2 text-left transition hover:-translate-y-0.5 hover:border-[#bf0d3e] hover:bg-white hover:shadow"
                    >
                      <p className="truncate text-sm font-black text-[#00205b]">{district.district}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        {district.county} County · {district.candidates.length} member{district.candidates.length === 1 ? "" : "s"}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <DrillDownPicker states={pickerStates} compact />
              <div className="rounded-lg border border-[#d8e5f6] bg-white/95 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#bf0d3e]">Members</p>
                    <h2 className="text-base font-black text-[#00205b]">Quick profile opens</h2>
                  </div>
                  <Link href="#profiles" className="text-xs font-black uppercase tracking-wide text-[#0057b8] hover:text-[#bf0d3e]">
                    More
                  </Link>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {quickProfiles.slice(0, 6).map(({ candidate, flags, good }) => (
                    <Link
                      key={candidate.candidate_id}
                      href={getSchoolBoardCandidateUrl(candidate)}
                      className="rounded-lg border border-[#d8e5f6] bg-[#fffdf7] px-3 py-2 transition hover:-translate-y-0.5 hover:border-[#bf0d3e] hover:bg-white hover:shadow"
                    >
                      <p className="truncate text-sm font-black text-slate-950">{candidate.preferred_name ?? candidate.full_name}</p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{candidate.district}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-black">
                        {candidate.on_2026_ballot || candidate.election_date?.includes("2026") ? (
                          <span className="rounded-full bg-[#bf0d3e]/10 px-2 py-0.5 text-[#bf0d3e]">2026</span>
                        ) : null}
                        <span className="rounded-full bg-[#0057b8]/10 px-2 py-0.5 text-[#0057b8]">{good.length} good</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{flags.length} questions</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED DISTRICTS GRID - directly below the picker */}
      <section id="districts" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Districts loaded</p>
            <h2 className="text-2xl font-black text-blue-950">{districts.length} Texas school boards live</h2>
          </div>
          <p className="text-xs font-semibold text-gray-500">{stats.candidates} sourced trustee profiles</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredDistricts.map((district) => {
            const ballot = district.candidates.filter((c) => c.on_2026_ballot || c.election_date?.includes("2026")).length;
            return (
              <Link
                key={district.district_slug}
                href={getSchoolBoardDistrictUrl(district)}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg"
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-500">{district.county} County</p>
                  {ballot > 0 ? <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black text-red-700">{ballot} on 2026</span> : null}
                </div>
                <h3 className="mt-2 text-xl font-black text-gray-950 group-hover:text-red-700">{district.district}</h3>
                <p className="mt-2 text-sm font-semibold text-gray-600">
                  {district.candidates.length} trustee profile{district.candidates.length === 1 ? "" : "s"} loaded
                </p>
                <p className="mt-3 text-xs font-bold text-blue-700">Open district &rarr;</p>
              </Link>
            );
          })}
        </div>
        {districts.length > featuredDistricts.length ? (
          <div className="mt-5 text-center">
            <p className="text-xs font-semibold text-gray-500">
              {districts.length - featuredDistricts.length} more districts available - use the picker above.
            </p>
          </div>
        ) : null}
      </section>

      {/* 2026 BALLOT - election callout, urgent and clickable */}
      {ballotCandidates.length > 0 ? (
        <section id="ballot-2026" className="border-y border-red-100 bg-red-50">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-700">2026 ballot</p>
                <h2 className="text-2xl font-black text-red-950">{ballotCandidates.length} trustees up this cycle</h2>
              </div>
              <Link
                href="/auth/signup"
                className="rounded-xl bg-red-700 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:-translate-y-0.5 hover:bg-red-800"
              >
                Sign up to vote &rarr;
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ballotCandidates.slice(0, 6).map((candidate) => (
                <Link
                  key={candidate.candidate_id}
                  href={getSchoolBoardCandidateUrl(candidate)}
                  className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black text-red-700">2026 ballot</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-700">{candidate.seat ?? "Trustee"}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-black text-gray-950">{candidate.preferred_name ?? candidate.full_name}</h3>
                  <p className="mt-0.5 text-sm font-semibold text-gray-500">{candidate.district}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* SHAREABLE PROFILES */}
      <section id="profiles" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Profiles worth sharing</p>
          <h2 className="text-2xl font-black text-blue-950">Sixty-second files. Click. Read. Share.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickProfiles.slice(0, 6).map(({ candidate, flags, good }) => (
            <article
              key={candidate.candidate_id}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg"
            >
              <Link href={getSchoolBoardCandidateUrl(candidate)} className="block">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-700">{candidate.seat ?? "Trustee"}</span>
                  {candidate.on_2026_ballot || candidate.election_date?.includes("2026") ? (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black text-red-700">2026 ballot</span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-lg font-black text-gray-950 group-hover:text-red-700">{candidate.preferred_name ?? candidate.full_name}</h3>
                <p className="mt-0.5 text-sm font-semibold text-gray-500">{candidate.district}</p>
                <p className="mt-3 text-sm leading-6 text-gray-700 line-clamp-3">{getShareLine(candidate)}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700">{good.length} good</span>
                  <span className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-700">{flags.length} questions</span>
                </div>
              </Link>
              <div className="mt-3 border-t border-gray-100 pt-3">
                <ShareButtons
                  title={`${candidate.preferred_name ?? candidate.full_name} | RepWatchr`}
                  description={getShareLine(candidate)}
                  path={getSchoolBoardCandidateUrl(candidate)}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* LIVE ENGAGEMENT - moved below candidates so people see candidates first */}
      <section id="sentiment" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Live activity</p>
          <h2 className="text-2xl font-black text-blue-950">What verified Texans are doing right now</h2>
        </div>
        <LiveEngagementCounter />
      </section>

      {/* DISCUSSION */}
      <section id="discussion" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <CommentSection officialId="school-boards-general" officialName="School Boards" />
      </section>

      {/* COLLAPSED FILLER - only for people who want it */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <details className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-left">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Methodology, sources, and stats</p>
              <h3 className="mt-1 text-lg font-black text-gray-950">How we score, where the data comes from, and the full numbers</h3>
            </div>
            <span className="text-sm font-bold text-blue-700 group-open:hidden">Open &rarr;</span>
            <span className="hidden text-sm font-bold text-blue-700 group-open:inline">Close</span>
          </summary>

          <div className="mt-6 grid gap-3 border-t border-gray-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Sourced member profiles" value={stats.candidates} />
            <Stat label="Source-backed districts" value={stats.districtsWithSources} />
            <Stat label="Counties covered" value={stats.counties} />
            <Stat label="On 2026 ballot" value={stats.onBallot} />
            <Stat label="Source URLs cited" value={stats.sourceCount} />
            <Stat label="Documented good records" value={stats.goodRecordCount} />
            <Stat label="Voter questions / flags" value={stats.flagCount} />
            <Stat label="Open research gaps" value={stats.gapCount} />
          </div>

          <div className="mt-6 grid gap-3 border-t border-gray-100 pt-6 md:grid-cols-3">
            <ImpactCard label="Hard cap" title="Child-safety / parent-rights triggers" body="Documented harm, concealment, retaliation, privacy violations, or withholding material information from parents can cap a score and wipe praise." />
            <ImpactCard label="Evidence only" title="No source, no penalty" body="Rumor does not move the model. Every score-moving item needs a public URL plus a FACT or DOCUMENTED_INFERENCE label." />
            <ImpactCard label="Political lean" title="Voting habits, not party labels" body="Nonpartisan board members get lean labels only from public primary history, donations, endorsements, public roles, or self-description." />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Audit trail</p>
            <p className="mt-1 text-sm text-gray-600">
              See per-district and per-member completion percentages on the{" "}
              <Link href="/buildout" className="font-bold text-blue-700 hover:underline">/buildout dashboard</Link>.
            </p>
          </div>
        </details>
      </section>
    </div>
  );
}

function TopStat({ label, value }: { label: string; value: number | string }) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <div className="rounded-lg border border-[#d8e5f6] bg-white/90 px-3 py-2 shadow-sm">
      <p className="text-xl font-black text-[#bf0d3e]">{displayValue}</p>
      <p className="text-[11px] font-black uppercase tracking-wide text-[#00205b]">{label}</p>
    </div>
  );
}

function Stat({ label, value, suffix = "" }: { label: string; value: number | string; suffix?: string }) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-2xl font-black text-gray-950">{displayValue}{suffix}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

function ImpactCard({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
      <p className="text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <h3 className="mt-2 text-base font-black text-gray-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
    </div>
  );
}
