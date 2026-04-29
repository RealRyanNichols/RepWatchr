import type { PublicPowerProfile } from "@/types/power-watch";

const checkedAt = "2026-04-29";

const longviewNewsJournalSource = {
  title: "Longview News-Journal contact page",
  url: "https://news-journal.com/services/contact-us/",
  sourceType: "newsroom-contact" as const,
  lastCheckedAt: checkedAt,
};

const tylerPaperSource = {
  title: "Tyler Morning Telegraph contact page",
  url: "https://tylerpaper.com/services/contact-us/",
  sourceType: "newsroom-contact" as const,
  lastCheckedAt: checkedAt,
};

const kltvContactSource = {
  title: "KLTV contact page",
  url: "https://www.kltv.com/about-us/contact-us/",
  sourceType: "newsroom-contact" as const,
  lastCheckedAt: checkedAt,
};

const kltvTeamSource = {
  title: "KLTV meet the team page",
  url: "https://www.kltv.com/about-us/meet-the-team/",
  sourceType: "team-page" as const,
  lastCheckedAt: checkedAt,
};

export const mediaWatchImportPlan = {
  title: "Texas media and newsroom buildout",
  region: "Texas, starting with East Texas",
  summary:
    "RepWatchr will track local news organizations, editors, reporters, publishers, newsroom leadership, public corrections, public ownership, public advertising influence, official relationships, and coverage decisions using newsroom pages, bylines, public filings, article records, and correction requests.",
  sourceLinks: [longviewNewsJournalSource, tylerPaperSource, kltvContactSource, kltvTeamSource],
} as const;

