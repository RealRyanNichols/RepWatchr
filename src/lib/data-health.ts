import {
  getAllNews,
  getAllOfficials,
  getFundingSummary,
  getPublicVoteRecord,
} from "@/lib/data";
import { getSchoolBoardDistricts, getSchoolBoardStats } from "@/lib/school-board-research";

export type DataHealthCheck = {
  id: string;
  label: string;
  provider: string;
  detail: string;
  status: "good" | "warn" | "bad";
  route?: string;
};

function countTexasOfficials() {
  return getAllOfficials().filter((official) => official.state === "TX" || official.jurisdiction === "Texas").length;
}

function countFederalVoteRecords() {
  return getAllOfficials().filter((official) => Boolean(getPublicVoteRecord(official.id))).length;
}

function countFundingRecords() {
  return getAllOfficials().filter((official) => Boolean(getFundingSummary(official.id))).length;
}

export function buildDataHealthChecks(): DataHealthCheck[] {
  const officials = getAllOfficials();
  const news = getAllNews();
  const schoolStats = getSchoolBoardStats();
  const schoolDistricts = getSchoolBoardDistricts();
  const texasOfficials = countTexasOfficials();
  const voteRecords = countFederalVoteRecords();
  const fundingRecords = countFundingRecords();

  return [
    {
      id: "fec-imports",
      label: "FEC imports",
      provider: "Federal Election Commission",
      detail: `${fundingRecords}/${officials.length} loaded officials have campaign-funding summaries.`,
      status: fundingRecords > 0 ? "good" : "warn",
    },
    {
      id: "texas-ethics-imports",
      label: "Texas Ethics Commission imports",
      provider: "Texas Ethics Commission",
      detail: "State campaign-finance imports need a scheduled TEC import lane before Texas profiles are complete.",
      status: "warn",
    },
    {
      id: "open-states-imports",
      label: "Open States imports",
      provider: "Open States",
      detail: `${texasOfficials} Texas officials are loaded; state roll-call coverage still needs import-run telemetry.`,
      status: texasOfficials > 0 ? "warn" : "bad",
    },
    {
      id: "house-senate-roll-calls",
      label: "House/Senate roll calls",
      provider: "Congress.gov / Voteview / official chambers",
      detail: `${voteRecords} officials currently have public vote records mapped.`,
      status: voteRecords > 0 ? "good" : "warn",
    },
    {
      id: "rss-news-wire",
      label: "RSS/news wire imports",
      provider: "Daily Watch Wire",
      detail: `${news.length} local story records are loaded. Wire rows should stay review-gated before public promotion.`,
      status: news.length > 0 ? "good" : "warn",
    },
    {
      id: "school-board-imports",
      label: "School board imports",
      provider: "Texas district/board public pages",
      detail: `${schoolStats.districts} districts and ${schoolStats.candidates} members/candidates are loaded.`,
      status: schoolDistricts.length > 0 ? "good" : "warn",
    },
    {
      id: "source-submission-queue",
      label: "Source submission queue",
      provider: "Supabase source_submissions",
      detail: "Public insert and admin review queue are wired; migration must be applied in production.",
      status: "warn",
      route: "/admin#source-review",
    },
    {
      id: "stripe-webhook-status",
      label: "Stripe webhook status",
      provider: "Stripe",
      detail: "Webhook route handles checkout, subscription, payment-failed, and refund events; live secret must be verified.",
      status: process.env.STRIPE_WEBHOOK_SECRET ? "good" : "warn",
    },
    {
      id: "supabase-connection",
      label: "Supabase connection",
      provider: "Supabase",
      detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Public Supabase URL is configured." : "Supabase public URL is missing.",
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "good" : "warn",
    },
    {
      id: "sitemap-generation",
      label: "Sitemap generation",
      provider: "Next.js XML routes",
      detail: "Sitemap index, typed sitemaps, news sitemap, image sitemap, and robots references are code-backed.",
      status: "good",
      route: "/sitemap.xml",
    },
  ];
}
