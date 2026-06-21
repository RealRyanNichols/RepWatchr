import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  const parsed = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...value] = part.split("=");
      return [key, value.join("=")];
    })
  );
  const timestamp = Number(parsed.t);
  if (!timestamp || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parsed.t}.${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(parsed.v1 ?? "", "hex");
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

const productCatalog = read("src/lib/repwatchr-payment-products.ts");
const checkoutRoute = read("src/app/api/stripe/service-checkout/route.ts");
const webhookRoute = read("src/app/api/stripe/webhook/route.ts");
const servicesPage = read("src/app/services/page.tsx");
const successPage = read("src/app/services/checkout/success/page.tsx");
const cancelPage = read("src/app/services/checkout/cancel/page.tsx");
const migration = read("supabase-payments.sql");

for (const [slug, cents] of [
  ["quick-record-check", "4900"],
  ["local-race-source-pack", "14900"],
  ["official-record-brief", "29900"],
  ["election-watch-desk", "75000"],
]) {
  assert(productCatalog.includes(`slug: "${slug}"`), `Missing product slug: ${slug}`);
  assert(productCatalog.includes(`priceCents: ${cents}`), `Missing server price for ${slug}`);
}

assert(productCatalog.includes('mode: "subscription"'), "Missing subscription product mode");
assert(checkoutRoute.includes("price_data"), "Checkout route must build line items server-side");
assert(checkoutRoute.includes("STRIPE_SECRET_KEY"), "Checkout route must check Stripe server secret");
assert(checkoutRoute.includes("fallback: true"), "Checkout route must expose clean missing-env fallback");
assert(checkoutRoute.includes("/services/checkout/success?session_id={CHECKOUT_SESSION_ID}"), "Missing checkout success redirect");
assert(checkoutRoute.includes("/services/checkout/cancel?service="), "Missing checkout cancel redirect");
assert(!servicesPage.includes("Stripe link not configured yet"), "Public Stripe setup language still exists");
assert(!read("src/data/repwatchr-services.ts").includes("NEXT_PUBLIC_REPWATCHR_PAYMENT_LINK"), "Public payment-link env vars still exist");

for (const eventType of [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
  "charge.refunded",
  "refund.created",
  "refund.updated",
]) {
  assert(webhookRoute.includes(eventType), `Webhook does not handle ${eventType}`);
}

for (const tableName of ["orders", "subscriptions", "service_requests", "customers", "payment_events"]) {
  assert(migration.includes(`public.${tableName}`), `Migration missing ${tableName}`);
}

assert(successPage.includes("checkout_completed"), "Success page does not track checkout_completed");
assert(successPage.includes("subscription_started"), "Success page does not track subscription_started");
assert(cancelPage.includes("checkout_canceled"), "Cancel page does not track checkout_canceled");

const secret = "whsec_test_secret";
const payload = JSON.stringify({ id: "evt_test", type: "checkout.session.completed" });
const timestamp = String(Math.floor(Date.now() / 1000));
const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
assert(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret), "Valid webhook signature failed");
assert(!verifyStripeSignature(payload, `t=${timestamp},v1=${"0".repeat(64)}`, secret), "Invalid webhook signature passed");

console.log("payment smoke checks passed");
