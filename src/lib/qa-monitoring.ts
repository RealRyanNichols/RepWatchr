import { getFeatureFlagSnapshot } from "@/lib/feature-flags";
import { cleanText } from "@/lib/source-submissions";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type QualityStatus = "pass" | "warn" | "fail" | "not_verified";

export type QualityCheck = {
  key: string;
  label: string;
  status: QualityStatus;
  detail: string;
  routeOrFile?: string;
  credentialNeeded?: boolean;
  businessDecisionNeeded?: boolean;
  recommendation?: string;
};

export type RouteSmokeTarget = {
  label: string;
  path: string;
  type: "public" | "private" | "api" | "seo";
  expected: "exists" | "gap" | "dynamic";
  shouldIndex: boolean;
  allowRedirect?: boolean;
  checkText?: string;
  sourceFile?: string;
  note: string;
};

export type AppErrorLogContext = {
  errorType?: string;
  route?: string;
  userId?: string | null;
  anonymousId?: string | null;
  severity?: "debug" | "info" | "warn" | "error" | "critical";
  metadata?: Record<string, unknown>;
};

export type AppErrorLogRow = {
  id: string;
  error_type: string | null;
  message: string;
  stack: string | null;
  route: string | null;
  user_id: string | null;
  anonymous_id: string | null;
  severity: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

const secretPublicEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_OPENAI_API_KEY",
  "NEXT_PUBLIC_RESEND_API_KEY",
  "NEXT_PUBLIC_SENDGRID_API_KEY",
  "NEXT_PUBLIC_POSTMARK_API_KEY",
];

