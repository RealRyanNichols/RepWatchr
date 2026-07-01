import "server-only";

export type ImportSourceKey =
  | "fec"
  | "congress_gov"
  | "openstates"
  | "texas_ethics_commission"
  | "local_manual_sources";

export type AdapterStatus =
  | "ready"
  | "missing_api_key"
  | "manual_only"
  | "disabled"
  | "not_supported"
  | "error";

export type AdapterResult<T> =
  | {
      ok: true;
      status: "ok";
      data: T;
      message?: string;
    }
  | {
      ok: false;
      status: Exclude<AdapterStatus, "ready" | "manual_only">;
      message: string;
      sourceKey?: string;
      operation?: string;
    };

export type ExternalPerson = {
  externalId: string;
  sourceKey: ImportSourceKey | string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  party?: string | null;
  state?: string | null;
  office?: string | null;
  sourceUrl?: string | null;
  rawPayload?: Record<string, unknown>;
};

export type ExternalRole = {
  externalId: string;
  personExternalId: string;
  sourceKey: ImportSourceKey | string;
  title: string;
  officeLevel?: string | null;
  jurisdiction?: string | null;
  district?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  sourceUrl?: string | null;
  rawPayload?: Record<string, unknown>;
};

export type ExternalBill = {
  externalId: string;
  sourceKey: ImportSourceKey | string;
  title: string;
  billNumber?: string | null;
  jurisdiction?: string | null;
  session?: string | null;
  introducedAt?: string | null;
  sourceUrl?: string | null;
  rawPayload?: Record<string, unknown>;
};

export type ExternalVote = {
  externalId: string;
  sourceKey: ImportSourceKey | string;
  personExternalId?: string | null;
  billExternalId?: string | null;
  votePosition?: string | null;
  voteDate?: string | null;
  chamber?: string | null;
  jurisdiction?: string | null;
  sourceUrl?: string | null;
  rawPayload?: Record<string, unknown>;
};

export type ExternalFundingRecord = {
  externalId: string;
  sourceKey: ImportSourceKey | string;
  candidateName?: string | null;
  committeeName?: string | null;
  counterpartyName?: string | null;
  counterpartyType?: string | null;
  recordType: string;
  amount?: number | null;
  transactionDate?: string | null;
  cycle?: string | null;
  jurisdiction?: string | null;
  state?: string | null;
  sourceUrl?: string | null;
  rawPayload?: Record<string, unknown>;
};

export type NormalizedOfficial = {
  entityType: "official" | "candidate" | "public_official";
  externalId: string;
  sourceKey: string;
  displayName: string;
  slug?: string | null;
  party?: string | null;
  state?: string | null;
  jurisdiction?: string | null;
  officeTitle?: string | null;
  sourceUrl?: string | null;
  confidence: "source_backed" | "imported_needs_review";
  status: "active" | "imported_needs_review";
  rawPayload?: Record<string, unknown>;
};

export type NormalizedVote = {
  externalId: string;
  sourceKey: string;
  officialExternalId?: string | null;
  billExternalId?: string | null;
  votePosition?: string | null;
  voteDate?: string | null;
  category?: string | null;
  sourceUrl?: string | null;
  confidence: "source_backed" | "imported_needs_review";
  status: "active" | "imported_needs_review";
  importRunId?: string | null;
  rawPayload?: Record<string, unknown>;
};

export type NormalizedFundingRecord = {
  externalId: string;
  sourceKey: string;
  candidateName?: string | null;
  committeeName?: string | null;
  counterpartyName?: string | null;
  counterpartyType?: string | null;
  recordType: string;
  amount?: number | null;
  transactionDate?: string | null;
  cycle?: string | null;
  jurisdiction?: string | null;
  state?: string | null;
  sourceUrl: string;
  confidence: "source_backed" | "imported_needs_review";
  status: "active" | "imported_needs_review";
  importRunId?: string | null;
  rawPayload?: Record<string, unknown>;
};

export type AdapterSearchFilters = {
  state?: string | null;
  jurisdiction?: string | null;
  office?: string | null;
  party?: string | null;
  cycle?: string | null;
};

export type ImportBatchParams = {
  importRunId?: string | null;
  dryRun?: boolean;
  limit?: number;
  query?: string | null;
  filters?: AdapterSearchFilters;
};

export type ImportBatchSummary = {
  recordsSeen: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errorsCount: number;
  notes: string[];
};

