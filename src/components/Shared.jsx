import { Ic } from "./Icons";

export const Av = ({ m, size = 30 }) => {
  const initials = m.name.split(" ").map(n => n[0]).join("").slice(0, 2);
  return <div className="av" style={{ width: size, height: size, fontSize: size * 0.37, background: m.color || "#94A3B8" }}>{initials}</div>;
};

export const CircleCk = ({ on, toggle }) => (
  <div className={`circle-ck${on ? " on" : ""}`} onClick={toggle}>
    {on && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5L5 9l4.5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
  </div>
);

export function Modal({ title, children, onClose }) {
  return <div className="overlay" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-hdr"><h3>{title}</h3><button className="btn-ghost" onClick={onClose}><Ic.X/></button></div>
      {children}
    </div>
  </div>;
}

// Empty state SVGs
export const EmptySVG = {
  todos: () => <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="32" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/><rect x="22" y="22" width="28" height="28" rx="6" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5"/><path d="M28 36l5 5 11-10" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  issues: () => <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="32" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="2"/><circle cx="36" cy="36" r="14" fill="#FEF3C7" stroke="#FBBF24" strokeWidth="1.5"/><path d="M36 29v9M36 41.5v1" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  rocks: () => <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="32" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="2"/><path d="M18 50L27 32L30 36L36 22L42 32L45 27L54 50H18Z" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M24 42L29 39L34 42L38 39L43 42L48 39" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  headlines: () => <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="32" fill="#F3F0FF" stroke="#DDD6FE" strokeWidth="2"/><rect x="22" y="26" width="28" height="20" rx="4" fill="#EDE9FE" stroke="#A78BFA" strokeWidth="1.5"/><path d="M28 33h16M28 37h10M28 41h12" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  vision: () => <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="32" fill="#FFF7ED" stroke="#FED7AA" strokeWidth="2"/><circle cx="36" cy="36" r="8" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5"/><path d="M16 36c5-9 11-14 20-14s15 5 20 14-11 14-20 14-15-5-20-14z" stroke="#F97316" strokeWidth="1.5" fill="none"/></svg>,
};

// Dashboard sub-components

export function GaugeChart({ value, max, label }) {
  const pct = max === 0 ? 0 : Math.min(value / max, 1);
  const R = 54, cx = 70, cy = 70;
  const startAngle = Math.PI, sweep = Math.PI;
  const angle = startAngle + sweep * pct;
  const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle);
  const x2 = cx + R * Math.cos(angle), y2 = cy + R * Math.sin(angle);
  const large = pct > 0.5 ? 1 : 0;
  const color = pct >= 0.8 ? "#10B981" : pct >= 0.5 ? "#F59E0B" : "#EF4444";
  return (
    <svg width="140" height="80" viewBox="0 0 140 80">
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="#E5E7EB" strokeWidth="10" strokeLinecap="round"/>
      {pct > 0 && <path d={`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"/>}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="#111827">{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#9CA3AF">of {max}</text>
    </svg>
  );
}

export function DonutChart({ hits, total }) {
  const pct = total === 0 ? 0 : hits / total;
  const R = 28, cx = 36, cy = 36, circ = 2 * Math.PI * R;
  const dash = circ * pct;
  const color = pct >= 0.8 ? "#10B981" : pct >= 0.5 ? "#F59E0B" : "#EF4444";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#E5E7EB" strokeWidth="8"/>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" style={{ transition: "stroke-dasharray .4s" }}/>
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fill="#111827">{hits}/{total}</text>
    </svg>
  );
}

export function MiniBarChart({ scorecard, scData, weeks }) {
  if (!scorecard.length) return <div style={{ color: "var(--t3)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No measurables</div>;
  const recentWeeks = weeks.slice(0, 6).reverse();
  const metric = scorecard[0];
  const vals = recentWeeks.map(w => ({ label: w.label.split("–")[0].trim(), val: parseFloat(scData[w.key]?.[metric.id]) || 0 }));
  const maxVal = Math.max(...vals.map(v => v.val), metric.goal, 1);
  const barW = 28, gap = 8, chartH = 60;
  const totalW = vals.length * (barW + gap);
  return (
    <div style={{ overflow: "hidden" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t2)", marginBottom: 6 }}>{metric.name}</div>
      <svg width={totalW} height={chartH + 20} viewBox={`0 0 ${totalW} ${chartH + 20}`}>
        {vals.map((v, i) => {
          const h = Math.max(2, (v.val / maxVal) * chartH);
          const x = i * (barW + gap), y = chartH - h;
          const hit = v.val >= metric.goal;
          return <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="3" fill={hit ? "#10B981" : "#3B82F6"} opacity={0.85}/>
            <text x={x + barW / 2} y={chartH + 12} textAnchor="middle" fontSize="8" fill="#9CA3AF">{v.label}</text>
          </g>;
        })}
        <line x1={0} y1={chartH - (metric.goal / maxVal) * chartH} x2={totalW} y2={chartH - (metric.goal / maxVal) * chartH} stroke="#EF4444" strokeWidth="1" strokeDasharray="3,3"/>
      </svg>
    </div>
  );
}
