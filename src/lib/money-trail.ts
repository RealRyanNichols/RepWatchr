import { getAllOfficials, getFundingSummary, getOfficialById } from "@/lib/data";
import { getCampaignFinanceSourcePath, hasCampaignFinanceSourcePath } from "@/lib/campaign-finance-sources";
import type { DataSource, FundingSummary, Official } from "@/types";

export type FinanceRecordType =
  | "contribution"
  | "expenditure"
  | "loan"
  | "refund"
  | "in_kind"
  | "transfer"
  | "debt"
  | "filing"
  | "report_summary"
  | "contract"
  | "payment"
  | "procurement"
  | "invoice"
  | "grant"
  | "award"
  | "reimbursement"
  | "other";

export type CounterpartyType =
  | "individual"
  | "PAC"
  | "committee"
  | "business"
  | "union"
  | "nonprofit"
  | "candidate"
  | "party"
  | "vendor"
  | "government_entity"
  | "unknown";

export type FinanceConfidence = "source_backed" | "needs_review" | "official_record" | "aggregate_source" | "missing_source";

export type FinanceRecord = {
  id: string;
  entityId?: string;
  entityType?: string;
  raceId?: string;
  committeeName?: string;
  candidateName?: string;
  counterpartyName?: string;
  counterpartyType: CounterpartyType;
  recordType: FinanceRecordType;
  amount?: number;
  transactionDate?: string;
  cycle?: string;
  jurisdiction?: string;
  state?: string;
  sourceUrl: string;
  sourceLabel: string;
  sourceKey?: string;
  externalId?: string;
  confidence: FinanceConfidence;
  status: "active" | "needs_review" | "archived" | "hidden";
  note: string;
};

export type CommitteeRecord = {
  id: string;
  name: string;
  slug: string;
  committeeType: "candidate_committee" | "officeholder_account" | "PAC" | "source_path" | "unknown";
  jurisdiction?: string;
  state?: string;
  officialUrl?: string;
  sourceUrl?: string;
  status: "active" | "needs_review";
  officialIds: string[];
  sourceCount: number;
};

export type DonorEntity = {
  id: string;
  name: string;
  slug: string;
  donorType: CounterpartyType;
  jurisdiction?: string;
  state?: string;
  sourceUrl?: string;
  status: "active" | "needs_review";
  totalAmount: number;
  recordCount: number;
  officialIds: string[];
  sources: Array<{ label: string; url: string }>;
};

export type VendorRecord = {
  id: string;
  entityId?: string;
  agencyId?: string;
  vendorName: string;
  amount?: number;
  transactionDate?: string;
  recordType?: FinanceRecordType;
  contractOrInvoice?: string;
  sourceUrl: string;
  confidence: FinanceConfidence;
  status: "active" | "needs_review" | "hidden";
  note: string;
};

export type MoneySourceGap = {
  id: string;
  label: string;
  priority: "high" | "medium" | "low";
  why: string;
  submitUrl: string;
};

