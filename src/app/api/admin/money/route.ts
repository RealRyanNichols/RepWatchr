import { NextResponse } from "next/server";
import { getAdminUserForServer } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { cleanText, cleanUrl } from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function formText(formData: FormData, key: string, max = 255) {
  return cleanText(formData.get(key), max);
}

function formUrl(formData: FormData, key: string) {
  return cleanUrl(formData.get(key));
}

function formMoney(formData: FormData, key: string) {
  const text = formText(formData, key, 80).replace(/[$,]/g, "");
  if (!text) return null;
  const amount = Number(text);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function audit(action: string, targetType: string, targetId: string, afterValues: Record<string, unknown>, adminUser: { id: string; email: string | null }) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("admin_audit_log").insert({
    admin_user_id: adminUser.id,
    admin_email: adminUser.email,
    action,
    target_type: targetType,
    target_id: targetId,
    after_values: afterValues,
    metadata: { source: "admin_money_desk" },
  });
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserForServer();
  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonError("Supabase admin client is not configured.", 503);

  const formData = await request.formData();
  const action = formText(formData, "action", 80);

  if (action === "create_finance_record") {
    const payload = {
      entity_id: formText(formData, "entity_id", 180) || null,
      entity_type: formText(formData, "entity_type", 80) || "official",
      committee_name: formText(formData, "committee_name", 255) || null,
      candidate_name: formText(formData, "candidate_name", 255) || null,
      counterparty_name: formText(formData, "counterparty_name", 255) || null,
      counterparty_type: formText(formData, "counterparty_type", 80) || "unknown",
      record_type: formText(formData, "record_type", 80) || "other",
      amount: formMoney(formData, "amount"),
      transaction_date: formText(formData, "transaction_date", 80) || null,
      cycle: formText(formData, "cycle", 80) || null,
      jurisdiction: formText(formData, "jurisdiction", 180) || null,
      state: formText(formData, "state", 20) || null,
      source_url: formUrl(formData, "source_url"),
      source_key: formText(formData, "source_key", 255) || null,
      confidence: formText(formData, "confidence", 80) || "source_backed",
      status: "needs_review",
      raw_payload: { created_from: "admin_money_desk" },
    };
    if (!payload.entity_id || !payload.source_url) return jsonError("Entity ID and source URL are required.");
    const { data, error } = await supabase.from("finance_records").insert(payload).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "Finance record save failed.", 500);
    await audit("finance_record_created", "finance_record", data.id, data, adminUser);
    return NextResponse.redirect(new URL("/admin/money?saved=finance_record", request.url), 303);
  }

  if (action === "create_committee") {
    const name = formText(formData, "name", 255);
    const payload = {
      name,
      slug: formText(formData, "slug", 180) || slugify(name),
      committee_type: formText(formData, "committee_type", 80) || "unknown",
      jurisdiction: formText(formData, "jurisdiction", 180) || null,
      state: formText(formData, "state", 20) || null,
      fec_id: formText(formData, "fec_id", 80) || null,
      state_id: formText(formData, "state_id", 80) || null,
      official_url: formUrl(formData, "official_url") || null,
      source_url: formUrl(formData, "source_url") || null,
      status: "needs_review",
    };
    if (!payload.name) return jsonError("Committee/source name is required.");
    const { data, error } = await supabase.from("committees").upsert(payload, { onConflict: "slug" }).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "Committee save failed.", 500);
    await audit("committee_upserted", "committee", data.id, data, adminUser);
    return NextResponse.redirect(new URL("/admin/money?saved=committee", request.url), 303);
  }

  if (action === "create_donor_entity") {
    const name = formText(formData, "name", 255);
    const payload = {
      name,
      slug: formText(formData, "slug", 180) || slugify(name),
      donor_type: formText(formData, "donor_type", 80) || "unknown",
      jurisdiction: formText(formData, "jurisdiction", 180) || null,
      state: formText(formData, "state", 20) || null,
      source_url: formUrl(formData, "source_url") || null,
      status: "needs_review",
    };
    if (!payload.name) return jsonError("Donor/source name is required.");
    const { data, error } = await supabase.from("donor_entities").upsert(payload, { onConflict: "slug" }).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "Donor/source entity save failed.", 500);
    await audit("donor_entity_upserted", "donor_entity", data.id, data, adminUser);
    return NextResponse.redirect(new URL("/admin/money?saved=donor_entity", request.url), 303);
  }

  if (action === "create_vendor_record") {
    const payload = {
      entity_id: formText(formData, "entity_id", 180) || null,
      vendor_name: formText(formData, "vendor_name", 255),
      amount: formMoney(formData, "amount"),
      transaction_date: formText(formData, "transaction_date", 80) || null,
      record_type: formText(formData, "record_type", 80) || "other",
      contract_or_invoice: formText(formData, "contract_or_invoice", 180) || null,
      source_url: formUrl(formData, "source_url"),
      confidence: formText(formData, "confidence", 80) || "source_backed",
      status: "needs_review",
      raw_payload: { created_from: "admin_money_desk" },
    };
    if (!payload.vendor_name || !payload.source_url) return jsonError("Vendor name and source URL are required.");
    const { data, error } = await supabase.from("vendor_records").insert(payload).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "Vendor record save failed.", 500);
    await audit("vendor_record_created", "vendor_record", data.id, data, adminUser);
    return NextResponse.redirect(new URL("/admin/money?saved=vendor_record", request.url), 303);
  }

  return jsonError("Unsupported money admin action.");
}
