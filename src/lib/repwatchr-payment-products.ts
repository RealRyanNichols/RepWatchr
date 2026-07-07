import { getRepWatchrService } from "@/data/repwatchr-services";

export type RepWatchrCheckoutMode = "payment" | "subscription";

export type RepWatchrPaymentProduct = {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: "usd";
  mode: RepWatchrCheckoutMode;
  recurringInterval?: "month";
};

const REPWATCHR_PAYMENT_PRODUCTS: Record<string, RepWatchrPaymentProduct> = {
  "quick-record-check": {
    slug: "quick-record-check",
    name: "Quick Record Check",
    description:
      "A narrow public-record check on one official, race claim, school-board issue, vote, filing, or correction request.",
    priceCents: 4900,
    currency: "usd",
    mode: "payment",
  },
  "local-race-source-pack": {
    slug: "local-race-source-pack",
    name: "Local Race Source Pack",
    description:
      "A source-backed packet for one Texas or East Texas race lane, including candidates, filings, public records, and missing-record questions.",
    priceCents: 14900,
    currency: "usd",
    mode: "payment",
  },
  "official-record-brief": {
    slug: "official-record-brief",
    name: "Official Record Brief",
    description:
      "A focused public-record brief for one elected official or public authority figure with source links, votes, money, and open questions.",
    priceCents: 29900,
    currency: "usd",
    mode: "payment",
  },
  "election-watch-desk": {
    slug: "election-watch-desk",
    name: "Election Watch Desk",
    description:
      "A recurring source-watch desk for a local race, county, district, school board, or issue lane during election season.",
    priceCents: 75000,
    currency: "usd",
    mode: "subscription",
    recurringInterval: "month",
  },
};

export function getRepWatchrPaymentProduct(slug: string) {
  const product = REPWATCHR_PAYMENT_PRODUCTS[slug];
  const service = getRepWatchrService(slug);
  if (!product || !service || service.priceCents === 0) return null;

  return product;
}

export function getRepWatchrPaymentProducts() {
  return Object.values(REPWATCHR_PAYMENT_PRODUCTS);
}

export function isRepWatchrServiceCheckoutConfigured() {
  return process.env.ENABLE_PAYMENTS === "true" && Boolean(process.env.STRIPE_SECRET_KEY);
}
