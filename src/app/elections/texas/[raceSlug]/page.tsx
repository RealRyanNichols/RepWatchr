import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import RaceHubAnalytics from "@/components/elections/RaceHubAnalytics";
import TexasRacePublicContributions from "@/components/elections/TexasRacePublicContributions";
import RaceMoneyTrailSection from "@/components/money/RaceMoneyTrailSection";
import CopySnippetButton from "@/components/shared/CopySnippetButton";
import RecordVisual from "@/components/shared/RecordVisual";
import ShareButtons from "@/components/shared/ShareButtons";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import { getOfficialById } from "@/lib/data";
import {
  getTexasElectionStaticSlugs,
  resolveTexasElectionSlug,
  type RaceHubCandidate,
  type RaceHubMissingRecord,
  type RaceHubRace,
  type RaceHubShareSnippet,
  type RaceHubSourceGroup,
  type RaceHubVoterQuestion,
  type TexasCountyHub,
  type TexasDistrictHub,
} from "@/lib/race-hub";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, datasetJsonLd, jsonLd } from "@/lib/structured-data";

export function generateStaticParams() {
  return getTexasElectionStaticSlugs().map((raceSlug) => ({ raceSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ raceSlug: string }>;
}): Promise<Metadata> {
  const { raceSlug } = await params;
  const resolution = resolveTexasElectionSlug(raceSlug);
  if (!resolution) return { title: "Race Not Found" };

  if (resolution.kind === "county") {
    return buildRepWatchrMetadata({
      title: `${resolution.county.county} County Election Hub | RepWatchr`,
      description: resolution.county.summary,
      path: resolution.county.href,
      imagePath: buildOgImageUrl("race", { slug: resolution.county.slug }),
      imageAlt: `${resolution.county.name} RepWatchr race hub`,
    });
  }

  if (resolution.kind === "district") {
    return buildRepWatchrMetadata({
      title: `${resolution.district.name} Election Hub | RepWatchr`,
      description: resolution.district.summary,
      path: resolution.district.href,
      imagePath: buildOgImageUrl("race", { slug: resolution.district.slug }),
      imageAlt: `${resolution.district.name} RepWatchr race hub`,
    });
  }

  return buildRepWatchrMetadata({
    title: `${resolution.race.shortTitle} | Texas Election Race Watch`,
    description: resolution.race.summary,
    path: resolution.race.href,
    imagePath: buildOgImageUrl("race", { slug: resolution.race.slug }),
    imageAlt: `${resolution.race.title} RepWatchr race watch`,
  });
}

function raceShareSnippet(race: RaceHubRace) {
  return race.shareSnippets[0]?.text || [
    `Before you vote, open the ${race.shortTitle} record.`,
    "",
    race.title,
    race.summary,
    "",
    `Open: https://www.repwatchr.com${race.href}`,
  ].join("\n");
}

function priorityTone(priority: RaceHubMissingRecord["priority"]) {
  if (priority === "high") return "border-red-200 bg-red-50 text-red-950";
  if (priority === "medium") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-blue-200 bg-blue-50 text-blue-950";
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-2xl font-black text-blue-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
    </div>
  );
}

