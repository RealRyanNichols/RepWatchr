import type { NewsPowerChannel, NewsScope, SourceCredit } from "@/types";

export interface DailyNewsWatchSource {
  id: string;
  label: string;
  url: string;
  queryLane?: string;
  scope: NewsScope;
  state?: string;
  counties?: string[];
  cities?: string[];
  powerChannels: NewsPowerChannel[];
  sourceType: "public_rss" | "public_news_search";
  terms: string[];
  allowDomains?: string[];
  denyDomains?: string[];
  requiredTerms?: string[];
  deniedTerms?: string[];
  acceptQualityScore?: number;
  reviewQualityScore?: number;
  quarantineQualityScore?: number;
  requireJurisdictionMatch?: boolean;
  requireGeographicRelevance?: boolean;
  sourceCredit?: SourceCredit;
}

export const DAILY_WIRE_DEFAULT_DENY_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "reddit.com",
  "x.com",
  "twitter.com",
];

export const DAILY_WIRE_INTERNATIONAL_NOISE_TERMS = [
  "argentina",
  "australia",
  "brazil",
  "britain",
  "canada",
  "china",
  "european parliament",
  "france",
  "gaza",
  "hamas",
  "india",
  "iran",
  "israel",
  "mexico election",
  "nato",
  "parliament",
  "russia",
  "ukraine",
  "united kingdom",
];

const defaultSearchControls = {
  denyDomains: DAILY_WIRE_DEFAULT_DENY_DOMAINS,
  deniedTerms: DAILY_WIRE_INTERNATIONAL_NOISE_TERMS,
  acceptQualityScore: 74,
  reviewQualityScore: 48,
  quarantineQualityScore: 34,
  requireJurisdictionMatch: true,
  requireGeographicRelevance: true,
} satisfies Partial<DailyNewsWatchSource>;

const texasControls = {
  ...defaultSearchControls,
  requiredTerms: ["texas", "tx", "county", "isd", "school board", "state representative", "state senator"],
} satisfies Partial<DailyNewsWatchSource>;

const nationalControls = {
  ...defaultSearchControls,
  requiredTerms: ["u.s.", "us ", "united states", "congress", "senate", "house", "federal", "representative", "senator"],
} satisfies Partial<DailyNewsWatchSource>;

export const DAILY_WIRE_QUERY_LANE_CONTROLS: Record<string, Partial<DailyNewsWatchSource>> = {
  "texas-rss": texasControls,
  "texas-school-boards": {
    ...texasControls,
    requiredTerms: ["texas", "tx", "isd", "school board", "trustee", "school board election"],
  },
  "east-texas-officials": {
    ...texasControls,
    requiredTerms: ["east texas", "longview", "tyler", "marshall", "gregg", "harrison", "smith", "upshur", "panola"],
  },
  "texas-public-safety": {
    ...texasControls,
    requiredTerms: ["texas", "tx", "sheriff", "police chief", "constable", "district attorney"],
  },
  "national-officials": nationalControls,
  "federal-accountability": nationalControls,
  "exposure-wire": {
    ...nationalControls,
    requiredTerms: ["u.s.", "united states", "congress", "senate", "house", "federal", "governor", "mayor", "school board"],
  },
  "uap-official-watch": {
    ...nationalControls,
    requiredTerms: ["tim burchett", "burchett", "uap", "ufo", "congress", "oversight"],
  },
  "uap-congress-transparency": {
    ...nationalControls,
    requiredTerms: ["uap", "ufo", "unidentified anomalous phenomena", "congress", "pentagon"],
  },
};

const texasPoliticsTerms = [
  "school board",
  "trustee",
  "county judge",
  "county commissioner",
  "sheriff",
  "district attorney",
  "state representative",
  "state senator",
  "election",
  "runoff",
  "canvass",
  "ethics",
];

const stateNewsTerms = [
  "state representative",
  "state senator",
  "governor",
  "attorney general",
  "ethics",
  "investigation",
  "lawsuit",
  "vote",
  "campaign finance",
  "resigned",
  "indicted",
];

const federalAttentionTerms = [
  "representative",
  "senator",
  "congress",
  "oversight",
  "hearing",
  "subpoena",
  "whistleblower",
  "investigation",
  "ethics",
  "corruption",
  "fraud",
  "waste",
  "transparency",
  "declassified",
  "uap",
  "ufo",
  "files",
  "release",
];

const exposureTerms = [
  "investigation",
  "ethics",
  "subpoena",
  "whistleblower",
  "lawsuit",
  "indicted",
  "charged",
  "resigned",
  "censure",
  "campaign finance",
  "stock trading",
  "public records",
  "open records",
  "transparency",
  "waste",
  "fraud",
  "abuse",
];

