import { NextResponse, type NextRequest } from "next/server";
import {
  asBoolean,
  asNumber,
  asRecord,
  asString,
  cleanText,
  recordPaymentEvent,
  upsertPaymentCustomer,
} from "@/lib/payment-records";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { verifyStripeSignature } from "@/lib/stripe-signature";

export const runtime = "nodejs";

type StripeObject = Record<string, unknown>;
type StripeEvent = {
  id?: string;
  type?: string;
  livemode?: boolean;
  data?: { object?: unknown };
};

function nonEmptyString(value: unknown) {
  const text = asString(value)?.trim();
  return text || null;
}

function periodEndFromSeconds(seconds: unknown) {
  const value = asNumber(seconds);
  return value ? new Date(value * 1000).toISOString() : null;
}

function normalizeStatus(value: unknown) {
  const status = asString(value) ?? "pending";
  if (
    [
      "pending",
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
    ].includes(status)
  ) {
    return status;
  }

  return "pending";
}

function stripeObjectId(value: unknown) {
  return typeof value === "string" ? value : asString(asRecord(value).id);
}

function getSubscriptionPriceId(subscription: StripeObject) {
  const items = asRecord(subscription.items);
  const data = Array.isArray(items.data) ? items.data : [];
  const firstItem = asRecord(data[0]);
  const price = asRecord(firstItem.price);
  return asString(price.id);
}

function eventMeta(event: StripeEvent) {
  return {
    stripeEventId: event.id ?? null,
    eventType: event.type ?? "unknown",
    livemode: asBoolean(event.livemode) ?? null,
  };
}

async function recordProfileCheckoutSession(session: StripeObject, event: StripeEvent) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { error: "Supabase service role is not configured." };
  }

  const metadata = asRecord(session.metadata);
  const userId = nonEmptyString(metadata.user_id);
  const claimId = nonEmptyString(metadata.claim_id);
  const subscriptionId = nonEmptyString(session.subscription);
  const stripeCustomerId = stripeObjectId(session.customer);

  if (!userId || !claimId) {
    return { error: "Checkout session metadata is missing user_id or claim_id." };
  }

  if (!subscriptionId) {
    return { error: undefined };
  }

  const payload = {
    user_id: userId,
    claim_id: claimId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: subscriptionId,
    status: "active",
  };

  const { data: updatedPendingRows, error: updateError } = await supabase
    .from("subscriptions")
    .update(payload)
    .eq("user_id", userId)
    .eq("claim_id", claimId)
    .is("stripe_subscription_id", null)
    .in("status", ["pending", "incomplete"])
    .select("id");

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updatedPendingRows?.length) {
    const { error } = await supabase
      .from("subscriptions")
      .upsert(payload, { onConflict: "stripe_subscription_id" });
    if (error) return { error: error.message };
  }

  await recordPaymentEvent({
    eventName: "checkout_completed",
    eventType: event.type,
    stripeEventId: event.id,
    livemode: event.livemode ?? null,
    stripeCustomerId,
    stripeCheckoutSessionId: nonEmptyString(session.id),
    stripeSubscriptionId: subscriptionId,
    payload: {
      source: "profile_claim_checkout",
      claim_id: claimId,
      payment_status: nonEmptyString(session.payment_status),
      mode: nonEmptyString(session.mode),
    },
  });

  return { error: undefined };
}

