# RepWatchr Role Model

RepWatchr uses Supabase Auth for identity and `public.user_roles` for database authorization. Client-side role checks may improve UI, but they are not trusted for data access.

## Roles

| Role | Purpose | Public data | Private user data | Admin queues | Role management |
| --- | --- | --- | --- | --- | --- |
| `anonymous` | Visitor without login | Read approved public records only | No | No | No |
| `authenticated_user` | Logged-in member | Read approved public records | Own dashboard rows only | No | No |
| `contributor` | Logged-in source runner/member | Read approved public records | Own rows and contribution records | No | No |
| `verified_contributor` | Trusted contributor with extra workflow access | Read approved public records | Own rows and structured contribution records | Limited only if a separate policy allows it | No |
| `reviewer` | Review queue operator | Read/manage review queues through operator policies | Admin-visible queues only | Yes | No |
| `researcher` | Internal research/operator role | Read/manage research queues through operator policies | Admin-visible queues only | Yes | No |
| `admin` | Site operator | Manage profiles, sources, queues, analytics, data health | Admin-visible data | Yes | No |
| `super_admin` | Owner/security administrator | All admin actions | Admin-visible data | Yes | Yes |

Compatibility roles still used by current UI: `claimed_official`, `journalist`, and `voter`.

## Source of Truth

Database authorization must use `public.user_roles`, not user-editable metadata. The hardening SQL defines these helpers:

- `public.has_repw_role(required_roles text[])`
- `public.is_repw_super_admin()`
- `public.is_repw_admin()`
- `public.is_repw_operator()`
- `public.is_repw_contributor()`
- `public.is_repw_verified_contributor()`

These helpers read `public.user_roles` and are used by RLS policies. They are intentionally small boolean helpers and should not return private user data.

## Server Checks

Admin pages are protected server-side in `src/lib/admin-auth.ts`. The server route checks Supabase Auth, then reads `user_roles`. It also has existing fallback support for `REPWATCHR_ADMIN_EMAILS` and app metadata. That fallback is a server-side route gate only; database RLS still uses `user_roles`.

Production rule: every real admin should have a row in `public.user_roles` with `role = 'admin'` or `role = 'super_admin'`.

## Role Management

`super_admin` is the only role allowed to manage rows in `public.user_roles` after `supabase-security-rls-hardening.sql` is applied.

Manual bootstrap:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR_AUTH_USER_ID', 'super_admin')
on conflict (user_id, role) do nothing;
```

Do this only from the Supabase SQL editor or a secured service-role process.

## Non-Negotiables

- Do not authorize admin access from client state.
- Do not use `raw_user_meta_data` for authorization.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in client components or `NEXT_PUBLIC_*`.
- Do not let anonymous users update profiles, approve sources, read admin notes, or read private dashboards.
- Do not publish user-submitted sources until an admin/reviewer attaches them as approved public records.
