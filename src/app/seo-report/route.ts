import { NextResponse } from "next/server";
import { buildSeoReport } from "@/lib/seo-inventory";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildSeoReport(), {
    headers: {
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
