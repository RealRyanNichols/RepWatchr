import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type AdminUser = {
  id: string;
  email: string | null;
};

export class AdminAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

export function isSupabaseServerAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getAdminUserForServer(): Promise<AdminUser> {
  if (!isSupabaseServerAuthConfigured()) {
    throw new AdminAuthError("Supabase auth is not configured.", 503);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AdminAuthError("Login required.", 401);
  }

  const roleClient = getSupabaseAdminClient() ?? supabase;
  const { data: role, error: roleError } = await roleClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || role?.role !== "admin") {
    throw new AdminAuthError("Admin role required.", 403);
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export async function requireAdminPageAccess() {
  try {
    return await getAdminUserForServer();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      if (error.status === 401) redirect("/auth/login?next=/admin");
      if (error.status === 403) redirect("/dashboard?admin=required");
    }

    throw error;
  }
}
