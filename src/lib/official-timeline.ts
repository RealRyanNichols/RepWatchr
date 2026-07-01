import type {
  CongressTradingProfileSnapshot,
  FundingSummary,
  NewsArticle,
  Official,
  PublicVoteRecord,
  RedFlag,
  ScoreCard,
} from "@/types";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  classifyProfileSource,
  getPublicProfileOverlay,
  stableSourceHash,
  type PublicProfileEnrichmentItem,
  type PublicProfileOverlay,
  type PublicProfileVoteSnapshot,
  type PublicStatementSnapshot,
  type ProfileSourceTier,
} from "@/lib/profile-overlays";
import {
  getFundingSummary,
  getNewsByOfficialId,
  getOfficialById,
  getPublicVoteRecord,
  getRedFlags,
  getScoreCard,
  getBillById,
} from "@/lib/data";
import { getCongressTradingSnapshot } from "@/lib/congress-trading";

export type OfficialTimelineEventType =
  | "speech"
  | "vote"
  | "donation"
  | "campaign_filing"
  | "meeting"
  | "board_appointment"
  | "committee_vote"
  | "article"
  | "investigation"
  | "correction"
  | "public_statement"
  | "funding"
  | "red_flag"
  | "disclosure"
  | "source_link"
  | "profile_update";

export type OfficialTimelineStatus =
  | "source_linked"
  | "needs_review"
  | "verified"
  | "attached_to_profile";

export interface OfficialTimelineEvent {
  id: string;
  officialId: string;
  officialName: string;
  eventType: OfficialTimelineEventType;
  eventDate: string | null;
  title: string;
  summary: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceDomain: string | null;
  sourceDate: string | null;
  sourceTier: ProfileSourceTier;
  status: OfficialTimelineStatus;
  jurisdiction: string | null;
  office: string | null;
  state: string | null;
  county: string | null;
  tags: string[];
  sourceTable: string | null;
  sourceId: string | null;
  sourceHash: string;
  shareSnippet: string;
  embedAllowed: boolean;
}

export interface OfficialTimelineBundle {
  official: Official | null;
  events: OfficialTimelineEvent[];
  staticEventCount: number;
  databaseEventCount: number;
  sourceCount: number;
  eventTypeCounts: Partial<Record<OfficialTimelineEventType, number>>;
  errors: string[];
}

export const OFFICIAL_TIMELINE_EVENT_TYPES: Record<
  OfficialTimelineEventType,
  { label: string; shortLabel: string; description: string }
> = {
  speech: {
    label: "Speech",
    shortLabel: "Speech",
    description: "Public remarks, speeches, hearings, or recorded appearances.",
  },
  vote: {
    label: "Vote",
    shortLabel: "Vote",
    description: "Roll-call vote, scored vote, or source-backed voting record.",
  },
  donation: {
    label: "Donation",
    shortLabel: "Donation",
    description: "Campaign contribution or donor record from a public filing.",
  },
  campaign_filing: {
    label: "Campaign Filing",
    shortLabel: "Filing",
    description: "Finance report, candidate filing, or public campaign disclosure.",
  },
  meeting: {
    label: "Meeting",
    shortLabel: "Meeting",
    description: "Public meeting, agenda, minutes, or video record.",
  },
  board_appointment: {
    label: "Board Appointment",
    shortLabel: "Appointment",
    description: "Appointment, board seat, committee assignment, or official role record.",
  },
  committee_vote: {
    label: "Committee Vote",
    shortLabel: "Committee",
    description: "Committee vote or committee action tied to a public source.",
  },
  article: {
    label: "Article",
    shortLabel: "Article",
    description: "Named publication or RepWatchr story linked to this official.",
  },
  investigation: {
    label: "Investigation",
    shortLabel: "Review",
    description: "Public-record review, watchdog item, lawsuit, ethics, or source-backed question.",
  },
  correction: {
    label: "Correction",
    shortLabel: "Correction",
    description: "Correction request, update, or public record cleanup event.",
  },
  public_statement: {
    label: "Public Statement",
    shortLabel: "Statement",
    description: "Official social account, public statement, interview, or post.",
  },
  funding: {
    label: "Funding",
    shortLabel: "Funding",
    description: "Money trail source, donor breakdown, or campaign finance snapshot.",
  },
  red_flag: {
    label: "Red Flag",
    shortLabel: "Flag",
    description: "Source-backed item that RepWatchr marks for public review.",
  },
  disclosure: {
    label: "Disclosure",
    shortLabel: "Disclosure",
    description: "Financial, trading, ethics, or other official disclosure source.",
  },
  source_link: {
    label: "Source Link",
    shortLabel: "Source",
    description: "Official public source attached to the profile.",
  },
  profile_update: {
    label: "Profile Update",
    shortLabel: "Update",
    description: "RepWatchr profile buildout, verification, or public source update.",
  },
};

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://www.repwatchr.com").replace(/\/+$/, "");
}

