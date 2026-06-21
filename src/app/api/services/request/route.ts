import { NextResponse } from "next/server";
import { getRepWatchrService } from "@/data/repwatchr-services";
import {
  cleanEmail,
  cleanLongText,
  cleanText,
  cleanUrl,
  recordPaymentEvent,
  upsertPaymentCustomer,
} from "@/lib/payment-records";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ServiceRequestBody = {
  serviceSlug?: unknown;
  requesterName?: unknown;
  requesterEmail?: unknown;
  jurisdiction?: unknown;
  target?: unknown;
  sourceUrl?: unknown;
  summary?: unknown;
  deadline?: unknown;
  acknowledged?: unknown;
  packet?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ServiceRequestBody | null;
  const serviceSlug = cleanText(body?.serviceSlug, 120);
  const service = getRepWatchrService(serviceSlug);

  if (!service) {
    return NextResponse.json({ error: "Choose a valid RepWatchr service." }, { status: 400 });
  }

  const target = cleanText(body?.target, 500);
  const summary = cleanLongText(body?.summary, 5000);
  const acknowledged = body?.acknowledged === true;

  if (!target || !summary || !acknowledged) {
    return NextResponse.json(
      { error: "Add the target, the review summary, and the public-record acknowledgement." },
      { status: 400 }
    );
  }

  const requesterName = cleanText(body?.requesterName, 255);
  const requesterEmail = cleanEmail(body?.requesterEmail);
  const jurisdiction = cleanText(body?.jurisdiction, 500);
  const sourceUrl = cleanUrl(body?.sourceUrl);
  const deadline = cleanText(body?.deadline, 255);
  const packet = cleanLongText(body?.packet, 8000);
  const customer = await upsertPaymentCustomer({
    name: requesterName,
    email: requesterEmail,
    metadata: {
      source: "repwatchr_service_request",
      service_slug: service.slug,
    },
  });

  const supabase = getSupabaseAdminClient();
  let requestId: string | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from("service_requests")
      .insert({
        customer_id: customer.id,
        service_slug: service.slug,
        service_name: service.name,
        requester_name: requesterName || null,
        requester_email: requesterEmail || null,
        jurisdiction: jurisdiction || null,
        target,
        source_url: sourceUrl || null,
        summary,
        deadline: deadline || null,
        status: "requested",
        metadata: {
          price_cents: service.priceCents,
          billing_label: service.billingLabel,
          packet,
        },
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.warn(JSON.stringify({ level: "warn", msg: "service_request_insert_skipped", error: error.message }));
    } else {
      requestId = (data?.id as string | undefined) ?? null;
    }
  }

  await recordPaymentEvent({
    eventName: "service_request_submitted",
    eventType: "service_request_submitted",
    serviceSlug: service.slug,
    customerId: customer.id,
    payload: {
      request_id: requestId,
      price_cents: service.priceCents,
      billing_label: service.billingLabel,
      has_source_url: Boolean(sourceUrl),
      has_deadline: Boolean(deadline),
    },
  });

  return NextResponse.json({ ok: true, requestId });
}
