// Storage keys and default data structures

export const STORAGE_KEYS = {
  todos: "eos-todos",
  scorecard: "eos-scorecard",
  meetings: "eos-meetings",
  issues: "eos-issues",
  team: "eos-team",
  scData: "eos-scorecard-data",
  rocks: "eos-rocks",
  headlines: "eos-headlines",
  vision: "eos-vision",
  teams: "eos-teams",
  profile: "eos-profile"
};

export const PROFILE_DEFAULT = {
  firstName: "David",
  lastName: "Lewis",
  title: "Operations",
  bio: "",
  avatar: null,
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "US"
};

export const TEAM_DEFAULT = [
  { id: "1", name: "David Lewis", role: "Operations", color: "#4A90D9" },
  { id: "2", name: "Unassigned", role: "", color: "#CBD5E1" }
];

export const TEAMS_DEFAULT = [
  { id: "tl1", name: "Leadership Team", memberIds: ["1"] }
];

export const SC_DEFAULT = [
  { id: "s1", name: "SMS referrals", owner: "1", goal: 40, unit: "#", op: ">=" },
  { id: "s2", name: "NP visits SMS", owner: "1", goal: 25, unit: "#", op: ">=" },
  { id: "s3", name: "DSM referrals", owner: "1", goal: 100, unit: "#", op: ">=" },
  { id: "s4", name: "CPAP Setups", owner: "1", goal: 15, unit: "#", op: ">=" },
  { id: "s5", name: "Oral Device Deliveries", owner: "1", goal: 10, unit: "#", op: ">=" },
  { id: "s6", name: "Sch Utilization Silverdale", owner: "1", goal: 90, unit: "%", op: ">=" },
  { id: "s7", name: "Sch Utilization Bellevue", owner: "1", goal: 90, unit: "%", op: ">=" },
  { id: "s8", name: "Patient Satisfaction", owner: "1", goal: 95, unit: "%", op: ">=" }
];

export const VISION_DEFAULT = {
  coreValues: "",
  purposePassion: "",
  niche: "",
  tenYearTarget: "",
  marketTarget: "",
  threeUniques: "",
  provenProcess: "",
  guarantee: "",
  threeYearRevenue: "",
  threeYearProfit: "",
  threeYearLooks: "",
  oneYearRevenue: "",
  oneYearProfit: "",
  oneYearGoals: ""
};

export const PERIOD_WEEKS = { weekly: 1, monthly: 4, quarterly: 13, annual: 52 };

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
:root {
  --white:#FFFFFF; --bg:#F8F9FA; --bg2:#F1F3F5;
  --brd:#E5E7EB; --brd2:#D1D5DB;
  --t1:#111827; --t2:#6B7280; --t3:#9CA3AF; --t4:#D1D5DB;
  --blue:#2563EB; --blue-l:#EFF6FF; --blue-t:#3B82F6;
  --red:#EF4444; --red-l:#FEF2F2; --red-t:#DC2626;
  --green:#10B981; --green-l:#ECFDF5; --green-t:#059669;
  --yellow:#F59E0B; --yellow-l:#FFFBEB; --yellow-t:#B45309;
  --purple:#8B5CF6; --purple-l:#F3F0FF; --purple-t:#7C3AED;
  --orange:#F97316; --orange-l:#FFF7ED; --orange-t:#C2410C;
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--t1);font-size:14px;-webkit-font-smoothing:antialiased}

.shell{display:flex;height:100vh;height:100dvh}

