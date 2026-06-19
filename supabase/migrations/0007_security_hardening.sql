-- Harden the RLS helper functions flagged by the security advisor:
-- 1) lock down search_path (prevents search_path hijacking)
-- 2) move the two SECURITY DEFINER helpers into a non-exposed "private"
--    schema so they can't be called as public REST RPC endpoints, while
--    remaining usable inside RLS policies for authenticated users.

create schema if not exists private;

-- Dropping cascade removes every policy that references these two
-- functions; they're recreated below pointing at the new private schema.
drop function if exists public.user_org_ids() cascade;
drop function if exists public.user_role_in_org(uuid) cascade;

create or replace function private.user_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = ''
as $$
  select org_id from public.org_members where user_id = auth.uid() and status = 'active';
$$;

create or replace function private.user_role_in_org(p_org_id uuid)
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select role from public.org_members where org_id = p_org_id and user_id = auth.uid() and status = 'active';
$$;

revoke execute on function private.user_org_ids() from public;
revoke execute on function private.user_role_in_org(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.user_org_ids() to authenticated;
grant execute on function private.user_role_in_org(uuid) to authenticated;

alter function public.set_updated_at() set search_path = '';

-- Recreate every policy that was cascaded away above, now pointing at
-- private.user_org_ids()/private.user_role_in_org().
create policy "organizations_select" on organizations
  for select using (id in (select private.user_org_ids()));

create policy "organizations_update_owner" on organizations
  for update using (private.user_role_in_org(id) = 'owner');

create policy "org_members_select" on org_members
  for select using (org_id in (select private.user_org_ids()));

create policy "org_members_write_admin" on org_members
  for all using (private.user_role_in_org(org_id) in ('owner', 'admin'))
  with check (private.user_role_in_org(org_id) in ('owner', 'admin'));

do $$
declare
  t text;
  tables text[] := array[
    'team_members', 'teams', 'rocks', 'rock_milestones', 'issues', 'todos',
    'scorecard_metrics', 'scorecard_values', 'headlines', 'processes',
    'meetings', 'people_analyzer_scores'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create policy "%I_org_isolation" on %I for all using (org_id in (select private.user_org_ids())) with check (org_id in (select private.user_org_ids()));',
      t, t
    );
  end loop;
end $$;

create policy "vision_select" on vision
  for select using (org_id in (select private.user_org_ids()));

create policy "vision_write_admin" on vision
  for insert with check (private.user_role_in_org(org_id) in ('owner', 'admin'));

create policy "vision_update_admin" on vision
  for update using (private.user_role_in_org(org_id) in ('owner', 'admin'));

create policy "seats_select" on seats
  for select using (org_id in (select private.user_org_ids()));

create policy "seats_write_admin" on seats
  for insert with check (private.user_role_in_org(org_id) in ('owner', 'admin'));

create policy "seats_update_admin" on seats
  for update using (private.user_role_in_org(org_id) in ('owner', 'admin'));

create policy "seats_delete_admin" on seats
  for delete using (private.user_role_in_org(org_id) in ('owner', 'admin'));

create policy "team_memberships_isolation" on team_memberships
  for all
  using (team_id in (select id from teams where org_id in (select private.user_org_ids())))
  with check (team_id in (select id from teams where org_id in (select private.user_org_ids())));

create policy "meeting_attendees_isolation" on meeting_attendees
  for all
  using (meeting_id in (select id from meetings where org_id in (select private.user_org_ids())))
  with check (meeting_id in (select id from meetings where org_id in (select private.user_org_ids())));
