import { NextResponse } from "next/server";
import { getAdminUserForServer } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getPartnerPipelineData } from "@/lib/partner-pipeline-admin";
import {
  PARTNER_INTEREST_TYPES,
  normalizePartnerAccountStatus,
  normalizePartnerPipelineStatus,
} from "@/lib/partner-pipeline";
import { cleanEmail, cleanLongText, cleanText, cleanUrl } from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminPartnerBody = {
  action?: unknown;
  leadId?: unknown;
  status?: unknown;
  notes?: unknown;
  assignedTo?: unknown;
  accountName?: unknown;
  accountType?: unknown;
  website?: unknown;
  contactEmail?: unknown;
  accountStatus?: unknown;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
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
    metadata: { source: "admin_partner_pipeline" },
  });
}

async function addPipelineEvent({
  leadId,
  eventType,
  adminId,
  notes,
  metadata = {},
}: {
  leadId: string;
  eventType: string;
  adminId: string;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("partner_pipeline_events").insert({
    partner_interest_id: leadId,
    event_type: eventType,
    actor_user_id: adminId,
    notes: notes || null,
    metadata,
  });
}

export async function GET() {
  await getAdminUserForServer();
  return NextResponse.json({ ok: true, data: await getPartnerPipelineData() });
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserForServer();
  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonError("Admin data connection is unavailable.", 503);

  const body = (await request.json().catch(() => null)) as AdminPartnerBody | null;
  const action = cleanText(body?.action, 80);
  const leadId = cleanText(body?.leadId, 80);

  if (action === "update_status") {
    if (!leadId) return jsonError("Lead ID is required.");
    const status = normalizePartnerPipelineStatus(body?.status);
    const notes = cleanLongText(body?.notes, 2000);

    const { data, error } = await supabase
      .from("partner_interest")
      .update({ status })
      .eq("id", leadId)
      .select("*")
      .maybeSingle();

    if (error || !data) return jsonError(error?.message || "Status update failed.", 500);
    await addPipelineEvent({
      leadId,
      eventType: status === "meeting_scheduled" ? "meeting_scheduled" : status === "archived" ? "archived" : "status_changed",
      adminId: adminUser.id,
      notes,
      metadata: { status },
    });
    await audit("partner_status_changed", "partner_interest", leadId, data, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  if (action === "add_note") {
    if (!leadId) return jsonError("Lead ID is required.");
    const notes = cleanLongText(body?.notes, 3000);
    if (!notes) return jsonError("Add a note.");
    await addPipelineEvent({ leadId, eventType: "note_added", adminId: adminUser.id, notes });
    await audit("partner_note_added", "partner_interest", leadId, { notes }, adminUser);
    return NextResponse.json({ ok: true });
  }

  if (action === "assign_owner") {
    if (!leadId) return jsonError("Lead ID is required.");
    const assignedTo = cleanText(body?.assignedTo, 80) || null;
    const { data, error } = await supabase
      .from("partner_interest")
      .update({ assigned_to: assignedTo })
      .eq("id", leadId)
      .select("*")
      .maybeSingle();
    if (error || !data) return jsonError(error?.message || "Assignment update failed.", 500);
    await addPipelineEvent({
      leadId,
      eventType: "assigned",
      adminId: adminUser.id,
      notes: assignedTo ? `Assigned to ${assignedTo}` : "Assignment cleared.",
      metadata: { assigned_to: assignedTo },
    });
    await audit("partner_assigned", "partner_interest", leadId, data, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  if (action === "create_partner_account") {
    if (!leadId) return jsonError("Lead ID is required.");
    const name = cleanText(body?.accountName, 255);
    const accountType = cleanText(body?.accountType, 120);
    const status = normalizePartnerAccountStatus(body?.accountStatus);
    const contactEmail = cleanEmail(body?.contactEmail) || null;
    const website = cleanUrl(body?.website) || null;
    const notes = cleanLongText(body?.notes, 3000);

    if (!name) return jsonError("Account name is required.");
    if (!PARTNER_INTEREST_TYPES.includes(accountType as (typeof PARTNER_INTEREST_TYPES)[number])) return jsonError("Valid account type is required.");

    const { data, error } = await supabase
      .from("partner_accounts")
      .insert({
        name,
        account_type: accountType,
        website,
        contact_email: contactEmail,
        status,
        notes: notes || null,
      })
      .select("*")
      .maybeSingle();

    if (error || !data) return jsonError(error?.message || "Partner account save failed.", 500);
    await addPipelineEvent({
      leadId,
      eventType: "account_created",
      adminId: adminUser.id,
      notes: notes || `Created partner account ${name}.`,
      metadata: { account_id: data.id, account_type: accountType, account_status: status },
    });
    await audit("partner_account_created", "partner_account", data.id, data, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  return jsonError("Unsupported partner pipeline action.");
}
