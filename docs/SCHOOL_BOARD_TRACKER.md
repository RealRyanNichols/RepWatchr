# School Board Tracker

RepWatchr treats school boards as high-value local civic targets because board members make public decisions on budgets, curriculum, safety, facilities, contracts, personnel policy, public comment, and elections.

## What Exists

- `/school-boards` remains the national school board entry point.
- `/school-boards/texas` is served through the existing school-board dynamic route as the Texas state index.
- `/school-boards/texas/[districtSlug]` redirects to the canonical district page at `/school-boards/[districtSlug]` to avoid duplicate indexing.
- `/school-boards/[districtSlug]` now includes the local meeting tracker module.
- `/school-boards/[districtSlug]/[candidateId]` remains the member/candidate profile route.

## Public Body Page Sections

Every loaded district page should expose:

1. Body hero
   - Body name
   - Jurisdiction
   - Official URL
   - Meeting records URL
   - Source count
   - Completeness score
   - Watch body
   - Submit source
   - Request correction

2. Members
   - Member name
   - Role
   - District/place
   - Term text when available
   - Profile link
   - Source link
   - Correction CTA

3. Meetings
   - Upcoming or past meeting rows when available
   - Agenda link
   - Minutes link
   - Video link
   - Source status
   - Watch meeting/body CTA

4. Agenda/minutes source gaps
   - Missing agenda
   - Missing minutes
   - Missing video
   - Missing vote record
   - Missing member source
   - Submit source, build packet, and watch CTAs

5. Public questions
   - "Where can residents find the agenda for this meeting?"
   - "Where are the approved minutes posted?"
   - "Was this item voted on, and where is the public vote record?"
   - "Where can the public watch the recording?"

6. Package interest
   - School Board Monitor
   - County Monitor
   - Meeting Watch Desk
   - Public Records Packet

## Source Rules

Do not treat a meeting claim as complete unless it has an official agenda, approved minutes, video/audio, board packet, or other public source.

User submissions should enter the source queue. They should not auto-publish as verified meeting records.

## Data Adapter

The initial public UI uses `src/lib/local-meetings.ts` to adapt existing school-board district records into:

- public bodies
- members
- meetings
- meeting items
- source gaps
- public questions

This lets the product ship now while the Supabase-backed tables are applied.

## Supabase

Schema file:

- `supabase-local-meeting-tracker.sql`

Tables:

- `public_bodies`
- `public_body_members`
- `meetings`
- `meeting_items`
- `meeting_votes`

RLS is enabled. Public users can read active/public records. Admins can manage records.

## Analytics

Tracked events:

- `school_board_page_open`
- `public_body_watch_clicked`
- `meeting_open`
- `agenda_source_clicked`
- `minutes_source_clicked`
- `video_source_clicked`
- `meeting_source_gap_clicked`
- `public_question_copied`
- `school_board_package_interest_clicked`

## Admin

Route:

- `/admin/meetings`

The admin desk includes protected forms to create:

- public body
- meeting
- meeting item
- meeting vote

The forms write through `/api/admin/local-meetings` after Supabase tables and admin credentials are configured.
