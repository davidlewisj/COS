-- org_members_accept_invite's USING clause only governs which rows are
-- updatable by UPDATE -- it grants no SELECT visibility. With no SELECT
-- policy covering invite rows before the invitee is a member,
-- getPendingInvites() could never see anything to accept in the first
-- place. Add the missing read path: a user can see (only) invited, unlinked
-- rows addressed to their own email.

create policy "org_members_select_own_invite" on org_members
  for select using (
    invited_email = (auth.jwt() ->> 'email')
    and user_id is null
    and status = 'invited'
  );
