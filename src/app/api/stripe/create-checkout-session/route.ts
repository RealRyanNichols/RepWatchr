import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type CheckoutResponse = {
  id?: string;
  url?: string;
  error?: { message?: string };
};

function isLiveSubscription(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Log in required." }, { status: 401 });
  }

  const { claimId } = (await request.json()) as { claimId?: string };
  if (!claimId) {
    return NextResponse.json({ error: "Missing claim ID." }, { status: 400 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const priceId =
    process.env.STRIPE_PROFILE_PRICE_ID ??
    process.env.NEXT_PUBLIC_STRIPE_PROFILE_PRICE_ID;

  if (!stripeSecretKey || !priceId) {
    return NextResponse.json(
      { error: "Stripe profile subscription environment variables are not configured." },
      { status: 503 }
    );
  }

  const { data: claim, error: claimError } = await supabase
    .from("profile_claims")
    .select("id, user_id, profile_id, profile_name, status")
    .eq("id", claimId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  if (!claim) {
    return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  }

  if (claim.status !== "approved") {
    return NextResponse.json(
      { error: "This claim must be approved before checkout." },
      { status: 403 }
    );
  }

  const adminSupabase = getSupabaseAdminClient();
  if (!adminSupabase) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 }
    );
  }

  const { data: existingSubscriptions, error: subscriptionLookupError } =
    await adminSupabase
      .from("subscriptions")
      .select("id, status")
      .eq("claim_id", claimId)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

  if (subscriptionLookupError) {
    return NextResponse.json({ error: subscriptionLookupError.message }, { status: 500 });
  }

  if (existingSubscriptions?.some((subscription) => isLiveSubscription(subscription.status))) {
    return NextResponse.json(
      { error: "This profile claim already has an active subscription." },
      { status: 409 }
    );
  }

  await adminSupabase
    .from("subscriptions")
    .delete()
    .eq("claim_id", claimId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .is("stripe_subscription_id", null);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("success_url", `${siteUrl}/dashboard/official-profile/${claimId}?checkout=success`);
  form.set("cancel_url", `${siteUrl}/dashboard/official-profile/${claimId}?checkout=cancelled`);
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("client_reference_id", claimId);
  form.set("metadata[user_id]", user.id);
  form.set("metadata[claim_id]", claimId);
  form.set("metadata[profile_id]", claim.profile_id);
  form.set("metadata[profile_name]", claim.profile_name);
  form.set("subscription_data[metadata][user_id]", user.id);
  form.set("subscription_data[metadata][claim_id]", claimId);
  form.set("subscription_data[metadata][profile_id]", claim.profile_id);
  if (user.email) {
    form.set("customer_email", user.email);
  }

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
  if (!stripeResponse.ok || !checkout.url) {
    return NextResponse.json(
      { error: checkout.error?.message ?? "Stripe checkout failed." },
      { status: 502 }
    );
  }

  await adminSupabase.from("subscriptions").insert({
    user_id: user.id,
    claim_id: claimId,
    stripe_price_id: priceId,
    status: "pending",
  });

  return NextResponse.json({ url: checkout.url });
}
