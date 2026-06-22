# Supabase setup

**Status: applied.** The `COS` project (`sdvzwqgqairxxtqevndl`) has all 9 migrations below applied, RLS enabled on every table, and the security/performance advisors are clean (aside from advisory-only "unused index" notices, which are expected until the app generates real query traffic). `.env` in the repo root is already populated with this project's URL/publishable key.

For a fresh project (e.g. setting this up elsewhere), follow these steps:

1. Create a project at https://supabase.com.
2. In the SQL Editor, run the files in `migrations/` **in order** (0001 → 0009). Each one is idempotent-safe to run once; together they create the full multi-tenant schema, RLS policies, realtime publication, security/performance hardening, and self-service signup.
   - Alternatively, if you have the Supabase CLI installed and linked to the project (`supabase link --project-ref <ref>`), run `supabase db push` from the repo root instead of pasting files manually.
3. In Project Settings → API, copy the Project URL and the publishable key.
4. Copy `.env.example` to `.env` in the repo root and fill in:
   ```
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<publishable-key>
   ```
5. In Authentication → Providers, enable Email (password and/or magic link) — this is what the auth shell in the next phase builds on. This step is dashboard-only; it still needs to be done by hand.

## Schema overview

- `organizations` / `org_members` — multi-tenant layer; every other table carries an `org_id` scoped by RLS to the orgs the signed-in user belongs to.
- `team_members` / `teams` / `team_memberships` — the EOS people/org-chart model. A team member is only a login-capable user once `linked_user_id` is set (via invite acceptance).
- `seats` — accountability chart, self-referencing via `parent_id`.
- `people_analyzer_scores` — GWC + core value scores per team member.
- `rocks` / `rock_milestones`, `issues`, `todos`, `scorecard_metrics` / `scorecard_values`, `headlines`, `vision`, `processes` — the core EOS entities, cross-linked the same way the localStorage version was (`issues.rock_id`, `todos.source_issue_id`, etc).
- `meetings` / `meeting_attendees` — both in-progress and historical meetings are rows here (`status`), instead of a separate current/history split; `meeting_attendees` powers live "who's in this meeting" presence.

`vision.data` and `processes.steps` are stored as `jsonb` rather than fixed columns since that content is free-form/document-like in the app today.

## Realtime

`0006_realtime.sql` adds `meetings`, `meeting_attendees`, `todos`, `issues`, and `scorecard_values` to the `supabase_realtime` publication — these are the tables the real-time collaboration phase will subscribe to first (Level 10 meetings, shared to-do/issue lists, scorecard entry).

## Hardening

- `0007_security_hardening.sql` — moves the `user_org_ids()`/`user_role_in_org()` RLS helpers into a `private` schema (so they aren't exposed as public REST RPC endpoints) and locks down `search_path` on all three helper/trigger functions, per the Supabase security advisor.
- `0008_performance_hardening.sql` — adds covering indexes for foreign keys the performance advisor flagged as missing, and splits the `org_members` admin policy so it doesn't redundantly overlap with the read policy on every `SELECT`.
- `0009_self_service_org_membership.sql` — adds the policies the auth shell needs that weren't covered by the original admin-only rules: a user can create an `organizations` row, insert themselves as its `owner` (only when the org has zero existing members, so this can't be used to seize an org someone else already belongs to), and accept a pending `org_members` invite addressed to their own email.