async function recordServiceCheckoutSession(session: StripeObject, event: StripeEvent) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { error: "Supabase service role is not configured." };
  }

  const metadata = asRecord(session.metadata);
  const serviceSlug = nonEmptyString(metadata.service_slug);
  const serviceName = nonEmptyString(metadata.service_name);
  const orderId = nonEmptyString(metadata.order_id);
  const serviceRequestId = nonEmptyString(metadata.service_request_id);
  const metadataCustomerId = nonEmptyString(metadata.payment_customer_id);
  const stripeCheckoutSessionId = nonEmptyString(session.id);
  const stripeCustomerId = stripeObjectId(session.customer);
  const stripeSubscriptionId = nonEmptyString(session.subscription);
  const stripePaymentIntentId = nonEmptyString(session.payment_intent);
  const amountCents = asNumber(session.amount_total);
  const currency = nonEmptyString(session.currency);
  const customerDetails = asRecord(session.customer_details);
  const paymentStatus = nonEmptyString(session.payment_status);
  const mode = nonEmptyString(session.mode);

  if (!serviceSlug || !stripeCheckoutSessionId) {
    return { error: "Service checkout metadata is missing service_slug or session ID." };
  }

  const paymentCustomer = await upsertPaymentCustomer({
    stripeCustomerId,
    email: nonEmptyString(customerDetails.email),
    name: nonEmptyString(customerDetails.name),
    metadata: {
      source: "stripe_checkout_completed",
      service_slug: serviceSlug,
    },
  });
  const customerId = metadataCustomerId ?? paymentCustomer.id;
  const orderStatus = stripeSubscriptionId
    ? "active"
    : paymentStatus === "paid"
      ? "paid"
      : "checkout_completed";
  const paidAt = paymentStatus === "paid" || stripeSubscriptionId ? new Date().toISOString() : null;
  const orderPayload = {
    customer_id: customerId,
    service_request_id: serviceRequestId,
    service_slug: serviceSlug,
    service_name: serviceName,
    mode,
    amount_cents: amountCents,
    currency,
    status: orderStatus,
    stripe_checkout_session_id: stripeCheckoutSessionId,
    stripe_payment_intent_id: stripePaymentIntentId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    paid_at: paidAt,
    metadata: {
      source: "stripe_checkout_completed",
      payment_status: paymentStatus,
    },
  };

  if (orderId) {
    const { data: updatedRows, error: updateError } = await supabase
      .from("orders")
      .update(orderPayload)
      .eq("id", orderId)
      .select("id");

    if (updateError) return { error: updateError.message };

    if (!updatedRows?.length) {
      const { error } = await supabase
        .from("orders")
        .upsert({ id: orderId, ...orderPayload }, { onConflict: "id" });
      if (error) return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("orders")
      .upsert(orderPayload, { onConflict: "stripe_checkout_session_id" });
    if (error) return { error: error.message };
  }

  if (serviceRequestId) {
    const { error } = await supabase
      .from("service_requests")
      .update({
        customer_id: customerId,
        status: stripeSubscriptionId ? "active_subscription" : orderStatus,
        submitted_at: paidAt,
        metadata: {
          checkout_session_id: stripeCheckoutSessionId,
          payment_status: paymentStatus,
        },
      })
      .eq("id", serviceRequestId);
    if (error) return { error: error.message };
  }

  if (stripeSubscriptionId) {
    const { error } = await supabase.from("subscriptions").upsert(
      {
        customer_id: customerId,
        service_request_id: serviceRequestId,
        order_id: orderId,
        service_slug: serviceSlug,
        service_name: serviceName,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        status: "active",
        metadata: {
          source: "stripe_checkout_completed",
        },
      },
      { onConflict: "stripe_subscription_id" }
    );
    if (error) return { error: error.message };
  }

  const meta = eventMeta(event);
  await recordPaymentEvent({
    eventName: "checkout_completed",
    eventType: meta.eventType,
    stripeEventId: meta.stripeEventId,
    livemode: meta.livemode,
    serviceSlug,
    orderId,
    customerId,
    stripeCustomerId,
    stripeCheckoutSessionId,
    stripeSubscriptionId,
    amountCents,
    currency,
    payload: {
      payment_status: paymentStatus,
      mode,
    },
  });

  if (stripeSubscriptionId) {
    await recordPaymentEvent({
      eventName: "subscription_started",
      eventType: meta.eventType,
      stripeEventId: meta.stripeEventId,
      livemode: meta.livemode,
      serviceSlug,
      orderId,
      customerId,
      stripeCustomerId,
      stripeCheckoutSessionId,
      stripeSubscriptionId,
      amountCents,
      currency,
      payload: {
        source: "checkout_session_completed",
      },
    });
  }

  return { error: undefined };
}

async function recordCheckoutSession(session: StripeObject, event: StripeEvent) {
  const metadata = asRecord(session.metadata);
  const serviceSlug = nonEmptyString(metadata.service_slug);
  if (serviceSlug) {
    return recordServiceCheckoutSession(session, event);
  }

  return recordProfileCheckoutSession(session, event);
}

async function upsertSubscription(subscription: StripeObject, event: StripeEvent) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { error: "Supabase service role is not configured." };
  }

  const metadata = asRecord(subscription.metadata);
  const subscriptionId = nonEmptyString(subscription.id);
  const serviceSlug = nonEmptyString(metadata.service_slug);
  const serviceName = nonEmptyString(metadata.service_name);
  const userId = nonEmptyString(metadata.user_id);
  const claimId = nonEmptyString(metadata.claim_id);
  const orderId = nonEmptyString(metadata.order_id);
  const serviceRequestId = nonEmptyString(metadata.service_request_id);
  const metadataCustomerId = nonEmptyString(metadata.payment_customer_id);

  if (!subscriptionId) {
    return { error: "Stripe subscription ID is missing." };
  }

  if (!serviceSlug && !userId) {
    return { error: "Stripe subscription metadata is missing user_id or service_slug." };
  }

  const stripeCustomerId = stripeObjectId(subscription.customer);
  const paymentCustomer = await upsertPaymentCustomer({
    userId,
    stripeCustomerId,
    metadata: {
      source: "stripe_subscription_event",
      service_slug: serviceSlug,
      claim_id: claimId,
    },
  });
  const customerId = metadataCustomerId ?? paymentCustomer.id;
  const status = normalizeStatus(subscription.status);
  const canceledAt = status === "canceled" ? new Date().toISOString() : null;
  const payload = {
    user_id: userId,
    customer_id: customerId,
    service_request_id: serviceRequestId,
    order_id: orderId,
    claim_id: claimId,
    service_slug: serviceSlug,
    service_name: serviceName,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: getSubscriptionPriceId(subscription),
    status,
    current_period_end: periodEndFromSeconds(subscription.current_period_end),
    canceled_at: canceledAt,
    metadata: {
      source: serviceSlug ? "repwatchr_services" : "profile_claim_subscription",
    },
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(payload, { onConflict: "stripe_subscription_id" });

  if (error) return { error: error.message };

  if (serviceSlug && orderId) {
    await supabase
      .from("orders")
      .update({
        status: status === "canceled" ? "subscription_canceled" : status,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: stripeCustomerId,
        canceled_at: canceledAt,
      })
      .eq("id", orderId);
  }

  if (serviceSlug && serviceRequestId) {
    await supabase
      .from("service_requests")
      .update({
        status: status === "canceled" ? "subscription_canceled" : "active_subscription",
      })
      .eq("id", serviceRequestId);
  }

  const meta = eventMeta(event);
  const eventName =
    event.type === "customer.subscription.created"
      ? "subscription_started"
      : event.type === "customer.subscription.deleted"
        ? "subscription_canceled"
        : "subscription_updated";

  await recordPaymentEvent({
    eventName,
    eventType: meta.eventType,
    stripeEventId: meta.stripeEventId,
    livemode: meta.livemode,
    serviceSlug,
    orderId,
    customerId,
    stripeCustomerId,
    stripeSubscriptionId: subscriptionId,
    payload: {
      status,
      claim_id: claimId,
      current_period_end: periodEndFromSeconds(subscription.current_period_end),
    },
  });

  return { error: undefined };
}

