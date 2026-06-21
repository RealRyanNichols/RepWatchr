import type {
  CongressTradingProfileSnapshot,
  FundingSummary,
  NewsArticle,
  Official,
  PublicVoteRecord,
  RedFlag,
  ScoreCard,
} from "@/types";
import type { PublicProfileOverlay } from "@/lib/profile-overlays";
import type { ProfileCompletionKey } from "@/lib/profile-completion";

export type DossierSourceKind =
  | "official"
  | "vote"
  | "funding"
  | "meeting"
  | "article"
  | "correction"
  | "red_flag"
  | "disclosure";

export interface DossierSourceLink {
  title: string;
  url: string;
  detail: string;
  kind: DossierSourceKind;
  date?: string | null;
}

export interface DossierSourceGroup {
  id: string;
  title: string;
  description: string;
  links: DossierSourceLink[];
  emptyText: string;
}

export interface DossierTimelineItem {
  id: string;
  date: string;
  title: string;
  detail: string;
  sourceUrl?: string;
  label: string;
}

export interface OfficialDossier {
  sourceCount: number;
  confirmed: string[];
  needsReview: string[];
  plainEnglishSummary: string;
  sourceGroups: DossierSourceGroup[];
  timeline: DossierTimelineItem[];
  publicQuestions: string[];
  scoreStatus: {
    label: string;
    detail: string;
    methodologyDetail: string;
  };
}

interface OfficialDossierInput {
  official: Official;
  scoreCard?: ScoreCard;
  funding?: FundingSummary;
  redFlags: RedFlag[];
  relatedNews: NewsArticle[];
  publicVoteRecord?: PublicVoteRecord;
  overlay: PublicProfileOverlay;
  congressTrading?: CongressTradingProfileSnapshot | null;
  buildoutPercent: number;
  missingItems: ProfileCompletionKey[];
}

function addUniqueLink(links: DossierSourceLink[], next: DossierSourceLink) {
  if (!next.url || links.some((link) => link.url === next.url)) return;
  links.push(next);
}

function uniqueSourceCount(groups: DossierSourceGroup[]) {
  const urls = new Set<string>();
  for (const group of groups) {
    for (const link of group.links) {
      if (link.url) urls.add(link.url);
    }
  }
  return urls.size;
}

function normalizeMissingItem(item: string) {
  return item.replace(/_/g, " ");
}

function isMeetingOrVideo(item: { title: string; sourceName?: string; sourceUrl: string }) {
  return /meeting|agenda|minutes|video|clip|youtube|vimeo|hearing|session/i.test(
    `${item.title} ${item.sourceName ?? ""} ${item.sourceUrl}`,
  );
}

function isCorrectionItem(item: { title: string; summary?: string; sourceName?: string }) {
  return /correction|corrected|errata|update|clarification|retraction/i.test(
    `${item.title} ${item.summary ?? ""} ${item.sourceName ?? ""}`,
  );
}