export type DataImportAdapter = {
  sourceKey: ImportSourceKey;
  displayName: string;
  requiresApiKey: boolean;
  apiKeyEnvVar?: string;
  getStatus(): AdapterStatus;
  healthCheck(): Promise<AdapterResult<{ status: AdapterStatus; configured: boolean; checkedAt: string }>>;
  searchPeople(query: string, filters?: AdapterSearchFilters): Promise<AdapterResult<ExternalPerson[]>>;
  getPerson(externalId: string): Promise<AdapterResult<ExternalPerson | null>>;
  getRolesForPerson(externalId: string): Promise<AdapterResult<ExternalRole[]>>;
  getVotesForPerson(externalId: string): Promise<AdapterResult<ExternalVote[]>>;
  getFundingForPerson(externalId: string): Promise<AdapterResult<ExternalFundingRecord[]>>;
  normalizePerson(person: ExternalPerson): NormalizedOfficial;
  normalizeRole(role: ExternalRole): ExternalRole;
  normalizeVote(vote: ExternalVote, importRunId?: string | null): NormalizedVote;
  normalizeFunding(record: ExternalFundingRecord, importRunId?: string | null): NormalizedFundingRecord;
  importBatch(params?: ImportBatchParams): Promise<AdapterResult<ImportBatchSummary>>;
};

export type DataSourceRegistryEntry = {
  sourceKey: ImportSourceKey;
  displayName: string;
  description: string;
  officialUrl: string;
  apiDocsUrl?: string;
  requiresApiKey: boolean;
  apiKeyEnvVar?: string;
  supportedRecords: string[];
  importCadence: string;
  defaultStatus: "active" | "manual_only" | "planned";
};

export const DATA_IMPORT_SOURCE_REGISTRY: DataSourceRegistryEntry[] = [
  {
    sourceKey: "fec",
    displayName: "Federal Election Commission",
    description: "Federal candidates, committees, receipts, disbursements, reports, and filings.",
    officialUrl: "https://www.fec.gov/data/",
    apiDocsUrl: "https://api.open.fec.gov/developers/",
    requiresApiKey: true,
    apiKeyEnvVar: "FEC_API_KEY",
    supportedRecords: ["candidates", "committees", "receipts", "disbursements", "filings"],
    importCadence: "Nightly or manual batch once the API key is configured.",
    defaultStatus: "planned",
  },
  {
    sourceKey: "congress_gov",
    displayName: "Congress.gov",
    description: "Federal bills, members, actions, committees, and available roll-call metadata.",
    officialUrl: "https://www.congress.gov/",
    apiDocsUrl: "https://api.congress.gov/",
    requiresApiKey: true,
    apiKeyEnvVar: "CONGRESS_API_KEY",
    supportedRecords: ["members", "bills", "actions", "committees", "roll_calls_if_available"],
    importCadence: "Daily or manual batch once the API key is configured.",
    defaultStatus: "planned",
  },
  {
    sourceKey: "openstates",
    displayName: "Open States",
    description: "State legislators, bills, votes, committees, and legislative events.",
    officialUrl: "https://openstates.org/",
    apiDocsUrl: "https://docs.openstates.org/api-v3/",
    requiresApiKey: true,
    apiKeyEnvVar: "OPENSTATES_API_KEY",
    supportedRecords: ["state_legislators", "bills", "votes", "committees", "events"],
    importCadence: "Daily for active states after source/legal review.",
    defaultStatus: "planned",
  },
  {
    sourceKey: "texas_ethics_commission",
    displayName: "Texas Ethics Commission",
    description: "Texas campaign finance and ethics records through manual/import-ready files when automation is not feasible.",
    officialUrl: "https://www.ethics.state.tx.us/",
    requiresApiKey: false,
    supportedRecords: ["campaign_finance_exports", "candidate_reports", "committee_reports", "filings"],
    importCadence: "Manual file import first. Automation requires format-specific review.",
    defaultStatus: "manual_only",
  },
  {
    sourceKey: "local_manual_sources",
    displayName: "Local Manual Sources",
    description: "County elections pages, school board agendas/minutes, city minutes, law-enforcement public information pages, court/public records pages, and uploaded packets.",
    officialUrl: "https://www.repwatchr.com/submit-source",
    requiresApiKey: false,
    supportedRecords: ["county_elections", "school_boards", "city_minutes", "agency_pages", "court_sources", "manual_packets"],
    importCadence: "Manual and admin-reviewed.",
    defaultStatus: "active",
  },
];

function envHasValue(name: string | undefined) {
  if (!name) return false;
  return Boolean(process.env[name]?.trim());
}

