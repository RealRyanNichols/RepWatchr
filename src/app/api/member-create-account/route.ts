import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function redirectTo(request: NextRequest, path: string, params?: Record<string, string>) {
  const url = new URL(path, request.url);
  Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url, { status: 303 });
}

export function GET(request: NextRequest) {
  return redirectTo(request, "/create-account");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password || password.length < 8) {
    return redirectTo(request, "/create-account", {
      error: "Email and an 8 character password are required.",
    });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${request.nextUrl.origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return redirectTo(request, "/create-account", { error: error.message });
  }

  if (data.session?.user) {
    await supabase.from("member_profiles").upsert(
      {
        user_id: data.session.user.id,
        display_name: email.split("@")[0],
        preferred_state: "TX",
        research_focus: "Politics, accountability, public records, and watched officials",
      },
      { onConflict: "user_id" }
    );

    return redirectTo(request, "/dashboard");
  }

  return redirectTo(request, "/auth/login", {
    created: "1",
  });
}
