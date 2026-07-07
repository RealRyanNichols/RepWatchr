import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RaceHubAnalytics from "@/components/elections/RaceHubAnalytics";
import CopySnippetButton from "@/components/shared/CopySnippetButton";
import RecordVisual from "@/components/shared/RecordVisual";
import ShareButtons from "@/components/shared/ShareButtons";
import { resolveTexasElectionSlug, type RaceHubRace } from "@/lib/race-hub";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, datasetJsonLd, jsonLd } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ raceSlug: string }>;
}): Promise<Metadata> {
  const { raceSlug } = await params;
  const resolution = resolveTexasElectionSlug(raceSlug);
  if (!resolution || resolution.kind !== "race") return { title: "Race Comparison Not Found" };

  return buildRepWatchrMetadata({
    title: `Compare Candidates: ${resolution.race.shortTitle} | RepWatchr`,
    description: `Source-backed candidate comparison for ${resolution.race.title}. Compare filings, profiles, funding links, public sources, and missing records without unsupported claims.`,
    path: `/compare/race/${resolution.race.slug}`,
    imagePath: buildOgImageUrl("race", { slug: resolution.race.slug, view: "compare" }),
    imageAlt: `${resolution.race.title} candidate comparison preview`,
  });
}

function comparisonShareSnippet(race: RaceHubRace) {
  return [
    `Compare the public-record trail for ${race.shortTitle}.`,
    "",
    `${race.title} has ${race.candidates.length} candidate record lane${race.candidates.length === 1 ? "" : "s"}, ${race.sourceCount} source link${race.sourceCount === 1 ? "" : "s"}, and ${race.missingRecords.length} source gap${race.missingRecords.length === 1 ? "" : "s"} loaded on RepWatchr.`,
    "",
    `Open: https://www.repwatchr.com/compare/race/${race.slug}`,
  ].join("\n");
}

function CandidateColumnCard({ candidate }: { candidate: RaceHubRace["candidates"][number] }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {candidate.incumbent ? (
          <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
            Incumbent/current record
          </span>
        ) : null}
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700">
          {candidate.party}
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-black leading-tight text-blue-950">{candidate.name}</h2>
      <p className="mt-1 text-sm font-bold capitalize text-slate-600">{candidate.status.replaceAll("_", " ")}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xl font-black text-blue-950">{candidate.sourceCount}</p>
          <p className="text-[11px] font-black uppercase tracking-wide text-red-700">Sources</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xl font-black text-blue-950">{candidate.scoreLabel}</p>
          <p className="text-[11px] font-black uppercase tracking-wide text-red-700">Profile score</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {candidate.profileHref ? (
          <Link href={candidate.profileHref} data-race-candidate={candidate.name} className="mini-button">
            Open profile
          </Link>
        ) : null}
        {candidate.financeHref ? (
          <Link href={candidate.financeHref} data-race-candidate={candidate.name} className="mini-button">
            Funding
          </Link>
        ) : null}
        {candidate.campaignHref ? (
          <a href={candidate.campaignHref} data-race-candidate={candidate.name} target="_blank" rel="noopener noreferrer" className="mini-button">
            Campaign site
          </a>
        ) : null}
      </div>
    </article>
  );
}

