-- Root cause of "new row violates row-level security policy for table
-- organizations" on the self-service create-org flow: Postgres enforces a
-- table's SELECT policy on the row returned by INSERT ... RETURNING, not
-- just the INSERT policy's WITH CHECK. A brand new user has no org_members
-- row yet at the moment they insert the org, so organizations_select's
-- "id in (select private.user_org_ids())" can never pass for that row --
-- the INSERT itself was always being rejected at RETURNING time, regardless
-- of what the INSERT policy said.
--
-- Fix: do the org-create + self-insert-as-owner as one atomic, security
-- definer RPC instead of two separate client-side inserts. This also closes
-- the gap in org_members_insert_self_owner, which only checked that the
-- *target* org had zero members -- not that the caller was the one who
-- just created it, so any authenticated user could've claimed ownership of
-- any org that happened to be empty. With this RPC as the only path to
-- create-and-claim an org, that's no longer possible: every call creates a
-- brand new org and claims only that one.

create or replace function public.create_organization(org_name text)
returns organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.organizations (name) values (org_name) returning * into new_org;

  insert into public.org_members (org_id, user_id, role, status)
  values (new_org.id, auth.uid(), 'owner', 'active');

  return new_org;
end;
$$;

revoke execute on function public.create_organization(text) from public;
grant execute on function public.create_organization(text) to authenticated;

drop policy if exists "organizations_insert_self" on organizations;
drop policy if exists "org_members_insert_self_owner" on org_members;
