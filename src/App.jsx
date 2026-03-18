import { useState, useEffect, useRef } from "react";
import { STORAGE_KEYS, PROFILE_DEFAULT, TEAM_DEFAULT, TEAMS_DEFAULT, SC_DEFAULT, VISION_DEFAULT, CSS } from "./constants";
import { uid, getWeekRange, getPeriods, getRollupVal, scaleGoal, load, save, fmtDate, isOverdue } from "./utils/helpers";
import { useIsMobile } from "./hooks/useIsMobile";
import { Ic } from "./components/Icons";
import { Av, CircleCk, Modal, EmptySVG, GaugeChart, DonutChart, MiniBarChart } from "./components/Shared";
import { NotificationsPanel } from "./components/NotificationsPanel";

// DASHBOARD PAGE
function DashboardPage({ todos, setTodos, rocks, issues, scorecard, scData, team, activeMemberIds, setPage }) {
  const week = getWeekRange(0);
  const weeks52 = Array.from({ length: 52 }, (_, i) => getWeekRange(-i));
  const me = team.find(m => m.id === "1") || team[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const teamTodos = todos.filter(t => !t.done && activeMemberIds.includes(t.owner));
  const activeRocks = rocks.filter(r => activeMemberIds.includes(r.owner) && r.status !== "completed");
  const onTrack = activeRocks.filter(r => r.status === "on-track").length;
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
            <div><div style={{ fontSize: 12, color: "var(--t2)" }}>This week's hits</div><div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{week.label}</div></div>
          </div>
        </W>
        <W title="Rocks" count={activeRocks.length} action={() => setPage("rocks")} minH={120}>
          {activeRocks.length === 0 ? <div className="dash-empty"><EmptySVG.rocks /><p>No active rocks</p></div> : <div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {activeRocks.slice(0, 5).map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--brd)" }}>
                    <td style={{ padding: "8px 0" }}>{r.status === "on-track" ? <Ic.OnTrack /> : <Ic.OffTrack />}</td>
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
function TodosPage({ todos, setTodos, team, activeMemberIds }) {
  const [tab, setTab] = useState("team");
  const [search, setSearch] = useState("");
  const [archive, setArchive] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: "", owner: "1", dueDate: "" });

  const openAdd = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setForm({ title: "", owner: "1", dueDate: d.toISOString().split("T")[0] });
    setModal("add");
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
        {filtered.length === 0 ? <div className="empty"><EmptySVG.todos /><h3>{archive ? "No archived to-dos" : "All caught up!"}</h3><p>Create a to-do to get started.</p></div> : <table className="tbl"><thead><tr><th style={{ width: 42 }}></th><th>Title</th><th style={{ width: 100 }}>Due By</th><th style={{ width: 70 }}>Owner</th></tr></thead><tbody>
          {filtered.map(t => {
            const m = team.find(x => x.id === t.owner) || team[1];
            const od = isOverdue(t.dueDate) && !t.done;
            return <tr key={t.id}>
              <td><CircleCk on={t.done} toggle={() => setTodos(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} /></td>
              <td>{t.title}</td>
              <td style={{ color: od ? "var(--red-t)" : "var(--t2)" }}>{od && <Ic.Warn />}{fmtDate(t.dueDate)}</td>
              <td><Av m={m} /></td>
            </tr>;
          })}
        </tbody></table>}
      </div>
    </div></div>
    {modal !== null && <Modal title={modal === "add" ? "Create To-Do" : "Edit To-Do"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" autoFocus /></div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>Owner</label><select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>{team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div className="field" style={{ flex: 1 }}><label>Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn" onClick={() => setModal(null)}>Cancel</button>
        <button className="btn btn-p" onClick={() => { if (form.title.trim()) { setTodos(p => [...p, { id: uid(), ...form, done: false, createdAt: new Date().toISOString() }]); setModal(null); } }}>Create</button>
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

// PLACEHOLDER PAGES
function RocksPage({ rocks, setRocks, team, activeMemberIds }) {
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", owner: "1", dueDate: "", status: "on-track", quarter: "" });

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
    setForm({ title: "", owner: "1", dueDate: defaultDueDate(), status: "on-track", quarter: qLabel });
    setModal("rock");
  };

  const openEdit = rock => {
    setEditId(rock.id);
    setForm({
      title: rock.title || "",
      owner: rock.owner || "1",
      dueDate: rock.dueDate || defaultDueDate(),
      status: rock.status || "on-track",
      quarter: rock.quarter || qLabel
    });
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
      quarter: form.quarter || qLabel
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

  const filtered = rocks
    .filter(r => {
      if (!activeMemberIds.includes(r.owner)) return false;
      if (tab === "active" && r.status === "completed") return false;
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
                return <tr key={rock.id}>
                  <td>{rock.title}</td>
                  <td style={{ color: "var(--t2)" }}>{rock.quarter || "-"}</td>
                  <td style={{ color: overdue ? "var(--red-t)" : "var(--t2)" }}>{overdue && <Ic.Warn />}{fmtDate(rock.dueDate)}</td>
                  <td><Av m={m} /></td>
                  <td>
                    <select className="tb-filter" style={{ borderRadius: 8, padding: "5px 10px" }} value={rock.status || "on-track"} onChange={e => setRockStatus(rock.id, e.target.value)}>
                      <option value="on-track">On Track</option>
                      <option value="off-track">Off Track</option>
                      <option value="completed">Completed</option>
                    </select>
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
            </select>
          </div>
        </div>
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

function IssuesPage({ issues, setIssues, team, activeMemberIds }) {
  const [tab, setTab] = useState("short-term");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ title: "", owner: "1", type: "short-term", notes: "" });

  const openAdd = () => {
    setEditId(null);
    setForm({ title: "", owner: "1", type: tab, notes: "" });
    setModal("issue");
  };

  const openEdit = issue => {
    setEditId(issue.id);
    setForm({
      title: issue.title || "",
      owner: issue.owner || "1",
      type: issue.type || "short-term",
      notes: issue.notes || ""
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
      done: false
    };

    if (editId) {
      setIssues(prev => prev.map(i => (i.id === editId ? { ...i, ...payload } : i)));
    } else {
      setIssues(prev => [...prev, { id: uid(), ...payload, createdAt: new Date().toISOString() }]);
    }
    setModal(null);
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

          <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
            <span className={`status ${selected.done ? "status-on" : "status-off"}`}>{selected.done ? "Solved" : "Open"}</span>
            <span style={{ fontSize: 12, color: "var(--t2)" }}>{(selected.type || "short-term") === "short-term" ? "Short-Term" : "Long-Term"}</span>
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

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={() => setSolved(selected.id, !selected.done)}>{selected.done ? "Reopen" : "Mark solved"}</button>
            <button className="btn" onClick={() => openEdit(selected)}>Edit metadata</button>
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

function MeetingsPage({ meetings, setMeetings, issues, todos, team, activeMemberIds }) {
  const store = meetings && typeof meetings === "object" ? meetings : {};
  const mState = store.current || {
    title: "Weekly Level 10",
    date: new Date().toISOString().slice(0, 10),
    sections: {
      segue: "",
      scorecard: "",
      rocks: "",
      customerEmployee: "",
      todoReview: "",
      ids: ""
    },
    tangents: [],
    timerSeconds: 0
  };

  const [running, setRunning] = useState(false);
  const [tangentText, setTangentText] = useState("");

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
  }, [running, setMeetings]);

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
      return {
        ...base,
        current: {
          title: "Weekly Level 10",
          date: new Date().toISOString().slice(0, 10),
          sections: { segue: "", scorecard: "", rocks: "", customerEmployee: "", todoReview: "", ids: "" },
          tangents: [],
          timerSeconds: 0
        }
      };
    });
  };

  const seconds = mState.timerSeconds || 0;
  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const openIssues = issues.filter(i => !i.done && activeMemberIds.includes(i.owner));
  const openTodos = todos.filter(t => !t.done && activeMemberIds.includes(t.owner));
  const tangents = mState.tangents || [];

  return <>
    <div className="phdr">
      <div className="phdr-top">
        <div>
          <h1>Meetings</h1>
          <div className="phdr-desc">Run your Level 10 meeting with structured sections, timer, IDS notes, and tangents.</div>
        </div>
        <div className="phdr-actions" style={{ gap: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: ".03em", minWidth: 110, textAlign: "right" }}>{hh}:{mm}:{ss}</div>
          <button className="btn" onClick={() => setRunning(r => !r)}>{running ? "Pause" : "Start"}</button>
          <button className="btn" onClick={clearMeeting}>Reset</button>
        </div>
      </div>
    </div>

    <div className="content"><div className="content-inner" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
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
    </div></div>
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

function OrgChartPage({ teams, team }) {
  return <>
    <div className="phdr"><div className="phdr-top"><div><h1>Org Chart</h1><div className="phdr-desc">Visualize roles and accountability by team.</div></div></div></div>
    <div className="content"><div className="content-inner">
      <div className="sec">
        <div className="sec-hdr"><h2>Reporting Structure</h2></div>
        <div className="org-wrap">
          {teams.map(t => {
            const members = team.filter(m => t.memberIds.includes(m.id));
            return <div key={t.id} style={{ width: "100%", marginBottom: 26 }}>
              <div style={{ textAlign: "center", marginBottom: 12, fontSize: 14, fontWeight: 700 }}>{t.name}</div>
              <div className="org-level">
                {members.length === 0 ? <div style={{ color: "var(--t3)", fontSize: 13 }}>No team members assigned</div> : members.map(m => <div key={m.id} className="org-card"><div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div><div style={{ color: "var(--t2)", marginTop: 4, fontSize: 12 }}>{m.role || "No role"}</div></div>)}
              </div>
            </div>;
          })}
        </div>
      </div>
    </div></div>
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

function ProfilePage({ profile, setProfile }) {
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
      </div>
    </div></div>
  </>;
}

// MAIN APP
export default function App() {
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
  const [loaded, setLoaded] = useState(false);
  const [sbCollapsed, setSbCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profile, setProfile] = useState(PROFILE_DEFAULT);
  const mob = useIsMobile();

  useEffect(() => {
    (async () => {
      const [t, s, sd, m, i, tm, r, h, v, tms, pr] = await Promise.all([
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
      ]);
      setTodos(t); setScorecard(s); setScData(sd); setMeetings(m); setIssues(i); setTeam(tm); setRocks(r); setHeadlines(h); setVision(v); setTeams(tms); setProfile(pr);
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
    { id: "meetings", label: "Meetings", icon: <Ic.Meetings /> },
    { id: "headlines", label: "Headlines", icon: <Ic.Headlines /> },
  ];
  const navExtra = [{ id: "vision", label: "Vision / V/TO", icon: <Ic.Vision /> }, { id: "org", label: "Org Chart", icon: <Ic.OrgChart /> }, { id: "team", label: "Team", icon: <Ic.Team /> }];
  const sbW = sbCollapsed ? 56 : 228;

  return <div className="shell">
    <style>{CSS}</style>
    {!mob && <nav className="sb" style={{ width: sbW, minWidth: sbW }}>
      <div className="sb-head">
        {!sbCollapsed && <><div className="sb-logo">T</div><div className="sb-co">TMJ Sleep<small>NW</small></div></> }
        {sbCollapsed && <div className="sb-logo" style={{ margin: "0 auto" }}>T</div>}
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
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#4A90D9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>DL</div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{profile.firstName}</span>
        </button>
      </div>
      {page === "dashboard" && <DashboardPage {...{ todos, setTodos, rocks, issues, scorecard, scData, team, activeMemberIds, setPage }} />}
      {page === "todos" && <TodosPage {...{ todos, setTodos, team, activeMemberIds }} />}
      {page === "scorecard" && <ScorecardPage {...{ scorecard, setScorecard, scData, setScData, team, activeMemberIds, mob }} />}
      {page === "rocks" && <RocksPage {...{ rocks, setRocks, team, activeMemberIds }} />}
      {page === "issues" && <IssuesPage {...{ issues, setIssues, team, activeMemberIds }} />}
      {page === "meetings" && <MeetingsPage {...{ meetings, setMeetings, issues, todos, team, activeMemberIds }} />}
      {page === "headlines" && <HeadlinesPage {...{ headlines, setHeadlines, team, activeMemberIds }} />}
      {page === "vision" && <VisionPage {...{ vision, setVision }} />}
      {page === "org" && <OrgChartPage {...{ teams, team }} />}
      {page === "team" && <TeamPage {...{ team, setTeam, teams, setTeams }} />}
      {page === "profile" && <ProfilePage {...{ profile, setProfile }} />}
    </div>
    {mob && <div className="bnav">
      {navMain.slice(0, 5).map(n => (<div key={n.id} className={`bnav-i${page === n.id ? " on" : ""}`} onClick={() => setPage(n.id)}>{n.icon}<span>{n.label}</span>{n.id === "todos" && activeTodos > 0 && <span className="bbdg">{activeTodos}</span>}{n.id === "issues" && openIssues > 0 && <span className="bbdg">{openIssues}</span>}</div>))}
    </div>}
    {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} todos={todos} rocks={rocks} issues={issues} scorecard={scorecard.filter(m => activeMemberIds.includes(m.owner))} scData={scData} />}
  </div>;
}