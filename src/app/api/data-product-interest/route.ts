import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const allowedInterestTypes = new Set([
  "Data licensing",
  "Custom political report",
  "Verified constituent panel",
  "Campaign research desk",
  "Claimed profile / official response",
  "Partnership",
]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Send a valid request packet." }, { status: 400 });
  }

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 180).toLowerCase();
  const organization = cleanText(body.organization, 180);
  const interestType = cleanText(body.interestType, 80);
  const geography = cleanText(body.geography, 180);
  const useCase = cleanText(body.useCase, 2500);
  const budgetRange = cleanText(body.budgetRange, 120);
  const consent = body.consent === true;

  if (!name || !isValidEmail(email) || !allowedInterestTypes.has(interestType) || useCase.length < 20 || !consent) {
    return NextResponse.json(
      { ok: false, message: "Add your name, email, interest type, use case, and acknowledgment." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json({
      ok: true,
      stored: false,
      message: "Request packet created. Keep a copy for follow-up with the RepWatchr data desk.",
    });
  }

  const { error } = await admin.from("data_product_interests").insert({
    name,
    email,
    organization: organization || null,
    interest_type: interestType,
    geography: geography || null,
    use_case: useCase,
    budget_range: budgetRange || null,
    consent,
    status: "new",
    referrer: request.headers.get("referer"),
    user_agent: request.headers.get("user-agent"),
  });

  if (error) {
    return NextResponse.json({
      ok: true,
      stored: false,
      message: "Request packet created. Keep a copy for follow-up with the RepWatchr data desk.",
    });
  }

  return NextResponse.json({
    ok: true,
    stored: true,
    message: "Request received. RepWatchr can follow up with the right data lane.",
  });
}
