import type { Metadata } from "next";
import Link from "next/link";
import CopySnippetButton from "@/components/shared/CopySnippetButton";
import RouteEventTracker from "@/components/shared/RouteEventTracker";
import ShareButtons from "@/components/shared/ShareButtons";
import { DAILY_NEWS_WATCH_SOURCES } from "@/data/daily-news-watch-sources";
import { getAllNews } from "@/lib/data";
import { getDailyWireClips, type DailyWireClip } from "@/lib/daily-wire";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import type { NewsArticle, NewsPowerChannel, NewsScope, SourceCredit } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildRepWatchrMetadata({
    title: "Daily Watch Wire | RepWatchr",
    description:
      "Daily source-linked public accountability wire items organized by officials, oversight, money, courts, elections, media, school boards, and public safety.",
    path: "/daily-wire",
    imagePath: buildOgImageUrl("news"),
    imageAlt: "RepWatchr Daily Watch Wire preview",
  }),
};

const scopeLabels: Record<NewsScope, string> = {
  "east-texas": "East Texas",
  texas: "Texas",
  national: "United States",
};

const channelLabels: Record<NewsPowerChannel, string> = {
  attorneys: "Attorneys",
  courts: "Courts",
  elections: "Elections",
  media: "Media",
  money: "Money",
  officials: "Officials",
  "public-safety": "Public safety",
  "school-boards": "School boards",
};

