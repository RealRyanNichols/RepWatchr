import { NextResponse } from "next/server";
import { getAdminUserForServer } from "@/lib/admin-auth";
import { getQualityAdminData } from "@/lib/qa-monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await getAdminUserForServer();
  return NextResponse.json({ ok: true, data: await getQualityAdminData() });
}
