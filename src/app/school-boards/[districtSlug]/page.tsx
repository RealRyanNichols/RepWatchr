import type { Metadata } from "next";
import Link from "next/link";
import {
  getCandidateFlags,
  getCandidateGaps,
  getCandidateGoodRecords,
  getDistrictInvestigationQueue,
  getDistrictSourceLinks,
  getSchoolBoardDistrict,
  getSchoolBoardDistricts,
  type SchoolBoardFeedItem,
} from "@/lib/school-board-research";

type DashboardMetric = {
  label: string;
  value: string;
  caption: string;
  percent: number;
  tone: "blue" | "good" | "watch" | "bad";
};

type DashboardFact = {
  label: string;
  value: string;
  href?: string;
};

export function generateStaticParams() {
  return getSchoolBoardDistricts().map((district) => ({
    districtSlug: district.district_slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ districtSlug: string }>;
}): Promise<Metadata> {
  const { districtSlug } = await params;
  const district = getSchoolBoardDistrict(districtSlug);
  if (!district) return { title: "District Not Found" };

  return {
    title: `${district.district} School Board`,
    description: `${district.district} candidate dossiers, trustee records, source links, red flags, good records, and research gaps.`,
  };
}

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ districtSlug: string }>;
}) {
  const { districtSlug } = await params;
  const district = getSchoolBoardDistrict(districtSlug);

  if (!district) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-gray-950">District not found</h1>
        <Link href="/school-boards" className="mt-4 inline-flex text-sm font-bold text-blue-600">
          Back to school boards
        </Link>
      </div>
    );
  }

  const ballotCandidates = district.candidates.filter(
    (candidate) => candidate.on_2026_ballot || candidate.election_date?.includes("2026")
  );
  const feed = district.feed ?? [];
  const praiseItems = feed.filter((item) => item.type === "praise");
  const concernItems = feed.filter((item) => item.type === "concern" || item.type === "breaking");
  const watchItems = feed.filter((item) => item.type === "social_watch" || item.type === "public_comment" || item.type === "records_request");
  const sourceLinks = district.sourceLinks?.length ? district.sourceLinks : getDistrictSourceLinks(district.district_slug);
  const investigationQueue = district.investigationQueue?.length ? district.investigationQueue : getDistrictInvestigationQueue(district.district_slug);
  const quickFacts = buildQuickFacts(district, sourceLinks);
  const issueCounts = district.candidates.reduce(
    (totals, candidate) => {
      totals.good += getCandidateGoodRecords(candidate).length;
      totals.flags += getCandidateFlags(candidate).length;
      totals.gaps += getCandidateGaps(candidate).length;
      return totals;
    },
    { good: 0, flags: 0, gaps: 0 }
  );
  const dashboardMetrics = buildDashboardMetrics({
    boardFiles: district.candidates.length,
    ballotFiles: ballotCandidates.length,
    praiseItems: issueCounts.good + praiseItems.length,
    watchItems: watchItems.length + issueCounts.gaps,
    redFlags: issueCounts.flags,
    sourceCount: sourceLinks.length,
    feedCount: feed.length,
  });
  const intelligenceNotes = buildIntelligenceNotes(district.district, sourceLinks.length, feed.length);

  return (
    <div className="bg-[#fbfcff] text-gray-950">
      <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_42%,#fff7ed_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <Link href="/school-boards" className="inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-950 shadow-sm transition hover:border-red-300 hover:text-red-700">
              &larr; School board watch
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-700">{district.county} County</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-800">East Texas school board</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800">God. Family. Country.</span>
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-gray-950 sm:text-6xl">
              {district.district}
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-blue-950/80">
              A Texas-first public profile for {district.district}: board members, district facts, record sources, parent-watch lanes, positive records, concern lanes, and the next records that need to be pulled.
            </p>
            <div className="mt-5 grid max-w-2xl gap-2 sm:grid-cols-3">
              {["Truth over rumor", "Parents at the table", "Records before claims"].map((value) => (
                <div key={value} className="border-l-4 border-red-600 bg-white/80 px-3 py-2 text-sm font-black text-blue-950 shadow-sm">
                  {value}
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {sourceLinks.slice(0, 2).map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-blue-900 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-red-700">
                  Open source: {source.title?.replace(/Harleton ISD |Marshall ISD |Longview ISD /g, "") ?? "Record"}
                </a>
              ))}
              <a href="#district-feed" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-800 shadow-sm transition hover:border-amber-400 hover:text-amber-800">
                View feed
              </a>
              <a href="#profiles" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-800 shadow-sm transition hover:border-blue-400 hover:text-blue-800">
                Board profiles
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-100/70">
            <div className="grid h-2 grid-cols-3">
              <div className="bg-red-700" />
              <div className="bg-white" />
              <div className="bg-blue-900" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-red-700">Live profile dashboard</p>
                  <h2 className="mt-1 text-2xl font-black text-blue-950">What is loaded</h2>
                </div>
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-900 text-2xl font-black text-white shadow-md shadow-blue-900/20">
                  {district.district.split(" ").map((word) => word[0]).join("").slice(0, 3)}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <ProfileStat label="Board files" value={district.candidates.length} tone="neutral" />
                <ProfileStat label="Praise items" value={issueCounts.good + praiseItems.length} tone="good" />
                <ProfileStat label="Watch items" value={watchItems.length + issueCounts.gaps} tone="watch" />
                <ProfileStat label="Red flags" value={issueCounts.flags} tone="bad" />
              </div>
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-black text-blue-950">Profile status</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-blue-950/75">
                  {district.candidates.length} trustee/candidate files, {ballotCandidates.length} tied to 2026 elections, {sourceLinks.length} source links loaded, and {feed.length} district feed items.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-3 lg:px-8">
          <DistrictPanel
            title="Positive file"
            tone="good"
            body={praiseItems[0]?.summary ?? "No district-level praise item has been loaded yet. Positive student, staff, safety, transparency, and community records belong here when sourced."}
          />
          <DistrictPanel
            title="Watch file"
            tone="watch"
            body={watchItems[0]?.summary ?? "Public comments, board videos, parent concerns, and social posts are being tracked only when they are public, relevant, and sourceable."}
          />
          <DistrictPanel
            title="Concern file"
            tone="bad"
            body={concernItems[0]?.summary ?? "No district-level negative item has been verified yet. Allegations stay in the research queue until backed by public records."}
          />
        </div>
      </section>

      <section className="border-b border-blue-100 bg-[#f2f7ff]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-700">District quick facts</p>
            <h2 className="mt-2 text-3xl font-black text-gray-950">The public profile at a glance</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-gray-600">
              These facts are sourced first, then connected to board votes, parent concerns, and positive district records as the file grows.
            </p>
            <div className="mt-5 space-y-3">
              {intelligenceNotes.map((note) => (
                <div key={note} className="rounded-xl border border-blue-200 bg-white p-4 text-sm font-bold leading-6 text-blue-950 shadow-sm">
                  {note}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickFacts.slice(0, 12).map((fact) => (
              <QuickFactCard key={`${fact.label}-${fact.value}`} label={fact.label} value={fact.value} href={fact.href} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-red-700">Stats board</p>
              <h2 className="text-3xl font-black text-gray-950">Numbers with context</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-gray-600">
              The bars are visual context, not grades. Verified red flags stay at zero until records prove a concern.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardMetrics.map((metric) => (
              <MetricCard key={`${metric.label}-${metric.value}`} metric={metric} />
            ))}
          </div>
        </div>
      </section>

      <section id="profiles" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-red-700">Profiles</p>
            <h2 className="text-3xl font-black text-gray-950">Who voters should know</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            Each file is a public-record snapshot. Complete means source review is done.
            Initial dossier means the record is useful but still being checked.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {district.candidates.map((candidate) => {
            const flags = getCandidateFlags(candidate);
            const good = getCandidateGoodRecords(candidate);
            const gaps = getCandidateGaps(candidate);

            return (
              <Link
                key={candidate.candidate_id}
                href={`/school-boards/${district.district_slug}/${candidate.candidate_id}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-xl"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {candidate.seat ?? "Seat pending"}
                  </span>
                  {candidate.on_2026_ballot || candidate.election_date?.includes("2026") ? (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                      2026 ballot
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-xl font-black text-gray-950">{candidate.preferred_name ?? candidate.full_name}</h3>
                <p className="mt-1 text-sm font-semibold text-gray-500">
                  {candidate.role ?? (candidate.incumbent ? "Trustee" : "Candidate")}
                </p>
                <p className="mt-3 max-h-[4.5rem] overflow-hidden text-sm font-semibold leading-6 text-gray-700">
                  {candidate.summary ?? "Profile shell loaded. Board votes, campaign filings, and public comments still need review."}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black">
                  <span className="rounded-lg bg-emerald-50 px-2 py-2 text-emerald-700">{good.length} good</span>
                  <span className="rounded-lg bg-red-50 px-2 py-2 text-red-700">{flags.length} flags</span>
                  <span className="rounded-lg bg-amber-50 px-2 py-2 text-amber-800">{gaps.length} gaps</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="district-feed" className="bg-[#fff8ed]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-7 grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-gray-200 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
              <p className="text-sm font-black uppercase tracking-wide text-red-700">District feed</p>
              <h2 className="text-3xl font-black text-gray-950">Breaking, praise, concerns, and social watch</h2>
            </div>
            <p className="text-sm font-semibold leading-7 text-gray-700">
              This feed is built like a social profile for school governance. Public claims stay labeled until records support them.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <FeedColumn title="Breaking / Alerts" tone="bad" items={feed.filter((item) => item.type === "breaking" || item.type === "concern")} />
            <FeedColumn title="Praise Reports" tone="good" items={praiseItems} />
            <FeedColumn title="Social + Parent Watch" tone="watch" items={watchItems} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-red-700">Investigation queue</p>
          <h2 className="mt-2 text-3xl font-black text-gray-950">What gets checked next</h2>
          <div className="mt-6 grid gap-3">
            {investigationQueue.map((item) => (
              <div key={item} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-red-700">Source stack</p>
          <h2 className="mt-2 text-3xl font-black text-gray-950">Records loaded</h2>
          <div className="mt-6 space-y-3">
            {sourceLinks.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-black text-blue-700 transition hover:bg-blue-50"
              >
                {source.title ?? source.url}
                <span className="mt-1 block text-xs font-bold text-gray-500">
                  {source.source_type ?? "source"} {source.accessed_date ? `- accessed ${source.accessed_date}` : ""}
                </span>
              </a>
            ))}
            {sourceLinks.length === 0 ? (
              <p className="text-sm leading-6 text-gray-600">No district source links have been loaded yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileStat({ label, value, tone }: { label: string; value: number; tone: "neutral" | "good" | "watch" | "bad" }) {
  const toneClass = {
    neutral: "border-blue-200 bg-blue-50 text-blue-950",
    good: "border-emerald-200 bg-emerald-50 text-emerald-950",
    watch: "border-amber-200 bg-amber-50 text-amber-950",
    bad: "border-red-200 bg-red-50 text-red-950",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

function QuickFactCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-black leading-6 text-gray-950">{value}</p>
      {href ? <p className="mt-2 text-xs font-black text-blue-700">Open source &rarr;</p> : null}
    </div>
  );

  if (!href) return content;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const toneClass = {
    blue: "bg-blue-600",
    good: "bg-emerald-600",
    watch: "bg-amber-500",
    bad: "bg-red-600",
  }[metric.tone];
  const width = `${Math.max(4, Math.min(100, metric.percent ?? 0))}%`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-gray-600">{metric.label}</p>
          <p className="mt-1 text-3xl font-black text-gray-950">{metric.value}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-600 shadow-sm">{metric.caption}</span>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width }} />
      </div>
    </div>
  );
}

function buildQuickFacts(
  district: NonNullable<ReturnType<typeof getSchoolBoardDistrict>>,
  sourceLinks: ReturnType<typeof getDistrictSourceLinks>
): DashboardFact[] {
  const overviewFacts = district.overview?.quickFacts.map((fact) => ({ label: fact.label, value: fact.value })) ?? [];
  const hasLabel = (label: string) => overviewFacts.some((fact) => fact.label.toLowerCase() === label.toLowerCase());
  const fallbackFacts: DashboardFact[] = [
    { label: "Name", value: district.district },
    { label: "County", value: district.county },
    { label: "Board files loaded", value: String(district.candidates.length) },
    { label: "Board size", value: district.candidates.length ? `${district.candidates.length} trustees/candidates loaded` : "Needs roster confirmation" },
    { label: "Primary source", value: sourceLinks[0]?.title ?? "Official source pending", href: sourceLinks[0]?.url },
    { label: "Record status", value: district.queueStatus === "needs_full_records_pull" ? "Needs full records pull" : "Dossier build in progress" },
  ];

  return [
    ...overviewFacts,
    ...fallbackFacts.filter((fact) => !hasLabel(fact.label)),
  ];
}

function buildDashboardMetrics({
  boardFiles,
  ballotFiles,
  praiseItems,
  watchItems,
  redFlags,
  sourceCount,
  feedCount,
}: {
  boardFiles: number;
  ballotFiles: number;
  praiseItems: number;
  watchItems: number;
  redFlags: number;
  sourceCount: number;
  feedCount: number;
}): DashboardMetric[] {
  return [
    { label: "Board files", value: String(boardFiles), caption: "Profiles generated", percent: Math.min(100, boardFiles * 14), tone: "blue" },
    { label: "2026 ballot", value: String(ballotFiles), caption: "Election watch", percent: Math.min(100, ballotFiles * 34), tone: "watch" },
    { label: "Praise", value: String(praiseItems), caption: "Positive records", percent: Math.min(100, praiseItems * 12), tone: "good" },
    { label: "Watch work", value: String(watchItems), caption: "Open questions", percent: Math.min(100, watchItems * 2), tone: "watch" },
    { label: "Red flags", value: String(redFlags), caption: "Verified concerns", percent: Math.min(100, redFlags * 25), tone: "bad" },
    { label: "Sources", value: String(sourceCount + feedCount), caption: "Links + feed items", percent: Math.min(100, (sourceCount + feedCount) * 18), tone: "blue" },
  ];
}

function buildIntelligenceNotes(districtName: string, sourceCount: number, feedCount: number): string[] {
  return [
    `${districtName} has ${sourceCount} source link${sourceCount === 1 ? "" : "s"} and ${feedCount} district feed item${feedCount === 1 ? "" : "s"} loaded into this profile.`,
    "The page separates praise, watch items, and verified concerns so the record can reward good conduct and expose bad conduct without mixing facts with claims.",
    "Next records pass: agendas, minutes, videos, public comments, campaign filings, conflicts disclosures, and any positive student or staff achievements.",
  ];
}

function DistrictPanel({ title, body, tone }: { title: string; body: string; tone: "good" | "watch" | "bad" }) {
  const toneClass = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-950",
    watch: "border-amber-200 bg-amber-50 text-amber-950",
    bad: "border-red-200 bg-red-50 text-red-950",
  }[tone];

  return (
    <div className={`rounded-xl border p-5 ${toneClass}`}>
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6">{body}</p>
    </div>
  );
}

function FeedColumn({ title, items, tone }: { title: string; items: SchoolBoardFeedItem[]; tone: "good" | "watch" | "bad" }) {
  const toneClass = {
    good: "border-emerald-200 bg-emerald-50",
    watch: "border-amber-200 bg-amber-50",
    bad: "border-red-200 bg-red-50",
  }[tone];

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <h3 className="text-xl font-black text-gray-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-xl bg-white/80 p-4 text-sm font-semibold leading-6 text-gray-700">
            Nothing verified in this lane yet.
          </p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
                  {item.status.replaceAll("_", " ")}
                </span>
                {item.event_date ? (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">{item.event_date}</span>
                ) : null}
              </div>
              <h4 className="mt-3 text-base font-black text-gray-950">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-gray-700">{item.summary}</p>
              {item.source_url ? (
                <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-black text-blue-700">
                  Source &rarr;
                </a>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