/* ── Sidebar ── */
.sb{background:var(--white);border-right:1px solid var(--brd);display:flex;flex-direction:column;overflow:hidden;transition:width .2s,min-width .2s;flex-shrink:0}
.sb-head{padding:16px 16px 12px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--brd);overflow:hidden;white-space:nowrap}
.sb-logo{width:28px;height:28px;background:linear-gradient(135deg,#2563EB,#60A5FA);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;flex-shrink:0}
.sb-co{font-size:13px;font-weight:600;color:var(--t1);flex:1;line-height:1.2;overflow:hidden}
.sb-co small{font-size:11px;color:var(--t3);font-weight:400;display:block}
.sb-toggle-btn{width:24px;height:24px;border-radius:6px;border:1px solid var(--brd);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--t3);background:var(--white);flex-shrink:0;transition:all .15s}
.sb-toggle-btn:hover{background:var(--bg);color:var(--t1)}
.sb-nav{padding:8px;flex:1;overflow-y:auto;overflow-x:hidden}
.sb-sep{height:1px;background:var(--brd);margin:6px 0}
.sb-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;color:var(--t2);font-size:13.5px;font-weight:500;transition:all .12s;white-space:nowrap;position:relative;overflow:hidden}
.sb-item:hover{background:var(--bg);color:var(--t1)}
.sb-item.on{background:var(--blue-l);color:var(--blue)}
.sb-item .sb-badge{margin-left:auto;font-size:11px;font-weight:600;color:var(--white);background:var(--red);border-radius:10px;padding:1px 7px;min-width:20px;text-align:center;flex-shrink:0}
.sb-team-picker{margin:6px 8px 2px;position:relative}
.sb-team-picker select{width:100%;padding:7px 28px 7px 10px;border:1px solid var(--brd);border-radius:8px;font-size:12px;font-weight:600;color:var(--t1);background:var(--bg);font-family:inherit;cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;transition:border .15s}
.sb-team-picker select:focus{border-color:var(--blue)}
.sb-team-picker-icon{position:absolute;right:8px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--t3)}

/* ── Main ── */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}

/* ── Page Header ── */
.phdr{padding:20px 32px 0;background:var(--white);border-bottom:1px solid var(--brd);flex-shrink:0}
.phdr-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.phdr h1{font-size:24px;font-weight:700;letter-spacing:-.02em;color:var(--t1)}
.phdr-desc{font-size:13px;color:var(--t2);margin-bottom:12px}
.phdr-actions{display:flex;align-items:center;gap:8px}

/* ── Tabs ── */
.tabs{display:flex;gap:0;border-bottom:none}
.tab{padding:10px 16px 12px;font-size:14px;font-weight:500;color:var(--t2);cursor:pointer;border-bottom:2.5px solid transparent;transition:all .12s;white-space:nowrap}
.tab:hover{color:var(--t1)}
.tab.on{color:var(--blue);border-bottom-color:var(--blue)}

/* ── Toolbar ── */
.toolbar{display:flex;align-items:center;gap:8px;padding:12px 32px;background:var(--white);flex-wrap:wrap;flex-shrink:0}
.tb-filter{display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--brd);border-radius:20px;font-size:13px;color:var(--t2);cursor:pointer;background:var(--white);font-family:inherit;transition:all .12s}
.tb-filter:hover{border-color:var(--brd2);color:var(--t1)}
.tb-toggle{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--t2);cursor:pointer;user-select:none}
.tb-toggle-track{width:32px;height:18px;border-radius:9px;background:var(--t4);position:relative;transition:background .2s;flex-shrink:0}
.tb-toggle-track.on{background:var(--blue)}
.tb-toggle-dot{width:14px;height:14px;border-radius:50%;background:var(--white);position:absolute;top:2px;left:2px;transition:left .2s}
.tb-toggle-track.on .tb-toggle-dot{left:16px}
.tb-search{display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--brd);border-radius:8px;background:var(--white);margin-left:auto;min-width:200px}
.tb-search input{border:none;background:none;outline:none;font-size:13px;color:var(--t1);font-family:inherit;width:100%;padding:0}
.tb-search input::placeholder{color:var(--t3)}

