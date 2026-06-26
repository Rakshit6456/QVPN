"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { StatusBadge, StatCard, SectionCard, TableHead, TableRow, EmptyState, PageHeader } from "../DashboardUI";
import { fmtTime, shortId, fmtEventType } from "../../lib/fmt";

const COLORS = ["#dc2626","#10b981","#f59e0b","#3b82f6","#8b5cf6"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 14px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)",fontSize:12 }}>
      {label && <p style={{margin:"0 0 6px",fontWeight:700,color:"#111827"}}>{label}</p>}
      {payload.map((p,i)=><p key={i} style={{margin:0,color:p.color||"#374151"}}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

const PAGE_SIZE = 100;

export default function NetworkActivities({ db }) {
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [db.networkActivities.length]);

  const totalRecords = db.networkActivities.length;
  const totalPages   = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safePage     = Math.min(page, totalPages);
  const start        = (safePage - 1) * PAGE_SIZE;
  const displayedActivities = db.networkActivities.slice(start, start + PAGE_SIZE);

  const blockedCount  = db.networkActivities.filter(n => n.event_type?.toLowerCase() === "blocked").length;
  const allowedCount  = db.networkActivities.filter(n => n.event_type?.toLowerCase() === "allowed").length;
  const getDestIp = (n) => n.details?.remote_ip || n.details?.dest_ip || n.dest_ip;
  const uniqueIPs = new Set(db.networkActivities.map(getDestIp).filter(Boolean)).size;

  const eventMap = db.networkActivities.reduce((acc, n) => {
    const k = n.event_type || "unknown";
    acc[k] = (acc[k]||0)+1; return acc;
  }, {});
  const eventData = Object.entries(eventMap).map(([name, value]) => ({ name: fmtEventType(name), value }));

  const ipMap = db.networkActivities.reduce((acc, n) => {
    const ip = getDestIp(n);
    if (ip) { acc[ip] = (acc[ip]||0)+1; }
    return acc;
  }, {});
  const topIPs = Object.entries(ipMap).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,value])=>({name,value}));

  return (
    <div>
      <PageHeader title="Network Activities" subtitle="Security traffic audit — blocks, allows, and destination tracking" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard label="Total Events"  value={db.networkActivities.length} sub="All network events" accentColor="#7a0c10"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
        />
        <StatCard label="Threats Blocked" value={blockedCount} sub="Blocked connections" accentColor="#dc2626"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
        />
        <StatCard label="Allowed"       value={allowedCount} sub="Passed traffic" accentColor="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <StatCard label="Unique Dest IPs" value={uniqueIPs} sub="Distinct destinations" accentColor="#3b82f6"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <SectionCard title="Event Type Distribution" subtitle="Breakdown of all network event categories">
          <div style={{ padding: "12px 16px 14px" }}>
            {eventData.length === 0 ? <EmptyState message="No events" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={eventData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {eventData.map((entry, i) => {
                      const c = entry.name==="blocked"?"#dc2626":entry.name==="allowed"?"#10b981":COLORS[i%COLORS.length];
                      return <Cell key={i} fill={c} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12,paddingTop:8}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Top Destination IPs" subtitle="Most frequently targeted IP addresses">
          <div style={{ padding: "12px 16px 14px" }}>
            {topIPs.length === 0 ? <EmptyState message="No IP data" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topIPs} layout="vertical" barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:"#374151",fontFamily:"monospace"}} axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill:"#f9fafb"}} />
                  <Bar dataKey="value" name="Hits" radius={[0,5,5,0]} fill="#7a0c10" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Traffic Audit Log"
        subtitle={`Full event history from network_activities — ${totalRecords.toLocaleString()} total`}
      >
        <TableHead cols={[
          { label: "Timestamp", w: "170px" }, { label: "Client ID", w: "150px" },
          { label: "Dest IP",   w: "160px" }, { label: "Event",    w: "150px" },
          { label: "Reason",    w: "1fr"   },
        ]} />
        {totalRecords === 0 ? <EmptyState message="No activities found" /> : (
          displayedActivities.map((n, i) => {
            const client = db.clients.find(c => c.id === n.client_id);
            const destIp = n.details?.remote_ip || n.details?.dest_ip || n.dest_ip || "—";
            const remotePort = n.details?.remote_port;
            const destDisplay = remotePort ? `${destIp}:${remotePort}` : destIp;
            const pid = n.details?.pid;
            const detail = pid ? `PID ${pid}` : (n.details?.reason || n.reason || "—");
            return (
              <TableRow key={n.id||i} last={i===displayedActivities.length-1} cols={[
                { val: fmtTime(n.timestamp) ?? "—", w:"170px", muted:true, mono:true },
                { val: client?.client_identifier ?? shortId(n.client_id) ?? "—", w:"150px", mono:true },
                { val: destDisplay, w:"160px", mono:true },
                { node: <StatusBadge value={n.event_type} />, w:"150px" },
                { val: detail, w:"1fr", muted:true },
              ]} />
            );
          })
        )}

        {/* Pagination footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 24px",
          borderTop: "1px solid #f3f4f6",
          background: "#fafafa",
        }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            Showing Page <strong style={{ color: "#111827" }}>{safePage}</strong> of{" "}
            <strong style={{ color: "#111827" }}>{totalPages}</strong>{" "}
            ({totalRecords.toLocaleString()} events total)
          </span>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                width: 30, height: 30, borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: safePage === 1 ? "#f9fafb" : "#ffffff",
                color: safePage === 1 ? "#d1d5db" : "#374151",
                cursor: safePage === 1 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.12s",
              }}
              onMouseOver={(e) => { if (safePage !== 1) { e.currentTarget.style.borderColor = "#7a0c10"; e.currentTarget.style.color = "#7a0c10"; } }}
              onMouseOut={(e) => { if (safePage !== 1) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{
                width: 30, height: 30, borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: safePage === totalPages ? "#f9fafb" : "#ffffff",
                color: safePage === totalPages ? "#d1d5db" : "#374151",
                cursor: safePage === totalPages ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.12s",
              }}
              onMouseOver={(e) => { if (safePage !== totalPages) { e.currentTarget.style.borderColor = "#7a0c10"; e.currentTarget.style.color = "#7a0c10"; } }}
              onMouseOut={(e) => { if (safePage !== totalPages) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
