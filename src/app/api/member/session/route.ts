import { NextResponse } from "next/server";
import { getMemberAccountContext } from "@/lib/member-auth";

export const runtime = "nodejs";

export async function GET() {
  const context = await getMemberAccountContext();

  if (!context) {
    return NextResponse.json({ user: null, profile: null, roles: [] });
  }

  return NextResponse.json(context);
}
