"use client";

import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { StatusBadge, StatCard, SectionCard, TableHead, TableRow, EmptyState, PageHeader, ViewToggle } from "../DashboardUI";
import { fmtTime, fmtBytes, shortId, fmtDetails, fmtEventType } from "../../lib/fmt";

const COLORS = ["#7a0c10", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}>
      {label && <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111827" }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || "#374151" }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Overview({ db, activeSessions, activeKeys, totalDown, totalUp, blockedCount, getClientNameBySession }) {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllNetwork, setShowAllNetwork] = useState(false);

  const displayedEvents  = showAllEvents  ? db.tunnelEvents      : db.tunnelEvents.slice(0, 6);
  const displayedNetwork = showAllNetwork ? db.networkActivities : db.networkActivities.slice(0, 6);

  // Chart data: tunnel event types
  const eventTypeCounts = db.tunnelEvents.reduce((acc, e) => {
    const k = e.event_type || "unknown";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const eventChartData = Object.entries(eventTypeCounts).map(([name, value]) => ({ name: fmtEventType(name), value }));

  // Chart data: network activity types
  const netTypeCounts = db.networkActivities.reduce((acc, n) => {
    const k = n.event_type || "unknown";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const netChartData = Object.entries(netTypeCounts).map(([name, value]) => ({ name: fmtEventType(name), value }));

  return (
    <div>
      <PageHeader title="Admin Overview" subtitle="Real-time monitoring — all data mapped to Supabase schemas" />

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard
          label="Active Tunnels" value={activeSessions}
          sub={`${db.sessions.length} total sessions`}
          accentColor="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <StatCard
          label="Active API Keys" value={activeKeys}
          sub={`${db.apiKeys.length} total keys`}
          accentColor="#7a0c10"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>}
        />
        <StatCard
          label="Data Transferred" value={fmtBytes(totalDown)}
          sub={`${fmtBytes(totalUp)} sent`}
          accentColor="#3b82f6"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        />
        <StatCard
          label="Device Events" value={db.deviceEvents.length}
          sub={`${new Set(db.deviceEvents.map(d => d.client_id).filter(Boolean)).size} unique clients`}
          accentColor="#8b5cf6"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <SectionCard title="Tunnel Event Distribution" subtitle="Breakdown of recent tunnel event types">
          <div style={{ padding: "12px 16px 14px" }}>
            {eventChartData.length === 0 ? (
              <EmptyState message="No event data available" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={eventChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {eventChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Network Activity Breakdown" subtitle="Traffic classification from network_activities">
          <div style={{ padding: "12px 16px 14px" }}>
            {netChartData.length === 0 ? (
              <EmptyState message="No network data available" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={netChartData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {netChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <SectionCard
          title="Recent Tunnel Events"
          subtitle="Latest connection state changes"
          description="Latest connection state changes across all tunnels"
          action={<ViewToggle expanded={showAllEvents} onToggle={() => setShowAllEvents(v => !v)} />}
        >
          <TableHead cols={[{ label: "Time", w: "160px" }, { label: "Status", w: "150px" }, { label: "Client", w: "1fr" }]} />
          {db.tunnelEvents.length === 0 ? <EmptyState message="No tunnel events found" /> : (
            displayedEvents.map((e, i) => (
              <TableRow key={e.id || i} last={i === displayedEvents.length - 1} cols={[
                { val: fmtTime(e.occurred_at) ?? "—", w: "160px", muted: true, mono: true },
                { node: <StatusBadge value={e.event_type} />, w: "150px" },
                { val: e.details?.client_identifier || getClientNameBySession(e.session_id), w: "1fr", mono: true },
              ]} />
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Network Activities"
          subtitle="Security events from network_activities"
          description="Inbound and outbound events with destination IPs and verdicts"
          action={<ViewToggle expanded={showAllNetwork} onToggle={() => setShowAllNetwork(v => !v)} />}
        >
          <TableHead cols={[{ label: "Time", w: "160px" }, { label: "Dest IP", w: "140px" }, { label: "Status", w: "1fr" }]} />
          {db.networkActivities.length === 0 ? <EmptyState message="No network activity" /> : (
            displayedNetwork.map((n, i) => (
              <TableRow key={n.id || i} last={i === displayedNetwork.length - 1} cols={[
                { val: fmtTime(n.timestamp) ?? "—", w: "160px", muted: true, mono: true },
                { val: n.details?.remote_ip || n.details?.dest_ip || "—", w: "140px", mono: true },
                { node: <StatusBadge value={n.event_type} />, w: "1fr" },
              ]} />
            ))
          )}
        </SectionCard>
      </div>
    </div>
  );
}