function ComparisonTable({ race }: { race: RaceHubRace }) {
  if (!race.candidates.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-6 text-amber-950">
        Candidate comparison is not published yet because this race needs a source-backed candidate roster.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-100 text-xs font-black uppercase tracking-wide text-slate-500">
          <tr>
            <th className="p-3">Record field</th>
            {race.candidates.map((candidate) => (
              <th key={candidate.id} className="p-3">{candidate.name}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {race.candidateComparisonRows.map((row) => (
            <tr key={row.label}>
              <td className="p-3 font-black text-blue-950">{row.label}</td>
              {race.candidates.map((candidate) => (
                <td key={`${row.label}-${candidate.id}`} className="p-3 font-semibold leading-6 text-slate-700">
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

function SourceGapList({ race }: { race: RaceHubRace }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {race.missingRecords.length ? (
        race.missingRecords.map((record) => (
          <Link
            key={record.label}
            href={record.actionHref}
            data-race-submit-source={record.label}
            className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 transition hover:-translate-y-0.5 hover:border-red-300"
          >
            <p className="text-[11px] font-black uppercase tracking-wide">{record.priority} priority</p>
            <h3 className="mt-2 text-lg font-black leading-tight">{record.label}</h3>
            <p className="mt-2 text-sm font-semibold leading-6">{record.why}</p>
          </Link>
        ))
      ) : (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
          No critical source gaps are flagged in the current race model. Keep checking filings and campaign finance as the cycle moves.
        </p>
      )}
    </div>
  );
}

export default async function RaceCandidateComparisonPage({
  params,
}: {
  params: Promise<{ raceSlug: string }>;
}) {
  const { raceSlug } = await params;
  const resolution = resolveTexasElectionSlug(raceSlug);
  if (!resolution || resolution.kind !== "race") notFound();

  const race = resolution.race;
  const shareSnippet = comparisonShareSnippet(race);
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Elections", path: "/elections" },
    { name: "Texas", path: "/elections/texas" },
    { name: race.shortTitle, path: race.href },
    { name: "Compare", path: `/compare/race/${race.slug}` },
  ]);
  const datasetStructuredData = datasetJsonLd({
    name: `${race.title} Candidate Comparison`,
    path: `/compare/race/${race.slug}`,
    description: `Source-backed comparison fields, source gaps, and public questions for ${race.title}.`,
    keywords: ["candidate comparison", "Texas elections", race.office, race.region, "public records"],
    dateModified: "2026-06-21",
  });

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <RaceHubAnalytics
        raceSlug={race.slug}
        raceTitle={race.title}
        routeKind="compare"
        sourceCount={race.sourceCount}
        candidateCount={race.candidates.length}
        missingRecordCount={race.missingRecords.length}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(datasetStructuredData) }} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href={race.href} className="text-sm font-black text-blue-800 hover:text-red-700">
          &larr; Back to race hub
        </Link>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex rounded-full bg-blue-950 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                Candidate comparison
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
                Compare {race.shortTitle} records before the race gets loud.
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                This comparison shows sourced profile lanes, campaign links, funding availability, source counts, and missing records. It does not score ideology or imply wrongdoing from incomplete data.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ShareButtons
                  title={`Compare ${race.title} candidates | RepWatchr`}
                  description={race.summary}
                  path={`/compare/race/${race.slug}`}
                  template="public_question"
                  subject={`${race.title} candidate comparison`}
                  sourceLabel="candidate filings, profile records, funding links, and public questions"
                />
                <CopySnippetButton text={shareSnippet} label="Copy compare post" copiedLabel="Compare post copied" />
                <Link
                  href={`/elections/texas/contribute?race=${encodeURIComponent(race.slug)}`}
                  data-race-submit-source="Submit comparison source"
                  className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-800 transition hover:border-red-300 hover:text-red-700"
                >
                  Submit source
                </Link>
                <Link
                  href={`/dashboard/watchlists?entityType=race&entityId=${encodeURIComponent(race.slug)}`}
                  data-race-watch="Watch race comparison"
                  className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-800 transition hover:border-red-300 hover:text-red-700"
                >
                  Watch race
                </Link>
              </div>
            </div>
            <RecordVisual
              eyebrow="Comparison record"
              title={race.title}
              variant="race"
              metric={{ label: "Candidates", value: race.candidates.length }}
              secondaryMetric={{ label: "Sources", value: race.sourceCount }}
            />
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {race.candidates.map((candidate) => (
            <CandidateColumnCard key={candidate.id} candidate={candidate} />
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Comparison table</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">Public-record fields loaded for each candidate</h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
            These are source-status fields, not endorsements. A blank or incomplete cell means RepWatchr needs a stronger public source.
          </p>
          <div className="mt-4">
            <ComparisonTable race={race} />
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Source gaps</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">What needs to be added before this comparison is complete</h2>
          <div className="mt-4">
            <SourceGapList race={race} />
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">Race package interest</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">Need this comparison cleaned up into a packet?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/services/local-race-source-pack?race=${encodeURIComponent(race.slug)}`}
              data-race-package="Local Race Source Pack"
              className="rounded-lg border border-blue-200 bg-white p-4 text-sm font-black text-blue-800 transition hover:border-red-300 hover:text-red-700"
            >
              Request Local Race Source Pack
              <span className="mt-2 block text-xs font-semibold normal-case leading-5 text-slate-600">
                Candidate links, source table, filing map, public questions, and missing-record list.
              </span>
            </Link>
            <Link
              href={`/services/election-watch-desk?race=${encodeURIComponent(race.slug)}`}
              data-race-package="Election Watch Desk"
              className="rounded-lg border border-blue-200 bg-white p-4 text-sm font-black text-blue-800 transition hover:border-red-300 hover:text-red-700"
            >
              Request Election Watch Desk
              <span className="mt-2 block text-xs font-semibold normal-case leading-5 text-slate-600">
                Ongoing race monitoring, source queue, snippets, and weekly updates.
              </span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
