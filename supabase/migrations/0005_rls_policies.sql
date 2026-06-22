-- Enable RLS everywhere. Every policy below scopes rows to organizations
-- the current user belongs to, via the user_org_ids()/user_role_in_org()
-- helpers defined in 0001_orgs_and_helpers.sql.

alter table organizations enable row level security;
alter table org_members enable row level security;
alter table team_members enable row level security;
alter table teams enable row level security;
alter table team_memberships enable row level security;
alter table seats enable row level security;
alter table people_analyzer_scores enable row level security;
alter table rocks enable row level security;
alter table rock_milestones enable row level security;
alter table issues enable row level security;
alter table todos enable row level security;
alter table scorecard_metrics enable row level security;
alter table scorecard_values enable row level security;
alter table headlines enable row level security;
alter table vision enable row level security;
alter table processes enable row level security;
alter table meetings enable row level security;
alter table meeting_attendees enable row level security;

-- organizations: members can see their own org; only the owner can update it
create policy "organizations_select" on organizations
  for select using (id in (select user_org_ids()));

create policy "organizations_update_owner" on organizations
  for update using (user_role_in_org(id) = 'owner');

-- org_members: members can see who else is in their org;
-- only owner/admin can manage membership
create policy "org_members_select" on org_members
  for select using (org_id in (select user_org_ids()));

create policy "org_members_write_admin" on org_members
  for all using (user_role_in_org(org_id) in ('owner', 'admin'))
  with check (user_role_in_org(org_id) in ('owner', 'admin'));

-- Generic "any active member of the org can read/write" policy, applied to
-- the bulk of day-to-day EOS tables.
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
      'create policy "%I_org_isolation" on %I for all using (org_id in (select user_org_ids())) with check (org_id in (select user_org_ids()));',
      t, t
    );
  end loop;
end $$;

-- vision and seats: any member can read, only owner/admin can write
create policy "vision_select" on vision
  for select using (org_id in (select user_org_ids()));

create policy "vision_write_admin" on vision
  for insert with check (user_role_in_org(org_id) in ('owner', 'admin'));

create policy "vision_update_admin" on vision
  for update using (user_role_in_org(org_id) in ('owner', 'admin'));

create policy "seats_select" on seats
  for select using (org_id in (select user_org_ids()));

create policy "seats_write_admin" on seats
  for insert with check (user_role_in_org(org_id) in ('owner', 'admin'));

create policy "seats_update_admin" on seats
  for update using (user_role_in_org(org_id) in ('owner', 'admin'));

create policy "seats_delete_admin" on seats
  for delete using (user_role_in_org(org_id) in ('owner', 'admin'));

-- Join tables without their own org_id: scope through the parent row
create policy "team_memberships_isolation" on team_memberships
  for all
  using (team_id in (select id from teams where org_id in (select user_org_ids())))
  with check (team_id in (select id from teams where org_id in (select user_org_ids())));

create policy "meeting_attendees_isolation" on meeting_attendees
  for all
  using (meeting_id in (select id from meetings where org_id in (select user_org_ids())))
  with check (meeting_id in (select id from meetings where org_id in (select user_org_ids())));
