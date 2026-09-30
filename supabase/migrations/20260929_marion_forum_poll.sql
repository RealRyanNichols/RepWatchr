-- Stage the question for review; opening it is a separate release action.
-- No response rows or existing candidate poll are changed.
begin;
insert into public.race_community_polls (slug, question, status, minimum_sample)
values ('marion-county-forum-format-2026', 'Which moderation format would you prefer for a local candidate forum?', 'draft', 25)
on conflict (slug) do nothing;

insert into public.race_community_poll_options (poll_id, option_id, label, display_order)
select poll.id, option.option_id, option.label, option.display_order
from public.race_community_polls poll
cross join (values
  ('organizer-selected', 'A moderator selected by the organizer', 1),
  ('mutually-agreed', 'A moderator agreed to by the candidates', 2),
  ('moderator-panel', 'A panel of moderators', 3),
  ('no-preference', 'No preference / not sure', 4)
) as option(option_id, label, display_order)
where poll.slug = 'marion-county-forum-format-2026'
on conflict (poll_id, option_id) do nothing;
commit;
