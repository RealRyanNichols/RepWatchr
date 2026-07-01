# Payment Feature Flag Plan

RepWatchr payments must stay gated until the product is ready to sell and fulfill.

## Current Flag

Flag:

- `ENABLE_PAYMENTS`

Default:

- `false`

Supported by:

- `src/lib/feature-flags.ts`
- `supabase-pricing-experiments.sql`
- `supabase-package-interest.sql`

## Behavior When `ENABLE_PAYMENTS=false`

Public pages should:

- show package interest forms
- show beta/request language
- collect demand
- avoid checkout
- avoid broken payment buttons
- avoid public Stripe setup language

Admin pages should:

- show payment readiness as blocked or collecting
- show demand signals
- recommend beta/manual fulfillment before checkout

## Behavior When `ENABLE_PAYMENTS=true`

This prompt does not build checkout.

When a future payment prompt runs, package pages may show checkout only after:

- package pricing is approved
- fulfillment workflow exists
- Stripe products/prices exist server-side
- webhook route is deployed and verified
- refund/support language exists
- admin dashboard can see orders
- source review and correction workflows are active

## Future Stripe Tables

Documented future tables:

### `customers`

- `id`
- `user_id`
- `email`
- `name`
- `stripe_customer_id`
- `created_at`
- `updated_at`

### `orders`

- `id`
- `customer_id`
- `package_key`
- `package_name`
- `amount`
- `currency`
- `status`
- `stripe_checkout_session_id`
- `stripe_payment_intent_id`
- `source_route`
- `metadata`
- `created_at`
- `updated_at`

### `subscriptions`

- `id`
- `customer_id`
- `package_key`
- `status`
- `stripe_subscription_id`
- `stripe_price_id`
- `current_period_start`
- `current_period_end`
- `cancel_at_period_end`
- `metadata`
- `created_at`
- `updated_at`

### `payment_events`

- `id`
- `stripe_event_id`
- `event_type`
- `customer_id`
- `order_id`
- `subscription_id`
- `payload`
- `processed_at`
- `created_at`

### `service_requests`

- `id`
- `customer_id`
- `order_id`
- `package_key`
- `target_entity`
- `jurisdiction`
- `source_url`
- `use_case`
- `status`
- `assigned_to`
- `due_at`
- `deliverable_url`
- `created_at`
- `updated_at`

## Future Webhook Events

Future Stripe webhook handling should cover:

- checkout completed
- subscription created
- subscription updated
- subscription canceled
- payment failed
- refund events

## Launch Rule

Turning on `ENABLE_PAYMENTS` is not enough.

Before public checkout, verify:

- server-side price configuration
- webhook signature validation
- success/cancel pages
- order creation
- subscription sync
- refund sync
- service request creation
- admin revenue dashboard
- customer support language
- privacy and terms language

Until those checks pass, keep package pages in interest-capture mode.
