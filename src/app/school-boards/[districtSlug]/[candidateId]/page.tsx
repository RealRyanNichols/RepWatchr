import type { Metadata } from "next";
import Link from "next/link";
import ShareButtons from "@/components/shared/ShareButtons";
import ReportButton from "@/components/shared/ReportButton";
import CommentSection from "@/components/comments/CommentSection";
import { getCandidateFlags, getCandidateGaps, getCandidateGoodRecords, getSchoolBoardCandidate, getSchoolBoardDossiers, getShareLine } from "@/lib/school-board-research";
import { buildEvidenceFromDossier, calculateSchoolBoardScore, schoolBoardScoringModel } from "@/lib/school-board-scoring";

export function generateStaticParams() {
  return getSchoolBoardDossiers().map((candidate) => ({ districtSlug: candidate.district_slug, candidateId: candidate.candidate_id }));
}

export async function generateMetadata({ params }: { params: Promise<{ candidateId: string }> }): Promise<Metadata> {
  const { candidateId } = await params;
  const candidate = getSchoolBoardCandidate(candidateId);
  if (!candidate) return { title: "Candidate Not Found" };
  return { title: `${candidate.preferred_name ?? candidate.full_name} School Board File`, description: getShareLine(candidate).slice(0, 155) };
}

export default async function CandidatePage({ params }: { params: Promise<{ districtSlug: string; candidateId: string }> }) {
  const { districtSlug, candidateId } = await params;
  const candidate = getSchoolBoardCandidate(candidateId);
  if (!candidate || candidate.district_slug !== districtSlug) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center"><h1 className="text-2xl font-black text-gray-950">Candidate not found</h1><Link href="/school-boards" className="mt-4 inline-flex text-sm font-bold text-blue-600">Back to school boards</Link></div>;
  }

  const good = getCandidateGoodRecords(candidate);
  const flags = getCandidateFlags(candidate);
  const gaps = getCandidateGaps(candidate);
  const votes = candidate.about_public_record?.board_performance_incumbents_only?.notable_votes ?? [];
  const narrative = candidate.about_public_record?.about_summary_narrative ?? candidate.summary;
  const positions = Object.entries(candidate.education_policy_positions ?? {});
  const score = calculateSchoolBoardScore(candidate, buildEvidenceFromDossier(candidate));

  return (
    <div>
      <section className="border-b-4 border-red-700 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href={`/school-boards/${candidate.district_slug}`} className="text-sm font-bold text-gray-500 hover:text-gray-950">&larr; Back to {candidate.district}</Link>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{candidate.district}</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{candidate.status ?? "dossier"}</span>
                {candidate.on_2026_ballot || candidate.election_date?.includes("2026") ? <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">2026 ballot</span> : null}
              </div>
              <h1 className="mt-4 text-4xl font-black leading-tight text-gray-950 sm:text-6xl">{candidate.preferred_name ?? candidate.full_name}</h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-gray-700">{candidate.seat ?? "Seat pending"}{candidate.role ? `, ${candidate.role}` : ""}. {candidate.occupation && !candidate.occupation.includes("REQUIRES_FURTHER_EVIDENCE") ? candidate.occupation : "Occupation pending source confirmation"}.</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ShareButtons title={`${candidate.preferred_name ?? candidate.full_name} | RepWatchr`} description={getShareLine(candidate)} path={`/school-boards/${candidate.district_slug}/${candidate.candidate_id}`} />
                <ReportButton officialId={candidate.candidate_id} pageUrl={`/school-boards/${candidate.district_slug}/${candidate.candidate_id}`} />
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 lg:w-96">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Sixty-second read</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{getShareLine(candidate)}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs font-black uppercase tracking-wide text-gray-500">Model score</p><p className="mt-1 text-3xl font-black text-gray-950">{score.evidenceCount === 0 ? "Pending" : score.score}</p><p className="text-sm font-bold text-gray-600">Grade {score.grade}</p></div>
                <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs font-black uppercase tracking-wide text-gray-500">Political lean</p><p className="mt-1 text-sm font-black text-gray-950">{score.politicalLean.label}</p><p className="text-xs font-bold text-gray-500">{score.politicalLean.confidence} confidence</p></div>
              </div>
              {score.praiseWiped ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-black text-red-900">Praise override active</p><p className="mt-1 text-sm leading-6 text-red-800">{score.overrideReason}</p></div> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <RecordColumn title="Good record" tone="good" items={score.praiseWiped ? ["Praise hidden because a documented child/parent-rights override is active."] : good.length ? good : ["No positive record item has been loaded yet."]} />
        <RecordColumn title="Voter questions" tone="flag" items={flags.length ? flags.map((flag) => flag.description) : ["No negative public-record item has surfaced in this dossier."]} />
        <RecordColumn title="Open gaps" tone="gap" items={gaps} />
      </section>

      {narrative ? <section className="bg-slate-50"><div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm font-black uppercase tracking-wide text-red-700">Narrative</p><h2 className="mt-2 text-3xl font-black text-gray-950">What the record says now</h2><div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">{narrative.split("\n\n").map((paragraph) => <p key={paragraph} className="mb-4 text-base leading-8 text-gray-700 last:mb-0">{paragraph}</p>)}</div></div></section> : null}

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black text-gray-950">Board votes and public statements</h2><div className="mt-5 space-y-4">{votes.length === 0 && (candidate.notable_statements?.length ?? 0) === 0 ? <p className="text-sm leading-6 text-gray-600">No vote or public-statement entries have been loaded yet.</p> : null}{votes.map((vote) => <SourceItem key={`${vote.meeting_date}-${vote.item}`} title={vote.meeting_date ?? "Board record"} body={`${vote.item ?? "Vote item"} ${vote.board_outcome ? `(${vote.board_outcome})` : ""}`} url={vote.source_url} />)}{candidate.notable_statements?.map((statement) => <SourceItem key={`${statement.platform}-${statement.date}-${statement.quote_or_paraphrase}`} title={`${statement.platform ?? "Public statement"} ${statement.date ? `, ${statement.date}` : ""}`} body={statement.quote_or_paraphrase ?? "Statement summary pending."} url={statement.source_url} />)}</div></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black text-gray-950">Issue positions</h2><div className="mt-5 space-y-3">{positions.length === 0 ? <p className="text-sm leading-6 text-gray-600">Issue-position research has not been loaded yet.</p> : positions.map(([key, value]) => <div key={key} className="rounded-xl bg-gray-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-gray-500">{key.replaceAll("_", " ")}</p><p className="mt-1 text-sm leading-6 text-gray-700">{value}</p></div>)}</div></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8"><div className="rounded-2xl border border-gray-200 bg-slate-950 p-6 text-white shadow-sm"><p className="text-sm font-black uppercase tracking-wide text-red-300">RepWatchr child and parent-rights model</p><h2 className="mt-2 text-2xl font-black">How this score is weighted</h2><div className="mt-5 grid gap-3 md:grid-cols-4">{Object.entries(score.categoryScores).map(([category, value]) => <div key={category} className="rounded-xl border border-white/10 bg-white/10 p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-300">{category.replaceAll("_", " ")}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</div><p className="mt-5 text-sm leading-6 text-slate-300">{score.requiredEvidenceNote} Model version: {schoolBoardScoringModel.version}.</p></div></section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8"><div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black text-gray-950">Sources</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{(candidate.sources ?? []).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-bold text-blue-700 hover:bg-blue-50">{source.title ?? source.url}</a>)}{(candidate.sources ?? []).length === 0 ? <p className="text-sm text-gray-600">No source list has been loaded for this dossier yet.</p> : null}</div></div></section>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"><CommentSection officialId={candidate.candidate_id} officialName={candidate.preferred_name ?? candidate.full_name} /></section>
    </div>
  );
}

function RecordColumn({ title, items, tone }: { title: string; items: string[]; tone: "good" | "flag" | "gap" }) {
  const toneClass = { good: "border-emerald-200 bg-emerald-50 text-emerald-900", flag: "border-red-200 bg-red-50 text-red-900", gap: "border-amber-200 bg-amber-50 text-amber-950" }[tone];
  return <div className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}><h2 className="text-xl font-black">{title}</h2><ul className="mt-4 space-y-3 text-sm leading-6">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

function SourceItem({ title, body, url }: { title: string; body: string; url?: string }) {
  return <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-sm font-black text-gray-950">{title}</p><p className="mt-1 text-sm leading-6 text-gray-700">{body}</p>{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-bold text-blue-700">Source &rarr;</a> : null}</div>;
}