function SectionShell({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CandidateCard({ candidate }: { candidate: RaceHubCandidate }) {
  const official = candidate.profileHref ? getOfficialById(candidate.id) : undefined;

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-[72px_1fr] gap-4">
        <div className="relative h-[72px] w-[72px] overflow-hidden rounded-lg border border-slate-200 bg-white">
          {official ? (
            <OfficialPhotoImage
              official={official}
              sizes="144px"
              quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
              className="object-cover"
              fallbackClassName="grid h-full w-full place-items-center text-sm font-black text-slate-700"
            />
          ) : (
            <div className="grid h-full place-items-center text-xl font-black text-slate-500">?</div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {candidate.incumbent ? (
              <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                Incumbent/current record
              </span>
            ) : null}
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700">
              Party {candidate.party}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-black leading-tight text-blue-950">{candidate.name}</h3>
          <p className="mt-1 text-sm font-bold capitalize text-slate-600">
            {candidate.status.replaceAll("_", " ")}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <StatTile label="Score" value={candidate.scoreLabel} />
        <StatTile label="Sources" value={candidate.sourceCount} />
        <StatTile label="Funding" value={candidate.fundingLoaded ? "Loaded" : "Needed"} />
        <StatTile label="Red flags" value={candidate.redFlagCount} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {candidate.profileHref ? (
          <Link href={candidate.profileHref} className="mini-button" data-race-candidate={candidate.name}>
            Open profile
          </Link>
        ) : null}
        {candidate.financeHref ? (
          <Link href={candidate.financeHref} className="mini-button" data-race-candidate={candidate.name}>
            Funding
          </Link>
        ) : null}
        {candidate.campaignHref ? (
          <a href={candidate.campaignHref} target="_blank" rel="noopener noreferrer" className="mini-button" data-race-candidate={candidate.name}>
            Campaign
          </a>
        ) : null}
      </div>
      <ul className="mt-4 space-y-1 text-sm font-semibold leading-6 text-slate-700">
        {candidate.notes.map((note) => (
          <li key={note}>- {note}</li>
        ))}
      </ul>
    </article>
  );
}

function CandidateComparison({ race }: { race: RaceHubRace }) {
  if (race.candidates.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
        Candidate comparison is waiting on a source-backed filing or ballot roster. Submit the official roster before adding candidate claims.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-100 text-xs font-black uppercase tracking-wide text-slate-500">
          <tr>
            <th className="p-3">Record</th>
            {race.candidates.map((candidate) => (
              <th key={candidate.id} className="p-3">{candidate.name}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {race.candidateComparisonRows.map((row) => (
            <tr key={row.label}>
              <td className="p-3 font-black text-blue-950">{row.label}</td>
              {race.candidates.map((candidate) => (
                <td key={`${row.label}-${candidate.id}`} className="p-3 font-semibold text-slate-700">
                  {row.candidates.find((item) => item.candidateId === candidate.id)?.value ?? "Needs source"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceGroups({ groups }: { groups: RaceHubSourceGroup[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map((group) => (
        <div key={group.kind} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-blue-950">{group.label}</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{group.description}</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
              {group.links.length}
            </span>
          </div>
          {group.links.length ? (
            <div className="mt-3 grid gap-2">
              {group.links.map((source) => (
                <a
                  key={`${source.kind}-${source.url}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-race-source={source.title}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black leading-6 text-blue-800 transition hover:border-red-300 hover:text-red-700"
                >
                  {source.title}
                  <span className="mt-1 block text-xs font-semibold text-slate-500">
                    {source.official ? "Official/source-linked" : "Reference/RepWatchr link"} - {source.note}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
              Not loaded yet. Submit a public source before this section is treated as complete.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function MissingRecords({ records }: { records: RaceHubMissingRecord[] }) {
  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
        No critical source gaps are flagged in the current static race model. Keep checking for updated filings, finance reports, and local notices.
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {records.map((record) => (
        <Link
          key={record.label}
          href={record.actionHref}
          data-race-submit-source={record.label}
          className={`rounded-lg border p-4 transition hover:-translate-y-0.5 hover:border-red-300 ${priorityTone(record.priority)}`}
        >
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide">
            {record.priority} priority
          </span>
          <h3 className="mt-3 text-lg font-black leading-tight">{record.label}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 opacity-85">{record.why}</p>
        </Link>
      ))}
    </div>
  );
}

function VoterQuestions({
  questions,
  raceSlug,
  raceTitle,
}: {
  questions: RaceHubVoterQuestion[];
  raceSlug: string;
  raceTitle: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {questions.map((item) => (
        <div key={item.question} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-wide text-red-700">{item.label}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-blue-950">{item.question}</p>
          <div className="mt-3">
            <CopySnippetButton
              text={item.question}
              label="Copy question"
              copiedLabel="Question copied"
              trackingEventName="race_public_question_copied"
              trackingMetadata={{ raceSlug, raceTitle, questionLabel: item.label }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ShareSnippets({ snippets }: { snippets: RaceHubShareSnippet[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {snippets.map((snippet) => (
        <div key={snippet.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-wide text-red-700">{snippet.label}</p>
          <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-slate-700">{snippet.text}</p>
          <div className="mt-3">
            <CopySnippetButton text={snippet.text} label="Copy snippet" copiedLabel="Snippet copied" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RacePackageInterestGrid({ raceSlug, raceTitle }: { raceSlug: string; raceTitle: string }) {
  const packages = [
    {
      label: "Local Race Source Pack",
      href: `/services/local-race-source-pack?race=${encodeURIComponent(raceSlug)}`,
      note: "One source-backed packet for candidate links, filings, finance, missing records, and public questions.",
    },
    {
      label: "Election Watch Desk",
      href: `/services/election-watch-desk?race=${encodeURIComponent(raceSlug)}`,
      note: "Recurring race monitoring for filings, source updates, story briefs, and share-ready questions.",
    },
    {
      label: "Official Record Brief",
      href: `/services/official-record-brief?race=${encodeURIComponent(raceSlug)}`,
      note: "A deeper public-record brief for one candidate or current officeholder in the race.",
    },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {packages.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          data-race-package={`${raceTitle}: ${item.label}`}
          className="rounded-lg border border-blue-200 bg-white p-4 text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
        >
          <p className="text-sm font-black uppercase tracking-wide text-blue-800">{item.label}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.note}</p>
        </Link>
      ))}
    </div>
  );
}

function RaceMiniCard({ race }: { race: RaceHubRace }) {
  return (
    <Link
      href={race.href}
      className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
    >
      <RecordVisual
        eyebrow="Race record"
        title={race.title}
        variant="race"
        metric={{ label: "Sources", value: race.sourceCount }}
        secondaryMetric={{ label: "Gaps", value: race.missingRecords.length }}
        compact
        className="mb-4"
      />
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-red-700 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          {race.shortTitle}
        </span>
        <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          {race.sourceCount} sources
        </span>
      </div>
      <h3 className="mt-3 text-lg font-black leading-tight text-blue-950 group-hover:text-red-700">
        {race.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">{race.summary}</p>
      <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-500">
        {race.electionDate} / {race.missingRecords.length} gaps
      </p>
    </Link>
  );
}

function RaceJsonLd({ race }: { race: RaceHubRace }) {
  const value = datasetJsonLd({
    name: race.title,
    path: race.href,
    description: race.summary,
    keywords: ["Texas elections", race.shortTitle, race.office, race.region, "public records", "campaign finance"],
    dateModified: "2026-06-21",
  });
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(value) }} />;
}

function RacePage({ race }: { race: RaceHubRace }) {
  const shareSnippet = raceShareSnippet(race);
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Elections", path: "/elections" },
    { name: "Texas", path: "/elections/texas" },
    { name: race.shortTitle, path: race.href },
  ]);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <RaceHubAnalytics
        raceSlug={race.slug}
        raceTitle={race.title}
        routeKind="race"
        sourceCount={race.sourceCount}
        candidateCount={race.candidates.length}
        missingRecordCount={race.missingRecords.length}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }} />
      <RaceJsonLd race={race} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/elections/texas" className="text-sm font-black text-blue-800 hover:text-red-700">
          &larr; Texas race hub
        </Link>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
          <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                  Race dossier
                </span>
                <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                  {race.region}
                </span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
                {race.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                {race.summary}
              </p>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                This page is a race hub, not a final finding. Candidate names, ballot status, finance totals, and local records should stay tied to official filings or named public sources.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ShareButtons
                  title={`${race.title} | RepWatchr`}
                  description={race.summary}
                  path={race.href}
                  template="public_question"
                  subject={race.title}
                  sourceLabel={race.sourceGroups.find((group) => group.links.length)?.label || "race source packet"}
                />
                <CopySnippetButton text={shareSnippet} label="Copy race post" copiedLabel="Race post copied" />
                <Link
                  href={`/compare/race/${race.slug}`}
                  data-race-compare="Open candidate comparison"
                  className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-800 transition hover:border-red-300 hover:text-red-700"
                >
                  Compare candidates
                </Link>
                <Link
                  href={`/dashboard/watchlists?entityType=race&entityId=${encodeURIComponent(race.slug)}`}
                  data-race-watch="Watch race"
                  className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-800 transition hover:border-red-300 hover:text-red-700"
                >
                  Watch race
                </Link>
              </div>
            </div>

            <div className="grid content-start gap-3">
              <RecordVisual
                eyebrow="Race dossier"
                title={race.title}
                variant="race"
                metric={{ label: "Sources", value: race.sourceCount }}
                secondaryMetric={{ label: "Candidates", value: race.candidates.length }}
              />
              <StatTile label="Office" value={race.office} />
              <StatTile label="Jurisdiction" value={race.jurisdiction} />
              <StatTile label="Election date" value={race.electionDate} />
              <StatTile label="Candidates loaded" value={race.candidates.length} />
              <StatTile label="Source links" value={race.sourceCount} />
              <StatTile label="Missing records" value={race.missingRecords.length} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Record summary</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
              What is confirmed, and what still needs source review.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">{race.whyItMatters}</p>
            <div className="mt-4 grid gap-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold leading-6 text-emerald-950">
                Confirmed in this hub: {race.officialSourceCount} official/source-linked record{race.officialSourceCount === 1 ? "" : "s"} and {race.sourceCount} total race source link{race.sourceCount === 1 ? "" : "s"}.
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
                Needs review: {race.missingRecords.length ? race.missingRecords.map((item) => item.label).slice(0, 3).join(", ") : "updated filings, finance reports, and campaign pages as they change."}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Record focus</p>
              <div className="mt-4 grid gap-2">
                {race.recordFocus.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Next build moves</p>
              <div className="mt-4 grid gap-2">
                {race.watchActions.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SectionShell eyebrow="Candidates" title="Candidate comparison">
          <div className="grid gap-4 lg:grid-cols-2">
            {race.candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
          <div className="mt-5">
            <CandidateComparison race={race} />
          </div>
        </SectionShell>

        <RaceMoneyTrailSection race={race} />

        <SectionShell eyebrow="Source trail" title="Official links, filings, finance, campaign pages, school-board records, and stories">
          <SourceGroups groups={race.sourceGroups} />
        </SectionShell>

        <SectionShell eyebrow="Missing records" title="What needs to be added before this page is complete">
          <MissingRecords records={race.missingRecords} />
        </SectionShell>

        <SectionShell eyebrow="Voter question builder" title="Questions voters, reporters, and meeting speakers can copy">
          <VoterQuestions questions={race.voterQuestions} raceSlug={race.slug} raceTitle={race.title} />
        </SectionShell>

        <SectionShell eyebrow="Share snippets" title="Short source-safe posts for this race">
          <ShareSnippets snippets={race.shareSnippets} />
        </SectionShell>

        {race.relatedStories.length ? (
          <SectionShell eyebrow="Stories" title="Related RepWatchr story packets">
            <div className="grid gap-3 md:grid-cols-2">
              {race.relatedStories.map((article) => (
                <Link key={article.id} href={`/news/${article.id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:border-red-300">
                  <p className="text-lg font-black leading-tight text-blue-950">{article.title}</p>
                  <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">{article.summary}</p>
                </Link>
              ))}
            </div>
          </SectionShell>
        ) : null}

        <section className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">Actions</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
            Add a better source or request the paid Race Source Pack.
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href={`/elections/texas/contribute?race=${encodeURIComponent(race.slug)}`}
              data-race-submit-source="Submit race source"
              className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-800 transition hover:border-red-300 hover:text-red-700"
            >
              Submit race source
            </Link>
            <Link href="/services/local-race-source-pack" data-race-package="Local Race Source Pack" className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-800 transition hover:border-red-300 hover:text-red-700">
              Request Race Source Pack
            </Link>
            <Link href="/funding" className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-800 transition hover:border-red-300 hover:text-red-700">
              Open funding trails
            </Link>
            <Link href="/officials?state=TX" className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-800 transition hover:border-red-300 hover:text-red-700">
              Texas officials
            </Link>
          </div>
          <div className="mt-4">
            <RacePackageInterestGrid raceSlug={race.slug} raceTitle={race.title} />
          </div>
        </section>

        <TexasRacePublicContributions raceSlug={race.slug} />
      </main>
    </div>
  );
}

function CountyPage({ county }: { county: TexasCountyHub }) {
  const snippet = [
    `${county.county} County voters should check the record before the race gets loud.`,
    "",
    county.summary,
    "",
    `Open: https://www.repwatchr.com${county.href}`,
  ].join("\n");
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Elections", path: "/elections" },
    { name: "Texas", path: "/elections/texas" },
    { name: county.county, path: county.href },
  ]);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <RaceHubAnalytics
        raceSlug={county.slug}
        raceTitle={county.name}
        routeKind="county"
        sourceCount={county.races.reduce((total, race) => total + race.sourceCount, 0)}
        candidateCount={county.races.reduce((total, race) => total + race.candidates.length, 0)}
        missingRecordCount={county.missingRecords.length}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/elections/texas" className="text-sm font-black text-blue-800 hover:text-red-700">
          &larr; Texas race hub
        </Link>
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.82fr] lg:items-start">
            <div>
              <p className="inline-flex rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                County election hub
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
                {county.name}
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                {county.summary}
              </p>
              <div className="mt-5">
                <ShareButtons
                  title={`${county.name} | RepWatchr`}
                  description={county.summary}
                  path={county.href}
                  template="public_question"
                  subject={`${county.county} County election records`}
                  sourceLabel="county election sources, candidate filings, finance reports, school-board records, and public questions"
                />
              </div>
            </div>
            <div className="grid gap-3">
              <RecordVisual
                eyebrow="County hub"
                title={county.name}
                variant="county"
                metric={{ label: "Races", value: county.races.length }}
                secondaryMetric={{ label: "Schools", value: county.schoolBoards.length }}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <StatTile label="Region" value={county.region} />
                <StatTile label="Cities" value={county.cities.length} />
              </div>
            </div>
          </div>
        </section>

        <SectionShell eyebrow="County races" title={`Race pages tied to ${county.county} County`}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {county.races.map((race) => (
              <RaceMiniCard key={race.slug} race={race} />
            ))}
          </div>
        </SectionShell>

        <SectionShell eyebrow="School boards" title="District election sources and local board records">
          {county.schoolBoards.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {county.schoolBoards.map((district) => (
                <Link key={district.districtSlug} href={district.href} className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:border-red-300">
                  <p className="text-lg font-black text-blue-950">{district.district}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{district.county} / {district.status.replaceAll("_", " ")}</p>
                  <p className="mt-2 text-xs font-black uppercase tracking-wide text-red-700">{district.sourceCount} district source link{district.sourceCount === 1 ? "" : "s"}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
              School-board race sources for this county still need to be attached.
            </p>
          )}
        </SectionShell>

        <SectionShell eyebrow="Missing county records" title="County records to pull next">
          <MissingRecords records={county.missingRecords} />
        </SectionShell>

        <SectionShell eyebrow="Voter question builder" title="County questions people can ask before meetings or debates">
          <VoterQuestions questions={county.voterQuestions} raceSlug={county.slug} raceTitle={county.name} />
        </SectionShell>

        <section className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">County source packet</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">Build or request a county Race Source Pack.</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-950/75">
            Use the public form for one record. Use the paid Race Source Pack when you need filings, source links, candidate pages, and voter questions organized in one packet.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/elections/texas/contribute?county=${encodeURIComponent(county.county)}`}
              data-race-submit-source="Submit county source"
              className="primary-button"
            >
              Submit county source
            </Link>
            <Link href="/services/local-race-source-pack" data-race-package="Local Race Source Pack" className="secondary-button">
              Request Race Source Pack
            </Link>
            <Link
              href={`/dashboard/watchlists?entityType=county&entityId=${encodeURIComponent(county.slug)}`}
              data-race-watch="Watch county hub"
              className="secondary-button"
            >
              Watch county
            </Link>
            <CopySnippetButton text={snippet} label="Copy county post" copiedLabel="County post copied" />
          </div>
        </section>
      </main>
    </div>
  );
}

function DistrictPage({ district }: { district: TexasDistrictHub }) {
  const snippet = [
    `Open the ${district.name} race record before repeating the claim.`,
    "",
    district.summary,
    "",
    `Open: https://www.repwatchr.com${district.href}`,
  ].join("\n");
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Elections", path: "/elections" },
    { name: "Texas", path: "/elections/texas" },
    { name: district.name, path: district.href },
  ]);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <RaceHubAnalytics
        raceSlug={district.slug}
        raceTitle={district.name}
        routeKind="district"
        sourceCount={district.races.reduce((total, race) => total + race.sourceCount, 0)}
        candidateCount={district.races.reduce((total, race) => total + race.candidates.length, 0)}
        missingRecordCount={district.missingRecords.length}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/elections/texas" className="text-sm font-black text-blue-800 hover:text-red-700">
          &larr; Texas race hub
        </Link>
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.82fr] lg:items-start">
            <div>
              <p className="inline-flex rounded-full bg-blue-950 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                District election hub
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
                {district.name}
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                {district.summary}
              </p>
              <div className="mt-5">
                <ShareButtons
                  title={`${district.name} | RepWatchr`}
                  description={district.summary}
                  path={district.href}
                  template="public_question"
                  subject={`${district.name} election records`}
                  sourceLabel="district map, filings, finance reports, voting records, and public questions"
                />
              </div>
            </div>
            <div className="grid gap-3">
              <RecordVisual
                eyebrow="District hub"
                title={district.name}
                variant="district"
                metric={{ label: "Races", value: district.races.length }}
                secondaryMetric={{ label: "Gaps", value: district.missingRecords.length }}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <StatTile label="District type" value={district.districtType.replaceAll("_", " ")} />
                <StatTile label="Region" value={district.region} />
              </div>
            </div>
          </div>
        </section>

        <SectionShell eyebrow="District races" title="Race pages in this district hub">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {district.races.map((race) => (
              <RaceMiniCard key={race.slug} race={race} />
            ))}
          </div>
        </SectionShell>

        <SectionShell eyebrow="Missing district records" title="Records needed before this district hub is complete">
          <MissingRecords records={district.missingRecords} />
        </SectionShell>

        <SectionShell eyebrow="Voter question builder" title="District questions voters can copy">
          <VoterQuestions questions={district.voterQuestions} raceSlug={district.slug} raceTitle={district.name} />
        </SectionShell>

        <section className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">District source packet</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">Add a source or request the paid Race Source Pack.</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/elections/texas/contribute?district=${encodeURIComponent(district.slug)}`}
              data-race-submit-source="Submit district source"
              className="primary-button"
            >
              Submit district source
            </Link>
            <Link href="/services/local-race-source-pack" data-race-package="Local Race Source Pack" className="secondary-button">
              Request Race Source Pack
            </Link>
            <Link
              href={`/dashboard/watchlists?entityType=district&entityId=${encodeURIComponent(district.slug)}`}
              data-race-watch="Watch district hub"
              className="secondary-button"
            >
              Watch district
            </Link>
            <CopySnippetButton text={snippet} label="Copy district post" copiedLabel="District post copied" />
          </div>
        </section>
      </main>
    </div>
  );
}

export default async function TexasElectionRacePage({
  params,
}: {
  params: Promise<{ raceSlug: string }>;
}) {
  const { raceSlug } = await params;
  const resolution = resolveTexasElectionSlug(raceSlug);
  if (!resolution) notFound();

  if (resolution.kind === "county") return <CountyPage county={resolution.county} />;
  if (resolution.kind === "district") return <DistrictPage district={resolution.district} />;
  return <RacePage race={resolution.race} />;
}
