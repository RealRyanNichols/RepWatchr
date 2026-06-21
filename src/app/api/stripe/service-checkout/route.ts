import { NextResponse, type NextRequest } from "next/server";
import { getRepWatchrService } from "@/data/repwatchr-services";
import {
  getRepWatchrPaymentProduct,
  type RepWatchrPaymentProduct,
} from "@/lib/repwatchr-payment-products";
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

type ServiceCheckoutBody = {
  serviceSlug?: unknown;
  requesterName?: unknown;
  requesterEmail?: unknown;
  jurisdiction?: unknown;
  target?: unknown;
  sourceUrl?: unknown;
  summary?: unknown;
  deadline?: unknown;
};

type CheckoutResponse = {
  id?: string;
  url?: string;
  customer?: string;
  subscription?: string;
  payment_intent?: string;
  error?: { message?: string };
};

function siteUrlFromRequest(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  ).replace(/\/$/, "");
}

function appendCheckoutLineItem(form: URLSearchParams, product: RepWatchrPaymentProduct) {
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", product.currency);
  form.set("line_items[0][price_data][unit_amount]", String(product.priceCents));
  form.set("line_items[0][price_data][product_data][name]", product.name);
  form.set("line_items[0][price_data][product_data][description]", product.description);

  if (product.mode === "subscription") {
    form.set("line_items[0][price_data][recurring][interval]", product.recurringInterval ?? "month");
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as ServiceCheckoutBody | null;
  const serviceSlug = cleanText(body?.serviceSlug, 120);
  const service = getRepWatchrService(serviceSlug);
  const product = getRepWatchrPaymentProduct(serviceSlug);

  if (!service || !product) {
    return NextResponse.json({ error: "Choose a valid paid RepWatchr service." }, { status: 400 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({
      fallback: true,
      message: "Request this package.",
      fallbackHref: `/services/${service.slug}?request=1#request-package`,
    });
  }

  const requesterName = cleanText(body?.requesterName, 255);
  const requesterEmail = cleanEmail(body?.requesterEmail);
  const jurisdiction = cleanText(body?.jurisdiction, 500);
  const target = cleanText(body?.target, 500);
  const sourceUrl = cleanUrl(body?.sourceUrl);
  const summary = cleanLongText(body?.summary, 5000);
  const deadline = cleanText(body?.deadline, 255);
  const supabase = getSupabaseAdminClient();
  const customer = await upsertPaymentCustomer({
    name: requesterName,
    email: requesterEmail,
    metadata: {
      source: "repwatchr_service_checkout",
      service_slug: service.slug,
    },
  });

  let serviceRequestId: string | null = null;
  let orderId: string | null = null;

  if (supabase) {
    const { data: serviceRequest, error: serviceRequestError } = await supabase
      .from("service_requests")
      .insert({
        customer_id: customer.id,
        service_slug: service.slug,
        service_name: service.name,
        requester_name: requesterName || null,
        requester_email: requesterEmail || null,
        jurisdiction: jurisdiction || null,
        target: target || null,
        source_url: sourceUrl || null,
        summary: summary || null,
        deadline: deadline || null,
        status: "checkout_started",
        metadata: {
          price_cents: product.priceCents,
          billing_mode: product.mode,
          checkout_source: "service_checkout_api",
        },
      })
      .select("id")
      .maybeSingle();

    if (serviceRequestError) {
      console.warn(JSON.stringify({ level: "warn", msg: "checkout_service_request_insert_skipped", error: serviceRequestError.message }));
    } else {
      serviceRequestId = (serviceRequest?.id as string | undefined) ?? null;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customer.id,
        service_request_id: serviceRequestId,
        service_slug: service.slug,
        service_name: service.name,
        mode: product.mode,
        amount_cents: product.priceCents,
        currency: product.currency,
        status: "pending_checkout",
        metadata: {
          checkout_source: "service_checkout_api",
        },
      })
      .select("id")
      .maybeSingle();

    if (orderError) {
      console.warn(JSON.stringify({ level: "warn", msg: "checkout_order_insert_skipped", error: orderError.message }));
    } else {
      orderId = (order?.id as string | undefined) ?? null;
    }
  }

  const siteUrl = siteUrlFromRequest(request);
  const form = new URLSearchParams();
  form.set("mode", product.mode);
  form.set("success_url", `${siteUrl}/services/checkout/success?session_id={CHECKOUT_SESSION_ID}&service=${service.slug}`);
  form.set("cancel_url", `${siteUrl}/services/checkout/cancel?service=${service.slug}`);
  form.set("client_reference_id", orderId ?? serviceRequestId ?? service.slug);
  form.set("allow_promotion_codes", "true");
  form.set("metadata[source]", "repwatchr_services");
  form.set("metadata[service_slug]", service.slug);
  form.set("metadata[service_name]", service.name);
  form.set("metadata[service_mode]", product.mode);
  form.set("metadata[order_id]", orderId ?? "");
  form.set("metadata[service_request_id]", serviceRequestId ?? "");
  form.set("metadata[payment_customer_id]", customer.id ?? "");
  form.set("metadata[amount_cents]", String(product.priceCents));
  form.set("metadata[currency]", product.currency);

  if (product.mode === "subscription") {
    form.set("subscription_data[metadata][source]", "repwatchr_services");
    form.set("subscription_data[metadata][service_slug]", service.slug);
    form.set("subscription_data[metadata][service_name]", service.name);
    form.set("subscription_data[metadata][order_id]", orderId ?? "");
    form.set("subscription_data[metadata][service_request_id]", serviceRequestId ?? "");
    form.set("subscription_data[metadata][payment_customer_id]", customer.id ?? "");
  }

  if (requesterEmail) {
    form.set("customer_email", requesterEmail);
  }

  appendCheckoutLineItem(form, product);

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2026-02-25.clover",
    },
    body: form.toString(),
  });

  const checkout = (await stripeResponse.json()) as CheckoutResponse;
  if (!stripeResponse.ok || !checkout.url || !checkout.id) {
    return NextResponse.json(
      { error: checkout.error?.message ?? "Checkout could not start. Use the request form." },
      { status: 502 }
    );
  }

  if (supabase && orderId) {
    await supabase
      .from("orders")
      .update({
        stripe_checkout_session_id: checkout.id,
        checkout_url: checkout.url,
        status: "checkout_started",
      })
      .eq("id", orderId);
  }

  await recordPaymentEvent({
    eventName: "checkout_started",
    eventType: "checkout_started",
    serviceSlug: service.slug,
    orderId,
    customerId: customer.id,
    stripeCheckoutSessionId: checkout.id,
    amountCents: product.priceCents,
    currency: product.currency,
    payload: {
      mode: product.mode,
      success_url: `/services/checkout/success?service=${service.slug}`,
      cancel_url: `/services/checkout/cancel?service=${service.slug}`,
      has_request_context: Boolean(target || summary || sourceUrl || jurisdiction || deadline),
    },
  });

  return NextResponse.json({ url: checkout.url, sessionId: checkout.id, orderId, serviceRequestId });
}
