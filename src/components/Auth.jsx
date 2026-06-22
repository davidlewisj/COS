import { cloneElement, useEffect, useState } from "react";
import { CSS } from "../constants";
import {
  signIn, signUp, signOut, getSession, onAuthStateChange, getMembership,
  getPendingInvites, createOrganization, acceptInvite,
} from "../lib/auth";

function AuthShell({ children }) {
  return <div className="auth-shell"><style>{CSS}</style><div className="auth-card">{children}</div></div>;
}

function LoginSignup({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = mode === "login" ? await signIn(email, password) : await signUp(email, password);
      if (data.session) onAuthed(data.session);
      else if (mode === "signup") setError("Check your email to confirm your account, then sign in.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return <AuthShell>
    <div className="auth-logo">T</div>
    <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
    <div className="sub">{mode === "login" ? "Sign in to your EOS workspace." : "Get started running your business on EOS."}</div>
    {error && <div className="auth-err">{error}</div>}
    <form onSubmit={submit}>
      <div className="field"><label>Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>
      <div className="field"><label>Password</label><input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
      <button className="btn btn-p" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}</button>
    </form>
    <div className="auth-foot">
      {mode === "login" ? <>No account yet? <button className="btn-link" onClick={() => { setMode("signup"); setError(""); }}>Sign up</button></>
        : <>Already have an account? <button className="btn-link" onClick={() => { setMode("login"); setError(""); }}>Sign in</button></>}
    </div>
  </AuthShell>;
}

function OrgSetup({ session, onReady }) {
  const [invites, setInvites] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPendingInvites(session.user.email).then(setInvites).catch(err => setError(err.message));
  }, [session.user.email]);

  const accept = async inviteId => {
    setError("");
    setBusy(true);
    try {
      await acceptInvite(inviteId);
      onReady();
    } catch (err) {
      setError(err.message || "Could not accept invite.");
    } finally {
      setBusy(false);
    }
  };

  const create = async e => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await createOrganization(orgName.trim());
      onReady();
    } catch (err) {
      setError(err.message || "Could not create organization.");
    } finally {
      setBusy(false);
    }
  };

  if (invites === null) return <AuthShell><div className="sub">Loading…</div></AuthShell>;

  return <AuthShell>
    <div className="auth-logo">T</div>
    <h2>Almost there</h2>
    <div className="sub">Signed in as {session.user.email}</div>
    {error && <div className="auth-err">{error}</div>}
    {invites.length > 0 && <>
      {invites.map(inv => (
        <div className="auth-invite" key={inv.id}>
          <div><strong>{inv.organizations?.name}</strong><div style={{ fontSize: 12, color: "var(--t3)" }}>Invited as {inv.role}</div></div>
          <button className="btn btn-p btn-sm" disabled={busy} onClick={() => accept(inv.id)}>Join</button>
        </div>
      ))}
      <div className="auth-or">or create a new one</div>
    </>}
    <form onSubmit={create}>
      <div className="field"><label>Organization name</label><input required value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Acme Inc." /></div>
      <button className="btn btn-p" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>{busy ? "Please wait…" : "Create organization"}</button>
    </form>
    <div className="auth-foot"><button className="btn-link" onClick={signOut}>Sign out</button></div>
  </AuthShell>;
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [membership, setMembership] = useState(undefined);

  useEffect(() => {
    getSession().then(setSession);
    return onAuthStateChange(setSession);
  }, []);

  const refreshMembership = () => getMembership().then(setMembership).catch(() => setMembership(null));

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { setMembership(undefined); return; }
    setMembership(undefined);
    refreshMembership();
  }, [session]);

  if (session === undefined) return <AuthShell><div className="sub">Loading…</div></AuthShell>;
  if (!session) return <LoginSignup onAuthed={setSession} />;
  if (membership === undefined) return <AuthShell><div className="sub">Loading…</div></AuthShell>;
  if (!membership) return <OrgSetup session={session} onReady={refreshMembership} />;
  return cloneElement(children, { orgName: membership.organizations?.name });
}