function dateMs(value: string) {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function addTimelineItem(items: DossierTimelineItem[], item: DossierTimelineItem) {
  if (!item.date || dateMs(item.date) <= 0) return;
  if (items.some((current) => current.id === item.id)) return;
  items.push(item);
}

function buildOfficialLinks(official: Official) {
  const links: DossierSourceLink[] = [];
  official.sourceLinks?.forEach((source) =>
    addUniqueLink(links, {
      title: source.title,
      url: source.url,
      detail: "Official/public profile source attached to this record.",
      kind: "official",
    }),
  );
  if (official.contactInfo.website) {
    addUniqueLink(links, {
      title: "Official website",
      url: official.contactInfo.website,
      detail: "Primary public contact or official website path.",
      kind: "official",
    });
  }
  if (official.photoSourceUrl) {
    addUniqueLink(links, {
      title: "Profile photo source",
      url: official.photoSourceUrl,
      detail: "Public image source used for the profile photo.",
      kind: "official",
    });
  }
  return links;
}

function buildVoteLinks(record?: PublicVoteRecord) {
  const links: DossierSourceLink[] = [];
  record?.sourceLinks.forEach((source) =>
    addUniqueLink(links, {
      title: source.title,
      url: source.url,
      detail: "Public vote-source inventory for this profile.",
      kind: "vote",
      date: record.lastUpdated,
    }),
  );
  record?.votes.slice(0, 12).forEach((vote) =>
    addUniqueLink(links, {
      title: vote.title || vote.question || `${vote.chamber} roll call ${vote.rollCall}`,
      url: vote.sourceUrl,
      detail: `${vote.chamber} roll call ${vote.rollCall} on ${vote.date}. Vote cast: ${vote.voteCast}.`,
      kind: "vote",
      date: vote.date,
    }),
  );
  return links;
}

function buildFundingLinks(funding?: FundingSummary) {
  const links: DossierSourceLink[] = [];
  funding?.sources.forEach((source) =>
    addUniqueLink(links, {
      title: source.name,
      url: source.url,
      detail: `Campaign finance source retrieved ${source.retrievedDate}.`,
      kind: "funding",
      date: source.retrievedDate,
    }),
  );
  return links;
}

function buildArticleLinks(articles: NewsArticle[]) {
  const links: DossierSourceLink[] = [];
  articles.forEach((article) => {
    if (article.sourceUrl) {
      addUniqueLink(links, {
        title: article.sourceName || article.title,
        url: article.sourceUrl,
        detail: article.summary,
        kind: "article",
        date: article.publishedAt,
      });
    }
    article.sourceLinks?.forEach((source) =>
      addUniqueLink(links, {
        title: source.title,
        url: source.url,
        detail: `Source attached to RepWatchr story: ${article.title}`,
        kind: "article",
        date: article.publishedAt,
      }),
    );
  });
  return links;
}

function buildOverlayLinks(overlay: PublicProfileOverlay, kind: DossierSourceKind) {
  const links: DossierSourceLink[] = [];
  overlay.enrichmentItems.forEach((item) => {
    if (kind === "meeting" && !isMeetingOrVideo(item)) return;
    if (kind === "correction" && !isCorrectionItem(item)) return;
    addUniqueLink(links, {
      title: item.title,
      url: item.sourceUrl,
      detail: item.summary || `${item.sourceName} source item.`,
      kind,
      date: item.eventDate,
    });
  });

  if (kind === "meeting") {
    overlay.publicStatements.forEach((statement) =>
      addUniqueLink(links, {
        title: `${statement.platform} public statement`,
        url: statement.statementUrl,
        detail: statement.excerpt || statement.contextNote || "Public statement source.",
        kind: "meeting",
        date: statement.statementDate,
      }),
    );
  }

  return links;
}

function buildRedFlagLinks(redFlags: RedFlag[]) {
  const links: DossierSourceLink[] = [];
  redFlags.forEach((flag) =>
    addUniqueLink(links, {
      title: flag.title,
      url: flag.sourceUrl,
      detail: flag.description,
      kind: "red_flag",
      date: flag.date,
    }),
  );
  return links;
}

function buildDisclosureLinks(congressTrading?: CongressTradingProfileSnapshot | null) {
  const links: DossierSourceLink[] = [];
  if (!congressTrading) return links;
  addUniqueLink(links, {
    title: congressTrading.primaryRow.officialDisclosureName,
    url: congressTrading.primaryRow.officialDisclosureUrl,
    detail: "Official congressional disclosure portal linked for source review.",
    kind: "disclosure",
    date: congressTrading.snapshotDate,
  });
  addUniqueLink(links, {
    title: "Secondary tracker snapshot",
    url: congressTrading.primaryRow.trackerUrl,
    detail: "Secondary tracker row used only as a pointer to disclosure volume and recency.",
    kind: "disclosure",
    date: congressTrading.snapshotDate,
  });
  addUniqueLink(links, {
    title: congressTrading.source.name,
    url: congressTrading.source.url,
    detail: "Snapshot source for the trading disclosure watch panel.",
    kind: "disclosure",
    date: congressTrading.snapshotDate,
  });
  return links;
}

function buildSourceGroups(input: OfficialDossierInput): DossierSourceGroup[] {
  return [
    {
      id: "official",
      title: "Official links",
      description: "Roster, official website, photo, and identity source paths.",
      links: buildOfficialLinks(input.official),
      emptyText: "No official source links are attached yet. Submit the roster, official website, or public contact page.",
    },
    {
      id: "votes",
      title: "Vote links",
      description: "Roll-call, bill, decision, or vote-source records tied to this profile.",
      links: buildVoteLinks(input.publicVoteRecord),
      emptyText: "No static vote links are loaded yet. This is a data gap, not a clean voting record.",
    },
    {
      id: "funding",
      title: "Funding links",
      description: "Campaign finance source files and donor-record paths.",
      links: buildFundingLinks(input.funding),
      emptyText: "No funding source file is loaded yet. Submit an official finance record or request a brief.",
    },
    {
      id: "meeting",
      title: "Meeting/video links",
      description: "Meeting clips, hearings, agendas, minutes, public statements, or video records.",
      links: buildOverlayLinks(input.overlay, "meeting"),
      emptyText: "No meeting, hearing, video, or public-statement source is attached yet.",
    },
    {
      id: "articles",
      title: "Article links",
      description: "Named publication sources and RepWatchr story receipts linked to this profile.",
      links: buildArticleLinks(input.relatedNews),
      emptyText: "No source-linked article is attached to this profile yet.",
    },
    {
      id: "corrections",
      title: "Correction history",
      description: "Public correction, clarification, or update records that changed the profile.",
      links: buildOverlayLinks(input.overlay, "correction"),
      emptyText: "No public correction history is loaded. Use Submit correction to add a source-backed correction.",
    },
    {
      id: "red-flags",
      title: "Red-flag receipts",
      description: "Source links for public questions and review flags.",
      links: buildRedFlagLinks(input.redFlags),
      emptyText: "No source-backed red-flag record is attached.",
    },
    {
      id: "disclosures",
      title: "Disclosure links",
      description: "Official disclosure portals and secondary tracker pointers.",
      links: buildDisclosureLinks(input.congressTrading),
      emptyText: "No congressional trading or disclosure-watch source is attached.",
    },
  ];
}

function buildConfirmedItems(input: OfficialDossierInput, sourceCount: number) {
  const confirmed = [
    `${input.official.name} is listed as ${input.official.position} for ${input.official.jurisdiction}.`,
    `${sourceCount} public source link${sourceCount === 1 ? "" : "s"} are attached across this dossier.`,
  ];

  if (input.scoreCard) {
    confirmed.push(`Issue scorecard loaded: ${input.scoreCard.letterGrade} / ${input.scoreCard.overall}.`);
  }
  if (input.publicVoteRecord) {
    confirmed.push(`${input.publicVoteRecord.summary.totalVotesLoaded.toLocaleString()} public vote rows are loaded.`);
  }
  if (input.funding) {
    confirmed.push(`Campaign funding snapshot loaded for cycle ${input.funding.cycle}.`);
  }
  if (input.redFlags.length > 0) {
    confirmed.push(`${input.redFlags.length} source-backed red-flag review item${input.redFlags.length === 1 ? "" : "s"} loaded.`);
  }
  if (input.relatedNews.length > 0) {
    confirmed.push(`${input.relatedNews.length} source-linked RepWatchr stor${input.relatedNews.length === 1 ? "y" : "ies"} attached.`);
  }

  return confirmed;
}

function buildNeedsReviewItems(input: OfficialDossierInput) {
  const needsReview = input.missingItems.map((item) => `Missing or incomplete: ${normalizeMissingItem(item)}.`);

  if (!input.scoreCard) needsReview.push("No reviewed issue scorecard is published for this profile yet.");
  if (!input.publicVoteRecord) needsReview.push("No static vote or decision snapshot is loaded yet.");
  if (!input.funding) needsReview.push("No campaign finance summary is loaded yet.");
  if (input.overlay.enrichmentItems.length === 0) {
    needsReview.push("No public-record overlay items are attached yet.");
  }
  if (input.buildoutPercent < 100) {
    needsReview.push(`Profile buildout is ${input.buildoutPercent}%, so readers should treat gaps as open source work.`);
  }

  return Array.from(new Set(needsReview)).slice(0, 8);
}

function buildScoreStatus(input: OfficialDossierInput) {
  if (input.scoreCard) {
    const categoryCount = Object.keys(input.scoreCard.categories).length;
    const voteCount = Object.values(input.scoreCard.categories).reduce((total, category) => total + category.votes.length, 0);
    return {
      label: `${input.scoreCard.letterGrade} / ${input.scoreCard.overall}`,
      detail: `${categoryCount} issue categories and ${voteCount.toLocaleString()} scored vote item${voteCount === 1 ? "" : "s"} are attached to the published scorecard.`,
      methodologyDetail:
        "Scores are shown only where RepWatchr has a rule-backed scorecard or public vote source path. The methodology page explains how votes and source gaps should move a public grade.",
    };
  }

  const voteRows = input.publicVoteRecord?.summary.totalVotesLoaded ?? 0;
  return {
    label: "Insufficient scored data",
    detail:
      voteRows > 0
        ? `${voteRows.toLocaleString()} public vote rows are loaded, but reviewed issue scoring rules are not attached yet.`
        : "The profile has not reached the evidence threshold for a scored issue grade.",
    methodologyDetail:
      "RepWatchr should show a gap instead of inventing a grade when source-backed vote, funding, or issue-rule data is missing.",
  };
}

function buildPlainEnglishSummary(input: OfficialDossierInput, sourceCount: number) {
  const scorePhrase = input.scoreCard
    ? `The current published score is ${input.scoreCard.letterGrade} / ${input.scoreCard.overall}.`
    : "RepWatchr does not have enough reviewed score data to publish a final issue grade.";
  const votePhrase = input.publicVoteRecord
    ? `${input.publicVoteRecord.summary.totalVotesLoaded.toLocaleString()} public vote rows are loaded.`
    : "A static vote or decision snapshot is not loaded yet.";
  const fundingPhrase = input.funding ? `A ${input.funding.cycle} funding snapshot is attached.` : "Funding data still needs a source-backed import.";
  const redFlagPhrase =
    input.redFlags.length > 0
      ? `${input.redFlags.length} source-backed red-flag review item${input.redFlags.length === 1 ? "" : "s"} appear lower on the page.`
      : "No source-backed red-flag review item is attached.";

  return `${input.official.name} serves as ${input.official.position} for ${input.official.jurisdiction}. ${scorePhrase} ${votePhrase} ${fundingPhrase} ${redFlagPhrase} The dossier currently has ${sourceCount} public source link${sourceCount === 1 ? "" : "s"}.`;
}

function buildTimeline(input: OfficialDossierInput) {
  const items: DossierTimelineItem[] = [];

  addTimelineItem(items, {
    id: "term-start",
    date: input.official.termStart,
    title: "Term start",
    detail: `${input.official.name} term start listed in the profile source file.`,
    label: "office",
  });
  addTimelineItem(items, {
    id: "term-end",
    date: input.official.termEnd,
    title: "Term end",
    detail: `${input.official.name} term end listed in the profile source file.`,
    label: "office",
  });
  if (input.scoreCard) {
    addTimelineItem(items, {
      id: "scorecard",
      date: input.scoreCard.lastUpdated,
      title: "Scorecard updated",
      detail: `${input.scoreCard.letterGrade} / ${input.scoreCard.overall} scorecard snapshot updated.`,
      label: "score",
    });
  }
  if (input.publicVoteRecord) {
    addTimelineItem(items, {
      id: "vote-record",
      date: input.publicVoteRecord.lastUpdated,
      title: "Vote snapshot updated",
      detail: `${input.publicVoteRecord.summary.totalVotesLoaded.toLocaleString()} public vote rows loaded.`,
      sourceUrl: input.publicVoteRecord.sourceLinks[0]?.url,
      label: "votes",
    });
  }
  if (input.funding) {
    addTimelineItem(items, {
      id: "funding",
      date: input.funding.lastUpdated,
      title: "Funding snapshot updated",
      detail: `Campaign finance snapshot for cycle ${input.funding.cycle}.`,
      sourceUrl: input.funding.sources[0]?.url,
      label: "funding",
    });
  }
  input.redFlags.forEach((flag) =>
    addTimelineItem(items, {
      id: `red-flag-${flag.id}`,
      date: flag.date,
      title: flag.title,
      detail: flag.description,
      sourceUrl: flag.sourceUrl,
      label: "red flag",
    }),
  );
  input.relatedNews.forEach((article) =>
    addTimelineItem(items, {
      id: `article-${article.id}`,
      date: article.publishedAt,
      title: article.title,
      detail: article.summary,
      sourceUrl: article.sourceUrl,
      label: "article",
    }),
  );
  input.overlay.enrichmentItems.forEach((item) => {
    if (!item.eventDate) return;
    addTimelineItem(items, {
      id: `overlay-${item.id}`,
      date: item.eventDate,
      title: item.title,
      detail: item.summary,
      sourceUrl: item.sourceUrl,
      label: item.category.replace(/_/g, " "),
    });
  });
  if (input.congressTrading) {
    addTimelineItem(items, {
      id: "congress-trading",
      date: input.congressTrading.snapshotDate,
      title: "Trading disclosure watch snapshot",
      detail: `${input.congressTrading.primaryRow.transactions.toLocaleString()} tracker transaction rows and ${input.congressTrading.primaryRow.filings.toLocaleString()} disclosure filings highlighted for source review.`,
      sourceUrl: input.congressTrading.primaryRow.officialDisclosureUrl,
      label: "disclosure",
    });
  }

  return items.sort((a, b) => dateMs(b.date) - dateMs(a.date)).slice(0, 10);
}

function buildPublicQuestions(input: OfficialDossierInput) {
  const questions = [
    `What public record best proves ${input.official.name}'s current office, term, and jurisdiction?`,
  ];

  if (input.publicVoteRecord) {
    questions.push(
      `Which roll-call votes should voters inspect first when judging ${input.official.name}'s record, and where are the official source links?`,
    );
  } else {
    questions.push("Where is the public vote, decision, order, or meeting record that should be attached to this profile?");
  }

  if (input.funding) {
    questions.push(
      "Which donor, PAC, vendor, employer, or geography entries explain the money trail, and what official filing supports them?",
    );
  } else {
    questions.push("Which campaign finance filing should be loaded before voters argue about this official's money trail?");
  }

  if (input.redFlags.length > 0) {
    questions.push("What public record answers, confirms, or corrects the red-flag review item shown on this profile?");
  } else {
    questions.push("Is there a public record, meeting clip, vote, filing, or article that should be submitted for review?");
  }

  questions.push("What source would change this profile, and is it official, named news, or only an unverified claim?");

  return questions;
}

export function buildOfficialDossier(input: OfficialDossierInput): OfficialDossier {
  const sourceGroups = buildSourceGroups(input);
  const sourceCount = uniqueSourceCount(sourceGroups);

  return {
    sourceCount,
    confirmed: buildConfirmedItems(input, sourceCount),
    needsReview: buildNeedsReviewItems(input),
    plainEnglishSummary: buildPlainEnglishSummary(input, sourceCount),
    sourceGroups,
    timeline: buildTimeline(input),
    publicQuestions: buildPublicQuestions(input),
    scoreStatus: buildScoreStatus(input),
  };
}
