import type { Metadata } from "next";
import Link from "next/link";
import CommentSection from "@/components/comments/CommentSection";
import SchoolBoardStatePicker from "@/components/school-boards/SchoolBoardStatePicker";
import {
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
  const states = getSchoolBoardStates({
    loadedDistricts: stats.districts,
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

          <aside className="rounded-2xl border border-white/15 bg-white/95 p-5 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Texas build status</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Verified profiles live" value={stats.candidates} />
              <Stat label="Verified districts live" value={stats.districts} />
              <Stat label="2026 seats" value={stats.onBallot} />
              <Stat label="Texas trustee target" value={TEXAS_SCHOOL_BOARD_TARGET.profilesTarget} suffix="+" />
            </div>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-950">No fake completion</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                The live number is only the verified file count. The Texas target is every trustee, using TEA/district rosters and TASB's 7,000+ trustee benchmark.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          <ImpactCard label="Expose" title={`${stats.flagCount} documented voter questions`} body="Conflicts, dual roles, campaign finance concerns, and open-source red flags stay tied to source records." />
          <ImpactCard label="Reward" title="Good records get surfaced" body="Public service, clean leadership, useful votes, and positive community work are part of the profile too." />
          <ImpactCard label="Pressure" title={`${stats.gapCount} research gaps visible`} body="Missing filings, unverified employment, vote records, and opponent status are shown instead of hidden." />
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
              <Link key={candidate.candidate_id} href={`/school-boards/${candidate.district_slug}/${candidate.candidate_id}`} className="rounded-2xl border border-emerald-700 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
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
          <h2 className="text-3xl font-black text-gray-950">Texas board rooms being verified first</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-gray-600">
            Each school needs a complete profile: official roster, terms, contact information, district colors, sources, board votes, parent questions, praise, concerns, social handles, and claim/answer tools. Profiles stay marked incomplete until those fields are sourced.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {priorityDistricts.map((district) => {
            const ballotCount = district.candidates.filter((candidate) => candidate.on_2026_ballot || candidate.election_date?.includes("2026")).length;
            return (
              <Link key={district.district_slug} href={`/school-boards/${district.district_slug}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-xl">
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

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <CommentSection officialId="school-boards-general" officialName="School Boards" />
      </section>
    </div>
  );
}

function Stat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-3xl font-black text-gray-950">{value.toLocaleString()}{suffix}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p></div>;
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
    <Link href={`/school-boards/${candidate.district_slug}/${candidate.candidate_id}`} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-xl">
      <div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{candidate.seat ?? "Seat pending"}</span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{candidate.status ?? "dossier"}</span></div>
      <h3 className="mt-4 text-xl font-black text-gray-950 group-hover:text-red-700">{candidate.preferred_name ?? candidate.full_name}</h3>
      <p className="mt-1 text-sm font-semibold text-gray-500">{candidate.district}</p>
      <p className="mt-4 text-sm leading-6 text-gray-700">{getShareLine(candidate)}</p>
      <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-bold"><span className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{flags.length} voter questions</span><span className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">{gaps.length} open gaps</span></div>
    </Link>
  );
}
