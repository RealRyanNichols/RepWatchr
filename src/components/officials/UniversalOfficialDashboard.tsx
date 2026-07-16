import Link from "next/link";
import CommentSection from "@/components/comments/CommentSection";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";
import ShareButtons from "@/components/shared/ShareButtons";
import { formatCurrency, formatLevelName } from "@/lib/formatting";
import type { PublicProfileOverlay } from "@/lib/profile-overlays";
import type {
  FundingSummary,
  NewsArticle,
  Official,
  PublicVoteRecord,
  RedFlag,
} from "@/types";

type UniversalOfficialDashboardProps = {
  official: Official;
  voteRecord?: PublicVoteRecord;
  funding?: FundingSummary;
  relatedNews: NewsArticle[];
  redFlags: RedFlag[];
  overlay: PublicProfileOverlay;
  sourceCount: number;
  buildoutPercent: number;
  buildoutComplete: boolean;
  missingItems: readonly string[];
};

type DashboardSource = {
  title: string;
  url: string;
  kind: string;
};

type CoverageItem = {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  date?: string | null;
  kind: "article" | "review item";
};

const socialLabels: Record<string, string> = {
  x: "X",
  twitter: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
};

const criticalOverlayCategories = new Set(["controversy", "lawsuit", "ethics", "scandal"]);