export const mediaWatchProfiles: PublicPowerProfile[] = [
  {
    slug: "longview-news-journal",
    name: "Longview News-Journal",
    kind: "media-company",
    categoryLabel: "Local news company",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Longview-based local news organization with newsroom, opinion, public record, elections, police, education, and local-news coverage sections listed on its public site.",
    whyTracked:
      "Local news companies influence what voters know about officials, courts, schools, police, elections, and public money. RepWatchr will track sourced coverage, corrections, omissions, public ownership, and named newsroom decision-makers.",
    authorityAreas: ["local news coverage", "opinion pages", "public-record coverage", "elections coverage", "letters to the editor"],
    scrutinyAreas: ["source use", "corrections", "ownership", "official relationships", "story selection", "public-record follow-through"],
    profileStatus: "source_seeded",
    buildoutPercent: 32,
    profileImageUrl: "https://news-journal.com/favicon.ico",
    profileImageAlt: "Longview News-Journal public site icon",
    profileImageSource: "Longview News-Journal public website",
    profileImageKind: "company-logo",
    affiliatedPeople: [
      { name: "Justin Wilcox", role: "Regional publisher/HR" },
      { name: "Randy Ferguson", role: "Managing editor", slug: "randy-ferguson" },
      { name: "Jack Stallard", role: "Sports editor", slug: "jack-stallard" },
      { name: "Jordan Green", role: "Reporter", slug: "jordan-green" },
      { name: "Jo Lee Ferguson", role: "Reporter", slug: "jo-lee-ferguson" },
      { name: "Les Hassell", role: "Multimedia photojournalist", slug: "les-hassell" },
    ],
    sourceLinks: [longviewNewsJournalSource],
  },
  {
    slug: "randy-ferguson",
    name: "Randy Ferguson",
    kind: "editor",
    categoryLabel: "Editor",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Managing editor profile seeded from the Longview News-Journal contact page.",
    whyTracked:
      "Editors shape assignment, framing, placement, corrections, and public accountability. This profile is a source bucket for decisions tied to public officials and local institutions.",
    authorityAreas: ["newsroom editing", "assignment influence", "corrections and coverage standards"],
    scrutinyAreas: ["correction history", "coverage decisions", "official relationships", "public-record sourcing"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 20,
    affiliatedOrganizationSlug: "longview-news-journal",
    sourceLinks: [longviewNewsJournalSource],
  },
  {
    slug: "jordan-green",
    name: "Jordan Green",
    kind: "journalist",
    categoryLabel: "Reporter",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Reporter profile seeded from the Longview News-Journal contact page.",
    whyTracked:
      "Reporter pages will connect bylines, public officials covered, source documents, corrections, and reader-submitted record challenges.",
    authorityAreas: ["local reporting", "public-interest coverage"],
    scrutinyAreas: ["byline record", "source links", "corrections", "official relationships"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 18,
    affiliatedOrganizationSlug: "longview-news-journal",
    sourceLinks: [longviewNewsJournalSource],
  },
  {
    slug: "jo-lee-ferguson",
    name: "Jo Lee Ferguson",
    kind: "journalist",
    categoryLabel: "Reporter",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Reporter profile seeded from the Longview News-Journal contact page.",
    whyTracked:
      "Reporter scrutiny must stay tied to public bylines, public corrections, and documented source use. This is the profile bucket for that evidence.",
    authorityAreas: ["local reporting", "public-interest coverage"],
    scrutinyAreas: ["byline record", "source links", "corrections", "official relationships"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 18,
    affiliatedOrganizationSlug: "longview-news-journal",
    sourceLinks: [longviewNewsJournalSource],
  },
  {
    slug: "tyler-morning-telegraph",
    name: "Tyler Morning Telegraph",
    kind: "media-company",
    categoryLabel: "Local news company",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "Tyler-based news organization with public newsroom contact information and named staff on its contact page.",
    whyTracked:
      "Tyler coverage can shape public perception of officials, courts, schools, police, and elections across Smith County and East Texas. RepWatchr will track public sources, corrections, bylines, and ownership context.",
    authorityAreas: ["local news coverage", "opinion pages", "public notices", "elections coverage", "community coverage"],
    scrutinyAreas: ["source use", "corrections", "ownership", "official relationships", "story selection", "public-record follow-through"],
    profileStatus: "source_seeded",
    buildoutPercent: 34,
    profileImageUrl: "https://tylerpaper.com/favicon.ico",
    profileImageAlt: "Tyler Morning Telegraph public site icon",
    profileImageSource: "Tyler Morning Telegraph public website",
    profileImageKind: "company-logo",
    affiliatedPeople: [
      { name: "Justin Wilcox", role: "Regional Publisher - CMG Texas" },
      { name: "Santana Wood", role: "Managing Editor", slug: "santana-wood" },
      { name: "Jennifer Scott", role: "Multimedia Reporter", slug: "jennifer-scott" },
      { name: "Phil Hicks", role: "Sports Editor", slug: "phil-hicks" },
      { name: "Brandon Ogden", role: "Sports Reporter" },
      { name: "Les Hassell", role: "Photojournalist", slug: "les-hassell" },
    ],
    sourceLinks: [tylerPaperSource],
  },
  {
    slug: "santana-wood",
    name: "Santana Wood",
    kind: "editor",
    categoryLabel: "Managing editor",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "Managing editor profile seeded from the Tyler Morning Telegraph contact page.",
    whyTracked:
      "Managing editors influence assignments, framing, corrections, and the public record around local officials and institutions.",
    authorityAreas: ["newsroom editing", "assignment influence", "corrections and standards"],
    scrutinyAreas: ["coverage decisions", "correction history", "source links", "official relationships"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 20,
    affiliatedOrganizationSlug: "tyler-morning-telegraph",
    sourceLinks: [tylerPaperSource],
  },
  {
    slug: "jennifer-scott",
    name: "Jennifer Scott",
    kind: "journalist",
    categoryLabel: "Multimedia reporter",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "Multimedia reporter profile seeded from the Tyler Morning Telegraph contact page.",
    whyTracked:
      "RepWatchr will connect reporter profiles to bylines, public sources, corrections, and official coverage as the media database expands.",
    authorityAreas: ["local reporting", "multimedia reporting"],
    scrutinyAreas: ["byline record", "source links", "corrections", "official relationships"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 18,
    affiliatedOrganizationSlug: "tyler-morning-telegraph",
    sourceLinks: [tylerPaperSource],
  },
  {
    slug: "kltv",
    name: "KLTV",
    kind: "media-company",
    categoryLabel: "Broadcast news company",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "Tyler television news station with public newsroom contact information and a public meet-the-team page.",
    whyTracked:
      "Broadcast news can strongly affect local public perception. RepWatchr will track newsroom leadership, anchors, reporters, source documents, corrections, and coverage of officials and public institutions.",
    authorityAreas: ["broadcast news", "digital news", "weather alerts", "public-affairs coverage"],
    scrutinyAreas: ["source use", "corrections", "ownership", "official relationships", "story selection", "public-record follow-through"],
    profileStatus: "source_seeded",
    buildoutPercent: 36,
    profileImageUrl: "https://www.kltv.com/favicon.ico",
    profileImageAlt: "KLTV public site icon",
    profileImageSource: "KLTV public website",
    profileImageKind: "company-logo",
    affiliatedPeople: [
      { name: "Pat Stacey", role: "VP/General Manager" },
      { name: "Joe Terrell", role: "News Director/Anchor", slug: "joe-terrell" },
      { name: "Katie Vossler", role: "Chief Meteorologist", slug: "katie-vossler" },
      { name: "Anissa Centers", role: "News Anchor" },
      { name: "Blake Holland", role: "Evening Anchor/Reporter" },
      { name: "Lane Luckie", role: "News Anchor" },
    ],
    sourceLinks: [kltvContactSource, kltvTeamSource],
  },
  {
    slug: "joe-terrell",
    name: "Joe Terrell",
    kind: "newsroom-leadership",
    categoryLabel: "News director/anchor",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "KLTV news director and anchor profile seeded from KLTV public contact and team pages.",
    whyTracked:
      "News directors have direct influence over local broadcast priorities, corrections, assignments, framing, and public officials coverage.",
    authorityAreas: ["newsroom leadership", "broadcast anchoring", "coverage standards"],
    scrutinyAreas: ["coverage decisions", "corrections", "official relationships", "source records"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 22,
    affiliatedOrganizationSlug: "kltv",
    sourceLinks: [kltvContactSource, kltvTeamSource],
  },
  {
    slug: "katie-vossler",
    name: "Katie Vossler",
    kind: "journalist",
    categoryLabel: "Chief meteorologist",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "KLTV chief meteorologist profile seeded from KLTV public contact and team pages.",
    whyTracked:
      "Weather leadership can influence emergency communication, public safety information, and broadcast trust. This page is a source bucket for public claims and corrections.",
    authorityAreas: ["weather reporting", "emergency communication", "broadcast public safety"],
    scrutinyAreas: ["source use", "corrections", "public safety claims", "official emergency-management relationships"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 22,
    affiliatedOrganizationSlug: "kltv",
    sourceLinks: [kltvContactSource, kltvTeamSource],
  },
];
