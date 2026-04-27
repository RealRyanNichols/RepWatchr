import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  memberDatabaseUnavailableResponse,
  setMemberSessionCookie,
} from "@/lib/member-auth";

export const runtime = "nodejs";

type SignupBody = {
  email?: string;
  password?: string;
  displayName?: string;
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return memberDatabaseUnavailableResponse();

  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const email = cleanText(body.email, 240).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const displayName = cleanText(body.displayName, 120) || email.split("@")[0];

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
    },
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create the member account." },
      { status: error?.message.toLowerCase().includes("already") ? 409 : 400 },
    );
  }

  const { error: profileError } = await supabase.from("member_profiles").upsert(
    {
      user_id: data.user.id,
      display_name: displayName,
      preferred_state: "TX",
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    return NextResponse.json(
      {
        error: `Account was created, but member_profiles could not save: ${profileError.message}`,
      },
      { status: 500 },
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
