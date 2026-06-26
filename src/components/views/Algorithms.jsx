"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { StatCard, SectionCard, PageHeader, TableHead, TableRow, EmptyState } from "../DashboardUI";
import { fmtEventType } from "../../lib/fmt";

function fmtBytes(bytes, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

const COLORS = ["#7a0c10", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316"];

// NIST PQC security metadata
const ALGO_META = {
  "Kyber-512":  { level: 1, standard: "CRYSTALS-Kyber",    nist: "ML-KEM-512",  grade: "Standard",  bits: 128 },
  "Kyber-768":  { level: 3, standard: "CRYSTALS-Kyber",    nist: "ML-KEM-768",  grade: "High",      bits: 192 },
  "Kyber-1024": { level: 5, standard: "CRYSTALS-Kyber",    nist: "ML-KEM-1024", grade: "Maximum",   bits: 256 },
  "ML-KEM-512": { level: 1, standard: "NIST FIPS 203",     nist: "ML-KEM-512",  grade: "Standard",  bits: 128 },
  "ML-KEM-768": { level: 3, standard: "NIST FIPS 203",     nist: "ML-KEM-768",  grade: "High",      bits: 192 },
  "ML-KEM-1024":{ level: 5, standard: "NIST FIPS 203",     nist: "ML-KEM-1024", grade: "Maximum",   bits: 256 },
  "NTRU-HPS":   { level: 1, standard: "NTRU",              nist: "Round 3",     grade: "Legacy PQC", bits: 128 },
  "SABER":      { level: 3, standard: "SABER",             nist: "Round 3",     grade: "High",      bits: 192 },
};

const GRADE_COLORS = {
  "Maximum":   { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d" },
  "High":      { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
  "Standard":  { bg: "#faf5ff", border: "#e9d5ff", color: "#7c3aed" },
  "Legacy PQC":{ bg: "#fff7ed", border: "#fed7aa", color: "#c2410c" },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}>
      {label && <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111827" }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || "#374151" }}>{p.name}: <strong>{typeof p.value === "number" && p.value > 1000 ? fmtBytes(p.value) : p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Algorithms({ db }) {
  // Compute algorithm stats from sessions + traffic
  const algoMap = {};
  db.sessions.forEach(s => {
    const algo = s.kem_algorithm || "Unknown";
    if (!algoMap[algo]) algoMap[algo] = { name: algo, sessions: 0, bytes: 0, active: 0, states: {} };
    algoMap[algo].sessions++;
    if (s.tunnel_status?.toLowerCase() === "established") algoMap[algo].active++;

    const ks = s.kem_state || "unknown";
    algoMap[algo].states[ks] = (algoMap[algo].states[ks] || 0) + 1;

    const traffic = db.trafficStats.find(t => t.session_id === s.id);
    if (traffic) algoMap[algo].bytes += (traffic.bytes_sent || 0) + (traffic.bytes_received || 0);
  });

  const algoList = Object.values(algoMap).sort((a, b) => b.sessions - a.sessions);

  // KEM state distribution across all sessions
  const kemStateMap = {};
  db.sessions.forEach(s => {
    const ks = s.kem_state || "unknown";
    kemStateMap[ks] = (kemStateMap[ks] || 0) + 1;
  });
  const kemStateData = Object.entries(kemStateMap).map(([name, value]) => ({ name: fmtEventType(name), value }));

  // Session status distribution
  const statusMap = {};
  db.sessions.forEach(s => {
    const st = s.tunnel_status || "unknown";
    statusMap[st] = (statusMap[st] || 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name: fmtEventType(name), value }));

  const uniqueAlgos = algoList.length;
  const dominantAlgo = algoList[0]?.name ?? "—";
  const totalSessions = db.sessions.length;
  const highestGrade = algoList.find(a => ALGO_META[a.name]?.grade === "Maximum") ? "Maximum" :
                       algoList.find(a => ALGO_META[a.name]?.grade === "High") ? "High" : "Standard";

  return (
    <div>
      <PageHeader title="Algorithm Intelligence" subtitle="Post-Quantum Cryptography KEM analysis across active sessions" />

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard label="Unique Algorithms" value={uniqueAlgos} sub="KEM algorithms in use" accentColor="#7a0c10"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="6" height="4"/><rect x="16" y="3" width="6" height="4"/><rect x="9" y="10" width="6" height="4"/></svg>}
        />
        <StatCard label="Dominant Algorithm" value={dominantAlgo.split("-").slice(-1)[0] || dominantAlgo} sub={dominantAlgo} accentColor="#3b82f6"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
        />
        <StatCard label="Total Sessions" value={totalSessions} sub={`${algoList.reduce((a,c)=>a+c.active,0)} established`} accentColor="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="Highest Grade" value={highestGrade} sub="Maximum = NIST Level 5" accentColor="#8b5cf6"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>}
        />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <SectionCard title="Algorithm Distribution" subtitle="Session count per KEM algorithm">
          <div style={{ padding: "12px 16px 14px" }}>
            {algoList.length === 0 ? <EmptyState message="No algorithm data" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={algoList} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="sessions" nameKey="name">
                    {algoList.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Traffic by Algorithm" subtitle="Total bytes transferred per KEM algorithm">
          <div style={{ padding: "12px 16px 14px" }}>
            {algoList.length === 0 ? <EmptyState message="No traffic data" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={algoList} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                    tickFormatter={v => v.length > 10 ? v.slice(0, 10) + "…" : v} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={36}
                    tickFormatter={v => v > 0 ? fmtBytes(v, 0) : "0"} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="bytes" name="Traffic" radius={[5, 5, 0, 0]}>
                    {algoList.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <SectionCard title="KEM State Distribution" subtitle="Current key encapsulation states across sessions">
          <div style={{ padding: "12px 16px 14px" }}>
            {kemStateData.length === 0 ? <EmptyState message="No KEM state data" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={kemStateData} layout="vertical" barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="value" name="Sessions" radius={[0, 5, 5, 0]}>
                    {kemStateData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Tunnel Status Split" subtitle="Active vs inactive tunnel breakdown">
          <div style={{ padding: "12px 16px 14px" }}>
            {statusData.length === 0 ? <EmptyState message="No session data" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value" nameKey="name">
                    {statusData.map((entry, i) => {
                      const statusColorMap = { established: "#10b981", inactive: "#9ca3af", reconnecting: "#f59e0b", blocked: "#dc2626" };
                      return <Cell key={i} fill={statusColorMap[entry.name] || COLORS[i % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Algorithm Details Table */}
      <SectionCard title="Algorithm Security Reference" subtitle="NIST PQC standardization info for active algorithms" description="NIST standardization status, security level, and cryptographic grade per algorithm">
        <TableHead cols={[
          { label: "Algorithm",    w: "160px" },
          { label: "NIST Name",    w: "140px" },
          { label: "Standard",     w: "170px" },
          { label: "Security Lvl", w: "110px" },
          { label: "Sec. Bits",    w: "100px" },
          { label: "Grade",        w: "120px" },
          { label: "Sessions",     w: "100px" },
          { label: "Traffic",      w: "1fr"   },
        ]} />
        {algoList.length === 0 ? <EmptyState message="No algorithm data available" /> : (
          algoList.map((algo, i) => {
            const meta = ALGO_META[algo.name];
            const grade = meta?.grade ?? "Unknown";
            const gc = GRADE_COLORS[grade] ?? GRADE_COLORS["Standard"];
            return (
              <TableRow key={algo.name} last={i === algoList.length - 1} cols={[
                { val: algo.name, w: "160px", mono: true, bold: true, color: "#111827" },
                { val: meta?.nist ?? "—", w: "140px", mono: true, muted: !meta },
                { val: meta?.standard ?? "—", w: "170px" },
                { val: meta ? `Level ${meta.level}` : "—", w: "110px", mono: true,
                  color: meta?.level === 5 ? "#15803d" : meta?.level === 3 ? "#1d4ed8" : "#6b7280" },
                { val: meta ? `${meta.bits}-bit` : "—", w: "100px", mono: true, muted: !meta },
                {
                  node: (
                    <span style={{ background: gc.bg, color: gc.color, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, border: `1px solid ${gc.border}`, whiteSpace: "nowrap" }}>
                      {grade}
                    </span>
                  ),
                  w: "120px",
                },
                { val: String(algo.sessions), w: "100px", mono: true, color: "#7a0c10" },
                { val: fmtBytes(algo.bytes), w: "1fr", mono: true, muted: true },
              ]} />
            );
          })
        )}
      </SectionCard>
    </div>
  );
}
