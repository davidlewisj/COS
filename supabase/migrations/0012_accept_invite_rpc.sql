-- Same class of bug as 0010's create_organization fix: PostgREST always
-- issues RETURNING under the hood for UPDATE (regardless of the Prefer
-- header), and org_members' own SELECT policies are themselves queries
-- against org_members -- so accepting an invite (the UPDATE that flips
-- user_id/status) could never satisfy the RETURNING-time SELECT check for
-- the row it had just changed. The org_members_accept_invite UPDATE policy
-- could have USING/WITH CHECK forced to literal `true` and the real
-- PostgREST request still came back "new row violates row-level security
-- policy" -- proving the failure was never about that policy's expressions.
--
-- Fix: do the accept as a security definer RPC, which bypasses RLS for its
-- own internal read/write (the function runs as its owner), and verify the
-- invite actually belongs to the caller's email explicitly inside the
-- function body instead of relying on a row policy.

create or replace function public.accept_invite(invite_id uuid)
returns org_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated public.org_members;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.org_members
  set user_id = auth.uid(), status = 'active'
  where id = invite_id
    and invited_email = (auth.jwt() ->> 'email')
    and user_id is null
    and status = 'invited'
  returning * into updated;

  if updated is null then
    raise exception 'invite not found or already claimed';
  end if;

  return updated;
end;
$$;

revoke execute on function public.accept_invite(uuid) from public;
grant execute on function public.accept_invite(uuid) to authenticated;