async function recordPaymentFailed(invoice: StripeObject, event: StripeEvent) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { error: "Supabase service role is not configured." };
  }

  const subscriptionId = stripeObjectId(invoice.subscription);
  const stripeCustomerId = stripeObjectId(invoice.customer);
  const amountCents = asNumber(invoice.amount_due) ?? asNumber(invoice.amount_remaining);
  const currency = nonEmptyString(invoice.currency);
  let serviceSlug: string | null = null;
  let orderId: string | null = null;

  if (subscriptionId) {
    const { data } = await supabase
      .from("subscriptions")
      .select("id, service_slug, order_id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();

    serviceSlug = (data?.service_slug as string | undefined) ?? null;
    orderId = (data?.order_id as string | undefined) ?? null;

    await supabase
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("stripe_subscription_id", subscriptionId);
  }

  const meta = eventMeta(event);
  await recordPaymentEvent({
    eventName: "payment_failed",
    eventType: meta.eventType,
    stripeEventId: meta.stripeEventId,
    livemode: meta.livemode,
    serviceSlug,
    orderId,
    stripeCustomerId,
    stripeSubscriptionId: subscriptionId,
    amountCents,
    currency,
    payload: {
      invoice_id: nonEmptyString(invoice.id),
      status: nonEmptyString(invoice.status),
    },
  });

  return { error: undefined };
}

async function recordRefund(object: StripeObject, event: StripeEvent) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { error: "Supabase service role is not configured." };
  }

  const isCharge = event.type === "charge.refunded";
  const stripePaymentIntentId = stripeObjectId(object.payment_intent);
  const stripeCustomerId = stripeObjectId(object.customer);
  const amountCents =
    asNumber(isCharge ? object.amount_refunded : object.amount) ??
    asNumber(object.amount) ??
    null;
  const currency = nonEmptyString(object.currency);
  let serviceSlug: string | null = null;
  let orderId: string | null = null;

  if (stripePaymentIntentId) {
    const { data } = await supabase
      .from("orders")
      .select("id, service_slug")
      .eq("stripe_payment_intent_id", stripePaymentIntentId)
      .maybeSingle();

    orderId = (data?.id as string | undefined) ?? null;
    serviceSlug = (data?.service_slug as string | undefined) ?? null;

    await supabase
      .from("orders")
      .update({
        status: "refunded",
        refunded_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", stripePaymentIntentId);
  }

  const meta = eventMeta(event);
  await recordPaymentEvent({
    eventName: cleanText(event.type?.replace(".", "_"), 120) || "refund_event",
    eventType: meta.eventType,
    stripeEventId: meta.stripeEventId,
    livemode: meta.livemode,
    serviceSlug,
    orderId,
    stripeCustomerId,
    amountCents,
    currency,
    payload: {
      object_id: nonEmptyString(object.id),
      payment_intent: stripePaymentIntentId,
      status: nonEmptyString(object.status),
    },
  });

  return { error: undefined };
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as StripeEvent;
  const object = asRecord(event.data?.object);
  let result: { error?: string | undefined } = { error: undefined };

  if (event.type === "checkout.session.completed") {
    result = await recordCheckoutSession(object, event);
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    result = await upsertSubscription(object, event);
  }

  if (event.type === "invoice.payment_failed") {
    result = await recordPaymentFailed(object, event);
  }

  if (
    event.type === "charge.refunded" ||
    event.type === "refund.created" ||
    event.type === "refund.updated"
  ) {
    result = await recordRefund(object, event);
  }

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
