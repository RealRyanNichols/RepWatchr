import "server-only";
import { createHash } from "crypto";
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

export type CoreFeatureFlag = (typeof CORE_FEATURE_FLAGS)[number];

export type FeatureFlagContext = {
  anonymousId?: string | null;
  userId?: string | null;
  route?: string | null;
};

export type FeatureFlagDecision = {
  key: string;
  enabled: boolean;
  source: "env" | "database" | "default";
  rolloutPercentage: number;
  reason: string;
};

function cleanFlagKey(key: string) {
  return key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 120);
}

function envFlagValue(key: string) {
  const cleanKey = cleanFlagKey(key);
  const direct = process.env[cleanKey];
  const repwatchrScoped = process.env[`REPWATCHR_${cleanKey}`];
  const value = direct ?? repwatchrScoped;
  if (value === undefined) return null;
  return ["1", "true", "yes", "on", "enabled"].includes(value.trim().toLowerCase());
}

function rolloutAllows(key: string, percentage: number, context: FeatureFlagContext = {}) {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;
  const identity = context.userId || context.anonymousId || context.route || "anonymous";
  const digest = createHash("sha256").update(`${key}:${identity}`).digest("hex");
  const bucket = parseInt(digest.slice(0, 8), 16) % 100;
  return bucket < percentage;
}

export function isFeatureEnabledFromEnv(key: string) {
  return envFlagValue(key) === true;
}

export function getEnvironmentFeatureFlagSnapshot() {
  return Object.fromEntries(
    CORE_FEATURE_FLAGS.map((key) => [
      key,
      {
        enabled: isFeatureEnabledFromEnv(key),
        envConfigured: envFlagValue(key) !== null,
      },
    ]),
  ) as Record<CoreFeatureFlag, { enabled: boolean; envConfigured: boolean }>;
}

export async function isFeatureEnabled(
  key: string,
  context: FeatureFlagContext = {},
): Promise<boolean> {
  const decision = await getFeatureFlagDecision(key, context);
  return decision.enabled;
}

export async function getFeatureFlagDecision(
  key: string,
  context: FeatureFlagContext = {},
): Promise<FeatureFlagDecision> {
  const cleanKey = cleanFlagKey(key);
  const envValue = envFlagValue(cleanKey);
  if (envValue !== null) {
    return {
      key: cleanKey,
      enabled: envValue,
      source: "env",
      rolloutPercentage: envValue ? 100 : 0,
      reason: "environment_override",
    };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return {
      key: cleanKey,
      enabled: false,
      source: "default",
      rolloutPercentage: 0,
      reason: "no_database_client",
    };
  }

  const { data, error } = await admin
    .from("feature_flags")
    .select("key, enabled, rollout_percentage")
    .eq("key", cleanKey)
    .maybeSingle();

  if (error || !data) {
    return {
      key: cleanKey,
      enabled: false,
      source: "default",
      rolloutPercentage: 0,
      reason: error?.message ? "database_unavailable" : "missing_flag",
    };
  }

  const rolloutPercentage = Math.max(0, Math.min(100, Number(data.rollout_percentage ?? 0)));
  const enabled = Boolean(data.enabled) && rolloutAllows(cleanKey, rolloutPercentage, context);

  return {
    key: cleanKey,
    enabled,
    source: "database",
    rolloutPercentage,
    reason: Boolean(data.enabled) ? "rollout_evaluated" : "disabled",
  };
}
