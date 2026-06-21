import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type JsonPayload = Record<string, unknown>;

export type PaymentEventInput = {
  eventName: string;
  eventType?: string | null;
  stripeEventId?: string | null;
  livemode?: boolean | null;
  serviceSlug?: string | null;
  orderId?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
  stripeCustomerId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  payload?: JsonPayload | null;
};

export type PaymentCustomerInput = {
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  stripeCustomerId?: string | null;
  metadata?: JsonPayload | null;
};

export function cleanText(value: unknown, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function cleanLongText(value: unknown, maxLength = 5000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function cleanEmail(value: unknown) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

export function cleanUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString().slice(0, 1000);
  } catch {
    return "";
  }
}

export function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

export function asNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

export function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

export function asRecord(value: unknown): JsonPayload {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonPayload) : {};
}

export async function upsertPaymentCustomer(input: PaymentCustomerInput) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { id: null as string | null, skipped: true };
  }

  const stripeCustomerId = cleanText(input.stripeCustomerId, 255) || null;
  const email = cleanEmail(input.email) || null;
  const name = cleanText(input.name, 255) || null;
  const userId = cleanText(input.userId, 80) || null;

  if (!stripeCustomerId && !email && !userId) {
    return { id: null as string | null, skipped: false };
  }

  if (stripeCustomerId) {
    const { data, error } = await supabase
      .from("customers")
      .upsert(
        {
          user_id: userId,
          email,
          name,
          stripe_customer_id: stripeCustomerId,
          metadata: input.metadata ?? {},
        },
        { onConflict: "stripe_customer_id" }
      )
      .select("id")
      .maybeSingle();

    if (!error) return { id: (data?.id as string | undefined) ?? null, skipped: false };
    console.warn(JSON.stringify({ level: "warn", msg: "payment_customer_upsert_skipped", error: error.message }));
  }

  if (email) {
    const { data: existing, error: lookupError } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!lookupError && existing?.id) {
      const updatePayload: Record<string, unknown> = {
        user_id: userId,
        name,
        metadata: input.metadata ?? {},
      };
      if (stripeCustomerId) {
        updatePayload.stripe_customer_id = stripeCustomerId;
      }

      await supabase
        .from("customers")
        .update(updatePayload)
        .eq("id", existing.id);

      return { id: existing.id as string, skipped: false };
    }

    const { data, error } = await supabase
      .from("customers")
      .insert({
        user_id: userId,
        email,
        name,
        stripe_customer_id: stripeCustomerId,
        metadata: input.metadata ?? {},
      })
      .select("id")
      .maybeSingle();

    if (!error) return { id: (data?.id as string | undefined) ?? null, skipped: false };
    console.warn(JSON.stringify({ level: "warn", msg: "payment_customer_insert_skipped", error: error.message }));
  }

  return { id: null as string | null, skipped: false };
}

export async function recordPaymentEvent(input: PaymentEventInput) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { skipped: true };
  }

  const row = {
    event_name: cleanText(input.eventName, 120),
    event_type: cleanText(input.eventType, 120) || cleanText(input.eventName, 120),
    stripe_event_id: cleanText(input.stripeEventId, 255) || null,
    livemode: input.livemode ?? null,
    service_slug: cleanText(input.serviceSlug, 120) || null,
    order_id: cleanText(input.orderId, 80) || null,
    subscription_id: cleanText(input.subscriptionId, 80) || null,
    customer_id: cleanText(input.customerId, 80) || null,
    stripe_customer_id: cleanText(input.stripeCustomerId, 255) || null,
    stripe_checkout_session_id: cleanText(input.stripeCheckoutSessionId, 255) || null,
    stripe_subscription_id: cleanText(input.stripeSubscriptionId, 255) || null,
    amount_cents: typeof input.amountCents === "number" ? input.amountCents : null,
    currency: cleanText(input.currency, 16) || null,
    payload: input.payload ?? {},
  };

  if (!row.event_name) return { skipped: true };

  const result = row.stripe_event_id
    ? await supabase.from("payment_events").upsert(row, { onConflict: "stripe_event_id,event_name" })
    : await supabase.from("payment_events").insert(row);

  if (result.error) {
    console.warn(JSON.stringify({ level: "warn", msg: "payment_event_insert_skipped", error: result.error.message }));
    return { skipped: true, error: result.error.message };
  }

  return { skipped: false };
}
