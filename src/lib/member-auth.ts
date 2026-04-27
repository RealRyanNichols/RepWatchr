import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const MEMBER_SESSION_COOKIE = "repwatchr_member_session";

type MemberSessionPayload = {
  userId: string;
  email: string;
  createdAt: string;
};

export type MemberAccountProfile = {
  county: string;
  district?: string;
  verified: boolean;
  displayName?: string;
  homeLocation?: string;
  preferredState?: string;
  researchFocus?: string;
  publicProfileEnabled?: boolean;
};

function getSessionSecret() {
  return process.env.MEMBER_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  const secret = getSessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createMemberSessionToken(payload: MemberSessionPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  if (!signature) return "";
  return `${encodedPayload}.${signature}`;
}

export function readMemberSessionToken(token: string | undefined): MemberSessionPayload | null {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  if (!expectedSignature) return null;

  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as MemberSessionPayload;
    if (!payload.userId || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getMemberSession() {
  const cookieStore = await cookies();
  return readMemberSessionToken(cookieStore.get(MEMBER_SESSION_COOKIE)?.value);
}

export function setMemberSessionCookie(response: NextResponse, payload: MemberSessionPayload) {
  const token = createMemberSessionToken(payload);
  if (!token) return;

  response.cookies.set(MEMBER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearMemberSessionCookie(response: NextResponse) {
  response.cookies.set(MEMBER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getMemberAccountContext() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const [{ data: authUser }, profileResult, memberProfileResult, rolesResult] = await Promise.all([
    supabase.auth.admin.getUserById(session.userId),
    supabase
      .from("profiles")
      .select("county, district, verified")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase
      .from("member_profiles")
      .select("display_name, home_location, preferred_state, research_focus, public_profile_enabled")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", session.userId),
  ]);

  if (!authUser.user) return null;

  const profile = profileResult.data as {
    county: string | null;
    district?: string | null;
    verified: boolean | null;
  } | null;
  const memberProfile = memberProfileResult.data as {
    display_name: string | null;
    home_location: string | null;
    preferred_state: string | null;
    research_focus: string | null;
    public_profile_enabled: boolean | null;
  } | null;

  return {
    user: authUser.user,
    profile: {
      county: profile?.county ?? "",
      district: profile?.district ?? undefined,
      verified: Boolean(profile?.verified),
      displayName: memberProfile?.display_name ?? undefined,
      homeLocation: memberProfile?.home_location ?? undefined,
      preferredState: memberProfile?.preferred_state ?? "TX",
      researchFocus: memberProfile?.research_focus ?? undefined,
      publicProfileEnabled: Boolean(memberProfile?.public_profile_enabled),
    } satisfies MemberAccountProfile,
    roles: ((rolesResult.data ?? []) as Array<{ role: string }>).map((item) => item.role),
  };
}

export function memberDatabaseUnavailableResponse() {
  return Response.json(
    {
      error:
        "Member database is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then run the member SQL schema.",
    },
    { status: 503 },
  );
}
