-- Cover foreign keys that were missing an index
create index issues_owner_id_idx on issues(owner_id);
create index meeting_attendees_team_member_id_idx on meeting_attendees(team_member_id);
create index processes_owner_id_idx on processes(owner_id);
create index rock_milestones_org_id_idx on rock_milestones(org_id);
create index rocks_owner_id_idx on rocks(owner_id);
create index scorecard_metrics_owner_id_idx on scorecard_metrics(owner_id);
create index seats_team_member_id_idx on seats(team_member_id);
create index team_memberships_team_member_id_idx on team_memberships(team_member_id);
create index todos_owner_id_idx on todos(owner_id);

-- org_members_write_admin overlapped with org_members_select on SELECT
-- (both permissive), forcing the planner to evaluate both on every read.
-- Split into per-action policies so SELECT only ever runs one policy.
drop policy "org_members_write_admin" on org_members;

create policy "org_members_insert_admin" on org_members
  for insert with check (private.user_role_in_org(org_id) in ('owner', 'admin'));

create policy "org_members_update_admin" on org_members
  for update using (private.user_role_in_org(org_id) in ('owner', 'admin'));

create policy "org_members_delete_admin" on org_members
  for delete using (private.user_role_in_org(org_id) in ('owner', 'admin'));
