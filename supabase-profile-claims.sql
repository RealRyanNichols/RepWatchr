-- ============================================================
-- RepWatchr Profile Claims, Reviewed Content, Media, Roles, Billing
-- ============================================================
-- Run this after the base Supabase schema.
-- Public facts, evidence, scores, red flags, and sources remain locked.
-- Claimed profile content is separate and must be approved before public display.

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('admin', 'reviewer', 'researcher', 'claimed_official', 'journalist', 'voter')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  unique(user_id, role)
);

create table if not exists public.profile_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_type text not null check (
    profile_type in (
      'school_board',
      'official',
      'attorney',
      'law_firm',
      'media_company',
      'journalist',
      'editor',
      'newsroom_leadership'
    )
  ),
  profile_id text not null,
  profile_name text not null,
  district_slug text,
  official_email text,
  role_title text,
  proof_url text,
  proof_storage_path text,
  proof_notes text not null check (char_length(proof_notes) between 20 and 5000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'revoked')),
  reviewer_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (official_email is not null or proof_url is not null or proof_storage_path is not null),
  unique(user_id, profile_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  claim_id uuid references public.profile_claims(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'none' check (status in ('none', 'pending', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')),
  current_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.claimed_profile_content (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid references public.profile_claims(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id text not null,
  about_me text check (char_length(coalesce(about_me, '')) <= 2500),
  personal_statement text check (char_length(coalesce(personal_statement, '')) <= 5000),
  official_website text,
  campaign_website text,
  facebook_url text,
  x_url text,
  youtube_url text,
  status text not null default 'pending_review' check (status in ('draft', 'pending_review', 'approved', 'rejected', 'archived')),
  version integer not null default 1,
  reviewer_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.profile_media (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid references public.profile_claims(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id text not null,
  media_type text not null check (media_type in ('headshot', 'photo', 'video')),
  storage_bucket text,
  storage_path text,
  public_url text,
  source_url text,
  caption text check (char_length(coalesce(caption, '')) <= 1000),
  credit text check (char_length(coalesce(credit, '')) <= 250),
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected', 'archived')),
  reviewer_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (storage_path is not null or public_url is not null)
);

create table if not exists public.profile_claim_audit (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid references public.profile_claims(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists idx_user_roles_user on public.user_roles(user_id);
create index if not exists idx_profile_claims_user on public.profile_claims(user_id);
create index if not exists idx_profile_claims_profile on public.profile_claims(profile_id);
create index if not exists idx_profile_claims_status on public.profile_claims(status, created_at desc);
create index if not exists idx_claimed_content_profile_status on public.claimed_profile_content(profile_id, status, updated_at desc);
create index if not exists idx_profile_media_profile_status on public.profile_media(profile_id, status, media_type, updated_at desc);
create index if not exists idx_subscriptions_claim on public.subscriptions(claim_id);

alter table public.user_roles enable row level security;
alter table public.profile_claims enable row level security;
alter table public.subscriptions enable row level security;
alter table public.claimed_profile_content enable row level security;
alter table public.profile_media enable row level security;
alter table public.profile_claim_audit enable row level security;

create or replace function public.is_repw_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'reviewer')
  );
$$;

drop policy if exists "Users can read own roles and admins can read all roles" on public.user_roles;
drop policy if exists "Admins can manage roles" on public.user_roles;
drop policy if exists "Users can create own profile claims" on public.profile_claims;
drop policy if exists "Users can read own claims and admins can read all claims" on public.profile_claims;
drop policy if exists "Admins can update profile claims" on public.profile_claims;
drop policy if exists "Users can read own subscriptions and admins can read all subscriptions" on public.subscriptions;
drop policy if exists "Admins and service flows can manage subscriptions" on public.subscriptions;
drop policy if exists "Public can read approved claimed profile content" on public.claimed_profile_content;
drop policy if exists "Approved subscribed claimants can submit profile content" on public.claimed_profile_content;
drop policy if exists "Admins can review claimed profile content" on public.claimed_profile_content;
drop policy if exists "Public can read approved profile media" on public.profile_media;
drop policy if exists "Approved subscribed claimants can submit profile media" on public.profile_media;
drop policy if exists "Admins can review profile media" on public.profile_media;
drop policy if exists "Users can read own audit and admins can read all audit" on public.profile_claim_audit;
drop policy if exists "Authenticated users can insert claim audit" on public.profile_claim_audit;

create policy "Users can read own roles and admins can read all roles"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_repw_admin());

create policy "Admins can manage roles"
  on public.user_roles for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users can create own profile claims"
  on public.profile_claims for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own claims and admins can read all claims"
  on public.profile_claims for select
  using (auth.uid() = user_id or public.is_repw_admin());

create policy "Admins can update profile claims"
  on public.profile_claims for update
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users can read own subscriptions and admins can read all subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_repw_admin());

create policy "Admins and service flows can manage subscriptions"
  on public.subscriptions for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read approved claimed profile content"
  on public.claimed_profile_content for select
  using (status = 'approved' or auth.uid() = user_id or public.is_repw_admin());

create policy "Approved subscribed claimants can submit profile content"
  on public.claimed_profile_content for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profile_claims pc
      join public.subscriptions s on s.claim_id = pc.id
      where pc.id = claim_id
        and pc.user_id = auth.uid()
        and pc.status = 'approved'
        and s.status in ('active', 'trialing')
    )
  );

create policy "Admins can review claimed profile content"
  on public.claimed_profile_content for update
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read approved profile media"
  on public.profile_media for select
  using (status = 'approved' or auth.uid() = user_id or public.is_repw_admin());

create policy "Approved subscribed claimants can submit profile media"
  on public.profile_media for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profile_claims pc
      join public.subscriptions s on s.claim_id = pc.id
      where pc.id = claim_id
        and pc.user_id = auth.uid()
        and pc.status = 'approved'
        and s.status in ('active', 'trialing')
    )
  );

create policy "Admins can review profile media"
  on public.profile_media for update
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users can read own audit and admins can read all audit"
  on public.profile_claim_audit for select
  using (
    public.is_repw_admin()
    or exists (
      select 1 from public.profile_claims pc
      where pc.id = claim_id and pc.user_id = auth.uid()
    )
  );

create policy "Authenticated users can insert claim audit"
  on public.profile_claim_audit for insert
  to authenticated
  with check (auth.uid() = actor_id or public.is_repw_admin());

drop trigger if exists set_profile_claims_updated_at on public.profile_claims;
create trigger set_profile_claims_updated_at
  before update on public.profile_claims
  for each row execute function public.handle_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

drop trigger if exists set_claimed_profile_content_updated_at on public.claimed_profile_content;
create trigger set_claimed_profile_content_updated_at
  before update on public.claimed_profile_content
  for each row execute function public.handle_updated_at();

drop trigger if exists set_profile_media_updated_at on public.profile_media;
create trigger set_profile_media_updated_at
  before update on public.profile_media
  for each row execute function public.handle_updated_at();

insert into storage.buckets (id, name, public)
values
  ('profile-submissions', 'profile-submissions', false),
  ('profile-media-approved', 'profile-media-approved', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload own profile submissions" on storage.objects;
drop policy if exists "Users can read own profile submissions and admins can read all" on storage.objects;
drop policy if exists "Public can read approved profile media bucket" on storage.objects;
drop policy if exists "Admins can manage approved profile media bucket" on storage.objects;

create policy "Users can upload own profile submissions"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own profile submissions and admins can read all"
  on storage.objects for select
  using (
    bucket_id = 'profile-submissions'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_repw_admin())
  );

create policy "Public can read approved profile media bucket"
  on storage.objects for select
  using (bucket_id = 'profile-media-approved');

create policy "Admins can manage approved profile media bucket"
  on storage.objects for all
  using (bucket_id = 'profile-media-approved' and public.is_repw_admin())
  with check (bucket_id = 'profile-media-approved' and public.is_repw_admin());

-- Bootstrap the first admin manually after your admin account exists:
-- insert into public.user_roles (user_id, role)
-- values ('YOUR_AUTH_USER_ID', 'admin');
