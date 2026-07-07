import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const CORE_FEATURE_FLAGS = [
  "ENABLE_PAYMENTS",
  "ENABLE_AI_SOURCE_REVIEW",
  "ENABLE_EMAIL_SENDING",
  "ENABLE_PUBLIC_API",
  "ENABLE_BETA_PACKAGES",
  "ENABLE_ORGANIZATION_DASHBOARD",
  "ENABLE_ADVANCED_ANALYTICS",
  "ENABLE_EXPORTS",
  "ENABLE_PWA_INSTALL_PROMPT",
] as const;

export type CoreFeatureFlagKey = (typeof CORE_FEATURE_FLAGS)[number];

export type FeatureFlagContext = {
  anonymousId?: string | null;
  userId?: string | null;
};

export type FeatureFlagRow = {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FeatureFlagEvaluation = {
  key: string;
  enabled: boolean;
  source: "env" | "database" | "default";
  rolloutPercentage: number;
};

function normalizeBooleanEnv(value: string | undefined) {
  if (value === undefined) return null;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
}

function hashToBucket(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash % 100;
}

function rolloutAllows(percentage: number, context: FeatureFlagContext = {}) {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;
  const identity = context.userId || context.anonymousId;
  if (!identity) return false;
  return hashToBucket(identity) < percentage;
}

export function normalizeFeatureFlagKey(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120);
}

export async function isFeatureEnabled(key: string, context: FeatureFlagContext = {}): Promise<boolean> {
  return (await evaluateFeatureFlag(key, context)).enabled;
}

export async function evaluateFeatureFlag(key: string, context: FeatureFlagContext = {}): Promise<FeatureFlagEvaluation> {
  const normalizedKey = normalizeFeatureFlagKey(key);
  if (!normalizedKey) return { key: "", enabled: false, source: "default", rolloutPercentage: 0 };

  const envValue = normalizeBooleanEnv(process.env[normalizedKey]);
  if (envValue !== null) {
    return {
      key: normalizedKey,
      enabled: envValue,
      source: "env",
      rolloutPercentage: envValue ? 100 : 0,
    };
  }

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data } = await supabase
      .from("feature_flags")
      .select("*")
      .eq("key", normalizedKey)
      .maybeSingle();

    if (data) {
      const row = data as FeatureFlagRow;
      return {
        key: normalizedKey,
        enabled: row.enabled && rolloutAllows(row.rollout_percentage, context),
        source: "database",
        rolloutPercentage: row.rollout_percentage,
      };
    }
  }

  return { key: normalizedKey, enabled: false, source: "default", rolloutPercentage: 0 };
}

export async function getFeatureFlagSnapshot() {
  const supabase = getSupabaseAdminClient();
  const rows = new Map<string, FeatureFlagRow>();

  if (supabase) {
    const { data } = await supabase.from("feature_flags").select("*").order("key", { ascending: true });
    for (const row of data ?? []) {
      const typed = row as FeatureFlagRow;
      rows.set(typed.key, typed);
    }
  }

  return CORE_FEATURE_FLAGS.map((key) => {
    const row = rows.get(key);
    const envValue = normalizeBooleanEnv(process.env[key]);
    return {
      id: row?.id ?? key,
      key,
      description: row?.description ?? "",
      enabled: envValue ?? row?.enabled ?? false,
      rollout_percentage: envValue === true ? 100 : envValue === false ? 0 : row?.rollout_percentage ?? 0,
      metadata: row?.metadata ?? {},
      source: envValue !== null ? "env" : row ? "database" : "default",
      created_at: row?.created_at ?? "",
      updated_at: row?.updated_at ?? "",
    };
  });
}
