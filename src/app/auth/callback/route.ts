import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safe-next-path";

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const providerError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  function loginError(message: string) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", message);
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return loginError("Member login is temporarily unavailable.");
  }

  if (providerError) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "social_auth_provider_failed",
        route: "/auth/callback",
        providerError,
        durationMs: Date.now() - startedAt,
      }),
    );
    return loginError("Social sign-in did not complete. Please try again or create an account with email.");
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "social_auth_code_exchange_failed",
          route: "/auth/callback",
          error: error?.message ?? "No user returned",
          durationMs: Date.now() - startedAt,
        }),
      );
      return loginError("Your social sign-in expired or could not be verified. Please try again.");
    }

    const metadata = data.user.user_metadata ?? {};
    const suggestedName =
      String(metadata.full_name ?? metadata.name ?? metadata.user_name ?? "").trim() ||
      data.user.email?.split("@")[0] ||
      "RepWatchr member";
    const { error: profileError } = await supabase.from("member_profiles").upsert(
      {
        user_id: data.user.id,
        display_name: suggestedName,
        preferred_state: "TX",
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    if (profileError) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "social_auth_profile_bootstrap_failed",
          route: "/auth/callback",
          error: profileError.message,
          durationMs: Date.now() - startedAt,
        }),
      );
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
