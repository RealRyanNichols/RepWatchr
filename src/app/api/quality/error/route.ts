import { NextResponse } from "next/server";
import { logAppError } from "@/lib/qa-monitoring";
import { cleanText } from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErrorBody = {
  message?: unknown;
  name?: unknown;
  stack?: unknown;
  route?: unknown;
  anonymousId?: unknown;
  severity?: unknown;
  metadata?: unknown;
};

function normalizeSeverity(value: unknown) {
  const severity = cleanText(value, 30);
  if (["debug", "info", "warn", "error", "critical"].includes(severity)) return severity as "debug" | "info" | "warn" | "error" | "critical";
  return "error";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ErrorBody | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid error payload." }, { status: 400 });

  const message = cleanText(body.message, 1000);
  if (!message) return NextResponse.json({ ok: false, error: "Error message is required." }, { status: 400 });

  const error = new Error(message);
  error.name = cleanText(body.name, 120) || "ClientAppError";
  if (typeof body.stack === "string") error.stack = body.stack.slice(0, 5000);

  const result = await logAppError(error, {
    errorType: error.name,
    route: cleanText(body.route, 700),
    anonymousId: cleanText(body.anonymousId, 120),
    severity: normalizeSeverity(body.severity),
    metadata: body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : {},
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Error accepted but database logging is unavailable." }, { status: 202 });
  }

  return NextResponse.json({ ok: true, id: result.id });
}