/* ── Content ── */
.content{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
.content-inner{padding:20px 32px 40px}

/* ── Section card ── */
.sec{background:var(--white);border:1px solid var(--brd);border-radius:12px;margin-bottom:20px;overflow:hidden}
.sec-hdr{display:flex;align-items:center;padding:16px 20px;gap:8px;border-bottom:1px solid var(--brd)}
.sec-hdr h2{font-size:18px;font-weight:700;letter-spacing:-.01em;flex:1}
.sec-hdr .count{font-size:18px;font-weight:400;color:var(--t3);margin-left:4px}

/* ── Table ── */
.tbl{width:100%;border-collapse:collapse}
.tbl th{text-align:left;padding:8px 16px;font-size:12px;font-weight:500;color:var(--t3);border-bottom:1px solid var(--brd);white-space:nowrap}
.tbl td{padding:12px 16px;border-bottom:1px solid var(--brd);font-size:14px;vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:var(--bg)}

/* ── Circle checkbox ── */
.circle-ck{width:22px;height:22px;border-radius:50%;border:2px solid var(--brd2);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
.circle-ck:hover{border-color:var(--blue)}
.circle-ck.on{border-color:var(--green);background:var(--green);color:#fff}

/* ── Avatar ── */
.av{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;color:#fff;flex-shrink:0;background:#94A3B8}

/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:600;border:1px solid var(--brd);background:var(--white);color:var(--t1);cursor:pointer;font-family:inherit;transition:all .12s;white-space:nowrap}
.btn:hover{background:var(--bg)}
.btn-p{background:var(--blue);border-color:var(--blue);color:#fff}
.btn-p:hover{background:#1D4ED8;border-color:#1D4ED8}
.btn-sm{padding:6px 14px;font-size:12px}
.btn-ghost{border:none;background:none;color:var(--t2);padding:6px 8px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:4px;border-radius:6px;transition:all .12s}
.btn-ghost:hover{background:var(--bg);color:var(--t1)}
.btn-link{border:none;background:none;color:var(--blue);padding:0;font-weight:500;cursor:pointer;font-family:inherit;font-size:13px}
.btn-link:hover{text-decoration:underline}

/* ── Dashboard widgets ── */
.dash-widget-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.dash-widget{background:var(--white);border:1px solid var(--brd);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.dash-widget-hdr{display:flex;align-items:center;justify-content:space-between;padding:13px 16px 10px;border-bottom:1px solid var(--brd)}
.dash-widget-title{font-size:14px;font-weight:700;color:var(--t1)}
.dash-widget>div:last-child{padding:12px 16px;flex:1}
.dash-irow{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--brd)}
.dash-irow:last-of-type{border-bottom:none}
.dash-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;text-align:center;color:var(--t3);font-size:13px;gap:6px;min-height:80px}
.irow{display:flex;align-items:center;gap:10px;padding:10px 20px;border-bottom:1px solid var(--brd)}
.irow:last-child{border-bottom:none}
.itxt{flex:1;font-size:14px;min-width:0}
.itxt.dn{text-decoration:line-through;color:var(--t3)}

/* ── Scorecard ── */
.sc-wrap{overflow:auto;border:1px solid var(--brd);border-radius:8px;background:var(--white);max-height:calc(100vh - 260px)}
.sc-grid{display:grid;min-width:max-content}
.sc-grid-head{display:contents}
.sc-grid-head>div{position:sticky;top:0;z-index:4;background:#EBEEF2;border-bottom:2px solid var(--brd2);border-right:1px solid var(--brd);padding:8px 12px;font-size:10px;font-weight:600;color:var(--t2);text-transform:uppercase;letter-spacing:.04em;text-align:center;white-space:nowrap;display:flex;align-items:center;justify-content:center;min-height:40px}
.sc-grid-head>div:first-child{justify-content:flex-start;padding-left:14px}
.sc-row{display:contents}
.sc-row>div{border-bottom:1px solid var(--brd);border-right:1px solid var(--brd);display:flex;align-items:center;justify-content:center;min-height:40px;background:var(--white);transition:background .08s}
.sc-row:hover>div{background:#F8FAFC}
.sc-row>div:first-child{justify-content:flex-start}
.sc-row .sc-name-cell{padding:0 14px;font-size:13px;font-weight:500;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;gap:6px}
.sc-row .sc-name-cell:hover{color:var(--blue)}
.sc-row .sc-info{font-size:12px;color:var(--t2);font-weight:500;padding:0 6px}
.sc-row .sc-data{padding:0}
.sc-row .sc-data input{width:100%;height:40px;text-align:center;font-size:13px;font-family:inherit;border:none;background:transparent;color:var(--t1);outline:none;padding:0 4px}
.sc-row .sc-data input:focus{box-shadow:inset 0 0 0 2px var(--blue);background:var(--white);z-index:1;position:relative}
.sc-row .sc-data input::placeholder{color:var(--t4)}
.sc-hit{background:linear-gradient(135deg,#D1FAE5,#A7F3D0)!important}
.sc-miss{background:linear-gradient(135deg,#FEE2E2,#FECACA)!important}
.sc-hit input{color:#065F46!important;font-weight:700!important}
.sc-miss input{color:#991B1B!important;font-weight:700!important}
.sc-row:hover .sc-hit{background:linear-gradient(135deg,#C6F6D5,#9AE6B4)!important}
.sc-row:hover .sc-miss{background:linear-gradient(135deg,#FDD9D9,#FCA5A5)!important}
.sc-avg-hit{background:#D1FAE5!important;color:#065F46!important;font-weight:700!important}
.sc-avg-miss{background:#FEE2E2!important;color:#991B1B!important;font-weight:700!important}
.sc-rollup{font-size:13px;font-weight:500;color:var(--t2);cursor:default;padding:0 4px;text-align:center;width:100%}
.sc-hit .sc-rollup{color:#065F46!important;font-weight:700!important}
.sc-miss .sc-rollup{color:#991B1B!important;font-weight:700!important}
.sc-add-btn{padding:10px 14px;color:var(--blue);font-size:13px;font-weight:500;cursor:pointer;border-top:1px solid var(--brd)}
.sc-add-btn:hover{background:var(--blue-l)}

/* ── Profile page ── */
.profile-layout{display:grid;grid-template-columns:260px 1fr;gap:20px;max-width:900px}
.profile-card{background:var(--white);border:1px solid var(--brd);border-radius:12px;overflow:hidden;margin-bottom:0}
.profile-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);padding:16px 20px 8px;border-bottom:1px solid var(--brd)}
.profile-avatar-wrap{display:flex;flex-direction:column;align-items:center;padding:28px 20px 20px;gap:12px;border-bottom:1px solid var(--brd)}
.profile-avatar-img{width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid var(--brd)}
.profile-avatar-placeholder{width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#2563EB,#60A5FA);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff;border:3px solid var(--brd)}
.profile-upload-btn{font-size:12px;color:var(--blue);cursor:pointer;font-weight:600;padding:5px 12px;border:1px solid var(--blue);border-radius:6px;background:var(--blue-l);transition:all .12s}
.profile-upload-btn:hover{background:var(--blue);color:#fff}

/* ── Team page ── */
.team-card{background:var(--white);border:1px solid var(--brd);border-radius:12px;margin-bottom:16px;overflow:hidden}
.team-card-hdr{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid var(--brd)}
.team-card-hdr h3{font-size:15px;font-weight:600;flex:1}
.team-member-chip{display:flex;align-items:center;gap:6px;padding:5px 10px;background:var(--bg);border:1px solid var(--brd);border-radius:20px;font-size:12px;font-weight:500}

/* ── Vision / V/TO ── */
.vto-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.vto-box{background:var(--white);border:1px solid var(--brd);border-radius:12px;overflow:hidden}
.vto-field{padding:12px 16px;border-bottom:1px solid var(--brd)}
.vto-field textarea{width:100%;border:none;outline:none;font-family:inherit;font-size:13px;color:var(--t1);resize:none;background:transparent;min-height:56px;line-height:1.5}

/* ── Org Chart ── */
.org-wrap{padding:32px;overflow:auto;min-height:300px;display:flex;flex-direction:column;align-items:center}
.org-level{display:flex;justify-content:center;gap:24px;position:relative}
.org-card{background:var(--white);border:1.5px solid var(--brd);border-radius:12px;padding:16px 20px;text-align:center;cursor:pointer;transition:all .15s;min-width:140px}
.org-card:hover{border-color:var(--blue);box-shadow:0 4px 16px rgba(37,99,235,.1)}

/* ── Modal ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:200;animation:fadeIn .12s}
.modal{background:var(--white);border-radius:12px;width:520px;max-width:95vw;padding:0;box-shadow:0 20px 60px rgba(0,0,0,.15);animation:modalIn .2s;max-height:90vh;overflow-y:auto}
.modal-hdr{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--brd)}
.modal-hdr h3{font-size:17px;font-weight:700}
.modal-body{padding:20px 24px}
.modal-foot{padding:16px 24px;border-top:1px solid var(--brd);display:flex;justify-content:flex-end;gap:8px}
.field{margin-bottom:16px}
.field label{display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em}
.field input,.field select,.field textarea{width:100%;padding:9px 12px;border:1px solid var(--brd);border-radius:8px;font-size:14px;font-family:inherit;color:var(--t1);background:var(--white);outline:none;transition:border .15s}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.08)}

/* ── Notifications ── */
.notif-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:180;animation:fadeIn .15s}
.notif-panel{position:fixed;top:0;right:0;bottom:0;width:360px;max-width:95vw;background:var(--white);border-left:1px solid var(--brd);z-index:181;display:flex;flex-direction:column;animation:slideInRight .2s;box-shadow:-4px 0 32px rgba(0,0,0,.08)}
.notif-hdr{padding:20px;border-bottom:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between}
.notif-list{flex:1;overflow-y:auto}
.notif-item{padding:14px 20px;border-bottom:1px solid var(--brd);display:flex;gap:12px;align-items:flex-start}
.notif-empty{padding:48px 20px;text-align:center;color:var(--t3);font-size:14px}

/* ── Empty States ── */
.empty{text-align:center;padding:48px 20px}
.empty h3{font-size:17px;color:var(--t2);font-weight:600;margin:16px 0 6px}
.empty p{font-size:13px;color:var(--t3);margin-bottom:20px}

/* ── Status ── */
.status{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:600}
.status-on{background:var(--green-l);color:var(--green-t)}
.status-off{background:var(--red-l);color:var(--red-t)}

@keyframes fadeIn{from{opacity:0}}
@keyframes modalIn{from{transform:translateY(10px);opacity:0}}
@keyframes slideInRight{from{transform:translateX(100%);opacity:.5}}

@media(max-width:767px){
  .sb{display:none!important}
  .main{width:100%}
  .phdr{padding:14px 16px 0}
  .phdr h1{font-size:20px}
  .toolbar{padding:8px 16px;gap:6px}
  .content-inner{padding:12px 16px 100px}
  .modal{border-radius:12px 12px 0 0;max-width:100vw;width:100%;position:fixed;bottom:0}
  .overlay{align-items:flex-end}
  .bnav{display:flex;position:fixed;bottom:0;left:0;right:0;background:var(--white);border-top:1px solid var(--brd);z-index:100;padding:6px 0;justify-content:space-around}
  .bnav-i{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 8px;cursor:pointer;color:var(--t3);font-size:10px;font-weight:600;position:relative}
  .bnav-i.on{color:var(--blue)}
  .bnav-i .bbdg{position:absolute;top:0;right:2px;font-size:8px;background:var(--red);color:#fff;border-radius:7px;padding:0 4px;min-width:14px;text-align:center;line-height:14px}
}
`;
