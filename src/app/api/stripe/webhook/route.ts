import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type StripeObject = Record<string, unknown>;

function asRecord(value: unknown): StripeObject {
  return value && typeof value === "object" ? (value as StripeObject) : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function parseStripeSignature(header: string | null) {
  if (!header) return null;

  const parsed: { t?: string; v1?: string } = {};
  for (const part of header.split(",")) {
    const [key, ...valueParts] = part.split("=");
    const value = valueParts.join("=");
    if (key === "t") parsed.t = value;
    if (key === "v1" && !parsed.v1) parsed.v1 = value;
  }

  return parsed;
}

function verifyStripeSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed?.t || !parsed.v1) return false;

  const timestamp = Number(parsed.t);
  if (!Number.isFinite(timestamp)) return false;

  const timestampToleranceSeconds = 300;
  const age = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (age > timestampToleranceSeconds) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parsed.t}.${rawBody}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(parsed.v1, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
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

function getSubscriptionPriceId(subscription: StripeObject) {
  const items = asRecord(subscription.items);
  const data = Array.isArray(items.data) ? items.data : [];
  const firstItem = asRecord(data[0]);
  const price = asRecord(firstItem.price);
  return asString(price.id);
}

async function upsertSubscription(subscription: StripeObject) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { error: "Supabase service role is not configured." };
  }

  const metadata = asRecord(subscription.metadata);
  const subscriptionId = asString(subscription.id);
  const userId = asString(metadata.user_id);
  const claimId = asString(metadata.claim_id);

  if (!subscriptionId || !userId) {
    return { error: "Stripe subscription metadata is missing user_id." };
  }

  const customer = subscription.customer;
  const stripeCustomerId = typeof customer === "string" ? customer : asString(asRecord(customer).id);

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      claim_id: claimId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: getSubscriptionPriceId(subscription),
      status: normalizeStatus(subscription.status),
      current_period_end: periodEndFromSeconds(subscription.current_period_end),
    },
    { onConflict: "stripe_subscription_id" }
  );

  return { error: error?.message };
}

async function recordCheckoutSession(session: StripeObject) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { error: "Supabase service role is not configured." };
  }

  const metadata = asRecord(session.metadata);
  const userId = asString(metadata.user_id);
  const claimId = asString(metadata.claim_id);
  const subscriptionId = asString(session.subscription);
  const customerId = asString(session.customer);

  if (!userId || !claimId) {
    return { error: "Checkout session metadata is missing user_id or claim_id." };
  }

  if (!subscriptionId) {
    return { error: undefined };
  }

  const payload = {
    user_id: userId,
    claim_id: claimId,
    stripe_customer_id: customerId,
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

  if (updatedPendingRows?.length) {
    return { error: undefined };
  }

  const { error } = await supabase.from("subscriptions").upsert(
    {
      ...payload,
    },
    { onConflict: "stripe_subscription_id" }
  );

  return { error: error?.message };
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

  const event = JSON.parse(rawBody) as { type?: string; data?: { object?: unknown } };
  const object = asRecord(event.data?.object);

  if (event.type === "checkout.session.completed") {
    const result = await recordCheckoutSession(object);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const result = await upsertSubscription(object);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
