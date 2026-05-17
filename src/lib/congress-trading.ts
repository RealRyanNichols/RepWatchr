import fs from "fs";
import path from "path";
import type {
  CongressTradingDataset,
  CongressTradingProfileSnapshot,
  CongressTradingRiskLevel,
  CongressTradingTrackerRow,
} from "@/types";

const DATA_DIR = path.join(process.cwd(), "src", "data", "congress-trading");
const RISK_ORDER: Record<CongressTradingRiskLevel, number> = {
  watch: 1,
  high: 2,
  critical: 3,
};

let datasetCache: CongressTradingDataset | null = null;

function readJsonFile<T>(filePath: string): T | undefined {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function getLatestDatasetPath() {
  try {
    const files = fs
      .readdirSync(DATA_DIR)
      .filter((file) => file.startsWith("govtrades-congress-stock-tracker-") && file.endsWith(".json"))
      .sort();
    const latest = files.at(-1);
    return latest ? path.join(DATA_DIR, latest) : null;
  } catch {
    return null;
  }
}

export function getCongressTradingDataset(): CongressTradingDataset | undefined {
  if (datasetCache) return datasetCache;
  const filePath = getLatestDatasetPath();
  if (!filePath) return undefined;
  const dataset = readJsonFile<CongressTradingDataset>(filePath);
  datasetCache = dataset ?? null;
  return dataset;
}

function sortTradingRows(rows: CongressTradingTrackerRow[]) {
  return [...rows].sort((a, b) => {
    const riskDelta = RISK_ORDER[b.riskLevel] - RISK_ORDER[a.riskLevel];
    if (riskDelta !== 0) return riskDelta;
    const transactionDelta = b.transactions - a.transactions;
    if (transactionDelta !== 0) return transactionDelta;
    const filingDelta = b.filings - a.filings;
    if (filingDelta !== 0) return filingDelta;
    return b.lastFilingDate.localeCompare(a.lastFilingDate);
  });
}

export function getCongressTradingSnapshot(
  officialId: string,
): CongressTradingProfileSnapshot | undefined {
  const dataset = getCongressTradingDataset();
  if (!dataset) return undefined;
  const rows = sortTradingRows(
    dataset.records.filter((row) => row.officialId === officialId),
  );
  const primaryRow = rows[0];
  if (!primaryRow) return undefined;

  return {
    officialId,
    snapshotDate: dataset.snapshotDate,
    source: dataset.source,
    officialSources: dataset.officialSources,
    rows,
    primaryRow,
    highestRiskLevel: primaryRow.riskLevel,
  };
}

export function getCongressTradingStats() {
  const dataset = getCongressTradingDataset();
  if (!dataset) {
    return {
      snapshotDate: null,
      trackerPoliticians: 0,
      trackerTransactions: 0,
      rowsParsed: 0,
      matchedCurrentProfiles: 0,
      unmatchedOrFormerProfiles: 0,
      currentProfilesWithRows: 0,
      criticalRows: 0,
      highRows: 0,
      sourceUrls: 0,
    };
  }

  const sourceUrls = new Set([
    dataset.source.url,
    ...dataset.officialSources.map((source) => source.url),
    ...dataset.records.map((row) => row.trackerUrl),
    ...dataset.unmatchedRecords.map((row) => row.trackerUrl),
  ]);

  return {
    snapshotDate: dataset.snapshotDate,
    ...dataset.totals,
    sourceUrls: sourceUrls.size,
  };
}

export function getCongressTradingWatchlist(limit = 12) {
  const dataset = getCongressTradingDataset();
  if (!dataset) return [];
  return sortTradingRows(dataset.records).slice(0, limit);
}
