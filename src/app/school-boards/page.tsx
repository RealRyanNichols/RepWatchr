import type { Metadata } from "next";
import Link from "next/link";
import CommentSection from "@/components/comments/CommentSection";
import SchoolBoardStatePicker from "@/components/school-boards/SchoolBoardStatePicker";
import LiveEngagementCounter from "@/components/school-board/LiveEngagementCounter";
import {
  NATIONAL_SCHOOL_BOARD_DIRECTORY_TARGET,
  SCHOOL_BOARD_EXPANSION_SOURCES,
  TEXAS_SCHOOL_BOARD_TARGET,
  getSchoolBoardStates,
} from "@/data/school-board-states";
import {
  getCandidateFlags,
  getCandidateGaps,
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
    "United States school board dossiers with sourced facts, good records, red flags, campaign finance gaps, and voter questions.",
};

export default function SchoolBoardsPage() {
  const stats = getSchoolBoardStats();
  const districts = getSchoolBoardDistricts();
  const candidates = getSchoolBoardDossiers();
  const priorityDistricts = districts.filter((district) => district.priorityRank).sort((a, b) => (a.priorityRank ?? 999) - (b.priorityRank ?? 999));
  const shareableProfiles = candidates.filter((candidate) => getCandidateFlags(candidate).length > 0 || getCandidateGoodRecords(candidate).length > 1).slice(0, 6);
  const positiveProfiles = candidates.filter((candidate) => getCandidateGoodRecords(candidate).length > 1).slice(0, 4);
  const districtsWithSources = districts.filter((district) => (district.sourceLinks?.length ?? 0) > 0 || district.candidates.some((candidate) => (candidate.sources?.length ?? 0) > 0)).length;
  const profilesNeedingReview = candidates.filter((candidate) => candidate.status === "stub" || candidate.status === "needs_review").length;
  const states = getSchoolBoardStates({
    loadedDistricts: districtsWithSources,
    loadedProfiles: stats.candidates,
  });

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[url('/images/repwatchr_cover.png')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-red-950/80" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-red-300">School Board Watch</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-white sm:text-6xl">
              Every board. Every state. Facts first.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              RepWatchr is building a national school-board accountability index. Texas opens first by default, then every state gets district rosters, board-member profiles, legal/public-record checks, political-lean research, praise when earned, and hard child/parent-rights scoring when evidence supports it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#profiles" className="rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                Read the profiles
              </Link>
              <Link href="/methodology" className="rounded-lg border border-white/40 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                Check the method
              </Link>
            </div>
          </div>

          <aside className="space-y-3">
            <LiveEngagementCounter />
            <div className="rounded-2xl border border-white/15 bg-white/95 p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Buildout coverage</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ClickableStat
                  href="#districts"
                  label="Districts live"
                  value={stats.districts}
                  caption={`${stats.districtsWithSources} source-backed`}
                />
                <ClickableStat
                  href="#profiles"
                  label="Member profiles"
                  value={stats.candidates}
                  caption={`${stats.completedDossiers} completed · ${stats.stubProfiles} need review`}
                />
                <ClickableStat
                  href="#ballot-2026"
                  label="On 2026 ballot"
                  value={stats.onBallot}
                  caption={`${stats.tracked2026Districts} districts in play`}
                />
                <ClickableStat
                  href="#counties"
                  label="Counties covered"
                  value={stats.counties}
                  caption={`${stats.districtsWithRosters} rostered districts`}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-500">
                Texas trustee target {TEXAS_SCHOOL_BOARD_TARGET.profilesTarget.toLocaleString()}+. {NATIONAL_SCHOOL_BOARD_DIRECTORY_TARGET.directoryLabel} reference. Live numbers are sourced files only — directory placeholders are not counted.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section id="analytics" className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Story so far</p>
              <h2 className="text-3xl font-black text-gray-950">The numbers behind the watch</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-gray-600">
              Click any tile. Each number is computed from sourced public records loaded into RepWatchr — not estimates, not stock photos, not rumor.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StoryStat
              href="#profiles"
              tone="blue"
              label="Member profiles"
              value={stats.candidates}
              story={`${stats.completedDossiers} completed dossiers, ${stats.stubProfiles} stubs flagged for follow-up.`}
            />
            <StoryStat
              href="#ballot-2026"
              tone="red"
              label="On 2026 ballot"
              value={stats.onBallot}
              story={`Across ${stats.tracked2026Districts} Texas districts that have seats up this cycle.`}
            />
            <StoryStat
              href="#good-records"
              tone="green"
              label="Good records documented"
              value={stats.goodRecordCount}
              story={`${stats.membersWithGoodRecord} trustees with at least one positive record on file.`}
            />
            <StoryStat
              href="#concerns"
              tone="amber"
              label="Voter questions / concerns"
              value={stats.flagCount}
              story={`${stats.membersWithFlags} trustees with at least one documented concern or conflict.`}
            />
            <StoryStat
              href="#sources"
              tone="blue"
              label="Source links loaded"
              value={stats.sourceCount}
              story="Every score-moving claim ties to a public URL. No screenshots, no rumor."
            />
            <StoryStat
              href="#counties"
              tone="green"
              label="Counties covered"
              value={stats.counties}
              story={`${stats.districtsWithRosters} districts have a sourced board roster loaded.`}
            />
            <StoryStat
              href="#takeover"
              tone="red"
              label="Districts under TEA review"
              value={stats.districtsUnderTEAReview}
              story="Houston, Fort Worth, and any board where elected trustees lost authority."
            />
            <StoryStat
              href="#gaps"
              tone="amber"
              label="Open research gaps"
              value={stats.gapCount}
              story="Missing filings, vote records, opponent status — shown publicly, not hidden."
            />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <ImpactCard label="Expose" title={`${stats.flagCount} documented voter questions`} body="Conflicts, dual roles, campaign finance concerns, and open-source red flags stay tied to source records." />
            <ImpactCard label="Reward" title={`${stats.goodRecordCount} good-record items`} body="Public service, clean leadership, useful votes, and positive community work are part of the profile too." />
            <ImpactCard label="Pressure" title={`${stats.gapCount} research gaps visible`} body="Missing filings, unverified employment, vote records, and opponent status are shown instead of hidden." />
          </div>
        </div>
      </section>

      <section className="border-b border-blue-100 bg-[#f7fbff]">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <SchoolBoardStatePicker states={states} />
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">
              Source discipline
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-950">
              We import districts before we publish people.
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
              District directories are the first layer. Board-member names,
              photos, claims, political-lean notes, praise, and concerns stay
              unpublished until they are tied to official or lawful public
              records.
            </p>
            <div className="mt-5 grid gap-3">
              {SCHOOL_BOARD_EXPANSION_SOURCES.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-bold leading-6 text-gray-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="block font-black text-blue-900">{source.title}</span>
                  <span className="mt-1 block">{source.note}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="counties" className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-red-700">Coverage map</p>
            <h2 className="mt-1 text-3xl font-black text-gray-950">{stats.counties} Texas counties · {stats.districts} districts loaded</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
              The largest ISDs from Houston, Dallas-Fort Worth, Austin, San Antonio, plus the East Texas core. {NATIONAL_SCHOOL_BOARD_DIRECTORY_TARGET.directoryRecords.toLocaleString()} NCES records queued for the rest of the country. Texas target {TEXAS_SCHOOL_BOARD_TARGET.districtsTarget.toLocaleString()} districts.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(stats.districtsByCounty)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 12)
                .map(([county, count]) => (
                  <div key={county} className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{county}</p>
                    <p className="text-lg font-black text-blue-950">{count} district{count === 1 ? "" : "s"}</p>
                  </div>
                ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="NCES LEA records queued" value={NATIONAL_SCHOOL_BOARD_DIRECTORY_TARGET.directoryRecords} />
            <Stat label="Texas LEA target" value={TEXAS_SCHOOL_BOARD_TARGET.districtsTarget} />
            <Stat label="Source-backed districts" value={districtsWithSources} />
            <Stat label="Stubs flagged for review" value={profilesNeedingReview} />
          </div>
        </div>
      </section>

      <section id="profiles" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-red-700">Start here</p>
            <h2 className="text-3xl font-black text-gray-950">Shareable candidate files</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            Built for a reader who has sixty seconds and wants the point fast, with source links close by.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shareableProfiles.map((candidate) => (
            <CandidateFeatureCard candidateId={candidate.candidate_id} key={candidate.candidate_id} />
          ))}
        </div>
      </section>

      <section id="ballot-2026" className="border-y border-red-100 bg-red-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-700">2026 ballot</p>
              <h2 className="text-3xl font-black text-red-950">{stats.onBallot} trustees up this cycle</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-red-900/80">
                Open seats + contested races across {stats.tracked2026Districts} Texas districts. Verified Texans can vote and grade each one.
              </p>
            </div>
            <Link href="/auth/signup" className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-red-800">
              Sign up to vote &rarr;
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {candidates
              .filter((candidate) => candidate.on_2026_ballot || candidate.election_date?.includes("2026"))
              .slice(0, 6)
              .map((candidate) => (
                <Link
                  key={candidate.candidate_id}
                  href={getSchoolBoardCandidateUrl(candidate)}
                  className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">2026 ballot</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{candidate.seat ?? "Trustee"}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-gray-950">{candidate.preferred_name ?? candidate.full_name}</h3>
                  <p className="mt-1 text-sm font-semibold text-gray-500">{candidate.district}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-700 line-clamp-3">{getShareLine(candidate)}</p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section id="sources" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">Sources</p>
          <h2 className="mt-1 text-2xl font-black text-blue-950">{stats.sourceCount} public-record sources cited</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-blue-900/80">
            Every fact above traces to an official district page, election filing, board minutes, or named news source. Source URLs are loaded into each member profile so readers can verify any claim.
          </p>
        </div>
      </section>

      <section id="takeover" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-amber-800">Districts under TEA review</p>
          <h2 className="mt-1 text-2xl font-black text-amber-950">{stats.districtsUnderTEAReview} districts where elected trustees lost authority</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-900/80">
            Houston ISD and Fort Worth ISD elected trustees still appear on RepWatchr, but the Texas Education Agency has appointed a Board of Managers in those districts. Profiles flag the takeover so voters can track both rosters.
          </p>
        </div>
      </section>

      <section id="districts" />
      <section id="good-records" />
      <section id="concerns" />
      <section id="gaps" />

      <section className="bg-emerald-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-7">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-200">Good records</p>
            <h2 className="text-3xl font-black text-white">Reward behavior worth copying.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100">
              The site should not train people to only expect scandal. A clean record, clear service, useful vote, or transparent disclosure deserves oxygen unless a documented child/parent-rights override applies.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {positiveProfiles.map((candidate) => (
              <Link key={candidate.candidate_id} href={getSchoolBoardCandidateUrl(candidate)} className="rounded-2xl border border-emerald-700 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Positive record</p>
                <h3 className="mt-2 text-xl font-black text-gray-950">{candidate.preferred_name ?? candidate.full_name}</h3>
                <p className="mt-1 text-sm font-semibold text-gray-500">{candidate.district}</p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-700">
                  {getCandidateGoodRecords(candidate).slice(0, 3).map((item) => <li key={item}>+ {item}</li>)}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-wide text-red-700">Districts</p>
          <h2 className="text-3xl font-black text-gray-950">Board rooms being verified first</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-gray-600">
            Each school needs a complete profile: official roster, terms, contact information, district colors, sources, board votes, parent questions, praise, concerns, social handles, and claim/answer tools. Profiles stay marked incomplete until those fields are sourced.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {priorityDistricts.map((district) => {
            const ballotCount = district.candidates.filter((candidate) => candidate.on_2026_ballot || candidate.election_date?.includes("2026")).length;
            return (
              <Link key={district.district_slug} href={getSchoolBoardDistrictUrl(district)} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-xl">
                <p className="text-xs font-black uppercase tracking-wide text-gray-500">{district.county} County</p>
                <h3 className="mt-2 text-2xl font-black text-gray-950">{district.priorityRank}. {district.district}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {district.candidates.length > 0 ? `${district.candidates.length} sourced dossier profiles, ${ballotCount} tied to 2026 elections.` : "Needs full board roster, election filing, legal record, political-lean, and source-document pull."}
                </p>
                <span className="mt-5 inline-flex text-sm font-black text-red-700">{district.candidates.length > 0 ? "Open district file" : "Queued for research"} &rarr;</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-red-300">Scoring model</p>
          <h2 className="mt-2 text-3xl font-black text-white">Praise is earned. Child and parent-rights violations override it.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ImpactCard label="Hard cap" title="Child safety and parent-rights triggers" body="Documented harm, concealment, retaliation, privacy violations, or withholding material information from parents can cap the score and wipe praise." />
            <ImpactCard label="Evidence only" title="No source, no penalty" body="Rumor does not move the model. Every score-moving item needs a public URL and FACT or DOCUMENTED_INFERENCE label." />
            <ImpactCard label="Political lean" title="Voting habits, not party labels" body="Nonpartisan board members get lean labels only from public primary history, donations, endorsements, public roles, or self-description." />
          </div>
        </div>
      </section>

      <section id="discussion" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <CommentSection officialId="school-boards-general" officialName="School Boards" />
      </section>
    </div>
  );
}

function Stat({ label, value, suffix = "" }: { label: string; value: number | string; suffix?: string }) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  return <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-3xl font-black text-gray-950">{displayValue}{suffix}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p></div>;
}

function ClickableStat({ href, label, value, caption }: { href: string; label: string; value: number | string; caption?: string }) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
    >
      <p className="text-2xl font-black text-gray-950">{displayValue}</p>
      <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      {caption ? <p className="mt-1 text-xs font-semibold text-gray-500">{caption}</p> : null}
    </Link>
  );
}

function StoryStat({
  href,
  label,
  value,
  story,
  tone,
}: {
  href: string;
  label: string;
  value: number | string;
  story: string;
  tone: "blue" | "red" | "green" | "amber";
}) {
  const toneClass = {
    blue: "border-blue-200 bg-blue-50 text-blue-950 hover:border-blue-400",
    red: "border-red-200 bg-red-50 text-red-900 hover:border-red-400",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400",
    amber: "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-400",
  }[tone];
  const accent = {
    blue: "text-blue-700",
    red: "text-red-700",
    green: "text-emerald-700",
    amber: "text-amber-800",
  }[tone];
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <Link
      href={href}
      className={`group block rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}
    >
      <p className={`text-xs font-black uppercase tracking-wide ${accent}`}>{label}</p>
      <p className="mt-2 text-4xl font-black">{displayValue}</p>
      <p className="mt-2 text-sm font-semibold leading-6">{story}</p>
      <p className={`mt-3 text-xs font-bold uppercase tracking-wide opacity-80 group-hover:opacity-100 ${accent}`}>Drill in &rarr;</p>
    </Link>
  );
}

function ImpactCard({ label, title, body }: { label: string; title: string; body: string }) {
  return <div className="rounded-xl border border-gray-200 bg-gray-50 p-5"><p className="text-xs font-black uppercase tracking-wide text-red-700">{label}</p><h3 className="mt-2 text-lg font-black text-gray-950">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-600">{body}</p></div>;
}

function CandidateFeatureCard({ candidateId }: { candidateId: string }) {
  const candidate = getSchoolBoardDossiers().find((item) => item.candidate_id === candidateId);
  if (!candidate) return null;
  const flags = getCandidateFlags(candidate);
  const gaps = getCandidateGaps(candidate);
  return (
    <Link href={getSchoolBoardCandidateUrl(candidate)} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-xl">
      <div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{candidate.seat ?? "Seat pending"}</span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{candidate.status ?? "dossier"}</span></div>
      <h3 className="mt-4 text-xl font-black text-gray-950 group-hover:text-red-700">{candidate.preferred_name ?? candidate.full_name}</h3>
      <p className="mt-1 text-sm font-semibold text-gray-500">{candidate.district}</p>
      <p className="mt-4 text-sm leading-6 text-gray-700">{getShareLine(candidate)}</p>
      <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-bold"><span className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{flags.length} voter questions</span><span className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">{gaps.length} open gaps</span></div>
    </Link>
  );
}