const routeSmokeTargets: RouteSmokeTarget[] = [
  {
    label: "Homepage",
    path: "/",
    type: "public",
    expected: "exists",
    shouldIndex: true,
    checkText: "RepWatchr",
    sourceFile: "src/app/page.tsx",
    note: "Primary public entry point.",
  },
  {
    label: "Search",
    path: "/search",
    type: "public",
    expected: "gap",
    shouldIndex: false,
    checkText: "Search",
    sourceFile: "src/app/search/page.tsx",
    note: "Current route redirects to /faretta-ai and is noindex; it does not yet satisfy the public search-page requirement.",
  },
  {
    label: "Officials",
    path: "/officials",
    type: "public",
    expected: "exists",
    shouldIndex: true,
    checkText: "official",
    sourceFile: "src/app/officials/page.tsx",
    note: "Public official search and listing page.",
  },
  {
    label: "Sample official profile",
    path: "/officials/ted-cruz",
    type: "public",
    expected: "dynamic",
    shouldIndex: true,
    checkText: "Ted Cruz",
    sourceFile: "src/app/officials/[id]/page.tsx",
    note: "Representative dynamic profile smoke target.",
  },
  {
    label: "Submit source",
    path: "/submit-source",
    type: "public",
    expected: "exists",
    shouldIndex: true,
    checkText: "source",
    sourceFile: "src/app/submit-source/page.tsx",
    note: "Primary public source-intake route.",
  },
  {
    label: "Free packet",
    path: "/free-packet",
    type: "public",
    expected: "exists",
    shouldIndex: true,
    checkText: "packet",
    sourceFile: "src/app/free-packet/page.tsx",
    note: "Low-friction source packet growth path.",
  },
  {
    label: "Source packet tool alias",
    path: "/tools/source-packet-builder",
    type: "public",
    expected: "gap",
    shouldIndex: false,
    sourceFile: "src/app/tools/source-packet-builder/page.tsx",
    note: "Prompted route is not currently implemented; alias or canonical redirect should be added deliberately.",
  },
  {
    label: "Public records request tool",
    path: "/tools/public-records-request",
    type: "public",
    expected: "gap",
    shouldIndex: false,
    sourceFile: "src/app/tools/public-records-request/page.tsx",
    note: "Prompted route is not currently implemented; existing response-intake route is separate.",
  },
  {
    label: "Public records response intake",
    path: "/tools/public-records-response",
    type: "public",
    expected: "exists",
    shouldIndex: true,
    checkText: "records",
    sourceFile: "src/app/tools/public-records-response/page.tsx",
    note: "Response intake route should save private-by-default review items.",
  },
  {
    label: "Services index",
    path: "/services",
    type: "public",
    expected: "exists",
    shouldIndex: true,
    checkText: "services",
    sourceFile: "src/app/services/page.tsx",
    note: "Public package and service overview.",
  },
  {
    label: "Quick Record Check service",
    path: "/services/quick-record-check",
    type: "public",
    expected: "dynamic",
    shouldIndex: true,
    checkText: "Quick",
    sourceFile: "src/app/services/[slug]/page.tsx",
    note: "Canonical service slug route.",
  },
  {
    label: "Prompted packages route",
    path: "/packages/quick-record-check",
    type: "public",
    expected: "gap",
    shouldIndex: false,
    sourceFile: "src/app/packages/quick-record-check/page.tsx",
    note: "Current app uses /services/[slug] for paid-package pages; /packages aliases remain a product routing decision.",
  },
  {
    label: "Prompted Official Record Brief package route",
    path: "/packages/official-record-brief",
    type: "public",
    expected: "gap",
    shouldIndex: false,
    sourceFile: "src/app/packages/official-record-brief/page.tsx",
    note: "Current app uses /services/official-record-brief; /packages alias is not implemented.",
  },
  {
    label: "Prompted Local Race Source Pack package route",
    path: "/packages/local-race-source-pack",
    type: "public",
    expected: "gap",
    shouldIndex: false,
    sourceFile: "src/app/packages/local-race-source-pack/page.tsx",
    note: "Current app uses /services/local-race-source-pack; /packages alias is not implemented.",
  },
  {
    label: "Prompted Election Watch Desk package route",
    path: "/packages/election-watch-desk",
    type: "public",
    expected: "gap",
    shouldIndex: false,
    sourceFile: "src/app/packages/election-watch-desk/page.tsx",
    note: "Current app uses /services/election-watch-desk; /packages alias is not implemented.",
  },
  {
    label: "Sample race route",
    path: "/elections/texas/texas-us-senate-2026",
    type: "public",
    expected: "dynamic",
    shouldIndex: true,
    checkText: "Senate",
    sourceFile: "src/app/elections/texas/[raceSlug]/page.tsx",
    note: "Representative race hub smoke target from the Texas election dataset.",
  },
  {
    label: "Sample story route",
    path: "/news/uap-file-dump-congress-attention-2026",
    type: "public",
    expected: "dynamic",
    shouldIndex: true,
    checkText: "UAP",
    sourceFile: "src/app/news/[id]/page.tsx",
    note: "Representative story page smoke target from source-backed news data.",
  },
  {
    label: "Sample jurisdiction route",
    path: "/jurisdictions/texas",
    type: "public",
    expected: "gap",
    shouldIndex: false,
    sourceFile: "src/app/jurisdictions/[slug]/page.tsx",
    note: "Jurisdiction meeting subroutes exist, but the hub route is not currently implemented.",
  },
  {
    label: "Privacy",
    path: "/privacy",
    type: "public",
    expected: "exists",
    shouldIndex: true,
    checkText: "Privacy",
    sourceFile: "src/app/privacy/page.tsx",
    note: "Public privacy and safety page.",
  },
  {
    label: "Methodology",
    path: "/methodology",
    type: "public",
    expected: "exists",
    shouldIndex: true,
    checkText: "methodology",
    sourceFile: "src/app/methodology/page.tsx",
    note: "Scoring and source-methodology page.",
  },
  {
    label: "Sitemap index",
    path: "/sitemap.xml",
    type: "seo",
    expected: "exists",
    shouldIndex: false,
    sourceFile: "src/app/sitemap.xml/route.ts",
    note: "Search-engine sitemap index route.",
  },
  {
    label: "Robots",
    path: "/robots.txt",
    type: "seo",
    expected: "exists",
    shouldIndex: false,
    sourceFile: "src/app/robots.ts",
    note: "Robots policy should reference public sitemaps and exclude private routes.",
  },
  {
    label: "Dashboard",
    path: "/dashboard",
    type: "private",
    expected: "exists",
    shouldIndex: false,
    allowRedirect: true,
    sourceFile: "src/app/dashboard/page.tsx",
    note: "Private member dashboard should redirect or render only for authorized users.",
  },
  {
    label: "Dashboard privacy",
    path: "/dashboard/privacy",
    type: "private",
    expected: "gap",
    shouldIndex: false,
    allowRedirect: true,
    sourceFile: "src/app/dashboard/privacy/page.tsx",
    note: "Prompted privacy subroute is not currently implemented; dashboard/settings exists.",
  },
  {
    label: "Admin",
    path: "/admin",
    type: "private",
    expected: "exists",
    shouldIndex: false,
    allowRedirect: true,
    sourceFile: "src/app/admin/page.tsx",
    note: "Server-side admin role check required.",
  },
  {
    label: "Admin quality",
    path: "/admin/quality",
    type: "private",
    expected: "exists",
    shouldIndex: false,
    allowRedirect: true,
    sourceFile: "src/app/admin/quality/page.tsx",
    note: "QA, route smoke, env, and error monitoring dashboard.",
  },
  {
    label: "Admin analytics",
    path: "/admin/analytics",
    type: "private",
    expected: "gap",
    shouldIndex: false,
    allowRedirect: true,
    sourceFile: "src/app/admin/analytics/page.tsx",
    note: "Admin analytics exists inside /admin but the dedicated route is not currently implemented.",
  },
  {
    label: "Admin sources",
    path: "/admin/sources",
    type: "private",
    expected: "gap",
    shouldIndex: false,
    allowRedirect: true,
    sourceFile: "src/app/admin/sources/page.tsx",
    note: "Source queue exists inside /admin; dedicated route remains a route gap.",
  },
  {
    label: "Admin monetization",
    path: "/admin/monetization",
    type: "private",
    expected: "gap",
    shouldIndex: false,
    allowRedirect: true,
    sourceFile: "src/app/admin/monetization/page.tsx",
    note: "Pricing/API/revenue desks exist separately; dedicated monetization route is a route gap.",
  },
  {
    label: "Admin SEO",
    path: "/admin/seo",
    type: "private",
    expected: "gap",
    shouldIndex: false,
    allowRedirect: true,
    sourceFile: "src/app/admin/seo/page.tsx",
    note: "SEO report API exists; dedicated admin SEO route is a route gap.",
  },
];

