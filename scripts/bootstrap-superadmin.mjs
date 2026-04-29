#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPERADMIN_EMAIL", "SUPERADMIN_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const email = process.env.SUPERADMIN_EMAIL.toLowerCase().trim();
const password = process.env.SUPERADMIN_PASSWORD;
const county = process.env.SUPERADMIN_COUNTY || "Gregg County";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

async function findUserByEmail() {
  let page = 1;
  const perPage = 1000;

  while (page < 50) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

async function ensureUser() {
  const existing = await findUserByEmail();
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        full_name: "Ryan Nichols",
        repwatchr_superadmin: true,
      },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "Ryan Nichols",
      repwatchr_superadmin: true,
    },
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  const user = await ensureUser();
  if (!user?.id) throw new Error("Supabase did not return a user id.");

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      county,
      district: process.env.SUPERADMIN_DISTRICT || "East Texas",
      verified: true,
    },
    { onConflict: "user_id" },
  );
  if (profileError) throw profileError;

  const roles = ["admin", "reviewer", "researcher", "voter"];
  const { error: rolesError } = await supabase.from("user_roles").upsert(
    roles.map((role) => ({
      user_id: user.id,
      role,
      created_by: user.id,
    })),
    { onConflict: "user_id,role" },
  );
  if (rolesError) throw rolesError;

  const { error: memberProfileError } = await supabase.from("member_profiles").upsert(
    {
      user_id: user.id,
      display_name: "Ryan Nichols",
      home_location: "Longview, Texas",
      preferred_state: "TX",
      research_focus: "Political accountability, public records, school boards, officials, media, attorneys, and case-ready research packets.",
      public_profile_enabled: false,
    },
    { onConflict: "user_id" },
  );
  if (memberProfileError) {
    console.warn(`member_profiles not updated: ${memberProfileError.message}`);
  }

  console.log(JSON.stringify({
    ok: true,
    email,
    userId: user.id,
    roles,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
