import { useState } from "react";
import { Ic } from "./Icons";
import { getWeekRange, isOverdue, fmtDate } from "../utils/helpers";

export function NotificationsPanel({ onClose, todos, rocks, issues, scorecard, scData }) {
  const week = getWeekRange(0);
  const [dismissed, setDismissed] = useState([]);
  const dismiss = id => setDismissed(p => [...p, id]);
  const clearAll = () => setDismissed(all.map(n => n.id));

  const all = [];
  todos.filter(t => !t.done && isOverdue(t.dueDate)).forEach(t => {
    all.push({ id: `overdue-${t.id}`, type: "overdue", title: `Overdue: ${t.title}`, sub: `Due ${fmtDate(t.dueDate)}`, color: "var(--red)" });
  });
  rocks.filter(r => r.status !== "on-track" && r.status !== "completed").forEach(r => {
    all.push({ id: `rock-${r.id}`, type: "rock", title: `Off-track rock: ${r.title}`, sub: "Needs attention", color: "var(--orange)" });
  });
  const missingMetrics = scorecard.filter(m => {
    const v = scData[week.key]?.[m.id];
    return v === undefined || v === "";
  });
  if (missingMetrics.length > 0) {
    all.push({ id: "sc-missing", type: "scorecard", title: `${missingMetrics.length} scorecard ${missingMetrics.length === 1 ? "metric" : "metrics"} not entered`, sub: `For the week of ${week.label}`, color: "var(--blue)" });
  }
  const openIssues = issues.filter(i => !i.done);
  if (openIssues.length > 5) {
    all.push({ id: "iss-volume", type: "issues", title: `${openIssues.length} open issues`, sub: "Consider scheduling an IDS session", color: "var(--yellow)" });
  }

  const notifs = all.filter(n => !dismissed.includes(n.id));

  return <>
    <div className="notif-backdrop" onClick={onClose}/>
    <div className="notif-panel">
      <div className="notif-hdr">
        <h3>Notifications {notifs.length > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", marginLeft: 4 }}>{notifs.length}</span>}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {notifs.length > 0 && <button className="btn-ghost" style={{ fontSize: 12, color: "var(--t2)" }} onClick={clearAll}>Clear all</button>}
          <button className="btn-ghost" onClick={onClose}><Ic.X/></button>
        </div>
      </div>
      <div className="notif-list">
        {notifs.length === 0
          ? <div className="notif-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: "0 auto 12px", display: "block" }}><circle cx="24" cy="24" r="22" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5"/><path d="M16 24l6 6 10-12" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ fontWeight: 600, color: "var(--t2)" }}>All clear!</div>
            <div style={{ marginTop: 4, fontSize: 13 }}>No alerts right now</div>
          </div>
          : notifs.map(n => (
            <div className="notif-item" key={n.id} style={{ alignItems: "flex-start" }}>
              <div className="notif-dot" style={{ background: n.color, marginTop: 5 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="notif-title">{n.title}</div>
                <div className="notif-sub" style={{fontSize: 12, color: "var(--t2)", marginTop: 2}}>{n.sub}</div>
              </div>
              <button className="btn-ghost" style={{ padding: "2px 4px", flexShrink: 0, color: "var(--t3)" }} onClick={() => dismiss(n.id)} title="Dismiss">
                <Ic.X/>
              </button>
            </div>
          ))
        }
      </div>
    </div>
  </>;
}
