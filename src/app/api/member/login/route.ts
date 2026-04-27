import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  memberDatabaseUnavailableResponse,
  setMemberSessionCookie,
} from "@/lib/member-auth";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
};

function cleanEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return memberDatabaseUnavailableResponse();

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const email = cleanEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Could not log in with those credentials." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true, user: data.user });
  setMemberSessionCookie(response, {
    userId: data.user.id,
    email: data.user.email ?? email,
    createdAt: new Date().toISOString(),
  });
  return response;
}