function dateOnly(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function sourceDomain(sourceUrl: string): string | null {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function safeText(value: string, maxLength: number) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function sourceTier(sourceUrl: string, sourceTitle?: string): ProfileSourceTier {
  return classifyProfileSource(sourceUrl, sourceTitle ?? sourceDomain(sourceUrl) ?? "Public source");
}

function disclosureSourceTier(tier: "official_record" | "secondary_tracker"): ProfileSourceTier {
  return tier === "official_record" ? "official_record" : "other_public";
}

function tags(...values: Array<string | null | undefined | string[]>) {
  const flattened = values.flatMap((value) => (Array.isArray(value) ? value : [value]));
  return Array.from(
    new Set(
      flattened
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

function eventId(sourceHash: string) {
  return `static-${sourceHash.slice(0, 20)}`;
}

function makeShareSnippet(officialName: string, title: string, sourceUrl: string) {
  return safeText(`RepWatchr timeline event for ${officialName}: ${title}. Open the public source before sharing: ${sourceUrl}`, 520);
}

function buildEvent(input: Omit<OfficialTimelineEvent, "id" | "sourceDomain" | "sourceHash" | "shareSnippet"> & {
  sourceHashParts: Array<string | number | null | undefined>;
}): OfficialTimelineEvent {
  const sourceHash = stableSourceHash(...input.sourceHashParts);
  const title = safeText(input.title, 300);
  const sourceUrl = input.sourceUrl.trim();

  return {
    id: eventId(sourceHash),
    officialId: input.officialId,
    officialName: input.officialName,
    eventType: input.eventType,
    eventDate: dateOnly(input.eventDate),
    title,
    summary: safeText(input.summary, 2400),
    sourceTitle: safeText(input.sourceTitle, 300),
    sourceUrl,
    sourceDomain: sourceDomain(sourceUrl),
    sourceDate: dateOnly(input.sourceDate),
    sourceTier: input.sourceTier,
    status: input.status,
    jurisdiction: input.jurisdiction,
    office: input.office,
    state: input.state,
    county: input.county,
    tags: input.tags,
    sourceTable: input.sourceTable,
    sourceId: input.sourceId,
    sourceHash,
    shareSnippet: makeShareSnippet(input.officialName, title, sourceUrl),
    embedAllowed: input.embedAllowed,
  };
}

function eventBase(official: Official) {
  return {
    officialId: official.id,
    officialName: official.name,
    jurisdiction: official.jurisdiction,
    office: official.position,
    state: official.state ?? null,
    county: official.county[0] ?? null,
    embedAllowed: true,
  };
}

function sourceLinkEvents(official: Official): OfficialTimelineEvent[] {
  const base = eventBase(official);
  const events: OfficialTimelineEvent[] = [];

  for (const source of official.sourceLinks ?? []) {
    events.push(
      buildEvent({
        ...base,
        eventType: "source_link",
        eventDate: official.lastVerifiedAt ?? null,
        title: source.title,
        summary: `${official.name} has a public profile source attached for ${source.title}.`,
        sourceTitle: source.title,
        sourceUrl: source.url,
        sourceDate: official.lastVerifiedAt ?? null,
        sourceTier: sourceTier(source.url, source.title),
        status: "source_linked",
        tags: tags("source", official.level, official.position, official.state),
        sourceTable: "official.sourceLinks",
        sourceId: source.title,
        sourceHashParts: [official.id, "official-source", source.title, source.url],
      }),
    );
  }

  if (official.photoSourceUrl) {
    events.push(
      buildEvent({
        ...base,
        eventType: "source_link",
        eventDate: official.lastVerifiedAt ?? null,
        title: "Profile photo source",
        summary: `RepWatchr has a public source for the profile photo used on ${official.name}'s dossier.`,
        sourceTitle: official.photoCredit ?? "Profile photo source",
        sourceUrl: official.photoSourceUrl,
        sourceDate: official.lastVerifiedAt ?? null,
        sourceTier: sourceTier(official.photoSourceUrl, official.photoCredit),
        status: "source_linked",
        tags: tags("source", "photo", official.level),
        sourceTable: "official.photoSourceUrl",
        sourceId: "photo",
        sourceHashParts: [official.id, "photo", official.photoSourceUrl],
      }),
    );
  }

  if (official.contactInfo.website) {
    events.push(
      buildEvent({
        ...base,
        eventType: "source_link",
        eventDate: official.lastVerifiedAt ?? null,
        title: "Official website source",
        summary: `RepWatchr has the official website attached for ${official.name}.`,
        sourceTitle: "Official website",
        sourceUrl: official.contactInfo.website,
        sourceDate: official.lastVerifiedAt ?? null,
        sourceTier: sourceTier(official.contactInfo.website, "Official website"),
        status: "source_linked",
        tags: tags("source", "official-website", official.level),
        sourceTable: "official.contactInfo.website",
        sourceId: "website",
        sourceHashParts: [official.id, "website", official.contactInfo.website],
      }),
    );
  }

  return events;
}

function scorecardVoteEvents(official: Official, scoreCard: ScoreCard | undefined): OfficialTimelineEvent[] {
  if (!scoreCard) return [];
  const base = eventBase(official);
  return Object.values(scoreCard.categories)
    .flatMap((category) => category.votes)
    .map((vote) => {
      const bill = getBillById(vote.billId);
      const sourceUrl = bill?.sourceUrl;
      if (!sourceUrl) return null;
      const alignment = vote.aligned ? "aligned" : "not aligned";
      return buildEvent({
        ...base,
        eventType: "vote",
        eventDate: vote.date,
        title: vote.billTitle,
        summary: `${official.name} voted ${vote.officialVote} on ${vote.billTitle}. RepWatchr scored this as ${alignment}: ${vote.explanation}`,
        sourceTitle: bill?.title ?? vote.billTitle,
        sourceUrl,
        sourceDate: vote.date,
        sourceTier: sourceTier(sourceUrl, bill?.title ?? vote.billTitle),
        status: "source_linked",
        tags: tags("vote", vote.category, vote.aligned ? "aligned" : "not-aligned", bill?.categories),
        sourceTable: "scoreCard.categories.votes",
        sourceId: vote.billId,
        sourceHashParts: [official.id, "scorecard-vote", vote.billId, vote.date, sourceUrl],
      });
    })
    .filter((event): event is OfficialTimelineEvent => Boolean(event));
}

function publicVoteRecordEvents(official: Official, record: PublicVoteRecord | undefined): OfficialTimelineEvent[] {
  if (!record) return [];
  const base = eventBase(official);
  const sourceEvents = record.sourceLinks.map((source) =>
    buildEvent({
      ...base,
      eventType: "source_link",
      eventDate: record.lastUpdated,
      title: source.title,
      summary: `Public roll-call source attached for ${official.name}'s ${record.session} vote record.`,
      sourceTitle: source.title,
      sourceUrl: source.url,
      sourceDate: record.lastUpdated,
      sourceTier: sourceTier(source.url, source.title),
      status: "source_linked",
      tags: tags("source", "roll-call", record.chamber, record.session, official.level),
      sourceTable: "publicVoteRecord.sourceLinks",
      sourceId: source.title,
      sourceHashParts: [official.id, "public-vote-record-source", source.title, source.url],
    }),
  );

  const voteEvents = record.votes.map((vote) =>
    buildEvent({
      ...base,
      eventType: "vote",
      eventDate: vote.date,
      title: vote.title || vote.question,
      summary: `${official.name} cast ${vote.voteCast || vote.vote} on ${vote.question}. Result: ${vote.result}.`,
      sourceTitle: vote.sourceName,
      sourceUrl: vote.sourceUrl,
      sourceDate: vote.date,
      sourceTier: sourceTier(vote.sourceUrl, vote.sourceName),
      status: "source_linked",
      tags: tags("vote", vote.issue, vote.chamber, `congress-${vote.congress}`, `roll-call-${vote.rollCall}`),
      sourceTable: "publicVoteRecord.votes",
      sourceId: vote.sourceId,
      sourceHashParts: [official.id, "public-roll-call", vote.sourceId, vote.sourceUrl, vote.voteCast],
    }),
  );

  return [...sourceEvents, ...voteEvents];
}

function fundingEvents(official: Official, funding: FundingSummary | undefined): OfficialTimelineEvent[] {
  if (!funding) return [];
  const base = eventBase(official);
  const primarySource = funding.sources[0];
  const events = funding.sources.map((source) =>
    buildEvent({
      ...base,
      eventType: "campaign_filing",
      eventDate: funding.lastUpdated,
      title: `${funding.cycle} campaign finance source`,
      summary: `${official.name}'s ${funding.cycle} funding snapshot lists ${money(funding.totalRaised)} raised, ${money(funding.totalSpent)} spent, and ${money(funding.cashOnHand)} cash on hand.`,
      sourceTitle: source.name,
      sourceUrl: source.url,
      sourceDate: source.retrievedDate,
      sourceTier: sourceTier(source.url, source.name),
      status: "source_linked",
      tags: tags("funding", "campaign-finance", funding.cycle, official.state),
      sourceTable: "funding.sources",
      sourceId: source.name,
      sourceHashParts: [official.id, "funding-source", funding.cycle, source.url],
    }),
  );

  if (primarySource) {
    for (const donor of funding.topDonors.slice(0, 12)) {
      events.push(
        buildEvent({
          ...base,
          eventType: "donation",
          eventDate: funding.lastUpdated,
          title: `${donor.name} listed as top donor`,
          summary: `${donor.name} is listed in the ${funding.cycle} money trail snapshot at ${money(donor.totalAmount)}. This is a funding record, not a finding of wrongdoing.`,
          sourceTitle: primarySource.name,
          sourceUrl: primarySource.url,
          sourceDate: primarySource.retrievedDate,
          sourceTier: sourceTier(primarySource.url, primarySource.name),
          status: "source_linked",
          tags: tags("funding", "donor", donor.type, donor.state, funding.cycle),
          sourceTable: "funding.topDonors",
          sourceId: donor.name,
          sourceHashParts: [official.id, "donor", funding.cycle, donor.name, donor.totalAmount, primarySource.url],
        }),
      );
    }
  }

  return events;
}

function redFlagEvents(official: Official, redFlags: RedFlag[]): OfficialTimelineEvent[] {
  const base = eventBase(official);
  return redFlags.map((flag) =>
    buildEvent({
      ...base,
      eventType: "red_flag",
      eventDate: flag.date,
      title: flag.title,
      summary: `${flag.description} Why it matters: ${flag.whyItMatters}`,
      sourceTitle: "Red flag source",
      sourceUrl: flag.sourceUrl,
      sourceDate: flag.date,
      sourceTier: sourceTier(flag.sourceUrl, flag.title),
      status: "source_linked",
      tags: tags("red-flag", flag.category, flag.severity),
      sourceTable: "redFlags",
      sourceId: flag.id,
      sourceHashParts: [official.id, "red-flag", flag.id, flag.sourceUrl],
    }),
  );
}

function newsEvents(official: Official, articles: NewsArticle[]): OfficialTimelineEvent[] {
  const base = eventBase(official);
  const events: OfficialTimelineEvent[] = [];

  for (const article of articles) {
    if (article.sourceUrl) {
      events.push(
        buildEvent({
          ...base,
          eventType: "article",
          eventDate: article.publishedAt,
          title: article.title,
          summary: article.summary,
          sourceTitle: article.sourceName ?? "Article source",
          sourceUrl: article.sourceUrl,
          sourceDate: article.publishedAt,
          sourceTier: sourceTier(article.sourceUrl, article.sourceName ?? article.title),
          status: "source_linked",
          tags: tags("article", article.tags, article.scope, article.state, article.powerChannels),
          sourceTable: "news.sourceUrl",
          sourceId: article.id,
          sourceHashParts: [official.id, "news", article.id, article.sourceUrl],
        }),
      );
    }

    for (const source of article.sourceLinks ?? []) {
      events.push(
        buildEvent({
          ...base,
          eventType: "article",
          eventDate: article.publishedAt,
          title: `${article.title}: source`,
          summary: article.summary,
          sourceTitle: source.title,
          sourceUrl: source.url,
          sourceDate: article.publishedAt,
          sourceTier: sourceTier(source.url, source.title),
          status: "source_linked",
          tags: tags("article", article.tags, article.scope, article.state, article.powerChannels),
          sourceTable: "news.sourceLinks",
          sourceId: `${article.id}:${source.title}`,
          sourceHashParts: [official.id, "news-source", article.id, source.title, source.url],
        }),
      );
    }
  }

  return events;
}

function overlayVoteEvents(official: Official, votes: PublicProfileVoteSnapshot[]): OfficialTimelineEvent[] {
  const base = eventBase(official);
  return votes.map((vote) =>
    buildEvent({
      ...base,
      eventType: "vote",
      eventDate: vote.voteDate,
      title: vote.question ?? `Roll call ${vote.rollCall ?? vote.sourceVoteId}`,
      summary: `${official.name} is listed as ${vote.voteCast ?? "recorded"} on this public vote snapshot. Rule status: ${vote.ruleReviewStatus}.`,
      sourceTitle: vote.sourceVoteId,
      sourceUrl: vote.sourceUrl,
      sourceDate: vote.voteDate,
      sourceTier: sourceTier(vote.sourceUrl, vote.sourceVoteId),
      status: vote.ruleReviewStatus === "approved" ? "verified" : "source_linked",
      tags: tags("vote", vote.issue, vote.issueLabel, vote.chamber, vote.session),
      sourceTable: "profile_vote_snapshots",
      sourceId: vote.id,
      sourceHashParts: [official.id, "overlay-vote", vote.id, vote.sourceUrl],
    }),
  );
}

function overlayEventType(category: PublicProfileEnrichmentItem["category"]): OfficialTimelineEventType {
  if (category === "news") return "article";
  if (category === "funding") return "funding";
  if (category === "statement") return "public_statement";
  if (["controversy", "lawsuit", "ethics", "scandal"].includes(category)) return "investigation";
  return "source_link";
}

function overlayEnrichmentEvents(official: Official, items: PublicProfileEnrichmentItem[]): OfficialTimelineEvent[] {
  const base = eventBase(official);
  return items.map((item) =>
    buildEvent({
      ...base,
      eventType: overlayEventType(item.category),
      eventDate: item.eventDate,
      title: item.title,
      summary: item.summary,
      sourceTitle: item.sourceName,
      sourceUrl: item.sourceUrl,
      sourceDate: item.eventDate,
      sourceTier: item.sourceTier,
      status: item.status === "approved" ? "verified" : "source_linked",
      tags: tags(item.category, item.sourceTier),
      sourceTable: "profile_enrichment_items",
      sourceId: item.id,
      sourceHashParts: [official.id, "overlay-enrichment", item.id, item.sourceUrl],
    }),
  );
}

function publicStatementEvents(official: Official, statements: PublicStatementSnapshot[]): OfficialTimelineEvent[] {
  const base = eventBase(official);
  return statements.map((statement) =>
    buildEvent({
      ...base,
      eventType: "public_statement",
      eventDate: statement.statementDate,
      title: `${statement.platform} public statement`,
      summary: statement.excerpt
        ? `${statement.excerpt}${statement.contextNote ? ` Context: ${statement.contextNote}` : ""}`
        : statement.contextNote ?? `Public ${statement.platform} statement attached to ${official.name}.`,
      sourceTitle: `${statement.platform} statement`,
      sourceUrl: statement.statementUrl,
      sourceDate: statement.statementDate,
      sourceTier: sourceTier(statement.statementUrl, statement.platform),
      status: "verified",
      tags: tags("public-statement", statement.platform),
      sourceTable: "public_statement_snapshots",
      sourceId: statement.id,
      sourceHashParts: [official.id, "public-statement", statement.id, statement.statementUrl],
    }),
  );
}

function tradingEvents(official: Official, snapshot: CongressTradingProfileSnapshot | undefined): OfficialTimelineEvent[] {
  if (!snapshot) return [];
  const base = eventBase(official);
  const events = snapshot.rows.map((row) =>
    buildEvent({
      ...base,
      eventType: "disclosure",
      eventDate: row.lastFilingDate,
      title: "Trading disclosure watch",
      summary: `${row.transactions} disclosed transaction rows and ${row.filings} disclosure filings are listed in the secondary tracker. This is not a finding of wrongdoing.`,
      sourceTitle: snapshot.source.name,
      sourceUrl: row.trackerUrl || snapshot.source.url,
      sourceDate: snapshot.snapshotDate,
      sourceTier: disclosureSourceTier(snapshot.source.tier),
      status: "source_linked",
      tags: tags("disclosure", "trading", row.riskLevel, row.chamber),
      sourceTable: "congressTrading.records",
      sourceId: row.id,
      sourceHashParts: [official.id, "trading-row", row.id, row.trackerUrl],
    }),
  );

  for (const source of snapshot.officialSources) {
    events.push(
      buildEvent({
        ...base,
        eventType: "disclosure",
        eventDate: snapshot.snapshotDate,
        title: source.name,
        summary: `Official disclosure source linked for ${official.name}'s trading disclosure review.`,
        sourceTitle: source.name,
        sourceUrl: source.url,
        sourceDate: source.retrievedDate,
        sourceTier: disclosureSourceTier(source.tier),
        status: "source_linked",
        tags: tags("disclosure", "official-record"),
        sourceTable: "congressTrading.officialSources",
        sourceId: source.name,
        sourceHashParts: [official.id, "trading-source", source.name, source.url],
      }),
    );
  }

  return events;
}

export function buildOfficialTimelineFromSources({
  official,
  scoreCard,
  funding,
  redFlags,
  relatedNews,
  publicVoteRecord,
  profileOverlay,
  congressTrading,
}: {
  official: Official;
  scoreCard?: ScoreCard;
  funding?: FundingSummary;
  redFlags?: RedFlag[];
  relatedNews?: NewsArticle[];
  publicVoteRecord?: PublicVoteRecord;
  profileOverlay?: PublicProfileOverlay;
  congressTrading?: CongressTradingProfileSnapshot;
}): OfficialTimelineEvent[] {
  return sortTimelineEvents(
    dedupeTimelineEvents([
      ...sourceLinkEvents(official),
      ...scorecardVoteEvents(official, scoreCard),
      ...publicVoteRecordEvents(official, publicVoteRecord),
      ...fundingEvents(official, funding),
      ...redFlagEvents(official, redFlags ?? []),
      ...newsEvents(official, relatedNews ?? []),
      ...overlayVoteEvents(official, profileOverlay?.voteSnapshots ?? []),
      ...overlayEnrichmentEvents(official, profileOverlay?.enrichmentItems ?? []),
      ...publicStatementEvents(official, profileOverlay?.publicStatements ?? []),
      ...tradingEvents(official, congressTrading),
    ]),
  );
}

function mapDatabaseEvent(row: Record<string, unknown>): OfficialTimelineEvent {
  const sourceUrl = String(row.source_url ?? "");
  const sourceHash = String(
    row.source_hash ??
      stableSourceHash(
        String(row.official_id ?? ""),
        String(row.event_type ?? ""),
        sourceUrl,
        String(row.title ?? ""),
      ),
  );
  return {
    id: String(row.id ?? `db-${sourceHash.slice(0, 20)}`),
    officialId: String(row.official_id ?? ""),
    officialName: String(row.official_name ?? ""),
    eventType: row.event_type as OfficialTimelineEventType,
    eventDate: row.event_date ? String(row.event_date) : null,
    title: String(row.title ?? "Timeline event"),
    summary: String(row.summary ?? ""),
    sourceTitle: String(row.source_title ?? sourceDomain(sourceUrl) ?? "Public source"),
    sourceUrl,
    sourceDomain: row.source_domain ? String(row.source_domain) : sourceDomain(sourceUrl),
    sourceDate: row.source_date ? String(row.source_date) : null,
    sourceTier: (row.source_tier as ProfileSourceTier) ?? sourceTier(sourceUrl),
    status: row.status === "verified" ? "verified" : "attached_to_profile",
    jurisdiction: row.jurisdiction ? String(row.jurisdiction) : null,
    office: row.office ? String(row.office) : null,
    state: row.state ? String(row.state) : null,
    county: row.county ? String(row.county) : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    sourceTable: row.source_table ? String(row.source_table) : null,
    sourceId: row.source_id ? String(row.source_id) : null,
    sourceHash,
    shareSnippet: row.share_snippet
      ? String(row.share_snippet)
      : makeShareSnippet(String(row.official_name ?? ""), String(row.title ?? "Timeline event"), sourceUrl),
    embedAllowed: row.embed_allowed !== false,
  };
}

export async function getDatabaseTimelineEvents(officialId: string): Promise<{
  events: OfficialTimelineEvent[];
  errors: string[];
}> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { events: [], errors: [] };

  const { data, error } = await supabase
    .from("official_timeline_public_events")
    .select("*")
    .eq("official_id", officialId)
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) return { events: [], errors: [error.message] };
  return {
    events: (data ?? []).map((row) => mapDatabaseEvent(row as Record<string, unknown>)),
    errors: [],
  };
}

export function dedupeTimelineEvents(events: OfficialTimelineEvent[]): OfficialTimelineEvent[] {
  const byKey = new Map<string, OfficialTimelineEvent>();

  for (const event of events) {
    const key = event.sourceHash || stableSourceHash(event.officialId, event.eventType, event.sourceUrl, event.title);
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, event);
      continue;
    }
    if (current.status === "source_linked" && event.status !== "source_linked") {
      byKey.set(key, event);
    }
  }

  return Array.from(byKey.values());
}

export function sortTimelineEvents(events: OfficialTimelineEvent[]): OfficialTimelineEvent[] {
  return [...events].sort((a, b) => {
    const aTime = a.eventDate ? new Date(a.eventDate).getTime() : 0;
    const bTime = b.eventDate ? new Date(b.eventDate).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.title.localeCompare(b.title);
  });
}

export function summarizeTimeline(events: OfficialTimelineEvent[]) {
  const eventTypeCounts = events.reduce<Partial<Record<OfficialTimelineEventType, number>>>((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
    return acc;
  }, {});
  const sourceCount = new Set(events.map((event) => event.sourceUrl).filter(Boolean)).size;
  return { eventTypeCounts, sourceCount };
}

export async function getOfficialTimelineBundle(officialId: string): Promise<OfficialTimelineBundle> {
  const official = getOfficialById(officialId);
  if (!official) {
    return {
      official: null,
      events: [],
      staticEventCount: 0,
      databaseEventCount: 0,
      sourceCount: 0,
      eventTypeCounts: {},
      errors: ["Official not found."],
    };
  }

  const profileOverlay = await getPublicProfileOverlay("official", officialId);
  const staticEvents = buildOfficialTimelineFromSources({
    official,
    scoreCard: getScoreCard(officialId),
    funding: getFundingSummary(officialId),
    redFlags: getRedFlags(officialId),
    relatedNews: getNewsByOfficialId(officialId),
    publicVoteRecord: getPublicVoteRecord(officialId),
    profileOverlay,
    congressTrading: getCongressTradingSnapshot(officialId),
  });
  const database = await getDatabaseTimelineEvents(officialId);
  const events = sortTimelineEvents(dedupeTimelineEvents([...database.events, ...staticEvents]));
  const summary = summarizeTimeline(events);

  return {
    official,
    events,
    staticEventCount: staticEvents.length,
    databaseEventCount: database.events.length,
    sourceCount: summary.sourceCount,
    eventTypeCounts: summary.eventTypeCounts,
    errors: database.errors,
  };
}

export function officialTimelineUrl(officialId: string) {
  return `${siteUrl()}/officials/${officialId}/timeline`;
}

export function officialTimelineEmbedCode(officialId: string) {
  return `<iframe src="${siteUrl()}/officials/${officialId}/timeline/embed" title="RepWatchr official timeline" loading="lazy" style="width:100%;height:720px;border:0;border-radius:12px;"></iframe>`;
}
