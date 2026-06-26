"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { StatusBadge, StatCard, SectionCard, TableHead, TableRow, EmptyState, PageHeader } from "../DashboardUI";
import { fmtBytes, fmtEventType } from "../../lib/fmt";

const COLORS = ["#7a0c10", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316"];
const ACTIVE_STATUSES = new Set(["established", "connected", "active", "connecting", "reconnecting", "handshake"]);

const PAGE_SIZE = 50;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}>
      {label && <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111827" }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || "#374151" }}>
          {p.name}: <strong>{typeof p.value === "number" && p.value > 1000 ? fmtBytes(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Gateway({ db }) {
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [db.tunnelStates.length]);

  // ── Stats ──
  const totalActiveTunnels = db.tunnelStates.filter(t => ACTIVE_STATUSES.has(t.status?.toLowerCase())).length;
  const totalMissedHBs     = db.tunnelStates.reduce((a, t) => a + (t.missed_heartbeats || 0), 0);
  const totalTraffic       = db.trafficStats.reduce((a, t) => a + (t.bytes_sent || 0) + (t.bytes_received || 0), 0);

  // ── KEM algorithm distribution (from sessions) ──
  const algoMap = {};
  db.sessions.forEach(s => {
    const algo = s.kem_algorithm || "Unknown";
    algoMap[algo] = (algoMap[algo] || 0) + 1;
  });
  const algoChartData = Object.entries(algoMap).map(([name, value]) => ({ name, value }));

  // ── Tunnel status distribution ──
  const statusMap = {};
  db.tunnelStates.forEach(t => {
    const s = t.status || "unknown";
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const statusChartData = Object.entries(statusMap).map(([name, value]) => ({ name: fmtEventType(name), value }));

  // ── Pagination ──
  const total      = db.tunnelStates.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const pageSlice  = db.tunnelStates.slice(start, start + PAGE_SIZE);

  if (total === 0) {
    return (
      <div>
        <PageHeader title="Gateway Overview" subtitle="Tunnel and session details" />
        <EmptyState message="No tunnel state records found" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Gateway Overview" subtitle="Per-gateway tunnel distribution, traffic, and health — derived from tunnel states" />

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {/* <StatCard
          label="Gateways Detected" value={totalGateways}
          sub="Unique remote endpoints"
          accentColor="#7a0c10"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>}
        /> */}
        <StatCard
          label="Active Tunnels" value={totalActiveTunnels}
          sub={`${db.tunnelStates.length} total tunnel states`}
          accentColor="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <StatCard
          label="Total Traffic" value={fmtBytes(totalTraffic)}
          sub="Across all gateways"
          accentColor="#3b82f6"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        />
        <StatCard
          label="Missed Heartbeats" value={totalMissedHBs}
          sub="Cumulative across gateways"
          accentColor={totalMissedHBs > 0 ? "#dc2626" : "#10b981"}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
      </div>

      {/* ── Traffic chart ──
      {trafficChartData.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionCard title="Traffic per Gateway" subtitle="Bytes sent vs received per remote endpoint">
            <div style={{ padding: "12px 16px 14px" }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trafficChartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={50} tickFormatter={v => fmtBytes(v, 0)} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="sent" name="Sent" stackId="a" fill="#7a0c10" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="recv" name="Received" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      )} */}

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14, alignItems: "start" }}>
        <SectionCard title="KEM Algorithm Distribution">
          <div style={{ padding: "12px 16px 14px" }}>
            {algoChartData.length === 0 ? <EmptyState message="No algorithm data" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={algoChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" nameKey="name">
                    {algoChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Tunnel Status Distribution">
          <div style={{ padding: "12px 16px 14px" }}>
            {statusChartData.length === 0 ? <EmptyState message="No status data" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={statusChartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="value" name="Tunnels" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, i) => {
                      const c = entry.name?.toLowerCase().includes("active") || entry.name?.toLowerCase().includes("established") || entry.name?.toLowerCase().includes("connected") ? "#10b981"
                              : entry.name?.toLowerCase().includes("disconnect") || entry.name?.toLowerCase().includes("timeout") ? "#dc2626"
                              : COLORS[i % COLORS.length];
                      return <Cell key={i} fill={c} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Combined Tunnel + Session Table ── */}
      <SectionCard
        title="Tunnel & Session Details"
        subtitle={`${total.toLocaleString()} records`}
        description="Matched tunnel states with KEM session, traffic, and heartbeat data"
      >
        <TableHead cols={[
          { label: "Client",       w: "160px" },
          { label: "Remote IP",    w: "130px" },
          { label: "Virtual IP",   w: "130px" },
          { label: "KEM Algo",     w: "140px" },
          { label: "KEM State",    w: "120px" },
          { label: "Traffic",      w: "110px" },
          { label: "Missed HBs",   w: "100px" },
          { label: "Status",       w: "1fr"   },
        ]} />

        {pageSlice.map((t, i) => {
          const session = db.sessions.find(s => s.id === t.session_id);
          const client  = session ? db.clients.find(c => c.id === session.client_id) : null;
          const traffic = session ? db.trafficStats.find(tr => tr.session_id === session.id) : null;
          const bytes   = traffic ? (traffic.bytes_sent || 0) + (traffic.bytes_received || 0) : 0;

          return (
            <TableRow key={t.id || i} last={i === pageSlice.length - 1} cols={[
              { val: client?.client_identifier ?? session?.client_id?.slice(0, 12) ?? "—", w: "160px", mono: true, bold: true, color: "#111827" },
              { val: t.remote_ip ?? "—",             w: "130px", mono: true, muted: true },
              { val: t.assigned_virtual_ip ?? "—",   w: "130px", mono: true, color: "#1d4ed8" },
              { val: session?.kem_algorithm ?? "—",  w: "140px", mono: true },
              { val: session?.kem_state ?? "—",      w: "120px", muted: true },
              { val: bytes > 0 ? fmtBytes(bytes) : "—", w: "110px", mono: true, muted: true },
              {
                val: String(t.missed_heartbeats || 0),
                w: "100px", mono: true,
                color: t.missed_heartbeats > 0 ? "#dc2626" : "#10b981",
              },
              { node: <StatusBadge value={t.status} />, w: "1fr" },
            ]} />
          );
        })}

        {/* Pagination footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 24px",
          borderTop: "1px solid #f3f4f6",
          background: "#fafafa",
        }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            Showing <strong style={{ color: "#111827" }}>{start + 1}–{Math.min(start + PAGE_SIZE, total)}</strong> of{" "}
            <strong style={{ color: "#111827" }}>{total.toLocaleString()}</strong> records
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb",
                background: safePage === 1 ? "#f9fafb" : "#ffffff",
                color: safePage === 1 ? "#d1d5db" : "#374151",
                cursor: safePage === 1 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s",
              }}
              onMouseOver={e => { if (safePage !== 1) { e.currentTarget.style.borderColor = "#7a0c10"; e.currentTarget.style.color = "#7a0c10"; } }}
              onMouseOut={e => { if (safePage !== 1) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize: 13, color: "#374151", padding: "0 8px", fontWeight: 500 }}>
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{
                width: 30, height: 30, borderRadius: 6, border: "1px solid #e5e7eb",
                background: safePage === totalPages ? "#f9fafb" : "#ffffff",
                color: safePage === totalPages ? "#d1d5db" : "#374151",
                cursor: safePage === totalPages ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s",
              }}
              onMouseOver={e => { if (safePage !== totalPages) { e.currentTarget.style.borderColor = "#7a0c10"; e.currentTarget.style.color = "#7a0c10"; } }}
              onMouseOut={e => { if (safePage !== totalPages) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
