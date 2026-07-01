import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type XTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

function siteUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    request.nextUrl.origin ??
    "https://www.repwatchr.com"
  ).replace(/\/+$/, "");
}

function redirectUri(request: NextRequest) {
  return process.env.X_REDIRECT_URI ?? `${siteUrl(request)}/api/auth/x/callback`;
}

function doneUrl(request: NextRequest, status: "connected" | "error", detail?: string) {
  const url = new URL("/daily-wire", siteUrl(request));
  url.searchParams.set("x_auth", status);
  if (detail) url.searchParams.set("detail", detail.slice(0, 140));
  return url;
}

async function readTokenPayload(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as XTokenResponse;
  } catch {
    return { error_description: text } satisfies XTokenResponse;
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("rw_x_oauth_state")?.value;
  const codeVerifier = request.cookies.get("rw_x_oauth_verifier")?.value;
  const clientId = process.env.X_CLIENT_ID;

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    return NextResponse.redirect(doneUrl(request, "error", "X OAuth state check failed."));
  }

  if (!clientId) {
    return NextResponse.redirect(doneUrl(request, "error", "X connection is temporarily unavailable."));
  }

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  };

  if (process.env.X_CLIENT_SECRET) {
    headers.authorization = `Basic ${Buffer.from(`${clientId}:${process.env.X_CLIENT_SECRET}`).toString("base64")}`;
  }

  const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers,
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri(request),
      code_verifier: codeVerifier,
    }),
  });
  const tokenPayload = await readTokenPayload(tokenResponse);

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    return NextResponse.redirect(
      doneUrl(
        request,
        "error",
        tokenPayload.error_description ?? tokenPayload.error ?? `X OAuth HTTP ${tokenResponse.status}`,
      ),
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.redirect(doneUrl(request, "error", "Social account storage is temporarily unavailable."));
  }

  const now = new Date();
  const expiresInSeconds = typeof tokenPayload.expires_in === "number" ? tokenPayload.expires_in : 7200;
  const { error } = await supabase.from("repwatchr_social_tokens").upsert(
    {
      platform: "x",
      access_token: tokenPayload.access_token,
      refresh_token: tokenPayload.refresh_token ?? null,
      expires_at: new Date(now.getTime() + expiresInSeconds * 1000).toISOString(),
      metadata: {
        tokenType: tokenPayload.token_type,
        scope: tokenPayload.scope,
      },
      updated_at: now.toISOString(),
    },
    { onConflict: "platform" },
  );

  const response = NextResponse.redirect(error ? doneUrl(request, "error", error.message) : doneUrl(request, "connected"));
  response.cookies.delete("rw_x_oauth_state");
  response.cookies.delete("rw_x_oauth_verifier");

  return response;
}
