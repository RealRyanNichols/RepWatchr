export type PricingVariantCandidate = {
  key: string;
  priceCents: number;
  billingLabel: "one-time" | "monthly";
  label: string;
};

export type PricingPackageCandidate = {
  packageKey: string;
  name: string;
  billingLabel: "one-time" | "monthly";
  expectedRange: string;
  betaUseCasePrompt: string;
  variants: PricingVariantCandidate[];
};

export const PRICING_PACKAGE_CANDIDATES: PricingPackageCandidate[] = [
  {
    packageKey: "quick-record-check",
    name: "Quick Record Check",
    billingLabel: "one-time",
    expectedRange: "$49-$99",
    betaUseCasePrompt: "One claim, correction, source link, vote, filing, or public-record question.",
    variants: [
      { key: "quick_49", priceCents: 4900, billingLabel: "one-time", label: "$49 one-time" },
      { key: "quick_79", priceCents: 7900, billingLabel: "one-time", label: "$79 one-time" },
      { key: "quick_99", priceCents: 9900, billingLabel: "one-time", label: "$99 one-time" },
    ],
  },
  {
    packageKey: "official-record-brief",
    name: "Official Record Brief",
    billingLabel: "one-time",
    expectedRange: "$199-$499",
    betaUseCasePrompt: "One public official, officeholder, candidate, agency leader, or authority figure.",
    variants: [
      { key: "brief_199", priceCents: 19900, billingLabel: "one-time", label: "$199 one-time" },
      { key: "brief_299", priceCents: 29900, billingLabel: "one-time", label: "$299 one-time" },
      { key: "brief_499", priceCents: 49900, billingLabel: "one-time", label: "$499 one-time" },
    ],
  },
  {
    packageKey: "local-race-source-pack",
    name: "Local Race Source Pack",
    billingLabel: "one-time",
    expectedRange: "$149-$499",
    betaUseCasePrompt: "One race, county, city, school board, district, candidate comparison, or election lane.",
    variants: [
      { key: "race_149", priceCents: 14900, billingLabel: "one-time", label: "$149 one-time" },
      { key: "race_299", priceCents: 29900, billingLabel: "one-time", label: "$299 one-time" },
      { key: "race_499", priceCents: 49900, billingLabel: "one-time", label: "$499 one-time" },
    ],
  },
  {
    packageKey: "election-watch-desk",
    name: "Election Watch Desk",
    billingLabel: "monthly",
    expectedRange: "$500-$1,500/mo",
    betaUseCasePrompt: "Recurring monitoring for an election, county, race, issue lane, or public body.",
    variants: [
      { key: "watch_500", priceCents: 50000, billingLabel: "monthly", label: "$500/mo" },
      { key: "watch_750", priceCents: 75000, billingLabel: "monthly", label: "$750/mo" },
      { key: "watch_1500", priceCents: 150000, billingLabel: "monthly", label: "$1,500/mo" },
    ],
  },
  {
    packageKey: "school-board-monitor",
    name: "School Board Monitor",
    billingLabel: "monthly",
    expectedRange: "$99-$499/mo",
    betaUseCasePrompt: "A school district, board, agenda lane, bond issue, policy issue, or meeting record.",
    variants: [
      { key: "school_99", priceCents: 9900, billingLabel: "monthly", label: "$99/mo" },
      { key: "school_199", priceCents: 19900, billingLabel: "monthly", label: "$199/mo" },
      { key: "school_499", priceCents: 49900, billingLabel: "monthly", label: "$499/mo" },
    ],
  },
];

export function getPricingPackageCandidate(packageKey: string | null | undefined) {
  const cleanKey = packageKey?.trim().toLowerCase();
  return PRICING_PACKAGE_CANDIDATES.find((item) => item.packageKey === cleanKey);
}

export function getPricingPackageOptions() {
  return PRICING_PACKAGE_CANDIDATES.map((item) => ({
    packageKey: item.packageKey,
    name: item.name,
    expectedRange: item.expectedRange,
    billingLabel: item.billingLabel,
  }));
}
