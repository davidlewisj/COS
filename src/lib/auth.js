import { supabase } from "./supabaseClient";

export function getSession() {
  return supabase.auth.getSession().then(({ data }) => data.session);
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Active org membership for the signed-in user, joined with the org name.
export async function getMembership() {
  const { data, error } = await supabase
    .from("org_members")
    .select("org_id, role, status, organizations(id, name)")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Invites addressed to the signed-in user's own email, still unclaimed.
export async function getPendingInvites(email) {
  const { data, error } = await supabase
    .from("org_members")
    .select("id, org_id, role, organizations(id, name)")
    .eq("invited_email", email)
    .eq("status", "invited")
    .is("user_id", null);
  if (error) throw error;
  return data || [];
}

// Creates the org and inserts the caller as its owner atomically (see
// migration 0010) -- a plain client-side insert can't do this in two steps
// because the org isn't visible under organizations_select until the
// org_members row exists, and INSERT ... RETURNING enforces the SELECT
// policy on the row it hands back.
export async function createOrganization(name) {
  const { data: org, error } = await supabase.rpc("create_organization", { org_name: name });
  if (error) throw error;
  return org;
}

// Accepts via the accept_invite RPC (migration 0012) -- same RETURNING/
// self-referential-SELECT-policy problem as createOrganization, fixed the
// same way.
export async function acceptInvite(inviteId) {
  const { data, error } = await supabase.rpc("accept_invite", { invite_id: inviteId });
  if (error) throw error;
  return data;
}
