import { useState, useEffect, useRef } from "react";
import { STORAGE_KEYS, PROFILE_DEFAULT, TEAM_DEFAULT, TEAMS_DEFAULT, SC_DEFAULT, VISION_DEFAULT, SEATS_DEFAULT, PEOPLE_ANALYZER_DEFAULT, CSS } from "./constants";
import { uid, getWeekRange, getPeriods, getRollupVal, scaleGoal, parseLines, currentQuarterLabel, milestoneProgress, load, save, fmtDate, isOverdue } from "./utils/helpers";
import { useIsMobile } from "./hooks/useIsMobile";
import { Ic } from "./components/Icons";
import { Av, CircleCk, Modal, EmptySVG, DonutChart, MiniBarChart } from "./components/Shared";
import { NotificationsPanel } from "./components/NotificationsPanel";

// DASHBOARD PAGE
function DashboardPage({ todos, setTodos, rocks, issues, scorecard, scData, team, activeMemberIds, setPage }) {
  const week = getWeekRange(0);
  const weeks52 = Array.from({ length: 52 }, (_, i) => getWeekRange(-i));
  const me = team.find(m => m.id === "1") || team[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const teamTodos = todos.filter(t => !t.done && activeMemberIds.includes(t.owner));
  const activeRocks = rocks.filter(r => activeMemberIds.includes(r.owner) && r.status !== "completed" && r.status !== "cancelled");
  const activeScorecard = scorecard.filter(m => activeMemberIds.includes(m.owner));
  const hits = activeScorecard.filter(m => { const v = parseFloat(scData[week.key]?.[m.id]); return !isNaN(v) && v >= m.goal; }).length;

  const W = ({ title, count, action, children, minH }) => (
    <div className="dash-widget">
      <div className="dash-widget-hdr">
        <span className="dash-widget-title">{title}{count != null && <span className="count" style={{ fontSize: 16, marginLeft: 6 }}>{count}</span>}</span>
        {action && <button className="btn-ghost" style={{ fontSize: 12, color: "var(--blue)", padding: "2px 6px" }} onClick={action}>View all →</button>}
      </div>
      <div style={{ minHeight: minH || 0 }}>{children}</div>
    </div>
  );

  return <>
    <div className="phdr">
      <div className="phdr-top" style={{ paddingBottom: 16 }}>
        <h1>{greeting}, {me.name.split(" ")[0]} 👋</h1>
        <div className="phdr-desc" style={{ marginBottom: 0 }}>Your personalized workspace — <strong>{week.label}</strong></div>
      </div>
    </div>
    <div className="content"><div className="content-inner" style={{ padding: "16px 24px 40px" }}>
      <div className="dash-widget-grid">
        <W title="Team To-Dos" count={teamTodos.length} action={() => setPage("todos")} minH={120}>
          {teamTodos.length === 0 ? <div className="dash-empty"><EmptySVG.todos /><p>No open to-dos</p></div> : <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {teamTodos.slice(0, 8).map(t => {
              const m = team.find(x => x.id === t.owner) || team[1];
              return <div key={t.id} className="dash-irow">
                <CircleCk on={t.done} toggle={() => setTodos(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} />
                <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                <Av m={m} size={22} />
              </div>;
            })}
            <button className="btn-link" style={{ padding: "8px 0", fontSize: 12 }} onClick={() => setPage("todos")}>+ Create To-Do</button>
          </div>}
        </W>
        <W title="Scorecard" action={() => setPage("scorecard")} minH={120}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0 12px" }}>
            <DonutChart hits={hits} total={activeScorecard.length} />
            <div><div style={{ fontSize: 12, color: "var(--t2)" }}>This week&apos;s hits</div><div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{week.label}</div></div>
          </div>
        </W>
        <W title="Rocks" count={activeRocks.length} action={() => setPage("rocks")} minH={120}>
          {activeRocks.length === 0 ? <div className="dash-empty"><EmptySVG.rocks /><p>No active rocks</p></div> : <div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {activeRocks.slice(0, 5).map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--brd)" }}>
                    <td style={{ padding: "8px 0" }}><RockStatusBadge rock={r} /></td>
                    <td style={{ padding: "8px", fontSize: 13 }}>{r.title}</td>
                    <td style={{ padding: "8px 0", fontSize: 12, color: "var(--t2)" }}>{fmtDate(r.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </W>
        <W title="To-Dos 90d" minH={120}>
          <div style={{ display: "flex", gap: 20 }}>
            <DonutChart hits={Math.min(teamTodos.length, 5)} total={Math.max(teamTodos.length, 5)} />
            <div><div style={{ fontSize: 28, fontWeight: 700 }}>{teamTodos.length}</div><div style={{ fontSize: 12, color: "var(--t2)", marginTop: 2 }}>Open</div></div>
          </div>
        </W>
        <W title="Measurables" action={() => setPage("scorecard")} minH={100}>
          {activeScorecard.length === 0 ? <div className="dash-empty"><p>No measurables set up</p></div> : <div><MiniBarChart scorecard={activeScorecard} scData={scData} weeks={weeks52} /></div>}
        </W>
        <W title="Issues" count={issues.filter(i => !i.done && activeMemberIds.includes(i.owner)).length} action={() => setPage("issues")} minH={100}>
          {issues.filter(i => !i.done && activeMemberIds.includes(i.owner)).length === 0 ? <div className="dash-empty"><EmptySVG.issues /><p>No open issues</p></div> : <div>
            {issues.filter(i => !i.done && activeMemberIds.includes(i.owner)).slice(0, 5).map((issue, idx) => {
              const m = team.find(x => x.id === issue.owner) || team[1];
              return <div key={issue.id} className="dash-irow"><span style={{ fontSize: 11, color: "var(--t3)", width: 16, flexShrink: 0 }}>{idx + 1}.</span><span style={{ flex: 1, fontSize: 13 }}>{issue.title}</span><Av m={m} size={20} /></div>;
            })}
          </div>}
        </W>
      </div>
    </div></div>
  </>;
}

// TODOS PAGE
function TodosPage({ todos, setTodos, team, activeMemberIds, rocks }) {
  const [tab, setTab] = useState("team");
  const [search, setSearch] = useState("");
  const [archive, setArchive] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", owner: "1", dueDate: "", rockId: "", notes: "" });

  const openAdd = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setEditId(null);
    setForm({ title: "", owner: "1", dueDate: d.toISOString().split("T")[0], rockId: "", notes: "" });
    setModal("todo");
  };

  const openEdit = todo => {
    setEditId(todo.id);
    setForm({ title: todo.title || "", owner: todo.owner || "1", dueDate: todo.dueDate || "", rockId: todo.rockId || "", notes: todo.notes || "" });
    setModal("todo");
  };

  const saveTodo = () => {
    const title = form.title.trim();
    if (!title) return;
    const payload = { title, owner: form.owner, dueDate: form.dueDate, rockId: form.rockId || null, notes: form.notes };
    if (editId) {
      setTodos(p => p.map(x => (x.id === editId ? { ...x, ...payload } : x)));
    } else {
      setTodos(p => [...p, { id: uid(), ...payload, done: false, createdAt: new Date().toISOString() }]);
    }
    setModal(null);
  };

  const removeTodo = id => {
    setTodos(p => p.filter(x => x.id !== id));
    setModal(null);
  };

  const filtered = todos.filter(t => {
    if (archive ? !t.done : t.done) return false;
    if (!activeMemberIds.includes(t.owner)) return false;
    if (tab === "private" && t.owner !== "1") return false;
    if (ownerFilter !== "all" && t.owner !== ownerFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return <>
    <div className="phdr">
      <div className="phdr-top"><div><h1>To-Dos</h1><div className="phdr-desc">Create, assign, and track deadlines for critical tasks.</div></div><div className="phdr-actions"><button className="btn btn-p" onClick={openAdd}><Ic.Plus /> Create</button></div></div>
      <div className="tabs">
        <div className={`tab${tab === "team" ? " on" : ""}`} onClick={() => setTab("team")}>Team</div>
        <div className={`tab${tab === "private" ? " on" : ""}`} onClick={() => setTab("private")}>My To-Dos</div>
      </div>
    </div>
    <div className="toolbar">
      {tab === "team" && <select className="tb-filter" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
        <option value="all">Owner: All</option>
        {team.filter(m => m.id !== "2").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>}
      <div className="tb-toggle" onClick={() => setArchive(!archive)}><div className={`tb-toggle-track${archive ? " on" : ""}`}><div className="tb-toggle-dot" /></div>Archive</div>
      <div className="tb-search"><Ic.Search /><input placeholder="Search To-Dos..." value={search} onChange={e => setSearch(e.target.value)} /></div>
    </div>
    <div className="content"><div className="content-inner">
      <div className="sec">
        <div className="sec-hdr"><h2>To-Dos<span className="count">{filtered.length}</span></h2></div>
        {filtered.length === 0 ? <div className="empty"><EmptySVG.todos /><h3>{archive ? "No archived to-dos" : "All caught up!"}</h3><p>Create a to-do to get started.</p></div> : <table className="tbl"><thead><tr><th style={{ width: 42 }}></th><th>Title</th><th style={{ width: 100 }}>Due By</th><th style={{ width: 70 }}>Owner</th><th style={{ width: 60 }}></th></tr></thead><tbody>
          {filtered.map(t => {
            const m = team.find(x => x.id === t.owner) || team[1];
            const od = isOverdue(t.dueDate) && !t.done;
            const linkedRock = t.rockId && rocks.find(r => r.id === t.rockId);
            return <tr key={t.id}>
              <td><CircleCk on={t.done} toggle={() => setTodos(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} /></td>
              <td>{t.title}{linkedRock && <span className="tag" style={{ marginLeft: 8 }}>{linkedRock.title}</span>}
                {!!t.notes && <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{t.notes.slice(0, 90)}{t.notes.length > 90 ? "…" : ""}</div>}
              </td>
              <td style={{ color: od ? "var(--red-t)" : "var(--t2)" }}>{od && <Ic.Warn />}{fmtDate(t.dueDate)}</td>
              <td><Av m={m} /></td>
              <td><button className="btn-ghost" onClick={() => openEdit(t)}>Edit</button></td>
            </tr>;
          })}
        </tbody></table>}
      </div>
    </div></div>
    {modal === "todo" && <Modal title={editId ? "Edit To-Do" : "Create To-Do"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" autoFocus /></div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>Owner</label><select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>{team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div className="field" style={{ flex: 1 }}><label>Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
        </div>
        <div className="field">
          <label>Linked rock (optional)</label>
          <select value={form.rockId} onChange={e => setForm({ ...form, rockId: e.target.value })}>
            <option value="">None</option>
            {rocks.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}><label>Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Context or details" /></div>
      </div>
      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <div>{editId && <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => removeTodo(editId)}><Ic.Trash /> Delete</button>}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-p" onClick={saveTodo}>{editId ? "Save" : "Create"}</button>
        </div>
      </div>
    </Modal>}
  </>;
}

// SCORECARD PAGE
function ScorecardPage({ scorecard, setScorecard, scData, setScData, team, activeMemberIds, mob }) {
  const [tab, setTab] = useState("weekly");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", owner: "1", goal: 0, unit: "#", op: ">=" });
  const cellRefs = useRef({});

  const allPeriods = getPeriods(tab);
  const periods = allPeriods.slice(0, mob ? 6 : 10);
  const filtered = scorecard.filter(m => {
    if (!activeMemberIds.includes(m.owner)) return false;
    if (ownerFilter !== "all" && m.owner !== ownerFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isWeekly = tab === "weekly";

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", owner: "1", goal: 0, unit: "#", op: ">=" });
    setModal("metric");
  };

  const openEdit = metric => {
    setEditId(metric.id);
    setForm({ name: metric.name, owner: metric.owner, goal: metric.goal, unit: metric.unit, op: metric.op });
    setModal("metric");
  };

  const removeMetric = id => {
    setScorecard(prev => prev.filter(m => m.id !== id));
    setScData(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(periodKey => {
        if (next[periodKey] && Object.prototype.hasOwnProperty.call(next[periodKey], id)) {
          const row = { ...next[periodKey] };
          delete row[id];
          next[periodKey] = row;
        }
      });
      return next;
    });
    setModal(null);
  };

  const saveMetric = () => {
    const name = form.name.trim();
    const goal = Number(form.goal);
    if (!name) return;
    if (Number.isNaN(goal)) return;
    const payload = { name, owner: form.owner, goal, unit: form.unit, op: form.op };
    if (editId) {
      setScorecard(prev => prev.map(m => (m.id === editId ? { ...m, ...payload } : m)));
    } else {
      setScorecard(prev => [...prev, { id: uid(), ...payload }]);
    }
    setModal(null);
  };

  const updateWeeklyCell = (periodKey, metricId, raw) => {
    setScData(prev => {
      const next = { ...prev };
      const row = { ...(next[periodKey] || {}) };
      if (raw === "") {
        delete row[metricId];
      } else {
        row[metricId] = raw;
      }
      next[periodKey] = row;
      return next;
    });
  };

  const goCell = (rowIndex, colIndex) => {
    const key = `${rowIndex}-${colIndex}`;
    const el = cellRefs.current[key];
    if (el) el.focus();
  };

  const onCellKeyDown = (e, rowIndex, colIndex) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goCell(rowIndex, colIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goCell(rowIndex, colIndex - 1);
    } else if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      goCell(rowIndex + 1, colIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      goCell(rowIndex - 1, colIndex);
    }
  };

  return <>
    <div className="phdr">
      <div className="phdr-top">
        <div>
          <h1>Scorecard</h1>
          <div className="phdr-desc">Track weekly measurables with automatic rollups across monthly, quarterly, annual, and YTD views.</div>
        </div>
        <div className="phdr-actions">
          <button className="btn btn-p" onClick={openAdd}><Ic.Plus /> Add measurable</button>
        </div>
      </div>
      <div className="tabs">
        <div className={`tab${tab === "weekly" ? " on" : ""}`} onClick={() => setTab("weekly")}>Weekly</div>
        <div className={`tab${tab === "monthly" ? " on" : ""}`} onClick={() => setTab("monthly")}>Monthly</div>
        <div className={`tab${tab === "quarterly" ? " on" : ""}`} onClick={() => setTab("quarterly")}>Quarterly</div>
        <div className={`tab${tab === "annual" ? " on" : ""}`} onClick={() => setTab("annual")}>Annual</div>
        <div className={`tab${tab === "ytd" ? " on" : ""}`} onClick={() => setTab("ytd")}>YTD</div>
      </div>
    </div>

    <div className="toolbar">
      <select className="tb-filter" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
        <option value="all">Owner: All</option>
        {team.filter(m => m.id !== "2").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <div className="tb-search">
        <Ic.Search />
        <input placeholder="Search measurables..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
    </div>

    <div className="content">
      <div className="content-inner">
        <div className="sec" style={{ overflow: "visible" }}>
          <div className="sec-hdr">
            <h2>Measurables<span className="count">{filtered.length}</span></h2>
            {isWeekly && <div style={{ fontSize: 12, color: "var(--t2)" }}>Tip: Use arrow keys or Enter to move across cells</div>}
          </div>

          {filtered.length === 0 ? <div className="empty"><h3>No measurables</h3><p>Add your first measurable to start tracking performance.</p></div> : (
            <div className="sc-wrap">
              <div className="sc-grid" style={{ gridTemplateColumns: `260px repeat(${periods.length}, 120px)` }}>
                <div className="sc-grid-head">
                  <div>Measurable</div>
                  {periods.map(p => <div key={p.key}>{p.label}</div>)}
                </div>

                {filtered.map((metric, rowIndex) => {
                  return <div className="sc-row" key={metric.id}>
                    <div className="sc-name-cell" onClick={() => openEdit(metric)}>
                      <span>{metric.name}</span>
                      <span className="sc-info">{metric.op} {metric.goal}{metric.unit}</span>
                    </div>

                    {periods.map((p, colIndex) => {
                      if (isWeekly) {
                        const rawVal = scData[p.key]?.[metric.id] ?? "";
                        const nVal = parseFloat(rawVal);
                        const hasVal = rawVal !== "" && !Number.isNaN(nVal);
                        const hit = hasVal && (metric.op === ">=" ? nVal >= metric.goal : nVal <= metric.goal);
                        const miss = hasVal && !hit;
                        return <div key={p.key} className={`sc-data${hit ? " sc-hit" : ""}${miss ? " sc-miss" : ""}`}>
                          <input
                            ref={el => { cellRefs.current[`${rowIndex}-${colIndex}`] = el; }}
                            value={rawVal}
                            onChange={e => updateWeeklyCell(p.key, metric.id, e.target.value)}
                            onKeyDown={e => onCellKeyDown(e, rowIndex, colIndex)}
                            inputMode="decimal"
                            placeholder="-"
                          />
                        </div>;
                      }

                      const rollup = getRollupVal(metric.id, p.key, tab, scData, metric.unit);
                      const goal = scaleGoal(metric, tab);
                      const hasRollup = rollup !== "" && !Number.isNaN(Number(rollup));
                      const hit = hasRollup && (metric.op === ">=" ? Number(rollup) >= goal : Number(rollup) <= goal);
                      const miss = hasRollup && !hit;

                      return <div key={p.key} className={`sc-data${hit ? " sc-hit" : ""}${miss ? " sc-miss" : ""}`}>
                        <span className="sc-rollup">{hasRollup ? `${Number(rollup).toLocaleString()}${metric.unit}` : "-"}</span>
                      </div>;
                    })}
                  </div>;
                })}
              </div>
            </div>
          )}

          <div className="sc-add-btn" onClick={openAdd}>+ Add measurable</div>
        </div>
      </div>
    </div>

    {modal === "metric" && <Modal title={editId ? "Edit measurable" : "Create measurable"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., New leads" autoFocus />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Owner</label>
            <select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
              {team.filter(m => m.id !== "2").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="field" style={{ width: 100 }}>
            <label>Operator</label>
            <select value={form.op} onChange={e => setForm({ ...form, op: e.target.value })}>
              <option value=">=">&gt;=</option>
              <option value="<=">&lt;=</option>
            </select>
          </div>

          <div className="field" style={{ width: 100 }}>
            <label>Goal</label>
            <input type="number" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} />
          </div>

          <div className="field" style={{ width: 90 }}>
            <label>Unit</label>
            <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              <option value="#">#</option>
              <option value="$">$</option>
              <option value="%">%</option>
            </select>
          </div>
        </div>
      </div>

      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <div>
          {editId && <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => removeMetric(editId)}><Ic.Trash /> Delete</button>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-p" onClick={saveMetric}>{editId ? "Save" : "Create"}</button>
        </div>
      </div>
    </Modal>}
  </>;
}

const ROCK_STATUS = {
  "on-track":  { label: "On Track",  bg: "var(--blue-l)",  color: "var(--blue-t)",  border: "var(--blue)" },
  "off-track": { label: "Off Track", bg: "var(--red-l)",   color: "var(--red-t)",   border: "var(--red)" },
  "completed": { label: "Completed", bg: "var(--green-l)", color: "var(--green-t)", border: "var(--green)" },
  "cancelled": { label: "Cancelled", bg: "var(--bg2)",     color: "var(--t2)",      border: "var(--brd2)" }
};

const THUMB_PATH = "M185.046,94.718c0.311-0.523,0.723-1.084,1.174-1.575c0.086-0.104,8.339-10.704,5.547-21.774c-1.381-5.476-5.164-9.953-11.248-13.31c1.532-3.761,3.504-10.733,0.948-17.569c-2.083-5.565-6.66-9.802-13.607-12.583c-0.723-4.345-3.207-14.552-11.134-21.176c-4.656-3.894-10.418-5.869-17.121-5.869c-1.059,0-2.108,0.05-2.924,0.147C135.243,0.834,127.498,0,116.747,0C98.81,0,73.103,2.273,52.568,13.074l-14.237,4.223H10.666v6.174h28.112l16.094-4.703C74.638,8.421,99.726,6.252,117.305,6.252c11.198,0,18.775,0.895,18.864,0.902l0.422,0.029l0.229-0.018c6.385-0.612,11.785,0.841,15.926,4.287c7.87,6.56,9.173,18.47,9.219,18.971l0.175,1.993l1.893,0.659c6.127,2.112,10.046,5.329,11.628,9.552c2.645,7.036-1.714,14.985-1.9,15.314l-1.686,2.956l3.106,1.392c5.919,2.659,9.484,6.22,10.59,10.572c1.832,7.219-3.267,14.888-4.28,16.32c-0.837,0.902-3.532,4.148-2.967,7.655l0.519,1.832l1.729,0.551c0.88,0.286,6.893,6.646,6.635,13.07c-0.2,4.971-4.388,8.453-12.458,10.357c-2.122,0.505-4.366,0.744-6.871,0.744c-2.935,0-5.891-0.34-8.74-0.659c-2.484-0.293-5.297-0.619-8.027-0.619c-6.478,0-14.663,1.657-20.539,14.584c-3.751,8.271-0.898,22.21,0.641,29.697l0.243,1.242c3.142,15.643,0.798,23.424-8.629,28.717c-2.834,1.585-5.494,2.119-6.893,1.41c-1.213-0.63-1.997-2.341-2.305-5.086c-0.104-0.963-0.004-2.52,0.079-4.037c0.437-7.591,1.16-20.31-10.679-38.394c-13.678-14.999-20.714-18.073-22.45-18.614c-6.778-4.03-12.991-9.48-19.075-14.827c-6.123-5.365-12.451-10.912-19.562-15.174l-0.712-0.422l-26.82-0.415l-0.455-0.011l-0.097,6.177l25.61,0.387c6.399,3.958,12.322,9.151,18.07,14.19c6.267,5.501,12.751,11.195,20.242,15.6l0.626,0.254c0.061,0.021,6.506,2.154,19.752,16.62c10.447,16.019,9.781,27.457,9.38,34.325c-0.104,1.832-0.208,3.565-0.039,5.007c0.54,4.939,2.434,8.271,5.608,9.899c1.296,0.673,2.766,1.006,4.37,1.006c2.545,0,5.433-0.866,8.371-2.516c14.806-8.31,14.348-21.885,11.653-35.316l-0.258-1.256c-1.281-6.327-3.962-19.494-1.052-25.914c4.141-9.122,8.893-10.991,14.752-10.991c2.29,0,4.846,0.293,7.605,0.612c2.97,0.344,6.041,0.687,9.326,0.687c3.013,0,5.726-0.297,8.278-0.898c14.333-3.382,17.286-11.055,17.229-16.906C193.528,104.477,188.66,97.549,185.046,94.718z";

const CANCELLED_PATH = "M213.333333,1.42108547e-14 C331.15408,1.42108547e-14 426.666667,95.5125867 426.666667,213.333333 C426.666667,331.15408 331.15408,426.666667 213.333333,426.666667 C95.5125867,426.666667 4.26325641e-14,331.15408 4.26325641e-14,213.333333 C4.26325641e-14,95.5125867 95.5125867,1.42108547e-14 213.333333,1.42108547e-14 Z M42.6666667,213.333333 C42.6666667,307.589931 119.076736,384 213.333333,384 C252.77254,384 289.087204,370.622239 317.987133,348.156908 L78.5096363,108.679691 C56.044379,137.579595 42.6666667,173.894198 42.6666667,213.333333 Z M213.333333,42.6666667 C173.894198,42.6666667 137.579595,56.044379 108.679691,78.5096363 L348.156908,317.987133 C370.622239,289.087204 384,252.77254 384,213.333333 C384,119.076736 307.589931,42.6666667 213.333333,42.6666667 Z";

function ThumbIcon({ up, color, size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 204.249 204.249" fill={color}
         style={{ display: "block", flexShrink: 0, transform: up ? "scaleY(-1)" : "none" }}>
      <path d={THUMB_PATH} />
    </svg>
  );
}

function CompletedIcon({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
         style={{ display: "block", flexShrink: 0 }}>
      <circle cx="6" cy="6" r="6" fill={color} />
      <path d="M2.5 6.5L5 9l4.5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CancelledIcon({ color, size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color}
         style={{ display: "block", flexShrink: 0 }}>
      <g transform="translate(42.666667, 42.666667)">
        <path d={CANCELLED_PATH} />
      </g>
    </svg>
  );
}

function RockStatusBadge({ rock, onChange }) {
  const s = ROCK_STATUS[rock.status] || ROCK_STATUS["on-track"];
  const icon = rock.status === "on-track" ? <ThumbIcon up color={s.color} /> :
               rock.status === "off-track" ? <ThumbIcon color={s.color} /> :
               rock.status === "completed" ? <CompletedIcon color={s.color} /> :
               <CancelledIcon color={s.color} />;
  return (
    <div style={{ position: "relative", display: "inline-flex" }} onClick={onChange ? e => e.stopPropagation() : undefined}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap", cursor: onChange ? "pointer" : "default", userSelect: "none" }}>
        {icon} {s.label}
      </span>
      {onChange && <select style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} value={rock.status || "on-track"} onChange={e => onChange(rock.id, e.target.value)}>
        <option value="on-track">On Track</option>
        <option value="off-track">Off Track</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>}
    </div>
  );
}

// PLACEHOLDER PAGES
function RocksPage({ rocks, setRocks, team, activeMemberIds, issues, todos }) {
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", owner: "1", dueDate: "", status: "on-track", quarter: "", milestones: [] });
  const [msTitle, setMsTitle] = useState("");
  const [msDue, setMsDue] = useState("");

  const now = new Date();
  const qNum = Math.floor(now.getMonth() / 3) + 1;
  const qLabel = `Q${qNum} ${now.getFullYear()}`;

  const defaultDueDate = () => {
    const qEndMonth = Math.floor(now.getMonth() / 3) * 3 + 2;
    const d = new Date(now.getFullYear(), qEndMonth + 1, 0);
    return d.toISOString().split("T")[0];
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ title: "", owner: "1", dueDate: defaultDueDate(), status: "on-track", quarter: qLabel, milestones: [] });
    setMsTitle("");
    setMsDue("");
    setModal("rock");
  };

  const openEdit = rock => {
    setEditId(rock.id);
    setForm({
      title: rock.title || "",
      owner: rock.owner || "1",
      dueDate: rock.dueDate || defaultDueDate(),
      status: rock.status || "on-track",
      quarter: rock.quarter || qLabel,
      milestones: rock.milestones || []
    });
    setMsTitle("");
    setMsDue("");
    setModal("rock");
  };

  const saveRock = () => {
    const title = form.title.trim();
    if (!title) return;
    const payload = {
      title,
      owner: form.owner,
      dueDate: form.dueDate,
      status: form.status,
      quarter: form.quarter || qLabel,
      milestones: form.milestones
    };
    if (editId) {
      setRocks(prev => prev.map(r => (r.id === editId ? { ...r, ...payload } : r)));
    } else {
      setRocks(prev => [...prev, { id: uid(), ...payload, createdAt: new Date().toISOString() }]);
    }
    setModal(null);
  };

  const removeRock = id => {
    setRocks(prev => prev.filter(r => r.id !== id));
    setModal(null);
  };

  const setRockStatus = (id, status) => {
    setRocks(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  };

  const addMilestone = () => {
    const title = msTitle.trim();
    if (!title) return;
    setForm(prev => ({ ...prev, milestones: [...prev.milestones, { id: uid(), title, done: false, dueDate: msDue }] }));
    setMsTitle("");
    setMsDue("");
  };

  const toggleMilestone = id => {
    setForm(prev => ({ ...prev, milestones: prev.milestones.map(m => (m.id === id ? { ...m, done: !m.done } : m)) }));
  };

  const removeMilestone = id => {
    setForm(prev => ({ ...prev, milestones: prev.milestones.filter(m => m.id !== id) }));
  };

  const linkedIssues = editId ? issues.filter(i => i.rockId === editId) : [];
  const linkedTodos = editId ? todos.filter(t => t.rockId === editId) : [];

  const filtered = rocks
    .filter(r => {
      if (!activeMemberIds.includes(r.owner)) return false;
      if (tab === "active" && (r.status === "completed" || r.status === "cancelled")) return false;
      if (tab === "completed" && r.status !== "completed") return false;
      if (ownerFilter !== "all" && r.owner !== ownerFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  return <>
    <div className="phdr">
      <div className="phdr-top">
        <div>
          <h1>Rocks</h1>
          <div className="phdr-desc">Define and track quarterly priorities with clear ownership and status.</div>
        </div>
        <div className="phdr-actions">
          <button className="btn btn-p" onClick={openAdd}><Ic.Plus /> Add rock</button>
        </div>
      </div>
      <div className="tabs">
        <div className={`tab${tab === "active" ? " on" : ""}`} onClick={() => setTab("active")}>Active</div>
        <div className={`tab${tab === "completed" ? " on" : ""}`} onClick={() => setTab("completed")}>Completed</div>
      </div>
    </div>

    <div className="toolbar">
      <select className="tb-filter" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
        <option value="all">Owner: All</option>
        {team.filter(m => m.id !== "2").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <select className="tb-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="all">Status: All</option>
        <option value="on-track">On Track</option>
        <option value="off-track">Off Track</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <div className="tb-search">
        <Ic.Search />
        <input placeholder="Search rocks..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
    </div>

    <div className="content"><div className="content-inner">
      <div className="sec">
        <div className="sec-hdr">
          <h2>Rocks<span className="count">{filtered.length}</span></h2>
        </div>

        {filtered.length === 0 ? <div className="empty"><EmptySVG.rocks /><h3>No rocks found</h3><p>Create a rock to start the quarter with clear priorities.</p></div> : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Title</th>
                <th style={{ width: 130 }}>Milestones</th>
                <th style={{ width: 110 }}>Quarter</th>
                <th style={{ width: 110 }}>Due</th>
                <th style={{ width: 90 }}>Owner</th>
                <th style={{ width: 130 }}>Status</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rock => {
                const m = team.find(x => x.id === rock.owner) || team[1];
                const overdue = rock.status !== "completed" && isOverdue(rock.dueDate);
                const { done: msDone, total: msTotal } = milestoneProgress(rock.milestones);
                return <tr key={rock.id}>
                  <td>{rock.title}</td>
                  <td>
                    {msTotal === 0 ? <span style={{ color: "var(--t3)" }}>-</span> : <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${(msDone / msTotal) * 100}%` }} /></div>
                      <span style={{ fontSize: 12, color: "var(--t2)", whiteSpace: "nowrap" }}>{msDone}/{msTotal}</span>
                    </div>}
                  </td>
                  <td style={{ color: "var(--t2)" }}>{rock.quarter || "-"}</td>
                  <td style={{ color: overdue ? "var(--red-t)" : "var(--t2)" }}>{overdue && <Ic.Warn />}{fmtDate(rock.dueDate)}</td>
                  <td><Av m={m} /></td>
                  <td>
                    <RockStatusBadge rock={rock} onChange={setRockStatus} />
                  </td>
                  <td><button className="btn-ghost" onClick={() => openEdit(rock)}>Edit</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        )}
      </div>
    </div></div>

    {modal === "rock" && <Modal title={editId ? "Edit rock" : "Create rock"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field">
          <label>Rock title</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Quarterly priority" autoFocus />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Owner</label>
            <select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
              {team.filter(m => m.id !== "2").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Quarter</label>
            <input value={form.quarter} onChange={e => setForm({ ...form, quarter: e.target.value })} placeholder="Q1 2026" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Due date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="on-track">On Track</option>
              <option value="off-track">Off Track</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Milestones{form.milestones.length > 0 ? ` (${form.milestones.filter(m => m.done).length}/${form.milestones.length})` : ""}</label>
          {form.milestones.map(ms => (
            <div className="ms-row" key={ms.id}>
              <CircleCk on={ms.done} toggle={() => toggleMilestone(ms.id)} />
              <span className={`ms-title${ms.done ? " done" : ""}`}>{ms.title}</span>
              {ms.dueDate && <span className="ms-due">{fmtDate(ms.dueDate)}</span>}
              <button className="btn-ghost" onClick={() => removeMilestone(ms.id)}><Ic.Trash /></button>
            </div>
          ))}
          <div className="ms-add">
            <input type="text" value={msTitle} onChange={e => setMsTitle(e.target.value)} placeholder="Add a milestone..." onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMilestone(); } }} />
            <input type="date" value={msDue} onChange={e => setMsDue(e.target.value)} />
            <button className="btn btn-sm" onClick={addMilestone}>Add</button>
          </div>
        </div>

        {editId && (linkedIssues.length > 0 || linkedTodos.length > 0) && (
          <div className="field" style={{ marginBottom: 0, marginTop: 16 }}>
            <label>Linked Items</label>
            {linkedIssues.map(i => <div key={i.id} className="ms-row"><span className="tag">Issue</span><span className="ms-title">{i.title}</span></div>)}
            {linkedTodos.map(t => <div key={t.id} className="ms-row"><span className="tag">To-Do</span><span className="ms-title">{t.title}</span></div>)}
          </div>
        )}
      </div>

      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <div>
          {editId && <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => removeRock(editId)}><Ic.Trash /> Delete</button>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-p" onClick={saveRock}>{editId ? "Save" : "Create"}</button>
        </div>
      </div>
    </Modal>}
  </>;
}

function IssuesPage({ issues, setIssues, team, activeMemberIds, rocks, todos, setTodos }) {
  const [tab, setTab] = useState("short-term");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ title: "", owner: "1", type: "short-term", notes: "", rockId: "" });

  const openAdd = () => {
    setEditId(null);
    setForm({ title: "", owner: "1", type: tab, notes: "", rockId: "" });
    setModal("issue");
  };

  const openEdit = issue => {
    setEditId(issue.id);
    setForm({
      title: issue.title || "",
      owner: issue.owner || "1",
      type: issue.type || "short-term",
      notes: issue.notes || "",
      rockId: issue.rockId || ""
    });
    setModal("issue");
  };

  const saveIssue = () => {
    const title = form.title.trim();
    if (!title) return;
    const payload = {
      title,
      owner: form.owner,
      type: form.type,
      notes: form.notes,
      rockId: form.rockId || null,
      done: false
    };

    if (editId) {
      setIssues(prev => prev.map(i => (i.id === editId ? { ...i, ...payload } : i)));
    } else {
      setIssues(prev => [...prev, { id: uid(), ...payload, createdAt: new Date().toISOString() }]);
    }
    setModal(null);
  };

  const createTodoFromIssue = issue => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setTodos(prev => [...prev, {
      id: uid(),
      title: issue.title,
      owner: issue.owner,
      dueDate: d.toISOString().split("T")[0],
      done: false,
      rockId: issue.rockId || null,
      sourceIssueId: issue.id,
      createdAt: new Date().toISOString()
    }]);
  };

  const setSolved = (id, done) => {
    setIssues(prev => prev.map(i => (i.id === id ? { ...i, done, solvedAt: done ? new Date().toISOString() : null } : i)));
  };

  const removeIssue = id => {
    setIssues(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
    setModal(null);
  };

  const filtered = issues
    .filter(i => {
      if (!activeMemberIds.includes(i.owner)) return false;
      if ((i.type || "short-term") !== tab) return false;
      if (ownerFilter !== "all" && i.owner !== ownerFilter) return false;
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !(i.notes || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => Number(Boolean(a.done)) - Number(Boolean(b.done)) || (a.createdAt || "").localeCompare(b.createdAt || ""));

  const selected = issues.find(i => i.id === selectedId) || null;

  return <>
    <div className="phdr">
      <div className="phdr-top">
        <div>
          <h1>Issues</h1>
          <div className="phdr-desc">Capture, prioritize, and solve problems through IDS.</div>
        </div>
        <div className="phdr-actions">
          <button className="btn btn-p" onClick={openAdd}><Ic.Plus /> Add issue</button>
        </div>
      </div>
      <div className="tabs">
        <div className={`tab${tab === "short-term" ? " on" : ""}`} onClick={() => setTab("short-term")}>Short-Term</div>
        <div className={`tab${tab === "long-term" ? " on" : ""}`} onClick={() => setTab("long-term")}>Long-Term</div>
      </div>
    </div>

    <div className="toolbar">
      <select className="tb-filter" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
        <option value="all">Owner: All</option>
        {team.filter(m => m.id !== "2").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <div className="tb-search">
        <Ic.Search />
        <input placeholder="Search issues..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
    </div>

    <div className="content"><div className="content-inner" style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px, 340px)", gap: 16 }}>
      <div className="sec" style={{ marginBottom: 0 }}>
        <div className="sec-hdr">
          <h2>Issue List<span className="count">{filtered.length}</span></h2>
        </div>

        {filtered.length === 0 ? <div className="empty"><EmptySVG.issues /><h3>No issues yet</h3><p>Add an issue to track your next problem to solve.</p></div> : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 42 }}></th>
                <th>Issue</th>
                <th style={{ width: 85 }}>Owner</th>
                <th style={{ width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(issue => {
                const m = team.find(x => x.id === issue.owner) || team[1];
                const active = selectedId === issue.id;
                return <tr key={issue.id} style={active ? { background: "var(--blue-l)" } : {}}>
                  <td><CircleCk on={Boolean(issue.done)} toggle={() => setSolved(issue.id, !issue.done)} /></td>
                  <td onClick={() => setSelectedId(issue.id)} style={{ cursor: "pointer" }}>
                    <div style={{ fontWeight: 600, color: issue.done ? "var(--t3)" : "var(--t1)", textDecoration: issue.done ? "line-through" : "none" }}>{issue.title}</div>
                    {!!issue.notes && <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{issue.notes.slice(0, 110)}{issue.notes.length > 110 ? "..." : ""}</div>}
                    {issue.rockId && rocks.find(r => r.id === issue.rockId) && <span className="tag" style={{ marginTop: 4, display: "inline-block" }}>{rocks.find(r => r.id === issue.rockId).title}</span>}
                  </td>
                  <td><Av m={m} /></td>
                  <td><button className="btn-ghost" onClick={() => openEdit(issue)}>Edit</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="sec" style={{ marginBottom: 0 }}>
        <div className="sec-hdr"><h2>Details</h2></div>
        {!selected ? <div className="empty" style={{ padding: "30px 16px" }}><p>Select an issue to view details.</p></div> : <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>Title</div>
          <div style={{ marginTop: 6, fontSize: 15, fontWeight: 600 }}>{selected.title}</div>

          <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span className={`status ${selected.done ? "status-on" : "status-off"}`}>{selected.done ? "Solved" : "Open"}</span>
            <span style={{ fontSize: 12, color: "var(--t2)" }}>{(selected.type || "short-term") === "short-term" ? "Short-Term" : "Long-Term"}</span>
            {selected.rockId && rocks.find(r => r.id === selected.rockId) && <span className="tag">{rocks.find(r => r.id === selected.rockId).title}</span>}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>Notes</div>
            <textarea
              value={selected.notes || ""}
              onChange={e => setIssues(prev => prev.map(i => (i.id === selected.id ? { ...i, notes: e.target.value } : i)))}
              placeholder="Document root cause, discussion, and resolution..."
              style={{ marginTop: 8, width: "100%", minHeight: 160, border: "1px solid var(--brd)", borderRadius: 8, padding: 10, fontFamily: "inherit", fontSize: 13, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => setSolved(selected.id, !selected.done)}>{selected.done ? "Reopen" : "Mark solved"}</button>
            <button className="btn" onClick={() => openEdit(selected)}>Edit metadata</button>
            {todos.some(t => t.sourceIssueId === selected.id)
              ? <span style={{ fontSize: 12, color: "var(--t3)", alignSelf: "center" }}>✓ To-do created</span>
              : <button className="btn" onClick={() => createTodoFromIssue(selected)}><Ic.Plus /> Create to-do</button>}
          </div>
        </div>}
      </div>
    </div></div>

    {modal === "issue" && <Modal title={editId ? "Edit issue" : "Create issue"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field">
          <label>Issue</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What problem needs solving?" autoFocus />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Owner</label>
            <select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
              {team.filter(m => m.id !== "2").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="short-term">Short-Term</option>
              <option value="long-term">Long-Term</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Linked rock (optional)</label>
          <select value={form.rockId} onChange={e => setForm({ ...form, rockId: e.target.value })}>
            <option value="">None</option>
            {rocks.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Context and details" rows={5} />
        </div>
      </div>

      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <div>
          {editId && <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => removeIssue(editId)}><Ic.Trash /> Delete</button>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-p" onClick={saveIssue}>{editId ? "Save" : "Create"}</button>
        </div>
      </div>
    </Modal>}
  </>;
}

const PROCESS_STATUS = {
  "not-started": { label: "Not Started", cls: "status-muted" },
  "draft": { label: "Draft", cls: "status-warn" },
  "documented": { label: "Documented", cls: "status-on" },
  "fba": { label: "FBA", cls: "status-fba" }
};

function ProcessesPage({ processes, setProcesses, team, activeMemberIds }) {
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ title: "", owner: "1", status: "not-started", steps: "", notes: "" });

  const openAdd = () => {
    setEditId(null);
    setForm({ title: "", owner: "1", status: "not-started", steps: "", notes: "" });
    setModal("process");
  };

  const openEdit = proc => {
    setEditId(proc.id);
    setForm({
      title: proc.title || "",
      owner: proc.owner || "1",
      status: proc.status || "not-started",
      steps: (proc.steps || []).join("\n"),
      notes: proc.notes || ""
    });
    setModal("process");
  };

  const saveProcess = () => {
    const title = form.title.trim();
    if (!title) return;
    const payload = {
      title,
      owner: form.owner,
      status: form.status,
      steps: parseLines(form.steps),
      notes: form.notes
    };
    if (editId) {
      setProcesses(prev => prev.map(p => (p.id === editId ? { ...p, ...payload } : p)));
    } else {
      setProcesses(prev => [...prev, { id: uid(), ...payload, lastReviewed: null, createdAt: new Date().toISOString() }]);
    }
    setModal(null);
  };

  const removeProcess = id => {
    setProcesses(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
    setModal(null);
  };

  const markReviewed = id => {
    setProcesses(prev => prev.map(p => (p.id === id ? { ...p, lastReviewed: new Date().toISOString().split("T")[0] } : p)));
  };

  const filtered = processes
    .filter(p => {
      if (!activeMemberIds.includes(p.owner)) return false;
      if (ownerFilter !== "all" && p.owner !== ownerFilter) return false;
      if (statusFilter !== "all" && (p.status || "not-started") !== statusFilter) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  const selected = processes.find(p => p.id === selectedId) || null;

  return <>
    <div className="phdr">
      <div className="phdr-top">
        <div>
          <h1>Processes</h1>
          <div className="phdr-desc">Document, standardize, and keep your core processes followed by all.</div>
        </div>
        <div className="phdr-actions">
          <button className="btn btn-p" onClick={openAdd}><Ic.Plus /> Add process</button>
        </div>
      </div>
    </div>

    <div className="toolbar">
      <select className="tb-filter" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
        <option value="all">Owner: All</option>
        {team.filter(m => m.id !== "2").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <select className="tb-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="all">Status: All</option>
        <option value="not-started">Not Started</option>
        <option value="draft">Draft</option>
        <option value="documented">Documented</option>
        <option value="fba">FBA</option>
      </select>
      <div className="tb-search">
        <Ic.Search />
        <input placeholder="Search processes..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
    </div>

    <div className="content"><div className="content-inner" style={{ display: "grid", gridTemplateColumns: "1fr minmax(280px, 380px)", gap: 16 }}>
      <div className="sec" style={{ marginBottom: 0 }}>
        <div className="sec-hdr">
          <h2>Process List<span className="count">{filtered.length}</span></h2>
        </div>

        {filtered.length === 0 ? <div className="empty"><h3>No processes documented</h3><p>Add your first core process to start building your playbook.</p></div> : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Title</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 100 }}>Reviewed</th>
                <th style={{ width: 85 }}>Owner</th>
                <th style={{ width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(proc => {
                const m = team.find(x => x.id === proc.owner) || team[1];
                const active = selectedId === proc.id;
                const st = PROCESS_STATUS[proc.status || "not-started"];
                return <tr key={proc.id} style={active ? { background: "var(--blue-l)" } : {}}>
                  <td onClick={() => setSelectedId(proc.id)} style={{ cursor: "pointer", fontWeight: 600 }}>{proc.title}</td>
                  <td><span className={`status ${st.cls}`}>{st.label}</span></td>
                  <td style={{ color: "var(--t2)" }}>{proc.lastReviewed ? fmtDate(proc.lastReviewed) : "-"}</td>
                  <td><Av m={m} /></td>
                  <td><button className="btn-ghost" onClick={() => openEdit(proc)}>Edit</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="sec" style={{ marginBottom: 0 }}>
        <div className="sec-hdr"><h2>Details</h2></div>
        {!selected ? <div className="empty" style={{ padding: "30px 16px" }}><p>Select a process to view its steps.</p></div> : <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>Title</div>
          <div style={{ marginTop: 6, fontSize: 15, fontWeight: 600 }}>{selected.title}</div>

          <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span className={`status ${PROCESS_STATUS[selected.status || "not-started"].cls}`}>{PROCESS_STATUS[selected.status || "not-started"].label}</span>
            <span style={{ fontSize: 12, color: "var(--t2)" }}>Last reviewed: {selected.lastReviewed ? fmtDate(selected.lastReviewed) : "Never"}</span>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>Steps (one per line)</div>
            <textarea
              value={(selected.steps || []).join("\n")}
              onChange={e => setProcesses(prev => prev.map(p => (p.id === selected.id ? { ...p, steps: parseLines(e.target.value) } : p)))}
              placeholder={"1. First step\n2. Second step..."}
              style={{ marginTop: 8, width: "100%", minHeight: 140, border: "1px solid var(--brd)", borderRadius: 8, padding: 10, fontFamily: "inherit", fontSize: 13, resize: "vertical" }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>Notes</div>
            <textarea
              value={selected.notes || ""}
              onChange={e => setProcesses(prev => prev.map(p => (p.id === selected.id ? { ...p, notes: e.target.value } : p)))}
              placeholder="Tools, exceptions, links to docs..."
              style={{ marginTop: 8, width: "100%", minHeight: 90, border: "1px solid var(--brd)", borderRadius: 8, padding: 10, fontFamily: "inherit", fontSize: 13, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => markReviewed(selected.id)}>Mark reviewed today</button>
            <button className="btn" onClick={() => openEdit(selected)}>Edit metadata</button>
          </div>
        </div>}
      </div>
    </div></div>

    {modal === "process" && <Modal title={editId ? "Edit process" : "Create process"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field">
          <label>Process title</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., New patient onboarding" autoFocus />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Owner</label>
            <select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
              {team.filter(m => m.id !== "2").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="not-started">Not Started</option>
              <option value="draft">Draft</option>
              <option value="documented">Documented</option>
              <option value="fba">FBA</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Steps (one per line)</label>
          <textarea value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })} placeholder={"Step one\nStep two\nStep three"} rows={5} />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Tools, exceptions, links to docs..." rows={3} />
        </div>
      </div>

      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <div>
          {editId && <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => removeProcess(editId)}><Ic.Trash /> Delete</button>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-p" onClick={saveProcess}>{editId ? "Save" : "Create"}</button>
        </div>
      </div>
    </Modal>}
  </>;
}

const MEETING_SECTION_LABELS = [
  ["segue", "1. Segue"],
  ["scorecard", "2. Scorecard"],
  ["rocks", "3. Rocks"],
  ["customerEmployee", "4. Customer/Employee Headlines"],
  ["todoReview", "5. To-Do Review"],
  ["ids", "6. IDS (Identify, Discuss, Solve)"]
];

function freshMeetingState() {
  return {
    title: "Weekly Level 10",
    date: new Date().toISOString().slice(0, 10),
    sections: { segue: "", scorecard: "", rocks: "", customerEmployee: "", todoReview: "", ids: "" },
    tangents: [],
    timerSeconds: 0
  };
}

function MeetingsPage({ meetings, setMeetings, issues, todos, team, activeMemberIds }) {
  const store = meetings && typeof meetings === "object" ? meetings : {};
  const defaultMeetingRef = useRef(freshMeetingState());
  const mState = store.current || defaultMeetingRef.current;
  const history = store.history || [];

  const [running, setRunning] = useState(false);
  const [tangentText, setTangentText] = useState("");
  const [tab, setTab] = useState("run");
  const [modal, setModal] = useState(null);
  const [rating, setRating] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setMeetings(prev => {
        const base = prev && typeof prev === "object" ? prev : {};
        const cur = base.current || mState;
        return { ...base, current: { ...cur, timerSeconds: (cur.timerSeconds || 0) + 1 } };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, setMeetings, mState]);

  const updateMeeting = updater => {
    setMeetings(prev => {
      const base = prev && typeof prev === "object" ? prev : {};
      const cur = base.current || mState;
      const next = typeof updater === "function" ? updater(cur) : updater;
      return { ...base, current: next };
    });
  };

  const setSection = (key, value) => {
    updateMeeting(cur => ({ ...cur, sections: { ...(cur.sections || {}), [key]: value } }));
  };

  const addTangent = () => {
    const title = tangentText.trim();
    if (!title) return;
    updateMeeting(cur => ({ ...cur, tangents: [...(cur.tangents || []), { id: uid(), title, createdAt: new Date().toISOString() }] }));
    setTangentText("");
  };

  const clearMeeting = () => {
    setRunning(false);
    setMeetings(prev => {
      const base = prev && typeof prev === "object" ? prev : {};
      return { ...base, current: freshMeetingState() };
    });
  };

  const openEndMeeting = () => {
    setRating(null);
    setModal("end");
  };

  const confirmEndMeeting = () => {
    if (!rating) return;
    setRunning(false);
    setMeetings(prev => {
      const base = prev && typeof prev === "object" ? prev : {};
      const cur = base.current || mState;
      const archived = {
        id: uid(),
        title: cur.title || "Weekly Level 10",
        date: cur.date || new Date().toISOString().slice(0, 10),
        sections: cur.sections || {},
        tangents: cur.tangents || [],
        durationSeconds: cur.timerSeconds || 0,
        rating,
        endedAt: new Date().toISOString()
      };
      return { ...base, history: [archived, ...(base.history || [])], current: freshMeetingState() };
    });
    setModal(null);
  };

  const removeHistoryMeeting = id => {
    setMeetings(prev => {
      const base = prev && typeof prev === "object" ? prev : {};
      return { ...base, history: (base.history || []).filter(h => h.id !== id) };
    });
    if (selectedHistoryId === id) setSelectedHistoryId(null);
  };

  const fmtDuration = s => {
    const sec = s || 0;
    const hh = String(Math.floor(sec / 3600)).padStart(2, "0");
    const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const openIssues = issues.filter(i => !i.done && activeMemberIds.includes(i.owner));
  const openTodos = todos.filter(t => !t.done && activeMemberIds.includes(t.owner));
  const tangents = mState.tangents || [];
  const selectedHistory = history.find(h => h.id === selectedHistoryId) || null;

  return <>
    <div className="phdr">
      <div className="phdr-top">
        <div>
          <h1>Meetings</h1>
          <div className="phdr-desc">Run your Level 10 meeting with structured sections, timer, IDS notes, and tangents.</div>
        </div>
        {tab === "run" && <div className="phdr-actions" style={{ gap: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: ".03em", minWidth: 110, textAlign: "right" }}>{fmtDuration(mState.timerSeconds || 0)}</div>
          <button className="btn" onClick={() => setRunning(r => !r)}>{running ? "Pause" : "Start"}</button>
          <button className="btn" onClick={clearMeeting}>Reset</button>
          <button className="btn btn-p" onClick={openEndMeeting}>End meeting</button>
        </div>}
      </div>
      <div className="tabs">
        <div className={`tab${tab === "run" ? " on" : ""}`} onClick={() => setTab("run")}>Run Meeting</div>
        <div className={`tab${tab === "history" ? " on" : ""}`} onClick={() => setTab("history")}>History</div>
      </div>
    </div>

    {tab === "run" && <div className="content"><div className="content-inner" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
      <div>
        <div className="sec">
          <div className="sec-hdr"><h2>Meeting Setup</h2></div>
          <div style={{ padding: "16px 20px", display: "flex", gap: 12 }}>
            <div className="field" style={{ flex: 2, marginBottom: 0 }}>
              <label>Meeting title</label>
              <input value={mState.title || ""} onChange={e => updateMeeting(cur => ({ ...cur, title: e.target.value }))} />
            </div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Date</label>
              <input type="date" value={mState.date || ""} onChange={e => updateMeeting(cur => ({ ...cur, date: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="sec">
          <div className="sec-hdr"><h2>1. Segue</h2></div>
          <div style={{ padding: "12px 20px" }}><textarea className="field" style={{ marginBottom: 0, minHeight: 78, width: "100%" }} value={mState.sections?.segue || ""} onChange={e => setSection("segue", e.target.value)} placeholder="Good news / personal and professional highlights" /></div>
        </div>

        <div className="sec">
          <div className="sec-hdr"><h2>2. Scorecard</h2></div>
          <div style={{ padding: "12px 20px" }}><textarea className="field" style={{ marginBottom: 0, minHeight: 78, width: "100%" }} value={mState.sections?.scorecard || ""} onChange={e => setSection("scorecard", e.target.value)} placeholder="Discuss red/yellow measurables and trends" /></div>
        </div>

        <div className="sec">
          <div className="sec-hdr"><h2>3. Rocks</h2></div>
          <div style={{ padding: "12px 20px" }}><textarea className="field" style={{ marginBottom: 0, minHeight: 78, width: "100%" }} value={mState.sections?.rocks || ""} onChange={e => setSection("rocks", e.target.value)} placeholder="Rock status review and blockers" /></div>
        </div>

        <div className="sec">
          <div className="sec-hdr"><h2>4. Customer/Employee Headlines</h2></div>
          <div style={{ padding: "12px 20px" }}><textarea className="field" style={{ marginBottom: 0, minHeight: 78, width: "100%" }} value={mState.sections?.customerEmployee || ""} onChange={e => setSection("customerEmployee", e.target.value)} placeholder="Share notable wins, risks, and updates" /></div>
        </div>

        <div className="sec">
          <div className="sec-hdr"><h2>5. To-Do Review</h2></div>
          <div style={{ padding: "12px 20px" }}><textarea className="field" style={{ marginBottom: 0, minHeight: 78, width: "100%" }} value={mState.sections?.todoReview || ""} onChange={e => setSection("todoReview", e.target.value)} placeholder="Review last week's commitments and misses" /></div>
        </div>

        <div className="sec">
          <div className="sec-hdr"><h2>6. IDS (Identify, Discuss, Solve)</h2></div>
          <div style={{ padding: "12px 20px" }}><textarea className="field" style={{ marginBottom: 0, minHeight: 160, width: "100%" }} value={mState.sections?.ids || ""} onChange={e => setSection("ids", e.target.value)} placeholder="Record IDS discussion and decisions" /></div>
        </div>
      </div>

      <div>
        <div className="sec" style={{ marginBottom: 16 }}>
          <div className="sec-hdr"><h2>Open Issues<span className="count">{openIssues.length}</span></h2></div>
          {openIssues.length === 0 ? <div className="empty" style={{ padding: "20px 12px" }}><p>No open issues for active team.</p></div> : <div style={{ padding: "8px 14px 12px" }}>
            {openIssues.slice(0, 8).map(i => {
              const m = team.find(x => x.id === i.owner) || team[1];
              return <div key={i.id} className="dash-irow"><span style={{ flex: 1, fontSize: 13 }}>{i.title}</span><Av m={m} size={20} /></div>;
            })}
          </div>}
        </div>

        <div className="sec" style={{ marginBottom: 16 }}>
          <div className="sec-hdr"><h2>Open To-Dos<span className="count">{openTodos.length}</span></h2></div>
          {openTodos.length === 0 ? <div className="empty" style={{ padding: "20px 12px" }}><p>No open to-dos for active team.</p></div> : <div style={{ padding: "8px 14px 12px" }}>
            {openTodos.slice(0, 8).map(t => {
              const m = team.find(x => x.id === t.owner) || team[1];
              return <div key={t.id} className="dash-irow"><span style={{ flex: 1, fontSize: 13 }}>{t.title}</span><Av m={m} size={20} /></div>;
            })}
          </div>}
        </div>

        <div className="sec" style={{ marginBottom: 0 }}>
          <div className="sec-hdr"><h2>Tangents<span className="count">{tangents.length}</span></h2></div>
          <div style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                value={tangentText}
                onChange={e => setTangentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addTangent(); }}
                placeholder="Capture tangent..."
                style={{ flex: 1, border: "1px solid var(--brd)", borderRadius: 8, padding: "8px 10px", fontFamily: "inherit", fontSize: 13 }}
              />
              <button className="btn btn-sm" onClick={addTangent}>Add</button>
            </div>

            {tangents.length === 0 ? <div style={{ fontSize: 12, color: "var(--t3)" }}>No tangents captured.</div> : <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {tangents.map(tg => (
                <div key={tg.id} className="dash-irow">
                  <span style={{ flex: 1, fontSize: 13 }}>{tg.title}</span>
                  <button className="btn-ghost" onClick={() => updateMeeting(cur => ({ ...cur, tangents: (cur.tangents || []).filter(x => x.id !== tg.id) }))}>Remove</button>
                </div>
              ))}
            </div>}
          </div>
        </div>
      </div>
    </div></div>}

    {tab === "history" && <div className="content"><div className="content-inner" style={{ display: "grid", gridTemplateColumns: "1fr minmax(280px, 380px)", gap: 16 }}>
      <div className="sec" style={{ marginBottom: 0 }}>
        <div className="sec-hdr"><h2>Past Meetings<span className="count">{history.length}</span></h2></div>
        {history.length === 0 ? <div className="empty"><h3>No meeting history yet</h3><p>End a meeting to save it here with a rating.</p></div> : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th style={{ width: 90 }}>Duration</th>
                <th style={{ width: 90 }}>Rating</th>
                <th style={{ width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => {
                const active = selectedHistoryId === h.id;
                const ratingCls = h.rating >= 8 ? "status-on" : h.rating >= 5 ? "status-warn" : "status-off";
                return <tr key={h.id} style={active ? { background: "var(--blue-l)" } : {}}>
                  <td onClick={() => setSelectedHistoryId(h.id)} style={{ cursor: "pointer" }}>{fmtDate(h.date)}</td>
                  <td onClick={() => setSelectedHistoryId(h.id)} style={{ cursor: "pointer", fontWeight: 600 }}>{h.title}</td>
                  <td style={{ color: "var(--t2)" }}>{fmtDuration(h.durationSeconds)}</td>
                  <td><span className={`status ${ratingCls}`}>{h.rating}/10</span></td>
                  <td><button className="btn-ghost" onClick={() => removeHistoryMeeting(h.id)}>Delete</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="sec" style={{ marginBottom: 0 }}>
        <div className="sec-hdr"><h2>Details</h2></div>
        {!selectedHistory ? <div className="empty" style={{ padding: "30px 16px" }}><p>Select a meeting to view its notes.</p></div> : <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>Meeting</div>
          <div style={{ marginTop: 6, fontSize: 15, fontWeight: 600 }}>{selectedHistory.title}</div>

          <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--t2)" }}>{fmtDate(selectedHistory.date)}</span>
            <span style={{ fontSize: 12, color: "var(--t2)" }}>Duration: {fmtDuration(selectedHistory.durationSeconds)}</span>
            <span className={`status ${selectedHistory.rating >= 8 ? "status-on" : selectedHistory.rating >= 5 ? "status-warn" : "status-off"}`}>{selectedHistory.rating}/10</span>
          </div>

          {MEETING_SECTION_LABELS.map(([key, label]) => selectedHistory.sections?.[key] ? (
            <div key={key} style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>{label}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--t1)", whiteSpace: "pre-wrap" }}>{selectedHistory.sections[key]}</div>
            </div>
          ) : null)}

          {(selectedHistory.tangents || []).length > 0 && <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>Tangents</div>
            <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 13 }}>
              {selectedHistory.tangents.map(tg => <li key={tg.id}>{tg.title}</li>)}
            </ul>
          </div>}
        </div>}
      </div>
    </div></div>}

    {modal === "end" && <Modal title="End meeting" onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Rate this meeting (1-10)</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <button key={n} type="button" className={`btn btn-sm${rating === n ? " btn-p" : ""}`} onClick={() => setRating(n)}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn" onClick={() => setModal(null)}>Cancel</button>
        <button className="btn btn-p" onClick={confirmEndMeeting} disabled={!rating}>Save & end meeting</button>
      </div>
    </Modal>}
  </>;
}
function HeadlinesPage({ headlines, setHeadlines, team, activeMemberIds }) {
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", owner: "1" });

  const openAdd = () => {
    setEditId(null);
    setForm({ title: "", body: "", owner: "1" });
    setModal("headline");
  };

  const openEdit = item => {
    setEditId(item.id);
    setForm({ title: item.title || "", body: item.body || "", owner: item.owner || "1" });
    setModal("headline");
  };

  const saveHeadline = () => {
    const title = form.title.trim();
    if (!title) return;
    const payload = { title, body: form.body, owner: form.owner };
    if (editId) {
      setHeadlines(prev => prev.map(h => (h.id === editId ? { ...h, ...payload } : h)));
    } else {
      setHeadlines(prev => [{ id: uid(), ...payload, archived: false, createdAt: new Date().toISOString() }, ...prev]);
    }
    setModal(null);
  };

  const removeHeadline = id => {
    setHeadlines(prev => prev.filter(h => h.id !== id));
    setModal(null);
  };

  const filtered = headlines.filter(h => {
    if (!activeMemberIds.includes(h.owner)) return false;
    if (Boolean(h.archived) !== archived) return false;
    if (search && !h.title.toLowerCase().includes(search.toLowerCase()) && !(h.body || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return <>
    <div className="phdr">
      <div className="phdr-top">
        <div>
          <h1>Headlines</h1>
          <div className="phdr-desc">Share team updates, announcements, and wins.</div>
        </div>
        <div className="phdr-actions"><button className="btn btn-p" onClick={openAdd}><Ic.Plus /> New headline</button></div>
      </div>
    </div>

    <div className="toolbar">
      <div className="tb-toggle" onClick={() => setArchived(v => !v)}><div className={`tb-toggle-track${archived ? " on" : ""}`}><div className="tb-toggle-dot" /></div>Archived</div>
      <div className="tb-search"><Ic.Search /><input placeholder="Search headlines..." value={search} onChange={e => setSearch(e.target.value)} /></div>
    </div>

    <div className="content"><div className="content-inner">
      <div className="sec">
        <div className="sec-hdr"><h2>Headlines<span className="count">{filtered.length}</span></h2></div>
        {filtered.length === 0 ? <div className="empty"><EmptySVG.headlines /><h3>No headlines</h3><p>Create a headline to broadcast important updates.</p></div> : <div style={{ padding: "8px 16px 12px" }}>
          {filtered.map(h => {
            const m = team.find(x => x.id === h.owner) || team[1];
            return <div key={h.id} style={{ border: "1px solid var(--brd)", borderRadius: 10, padding: 12, marginBottom: 10, background: "var(--white)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{new Date(h.createdAt || Date.now()).toLocaleDateString()}</div>
                </div>
                <Av m={m} size={24} />
              </div>
              {!!h.body && <div style={{ marginTop: 8, fontSize: 13, color: "var(--t2)", whiteSpace: "pre-wrap" }}>{h.body}</div>}
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={() => openEdit(h)}>Edit</button>
                <button className="btn-ghost" onClick={() => setHeadlines(prev => prev.map(x => (x.id === h.id ? { ...x, archived: !x.archived } : x)))}>{h.archived ? "Unarchive" : "Archive"}</button>
              </div>
            </div>;
          })}
        </div>}
      </div>
    </div></div>

    {modal === "headline" && <Modal title={editId ? "Edit headline" : "Create headline"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus /></div>
        <div className="field"><label>Author</label><select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>{team.filter(m => m.id !== "2").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div className="field" style={{ marginBottom: 0 }}><label>Body</label><textarea rows={6} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
      </div>
      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <div>{editId && <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => removeHeadline(editId)}><Ic.Trash /> Delete</button>}</div>
        <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-p" onClick={saveHeadline}>{editId ? "Save" : "Create"}</button></div>
      </div>
    </Modal>}
  </>;
}

function VisionPage({ vision, setVision }) {
  const purposeFields = [
    ["coreValues", "Core Values"],
    ["purposePassion", "Core Focus"],
    ["niche", "Niche"],
    ["tenYearTarget", "10-Year Target"],
    ["marketTarget", "Marketing Strategy"],
    ["threeUniques", "3 Uniques"],
    ["provenProcess", "Proven Process"],
    ["guarantee", "Guarantee"]
  ];
  const tractionFields = [
    ["threeYearRevenue", "3-Year Revenue"],
    ["threeYearProfit", "3-Year Profit"],
    ["threeYearLooks", "3-Year Picture"],
    ["oneYearRevenue", "1-Year Revenue"],
    ["oneYearProfit", "1-Year Profit"],
    ["oneYearGoals", "1-Year Goals"]
  ];

  const setField = (k, v) => setVision(prev => ({ ...prev, [k]: v }));

  return <>
    <div className="phdr"><div className="phdr-top"><div><h1>Vision / V/TO</h1><div className="phdr-desc">Capture where the business is going and how it gets there.</div></div></div></div>
    <div className="content"><div className="content-inner">
      <div className="vto-grid">
        <div className="vto-box">
          <div className="sec-hdr"><h2>Vision</h2></div>
          {purposeFields.map(([key, label]) => <div className="vto-field" key={key}><label style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>{label}</label><textarea value={vision[key] || ""} onChange={e => setField(key, e.target.value)} placeholder={`Add ${label.toLowerCase()}...`} /></div>)}
        </div>
        <div className="vto-box">
          <div className="sec-hdr"><h2>Traction</h2></div>
          {tractionFields.map(([key, label]) => <div className="vto-field" key={key}><label style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>{label}</label><textarea value={vision[key] || ""} onChange={e => setField(key, e.target.value)} placeholder={`Add ${label.toLowerCase()}...`} /></div>)}
        </div>
      </div>
    </div></div>
  </>;
}

function AccountabilityChartPage({ seats, setSeats, team, vision, peopleAnalyzer, setPeopleAnalyzer }) {
  const [tab, setTab] = useState("chart");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", responsibilities: "", memberId: "", parentId: null });
  const [quarter, setQuarter] = useState(currentQuarterLabel());
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const members = team.filter(m => m.id !== "2");

  const openAddSeat = (parentId = null) => {
    setEditId(null);
    setForm({ title: "", responsibilities: "", memberId: "", parentId });
    setModal("seat");
  };

  const openEditSeat = seat => {
    setEditId(seat.id);
    setForm({
      title: seat.title || "",
      responsibilities: (seat.responsibilities || []).join("\n"),
      memberId: seat.memberId || "",
      parentId: seat.parentId || null
    });
    setModal("seat");
  };

  const saveSeat = () => {
    const title = form.title.trim();
    if (!title) return;
    const payload = { title, responsibilities: parseLines(form.responsibilities), memberId: form.memberId || null, parentId: form.parentId || null };
    if (editId) {
      setSeats(prev => prev.map(s => (s.id === editId ? { ...s, ...payload } : s)));
    } else {
      setSeats(prev => [...prev, { id: uid(), ...payload }]);
    }
    setModal(null);
  };

  const removeSeat = id => {
    setSeats(prev => {
      const seat = prev.find(s => s.id === id);
      const reparented = prev.map(s => (s.parentId === id ? { ...s, parentId: seat?.parentId || null } : s));
      return reparented.filter(s => s.id !== id);
    });
    setModal(null);
  };

  const childrenOf = parentId => seats.filter(s => s.parentId === parentId);
  const topSeats = childrenOf(null);

  const SeatNode = ({ seat }) => {
    const m = team.find(x => x.id === seat.memberId);
    const kids = childrenOf(seat.id);
    return <div className="acc-branch">
      <div className="seat-card">
        <div className="seat-title">{seat.title}</div>
        <div className="seat-person">{m ? <><Av m={m} size={18} />{m.name}</> : <span style={{ color: "var(--t3)" }}>Unassigned</span>}</div>
        {!!(seat.responsibilities || []).length && <ul className="seat-resp">{seat.responsibilities.map((r, i) => <li key={i}>{r}</li>)}</ul>}
        <div className="seat-actions">
          <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openEditSeat(seat)}>Edit</button>
          <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openAddSeat(seat.id)}>+ Report</button>
        </div>
      </div>
      {kids.length > 0 && <div className="acc-children">{kids.map(k => <SeatNode key={k.id} seat={k} />)}</div>}
    </div>;
  };

  const coreValues = parseLines(vision.coreValues);
  const quarterData = peopleAnalyzer[quarter] || {};
  const getEntry = memberId => quarterData[memberId] || { gwc: {}, values: {}, notes: "" };

  const updateEntry = (memberId, updater) => {
    setPeopleAnalyzer(prev => {
      const qData = prev[quarter] || {};
      const cur = qData[memberId] || { gwc: {}, values: {}, notes: "" };
      return { ...prev, [quarter]: { ...qData, [memberId]: updater(cur) } };
    });
  };

  const toggleGwc = (memberId, key) => updateEntry(memberId, cur => ({ ...cur, gwc: { ...cur.gwc, [key]: !cur.gwc[key] } }));

  const cycleRating = (memberId, value) => updateEntry(memberId, cur => {
    const order = ["", "+", "+/-", "-"];
    const idx = order.indexOf(cur.values[value] || "");
    return { ...cur, values: { ...cur.values, [value]: order[(idx + 1) % order.length] } };
  });

  const setNotes = (memberId, text) => updateEntry(memberId, cur => ({ ...cur, notes: text }));

  return <>
    <div className="phdr">
      <div className="phdr-top">
        <div>
          <h1>Accountability Chart</h1>
          <div className="phdr-desc">Define seats, roles, and reporting lines — and run quarterly People Analyzer conversations.</div>
        </div>
        {tab === "chart" && <div className="phdr-actions"><button className="btn btn-p" onClick={() => openAddSeat(null)}><Ic.Plus /> Add seat</button></div>}
      </div>
      <div className="tabs">
        <div className={`tab${tab === "chart" ? " on" : ""}`} onClick={() => setTab("chart")}>Chart</div>
        <div className={`tab${tab === "analyzer" ? " on" : ""}`} onClick={() => setTab("analyzer")}>People Analyzer</div>
      </div>
    </div>

    {tab === "chart" ? <div className="content"><div className="content-inner">
      <div className="sec" style={{ overflow: "visible" }}>
        <div className="sec-hdr"><h2>Seats<span className="count">{seats.length}</span></h2></div>
        {topSeats.length === 0 ? <div className="empty"><h3>No seats defined</h3><p>Add your first seat to start building the chart.</p></div> : <div className="acc-wrap"><div className="acc-row">{topSeats.map(s => <SeatNode key={s.id} seat={s} />)}</div></div>}
      </div>
    </div></div> : <div className="content"><div className="content-inner" style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px, 320px)", gap: 16 }}>
      <div className="sec" style={{ marginBottom: 0 }}>
        <div className="sec-hdr">
          <h2>People Analyzer</h2>
          <input value={quarter} onChange={e => setQuarter(e.target.value)} style={{ width: 110, padding: "5px 10px", border: "1px solid var(--brd)", borderRadius: 8, fontSize: 12, fontFamily: "inherit" }} />
        </div>
        {coreValues.length === 0 ? <div className="empty"><p>Add core values on the Vision page (one per line) to enable People Analyzer ratings.</p></div> : <div className="pa-grid">
          <table className="pa-tbl">
            <thead><tr><th style={{ textAlign: "left" }}>Name</th><th>GWC</th>{coreValues.map(v => <th key={v}>{v}</th>)}</tr></thead>
            <tbody>
              {members.map(m => {
                const entry = getEntry(m.id);
                const active = selectedMemberId === m.id;
                return <tr key={m.id} className={active ? "on" : ""}>
                  <td className="pa-name" onClick={() => setSelectedMemberId(m.id)}>{m.name}</td>
                  <td><div className="pa-gwc">
                    {["get", "want", "capacity"].map(k => <div key={k} className={`pa-gwc-dot${entry.gwc[k] ? " on" : ""}`} title={k} onClick={() => toggleGwc(m.id, k)}>{k[0].toUpperCase()}</div>)}
                  </div></td>
                  {coreValues.map(v => <td key={v}><button className="pa-rating" onClick={() => cycleRating(m.id, v)}>{entry.values[v] || "–"}</button></td>)}
                </tr>;
              })}
            </tbody>
          </table>
        </div>}
      </div>

      <div className="sec" style={{ marginBottom: 0 }}>
        <div className="sec-hdr"><h2>Notes</h2></div>
        {!selectedMemberId ? <div className="empty" style={{ padding: "30px 16px" }}><p>Select a person to add quarterly conversation notes.</p></div> : <div style={{ padding: 16 }}>
          <textarea
            value={getEntry(selectedMemberId).notes || ""}
            onChange={e => setNotes(selectedMemberId, e.target.value)}
            placeholder="Document the quarterly conversation..."
            style={{ width: "100%", minHeight: 220, border: "1px solid var(--brd)", borderRadius: 8, padding: 10, fontFamily: "inherit", fontSize: 13, resize: "vertical" }}
          />
        </div>}
      </div>
    </div></div>}

    {modal === "seat" && <Modal title={editId ? "Edit seat" : "Add seat"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field"><label>Seat title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Sales Leader" autoFocus /></div>
        <div className="field"><label>Assigned person</label><select value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}><option value="">Unassigned</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div className="field" style={{ marginBottom: 0 }}><label>Responsibilities (one per line)</label><textarea rows={5} value={form.responsibilities} onChange={e => setForm({ ...form, responsibilities: e.target.value })} placeholder={"Owns X\nDrives Y\nManages Z"} /></div>
      </div>
      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <div>{editId && <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => removeSeat(editId)}><Ic.Trash /> Delete</button>}</div>
        <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-p" onClick={saveSeat}>{editId ? "Save" : "Create"}</button></div>
      </div>
    </Modal>}
  </>;
}

function TeamPage({ team, setTeam, teams, setTeams }) {
  const [modal, setModal] = useState(null);
  const [editMemberId, setEditMemberId] = useState(null);
  const [memberForm, setMemberForm] = useState({ name: "", role: "", color: "#4A90D9" });
  const [teamForm, setTeamForm] = useState({ name: "", memberIds: [] });

  const openAddMember = () => {
    setEditMemberId(null);
    setMemberForm({ name: "", role: "", color: "#4A90D9" });
    setModal("member");
  };
  const openEditMember = m => {
    setEditMemberId(m.id);
    setMemberForm({ name: m.name || "", role: m.role || "", color: m.color || "#4A90D9" });
    setModal("member");
  };

  const saveMember = () => {
    const name = memberForm.name.trim();
    if (!name) return;
    if (editMemberId) {
      setTeam(prev => prev.map(m => (m.id === editMemberId ? { ...m, ...memberForm, name } : m)));
    } else {
      setTeam(prev => [...prev, { id: uid(), ...memberForm, name }]);
    }
    setModal(null);
  };

  const removeMember = id => {
    if (id === "1" || id === "2") return;
    setTeam(prev => prev.filter(m => m.id !== id));
    setTeams(prev => prev.map(t => ({ ...t, memberIds: t.memberIds.filter(mid => mid !== id) })));
    setModal(null);
  };

  const openAddTeam = () => {
    setTeamForm({ name: "", memberIds: [] });
    setModal("team");
  };
  const saveTeam = () => {
    const name = teamForm.name.trim();
    if (!name) return;
    setTeams(prev => [...prev, { id: uid(), name, memberIds: teamForm.memberIds }]);
    setModal(null);
  };

  return <>
    <div className="phdr">
      <div className="phdr-top"><div><h1>Team</h1><div className="phdr-desc">Manage people, roles, and team assignments.</div></div><div className="phdr-actions"><button className="btn" onClick={openAddTeam}><Ic.Plus /> Add Team</button><button className="btn btn-p" onClick={openAddMember}><Ic.Plus /> Add Person</button></div></div>
    </div>
    <div className="content"><div className="content-inner" style={{ maxWidth: 960 }}>
      <div className="team-card">
        <div className="team-card-hdr"><h3>People</h3><span style={{ fontSize: 12, color: "var(--t3)" }}>{team.length}</span></div>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th style={{ width: 90 }}>Color</th><th style={{ width: 80 }}></th></tr></thead>
          <tbody>
            {team.filter(m => m.id !== "2").map(m => <tr key={m.id}><td>{m.name}</td><td style={{ color: "var(--t2)" }}>{m.role || "-"}</td><td><div style={{ width: 16, height: 16, borderRadius: 16, background: m.color, border: "1px solid var(--brd)" }} /></td><td><button className="btn-ghost" onClick={() => openEditMember(m)}>Edit</button></td></tr>)}
          </tbody>
        </table>
      </div>

      {teams.map(t => {
        const members = team.filter(m => t.memberIds.includes(m.id));
        return <div className="team-card" key={t.id}>
          <div className="team-card-hdr"><h3>{t.name}</h3><span style={{ fontSize: 12, color: "var(--t3)" }}>{members.length} members</span></div>
          <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {members.length === 0 ? <span style={{ color: "var(--t3)", fontSize: 12 }}>No members assigned.</span> : members.map(m => <div key={m.id} className="team-member-chip"><span style={{ width: 8, height: 8, borderRadius: 8, background: m.color }} />{m.name}</div>)}
          </div>
          <div style={{ padding: "0 16px 14px" }}><button className="btn btn-sm" onClick={() => { setTeamForm({ name: t.name, memberIds: t.memberIds }); setModal(`assign-${t.id}`); }}>Assign Members</button></div>
        </div>;
      })}
    </div></div>

    {modal === "member" && <Modal title={editMemberId ? "Edit person" : "Add person"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field"><label>Name</label><input value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} autoFocus /></div>
        <div className="field"><label>Role</label><input value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })} /></div>
        <div className="field" style={{ marginBottom: 0 }}><label>Color</label><input type="color" value={memberForm.color} onChange={e => setMemberForm({ ...memberForm, color: e.target.value })} /></div>
      </div>
      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <div>{editMemberId && editMemberId !== "1" && <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => removeMember(editMemberId)}><Ic.Trash /> Delete</button>}</div>
        <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-p" onClick={saveMember}>{editMemberId ? "Save" : "Create"}</button></div>
      </div>
    </Modal>}

    {modal === "team" && <Modal title="Add team" onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field" style={{ marginBottom: 0 }}><label>Team name</label><input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} autoFocus /></div>
      </div>
      <div className="modal-foot"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-p" onClick={saveTeam}>Create</button></div>
    </Modal>}

    {teams.map(t => (
      modal === `assign-${t.id}` && <Modal key={t.id} title={`Assign Members: ${t.name}`} onClose={() => setModal(null)}>
        <div className="modal-body">
          {team.filter(m => m.id !== "2").map(m => {
            const on = teamForm.memberIds.includes(m.id);
            return <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}><input type="checkbox" checked={on} onChange={() => setTeamForm(prev => ({ ...prev, memberIds: on ? prev.memberIds.filter(x => x !== m.id) : [...prev.memberIds, m.id] }))} /><span>{m.name}</span></label>;
          })}
        </div>
        <div className="modal-foot"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-p" onClick={() => { setTeams(prev => prev.map(x => (x.id === t.id ? { ...x, memberIds: teamForm.memberIds } : x))); setModal(null); }}>Save</button></div>
      </Modal>
    ))}
  </>;
}

function ProfilePage({ profile, setProfile, onExportBackup, onImportBackup }) {
  const initials = `${(profile.firstName || "").slice(0, 1)}${(profile.lastName || "").slice(0, 1)}`.toUpperCase() || "U";

  const setField = (k, v) => setProfile(prev => ({ ...prev, [k]: v }));
  const onAvatar = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setField("avatar", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return <>
    <div className="phdr"><div className="phdr-top"><div><h1>Profile</h1><div className="phdr-desc">Manage your personal details and bio.</div></div></div></div>
    <div className="content"><div className="content-inner">
      <div className="profile-layout">
        <div className="profile-card">
          <div className="profile-avatar-wrap">
            {profile.avatar ? <img className="profile-avatar-img" src={profile.avatar} alt="avatar" /> : <div className="profile-avatar-placeholder">{initials}</div>}
            <label className="profile-upload-btn">Upload photo<input type="file" accept="image/*" onChange={onAvatar} style={{ display: "none" }} /></label>
          </div>
          <div style={{ padding: "14px 16px", fontSize: 12, color: "var(--t2)" }}>Use a square image for best results.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="profile-card">
            <div className="profile-section-title">Identity</div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 1 }}><label>First name</label><input value={profile.firstName || ""} onChange={e => setField("firstName", e.target.value)} /></div>
                <div className="field" style={{ flex: 1 }}><label>Last name</label><input value={profile.lastName || ""} onChange={e => setField("lastName", e.target.value)} /></div>
              </div>
              <div className="field"><label>Title</label><input value={profile.title || ""} onChange={e => setField("title", e.target.value)} /></div>
              <div className="field" style={{ marginBottom: 0 }}><label>Bio</label><textarea rows={6} value={profile.bio || ""} onChange={e => setField("bio", e.target.value)} placeholder="Share your background and responsibilities" /></div>
            </div>
            <div className="profile-section-title">Address</div>
            <div style={{ padding: "16px 20px" }}>
              <div className="field"><label>Street</label><input value={profile.street || ""} onChange={e => setField("street", e.target.value)} /></div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 2 }}><label>City</label><input value={profile.city || ""} onChange={e => setField("city", e.target.value)} /></div>
                <div className="field" style={{ flex: 1 }}><label>State</label><input value={profile.state || ""} onChange={e => setField("state", e.target.value)} /></div>
                <div className="field" style={{ flex: 1 }}><label>Zip</label><input value={profile.zip || ""} onChange={e => setField("zip", e.target.value)} /></div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}><label>Country</label><input value={profile.country || ""} onChange={e => setField("country", e.target.value)} /></div>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-section-title">Data Backup</div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 12 }}>Export a full backup of your data, or restore from a previous backup file. Restoring replaces all data currently stored in this browser.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={onExportBackup}>Export backup (JSON)</button>
                <label className="btn" style={{ cursor: "pointer" }}>
                  Import backup
                  <input type="file" accept="application/json" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) onImportBackup(f); e.target.value = ""; }} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div></div>
  </>;
}

// MOBILE BOTTOM NAV (with "More" overflow for pages beyond the first 5)
function MobileNav({ page, setPage, navMain, navExtra, activeTodos, openIssues }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const mainFive = navMain.slice(0, 5);
  const morePages = [...navMain.slice(5), ...navExtra];
  const moreActive = morePages.some(p => p.id === page);
  return <>
    {moreOpen && <>
      <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setMoreOpen(false)} />
      <div style={{ position: "fixed", bottom: 60, right: 8, zIndex: 99, background: "var(--white)", border: "1px solid var(--brd)", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,.12)", minWidth: 180, overflow: "hidden" }}>
        {morePages.map(n => (
          <div key={n.id} onClick={() => { setPage(n.id); setMoreOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", background: page === n.id ? "var(--blue-l)" : "transparent", color: page === n.id ? "var(--blue)" : "var(--t1)", borderBottom: "1px solid var(--brd)", fontSize: 14, fontWeight: 500 }}>
            {n.icon}<span>{n.label}</span>
          </div>
        ))}
      </div>
    </>}
    <div className="bnav">
      {mainFive.map(n => (
        <div key={n.id} className={`bnav-i${page === n.id ? " on" : ""}`} onClick={() => setPage(n.id)}>
          {n.icon}<span>{n.label}</span>
          {n.id === "todos" && activeTodos > 0 && <span className="bbdg">{activeTodos}</span>}
          {n.id === "issues" && openIssues > 0 && <span className="bbdg">{openIssues}</span>}
        </div>
      ))}
      <div className={`bnav-i${moreActive ? " on" : ""}`} onClick={() => setMoreOpen(v => !v)}>
        <Ic.More /><span>More</span>
      </div>
    </div>
  </>;
}

// MAIN APP
export default function App({ orgName }) {
  const [page, setPage] = useState("dashboard");
  const [todos, setTodos] = useState([]);
  const [scorecard, setScorecard] = useState([]);
  const [scData, setScData] = useState({});
  const [meetings, setMeetings] = useState({});
  const [issues, setIssues] = useState([]);
  const [team, setTeam] = useState(TEAM_DEFAULT);
  const [teams, setTeams] = useState(TEAMS_DEFAULT);
  const [activeTeamId, setActiveTeamId] = useState("all");
  const [rocks, setRocks] = useState([]);
  const [headlines, setHeadlines] = useState([]);
  const [vision, setVision] = useState(VISION_DEFAULT);
  const [seats, setSeats] = useState(SEATS_DEFAULT);
  const [peopleAnalyzer, setPeopleAnalyzer] = useState(PEOPLE_ANALYZER_DEFAULT);
  const [processes, setProcesses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [sbCollapsed, setSbCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profile, setProfile] = useState(PROFILE_DEFAULT);
  const mob = useIsMobile();

  useEffect(() => {
    (async () => {
      const [t, s, sd, m, i, tm, r, h, v, tms, pr, st, pa, pc] = await Promise.all([
        load(STORAGE_KEYS.todos, []),
        load(STORAGE_KEYS.scorecard, SC_DEFAULT),
        load(STORAGE_KEYS.scData, {}),
        load(STORAGE_KEYS.meetings, {}),
        load(STORAGE_KEYS.issues, []),
        load(STORAGE_KEYS.team, TEAM_DEFAULT),
        load(STORAGE_KEYS.rocks, []),
        load(STORAGE_KEYS.headlines, []),
        load(STORAGE_KEYS.vision, VISION_DEFAULT),
        load(STORAGE_KEYS.teams, TEAMS_DEFAULT),
        load(STORAGE_KEYS.profile, PROFILE_DEFAULT),
        load(STORAGE_KEYS.seats, SEATS_DEFAULT),
        load(STORAGE_KEYS.peopleAnalyzer, PEOPLE_ANALYZER_DEFAULT),
        load(STORAGE_KEYS.processes, []),
      ]);
      setTodos(t); setScorecard(s); setScData(sd); setMeetings(m); setIssues(i); setTeam(tm); setRocks(r); setHeadlines(h); setVision(v); setTeams(tms); setProfile(pr); setSeats(st); setPeopleAnalyzer(pa); setProcesses(pc);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) save(STORAGE_KEYS.todos, todos); }, [todos, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.scorecard, scorecard); }, [scorecard, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.scData, scData); }, [scData, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.meetings, meetings); }, [meetings, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.issues, issues); }, [issues, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.team, team); }, [team, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.rocks, rocks); }, [rocks, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.headlines, headlines); }, [headlines, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.vision, vision); }, [vision, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.teams, teams); }, [teams, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.profile, profile); }, [profile, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.seats, seats); }, [seats, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.peopleAnalyzer, peopleAnalyzer); }, [peopleAnalyzer, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.processes, processes); }, [processes, loaded]);

  const exportBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { todos, scorecard, scData, meetings, issues, team, teams, rocks, headlines, vision, profile, seats, peopleAnalyzer, processes }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = file => {
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try {
        const parsed = JSON.parse(String(reader.result));
        data = parsed.data || parsed;
      } catch {
        window.alert("Could not read backup file. Make sure it's a valid export from this app.");
        return;
      }
      if (!window.confirm("This will replace all data currently stored in this browser with the contents of the backup file. Continue?")) return;
      setTodos(data.todos || []);
      setScorecard(data.scorecard || SC_DEFAULT);
      setScData(data.scData || {});
      setMeetings(data.meetings || {});
      setIssues(data.issues || []);
      setTeam(data.team || TEAM_DEFAULT);
      setTeams(data.teams || TEAMS_DEFAULT);
      setRocks(data.rocks || []);
      setHeadlines(data.headlines || []);
      setVision(data.vision || VISION_DEFAULT);
      setProfile(data.profile || PROFILE_DEFAULT);
      setSeats(data.seats || SEATS_DEFAULT);
      setPeopleAnalyzer(data.peopleAnalyzer || PEOPLE_ANALYZER_DEFAULT);
      setProcesses(data.processes || []);
    };
    reader.readAsText(file);
  };

  if (!loaded) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8F9FA", color: "#9CA3AF" }}><style>{CSS}</style>Loading...</div>;

  const activeTeam = teams.find(t => t.id === activeTeamId);
  const activeMemberIds = activeTeamId === "all" ? team.filter(m => m.id !== "2").map(m => m.id) : (activeTeam?.memberIds || []);
  const activeTodos = todos.filter(t => !t.done && (activeTeamId === "all" || activeMemberIds.includes(t.owner))).length;
  const openIssues = issues.filter(i => !i.done && (activeTeamId === "all" || activeMemberIds.includes(i.owner))).length;
  const navMain = [
    { id: "dashboard", label: "My 90", icon: <Ic.My90 /> },
    { id: "scorecard", label: "Scorecard", icon: <Ic.Scorecard /> },
    { id: "rocks", label: "Rocks", icon: <Ic.Rocks /> },
    { id: "todos", label: "To-Dos", icon: <Ic.Todos /> },
    { id: "issues", label: "Issues", icon: <Ic.Issues /> },
    { id: "processes", label: "Processes", icon: <Ic.Process /> },
    { id: "meetings", label: "Meetings", icon: <Ic.Meetings /> },
    { id: "headlines", label: "Headlines", icon: <Ic.Headlines /> },
  ];
  const navExtra = [{ id: "vision", label: "Vision / V/TO", icon: <Ic.Vision /> }, { id: "accountability", label: "Accountability Chart", icon: <Ic.OrgChart /> }, { id: "team", label: "Team", icon: <Ic.Team /> }];
  const sbW = sbCollapsed ? 56 : 228;

  return <div className="shell">
    <style>{CSS}</style>
    {!mob && <nav className="sb" style={{ width: sbW, minWidth: sbW }}>
      <div className="sb-head">
        {!sbCollapsed && <><div className="sb-logo">{(orgName || "?")[0].toUpperCase()}</div><div className="sb-co">{orgName}</div></> }
        {sbCollapsed && <div className="sb-logo" style={{ margin: "0 auto" }}>{(orgName || "?")[0].toUpperCase()}</div>}
        {!sbCollapsed && <button className="sb-toggle-btn" onClick={() => setSbCollapsed(true)}><Ic.Chevron dir="left" /></button>}
      </div>
      {!sbCollapsed && <div className="sb-team-picker"><select value={activeTeamId} onChange={e => setActiveTeamId(e.target.value)}><option value="all">All Teams</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><span className="sb-team-picker-icon"><Ic.Down /></span></div>}
      <div className="sb-nav">
        {sbCollapsed && (<div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><button className="sb-toggle-btn" onClick={() => setSbCollapsed(false)}><Ic.Chevron dir="right" /></button></div>)}
        {navMain.map(n => (<div key={n.id} className={`sb-item${page === n.id ? " on" : ""}`} onClick={() => setPage(n.id)} style={sbCollapsed ? { justifyContent: "center", padding: "8px 0" } : {}}>{n.icon}{!sbCollapsed && <span>{n.label}</span>}{!sbCollapsed && n.id === "todos" && activeTodos > 0 && <span className="sb-badge">{activeTodos}</span>}{!sbCollapsed && n.id === "issues" && openIssues > 0 && <span className="sb-badge">{openIssues}</span>}</div>))}
        <div className="sb-sep" />
        {navExtra.map(n => (<div key={n.id} className={`sb-item${page === n.id ? " on" : ""}`} onClick={() => setPage(n.id)} style={sbCollapsed ? { justifyContent: "center", padding: "8px 0" } : {}}>{n.icon}{!sbCollapsed && <span>{n.label}</span>}</div>))}
      </div>
    </nav>}
    <div className="main">
      <div style={{ height: 44, background: "var(--white)", borderBottom: "1px solid var(--brd)", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 20px", gap: 8, flexShrink: 0 }}>
        <button onClick={() => setNotifOpen(!notifOpen)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: notifOpen ? "var(--blue)" : "var(--t2)", display: "flex", alignItems: "center", transition: "all .12s" }}>
          <Ic.Bell />{activeTodos + openIssues > 0 && <span style={{ position: "absolute", top: 1, right: 1, background: "var(--red)", color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 700, padding: "1px 4px", minWidth: 14, textAlign: "center", lineHeight: "14px" }}>{activeTodos + openIssues}</span>}
        </button>
        <button onClick={() => setPage("profile")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 10px 4px 6px", border: "1px solid var(--brd)", borderRadius: 20, background: page === "profile" ? "var(--blue-l)" : "var(--white)", cursor: "pointer", transition: "all .12s", color: page === "profile" ? "var(--blue)" : "var(--t2)" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#4A90D9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>{`${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase()}</div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{profile.firstName}</span>
        </button>
      </div>
      {page === "dashboard" && <DashboardPage {...{ todos, setTodos, rocks, issues, scorecard, scData, team, activeMemberIds, setPage }} />}
      {page === "todos" && <TodosPage {...{ todos, setTodos, team, activeMemberIds, rocks }} />}
      {page === "scorecard" && <ScorecardPage {...{ scorecard, setScorecard, scData, setScData, team, activeMemberIds, mob }} />}
      {page === "rocks" && <RocksPage {...{ rocks, setRocks, team, activeMemberIds, issues, todos }} />}
      {page === "issues" && <IssuesPage {...{ issues, setIssues, team, activeMemberIds, rocks, todos, setTodos }} />}
      {page === "processes" && <ProcessesPage {...{ processes, setProcesses, team, activeMemberIds }} />}
      {page === "meetings" && <MeetingsPage {...{ meetings, setMeetings, issues, todos, team, activeMemberIds }} />}
      {page === "headlines" && <HeadlinesPage {...{ headlines, setHeadlines, team, activeMemberIds }} />}
      {page === "vision" && <VisionPage {...{ vision, setVision }} />}
      {page === "accountability" && <AccountabilityChartPage {...{ seats, setSeats, team, vision, peopleAnalyzer, setPeopleAnalyzer }} />}
      {page === "team" && <TeamPage {...{ team, setTeam, teams, setTeams }} />}
      {page === "profile" && <ProfilePage {...{ profile, setProfile, onExportBackup: exportBackup, onImportBackup: importBackup }} />}
    </div>
    {mob && <MobileNav page={page} setPage={setPage} navMain={navMain} navExtra={navExtra} activeTodos={activeTodos} openIssues={openIssues} />}
    {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} todos={todos} rocks={rocks} issues={issues} scorecard={scorecard.filter(m => activeMemberIds.includes(m.owner))} scData={scData} />}
  </div>;
}