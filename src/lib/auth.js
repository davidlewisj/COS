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

export async function createOrganization(name, userId) {
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name })
    .select()
    .single();
  if (orgErr) throw orgErr;

  const { error: memberErr } = await supabase
    .from("org_members")
    .insert({ org_id: org.id, user_id: userId, role: "owner", status: "active" });
  if (memberErr) throw memberErr;

  return org;
}

export async function acceptInvite(inviteId, userId) {
  const { error } = await supabase
    .from("org_members")
    .update({ user_id: userId, status: "active" })
    .eq("id", inviteId);
  if (error) throw error;
}
