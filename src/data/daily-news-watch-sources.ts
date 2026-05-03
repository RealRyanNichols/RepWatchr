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

export const DAILY_NEWS_WATCH_SOURCES: DailyNewsWatchSource[] = [
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
