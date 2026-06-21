-- ============================================================
-- RepWatchr Payments, Service Requests, and Stripe Events
-- ============================================================
-- Run in the Supabase SQL Editor after the base schema.
-- Public reads are intentionally not enabled for request/payment tables.

create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  name text,
  stripe_customer_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.customers add column if not exists email text;
alter table public.customers add column if not exists name text;
alter table public.customers add column if not exists stripe_customer_id text;
alter table public.customers add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.customers add column if not exists created_at timestamptz not null default now();
alter table public.customers add column if not exists updated_at timestamptz not null default now();

drop index if exists public.customers_stripe_customer_id_uidx;
create unique index customers_stripe_customer_id_uidx
  on public.customers(stripe_customer_id);
create index if not exists customers_email_idx on public.customers(lower(email));
create index if not exists customers_user_id_idx on public.customers(user_id);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  service_slug text not null,
  service_name text not null,
  requester_name text,
  requester_email text,
  jurisdiction text,
  target text,
  source_url text,
  summary text,
  deadline text,
  status text not null default 'requested',
  submitted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_requests add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.service_requests add column if not exists service_slug text;
alter table public.service_requests add column if not exists service_name text;
alter table public.service_requests add column if not exists requester_name text;
alter table public.service_requests add column if not exists requester_email text;
alter table public.service_requests add column if not exists jurisdiction text;
alter table public.service_requests add column if not exists target text;
alter table public.service_requests add column if not exists source_url text;
alter table public.service_requests add column if not exists summary text;
alter table public.service_requests add column if not exists deadline text;
alter table public.service_requests add column if not exists status text not null default 'requested';
alter table public.service_requests add column if not exists submitted_at timestamptz;
alter table public.service_requests add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.service_requests add column if not exists created_at timestamptz not null default now();
alter table public.service_requests add column if not exists updated_at timestamptz not null default now();

create index if not exists service_requests_service_slug_idx on public.service_requests(service_slug);
create index if not exists service_requests_status_idx on public.service_requests(status);
create index if not exists service_requests_customer_id_idx on public.service_requests(customer_id);
create index if not exists service_requests_created_at_idx on public.service_requests(created_at desc);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  service_request_id uuid references public.service_requests(id) on delete set null,
  service_slug text not null,
  service_name text not null,
  mode text not null check (mode in ('payment', 'subscription')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status text not null default 'pending_checkout',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  checkout_url text,
  paid_at timestamptz,
  canceled_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.orders add column if not exists service_request_id uuid references public.service_requests(id) on delete set null;
alter table public.orders add column if not exists service_slug text;
alter table public.orders add column if not exists service_name text;
alter table public.orders add column if not exists mode text;
alter table public.orders add column if not exists amount_cents integer;
alter table public.orders add column if not exists currency text not null default 'usd';
alter table public.orders add column if not exists status text not null default 'pending_checkout';
alter table public.orders add column if not exists stripe_checkout_session_id text;
alter table public.orders add column if not exists stripe_payment_intent_id text;
alter table public.orders add column if not exists stripe_subscription_id text;
alter table public.orders add column if not exists stripe_customer_id text;
alter table public.orders add column if not exists checkout_url text;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists canceled_at timestamptz;
alter table public.orders add column if not exists refunded_at timestamptz;
alter table public.orders add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists created_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();

drop index if exists public.orders_stripe_checkout_session_id_uidx;
create unique index orders_stripe_checkout_session_id_uidx
  on public.orders(stripe_checkout_session_id);
create index if not exists orders_service_slug_idx on public.orders(service_slug);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_service_request_id_idx on public.orders(service_request_id);
create index if not exists orders_stripe_payment_intent_id_idx on public.orders(stripe_payment_intent_id);
create index if not exists orders_stripe_subscription_id_idx on public.orders(stripe_subscription_id);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  service_request_id uuid references public.service_requests(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  claim_id uuid,
  service_slug text,
  service_name text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  status text not null default 'pending',
  current_period_end timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.subscriptions alter column user_id drop not null;
alter table public.subscriptions add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.subscriptions add column if not exists service_request_id uuid references public.service_requests(id) on delete set null;
alter table public.subscriptions add column if not exists order_id uuid references public.orders(id) on delete set null;
alter table public.subscriptions add column if not exists claim_id uuid;
alter table public.subscriptions add column if not exists service_slug text;
alter table public.subscriptions add column if not exists service_name text;
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists stripe_price_id text;
alter table public.subscriptions add column if not exists status text not null default 'pending';
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists canceled_at timestamptz;
alter table public.subscriptions add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.subscriptions add column if not exists created_at timestamptz not null default now();
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();

drop index if exists public.subscriptions_stripe_subscription_id_uidx;
create unique index subscriptions_stripe_subscription_id_uidx
  on public.subscriptions(stripe_subscription_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_claim_id_idx on public.subscriptions(claim_id);
create index if not exists subscriptions_service_slug_idx on public.subscriptions(service_slug);
create index if not exists subscriptions_customer_id_idx on public.subscriptions(customer_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_type text not null,
  stripe_event_id text,
  livemode boolean,
  service_slug text,
  order_id uuid references public.orders(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  amount_cents integer,
  currency text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.payment_events add column if not exists event_name text;
alter table public.payment_events add column if not exists event_type text;
alter table public.payment_events add column if not exists stripe_event_id text;
alter table public.payment_events add column if not exists livemode boolean;
alter table public.payment_events add column if not exists service_slug text;
alter table public.payment_events add column if not exists order_id uuid references public.orders(id) on delete set null;
alter table public.payment_events add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null;
alter table public.payment_events add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.payment_events add column if not exists stripe_customer_id text;
alter table public.payment_events add column if not exists stripe_checkout_session_id text;
alter table public.payment_events add column if not exists stripe_subscription_id text;
alter table public.payment_events add column if not exists amount_cents integer;
alter table public.payment_events add column if not exists currency text;
alter table public.payment_events add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.payment_events add column if not exists created_at timestamptz not null default now();

drop index if exists public.payment_events_stripe_event_name_uidx;
create unique index payment_events_stripe_event_name_uidx
  on public.payment_events(stripe_event_id, event_name);
create index if not exists payment_events_event_name_idx on public.payment_events(event_name);
create index if not exists payment_events_service_slug_idx on public.payment_events(service_slug);
create index if not exists payment_events_created_at_idx on public.payment_events(created_at desc);
create index if not exists payment_events_order_id_idx on public.payment_events(order_id);
create index if not exists payment_events_customer_id_idx on public.payment_events(customer_id);

alter table public.customers enable row level security;
alter table public.service_requests enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "Users can view own payment customer" on public.customers;
create policy "Users can view own payment customer"
  on public.customers for select
  using (auth.uid() = user_id);

drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (
    exists (
      select 1
      from public.customers c
      where c.id = orders.customer_id
        and c.user_id = auth.uid()
    )
  );

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
  before update on public.customers
  for each row execute function public.handle_updated_at();

drop trigger if exists set_service_requests_updated_at on public.service_requests;
create trigger set_service_requests_updated_at
  before update on public.service_requests
  for each row execute function public.handle_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();