export type MoneyTrailDossier = {
  official: Official;
  funding?: FundingSummary;
  records: FinanceRecord[];
  contributions: FinanceRecord[];
  expenditures: FinanceRecord[];
  committees: CommitteeRecord[];
  donorEntities: DonorEntity[];
  vendorRecords: VendorRecord[];
  sourceGaps: MoneySourceGap[];
  totalRecords: number;
  totalAmount?: number;
  cycles: string[];
  sourceCount: number;
  lastUpdated?: string;
  confidenceLabel: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function primarySource(funding?: FundingSummary): DataSource | undefined {
  return funding?.sources[0];
}

function fallbackFinanceSource(funding?: FundingSummary): DataSource {
  return {
    name: "Campaign finance public data source",
    url: "https://www.fec.gov/data/",
    retrievedDate: funding?.lastUpdated ?? new Date().toISOString().slice(0, 10),
  };
}

function sourceLabel(source?: DataSource) {
  return source?.name || "Campaign finance source";
}

function sourceUrl(source?: DataSource) {
  return source?.url || "https://www.fec.gov/data/";
}

function counterpartyTypeFromDonor(type: string): CounterpartyType {
  if (type === "pac") return "PAC";
  if (type === "corporation") return "business";
  if (type === "party") return "party";
  if (type === "individual") return "individual";
  return "unknown";
}

function officialState(official: Official) {
  if (official.state) return official.state;
  if (official.jurisdiction.toLowerCase().includes("texas")) return "TX";
  return undefined;
}

function committeeTypeForSource(source: DataSource): CommitteeRecord["committeeType"] {
  const text = `${source.name} ${source.url}`.toLowerCase();
  if (text.includes("pac")) return "PAC";
  if (text.includes("committee") || text.includes("fec.gov/data/committee")) return "candidate_committee";
  if (text.includes("ethics") || text.includes("transparencyusa")) return "source_path";
  return "unknown";
}

function committeeNameForSource(official: Official, source: DataSource) {
  const sourceText = `${source.name} ${source.url}`.toLowerCase();
  if (sourceText.includes("fec.gov/data/committee")) {
    const match = source.url.match(/committee\/([^/?#]+)/i);
    return match?.[1] ? `${official.name} committee profile ${match[1]}` : `${official.name} FEC committee profile`;
  }
  if (sourceText.includes("ethics")) return `${official.name} Texas Ethics Commission filing source`;
  if (sourceText.includes("transparencyusa")) return `${official.name} Transparency USA filing source`;
  return `${official.name} ${source.name}`;
}

function reportSummaryRecords(official: Official, funding: FundingSummary): FinanceRecord[] {
  const source = primarySource(funding) ?? fallbackFinanceSource(funding);
  const base = {
    entityId: official.id,
    entityType: "official",
    committeeName: committeeNameForSource(official, source),
    candidateName: official.name,
    counterpartyType: "committee" as CounterpartyType,
    recordType: "report_summary" as FinanceRecordType,
    transactionDate: funding.lastUpdated,
    cycle: funding.cycle,
    jurisdiction: official.jurisdiction,
    state: officialState(official),
    sourceUrl: sourceUrl(source),
    sourceLabel: sourceLabel(source),
    sourceKey: source.name,
    confidence: "aggregate_source" as FinanceConfidence,
    status: "active" as const,
  };

  return [
    {
      ...base,
      id: `${official.id}-summary-raised-${funding.cycle}`,
      counterpartyName: "Total raised",
      amount: funding.totalRaised,
      note: "Aggregate receipt total from a public campaign finance source. This is not a finding of wrongdoing.",
    },
    {
      ...base,
      id: `${official.id}-summary-spent-${funding.cycle}`,
      counterpartyName: "Total spent",
      amount: funding.totalSpent,
      note: "Aggregate spending total from a public campaign finance source. Itemized payees still need review.",
    },
    {
      ...base,
      id: `${official.id}-summary-cash-${funding.cycle}`,
      counterpartyName: "Cash on hand",
      amount: funding.cashOnHand,
      note: "Cash-on-hand snapshot from the public finance source for this cycle.",
    },
  ];
}

function contributionRecords(official: Official, funding: FundingSummary): FinanceRecord[] {
  const source = primarySource(funding);
  return funding.topDonors.map((donor, index) => ({
    id: `${official.id}-contribution-${slugify(donor.name)}-${index + 1}`,
    entityId: official.id,
    entityType: "official",
    committeeName: source ? committeeNameForSource(official, source) : `${official.name} campaign finance source`,
    candidateName: official.name,
    counterpartyName: donor.name,
    counterpartyType: counterpartyTypeFromDonor(donor.type),
    recordType: "contribution",
    amount: donor.totalAmount,
    transactionDate: funding.lastUpdated,
    cycle: funding.cycle,
    jurisdiction: official.jurisdiction,
    state: donor.state || officialState(official),
    sourceUrl: sourceUrl(source),
    sourceLabel: sourceLabel(source),
    sourceKey: source?.name,
    confidence: "aggregate_source",
    status: "active",
    note: [
      "Donor/source aggregate from a public campaign finance file.",
      donor.occupation ? `Occupation label: ${donor.occupation}.` : "",
      donor.employer ? `Employer label: ${donor.employer}.` : "",
      "Do not treat this as proof of control, corruption, or agreement by itself.",
    ]
      .filter(Boolean)
      .join(" "),
  }));
}

function committeeRecords(official: Official, funding?: FundingSummary): CommitteeRecord[] {
  if (!funding?.sources.length) return [];
  return funding.sources.map((source, index) => {
    const name = committeeNameForSource(official, source);
    return {
      id: `${official.id}-committee-${index + 1}`,
      name,
      slug: slugify(name),
      committeeType: committeeTypeForSource(source),
      jurisdiction: official.jurisdiction,
      state: officialState(official),
      officialUrl: source.url,
      sourceUrl: source.url,
      status: "active",
      officialIds: [official.id],
      sourceCount: 1,
    };
  });
}

function moneySourceGaps(official: Official, funding: FundingSummary | undefined, committees: CommitteeRecord[]): MoneySourceGap[] {
  const gaps: MoneySourceGap[] = [];
  const sourcePath = getCampaignFinanceSourcePath(official);

  if (!funding) {
    gaps.push({
      id: `${official.id}-missing-finance-summary`,
      label: "Missing finance summary",
      priority: "high",
      why: "RepWatchr has a source path, but totals, donor rows, spend rows, and cash-on-hand have not been matched to a public filing yet.",
      submitUrl: `/submit-source?target=${encodeURIComponent(official.id)}&type=funding_record`,
    });
  }

  if (!funding?.cycle) {
    gaps.push({
      id: `${official.id}-missing-cycle`,
      label: "Missing cycle",
      priority: "medium",
      why: "Campaign finance records need a clear cycle or filing period before readers can compare candidates fairly.",
      submitUrl: `/submit-source?target=${encodeURIComponent(official.id)}&type=funding_cycle`,
    });
  }

  if (committees.length === 0) {
    gaps.push({
      id: `${official.id}-missing-committee-link`,
      label: "Missing committee link",
      priority: "high",
      why: "The candidate, officeholder account, PAC, or committee source should be linked before donor or spending records are treated as complete.",
      submitUrl: `/submit-source?target=${encodeURIComponent(official.id)}&type=committee_link`,
    });
  }

  if (!funding?.sources.length && sourcePath.sources.length === 0) {
    gaps.push({
      id: `${official.id}-missing-filing-source`,
      label: "Missing filing source",
      priority: "high",
      why: "A public campaign finance portal, filing, or report URL is required before RepWatchr publishes money rows.",
      submitUrl: `/submit-source?target=${encodeURIComponent(official.id)}&type=finance_source`,
    });
  }

  if (!funding || funding.totalSpent > 0) {
    gaps.push({
      id: `${official.id}-missing-itemized-expenditures`,
      label: "Missing itemized expenditures",
      priority: "medium",
      why: "Total spending is useful, but itemized payees/vendors are needed for a real public money trail.",
      submitUrl: `/submit-source?target=${encodeURIComponent(official.id)}&type=expenditure_record`,
    });
  }

  return gaps;
}

function donorEntitiesForRecords(records: FinanceRecord[]): DonorEntity[] {
  const map = new Map<string, DonorEntity>();
  for (const record of records.filter((item) => item.recordType === "contribution" && item.counterpartyName)) {
    const name = record.counterpartyName!;
    const slug = slugify(name);
    const existing = map.get(slug);
    if (existing) {
      existing.totalAmount += record.amount ?? 0;
      existing.recordCount += 1;
      if (record.entityId && !existing.officialIds.includes(record.entityId)) existing.officialIds.push(record.entityId);
      if (!existing.sources.some((source) => source.url === record.sourceUrl)) existing.sources.push({ label: record.sourceLabel, url: record.sourceUrl });
      continue;
    }
    map.set(slug, {
      id: slug,
      name,
      slug,
      donorType: record.counterpartyType,
      jurisdiction: record.jurisdiction,
      state: record.state,
      sourceUrl: record.sourceUrl,
      status: "active",
      totalAmount: record.amount ?? 0,
      recordCount: 1,
      officialIds: record.entityId ? [record.entityId] : [],
      sources: [{ label: record.sourceLabel, url: record.sourceUrl }],
    });
  }
  return [...map.values()].sort((a, b) => b.totalAmount - a.totalAmount || a.name.localeCompare(b.name));
}

export function getMoneyTrailForOfficial(officialId: string): MoneyTrailDossier | undefined {
  const official = getOfficialById(officialId);
  if (!official) return undefined;

  const funding = getFundingSummary(officialId);
  const records = funding ? [...reportSummaryRecords(official, funding), ...contributionRecords(official, funding)] : [];
  const committees = committeeRecords(official, funding);
  const sourcePath = getCampaignFinanceSourcePath(official);
  const sourceGaps = moneySourceGaps(official, funding, committees);
  const cycles = [...new Set(records.map((record) => record.cycle).filter((cycle): cycle is string => Boolean(cycle)))];
  const sourceCount = new Set([
    ...records.map((record) => record.sourceUrl),
    ...committees.map((committee) => committee.sourceUrl).filter(Boolean),
    ...sourcePath.sources.map((source) => source.url),
  ]).size;

  return {
    official,
    funding,
    records,
    contributions: records.filter((record) => record.recordType === "contribution"),
    expenditures: records.filter((record) => record.recordType === "expenditure"),
    committees,
    donorEntities: donorEntitiesForRecords(records),
    vendorRecords: [],
    sourceGaps,
    totalRecords: records.length,
    totalAmount: funding?.totalRaised,
    cycles: funding?.cycle ? [funding.cycle] : cycles,
    sourceCount,
    lastUpdated: funding?.lastUpdated,
    confidenceLabel: funding ? "Source-backed public filing summary" : "Source path loaded; filing review needed",
  };
}

export function getAllMoneyTrailDossiers() {
  return getAllOfficials()
    .filter((official) => Boolean(getFundingSummary(official.id)) || hasCampaignFinanceSourcePath(official))
    .map((official) => getMoneyTrailForOfficial(official.id))
    .filter((trail): trail is MoneyTrailDossier => Boolean(trail));
}

export function getAllFinanceRecords() {
  return getAllMoneyTrailDossiers().flatMap((trail) => trail.records);
}

export function getAllCommitteeRecords(): CommitteeRecord[] {
  const map = new Map<string, CommitteeRecord>();
  for (const committee of getAllMoneyTrailDossiers().flatMap((trail) => trail.committees)) {
    const existing = map.get(committee.slug);
    if (existing) {
      existing.sourceCount += committee.sourceCount;
      for (const officialId of committee.officialIds) {
        if (!existing.officialIds.includes(officialId)) existing.officialIds.push(officialId);
      }
      continue;
    }
    map.set(committee.slug, { ...committee });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getCommitteeRecordBySlug(slug: string) {
  return getAllCommitteeRecords().find((committee) => committee.slug === slug);
}

export function getAllDonorEntities() {
  return donorEntitiesForRecords(getAllFinanceRecords());
}

export function getDonorEntityBySlug(slug: string) {
  return getAllDonorEntities().find((entity) => entity.slug === slug);
}

export function getMoneyTrailsForOfficials(officialIds: string[]) {
  return officialIds
    .map((officialId) => getMoneyTrailForOfficial(officialId))
    .filter((trail): trail is MoneyTrailDossier => Boolean(trail));
}