const jonGrossCredit: SourceCredit = {
  name: "Jonathan Gross",
  handle: "@Jon_Gross",
  url: "https://x.com/Jon_Gross",
  note: "Share the original, credit Jonathan Gross, then add RepWatchr source-backed context.",
};

const stateNewsTargets = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
  ["DC", "District of Columbia"],
] as const;

function googleNewsStateUrl(stateName: string) {
  const query = `"${stateName}" ("state representative" OR "state senator" OR governor OR "attorney general") (ethics OR investigation OR lawsuit OR vote OR "campaign finance" OR resigned OR indicted) when:1d`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US%3Aen`;
}

const STATE_DAILY_NEWS_WATCH_SOURCES: DailyNewsWatchSource[] = stateNewsTargets.map(([code, name]) => ({
  id: `google-news-${code.toLowerCase()}-state-officials`,
  label: `Public news search: ${name} state officials`,
  url: googleNewsStateUrl(name),
  queryLane: "state-officials",
  scope: code === "TX" ? "texas" : "national",
  state: code,
  powerChannels: ["officials", "elections", "courts", "money"],
  sourceType: "public_news_search",
  terms: stateNewsTerms,
  ...defaultSearchControls,
  requiredTerms: [name, code, "state representative", "state senator", "governor", "attorney general"],
}));

const BASE_DAILY_NEWS_WATCH_SOURCES: DailyNewsWatchSource[] = [
  {
    id: "texas-tribune-main",
    label: "Texas Tribune",
    url: "https://www.texastribune.org/feeds/main/",
    queryLane: "texas-rss",
    scope: "texas",
    state: "TX",
    powerChannels: ["officials", "school-boards", "elections", "courts", "money"],
    sourceType: "public_rss",
    terms: texasPoliticsTerms,
    ...texasControls,
    allowDomains: ["texastribune.org"],
  },
  {
    id: "google-news-jon-gross-source-watch",
    label: "Jonathan Gross source watch",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('("Jon Gross" OR "Jon_Gross" OR "Jonathan Gross" OR "Rabbi Jonathan Gross") (article OR report OR wrote OR writes OR published OR byline OR DOJ OR "civil rights" OR "Weaponization Working Group" OR "public records" OR accountability OR corruption OR Congress OR representative OR "January 6" OR J6) when:14d')}&hl=en-US&gl=US&ceid=US%3Aen`,
    queryLane: "credited-source-watch",
    scope: "national",
    powerChannels: ["media", "officials", "courts", "money"],
    sourceType: "public_news_search",
    terms: [
      "jon gross",
      "jon_gross",
      "jonathan gross",
      "j6",
      "january 6",
      "doj",
      "weaponization",
      "representative",
      "congress",
      "oversight",
      "corruption",
      "accountability",
      "public records",
      "election",
      "official",
    ],
    ...nationalControls,
    requiredTerms: ["jon gross", "jon_gross", "jonathan gross", "january 6", "j6"],
    sourceCredit: jonGrossCredit,
  },
  {
    id: "google-news-texas-school-boards",
    label: "Public news search: Texas school boards",
    url: "https://news.google.com/rss/search?q=Texas%20school%20board%20OR%20trustee%20OR%20school%20board%20election%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    queryLane: "texas-school-boards",
    scope: "texas",
    state: "TX",
    powerChannels: ["school-boards", "elections"],
    sourceType: "public_news_search",
    terms: ["school board", "trustee", "isd", "election", "runoff", "canvass", "superintendent"],
    ...texasControls,
    requiredTerms: ["texas", "tx", "isd", "school board", "trustee", "school board election"],
  },
  {
    id: "google-news-east-texas-officials",
    label: "Public news search: East Texas officials",
    url: "https://news.google.com/rss/search?q=%22East%20Texas%22%20%28official%20OR%20mayor%20OR%20sheriff%20OR%20%22county%20judge%22%20OR%20%22school%20board%22%29%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    queryLane: "east-texas-officials",
    scope: "east-texas",
    state: "TX",
    counties: ["Gregg", "Harrison", "Smith", "Upshur", "Panola"],
    cities: ["Longview", "Tyler", "Marshall"],
    powerChannels: ["officials", "school-boards", "public-safety", "elections"],
    sourceType: "public_news_search",
    terms: ["official", "mayor", "sheriff", "county judge", "school board", "trustee", "election"],
    ...texasControls,
    requiredTerms: ["east texas", "longview", "tyler", "marshall", "gregg", "harrison", "smith", "upshur", "panola"],
  },
  {
    id: "google-news-texas-public-safety",
    label: "Public news search: Texas public safety",
    url: "https://news.google.com/rss/search?q=Texas%20%28sheriff%20OR%20police%20chief%20OR%20constable%20OR%20%22district%20attorney%22%29%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    queryLane: "texas-public-safety",
    scope: "texas",
    state: "TX",
    powerChannels: ["public-safety", "officials", "courts"],
    sourceType: "public_news_search",
    terms: ["sheriff", "police chief", "constable", "district attorney", "grand jury", "civil rights", "lawsuit"],
    ...texasControls,
    requiredTerms: ["texas", "tx", "sheriff", "police chief", "constable", "district attorney"],
  },
  {
    id: "google-news-national-officials",
    label: "Public news search: national elected officials",
    url: "https://news.google.com/rss/search?q=%28%22U.S.%20Representative%22%20OR%20%22U.S.%20Senator%22%20OR%20governor%20OR%20legislature%29%20%28ethics%20OR%20vote%20OR%20investigation%20OR%20funding%20OR%20election%29%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    queryLane: "national-officials",
    scope: "national",
    powerChannels: ["officials", "elections", "money"],
    sourceType: "public_news_search",
    terms: ["senator", "representative", "governor", "ethics", "vote", "investigation", "funding", "election"],
    ...nationalControls,
  },
  {
    id: "google-news-federal-accountability-wire",
    label: "Public news search: federal accountability wire",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('("U.S. Representative" OR "U.S. Senator" OR Congress) (oversight OR subpoena OR whistleblower OR investigation OR ethics OR corruption OR fraud OR transparency OR "public records") when:1d')}&hl=en-US&gl=US&ceid=US%3Aen`,
    queryLane: "federal-accountability",
    scope: "national",
    powerChannels: ["officials", "courts", "money", "media"],
    sourceType: "public_news_search",
    terms: federalAttentionTerms,
    ...nationalControls,
  },
  {
    id: "google-news-congress-exposure-wire",
    label: "Public news search: representatives exposure wire",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('(representative OR senator OR governor OR mayor OR "school board") (investigation OR ethics OR subpoena OR whistleblower OR lawsuit OR indicted OR charged OR resigned OR censure OR "campaign finance" OR "stock trading" OR "public records") when:1d')}&hl=en-US&gl=US&ceid=US%3Aen`,
    queryLane: "exposure-wire",
    scope: "national",
    powerChannels: ["officials", "elections", "courts", "money"],
    sourceType: "public_news_search",
    terms: exposureTerms,
    ...nationalControls,
    requiredTerms: ["u.s.", "united states", "congress", "senate", "house", "federal", "governor", "mayor", "school board"],
  },
  {
    id: "google-news-tim-burchett-uap-transparency",
    label: "Public news search: Tim Burchett UAP transparency",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('("Tim Burchett" OR Burchett) (UAP OR UFO OR oversight OR transparency OR declassified OR whistleblower OR corruption OR "DOGE" OR "waste fraud abuse") when:7d')}&hl=en-US&gl=US&ceid=US%3Aen`,
    queryLane: "uap-official-watch",
    scope: "national",
    state: "TN",
    powerChannels: ["officials", "media"],
    sourceType: "public_news_search",
    terms: ["tim burchett", "burchett", "uap", "ufo", "oversight", "transparency", "declassified", "whistleblower", "corruption", "doge", "waste", "fraud", "abuse"],
    ...nationalControls,
    requiredTerms: ["tim burchett", "burchett", "uap", "ufo", "congress", "oversight"],
  },
  {
    id: "google-news-uap-congress-transparency",
    label: "Public news search: UAP Congress transparency",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('(UAP OR UFO OR "unidentified anomalous phenomena") (Congress OR representative OR oversight OR Pentagon OR declassified OR transparency OR files) when:1d')}&hl=en-US&gl=US&ceid=US%3Aen`,
    queryLane: "uap-congress-transparency",
    scope: "national",
    powerChannels: ["officials", "media"],
    sourceType: "public_news_search",
    terms: ["uap", "ufo", "unidentified anomalous phenomena", "congress", "representative", "oversight", "pentagon", "declassified", "transparency", "files"],
    ...nationalControls,
    requiredTerms: ["uap", "ufo", "unidentified anomalous phenomena", "congress", "pentagon"],
  },
];

export const DAILY_NEWS_WATCH_SOURCES: DailyNewsWatchSource[] = [
  ...BASE_DAILY_NEWS_WATCH_SOURCES,
  ...STATE_DAILY_NEWS_WATCH_SOURCES,
];
