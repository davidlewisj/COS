-- The existing org_members/organizations policies only let an *existing*
-- owner/admin write rows in their org -- there was no way for a brand new
-- user to create their first org. These add the two self-service paths the
-- auth shell needs: creating an org (and becoming its owner), and accepting
-- a pending invite addressed to your own email.

create policy "organizations_insert_self" on organizations
  for insert with check (auth.uid() is not null);

-- Self-insert as owner is restricted to orgs with zero existing members, so
-- a user can only do this for an org they just created -- not to seize
-- ownership of an org someone else already belongs to.
create policy "org_members_insert_self_owner" on org_members
  for insert with check (
    user_id = auth.uid()
    and role = 'owner'
    and not exists (select 1 from org_members m2 where m2.org_id = org_members.org_id)
  );

create policy "org_members_accept_invite" on org_members
  for update
  using (invited_email = (auth.jwt() ->> 'email') and user_id is null and status = 'invited')
  with check (user_id = auth.uid() and status = 'active');
