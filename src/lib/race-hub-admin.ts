import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getTexasRaceHubRaces } from "@/lib/race-hub";

type SupabaseAdmin = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

export type AdminRacePageRow = {
  id: string;
  slug: string;
  title: string;
  office: string;
  jurisdiction: string;
  electionDate: string;
  publicStatus: string;
  candidateCount: number;
  sourceCount: number;
  missingCount: number;
  updatedAt: string;
};

export type AdminRaceDeskData = {
  generatedAt: string;
  configured: boolean;
  errors: string[];
  staticRaces: AdminRacePageRow[];
  stagedRows: AdminRacePageRow[];
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function dateText(value: unknown) {
  const raw = text(value);
  if (!raw) return "Not recorded";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString("en-US");
}

function countArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

async function selectRacePages(supabase: SupabaseAdmin | null, errors: string[]) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("race_pages")
    .select("id, slug, title, office, jurisdiction, election_date, public_status, candidates, source_links, missing_records, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) {
    errors.push(`race_pages: ${error.message}`);
    return [];
  }

  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function getAdminRaceDeskData(): Promise<AdminRaceDeskData> {
  const supabase = getSupabaseAdminClient();
  const errors: string[] = [];
  const stagedRows = (await selectRacePages(supabase, errors)).map((row) => ({
    id: text(row.id),
    slug: text(row.slug),
    title: text(row.title),
    office: text(row.office),
    jurisdiction: text(row.jurisdiction),
    electionDate: text(row.election_date, "Pending"),
    publicStatus: text(row.public_status, "staged"),
    candidateCount: countArray(row.candidates),
    sourceCount: countArray(row.source_links),
    missingCount: countArray(row.missing_records),
    updatedAt: dateText(row.updated_at || row.created_at),
  }));

  const staticRaces = getTexasRaceHubRaces().map((race) => ({
    id: race.slug,
    slug: race.slug,
    title: race.title,
    office: race.office,
    jurisdiction: race.jurisdiction,
    electionDate: race.electionDate,
    publicStatus: "static",
    candidateCount: race.candidates.length,
    sourceCount: race.sourceCount,
    missingCount: race.missingRecords.length,
    updatedAt: "Static race model",
  }));

  return {
    generatedAt: new Date().toISOString(),
    configured: Boolean(supabase),
    errors,
    staticRaces,
    stagedRows,
  };
}
