"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { StatusBadge, StatCard, SectionCard, TableHead, TableRow, EmptyState, PageHeader, ViewToggle, MiniBar } from "../DashboardUI";
import { fmtBytes, shortId } from "../../lib/fmt";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111827" }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ margin: 0, color: p.color }}>{p.name}: <strong>{fmtBytes(p.value)}</strong></p>)}
    </div>
  );
};

export default function Sessions({ db }) {
  const [showAll, setShowAll] = useState(false);
  const displayedSessions = showAll ? db.sessions : db.sessions.slice(0, 8);

  const ACTIVE_STATUSES = new Set(["established", "connected", "active", "connecting", "reconnecting", "handshake"]);
  const activeSessions   = db.sessions.filter(s => ACTIVE_STATUSES.has(s.tunnel_status?.toLowerCase())).length;
  const inactiveSessions = db.sessions.filter(s => !ACTIVE_STATUSES.has(s.tunnel_status?.toLowerCase())).length;
  const totalTraffic    = db.trafficStats.reduce((a, t) => a + (t.bytes_received || 0) + (t.bytes_sent || 0), 0);

  // Top clients by traffic
  const clientTraffic = db.clients.map(c => {
    const clientSessions = db.sessions.filter(s => s.client_id === c.id);
    const bytes = clientSessions.reduce((acc, s) => {
      const t = db.trafficStats.find(t => t.session_id === s.id);
      return acc + (t ? (t.bytes_sent || 0) + (t.bytes_received || 0) : 0);
    }, 0);
    return { name: c.client_identifier?.slice(0, 14) ?? shortId(c.id), bytes };
  }).filter(c => c.bytes > 0).sort((a,b) => b.bytes - a.bytes).slice(0, 8);

  return (
    <div>
      <PageHeader title="Active Sessions" subtitle="Quantum-resistant key encapsulation and live traffic telemetry" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard label="Total Sessions"  value={db.sessions.length} sub="All sessions" accentColor="#7a0c10"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <StatCard label="Established"     value={activeSessions}     sub="Active tunnels" accentColor="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <StatCard label="Inactive"        value={inactiveSessions}   sub="Not established" accentColor="#9ca3af"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
        />
        <StatCard label="Total Traffic"   value={fmtBytes(totalTraffic)} sub="All sessions combined" accentColor="#3b82f6"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <SectionCard title="Traffic by Client" subtitle="Top clients ranked by data volume">
          <div style={{ padding: "12px 16px 14px" }}>
            {clientTraffic.length === 0 ? <EmptyState message="No traffic data" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={clientTraffic} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40} tickFormatter={v => fmtBytes(v,0)} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="bytes" name="Traffic" radius={[5,5,0,0]}>
                    {clientTraffic.map((_,i) => <Cell key={i} fill={["#7a0c10","#10b981","#3b82f6","#f59e0b","#8b5cf6"][i%5]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Per-Session Traffic Breakdown" subtitle="Individual session data volumes">
          <div style={{ padding: "12px 16px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
            {db.sessions.length === 0 ? <EmptyState message="No sessions" /> : (
              db.sessions.slice(0, 5).map(s => {
                const client  = db.clients.find(c => c.id === s.client_id);
                const traffic = db.trafficStats.find(t => t.session_id === s.id);
                const total   = (traffic?.bytes_sent || 0) + (traffic?.bytes_received || 0);
                const maxBytes = Math.max(...db.trafficStats.map(t => (t.bytes_sent||0)+(t.bytes_received||0)), 1);
                return (
                  <div key={s.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "#374151", fontFamily: "var(--font-mono,monospace)", fontWeight: 500 }}>
                        {client?.client_identifier ?? shortId(s.id) ?? "—"}
                      </span>
                      <span style={{ fontSize: 12, color: "#7a0c10", fontWeight: 700 }}>{fmtBytes(total)}</span>
                    </div>
                    <MiniBar value={Math.round((total/maxBytes)*100)} color={ACTIVE_STATUSES.has(s.tunnel_status?.toLowerCase()) ? "#10b981" : "#9ca3af"} />
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Secure PQC Tunnels"
        subtitle="KEM algorithm, state, and live traffic per session"
        action={<ViewToggle expanded={showAll} onToggle={() => setShowAll(v=>!v)} />}
      >
        <TableHead cols={[
          { label: "Client ID", w: "160px" }, { label: "KEM Algorithm", w: "160px" },
          { label: "KEM State", w: "130px" }, { label: "Sent", w: "100px" },
          { label: "Recv", w: "100px" },      { label: "Status", w: "1fr" },
        ]} />
        {db.sessions.length === 0 ? <EmptyState message="No sessions found" /> : (
          displayedSessions.map((s, i) => {
            const client  = db.clients.find(c => c.id === s.client_id) || { client_identifier: s.client_id };
            const traffic = db.trafficStats.find(t => t.session_id === s.id) || { bytes_sent: 0, bytes_received: 0 };
            return (
              <TableRow key={s.id||i} last={i===displayedSessions.length-1} cols={[
                { val: client.client_identifier, w: "160px", mono: true, bold: true, color: "#111827" },
                { val: s.kem_algorithm, w: "160px", mono: true },
                { val: s.kem_state, w: "130px", muted: true },
                { val: fmtBytes(traffic.bytes_sent), w: "100px", muted: true, mono: true },
                { val: fmtBytes(traffic.bytes_received), w: "100px", muted: true, mono: true },
                { node: <StatusBadge value={s.tunnel_status} />, w: "1fr" },
              ]} />
            );
          })
        )}
      </SectionCard>
    </div>
  );
}
