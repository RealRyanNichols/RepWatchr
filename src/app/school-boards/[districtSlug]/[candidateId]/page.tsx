import type { Metadata } from "next";
import Link from "next/link";
import ShareButtons from "@/components/shared/ShareButtons";
import ReportButton from "@/components/shared/ReportButton";
import ProfileOpenTracker from "@/components/shared/ProfileOpenTracker";
import CommentSection from "@/components/comments/CommentSection";
import ClaimProfileCta from "@/components/profile/ClaimProfileCta";
import ClaimedProfilePanel from "@/components/profile/ClaimedProfilePanel";
import ProfilePhoto from "@/components/profile/ProfilePhoto";
import OfficialVotingSection from "@/components/voting/OfficialVotingSection";
import GradeOfficialSection from "@/components/voting/GradeOfficialSection";
import QuickFacts from "@/components/school-board/QuickFacts";
import CappedList from "@/components/school-board/CappedList";
import WhyThisScore from "@/components/school-board/WhyThisScore";
import { getDistrictBranding } from "@/data/school-board-branding";
import { getCandidateFlags, getCandidateGaps, getCandidateGoodRecords, getSchoolBoardCandidate, getSchoolBoardDossiers, getShareLine } from "@/lib/school-board-research";
import { getCandidateDataId, getCandidateUrlSlug, getDistrictUrlSlug, getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";
import { buildEvidenceFromDossier, calculateSchoolBoardScore, schoolBoardScoringModel } from "@/lib/school-board-scoring";

export function generateStaticParams() {
  return getSchoolBoardDossiers().map((candidate) => ({ districtSlug: getDistrictUrlSlug(candidate.district_slug), candidateId: getCandidateUrlSlug(candidate) }));
}

export async function generateMetadata({ params }: { params: Promise<{ districtSlug: string; candidateId: string }> }): Promise<Metadata> {
  const { candidateId } = await params;
  const candidate = getSchoolBoardCandidate(getCandidateDataId(candidateId));
  if (!candidate) return { title: "Candidate Not Found" };
  const canonical = getSchoolBoardCandidateUrl(candidate);
  const socialImage = `/api/og/school-board?type=member&district=${getDistrictUrlSlug(candidate.district_slug)}&candidate=${getCandidateUrlSlug(candidate)}`;
  const title = `${candidate.preferred_name ?? candidate.full_name} School Board File`;
  const description = getShareLine(candidate).slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${candidate.preferred_name ?? candidate.full_name} school board profile` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

function isMeaningful(value: string | undefined | null): boolean {
  if (!value) return false;
  const v = value.trim();
  return Boolean(v) && !v.includes("REQUIRES_FURTHER_EVIDENCE");
}

export default async function CandidatePage({ params }: { params: Promise<{ districtSlug: string; candidateId: string }> }) {
  const { districtSlug, candidateId } = await params;
  const candidate = getSchoolBoardCandidate(getCandidateDataId(candidateId));
  if (!candidate || ![candidate.district_slug, getDistrictUrlSlug(candidate.district_slug)].includes(districtSlug)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-gray-950">Candidate not found</h1>
        <Link href="/school-boards" className="mt-4 inline-flex text-sm font-bold text-blue-600">Back to school boards</Link>
      </div>
    );
  }

  const good = getCandidateGoodRecords(candidate);
  const flags = getCandidateFlags(candidate);
  const gaps = getCandidateGaps(candidate);
  const votes = candidate.about_public_record?.board_performance_incumbents_only?.notable_votes ?? [];
  const narrative = candidate.about_public_record?.about_summary_narrative ?? candidate.summary;
  const positions = Object.entries(candidate.education_policy_positions ?? {}).filter(([, value]) => isMeaningful(value));
  const score = calculateSchoolBoardScore(candidate, buildEvidenceFromDossier(candidate));
  const branding = getDistrictBranding(candidate.district_slug);
  const candidateCountyNames = (candidate.county ?? "")
    .split(/[\/,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.toLowerCase().endsWith("county") ? part : `${part} County`));

  const subline = [candidate.seat, candidate.role].filter(Boolean).join(" · ");
  const quickFacts = [
    { label: "Seat", value: candidate.seat },
    { label: "Role", value: candidate.role },
    { label: "County", value: candidate.county ? `${candidate.county}${candidate.county.toLowerCase().endsWith("county") ? "" : " County"}` : null },
    { label: "Years on board", value: candidate.years_on_board ? String(candidate.years_on_board) : null },
    { label: "Election", value: candidate.election_date ?? null },
    { label: "Occupation", value: isMeaningful(candidate.occupation) ? candidate.occupation : null },
  ];

  const hasFullFile =
    votes.length > 0 ||
    (candidate.notable_statements?.length ?? 0) > 0 ||
    positions.length > 0 ||
    Object.values(candidate.social_media ?? {}).some(Boolean) ||
    (candidate.sources?.length ?? 0) > 0;

  return (
    <div className="bg-slate-50">
      <ProfileOpenTracker
        profileId={candidate.candidate_id}
        profileType="school_board"
        path={getSchoolBoardCandidateUrl(candidate)}
        districtSlug={candidate.district_slug}
      />
      {/* Hero */}
      <section className="border-b-4 bg-white" style={{ borderColor: branding.primary }}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href={getSchoolBoardDistrictUrl(candidate)} className="text-sm font-bold text-gray-500 hover:text-gray-950">
            &larr; Back to {candidate.district}
          </Link>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <ProfilePhoto
                  profileId={candidate.candidate_id}
                  name={candidate.preferred_name ?? candidate.full_name}
                  size="lg"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={getSchoolBoardDistrictUrl(candidate)}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                    >
                      {candidate.district}
                    </Link>
                    {candidate.on_2026_ballot || candidate.election_date?.includes("2026") ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">On 2026 ballot</span>
                    ) : null}
                    {candidate.status === "stub" || candidate.status === "needs_review" ? (
                      <span
                        className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"
                        title="Profile is still being researched. Some fields may be missing or pending source confirmation."
                      >
                        Profile in progress
                      </span>
                    ) : null}
                  </div>
                  <h1 className="mt-3 text-3xl font-black leading-tight text-gray-950 sm:text-5xl">
                    {candidate.preferred_name ?? candidate.full_name}
                  </h1>
                  {subline ? <p className="mt-2 text-base font-semibold text-gray-600">{subline}</p> : null}
                  <div className="mt-4">
                    <QuickFacts facts={quickFacts} />
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <ShareButtons title={`${candidate.preferred_name ?? candidate.full_name} | RepWatchr`} description={getShareLine(candidate)} path={getSchoolBoardCandidateUrl(candidate)} />
                    <ReportButton officialId={candidate.candidate_id} pageUrl={getSchoolBoardCandidateUrl(candidate)} />
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <ClaimProfileCta
                  profileId={candidate.candidate_id}
                  profileName={candidate.preferred_name ?? candidate.full_name}
                  districtSlug={candidate.district_slug}
                />
              </div>
            </div>

            {/* Score sidebar */}
            <aside className="rounded-2xl border border-gray-200 bg-gray-50 p-5 lg:w-96">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Sixty-second read</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{getShareLine(candidate)}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-500">Model score</p>
                  <p className="mt-1 text-3xl font-black text-gray-950">{score.grade === "Pending" ? "Review" : score.score}</p>
                  <p className="text-sm font-bold text-gray-600">{score.grade === "Pending" ? "Evidence pending" : `Grade ${score.grade}`}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-500">Political lean</p>
                  <p className="mt-1 text-sm font-black text-gray-950">{score.politicalLean.label}</p>
                  <p className="text-xs font-bold text-gray-500">{score.politicalLean.confidence} confidence</p>
                </div>
              </div>
              <PoliticalLeanArrow label={score.politicalLean.label} confidence={score.politicalLean.confidence} />
              {score.praiseWiped ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-black text-red-900">Praise override active</p>
                  <p className="mt-1 text-sm leading-6 text-red-800">{score.overrideReason}</p>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <ClaimedProfilePanel profileId={candidate.candidate_id} />

      {/* Algorithm transparency: collapsible */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <WhyThisScore score={score} />
      </section>

      {/* Record at-a-glance */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <RecordColumn
            title="Good record"
            tone="good"
            items={score.praiseWiped ? ["Praise hidden because a documented child/parent-rights override is active."] : good}
            emptyText="No positive record item has been loaded yet."
          />
          <RecordColumn
            title="Voter questions"
            tone="flag"
            items={flags.map((flag) => flag.description)}
            emptyText="No negative public-record item has surfaced in this dossier."
          />
          <RecordColumn title="Open gaps" tone="gap" items={gaps} emptyText="No outstanding gaps recorded." />
        </div>
      </section>

      {/* Narrative: collapsible to keep page tight */}
      {narrative ? (
        <section className="mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-8">
          <details className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between text-left">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Narrative</p>
                <h2 className="mt-1 text-xl font-black text-gray-950">What the record says now</h2>
              </div>
              <span className="text-sm font-bold text-blue-700 group-open:hidden">Read &rarr;</span>
              <span className="hidden text-sm font-bold text-blue-700 group-open:inline">Hide</span>
            </summary>
            <div className="mt-4 border-t border-gray-100 pt-4">
              {narrative.split("\n\n").map((paragraph) => (
                <p key={paragraph} className="mb-4 text-base leading-8 text-gray-700 last:mb-0">{paragraph}</p>
              ))}
            </div>
          </details>
        </section>
      ) : null}

      {/* Sentiment (verified vote + grade) */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_55%,#fff7ed_100%)] p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Verified Texas sentiment</p>
              <h2 className="mt-1 text-2xl font-black text-blue-950 sm:text-3xl">
                How Texans rate {candidate.preferred_name ?? candidate.full_name}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-950/75">
                Verified Texans can approve, disapprove, and assign a letter grade. Statewide totals are shown alongside the in-district {candidate.county || "constituent"} count.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <OfficialVotingSection officialId={candidate.candidate_id} officialCounties={candidateCountyNames} />
            <GradeOfficialSection
              officialId={candidate.candidate_id}
              officialCounties={candidateCountyNames}
              officialName={candidate.preferred_name ?? candidate.full_name}
            />
          </div>
        </div>
      </section>

      {/* Public discussion */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <CommentSection officialId={candidate.candidate_id} officialName={candidate.preferred_name ?? candidate.full_name} />
      </section>

      {/* Full file: collapsed by default to keep the surface clean */}
      {hasFullFile ? (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <details className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between text-left">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Full RepWatchr file</p>
                <h2 className="mt-1 text-xl font-black text-gray-950">Votes, positions, social, scoring detail, and sources</h2>
                <p className="mt-1 text-xs font-semibold text-gray-500">Background research is collapsed so the profile reads cleanly.</p>
              </div>
              <span className="text-sm font-bold text-blue-700 group-open:hidden">Open file &rarr;</span>
              <span className="hidden text-sm font-bold text-blue-700 group-open:inline">Close file</span>
            </summary>

            <div className="mt-6 grid gap-6 border-t border-gray-100 pt-6 lg:grid-cols-2">
              {(votes.length > 0 || (candidate.notable_statements?.length ?? 0) > 0) && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <h3 className="text-base font-black text-gray-950">Board votes and public statements</h3>
                  <div className="mt-3 space-y-3">
                    {votes.map((vote) => (
                      <SourceItem
                        key={`${vote.meeting_date}-${vote.item}`}
                        title={vote.meeting_date ?? "Board record"}
                        body={`${vote.item ?? "Vote item"} ${vote.board_outcome ? `(${vote.board_outcome})` : ""}`}
                        url={vote.source_url}
                      />
                    ))}
                    {candidate.notable_statements?.map((statement) => (
                      <SourceItem
                        key={`${statement.platform}-${statement.date}-${statement.quote_or_paraphrase}`}
                        title={`${statement.platform ?? "Public statement"}${statement.date ? `, ${statement.date}` : ""}`}
                        body={statement.quote_or_paraphrase ?? "Statement summary pending."}
                        url={statement.source_url}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(positions.length > 0 || Object.values(candidate.social_media ?? {}).some(Boolean)) && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <h3 className="text-base font-black text-gray-950">Issue positions and public handles</h3>
                  {positions.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {positions.map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-white p-3">
                          <p className="text-xs font-black uppercase tracking-wide text-gray-500">{key.replaceAll("_", " ")}</p>
                          <p className="mt-1 text-sm leading-6 text-gray-700">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <SocialLinks links={candidate.social_media ?? {}} />
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-300">RepWatchr scoring detail</p>
              <h3 className="mt-1 text-lg font-black">How this score is weighted</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {Object.entries(score.categoryScores).map(([category, value]) => (
                  <div key={category} className="rounded-xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-300">{category.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-2xl font-black">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-300">
                {score.requiredEvidenceNote} Model version: {schoolBoardScoringModel.version}.
              </p>
            </div>

            {(candidate.sources?.length ?? 0) > 0 ? (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-base font-black text-gray-950">Sources</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {(candidate.sources ?? []).map((source) => (
                    <a
                      key={source.url || source.title}
                      href={source.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-200 bg-white p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      {source.title ?? source.url}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </details>
        </section>
      ) : null}
    </div>
  );
}

function RecordColumn({
  title,
  items,
  tone,
  emptyText,
}: {
  title: string;
  items: string[];
  tone: "good" | "flag" | "gap";
  emptyText: string;
}) {
  const toneClass = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    flag: "border-red-200 bg-red-50 text-red-900",
    gap: "border-amber-200 bg-amber-50 text-amber-950",
  }[tone];
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-3">
        <CappedList items={items} cap={3} emptyText={emptyText} />
      </div>
    </div>
  );
}

function SourceItem({ title, body, url }: { title: string; body: string; url?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-sm font-black text-gray-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-700">{body}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-bold text-blue-700">
          Source &rarr;
        </a>
      ) : null}
    </div>
  );
}

function PoliticalLeanArrow({ label, confidence }: { label: string; confidence: string }) {
  const position =
    label === "Votes Republican"
      ? "left-[78%]"
      : label === "Votes Democrat"
        ? "left-[18%]"
        : "left-1/2";
  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-gray-500">
        <span>Left</span>
        <span>Evidence-based lean</span>
        <span>Right</span>
      </div>
      <div className="relative mt-3 h-3 rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#e5e7eb_50%,#dc2626_100%)]">
        <span className={`absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white bg-gray-950 shadow ${position}`} />
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-gray-700">
        {label}. Confidence: {confidence}. Moves only when public voting history, donations, endorsements, self-description, or source-backed silent signals are loaded.
      </p>
    </div>
  );
}

function SocialLinks({ links }: { links: Record<string, string> }) {
  const entries = Object.entries(links).filter(([, url]) => Boolean(url));
  if (entries.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">Public social handles</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {entries.map(([platform, url]) => (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-blue-900 px-3 py-1.5 text-xs font-black text-white hover:bg-red-700"
          >
            {platform}
          </a>
        ))}
      </div>
    </div>
  );
}
