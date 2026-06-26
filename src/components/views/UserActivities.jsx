"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { StatusBadge, StatCard, SectionCard, TableHead, TableRow, EmptyState, PageHeader, ViewToggle } from "../DashboardUI";
import { fmtTime, fmtDetails, shortId, fmtEventType } from "../../lib/fmt";

const COLORS = ["#10b981","#dc2626","#3b82f6","#8b5cf6","#f59e0b","#7a0c10"];

const CustomTooltip = ({ active, payload }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 14px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)",fontSize:12 }}>
      {payload.map((p,i)=><p key={i} style={{margin:0,color:p.fill||"#374151"}}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

export default function UserActivities({ db }) {
  const [showAll, setShowAll] = useState(false);
  const displayedActivities = showAll ? db.userActivities : db.userActivities.slice(0, 8);

  const signIns    = db.userActivities.filter(u => ["user_signed_in", "login_success", "login"].includes(u.event_type)).length;
  const failures   = db.userActivities.filter(u => u.event_type?.toLowerCase().includes("fail")).length;
  const uniqueUsers = new Set(db.userActivities.map(u => u.username).filter(Boolean)).size;

  const eventMap = db.userActivities.reduce((acc, u) => {
    const k = u.event_type || "unknown";
    acc[k] = (acc[k]||0)+1; return acc;
  }, {});
  const eventData = Object.entries(eventMap).map(([name, value]) => ({ name: fmtEventType(name), value }));

  return (
    <div>
      <PageHeader title="User Activities" subtitle="Authentication events, configuration changes, and access logs" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard label="Total Events"   value={db.userActivities.length} sub="All user events" accentColor="#7a0c10"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="Successful Logins" value={signIns} sub="Authenticated sessions" accentColor="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <StatCard label="Failed Attempts"  value={failures} sub="Auth failures" accentColor="#dc2626"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
        />
        <StatCard label="Unique Users"    value={uniqueUsers} sub="Distinct accounts" accentColor="#3b82f6"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 14, marginBottom: 14 }}>
        <SectionCard title="Activity Distribution" subtitle="Event types breakdown">
          <div style={{ padding: "12px 16px 14px" }}>
            {eventData.length === 0 ? <EmptyState message="No data" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={eventData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {eventData.map((entry,i) => {
                      const c = entry.name?.includes("fail") ? "#dc2626" : entry.name?.includes("sign") ? "#10b981" : COLORS[i%COLORS.length];
                      return <Cell key={i} fill={c} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,paddingTop:8}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Action Logs"
          subtitle="Full user event history"
          action={<ViewToggle expanded={showAll} onToggle={() => setShowAll(v=>!v)} />}
        >
          <TableHead cols={[
            { label: "Timestamp", w: "165px" }, { label: "Username", w: "150px" },
            { label: "Client", w: "150px" },    { label: "Event", w: "150px" },
            { label: "Details", w: "1fr" },
          ]} />
          {db.userActivities.length === 0 ? <EmptyState message="No user activities" /> : (
            displayedActivities.map((u, i) => {
              const client = db.clients.find(c => c.id === u.client_id) || { client_identifier: u.client_id };
              const eventId = u.details?.windows_event_id;
              const detail = eventId
                ? `Windows Event ID: ${eventId}`
                : fmtDetails(u.details);
              const displayUser = u.username && u.username !== "UNKNOWN"
                ? u.username
                : (u.details?.raw?.username ?? u.username ?? "—");
              return (
                <TableRow key={u.id||i} last={i===displayedActivities.length-1} cols={[
                  { val: fmtTime(u.timestamp) ?? "—", w:"165px", muted:true, mono:true },
                  { val: displayUser, w:"150px", bold:true, color:"#111827" },
                  { val: client.client_identifier ?? shortId(u.client_id), w:"150px", mono:true },
                  { node: <StatusBadge value={u.event_type} />, w:"150px" },
                  { val: detail ?? "—", w:"1fr", muted:true },
                ]} />
              );
            })
          )}
        </SectionCard>
      </div>
    </div>
  );
}