const channelOrder: NewsPowerChannel[] = [
  "officials",
  "media",
  "courts",
  "money",
  "elections",
  "school-boards",
  "public-safety",
  "attorneys",
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isWireChannel(value: string | undefined): value is NewsPowerChannel {
  return Boolean(value && channelOrder.includes(value as NewsPowerChannel));
}

function dateLabel(value: string | null) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeValue(value: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sourceCreditLabel(credit: SourceCredit) {
  return credit.handle ? `${credit.name} (${credit.handle})` : credit.name;
}

function wireSnippet(clip: DailyWireClip) {
  return [
    `RepWatchr daily wire: ${clip.title}`,
    "",
    `Why it matters: ${clip.summary}`,
    "",
    ...(clip.sourceCredit
      ? [`Credit: ${sourceCreditLabel(clip.sourceCredit)}`, `Creator link: ${clip.sourceCredit.url}`, ""]
      : []),
    `Receipt: ${clip.sourceName} - ${clip.sourceUrl}`,
    "",
    "Open the daily wire: https://www.repwatchr.com/daily-wire",
  ].join("\n");
}

function articleFallbackSnippet(article: NewsArticle) {
  return [
    `RepWatchr story: ${article.title}`,
    "",
    `Why it matters: ${article.summary}`,
    "",
    `Open the record: https://www.repwatchr.com/news/${article.id}`,
  ].join("\n");
}

function WireCard({ clip }: { clip: DailyWireClip }) {
  const statusLabel = clip.publicStatus === "source_linked" ? "Source-linked" : "Needs review";
  const statusClass =
    clip.publicStatus === "source_linked"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <article id={`clip-${clip.id}`} className="scroll-mt-28 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusClass}`}>
          {statusLabel}
        </span>
        {clip.publicLabels
          .filter((label) => label !== statusLabel)
          .slice(0, 3)
          .map((label) => (
            <span key={label} className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-900">
              {label}
            </span>
          ))}
        <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          {scopeLabels[clip.scope] ?? clip.scope}
        </span>
        {clip.powerChannels.slice(0, 3).map((channel) => (
          <span key={channel} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700">
            {channelLabels[channel]}
          </span>
        ))}
      </div>

      <h2 className="mt-3 text-xl font-black leading-tight text-slate-950">
        {clip.title}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
        {clip.summary}
      </p>

      {clip.sourceCredit ? (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-900">
            Credited source watch
          </p>
          <a
            href={clip.sourceCredit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex text-sm font-black text-blue-950 underline-offset-4 hover:text-red-700 hover:underline"
          >
            {sourceCreditLabel(clip.sourceCredit)}
          </a>
          {clip.sourceCredit.note ? (
            <p className="mt-1 text-sm font-semibold leading-6 text-blue-900">
              {clip.sourceCredit.note}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {clip.topicTags.slice(0, 6).map((term) => (
          <span key={term} className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-red-800">
            {term}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="text-xs font-bold leading-5 text-slate-500">
          <p>{dateLabel(clip.publishedAt)} / {clip.sourceName}</p>
          <p>Source tier: {clip.sourceTier.replace("_", " ")} / domain: {clip.sourceDomain || "pending"}</p>
          <p>Quality: {clip.qualityScore}/100 / jurisdiction: {clip.jurisdictionMatch} / geography: {clip.geographicRelevance}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopySnippetButton text={wireSnippet(clip)} />
          <a
            href={clip.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-blue-950 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-700"
          >
            Open source
          </a>
        </div>
      </div>
      <div className="mt-4">
        <ShareButtons
          title={clip.title}
          description={clip.summary}
          path={`/daily-wire#clip-${clip.id}`}
          template="meeting_clip"
          subject={clip.title}
          sourceLabel={clip.sourceCredit?.name || clip.sourceName}
        />
      </div>
    </article>
  );
}

function FallbackArticleCard({ article }: { article: NewsArticle }) {
  return (
    <article className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          Staff story
        </span>
        {article.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-900">
            {tag}
          </span>
        ))}
      </div>
      <h2 className="mt-3 text-xl font-black leading-tight text-slate-950">
        {article.title}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
        {article.summary}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <CopySnippetButton text={articleFallbackSnippet(article)} />
        <Link
          href={`/news/${article.id}`}
          className="rounded-xl bg-blue-950 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-700"
        >
          Read story
        </Link>
      </div>
      <div className="mt-4">
        <ShareButtons
          title={article.title}
          description={article.summary}
          path={`/news/${article.id}`}
          template={article.sourceStatus === "needs_source_review" ? "missing_source" : "confirmed_record"}
          subject={article.title}
          sourceLabel={article.sourceName || article.sourceLinks?.[0]?.title || "linked public sources"}
        />
      </div>
    </article>
  );
}

export default async function DailyWirePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const selectedLaneParam = firstParam(params.lane);
  const selectedLane = isWireChannel(selectedLaneParam) ? selectedLaneParam : undefined;
  const result = await getDailyWireClips(72);
  const wireClips = result.clips
    .slice()
    .sort((a, b) => timeValue(b.publishedAt ?? b.updatedAt) - timeValue(a.publishedAt ?? a.updatedAt));
  const visibleClips = selectedLane
    ? wireClips.filter((clip) => clip.powerChannels.includes(selectedLane))
    : wireClips;
  const sourceLinkedCount = wireClips.filter((clip) => clip.publicStatus === "source_linked").length;
  const needsReviewCount = wireClips.filter((clip) => clip.publicStatus === "needs_review").length;
  const fallbackArticles = getAllNews().slice(0, 9);
  const laneCounts = channelOrder.map((channel) => ({
    channel,
    count: wireClips.filter((clip) => clip.powerChannels.includes(channel)).length,
  }));
  const activeItems = visibleClips.length;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "RepWatchr Daily Watch Wire",
    url: selectedLane
      ? `https://www.repwatchr.com/daily-wire?lane=${selectedLane}`
      : "https://www.repwatchr.com/daily-wire",
    description:
      "Review-gated source-linked public accountability wire items for political officials, oversight, money, courts, elections, media, school boards, and public safety.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: visibleClips.slice(0, 20).map((clip, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: clip.sourceUrl,
        name: clip.title,
      })),
    },
  };

  return (
    <div className="rw-page-shell">
      <RouteEventTracker
        eventName="daily_wire_item_open"
        metadata={{
          lane: selectedLane ?? "all",
          visible_count: activeItems,
          source_linked_count: sourceLinkedCount,
          needs_review_count: needsReviewCount,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_32%,#d6b35a_32%,#d6b35a_44%,#ffffff_44%,#ffffff_58%,#002868_58%,#002868_100%)]" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_0.82fr] lg:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Daily Watch Wire
              </p>
              <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl">
                Review-gated leads. Receipts stay attached.
              </h1>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
                Every hour RepWatchr can search public RSS and news indexes for representatives, school boards, public safety, courts, money, elections, household costs, oversight, ethics, and corruption-risk signals. Items are scored for jurisdiction, geography, source quality, duplicates, and topic fit before they appear here. A wire item is a lead with a receipt, not a RepWatchr finding.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/daily-wire"
                  className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                    selectedLane
                      ? "border border-slate-300 bg-slate-50 text-slate-800 hover:border-red-300 hover:bg-red-50"
                      : "bg-slate-950 text-white"
                  }`}
                >
                  All wire
                </Link>
                {channelOrder.map((channel) => (
                  <Link
                    key={channel}
                    href={`/daily-wire?lane=${channel}`}
                    className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                      selectedLane === channel
                        ? "bg-red-700 text-white"
                        : "border border-slate-300 bg-slate-50 text-slate-800 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    {channelLabels[channel]}
                  </Link>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/feed"
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-950"
                >
                  Open feed
                </Link>
                <Link
                  href="/feedback"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-amber-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
                >
                  Submit missing source
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric label="Wire items" value={activeItems} />
              <Metric label="Sources watched" value={result.sourceCount} />
              <Metric label="Source-linked" value={sourceLinkedCount} />
              <Metric label="Needs review" value={needsReviewCount} />
            </div>
          </div>
        </section>

        {!result.configured || result.error ? (
          <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-900">
              Wire setup notice
            </p>
            <h2 className="mt-2 text-2xl font-black text-amber-950">
              The public wire route is built. Supabase has to be configured in production for live daily clips.
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
              {result.error ?? "No live wire rows were returned."} Until the cron has database access, this page falls back to the latest staff-written RepWatchr articles.
            </p>
          </section>
        ) : null}

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {visibleClips.length ? (
              visibleClips.map((clip) => <WireCard key={clip.id} clip={clip} />)
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {fallbackArticles.map((article) => (
                  <FallbackArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Attention filters
              </p>
              <div className="mt-3 space-y-2">
                {laneCounts.map((lane) => (
                  <Link
                    key={lane.channel}
                    href={`/daily-wire?lane=${lane.channel}`}
                    className={`flex items-center justify-between border-b border-slate-100 py-2 text-sm font-black last:border-b-0 hover:text-red-700 ${
                      selectedLane === lane.channel ? "text-red-700" : "text-slate-800"
                    }`}
                  >
                    <span>{channelLabels[lane.channel]}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {lane.count}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-300 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                Safety rule
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight">
                The hook travels. The receipt stays attached.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                Wire posts are not verdicts, threats, or legal findings. They are source-linked public leads that must stay tied to a receipt, profile attachment, or deeper RepWatchr story work.
              </p>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-900">
                Source net
              </p>
              <p className="mt-2 text-3xl font-black text-amber-950">
                {DAILY_NEWS_WATCH_SOURCES.length}
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-amber-900">
                public RSS and news-search sources watched by the daily cron.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
      <p className="text-3xl font-black text-slate-950">{displayValue}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
    </div>
  );
}
