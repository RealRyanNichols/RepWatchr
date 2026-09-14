-- Where the audience actually is.
--
-- "In district or out of district" is the question that decides who the next
-- post is for, and nothing recorded could answer it. Vercel Analytics groups
-- by country, which cannot separate Longview from the rest of the world.
--
-- City and region only. No IP address is stored and nothing here identifies a
-- person: a city says who the audience is without saying who the reader is.
begin;

alter table public.site_analytics_events
  add column if not exists visitor_tier text
    check (visitor_tier is null or visitor_tier in ('home-district', 'east-texas', 'texas', 'national', 'outside')),
  add column if not exists visitor_city text,
  add column if not exists visitor_region text,
  add column if not exists visitor_country text;

-- The reporting query is "tier over a date range", so index that pair.
create index if not exists site_analytics_events_tier_idx
  on public.site_analytics_events (visitor_tier, created_at desc)
  where visitor_tier is not null;

comment on column public.site_analytics_events.visitor_tier is
  'Coverage tier derived from Vercel edge geo headers at request time. Rows written before this column shipped are null, which is unknown and not out-of-district.';

commit;