function booleanEnv(value: string | undefined) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function envCheck(key: string, label: string, required: boolean, detail: string): QualityCheck {
  const present = Boolean(process.env[key]);
  return {
    key,
    label,
    status: present ? "pass" : required ? "fail" : "warn",
    detail: present ? `${label} is present.` : detail,
    credentialNeeded: required && !present,
    recommendation: present ? undefined : `Set ${key} in Vercel and local .env for this capability.`,
  };
}

export function getRouteSmokeTargets() {
  return routeSmokeTargets;
}

export function validateEnvironment(): QualityCheck[] {
  const checks: QualityCheck[] = [
    envCheck("NEXT_PUBLIC_SITE_URL", "Canonical site URL", true, "Required for production canonical URLs, smoke tests, and share links."),
    envCheck("NEXT_PUBLIC_SUPABASE_URL", "Supabase public URL", true, "Required for auth-backed dashboard, submissions, and admin review."),
    envCheck("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anon key", true, "Required for browser-safe Supabase auth and public form flows."),
    envCheck("SUPABASE_SERVICE_ROLE_KEY", "Supabase service role", false, "Optional for the public site, but needed server-side for admin dashboards, error logging, and queue writes."),
  ];

  const paymentsEnabled = booleanEnv(process.env.ENABLE_PAYMENTS);
  checks.push(
    envCheck(
      "STRIPE_SECRET_KEY",
      "Stripe secret key",
      paymentsEnabled,
      paymentsEnabled ? "Required because ENABLE_PAYMENTS is true." : "Optional while payments are feature-flagged off.",
    ),
    envCheck(
      "STRIPE_WEBHOOK_SECRET",
      "Stripe webhook secret",
      paymentsEnabled,
      paymentsEnabled ? "Required because ENABLE_PAYMENTS is true." : "Optional while payments are feature-flagged off.",
    ),
  );

  const emailEnabled = booleanEnv(process.env.ENABLE_EMAIL_SENDING);
  const anyEmailProvider = Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || process.env.POSTMARK_API_KEY);
  checks.push({
    key: "EMAIL_PROVIDER_KEYS",
    label: "Email provider key",
    status: emailEnabled ? (anyEmailProvider ? "pass" : "fail") : anyEmailProvider ? "pass" : "not_verified",
    detail: emailEnabled
      ? anyEmailProvider
        ? "At least one email provider key is present."
        : "ENABLE_EMAIL_SENDING is true but no supported provider key is present."
      : "Email sending is disabled by default; provider keys are not required for launch-readiness preview mode.",
    credentialNeeded: emailEnabled && !anyEmailProvider,
    recommendation: emailEnabled && !anyEmailProvider ? "Configure RESEND_API_KEY, SENDGRID_API_KEY, or POSTMARK_API_KEY before sending digest emails." : undefined,
  });

  const aiEnabled = booleanEnv(process.env.ENABLE_AI_WRITING_ASSISTANT) || booleanEnv(process.env.ENABLE_AI_SOURCE_REVIEW);
  checks.push({
    key: "AI_PROVIDER_KEYS",
    label: "AI provider key",
    status: aiEnabled ? (process.env.OPENAI_API_KEY ? "pass" : "fail") : "not_verified",
    detail: aiEnabled
      ? process.env.OPENAI_API_KEY
        ? "AI provider key is present server-side."
        : "An AI feature flag is enabled but OPENAI_API_KEY is missing."
      : "AI features are disabled by default; manual templates and disabled states should remain clean.",
    credentialNeeded: aiEnabled && !process.env.OPENAI_API_KEY,
    recommendation: aiEnabled && !process.env.OPENAI_API_KEY ? "Set OPENAI_API_KEY server-side only, then keep disabled states until reviewed." : undefined,
  });

  for (const key of secretPublicEnvKeys) {
    if (process.env[key]) {
      checks.push({
        key,
        label: `Public secret exposure: ${key}`,
        status: "fail",
        detail: `${key} is present. Secret values must never use NEXT_PUBLIC_.`,
        credentialNeeded: true,
        recommendation: `Remove ${key}, rotate the underlying secret, and use the server-only env name instead.`,
      });
    }
  }

  return checks;
}

