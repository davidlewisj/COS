import { useState, useEffect, useRef } from "react";
import { STORAGE_KEYS, PROFILE_DEFAULT, TEAM_DEFAULT, TEAMS_DEFAULT, SC_DEFAULT, VISION_DEFAULT, CSS } from "./constants";
import { uid, getWeekRange, getPeriods, getRollupVal, scaleGoal, load, save, fmtDate, isOverdue } from "./utils/helpers";
import { useIsMobile } from "./hooks/useIsMobile";
import { Ic } from "./components/Icons";
import { Av, CircleCk, Modal, EmptySVG, DonutChart, MiniBarChart } from "./components/Shared";
import { NotificationsPanel } from "./components/NotificationsPanel";

// DASHBOARD PAGE
function DashboardPage({ todos, setTodos, rocks, issues, scorecard, scData, team, activeMemberIds, setPage }) {
  const week = getWeekRange(0);
  const weeks52 = Array.from({ length: 52 }, (_, i) => getWeekRange(-i));
  const me = team.find(m => activeMemberIds.includes(m.id) && m.name !== "Unassigned") || team[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const teamTodos = todos.filter(t => !t.done && activeMemberIds.includes(t.owner));
  const activeRocks = rocks.filter(r => activeMemberIds.includes(r.owner) && r.status !== "completed" && r.status !== "cancelled");
  const activeScorecard = scorecard.filter(m => activeMemberIds.includes(m.owner));
  const hits = activeScorecard.filter(m => { const v = parseFloat(scData[week.key]?.[m.id]); return !isNaN(v) && (m.op === ">=" ? v >= m.goal : v <= m.goal); }).length;

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
            {activeRocks.slice(0, 5).map(r => (
              <div key={r.id} className="dash-irow" style={{ borderBottom: "1px solid var(--brd)", padding: "7px 0" }}>
                <RockStatusBadge rock={r} />
                <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                {r.dueDate && <span style={{ fontSize: 11, color: "var(--t2)", whiteSpace: "nowrap" }}>{fmtDate(r.dueDate)}</span>}
              </div>
            ))}
          </div>}
        </W>
        {(() => {
          const overdueTodos = teamTodos.filter(t => isOverdue(t.dueDate));
          const doneTodos = todos.filter(t => t.done && activeMemberIds.includes(t.owner));
          const total = teamTodos.length + doneTodos.length;
          return <W title="To-Do Summary" minH={120}>
            <div style={{ display: "flex", gap: 20, alignItems: "center", padding: "8px 0 12px" }}>
              <DonutChart hits={doneTodos.length} total={Math.max(total, 1)} />
              <div>
                <div style={{ fontSize: 11, color: "var(--t2)" }}>Open / Total</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{teamTodos.length}<span style={{ fontSize: 14, color: "var(--t2)", fontWeight: 400 }}> / {total}</span></div>
                {overdueTodos.length > 0 && <div style={{ fontSize: 11, color: "var(--red-t)", fontWeight: 600, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><Ic.Warn />{overdueTodos.length} overdue</div>}
              </div>
            </div>
          </W>;
        })()}
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
function TodosPage({ todos, setTodos, team, activeMemberIds, myId }) {
  const ownerableTeam = team.filter(m => m.name !== "Unassigned");
  const defaultOwner = ownerableTeam[0]?.id || "";
  const [tab, setTab] = useState("team");
  const [search, setSearch] = useState("");
  const [archive, setArchive] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", owner: defaultOwner, dueDate: "", notes: "" });

  // Keyboard shortcut: N = new to-do
  useEffect(() => {
    const handler = e => {
      if (e.key === "n" && !["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName) && !modal) {
        e.preventDefault(); openAdd();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal]); // eslint-disable-line

  const openAdd = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setEditId(null);
    setForm({ title: "", owner: myId || defaultOwner, dueDate: d.toISOString().split("T")[0], notes: "" });
    setModal("todo");
  };

  const openEdit = todo => {
    setEditId(todo.id);
    setForm({ title: todo.title || "", owner: todo.owner || defaultOwner, dueDate: todo.dueDate || "", notes: todo.notes || "" });
    setModal("todo");
  };

  const saveTodo = () => {
    const title = form.title.trim();
    if (!title) return;
    if (editId) {
      setTodos(p => p.map(x => x.id === editId ? { ...x, title, owner: form.owner, dueDate: form.dueDate, notes: form.notes } : x));
    } else {
      setTodos(p => [...p, { id: uid(), title, owner: form.owner, dueDate: form.dueDate, notes: form.notes, done: false, createdAt: new Date().toISOString() }]);
    }
    setModal(null);
  };

  const removeTodo = id => { setTodos(p => p.filter(x => x.id !== id)); setModal(null); };

  const filtered = todos.filter(t => {
    if (archive ? !t.done : t.done) return false;
    if (!activeMemberIds.includes(t.owner)) return false;
    if (tab === "private" && t.owner !== (myId || "1")) return false;
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
        {ownerableTeam.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>}
      <div className="tb-toggle" onClick={() => setArchive(!archive)}><div className={`tb-toggle-track${archive ? " on" : ""}`}><div className="tb-toggle-dot" /></div>Archive</div>
      <div className="tb-search"><Ic.Search /><input placeholder="Search To-Dos..." value={search} onChange={e => setSearch(e.target.value)} /></div>
    </div>
    <div className="content"><div className="content-inner">
      <div className="sec">
        <div className="sec-hdr"><h2>To-Dos<span className="count">{filtered.length}</span></h2></div>
        {filtered.length === 0 ? <div className="empty"><EmptySVG.todos /><h3>{archive ? "No archived to-dos" : "All caught up!"}</h3><p>Create a to-do to get started.</p></div> :
          filtered.map(t => {
            const m = team.find(x => x.id === t.owner) || team[1];
            const od = isOverdue(t.dueDate) && !t.done;
            return <div key={t.id} className="irow">
              <CircleCk on={t.done} toggle={() => setTodos(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} />
              <div className={`itxt${t.done ? " dn" : ""}`} style={{ fontSize: 14 }}>{t.title}
                {!!t.notes && <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{t.notes.slice(0, 90)}{t.notes.length > 90 ? "…" : ""}</div>}
              </div>
              {t.dueDate && <span style={{ fontSize: 12, color: od ? "var(--red-t)" : "var(--t2)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>{od && <Ic.Warn />}{fmtDate(t.dueDate)}</span>}
              <Av m={m} size={24} />
              <button className="btn-ghost" style={{ padding: "4px 6px" }} onClick={() => openEdit(t)}><Ic.More /></button>
            </div>;
          })
        }
      </div>
    </div></div>
    {modal === "todo" && <Modal title={editId ? "Edit To-Do" : "Create To-Do"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" autoFocus /></div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>Owner</label><select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>{ownerableTeam.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div className="field" style={{ flex: 1 }}><label>Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
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
  const fmtUnit = (val, unit) =>
    unit === "$" ? `$${Number(val).toLocaleString()}` :
    unit === "%" ? `${val}%` :
    String(val);

  const ownerableTeam = team.filter(m => m.name !== "Unassigned");
  const defaultOwner = ownerableTeam[0]?.id || "";
  const [form, setForm] = useState({ name: "", owner: defaultOwner, goal: 0, unit: "#", op: ">=" });
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

  // Keyboard shortcut: N = new metric
  useEffect(() => {
    const handler = e => {
      if (e.key === "n" && !["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName) && !modal) {
        e.preventDefault(); openAdd();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal]); // eslint-disable-line

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", owner: defaultOwner, goal: 0, unit: "#", op: ">=" });
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
        {ownerableTeam.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--green-t)" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--green)", display: "inline-block" }} />Hit</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--red-t)" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--red)", display: "inline-block" }} />Miss</span>
              </div>
              {isWeekly && <div style={{ fontSize: 11, color: "var(--t3)" }}>Arrow keys to navigate · <kbd style={{ background: "var(--bg2)", border: "1px solid var(--brd2)", borderRadius: 4, padding: "1px 5px", fontSize: 10, fontFamily: "monospace" }}>N</kbd> to add</div>}
            </div>
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
                      <span className="sc-info">{metric.op} {fmtUnit(metric.goal, metric.unit)}</span>
                    </div>

                    {periods.map((p, colIndex) => {
                      if (isWeekly) {
                        const rawVal = scData[p.key]?.[metric.id] ?? "";
                        const nVal = parseFloat(rawVal);
                        const hasVal = rawVal !== "" && !Number.isNaN(nVal);
                        const hit = hasVal && (metric.op === ">=" ? nVal >= metric.goal : nVal <= metric.goal);
                        const miss = hasVal && !hit;
                        // Trend vs previous week
                        const prevKey = allPeriods[colIndex + 1]?.key;
                        const prevRaw = prevKey ? (scData[prevKey]?.[metric.id] ?? "") : "";
                        const prevVal = parseFloat(prevRaw);
                        const hasPrev = prevRaw !== "" && !Number.isNaN(prevVal);
                        const trend = hasVal && hasPrev ? (nVal > prevVal ? "up" : nVal < prevVal ? "down" : null) : null;
                        return <div key={p.key} className={`sc-data${hit ? " sc-hit" : ""}${miss ? " sc-miss" : ""}`} style={{ position: "relative" }}>
                          <input
                            ref={el => { cellRefs.current[`${rowIndex}-${colIndex}`] = el; }}
                            value={rawVal}
                            onChange={e => updateWeeklyCell(p.key, metric.id, e.target.value)}
                            onKeyDown={e => onCellKeyDown(e, rowIndex, colIndex)}
                            inputMode="decimal"
                            placeholder="-"
                          />
                          {trend && <span style={{ position: "absolute", top: 3, right: 4, pointerEvents: "none", opacity: 0.7 }}>
                            {trend === "up" ? <Ic.TrendUp color={hit ? "var(--green-t)" : "var(--t3)"} /> : <Ic.TrendDown color={miss ? "var(--red-t)" : "var(--t3)"} />}
                          </span>}
                        </div>;
                      }

                      const rollup = getRollupVal(metric.id, p.key, tab, scData, metric.unit);
                      const goal = scaleGoal(metric, tab);
                      const hasRollup = rollup !== "" && !Number.isNaN(Number(rollup));
                      const hit = hasRollup && (metric.op === ">=" ? Number(rollup) >= goal : Number(rollup) <= goal);
                      const miss = hasRollup && !hit;

                      return <div key={p.key} className={`sc-data${hit ? " sc-hit" : ""}${miss ? " sc-miss" : ""}`}>
                        <span className="sc-rollup">{hasRollup ? fmtUnit(Number(rollup).toLocaleString(), metric.unit) : "-"}</span>
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
              {ownerableTeam.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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

function RocksPage({ rocks, setRocks, team, activeMemberIds }) {
  const ownerableTeam = team.filter(m => m.name !== "Unassigned");
  const defaultOwner = ownerableTeam[0]?.id || "";
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", type: "company", owner: "company", assignees: [], dueDate: "", status: "on-track", quarter: "" });
  const [expandedRocks, setExpandedRocks] = useState({});
  const [milestoneInputs, setMilestoneInputs] = useState({});
  const [quarterFilter, setQuarterFilter] = useState("current");

  const now = new Date();
  const qLabel = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;

  const defaultDueDate = () => {
    const qEndMonth = Math.floor(now.getMonth() / 3) * 3 + 2;
    return new Date(now.getFullYear(), qEndMonth + 1, 0).toISOString().split("T")[0];
  };

  // Keyboard shortcut: N = new rock
  useEffect(() => {
    const handler = e => {
      if (e.key === "n" && !["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName) && !modal) {
        e.preventDefault(); openAddCompany();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal]); // eslint-disable-line

  // Unique sorted quarters from all rocks, newest first
  const allQuarters = [...new Set(rocks.map(r => r.quarter).filter(Boolean))].sort().reverse();

  const openAddCompany = () => {
    setEditId(null);
    setForm({ title: "", type: "company", owner: "company", assignees: [], dueDate: defaultDueDate(), status: "on-track", quarter: qLabel });
    setModal("rock");
  };

  const openAddMember = memberId => {
    setEditId(null);
    setForm({ title: "", type: "individual", owner: memberId, assignees: [], dueDate: defaultDueDate(), status: "on-track", quarter: qLabel });
    setModal("rock");
  };

  const openEdit = rock => {
    setEditId(rock.id);
    setForm({
      title: rock.title || "",
      type: rock.owner === "company" ? "company" : "individual",
      owner: rock.owner || defaultOwner,
      assignees: rock.assignees || [],
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
      owner: form.type === "company" ? "company" : form.owner,
      assignees: form.type === "company" ? form.assignees : [],
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

  const removeRock = id => { setRocks(prev => prev.filter(r => r.id !== id)); setModal(null); };
  const setRockStatus = (id, status) => setRocks(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  const toggleAssignee = id => setForm(f => ({
    ...f,
    assignees: f.assignees.includes(id) ? f.assignees.filter(x => x !== id) : [...f.assignees, id]
  }));

  const toggleExpanded = id => setExpandedRocks(prev => ({ ...prev, [id]: !prev[id] }));

  const addMilestone = (rockId, title) => {
    const t = title.trim();
    if (!t) return;
    setRocks(prev => prev.map(r => r.id === rockId
      ? { ...r, milestones: [...(r.milestones || []), { id: uid(), title: t, done: false }] }
      : r
    ));
    setMilestoneInputs(prev => ({ ...prev, [rockId]: "" }));
  };

  const toggleMilestone = (rockId, milestoneId) => {
    setRocks(prev => prev.map(r => r.id === rockId
      ? { ...r, milestones: (r.milestones || []).map(m => m.id === milestoneId ? { ...m, done: !m.done } : m) }
      : r
    ));
  };

  const removeMilestone = (rockId, milestoneId) => {
    setRocks(prev => prev.map(r => r.id === rockId
      ? { ...r, milestones: (r.milestones || []).filter(m => m.id !== milestoneId) }
      : r
    ));
  };

  const matchesFilter = r => {
    const done = r.status === "completed" || r.status === "cancelled";
    if (tab === "active" && done) return false;
    if (tab === "completed" && !done) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (quarterFilter === "current" && r.quarter && r.quarter !== qLabel) return false;
    if (quarterFilter !== "all" && quarterFilter !== "current" && r.quarter !== quarterFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  };

  const companyRocks = rocks.filter(r => r.owner === "company" && matchesFilter(r))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  const visibleMembers = ownerableTeam.filter(m => activeMemberIds.includes(m.id));

  return <>
    <div className="phdr">
      <div className="phdr-top">
        <div>
          <h1>Rocks</h1>
          <div className="phdr-desc">Define and track quarterly priorities with clear ownership and status.</div>
        </div>
      </div>
      <div className="tabs">
        <div className={`tab${tab === "active" ? " on" : ""}`} onClick={() => setTab("active")}>Active</div>
        <div className={`tab${tab === "completed" ? " on" : ""}`} onClick={() => setTab("completed")}>Completed</div>
      </div>
    </div>

    <div className="toolbar">
      <select className="tb-filter" value={quarterFilter} onChange={e => setQuarterFilter(e.target.value)}>
        <option value="current">Quarter: {qLabel}</option>
        <option value="all">Quarter: All</option>
        {allQuarters.filter(q => q !== qLabel).map(q => <option key={q} value={q}>{q}</option>)}
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

      {/* Company Rocks */}
      <div className="sec">
        <div className="sec-hdr">
          <h2>Company Rocks<span className="count">{companyRocks.length}</span></h2>
          <button className="btn" onClick={openAddCompany}><Ic.Plus /> Add</button>
        </div>
        {companyRocks.length === 0
          ? <div className="empty"><EmptySVG.rocks /><h3>No company rocks</h3><p>Add a company-wide rock and assign it to one or more team members.</p></div>
          : <div>
              {companyRocks.map(rock => {
                const ms = rock.milestones || [];
                const msDone = ms.filter(m => m.done).length;
                const expanded = !!expandedRocks[rock.id];
                const overdue = rock.status !== "completed" && rock.status !== "cancelled" && isOverdue(rock.dueDate);
                const assignees = (rock.assignees || []).map(aid => team.find(x => x.id === aid)).filter(Boolean);
                return (
                  <div className="rock-row" key={rock.id}>
                    <div className="rock-row-main" onClick={() => toggleExpanded(rock.id)}>
                      <span className="rock-expand"><Ic.Chevron dir={expanded ? "down" : "right"} /></span>
                      <RockStatusBadge rock={rock} onChange={setRockStatus} />
                      <div className="rock-body">
                        <div className="rock-title-line">
                          <span className="rock-title-text">{rock.title}</span>
                          {rock.quarter && <span className="rock-q-chip">{rock.quarter}</span>}
                        </div>
                        {ms.length > 0 && <div className="rock-ms-hint">
                          <div className="rock-ms-bar"><div className="rock-ms-bar-fill" style={{ width: `${(msDone / ms.length) * 100}%` }} /></div>
                          <span className="rock-ms-count-txt">{msDone}/{ms.length} milestones</span>
                        </div>}
                      </div>
                      <div className="rock-row-right">
                        {assignees.length > 0 && <div style={{ display: "flex", gap: 3 }}>{assignees.map(a => <Av key={a.id} m={a} size={22} />)}</div>}
                        {rock.dueDate && <span className={`rock-due${overdue ? " overdue" : ""}`}>{overdue && <Ic.Warn />}{fmtDate(rock.dueDate)}</span>}
                        <button className="btn-ghost" style={{ padding: "4px 6px", flexShrink: 0 }} onClick={e => { e.stopPropagation(); openEdit(rock); }}><Ic.More /></button>
                      </div>
                    </div>
                    {expanded && <div className="rock-ms-panel">
                      {ms.map(m => <div key={m.id} className="rock-ms-item">
                        <CircleCk on={m.done} toggle={() => toggleMilestone(rock.id, m.id)} />
                        <span className={`rock-ms-item-txt${m.done ? " done" : ""}`}>{m.title}</span>
                        <button className="btn-ghost" style={{ fontSize: 17, lineHeight: 1, padding: "0 4px", color: "var(--t3)" }} onClick={() => removeMilestone(rock.id, m.id)}>×</button>
                      </div>)}
                      <div className="rock-ms-input-row">
                        <input className="rock-ms-input" placeholder="+ Add milestone..." value={milestoneInputs[rock.id] || ""} onChange={e => setMilestoneInputs(p => ({ ...p, [rock.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") addMilestone(rock.id, milestoneInputs[rock.id] || ""); }} />
                        {(milestoneInputs[rock.id] || "").trim() && <button className="btn btn-sm btn-p" onClick={() => addMilestone(rock.id, milestoneInputs[rock.id] || "")}>Add</button>}
                      </div>
                    </div>}
                  </div>
                );
              })}
            </div>
        }
      </div>

      {/* Per-member sections */}
      {visibleMembers.map(member => {
        const isDone = r => r.status === "completed" || r.status === "cancelled";
        const byDue = (a, b) => (a.dueDate || "").localeCompare(b.dueDate || "");
        const activeRocks = rocks
          .filter(r => r.owner === member.id && !isDone(r) && matchesFilter(r))
          .sort(byDue);
        // On the active tab, also show this-quarter done rocks greyed out at the bottom
        const greyedRocks = tab === "active"
          ? rocks
              .filter(r => r.owner === member.id && isDone(r) && r.quarter === qLabel &&
                (!search || r.title.toLowerCase().includes(search.toLowerCase())))
              .sort(byDue)
          : [];
        const memberRocks = [...activeRocks, ...greyedRocks];

        return <div className="sec" key={member.id}>
          <div className="sec-hdr">
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Av m={member} size={24} />{member.name}<span className="count">{activeRocks.length}</span>
            </h2>
            <button className="btn" onClick={() => openAddMember(member.id)}><Ic.Plus /> Add</button>
          </div>
          {memberRocks.length === 0
            ? <div className="empty" style={{ padding: "20px 16px" }}><p>No rocks assigned to {member.name.split(" ")[0]}.</p></div>
            : <div>
                {memberRocks.map(rock => {
                  const greyed = isDone(rock);
                  const overdue = !greyed && isOverdue(rock.dueDate);
                  const ms = rock.milestones || [];
                  const msDone = ms.filter(m => m.done).length;
                  const expanded = !!expandedRocks[rock.id];
                  return (
                    <div className="rock-row" key={rock.id} style={greyed ? { opacity: 0.45 } : {}}>
                      <div className="rock-row-main" onClick={() => toggleExpanded(rock.id)}>
                        <span className="rock-expand"><Ic.Chevron dir={expanded ? "down" : "right"} /></span>
                        <RockStatusBadge rock={rock} onChange={greyed ? undefined : setRockStatus} />
                        <div className="rock-body">
                          <div className="rock-title-line">
                            <span className="rock-title-text" style={greyed ? { textDecoration: "line-through", color: "var(--t3)" } : {}}>{rock.title}</span>
                            {rock.quarter && <span className="rock-q-chip">{rock.quarter}</span>}
                          </div>
                          {!greyed && ms.length > 0 && <div className="rock-ms-hint">
                            <div className="rock-ms-bar"><div className="rock-ms-bar-fill" style={{ width: `${(msDone / ms.length) * 100}%` }} /></div>
                            <span className="rock-ms-count-txt">{msDone}/{ms.length} milestones</span>
                          </div>}
                        </div>
                        <div className="rock-row-right">
                          {rock.dueDate && <span className={`rock-due${overdue ? " overdue" : ""}`}>{overdue && <Ic.Warn />}{fmtDate(rock.dueDate)}</span>}
                          <button className="btn-ghost" style={{ padding: "4px 6px", flexShrink: 0 }} onClick={e => { e.stopPropagation(); openEdit(rock); }}><Ic.More /></button>
                        </div>
                      </div>
                      {expanded && <div className="rock-ms-panel">
                        {ms.map(m => <div key={m.id} className="rock-ms-item">
                          <CircleCk on={m.done} toggle={greyed ? undefined : () => toggleMilestone(rock.id, m.id)} />
                          <span className={`rock-ms-item-txt${m.done ? " done" : ""}`}>{m.title}</span>
                          {!greyed && <button className="btn-ghost" style={{ fontSize: 17, lineHeight: 1, padding: "0 4px", color: "var(--t3)" }} onClick={() => removeMilestone(rock.id, m.id)}>×</button>}
                        </div>)}
                        {!greyed && <div className="rock-ms-input-row">
                          <input className="rock-ms-input" placeholder="+ Add milestone..." value={milestoneInputs[rock.id] || ""} onChange={e => setMilestoneInputs(p => ({ ...p, [rock.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") addMilestone(rock.id, milestoneInputs[rock.id] || ""); }} />
                          {(milestoneInputs[rock.id] || "").trim() && <button className="btn btn-sm btn-p" onClick={() => addMilestone(rock.id, milestoneInputs[rock.id] || "")}>Add</button>}
                        </div>}
                      </div>}
                    </div>
                  );
                })}
              </div>
          }
        </div>;
      })}
    </div></div>

    {modal === "rock" && <Modal title={editId ? "Edit rock" : "Create rock"} onClose={() => setModal(null)}>
      <div className="modal-body">
        {!editId && <div className="field">
          <label>Type</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`btn${form.type === "company" ? " btn-p" : ""}`} onClick={() => setForm(f => ({ ...f, type: "company", owner: "company" }))}>Company</button>
            <button className={`btn${form.type === "individual" ? " btn-p" : ""}`} onClick={() => setForm(f => ({ ...f, type: "individual", owner: defaultOwner }))}>Individual</button>
          </div>
        </div>}

        <div className="field">
          <label>Rock title</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Quarterly priority" autoFocus />
        </div>

        {form.type === "company"
          ? <div className="field">
              <label>Assigned to</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {ownerableTeam.map(m => (
                  <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "5px 10px", borderRadius: 6, border: `1px solid ${form.assignees.includes(m.id) ? "var(--blue)" : "var(--brd)"}`, background: form.assignees.includes(m.id) ? "var(--blue-l)" : "var(--white)", fontWeight: form.assignees.includes(m.id) ? 600 : 400, fontSize: 13 }}>
                    <input type="checkbox" style={{ display: "none" }} checked={form.assignees.includes(m.id)} onChange={() => toggleAssignee(m.id)} />
                    <Av m={m} size={20} />{m.name}
                  </label>
                ))}
              </div>
            </div>
          : <div className="field">
              <label>Owner</label>
              <select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
                {ownerableTeam.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
        }

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Quarter</label>
            <input value={form.quarter} onChange={e => setForm({ ...form, quarter: e.target.value })} placeholder="Q1 2026" />
          </div>
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
      </div>

      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <div>{editId && <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => removeRock(editId)}><Ic.Trash /> Delete</button>}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-p" onClick={saveRock}>{editId ? "Save" : "Create"}</button>
        </div>
      </div>
    </Modal>}
  </>;
}

function IssuesPage({ issues, setIssues, team, activeMemberIds }) {
  const ownerableTeam = team.filter(m => m.name !== "Unassigned");
  const defaultOwner = ownerableTeam[0]?.id || "";
  const [tab, setTab] = useState("short-term");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [showSolved, setShowSolved] = useState(false);
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ title: "", owner: defaultOwner, type: "short-term", priority: "medium", notes: "" });

  // Keyboard shortcut: N = new issue
  useEffect(() => {
    const handler = e => {
      if (e.key === "n" && !["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName) && !modal) {
        e.preventDefault(); openAdd();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal]); // eslint-disable-line

  const openAdd = () => {
    setEditId(null);
    setForm({ title: "", owner: defaultOwner, type: tab, priority: "medium", notes: "" });
    setModal("issue");
  };

  const openEdit = issue => {
    setEditId(issue.id);
    setForm({
      title: issue.title || "",
      owner: issue.owner || defaultOwner,
      type: issue.type || "short-term",
      priority: issue.priority || "medium",
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
      priority: form.priority,
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
      if (showSolved ? !i.done : i.done) return false;
      if (ownerFilter !== "all" && i.owner !== ownerFilter) return false;
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !(i.notes || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      const pa = pOrder[a.priority || "medium"] ?? 1;
      const pb = pOrder[b.priority || "medium"] ?? 1;
      if (pa !== pb) return pa - pb;
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
  const solvedCount = issues.filter(i => i.done && activeMemberIds.includes(i.owner) && (i.type || "short-term") === tab).length;

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
        {ownerableTeam.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <div className="tb-toggle" onClick={() => { setShowSolved(v => !v); setSelectedId(null); }}>
        <div className={`tb-toggle-track${showSolved ? " on" : ""}`}><div className="tb-toggle-dot" /></div>
        Solved{solvedCount > 0 && <span style={{ marginLeft: 4, fontSize: 11, color: "var(--t3)" }}>({solvedCount})</span>}
      </div>
      <div className="tb-search">
        <Ic.Search />
        <input placeholder="Search issues..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
    </div>

    <div className="content"><div className="content-inner" style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px, 340px)", gap: 16 }}>
      <div className="sec" style={{ marginBottom: 0 }}>
        <div className="sec-hdr">
          <h2>{showSolved ? "Solved Issues" : "Issue List"}<span className="count">{filtered.length}</span></h2>
          <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 400 }}>Press <kbd style={{ background: "var(--bg2)", border: "1px solid var(--brd2)", borderRadius: 4, padding: "1px 5px", fontSize: 10, fontFamily: "monospace" }}>N</kbd> to add</span>
        </div>

        {filtered.length === 0 ? <div className="empty"><EmptySVG.issues /><h3>{showSolved ? "No solved issues" : "No issues yet"}</h3><p>{showSolved ? "Solved issues will appear here." : "Add an issue to track your next problem to solve."}</p></div> : (
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
                const pri = issue.priority || "medium";
                const priStyle = pri === "high" ? { color: "var(--red-t)", background: "var(--red-l)", border: "1px solid var(--red)" } : pri === "low" ? { color: "var(--t2)", background: "var(--bg2)", border: "1px solid var(--brd2)" } : { color: "var(--yellow-t)", background: "var(--yellow-l)", border: "1px solid var(--yellow)" };
                return <tr key={issue.id} style={active ? { background: "var(--blue-l)" } : {}}>
                  <td><CircleCk on={Boolean(issue.done)} toggle={() => setSolved(issue.id, !issue.done)} /></td>
                  <td onClick={() => setSelectedId(issue.id)} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 600, color: issue.done ? "var(--t3)" : "var(--t1)", textDecoration: issue.done ? "line-through" : "none" }}>{issue.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, whiteSpace: "nowrap", flexShrink: 0, ...priStyle }}>{pri.charAt(0).toUpperCase() + pri.slice(1)}</span>
                    </div>
                    {!!issue.notes && <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{issue.notes.slice(0, 110)}{issue.notes.length > 110 ? "..." : ""}</div>}
                  </td>
                  <td><Av m={m} /></td>
                  <td><button className="btn-ghost" style={{ padding: "4px 6px" }} onClick={() => openEdit(issue)}><Ic.More /></button></td>
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
            {(() => { const pri = selected.priority || "medium"; const priStyle = pri === "high" ? { color: "var(--red-t)", background: "var(--red-l)", border: "1px solid var(--red)" } : pri === "low" ? { color: "var(--t2)", background: "var(--bg2)", border: "1px solid var(--brd2)" } : { color: "var(--yellow-t)", background: "var(--yellow-l)", border: "1px solid var(--yellow)" }; return <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, ...priStyle }}>{pri.charAt(0).toUpperCase() + pri.slice(1)} priority</span>; })()}
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
              {ownerableTeam.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Priority</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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

function MeetingsPage({ meetings, setMeetings, issues, setIssues, todos, setTodos, rocks, setRocks, team, activeMemberIds }) {
  const store = meetings && typeof meetings === "object" ? meetings : {};
  const defaultMeetingRef = useRef({
    title: "Weekly Level 10",
    date: new Date().toISOString().slice(0, 10),
    sections: { segue: "", scorecard: "", rocks: "", customerEmployee: "", todoReview: "", ids: "" },
    tangents: [],
    timerSeconds: 0
  });
  const mState = store.current || defaultMeetingRef.current;
  const history = store.history || [];

  const [running, setRunning] = useState(false);
  const [tangentText, setTangentText] = useState("");
  const [meetTab, setMeetTab] = useState("current");
  const [viewingHistory, setViewingHistory] = useState(null);

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
  }, [running, setMeetings, mState]); // eslint-disable-line

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

  const endAndArchive = () => {
    setRunning(false);
    setMeetings(prev => {
      const base = prev && typeof prev === "object" ? prev : {};
      const cur = base.current || mState;
      const hasContent = (cur.timerSeconds > 0) ||
        Object.values(cur.sections || {}).some(s => (s || "").trim().length > 0) ||
        (cur.tangents || []).length > 0;
      const newEntry = hasContent ? { ...cur, id: uid(), archivedAt: new Date().toISOString() } : null;
      return {
        ...base,
        history: newEntry ? [newEntry, ...(base.history || [])] : (base.history || []),
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

  const deleteHistoryEntry = id => {
    setMeetings(prev => ({ ...(prev || {}), history: (prev?.history || []).filter(x => x.id !== id) }));
    setViewingHistory(null);
  };

  const seconds = mState.timerSeconds || 0;
  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const fmtDuration = secs => {
    if (!secs) return "—";
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const openIssues = issues.filter(i => !i.done && activeMemberIds.includes(i.owner));
  const openTodos = todos.filter(t => !t.done && activeMemberIds.includes(t.owner));
  const tangents = mState.tangents || [];

  const HISTORY_SECTION_LABELS = [
    ["segue", "1. Segue"],
    ["scorecard", "2. Scorecard"],
    ["rocks", "3. Rocks Review"],
    ["customerEmployee", "4. Headlines"],
    ["todoReview", "5. To-Do Review"],
    ["ids", "6. IDS Notes"]
  ];

  return <>
    <div className="phdr">
      <div className="phdr-top">
        <div>
          <h1>Meetings</h1>
          <div className="phdr-desc">Run your Level 10 meeting with structured sections, timer, IDS notes, and tangents.</div>
        </div>
        {meetTab === "current" && <div className="phdr-actions" style={{ gap: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: ".03em", minWidth: 110, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{hh}:{mm}:{ss}</div>
          <button className={`btn${running ? "" : " btn-p"}`} onClick={() => setRunning(r => !r)}>{running ? "Pause" : "Start"}</button>
          <button className="btn" onClick={endAndArchive} title="End meeting and save to history"><Ic.Archive /> End &amp; Save</button>
        </div>}
      </div>
      <div className="tabs">
        <div className={`tab${meetTab === "current" ? " on" : ""}`} onClick={() => setMeetTab("current")}>Current Meeting</div>
        <div className={`tab${meetTab === "history" ? " on" : ""}`} onClick={() => setMeetTab("history")}>
          History{history.length > 0 && <span className="tab-count">{history.length}</span>}
        </div>
      </div>
    </div>

    {meetTab === "current" && <div className="content"><div className="content-inner" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
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
          <div className="sec-hdr"><h2>3. Rocks Review</h2></div>
          {(() => {
            const activeRocks = rocks.filter(r => r.status !== "completed" && r.status !== "cancelled" && (r.owner === "company" || activeMemberIds.includes(r.owner)));
            const setRockStatus = (id, status) => setRocks(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            return activeRocks.length > 0 ? <div style={{ borderBottom: "1px solid var(--brd)" }}>
              {activeRocks.map(r => {
                const owner = r.owner === "company" ? null : team.find(m => m.id === r.owner);
                const assignees = r.owner === "company" ? (r.assignees || []).map(aid => team.find(m => m.id === aid)).filter(Boolean) : [];
                return <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", borderBottom: "1px solid var(--brd2)" }}>
                  <RockStatusBadge rock={r} onChange={setRockStatus} />
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{r.title}</span>
                  {owner && <Av m={owner} size={22} />}
                  {assignees.slice(0, 3).map(a => <Av key={a.id} m={a} size={22} />)}
                </div>;
              })}
            </div> : null;
          })()}
          <div style={{ padding: "12px 20px" }}><textarea className="field" style={{ marginBottom: 0, minHeight: 60, width: "100%" }} value={mState.sections?.rocks || ""} onChange={e => setSection("rocks", e.target.value)} placeholder="Blockers and discussion notes..." /></div>
        </div>

        <div className="sec">
          <div className="sec-hdr"><h2>4. Customer/Employee Headlines</h2></div>
          <div style={{ padding: "12px 20px" }}><textarea className="field" style={{ marginBottom: 0, minHeight: 78, width: "100%" }} value={mState.sections?.customerEmployee || ""} onChange={e => setSection("customerEmployee", e.target.value)} placeholder="Share notable wins, risks, and updates" /></div>
        </div>

        <div className="sec">
          <div className="sec-hdr"><h2>5. To-Do Review</h2></div>
          {(() => {
            const reviewTodos = todos.filter(t => activeMemberIds.includes(t.owner)).sort((a, b) => Number(Boolean(a.done)) - Number(Boolean(b.done)));
            return reviewTodos.length > 0 ? <div style={{ borderBottom: "1px solid var(--brd)" }}>
              {reviewTodos.map(t => {
                const m = team.find(x => x.id === t.owner) || team[1];
                return <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", borderBottom: "1px solid var(--brd2)" }}>
                  <CircleCk on={t.done} toggle={() => setTodos(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} />
                  <span style={{ flex: 1, fontSize: 13.5, textDecoration: t.done ? "line-through" : "none", color: t.done ? "var(--t3)" : "var(--t1)" }}>{t.title}</span>
                  <Av m={m} size={22} />
                </div>;
              })}
            </div> : null;
          })()}
          <div style={{ padding: "12px 20px" }}><textarea className="field" style={{ marginBottom: 0, minHeight: 60, width: "100%" }} value={mState.sections?.todoReview || ""} onChange={e => setSection("todoReview", e.target.value)} placeholder="Notes on completions and carry-overs..." /></div>
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
              const pri = i.priority || "medium";
              const dot = pri === "high" ? "var(--red)" : pri === "low" ? "var(--t4)" : "var(--yellow)";
              return <div key={i.id} className="dash-irow">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13 }}>{i.title}</span>
                <Av m={m} size={20} />
              </div>;
            })}
          </div>}
        </div>

        <div className="sec" style={{ marginBottom: 16 }}>
          <div className="sec-hdr"><h2>Open To-Dos<span className="count">{openTodos.length}</span></h2></div>
          {openTodos.length === 0 ? <div className="empty" style={{ padding: "20px 12px" }}><p>No open to-dos for active team.</p></div> : <div style={{ padding: "8px 14px 12px" }}>
            {openTodos.slice(0, 8).map(t => {
              const m = team.find(x => x.id === t.owner) || team[1];
              const od = isOverdue(t.dueDate);
              return <div key={t.id} className="dash-irow">
                {od && <Ic.Warn />}
                <span style={{ flex: 1, fontSize: 13, color: od ? "var(--red-t)" : "var(--t1)" }}>{t.title}</span>
                <Av m={m} size={20} />
              </div>;
            })}
          </div>}
        </div>

        <div className="sec" style={{ marginBottom: 0 }}>
          <div className="sec-hdr"><h2>Tangents<span className="count">{tangents.length}</span></h2></div>
          <div style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={tangentText} onChange={e => setTangentText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addTangent(); }} placeholder="Capture tangent..." style={{ flex: 1, border: "1px solid var(--brd)", borderRadius: 8, padding: "8px 10px", fontFamily: "inherit", fontSize: 13 }} />
              <button className="btn btn-sm" onClick={addTangent}>Add</button>
            </div>
            {tangents.length === 0 ? <div style={{ fontSize: 12, color: "var(--t3)" }}>No tangents captured.</div> : <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {tangents.map(tg => (
                <div key={tg.id} className="dash-irow">
                  <span style={{ flex: 1, fontSize: 13 }}>{tg.title}</span>
                  <button className="btn-ghost" style={{ fontSize: 12, color: "var(--t2)" }} onClick={() => updateMeeting(cur => ({ ...cur, tangents: (cur.tangents || []).filter(x => x.id !== tg.id) }))}>Remove</button>
                </div>
              ))}
            </div>}
          </div>
        </div>
      </div>
    </div></div>}

    {meetTab === "history" && <div className="content"><div className="content-inner">
      <div className="sec">
        <div className="sec-hdr"><h2>Past Meetings<span className="count">{history.length}</span></h2></div>
        {history.length === 0
          ? <div className="empty">
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="32" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/><rect x="20" y="18" width="32" height="36" rx="4" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5"/><path d="M28 28h16M28 34h12M28 40h8" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/><circle cx="36" cy="54" r="8" fill="#2563EB"/><path d="M33 54l2 2 4-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <h3>No meeting history yet</h3>
              <p>Run a meeting and click "End &amp; Save" to archive it here.</p>
            </div>
          : <div>
              {history.map(h => {
                const sectionsFilled = Object.values(h.sections || {}).filter(s => (s || "").trim()).length;
                const dateStr = h.date ? new Date(h.date + "T00:00:00").toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Unknown date";
                return <div key={h.id} className="meet-history-row" onClick={() => setViewingHistory(h)}>
                  <div className="meet-history-icon"><Ic.History /></div>
                  <div className="meet-history-body">
                    <div className="meet-history-title">{h.title}</div>
                    <div className="meet-history-meta">{dateStr}</div>
                  </div>
                  <div className="meet-history-chips">
                    {h.timerSeconds > 0 && <span className="meet-chip">{fmtDuration(h.timerSeconds)}</span>}
                    <span className="meet-chip">{sectionsFilled}/6 sections</span>
                    {(h.tangents || []).length > 0 && <span className="meet-chip">{h.tangents.length} tangent{h.tangents.length !== 1 ? "s" : ""}</span>}
                  </div>
                  <Ic.Chevron dir="right" />
                </div>;
              })}
            </div>
        }
      </div>
    </div></div>}

    {viewingHistory && <Modal title={viewingHistory.title} onClose={() => setViewingHistory(null)}>
      <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
        <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>{viewingHistory.date ? new Date(viewingHistory.date + "T00:00:00").toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : ""}</span>
          {viewingHistory.timerSeconds > 0 && <span className="meet-chip">{fmtDuration(viewingHistory.timerSeconds)}</span>}
        </div>
        {HISTORY_SECTION_LABELS.filter(([k]) => (viewingHistory.sections?.[k] || "").trim()).map(([k, label]) => (
          <div key={k} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em", marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 13, color: "var(--t1)", whiteSpace: "pre-wrap", lineHeight: 1.6, background: "var(--bg)", borderRadius: 6, padding: "8px 12px" }}>{viewingHistory.sections[k]}</div>
          </div>
        ))}
        {(viewingHistory.tangents || []).length > 0 && <div>
          <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em", marginBottom: 5 }}>Tangents</div>
          {viewingHistory.tangents.map(tg => <div key={tg.id} style={{ fontSize: 13, padding: "3px 0", color: "var(--t1)" }}>• {tg.title}</div>)}
        </div>}
      </div>
      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => deleteHistoryEntry(viewingHistory.id)}><Ic.Trash /> Delete</button>
        <button className="btn" onClick={() => setViewingHistory(null)}>Close</button>
      </div>
    </Modal>}
  </>;
}
function HeadlinesPage({ headlines, setHeadlines, team, activeMemberIds }) {
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const ownerableTeam = team.filter(m => m.name !== "Unassigned");
  const defaultOwner = ownerableTeam[0]?.id || "";
  const [form, setForm] = useState({ title: "", body: "", owner: defaultOwner, archived: false });

  const openAdd = () => {
    setEditId(null);
    setForm({ title: "", body: "", owner: defaultOwner, archived: false });
    setModal("headline");
  };

  const openEdit = item => {
    setEditId(item.id);
    setForm({ title: item.title || "", body: item.body || "", owner: item.owner || defaultOwner, archived: Boolean(item.archived) });
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
            return <div key={h.id} style={{ border: "1px solid var(--brd)", borderRadius: 10, padding: "12px 14px", marginBottom: 10, background: "var(--white)", transition: "box-shadow .15s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2, display: "flex", gap: 8, alignItems: "center" }}>
                    {new Date(h.createdAt || Date.now()).toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}
                    {h.archived && <span style={{ background: "var(--bg2)", border: "1px solid var(--brd2)", borderRadius: 10, padding: "0 6px", fontSize: 10, fontWeight: 600, color: "var(--t3)" }}>Archived</span>}
                  </div>
                </div>
                <Av m={m} size={26} />
                <button className="btn-ghost" style={{ padding: "4px 6px" }} onClick={() => openEdit(h)}><Ic.More /></button>
              </div>
              {!!h.body && <div style={{ marginTop: 10, fontSize: 13, color: "var(--t2)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{h.body}</div>}
            </div>;
          })}
        </div>}
      </div>
    </div></div>

    {modal === "headline" && <Modal title={editId ? "Edit headline" : "Create headline"} onClose={() => setModal(null)}>
      <div className="modal-body">
        <div className="field"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus /></div>
        <div className="field"><label>Author</label><select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>{ownerableTeam.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div className="field" style={{ marginBottom: 0 }}><label>Body</label><textarea rows={6} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
      </div>
      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {editId && <button className="btn" style={{ color: "var(--red-t)", borderColor: "var(--red)" }} onClick={() => removeHeadline(editId)}><Ic.Trash /> Delete</button>}
          {editId && <button className="btn" onClick={() => { setHeadlines(prev => prev.map(x => x.id === editId ? { ...x, archived: !form.archived } : x)); setModal(null); }}><Ic.Archive /> {form.archived ? "Unarchive" : "Archive"}</button>}
        </div>
        <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-p" onClick={saveHeadline}>{editId ? "Save" : "Create"}</button></div>
      </div>
    </Modal>}
  </>;
}

const VTO_DESCRIPTIONS = {
  coreValues:      "Who you are — the 3–7 principles that define your culture and guide every decision.",
  purposePassion:  "Why you exist beyond profit — your core focus and reason for being.",
  niche:           "What you do, who you do it for, and your geographic reach.",
  tenYearTarget:   "A bold, specific goal 10 years out that inspires and directs the whole organization.",
  marketTarget:    "Your ideal customer profile, key message, and proven process summary.",
  threeUniques:    "The 3 things that make you truly different from every competitor in your space.",
  provenProcess:   "The named, repeatable steps you follow every time to deliver your core product or service.",
  guarantee:       "Your bold customer promise that eliminates perceived risk and builds trust.",
  threeYearRevenue:"Revenue target three years from today.",
  threeYearProfit: "Gross profit or EBITDA target three years from today.",
  threeYearLooks:  "What does the business look, feel, and act like in 3 years? List specific, measurable snapshots.",
  oneYearRevenue:  "Revenue goal for the next 12 months.",
  oneYearProfit:   "Profit goal for the next 12 months.",
  oneYearGoals:    "The 3–7 most important things you must accomplish this year to hit your 3-year picture."
};

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

  const renderField = ([key, label]) => (
    <div className="vto-field" key={key}>
      <label style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>{label}</label>
      <div className="vto-field-desc">{VTO_DESCRIPTIONS[key]}</div>
      <textarea value={vision[key] || ""} onChange={e => setField(key, e.target.value)} placeholder={`Enter your ${label.toLowerCase()}...`} />
    </div>
  );

  return <>
    <div className="phdr"><div className="phdr-top"><div><h1>Vision / V/TO</h1><div className="phdr-desc">Capture where the business is going and how it gets there.</div></div></div></div>
    <div className="content"><div className="content-inner">
      <div className="vto-grid">
        <div className="vto-box">
          <div className="sec-hdr"><h2>Vision</h2></div>
          {purposeFields.map(renderField)}
        </div>
        <div className="vto-box">
          <div className="sec-hdr"><h2>Traction</h2></div>
          {tractionFields.map(renderField)}
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
            {team.filter(m => m.id !== "2").map(m => <tr key={m.id}><td>{m.name}</td><td style={{ color: "var(--t2)" }}>{m.role || "-"}</td><td><div style={{ width: 16, height: 16, borderRadius: 16, background: m.color, border: "1px solid var(--brd)" }} /></td><td><button className="btn-ghost" style={{ padding: "4px 6px" }} onClick={() => openEditMember(m)}><Ic.More /></button></td></tr>)}
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

// MOBILE BOTTOM NAV
function MobileNav({ page, setPage, navMain, activeTodos, openIssues }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const morePages = [
    { id: "headlines", label: "Headlines", icon: <Ic.Headlines /> },
    { id: "vision",    label: "Vision",    icon: <Ic.Vision /> },
    { id: "org",       label: "Org Chart", icon: <Ic.OrgChart /> },
    { id: "team",      label: "Team",      icon: <Ic.Team /> },
    { id: "profile",   label: "Profile",   icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3.5"/><path d="M3 17c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round"/></svg> },
  ];
  const mainFive = navMain.slice(0, 5); // dashboard, scorecard, rocks, todos, issues
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
          {n.id === "todos"  && activeTodos > 0 && <span className="bbdg">{activeTodos}</span>}
          {n.id === "issues" && openIssues > 0  && <span className="bbdg">{openIssues}</span>}
        </div>
      ))}
      <div className={`bnav-i${moreActive ? " on" : ""}`} onClick={() => setMoreOpen(v => !v)}>
        <Ic.More /><span>More</span>
      </div>
    </div>
  </>;
}

// MAIN APP
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [prevPage, setPrevPage] = useState("dashboard");
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

  // ── Cross-tab real-time sync ──────────────────────────────────────────────
  // The `storage` event fires in every OTHER tab when localStorage changes,
  // giving instant sync across multiple users on the same device/browser.
  // To extend this to different devices, replace the save/load helpers above
  // with API calls and add a WebSocket/SSE listener here instead.
  const [syncedAt, setSyncedAt] = useState(null);
  useEffect(() => {
    const handler = e => {
      if (!e.key || e.newValue === null) return;
      try {
        const val = JSON.parse(e.newValue);
        if (e.key === STORAGE_KEYS.todos)     setTodos(val);
        else if (e.key === STORAGE_KEYS.scorecard) setScorecard(val);
        else if (e.key === STORAGE_KEYS.scData)    setScData(val);
        else if (e.key === STORAGE_KEYS.meetings)  setMeetings(val);
        else if (e.key === STORAGE_KEYS.issues)    setIssues(val);
        else if (e.key === STORAGE_KEYS.team)      setTeam(val);
        else if (e.key === STORAGE_KEYS.rocks)     setRocks(val);
        else if (e.key === STORAGE_KEYS.headlines) setHeadlines(val);
        else if (e.key === STORAGE_KEYS.vision)    setVision(val);
        else if (e.key === STORAGE_KEYS.teams)     setTeams(val);
        else if (e.key === STORAGE_KEYS.profile)   setProfile(val);
        else return;
        setSyncedAt(new Date());
      } catch {}
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!loaded) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8F9FA", color: "#9CA3AF" }}><style>{CSS}</style>Loading...</div>;

  // Derive logged-in user's team ID from profile name; fall back to first real member
  const myId = (() => {
    const fullName = `${profile.firstName} ${profile.lastName}`.trim();
    if (fullName) { const found = team.find(m => m.name === fullName); if (found) return found.id; }
    return team.find(m => m.id !== "2")?.id || "1";
  })();

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
        {syncedAt && <span style={{ fontSize: 11, color: "var(--green-t)", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
          Synced {syncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>}
        <button onClick={() => setNotifOpen(!notifOpen)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: notifOpen ? "var(--blue)" : "var(--t2)", display: "flex", alignItems: "center", transition: "all .12s" }}>
          <Ic.Bell />{activeTodos + openIssues > 0 && <span style={{ position: "absolute", top: 1, right: 1, background: "var(--red)", color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 700, padding: "1px 4px", minWidth: 14, textAlign: "center", lineHeight: "14px" }}>{activeTodos + openIssues}</span>}
        </button>
        <button onClick={() => { if (page === "profile") { setPage(prevPage); } else { setPrevPage(page); setPage("profile"); } }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 10px 4px 6px", border: "1px solid var(--brd)", borderRadius: 20, background: page === "profile" ? "var(--blue-l)" : "var(--white)", cursor: "pointer", transition: "all .12s", color: page === "profile" ? "var(--blue)" : "var(--t2)" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#4A90D9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
            {(profile.firstName || "?").slice(0,1)}{(profile.lastName || "").slice(0,1)}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{profile.firstName}</span>
        </button>
      </div>
      {page === "dashboard" && <DashboardPage {...{ todos, setTodos, rocks, issues, scorecard, scData, team, activeMemberIds, setPage }} />}
      {page === "todos" && <TodosPage {...{ todos, setTodos, team, activeMemberIds, myId }} />}
      {page === "scorecard" && <ScorecardPage {...{ scorecard, setScorecard, scData, setScData, team, activeMemberIds, mob }} />}
      {page === "rocks" && <RocksPage {...{ rocks, setRocks, team, activeMemberIds }} />}
      {page === "issues" && <IssuesPage {...{ issues, setIssues, team, activeMemberIds }} />}
      {page === "meetings" && <MeetingsPage {...{ meetings, setMeetings, issues, setIssues, todos, setTodos, rocks, setRocks, team, activeMemberIds }} />}
      {page === "headlines" && <HeadlinesPage {...{ headlines, setHeadlines, team, activeMemberIds }} />}
      {page === "vision" && <VisionPage {...{ vision, setVision }} />}
      {page === "org" && <OrgChartPage {...{ teams, team }} />}
      {page === "team" && <TeamPage {...{ team, setTeam, teams, setTeams }} />}
      {page === "profile" && <ProfilePage {...{ profile, setProfile }} />}
    </div>
    {mob && <MobileNav page={page} setPage={setPage} navMain={navMain} activeTodos={activeTodos} openIssues={openIssues} />}
    {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} todos={todos} rocks={rocks} issues={issues} scorecard={scorecard.filter(m => activeMemberIds.includes(m.owner))} scData={scData} />}
  </div>;
}