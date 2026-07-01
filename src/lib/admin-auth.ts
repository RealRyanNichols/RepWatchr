import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

function configuredAdminEmails() {
  return new Set(
    (process.env.REPWATCHR_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function metadataHasAdminRole(appMetadata: Record<string, unknown> | null | undefined) {
  const role = typeof appMetadata?.role === "string" ? appMetadata.role : "";
  const roles = Array.isArray(appMetadata?.roles)
    ? appMetadata.roles.filter((value): value is string => typeof value === "string")
    : [];

  return role === "admin" || role === "super_admin" || roles.includes("admin") || roles.includes("super_admin");
}

export async function requireAdminPageAccess() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false as const, status: 503, error: "Supabase public environment variables are not configured." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, status: 401, error: "Login required." };
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleNames = rolesError
    ? []
    : (roles ?? [])
        .map((row) => (typeof row.role === "string" ? row.role : ""))
        .filter(Boolean);
  const emailAllowed = user.email ? configuredAdminEmails().has(user.email.toLowerCase()) : false;
  const appMetadataAllowed = metadataHasAdminRole(user.app_metadata as Record<string, unknown>);
  const roleAllowed = roleNames.includes("admin") || roleNames.includes("super_admin");

  if (!roleAllowed && !emailAllowed && !appMetadataAllowed) {
    return { ok: false as const, status: 403, error: "Admin role required." };
  }

  return {
    ok: true as const,
    user,
    roles: roleNames,
    accessVia: roleAllowed ? "user_roles" : emailAllowed ? "env_allowlist" : "app_metadata",
  };
}

export async function requireAdminClient() {
  const access = await requireAdminPageAccess();
  if (!access.ok) return access;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return { ok: false as const, status: 503, error: "SUPABASE_SERVICE_ROLE_KEY is not configured." };
  }

  return { ok: true as const, user: access.user, roles: access.roles, accessVia: access.accessVia, admin };
}