function maskSensitiveText(value: string, maxLength = 2500) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[phone]")
    .replace(/\b(sk|pk|rk|whsec|eyJ)[A-Za-z0-9._-]{16,}\b/g, "[secret]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[ssn]")
    .slice(0, maxLength);
}

function sanitizeRoute(value: unknown) {
  const route = cleanText(value, 700).split("#")[0];
  if (!route.startsWith("/")) return "";
  return route.startsWith("/api") ? "/api/[redacted]" : route.slice(0, 700);
}

function sanitizeMetadata(metadata: Record<string, unknown> | undefined) {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata ?? {}).slice(0, 40)) {
    const normalizedKey = cleanText(key, 80);
    if (!normalizedKey || /password|secret|token|key|raw|payload|document|file|address|minor|child/i.test(normalizedKey)) continue;
    if (typeof value === "string") safe[normalizedKey] = maskSensitiveText(value, 500);
    if (typeof value === "number" && Number.isFinite(value)) safe[normalizedKey] = value;
    if (typeof value === "boolean") safe[normalizedKey] = value;
    if (value === null) safe[normalizedKey] = null;
  }
  return safe;
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      type: error.name || "Error",
      message: maskSensitiveText(error.message || "Unknown error", 1000),
      stack: error.stack ? maskSensitiveText(error.stack, 5000) : null,
    };
  }
  return {
    type: "UnknownError",
    message: maskSensitiveText(typeof error === "string" ? error : "Unknown error", 1000),
    stack: null,
  };
}

export async function logAppError(error: unknown, context: AppErrorLogContext = {}) {
  const normalized = normalizeError(error);
  const payload = {
    error_type: cleanText(context.errorType, 120) || normalized.type,
    message: normalized.message,
    stack: normalized.stack,
    route: sanitizeRoute(context.route) || null,
    user_id: cleanText(context.userId, 120) || null,
    anonymous_id: cleanText(context.anonymousId, 120) || null,
    severity: cleanText(context.severity, 30) || "error",
    metadata: sanitizeMetadata(context.metadata),
  };

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    console.warn(JSON.stringify({ level: "warn", msg: "app_error_logged_without_database", ...payload, stack: undefined }));
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured." };
  }

  const { data, error: insertError } = await supabase.from("app_error_logs").insert(payload).select("id").maybeSingle();
  if (insertError) {
    console.warn(JSON.stringify({ level: "warn", msg: "app_error_log_insert_failed", error: insertError.message, ...payload, stack: undefined }));
    return { ok: false, error: insertError.message };
  }

  return { ok: true, id: (data as { id?: string } | null)?.id ?? null };
}

async function getRecentErrors(): Promise<{ rows: AppErrorLogRow[]; error: string | null }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { rows: [], error: "SUPABASE_SERVICE_ROLE_KEY is missing, so recent app errors cannot be loaded." };

  const { data, error } = await supabase
    .from("app_error_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as AppErrorLogRow[], error: null };
}

export async function getQualityAdminData() {
  const envChecks = validateEnvironment();
  const routeTargets = getRouteSmokeTargets();
  const errors: string[] = [];
  const [{ rows: recentErrors, error: recentError }, featureFlags] = await Promise.all([
    getRecentErrors(),
    getFeatureFlagSnapshot().catch((error: unknown) => {
      errors.push(error instanceof Error ? error.message : "Feature flag snapshot failed.");
      return [];
    }),
  ]);

  if (recentError) errors.push(recentError);

  const routeGaps = routeTargets.filter((route) => route.expected === "gap");
  const failedEnvChecks = envChecks.filter((check) => check.status === "fail");
  const warningEnvChecks = envChecks.filter((check) => check.status === "warn");

  return {
    generatedAt: new Date().toISOString(),
    envChecks,
    routeTargets,
    recentErrors,
    featureFlags,
    errors,
    summary: {
      envPass: envChecks.filter((check) => check.status === "pass").length,
      envWarn: warningEnvChecks.length,
      envFail: failedEnvChecks.length,
      routeTargets: routeTargets.length,
      routeGaps: routeGaps.length,
      recentErrorCount: recentErrors.length,
    },
  };
}

export type QualityAdminData = Awaited<ReturnType<typeof getQualityAdminData>>;
