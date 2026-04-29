import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const excludedPrefixes = ["/admin", "/api", "/auth", "/dashboard", "/login", "/create-account"];

function normalizePath(value: unknown) {
  if (typeof value !== "string") return "";
  const path = value.trim().split("?")[0].split("#")[0];
  if (!path.startsWith("/") || path.length > 500) return "";
  if (excludedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return "";
  return path;
}

function normalizeHost(value: unknown) {
  if (typeof value !== "string") return null;
  const host = value.trim().toLowerCase();
  if (!host || host.length > 120 || !/^[a-z0-9.-]+$/.test(host)) return null;
  return host;
}

function deviceKind(userAgent: string) {
  const text = userAgent.toLowerCase();
  if (!text) return "unknown";
  if (/(bot|crawler|spider|crawling|preview|slurp)/.test(text)) return "bot";
  if (/(ipad|tablet)/.test(text)) return "tablet";
  if (/(mobile|iphone|android)/.test(text)) return "mobile";
  return "desktop";
}

function headerIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || request.headers.get("x-vercel-forwarded-for") || "";
}

function hashVisitor(ip: string, userAgent: string) {
  const secret =
    process.env.ANALYTICS_HASH_SECRET ||
    process.env.MEMBER_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !ip || !userAgent) return null;
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${day}:${ip}:${userAgent}:${secret}`)
    .digest("hex");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    path?: unknown;
    referrerHost?: unknown;
  } | null;
  const path = normalizePath(body?.path);
  if (!path) return new Response(null, { status: 204 });

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Analytics database is not configured." }, { status: 503 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const countryCode = request.headers.get("x-vercel-ip-country")?.slice(0, 2).toUpperCase() || null;
  const { error } = await admin.from("site_page_views").insert({
    path,
    referrer_host: normalizeHost(body?.referrerHost),
    visitor_hash: hashVisitor(headerIp(request), userAgent),
    country_code: countryCode && /^[A-Z]{2}$/.test(countryCode) ? countryCode : null,
    device_kind: deviceKind(userAgent),
    source: "repwatchr_client",
  });

  if (error) {
    console.error(JSON.stringify({ level: "error", msg: "page_view_insert_failed", error: error.message }));
    return NextResponse.json({ error: "Page view was not recorded." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