function unsupported<T>(sourceKey: string, operation: string): AdapterResult<T> {
  return {
    ok: false,
    status: "not_supported",
    sourceKey,
    operation,
    message: `${operation} is not supported by this adapter yet.`,
  };
}

function missingKey<T>(sourceKey: string, operation: string, envVar?: string): AdapterResult<T> {
  return {
    ok: false,
    status: "missing_api_key",
    sourceKey,
    operation,
    message: `${sourceKey} requires ${envVar ?? "an API key"} before ${operation} can run.`,
  };
}

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

abstract class BaseDataImportAdapter implements DataImportAdapter {
  abstract sourceKey: ImportSourceKey;
  abstract displayName: string;
  abstract requiresApiKey: boolean;
  apiKeyEnvVar?: string;

  getStatus(): AdapterStatus {
    if (this.requiresApiKey && !envHasValue(this.apiKeyEnvVar)) return "missing_api_key";
    return "ready";
  }

  async healthCheck(): Promise<AdapterResult<{ status: AdapterStatus; configured: boolean; checkedAt: string }>> {
    const status = this.getStatus();
    return {
      ok: true,
      status: "ok",
      data: {
        status,
        configured: status !== "missing_api_key",
        checkedAt: new Date().toISOString(),
      },
    };
  }

  async searchPeople(_query: string, _filters: AdapterSearchFilters = {}) {
    if (this.getStatus() === "missing_api_key") {
      return missingKey<ExternalPerson[]>(this.sourceKey, "searchPeople", this.apiKeyEnvVar);
    }
    return unsupported<ExternalPerson[]>(this.sourceKey, "searchPeople");
  }

  async getPerson(_externalId: string) {
    if (this.getStatus() === "missing_api_key") {
      return missingKey<ExternalPerson | null>(this.sourceKey, "getPerson", this.apiKeyEnvVar);
    }
    return unsupported<ExternalPerson | null>(this.sourceKey, "getPerson");
  }

  async getRolesForPerson(_externalId: string) {
    if (this.getStatus() === "missing_api_key") {
      return missingKey<ExternalRole[]>(this.sourceKey, "getRolesForPerson", this.apiKeyEnvVar);
    }
    return unsupported<ExternalRole[]>(this.sourceKey, "getRolesForPerson");
  }

  async getVotesForPerson(_externalId: string) {
    if (this.getStatus() === "missing_api_key") {
      return missingKey<ExternalVote[]>(this.sourceKey, "getVotesForPerson", this.apiKeyEnvVar);
    }
    return unsupported<ExternalVote[]>(this.sourceKey, "getVotesForPerson");
  }

  async getFundingForPerson(_externalId: string) {
    if (this.getStatus() === "missing_api_key") {
      return missingKey<ExternalFundingRecord[]>(this.sourceKey, "getFundingForPerson", this.apiKeyEnvVar);
    }
    return unsupported<ExternalFundingRecord[]>(this.sourceKey, "getFundingForPerson");
  }

  normalizePerson(person: ExternalPerson): NormalizedOfficial {
    return {
      entityType: "official",
      externalId: person.externalId,
      sourceKey: person.sourceKey,
      displayName: person.fullName,
      slug: makeSlug(`${person.fullName}-${person.state ?? person.office ?? person.externalId}`),
      party: person.party ?? null,
      state: person.state ?? null,
      jurisdiction: person.state ?? null,
      officeTitle: person.office ?? null,
      sourceUrl: person.sourceUrl ?? null,
      confidence: "imported_needs_review",
      status: "imported_needs_review",
      rawPayload: person.rawPayload,
    };
  }

  normalizeRole(role: ExternalRole) {
    return role;
  }

  normalizeVote(vote: ExternalVote, importRunId?: string | null): NormalizedVote {
    return {
      externalId: vote.externalId,
      sourceKey: vote.sourceKey,
      officialExternalId: vote.personExternalId ?? null,
      billExternalId: vote.billExternalId ?? null,
      votePosition: vote.votePosition ?? null,
      voteDate: vote.voteDate ?? null,
      category: vote.chamber ?? null,
      sourceUrl: vote.sourceUrl ?? null,
      confidence: "imported_needs_review",
      status: "imported_needs_review",
      importRunId: importRunId ?? null,
      rawPayload: vote.rawPayload,
    };
  }

