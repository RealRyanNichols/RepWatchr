import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const scopes = ["tweet.read", "tweet.write", "users.read", "offline.access"];
const cookieMaxAge = 10 * 60;

function base64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

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

function readBearer(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim();
  return authorization?.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
}

function isSetupAuthorized(request: NextRequest) {
  const expected = process.env.SOCIAL_AUTH_SETUP_SECRET ?? process.env.CRON_SECRET;
  if (!expected) return false;
  return readBearer(request) === expected || request.nextUrl.searchParams.get("setup") === expected;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.X_CLIENT_ID;

  if (!isSetupAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized X setup request." }, { status: 401 });
  }

  if (!clientId) {
    return NextResponse.json({ ok: false, error: "X_CLIENT_ID is not configured." }, { status: 503 });
  }

  const state = base64Url(randomBytes(24));
  const codeVerifier = base64Url(randomBytes(48));
  const codeChallenge = base64Url(createHash("sha256").update(codeVerifier).digest());
  const authorizeUrl = new URL("https://x.com/i/oauth2/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri(request));
  authorizeUrl.searchParams.set("scope", scopes.join(" "));
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  const secure = request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
  response.cookies.set("rw_x_oauth_state", state, {
    httpOnly: true,
    maxAge: cookieMaxAge,
    path: "/api/auth/x",
    sameSite: "lax",
    secure,
  });
  response.cookies.set("rw_x_oauth_verifier", codeVerifier, {
    httpOnly: true,
    maxAge: cookieMaxAge,
    path: "/api/auth/x",
    sameSite: "lax",
    secure,
  });

  return response;
}