export default function UniversalOfficialDashboard({
  official,
  voteRecord,
  funding,
  relatedNews,
  redFlags,
  overlay,
  sourceCount,
  buildoutPercent,
  buildoutComplete,
  missingItems,
}: UniversalOfficialDashboardProps) {
  const socialLinks = buildSocialLinks(official, overlay);
  const sources = buildSources({ official, voteRecord, funding, relatedNews, redFlags, overlay });
  const coverage = buildCoverage(official.id, relatedNews, redFlags, overlay);
  const refreshedAt = voteRecord?.lastUpdated ?? overlay.completion?.lastCheckedAt ?? official.lastVerifiedAt;
  const voteTotal = voteRecord?.summary.totalVotesLoaded ?? 0;

  return (
    <main className="min-h-screen bg-[#f4f1e8] text-[#15212b]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid border-b border-[#c9c2b4] sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[#c9c2b4]">
          <LedgerFact label="Office" value={formatLevelName(official.level)} detail={official.jurisdiction} />
          <LedgerFact
            label="Current term"
            value={`${formatDashboardDate(official.termStart)} – ${formatDashboardDate(official.termEnd)}`}
            detail={official.district || official.state || "District source pending"}
          />
          <LedgerFact
            label="Votes indexed"
            value={voteRecord ? voteTotal.toLocaleString() : "Pending"}
            detail={voteRecord ? `Official roll calls through ${formatDashboardDate(voteRecord.lastUpdated)}` : "No roll-call snapshot loaded"}
          />
          <LedgerFact
            label="Public receipts"
            value={sourceCount.toLocaleString()}
            detail={`Profile reviewed ${formatDashboardDate(refreshedAt)}`}
          />
        </dl>

        <section id="record" className="scroll-mt-28 border-b border-[#c9c2b4] py-12 sm:py-16 lg:scroll-mt-52">
          <SectionHeading
            number="01"
            title="What the voting record shows"
            description="This chart counts recorded vote positions. It does not decide whether a yea or nay was good, bad, conservative, or liberal."
          />
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(28rem,1.18fr)] lg:gap-14">
            <VoteActivityChart record={voteRecord} />
            <LatestVoteRows record={voteRecord} />
          </div>
        </section>

        <section id="sentiment" className="scroll-mt-28 border-b border-[#c9c2b4] py-12 sm:py-16 lg:scroll-mt-52">
          <div className="grid gap-8 lg:grid-cols-[minmax(15rem,0.6fr)_minmax(0,1.4fr)] lg:gap-14">
            <SectionHeading
              number="02"
              title="What verified people think"
              description="Community sentiment is opinion, not the performance grade. Sample size and voter geography stay visible so a small or outside group cannot masquerade as the district."
            />
            <div className="border-l-4 border-[#204f77] bg-white p-5 sm:p-7 [&>div]:!rounded-none [&>div]:!border-0 [&>div]:!bg-transparent [&>div]:!p-0 [&>div]:!shadow-none">
              <ProfileScorecardVote
                targetType="official"
                targetId={official.id}
                targetName={official.name}
                targetPath={`/officials/${official.id}`}
                officialState={official.state}
                officialDistrict={official.district}
                officialCounties={official.county}
                compact
              />
            </div>
          </div>
        </section>

        <section id="coverage" className="scroll-mt-28 border-b border-[#c9c2b4] py-12 sm:py-16 lg:scroll-mt-52">
          <SectionHeading
            number="03"
            title="Coverage, separated by what it actually says"
            description="Positive and critical labels require an explicit person-level editorial classification. Party, office, headline mood, and social popularity are never used as shortcuts."
          />

          <div className="mt-8 grid border-y border-[#c9c2b4] lg:grid-cols-2 lg:divide-x lg:divide-[#c9c2b4]">
            <CoverageColumn
              title="Positive coverage"
              emptyText="No approved article has been classified as positive coverage for this person yet. That is an unfilled file, not proof there is no good news."
              items={coverage.positive}
              accent="positive"
            />
            <CoverageColumn
              title="Critical coverage and records"
              emptyText="No approved critical item is loaded. That is not a clean-record finding; it means this file still needs reviewed sources."
              items={coverage.critical}
              accent="critical"
            />
          </div>

          <div className="mt-10">
            <div className="flex flex-col gap-2 border-b border-[#c9c2b4] pb-3 sm:flex-row sm:items-end sm:justify-between">
              <h3 className="font-serif text-2xl font-bold text-[#101820]">Related reporting without a positive or critical label</h3>
              <span className="text-sm text-[#6f6a60]">{coverage.neutral.length} reviewed article{coverage.neutral.length === 1 ? "" : "s"}</span>
            </div>
            {coverage.neutral.length > 0 ? (
              <div>
                {coverage.neutral.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.id}`}
                    className="group grid gap-2 border-b border-[#d7d0c4] py-5 transition hover:bg-white/70 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-start sm:px-3"
                  >
                    <span className="text-sm text-[#6f6a60]">{formatDashboardDate(item.publishedAt)}</span>
                    <span>
                      <strong className="block text-base text-[#182630] group-hover:text-[#a23a2b]">{item.title}</strong>
                      <span className="mt-1 line-clamp-2 block text-sm leading-6 text-[#5e625f]">{item.summary}</span>
                    </span>
                    <span className="text-sm font-bold text-[#204f77]">Read →</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="border-b border-[#d7d0c4] py-6 text-sm font-semibold leading-6 text-[#6f6a60]">
                No source-linked, editorially approved related reporting is loaded yet.
              </p>
            )}
          </div>
        </section>

        <section id="sources" className="scroll-mt-28 border-b border-[#c9c2b4] py-12 sm:py-16 lg:scroll-mt-52">
          <SectionHeading
            number="04"
            title="Official links, public receipts, and the missing record"
            description="A complete-looking profile can still have evidence gaps. RepWatchr shows both the usable links and the work that remains."
          />
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-[#c9c2b4] py-4 text-sm font-semibold">
            <span className="text-[#6f6a60]">Official channels</span>
            {official.contactInfo.website ? (
              <a
                href={normalizeExternalUrl(official.contactInfo.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#204f77] underline decoration-[#204f77]/35 underline-offset-4 hover:text-[#a23a2b]"
              >
                Website ↗
              </a>
            ) : (
              <span className="text-[#7c766b]">Website not loaded</span>
            )}
            {socialLinks.map((link) => (
              <a
                key={`${link.label}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#204f77] underline decoration-[#204f77]/35 underline-offset-4 hover:text-[#a23a2b]"
              >
                {link.label} ↗
              </a>
            ))}
            {socialLinks.length === 0 ? <span className="text-[#7c766b]">Social accounts not loaded</span> : null}
          </div>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:gap-14">
            <div>
              <div className="flex items-end justify-between border-b-2 border-[#15212b] pb-3">
                <h3 className="font-serif text-2xl font-bold">Source desk</h3>
                <span className="text-sm text-[#6f6a60]">Showing {Math.min(8, sources.length)} of {sourceCount}</span>
              </div>
              {sources.length > 0 ? (
                <ol>
                  {sources.slice(0, 8).map((source, index) => (
                    <li key={`${source.url}-${index}`} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-[#d7d0c4] py-4">
                      <span className="text-sm tabular-nums text-[#898277]">{String(index + 1).padStart(2, "0")}</span>
                      <span>
                        <span className="block text-xs font-semibold text-[#6f6a60]">{source.kind}</span>
                        <span className="mt-1 block text-sm font-bold text-[#182630]">{source.title}</span>
                      </span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-[#204f77] underline underline-offset-4 hover:text-[#a23a2b]"
                      >
                        Open ↗
                      </a>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="border-b border-[#d7d0c4] py-5 text-sm font-semibold text-[#6f6a60]">No public receipt has been loaded yet.</p>
              )}
            </div>

            <aside className="border-t-4 border-[#bd8a2f] bg-[#eee7d7] p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-serif text-2xl font-bold">Evidence still needed</h3>
                <span className="text-2xl font-black tabular-nums">{Math.max(0, Math.min(100, buildoutPercent))}%</span>
              </div>
              <div className="mt-4 h-2 bg-[#d3c8b1]" aria-label={`Profile completion ${buildoutPercent}%`}>
                <div className="h-full bg-[#204f77]" style={{ width: `${Math.max(0, Math.min(100, buildoutPercent))}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#5d5951]">
                {buildoutComplete
                  ? "The core profile fields are loaded. Readers can still challenge a source or submit a newer record."
                  : "Completion measures loaded profile fields, not whether the official performed well."}
              </p>
              {!buildoutComplete && missingItems.length > 0 ? (
                <ul className="mt-5 border-t border-[#c9bfa9]">
                  {missingItems.slice(0, 7).map((item) => (
                    <li key={item} className="border-b border-[#c9bfa9] py-3 text-sm font-semibold text-[#403e39]">
                      {humanizeMissingItem(item)}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link
                href={`/submit-source?target=${encodeURIComponent(official.id)}`}
                className="mt-6 inline-flex min-h-11 items-center border border-[#15212b] bg-[#15212b] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#a23a2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a23a2b]"
              >
                Submit a public source
              </Link>
            </aside>
          </div>

          {funding ? (
            <div className="mt-10 grid border-y border-[#c9c2b4] sm:grid-cols-3 sm:divide-x sm:divide-[#c9c2b4]">
              <LedgerFact label={`Campaign money · ${funding.cycle}`} value={formatCurrency(funding.totalRaised)} detail="Total raised in loaded snapshot" />
              <LedgerFact label="Spent" value={formatCurrency(funding.totalSpent)} detail={`Updated ${formatDashboardDate(funding.lastUpdated)}`} />
              <LedgerFact label="Cash on hand" value={formatCurrency(funding.cashOnHand)} detail="See source filings before drawing conclusions" />
            </div>
          ) : null}
        </section>

        <section id="discussion" className="scroll-mt-28 py-12 sm:py-16 lg:scroll-mt-52">
          <SectionHeading
            number="05"
            title="Ask, answer, correct, and add a source"
            description="Comments are the public conversation. They do not change the evidence grade unless a claim is reviewed against a public record."
          />
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(28rem,1.3fr)]">
            <ShareButtons
              title={`${official.name} public record`}
              description={
                buildoutComplete
                  ? "Source-linked official profile"
                  : "Public profile with clearly labeled evidence gaps"
              }
              path={`/officials/${official.id}`}
              template={buildoutComplete ? "confirmed_record" : "missing_source"}
              subject={official.name}
              sourceLabel={`${sourceCount} public receipt${sourceCount === 1 ? "" : "s"} and the currently labeled evidence gaps`}
              className="!max-w-none !rounded-none !border-[#c9c2b4] !shadow-none"
            />
            <div className="[&>section]:!rounded-none [&>section]:!shadow-none">
            <CommentSection officialId={official.id} officialName={official.name} storyMode />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function LedgerFact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-b border-[#d7d0c4] px-0 py-5 sm:px-5 lg:border-b-0 first:lg:pl-0 last:lg:pr-0">
      <dt className="text-sm font-semibold text-[#6f6a60]">{label}</dt>
      <dd className="mt-1 text-lg font-black leading-6 text-[#15212b]">{value}</dd>
      <dd className="mt-1 text-xs font-medium leading-5 text-[#777166]">{detail}</dd>
    </div>
  );
}

function SectionHeading({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[3rem_minmax(0,1fr)]">
      <span className="pt-1 text-sm font-bold tabular-nums text-[#a23a2b]">{number}</span>
      <div>
        <h2 className="max-w-4xl font-serif text-3xl font-bold tracking-[-0.025em] text-[#101820] sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#5f625f]">{description}</p>
      </div>
    </div>
  );
}

function VoteActivityChart({ record }: { record?: PublicVoteRecord }) {
  if (!record || record.summary.totalVotesLoaded === 0) {
    return (
      <div className="border-l-4 border-[#bd8a2f] bg-[#eee7d7] p-6">
        <p className="font-serif text-2xl font-bold">Roll-call data pending</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#5d5951]">
          No public vote snapshot is attached. Missing rows are not counted as absences or converted into a score.
        </p>
      </div>
    );
  }

  const total = record.summary.totalVotesLoaded;
  const segments = [
    { label: "Yea", value: record.summary.yea, color: "#204f77" },
    { label: "Nay", value: record.summary.nay, color: "#a23a2b" },
    { label: "Present", value: record.summary.present, color: "#bd8a2f" },
    { label: "Not voting / other", value: record.summary.notVoting + record.summary.other, color: "#8d928f" },
  ];

  return (
    <figure>
      <div className="flex items-end justify-between gap-4 border-b-2 border-[#15212b] pb-4">
        <div>
          <p className="text-6xl font-black tracking-[-0.06em] tabular-nums text-[#101820]">{total.toLocaleString()}</p>
          <p className="mt-1 text-sm font-semibold text-[#6f6a60]">indexed votes · {record.session}</p>
        </div>
        <a
          href={record.sourceLinks[0]?.url ?? "/votes"}
          target={record.sourceLinks[0]?.url ? "_blank" : undefined}
          rel={record.sourceLinks[0]?.url ? "noopener noreferrer" : undefined}
          className="text-sm font-bold text-[#204f77] underline underline-offset-4 hover:text-[#a23a2b]"
        >
          Source record {record.sourceLinks[0]?.url ? "↗" : "→"}
        </a>
      </div>
      <div className="mt-6 flex h-5 overflow-hidden bg-[#ddd7cb]" aria-label={`Vote activity chart for ${total} indexed votes`}>
        {segments.map((segment) => (
          <div
            key={segment.label}
            style={{ width: `${total ? (segment.value / total) * 100 : 0}%`, backgroundColor: segment.color }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>
      <dl className="mt-3">
        {segments.map((segment) => {
          const percentage = total ? (segment.value / total) * 100 : 0;
          return (
            <div key={segment.label} className="grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#d7d0c4] py-3">
              <span className="h-2.5 w-2.5" style={{ backgroundColor: segment.color }} aria-hidden="true" />
              <dt className="text-sm font-semibold text-[#4f5555]">{segment.label}</dt>
              <dd className="text-sm font-black tabular-nums text-[#182630]">
                {segment.value.toLocaleString()} <span className="font-medium text-[#777166]">· {percentage.toFixed(1)}%</span>
              </dd>
            </div>
          );
        })}
      </dl>
      <figcaption className="mt-4 text-xs font-medium leading-5 text-[#777166]">
        Denominator: {total.toLocaleString()} indexed roll-call positions through {formatDashboardDate(record.lastUpdated)}.
      </figcaption>
    </figure>
  );
}

function LatestVoteRows({ record }: { record?: PublicVoteRecord }) {
  return (
    <div>
      <div className="flex items-end justify-between border-b-2 border-[#15212b] pb-4">
        <h3 className="font-serif text-2xl font-bold">Latest recorded decisions</h3>
        <Link href="/votes" className="text-sm font-bold text-[#204f77] underline underline-offset-4 hover:text-[#a23a2b]">
          Browse votes →
        </Link>
      </div>
      {record?.votes.length ? (
        <ol>
          {record.votes.slice(0, 5).map((vote) => (
            <li key={vote.sourceId} className="grid gap-2 border-b border-[#d7d0c4] py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] sm:items-start">
              <span className="text-sm text-[#6f6a60]">{formatDashboardDate(vote.date)}</span>
              <span>
                <span className="block text-sm font-bold leading-5 text-[#182630]">{vote.title || vote.question || vote.issue}</span>
                <a href={vote.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex text-xs font-semibold text-[#204f77] underline underline-offset-4 hover:text-[#a23a2b]">
                  Roll {vote.rollCall} · official record ↗
                </a>
              </span>
              <strong className="text-sm text-[#182630] sm:text-right">{vote.voteCast}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-b border-[#d7d0c4] py-6 text-sm font-semibold leading-6 text-[#6f6a60]">
          Latest decisions will appear here after official roll-call rows are loaded.
        </p>
      )}
    </div>
  );
}

function CoverageColumn({
  title,
  emptyText,
  items,
  accent,
}: {
  title: string;
  emptyText: string;
  items: CoverageItem[];
  accent: "positive" | "critical";
}) {
  const accentClass = accent === "positive" ? "border-[#3f7d62]" : "border-[#a23a2b]";
  return (
    <div className={`border-t-4 ${accentClass} p-6 first:lg:pl-0 last:lg:pr-0 lg:px-8`}>
      <div className="flex items-baseline justify-between gap-4 border-b border-[#c9c2b4] pb-3">
        <h3 className="font-serif text-2xl font-bold text-[#101820]">{title}</h3>
        <span className="text-sm font-bold tabular-nums text-[#6f6a60]">{items.length}</span>
      </div>
      {items.length > 0 ? (
        <ol>
          {items.slice(0, 4).map((item) => (
            <li key={item.id} className="border-b border-[#d7d0c4] py-5">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#777166]">
                <span>{item.sourceName} · {item.kind}</span>
                <span>{formatDashboardDate(item.date)}</span>
              </div>
              <h4 className="mt-2 text-base font-black leading-6 text-[#182630]">{item.title}</h4>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#5f625f]">{item.summary}</p>
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-bold text-[#204f77] underline underline-offset-4 hover:text-[#a23a2b]">
                Inspect source ↗
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-6 text-sm font-semibold leading-6 text-[#6f6a60]">{emptyText}</p>
      )}
    </div>
  );
}

function buildCoverage(
  officialId: string,
  articles: NewsArticle[],
  redFlags: RedFlag[],
  overlay: PublicProfileOverlay,
) {
  const positive: CoverageItem[] = [];
  const critical: CoverageItem[] = [];
  const neutral: NewsArticle[] = [];

  for (const article of articles) {
    const classification = article.officialCoverage?.[officialId];
    if (classification?.tone === "positive") {
      positive.push(articleToCoverage(article));
    } else if (classification?.tone === "critical") {
      critical.push(articleToCoverage(article));
    } else {
      neutral.push(article);
    }
  }

  for (const item of overlay.enrichmentItems) {
    if (!criticalOverlayCategories.has(item.category)) continue;
    critical.push({
      id: `overlay-${item.id}`,
      title: item.title,
      summary: item.summary,
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceName,
      date: item.eventDate,
      kind: "review item",
    });
  }

  for (const flag of redFlags) {
    critical.push({
      id: `flag-${flag.id}`,
      title: flag.title,
      summary: flag.description,
      sourceUrl: flag.sourceUrl,
      sourceName: "Source-backed review file",
      date: flag.date,
      kind: "review item",
    });
  }

  return {
    positive: uniqueCoverageItems(positive),
    critical: uniqueCoverageItems(critical),
    neutral,
  };
}

function articleToCoverage(article: NewsArticle): CoverageItem {
  return {
    id: `article-${article.id}`,
    title: article.title,
    summary: article.summary,
    sourceUrl: article.sourceUrl ?? `/news/${article.id}`,
    sourceName: article.sourceName ?? "RepWatchr",
    date: article.publishedAt,
    kind: "article",
  };
}

function uniqueCoverageItems(items: CoverageItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.sourceUrl || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSources({
  official,
  voteRecord,
  funding,
  relatedNews,
  redFlags,
  overlay,
}: {
  official: Official;
  voteRecord?: PublicVoteRecord;
  funding?: FundingSummary;
  relatedNews: NewsArticle[];
  redFlags: RedFlag[];
  overlay: PublicProfileOverlay;
}) {
  const entries: DashboardSource[] = [];
  const add = (source: DashboardSource) => {
    if (!source.url || entries.some((item) => item.url === source.url)) return;
    entries.push(source);
  };

  if (official.contactInfo.website) {
    add({ title: "Official website", url: normalizeExternalUrl(official.contactInfo.website), kind: "Official" });
  }
  official.sourceLinks?.forEach((source) => add({ ...source, kind: "Official" }));
  voteRecord?.sourceLinks.forEach((source) => add({ ...source, kind: "Voting record" }));
  funding?.sources.forEach((source) => add({ title: source.name, url: source.url, kind: "Campaign finance" }));
  relatedNews.forEach((article) => {
    if (article.sourceUrl) add({ title: article.sourceName ?? article.title, url: article.sourceUrl, kind: "Reporting" });
    article.sourceLinks?.forEach((source) => add({ ...source, kind: "Reporting" }));
  });
  overlay.enrichmentItems.forEach((item) => add({ title: item.title, url: item.sourceUrl, kind: "Public record" }));
  redFlags.forEach((flag) => add({ title: flag.title, url: flag.sourceUrl, kind: "Review file" }));

  return entries;
}

function buildSocialLinks(official: Official, overlay: PublicProfileOverlay) {
  const links: Array<{ label: string; url: string }> = [];
  const add = (label: string, url: string) => {
    if (links.some((link) => link.url === url || link.label === label)) return;
    links.push({ label, url });
  };

  Object.entries(official.contactInfo.socialMedia ?? {}).forEach(([platform, value]) => {
    if (!value) return;
    add(socialLabels[platform] ?? platform, normalizeSocialUrl(platform, value));
  });
  overlay.socialAccounts.forEach((account) => {
    if (!account.isOfficial) return;
    add(socialLabels[account.platform.toLowerCase()] ?? account.platform, normalizeExternalUrl(account.publicUrl));
  });

  return links.slice(0, 6);
}

function normalizeSocialUrl(platform: string, value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, "");
  if (platform === "facebook") return `https://www.facebook.com/${handle}`;
  if (platform === "instagram") return `https://www.instagram.com/${handle}`;
  if (platform === "youtube") return `https://www.youtube.com/@${handle.replace(/^@/, "")}`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${handle}`;
  return `https://x.com/${handle}`;
}

function normalizeExternalUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}

function formatDashboardDate(value?: string | null) {
  if (!value) return "review pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function humanizeMissingItem(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
