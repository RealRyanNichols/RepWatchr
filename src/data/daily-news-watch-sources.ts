import type { NewsPowerChannel, NewsScope } from "@/types";

export interface DailyNewsWatchSource {
  id: string;
  label: string;
  url: string;
  scope: NewsScope;
  state?: string;
  counties?: string[];
  cities?: string[];
  powerChannels: NewsPowerChannel[];
  sourceType: "public_rss" | "public_news_search";
  terms: string[];
}

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
  scope: code === "TX" ? "texas" : "national",
  state: code,
  powerChannels: ["officials", "elections", "courts", "money"],
  sourceType: "public_news_search",
  terms: stateNewsTerms,
}));

const BASE_DAILY_NEWS_WATCH_SOURCES: DailyNewsWatchSource[] = [
  {
    id: "texas-tribune-main",
    label: "Texas Tribune",
    url: "https://www.texastribune.org/feeds/main/",
    scope: "texas",
    state: "TX",
    powerChannels: ["officials", "school-boards", "elections", "courts", "money"],
    sourceType: "public_rss",
    terms: texasPoliticsTerms,
  },
  {
    id: "google-news-texas-school-boards",
    label: "Public news search: Texas school boards",
    url: "https://news.google.com/rss/search?q=Texas%20school%20board%20OR%20trustee%20OR%20school%20board%20election%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    scope: "texas",
    state: "TX",
    powerChannels: ["school-boards", "elections"],
    sourceType: "public_news_search",
    terms: ["school board", "trustee", "isd", "election", "runoff", "canvass", "superintendent"],
  },
  {
    id: "google-news-east-texas-officials",
    label: "Public news search: East Texas officials",
    url: "https://news.google.com/rss/search?q=%22East%20Texas%22%20%28official%20OR%20mayor%20OR%20sheriff%20OR%20%22county%20judge%22%20OR%20%22school%20board%22%29%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    scope: "east-texas",
    state: "TX",
    counties: ["Gregg", "Harrison", "Smith", "Upshur", "Panola"],
    cities: ["Longview", "Tyler", "Marshall"],
    powerChannels: ["officials", "school-boards", "public-safety", "elections"],
    sourceType: "public_news_search",
    terms: ["official", "mayor", "sheriff", "county judge", "school board", "trustee", "election"],
  },
  {
    id: "google-news-texas-public-safety",
    label: "Public news search: Texas public safety",
    url: "https://news.google.com/rss/search?q=Texas%20%28sheriff%20OR%20police%20chief%20OR%20constable%20OR%20%22district%20attorney%22%29%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    scope: "texas",
    state: "TX",
    powerChannels: ["public-safety", "officials", "courts"],
    sourceType: "public_news_search",
    terms: ["sheriff", "police chief", "constable", "district attorney", "grand jury", "civil rights", "lawsuit"],
  },
  {
    id: "google-news-national-officials",
    label: "Public news search: national elected officials",
    url: "https://news.google.com/rss/search?q=%28%22U.S.%20Representative%22%20OR%20%22U.S.%20Senator%22%20OR%20governor%20OR%20legislature%29%20%28ethics%20OR%20vote%20OR%20investigation%20OR%20funding%20OR%20election%29%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    scope: "national",
    powerChannels: ["officials", "elections", "money"],
    sourceType: "public_news_search",
    terms: ["senator", "representative", "governor", "ethics", "vote", "investigation", "funding", "election"],
  },
];

export const DAILY_NEWS_WATCH_SOURCES: DailyNewsWatchSource[] = [
  ...BASE_DAILY_NEWS_WATCH_SOURCES,
  ...STATE_DAILY_NEWS_WATCH_SOURCES,
];