  normalizeFunding(record: ExternalFundingRecord, importRunId?: string | null): NormalizedFundingRecord {
    return {
      externalId: record.externalId,
      sourceKey: record.sourceKey,
      candidateName: record.candidateName ?? null,
      committeeName: record.committeeName ?? null,
      counterpartyName: record.counterpartyName ?? null,
      counterpartyType: record.counterpartyType ?? null,
      recordType: record.recordType,
      amount: record.amount ?? null,
      transactionDate: record.transactionDate ?? null,
      cycle: record.cycle ?? null,
      jurisdiction: record.jurisdiction ?? null,
      state: record.state ?? null,
      sourceUrl: record.sourceUrl ?? "",
      confidence: "imported_needs_review",
      status: "imported_needs_review",
      importRunId: importRunId ?? null,
      rawPayload: record.rawPayload,
    };
  }

  async importBatch(_params: ImportBatchParams = {}) {
    if (this.getStatus() === "missing_api_key") {
      return missingKey<ImportBatchSummary>(this.sourceKey, "importBatch", this.apiKeyEnvVar);
    }
    return unsupported<ImportBatchSummary>(this.sourceKey, "importBatch");
  }
}

class FecAdapter extends BaseDataImportAdapter {
  sourceKey = "fec" as const;
  displayName = "Federal Election Commission";
  requiresApiKey = true;
  apiKeyEnvVar = "FEC_API_KEY";
}

class CongressGovAdapter extends BaseDataImportAdapter {
  sourceKey = "congress_gov" as const;
  displayName = "Congress.gov";
  requiresApiKey = true;
  apiKeyEnvVar = "CONGRESS_API_KEY";
}

class OpenStatesAdapter extends BaseDataImportAdapter {
  sourceKey = "openstates" as const;
  displayName = "Open States";
  requiresApiKey = true;
  apiKeyEnvVar = "OPENSTATES_API_KEY";
}

class TexasEthicsCommissionAdapter extends BaseDataImportAdapter {
  sourceKey = "texas_ethics_commission" as const;
  displayName = "Texas Ethics Commission";
  requiresApiKey = false;

  getStatus(): AdapterStatus {
    const mode = process.env.TEC_IMPORT_MODE?.trim().toLowerCase() || "manual";
    return mode === "disabled" ? "disabled" : "manual_only";
  }

  async importBatch(_params: ImportBatchParams = {}) {
    return {
      ok: false as const,
      status: "not_supported" as const,
      sourceKey: this.sourceKey,
      operation: "importBatch",
      message: "Texas Ethics Commission imports are manual/file-ready until the export format is mapped and reviewed.",
    };
  }
}

class LocalManualSourcesAdapter extends BaseDataImportAdapter {
  sourceKey = "local_manual_sources" as const;
  displayName = "Local Manual Sources";
  requiresApiKey = false;

  getStatus(): AdapterStatus {
    return "manual_only";
  }

  async searchPeople(_query: string, _filters: AdapterSearchFilters = {}) {
    return {
      ok: true as const,
      status: "ok" as const,
      data: [],
      message: "Manual sources are reviewed through source submissions and packet imports, not remote search.",
    };
  }

  async importBatch(params: ImportBatchParams = {}) {
    return {
      ok: true as const,
      status: "ok" as const,
      data: {
        recordsSeen: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errorsCount: 0,
        notes: [
          "Local manual source adapter is wired end-to-end.",
          "Use source submissions, public-record response intake, or admin packet review to attach records.",
          params.dryRun ? "Dry run completed with no database mutations." : "Manual adapter does not mutate records automatically.",
        ],
      },
    };
  }
}

const ADAPTERS: DataImportAdapter[] = [
  new FecAdapter(),
  new CongressGovAdapter(),
  new OpenStatesAdapter(),
  new TexasEthicsCommissionAdapter(),
  new LocalManualSourcesAdapter(),
];

export function getAllDataImportAdapters() {
  return ADAPTERS;
}

export function getDataImportAdapter(sourceKey: string) {
  return ADAPTERS.find((adapter) => adapter.sourceKey === sourceKey) ?? null;
}

export function getDataSourceRegistryStatus() {
  return DATA_IMPORT_SOURCE_REGISTRY.map((entry) => {
    const adapter = getDataImportAdapter(entry.sourceKey);
    const adapterStatus = adapter?.getStatus() ?? "not_supported";
    return {
      ...entry,
      adapterStatus,
      apiKeyConfigured: entry.apiKeyEnvVar ? envHasValue(entry.apiKeyEnvVar) : null,
      apiKeyLabel: entry.apiKeyEnvVar ? `${entry.apiKeyEnvVar}=present/missing only` : "not required",
    };
  });
}
