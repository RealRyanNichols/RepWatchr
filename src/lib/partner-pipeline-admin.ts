import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type PartnerInterestRow = {
  id: string;
  anonymous_id: string | null;
  user_id: string | null;
  name: string;
  email: string;
  organization: string | null;
  title: string | null;
  website: string | null;
  interest_type: string;
  budget_or_check_size: string | null;
  jurisdiction_focus: string | null;
  message: string | null;
  attribution: Record<string, unknown>;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type PartnerPipelineEventRow = {
  id: string;
  partner_interest_id: string;
  event_type: string;
  actor_user_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type PartnerAccountRow = {
  id: string;
  name: string;
  account_type: string;
  website: string | null;
  contact_email: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PartnerPipelineData = {
  leads: PartnerInterestRow[];
  events: PartnerPipelineEventRow[];
  accounts: PartnerAccountRow[];
  stats: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    partnerAccounts: number;
    investorInterest: number;
  };
  errors: string[];
};

const emptyData: PartnerPipelineData = {
  leads: [],
  events: [],
  accounts: [],
  stats: {
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    partnerAccounts: 0,
    investorInterest: 0,
  },
  errors: [],
};

async function countRows(table: string, filters: Record<string, string> = {}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return 0;
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { count } = await query;
  return count ?? 0;
}

export async function getPartnerPipelineData(): Promise<PartnerPipelineData> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ...emptyData, errors: ["Supabase admin client is not configured."] };

  const [leadsResponse, eventsResponse, accountsResponse] = await Promise.all([
    supabase
      .from("partner_interest")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("partner_pipeline_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("partner_accounts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const errors = [
    leadsResponse.error ? `partner_interest: ${leadsResponse.error.message}` : "",
    eventsResponse.error ? `partner_pipeline_events: ${eventsResponse.error.message}` : "",
    accountsResponse.error ? `partner_accounts: ${accountsResponse.error.message}` : "",
  ].filter(Boolean);

  const [totalLeads, newLeads, qualifiedLeads, partnerAccounts, investorInterest] = await Promise.all([
    countRows("partner_interest"),
    countRows("partner_interest", { status: "new" }),
    countRows("partner_interest", { status: "qualified" }),
    countRows("partner_accounts"),
    countRows("partner_interest", { interest_type: "investor" }),
  ]);

  return {
    leads: (leadsResponse.data ?? []) as PartnerInterestRow[],
    events: (eventsResponse.data ?? []) as PartnerPipelineEventRow[],
    accounts: (accountsResponse.data ?? []) as PartnerAccountRow[],
    stats: {
      totalLeads,
      newLeads,
      qualifiedLeads,
      partnerAccounts,
      investorInterest,
    },
    errors,
  };
}
