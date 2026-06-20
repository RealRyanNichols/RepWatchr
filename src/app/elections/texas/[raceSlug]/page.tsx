import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopySnippetButton from "@/components/shared/CopySnippetButton";
import ShareButtons from "@/components/shared/ShareButtons";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import {
  TEXAS_ELECTION_RACES,
  getTexasElectionRace,
  type TexasElectionRace,
} from "@/data/texas-election-races";
import { getFundingSummary, getOfficialById, getRedFlags, getScoreCard } from "@/lib/data";

export function generateStaticParams() {
  return TEXAS_ELECTION_RACES.map((race) => ({ raceSlug: race.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ raceSlug: string }>;
}): Promise<Metadata> {
  const { raceSlug } = await params;
  const race = getTexasElectionRace(raceSlug);
  if (!race) return { title: "Race Not Found" };
  const canonicalUrl = `https://www.repwatchr.com/elections/texas/${race.slug}`;
  const ogImage = `/api/og/race?slug=${encodeURIComponent(race.slug)}`;

  return {
    title: `${race.shortTitle} | Texas Election Race Watch`,
    description: race.summary,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${race.title} | RepWatchr`,
      description: race.summary,
      url: canonicalUrl,
      siteName: "RepWatchr",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${race.title} RepWatchr race watch`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${race.title} | RepWatchr`,
      description: race.summary,
      images: [ogImage],
    },
  };
}

function shareSnippetForRace(race: TexasElectionRace) {
  return [
    `Before you vote, open the ${race.shortTitle} record.`,
    "",
    `${race.title}`,
    race.summary,
    "",
    `Watch: ${race.recordFocus.slice(0, 4).join(", ")}`,
    "",
    `Open the race page: https://www.repwatchr.com/elections/texas/${race.slug}`,
  ].join("\n");
}

function OfficialRaceCard({ officialId }: { officialId: string }) {
  const official = getOfficialById(officialId);
  if (!official) return null;

  const scoreCard = getScoreCard(official.id);
  const funding = getFundingSummary(official.id);
  const redFlags = getRedFlags(official.id);

  return (
    <Link
      href={`/officials/${official.id}`}
      className="group grid grid-cols-[72px_1fr] gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
    >
      <div className="relative h-[72px] w-[72px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <OfficialPhotoImage
          official={official}
          sizes="144px"
          quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
          className="object-cover transition duration-300 group-hover:scale-105"
          fallbackClassName="grid h-full w-full place-items-center text-sm font-black text-slate-700"
        />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-base font-black text-blue-950 group-hover:text-red-700">
          {official.name}
        </h3>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {official.position} / {official.district ?? official.jurisdiction}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-900">
            {scoreCard ? `${scoreCard.overall} score` : "Open score"}
          </span>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase text-red-700">
            {redFlags.length} flag{redFlags.length === 1 ? "" : "s"}
          </span>
          {funding ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">
              Funding loaded
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default async function TexasElectionRacePage({
  params,
}: {
  params: Promise<{ raceSlug: string }>;
}) {
  const { raceSlug } = await params;
  const race = getTexasElectionRace(raceSlug);
  if (!race) notFound();

  const shareSnippet = shareSnippetForRace(race);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/elections/texas" className="text-sm font-black text-blue-800 hover:text-red-700">
          &larr; Texas race hub
        </Link>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
          <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                  {race.shortTitle}
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
              <div className="mt-6 flex flex-wrap gap-3">
                <ShareButtons
                  title={`${race.title} | RepWatchr`}
                  description={race.summary}
                  path={`/elections/texas/${race.slug}`}
                />
                <CopySnippetButton text={shareSnippet} label="Copy race post" copiedLabel="Race post copied" />
              </div>
            </div>

            <div className="grid content-start gap-3">
              {[
                ["Office", race.office],
                ["Stage", race.stage],
                ["Election", race.electionDate],
                ["Geography", race.geography],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
                  <p className="mt-1 text-sm font-black leading-6 text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Why it matters</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
              The record voters need before this race gets loud.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">{race.whyItMatters}</p>
            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-blue-900">Copy-ready post</p>
              <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-blue-950">{shareSnippet}</p>
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

        {race.officialIds.length ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">RepWatchr records</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
                Current public officials tied to this race lane
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {race.officialIds.map((officialId) => (
                <OfficialRaceCard key={officialId} officialId={officialId} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Source packet</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-amber-950">
                Keep this page source-first.
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-900">
                Candidate lists, ballot status, money, claims, and debate clips can change. Use these
                public sources as the starting trail and submit missing records before amplification.
              </p>
            </div>
            <Link
              href="/submit-source"
              className="shrink-0 rounded-xl bg-amber-900 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-red-700"
            >
              Submit source
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {race.sourceLinks.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm font-black leading-6 text-blue-800 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
              >
                {source.title}
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
