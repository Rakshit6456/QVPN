"use client";

import { useState, useEffect } from "react";
import { StatusBadge, StatCard, SectionCard, TableHead, TableRow, EmptyState, PageHeader, ViewToggle } from "../DashboardUI";
import { fmtTime, fmtDetails } from "../../lib/fmt";

const PAGE_SIZE = 50;

export default function Tunnels({ db, getClientNameBySession }) {
  const [statePage, setStatePage] = useState(1);
  const [showAllEvents, setShowAllEvents] = useState(false);

  useEffect(() => { setStatePage(1); }, [db.tunnelStates.length]);

  const totalStates      = db.tunnelStates.length;
  const totalStatePages  = Math.max(1, Math.ceil(totalStates / PAGE_SIZE));
  const safeStatePage    = Math.min(statePage, totalStatePages);
  const stateStart       = (safeStatePage - 1) * PAGE_SIZE;
  const displayedStates  = db.tunnelStates.slice(stateStart, stateStart + PAGE_SIZE);

  const displayedEvents  = showAllEvents ? db.tunnelEvents : db.tunnelEvents.slice(0, 8);

  const activeStates    = db.tunnelStates.filter(t => ["active","connected"].includes(t.status?.toLowerCase())).length;
  const missedHBTotal   = db.tunnelStates.reduce((a,t) => a + (t.missed_heartbeats||0), 0);
  const disconnected    = db.tunnelStates.filter(t => ["disconnected","timed_out"].includes(t.status?.toLowerCase())).length;

  return (
    <div>
      <PageHeader title="Tunnel States & Events" subtitle="Live connectivity, heartbeats, and detailed event log" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard label="Tunnel Events" value={db.tunnelEvents.length} sub={`${db.tunnelStates.length} state records`} accentColor="#7a0c10"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <StatCard label="Active Tunnels" value={activeStates} sub={`${disconnected} disconnected`} accentColor="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <StatCard label="Tunnel States" value={db.tunnelStates.length} sub="Total state records" accentColor="#3b82f6"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard label="Missed Heartbeats" value={missedHBTotal} sub="Across all tunnels" accentColor={missedHBTotal > 0 ? "#dc2626" : "#10b981"}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionCard
          title="Live Tunnel Connectivity"
          subtitle={`Assigned IPs, heartbeat status, and remote endpoints — ${totalStates.toLocaleString()} total`}
        >
          <TableHead cols={[
            { label: "Client ID", w: "160px" }, { label: "Remote IP", w: "145px" },
            { label: "Virtual IP", w: "130px" }, { label: "Missed HBs", w: "115px" },
            { label: "Status", w: "1fr" },
          ]} />
          {totalStates === 0 ? <EmptyState message="No tunnel state records" /> : (
            displayedStates.map((t, i) => (
              <TableRow key={t.id||i} last={i===displayedStates.length-1} cols={[
                { val: getClientNameBySession(t.session_id), w: "160px", mono: true, bold: true, color: "#111827" },
                { val: t.remote_ip, w: "145px", mono: true },
                { val: t.assigned_virtual_ip, w: "130px", mono: true, color: "#1d4ed8" },
                { val: String(t.missed_heartbeats || 0), w: "115px", mono: true, color: t.missed_heartbeats > 0 ? "#dc2626" : "#10b981" },
                { node: <StatusBadge value={t.status} />, w: "1fr" },
              ]} />
            ))
          )}

          {/* Pagination footer */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 24px",
            borderTop: "1px solid #f3f4f6",
            background: "#fafafa",
          }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Showing <strong style={{ color: "#111827" }}>{stateStart + 1}–{Math.min(stateStart + PAGE_SIZE, totalStates)}</strong> of{" "}
              <strong style={{ color: "#111827" }}>{totalStates.toLocaleString()}</strong> records
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setStatePage(p => Math.max(1, p - 1))}
                disabled={safeStatePage === 1}
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: safeStatePage === 1 ? "#f9fafb" : "#ffffff",
                  color: safeStatePage === 1 ? "#d1d5db" : "#374151",
                  cursor: safeStatePage === 1 ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.12s",
                }}
                onMouseOver={e => { if (safeStatePage !== 1) { e.currentTarget.style.borderColor = "#7a0c10"; e.currentTarget.style.color = "#7a0c10"; } }}
                onMouseOut={e => { if (safeStatePage !== 1) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; } }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span style={{ fontSize: 13, color: "#374151", padding: "0 8px", display: "flex", alignItems: "center", fontWeight: 500 }}>
                {safeStatePage} / {totalStatePages}
              </span>
              <button
                onClick={() => setStatePage(p => Math.min(totalStatePages, p + 1))}
                disabled={safeStatePage === totalStatePages}
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: safeStatePage === totalStatePages ? "#f9fafb" : "#ffffff",
                  color: safeStatePage === totalStatePages ? "#d1d5db" : "#374151",
                  cursor: safeStatePage === totalStatePages ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.12s",
                }}
                onMouseOver={e => { if (safeStatePage !== totalStatePages) { e.currentTarget.style.borderColor = "#7a0c10"; e.currentTarget.style.color = "#7a0c10"; } }}
                onMouseOut={e => { if (safeStatePage !== totalStatePages) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; } }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Tunnel Event Log"
          subtitle="Connection events, handshakes, and key rotation history"
          action={<ViewToggle expanded={showAllEvents} onToggle={() => setShowAllEvents(v=>!v)} />}
        >
          <TableHead cols={[
            { label: "Timestamp", w: "170px" }, { label: "Client", w: "160px" },
            { label: "Event", w: "160px" },     { label: "Details", w: "1fr" },
          ]} />
          {db.tunnelEvents.length === 0 ? <EmptyState message="No tunnel events" /> : (
            displayedEvents.map((e, i) => (
              <TableRow key={e.id||i} last={i===displayedEvents.length-1} cols={[
                { val: fmtTime(e.occurred_at) ?? "—", w: "170px", muted: true, mono: true },
                { val: e.details?.client_identifier || getClientNameBySession(e.session_id), w: "160px", mono: true },
                { node: <StatusBadge value={e.event_type} />, w: "160px" },
                { val: e.details?.algorithm ? `Algorithm: ${e.details.algorithm}` : (fmtDetails(e.details) ?? "—"), w: "1fr", muted: true },
              ]} />
            ))
          )}
        </SectionCard>
      </div>
    </div>
  );
}
