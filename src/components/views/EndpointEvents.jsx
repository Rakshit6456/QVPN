"use client";

import { useState } from "react";
import { StatusBadge, StatCard, SectionCard, TableHead, TableRow, EmptyState, PageHeader, ViewToggle } from "../DashboardUI";
import { fmtTime, shortId } from "../../lib/fmt";

export default function EndpointEvents({ db, getClientNameBySession }) {
  const [showAllDevice,  setShowAllDevice]  = useState(false);
  const [showAllProcess, setShowAllProcess] = useState(false);
  const [showAllHB,      setShowAllHB]      = useState(false);

  const displayedDevice  = showAllDevice  ? db.deviceEvents  : db.deviceEvents.slice(0, 8);
  const displayedProcess = showAllProcess ? db.processEvents : db.processEvents.slice(0, 8);
  const displayedHB      = showAllHB      ? db.heartbeats.slice(0, 100) : db.heartbeats.slice(0, 8);

  const getClientName = (clientId) => {
    const c = db.clients.find(c => c.id === clientId);
    return c ? c.client_identifier : shortId(clientId) ?? "Unknown";
  };

  const uniqueDeviceClients  = new Set(db.deviceEvents.map(d => d.client_id).filter(Boolean)).size;
  const uniqueProcessClients = new Set(db.processEvents.map(p => p.client_id).filter(Boolean)).size;
  const totalPacketsSent     = db.heartbeats.reduce((a, h) => a + (h.packets_sent || 0), 0);
  const totalPacketsRecv     = db.heartbeats.reduce((a, h) => a + (h.packets_received || 0), 0);

  return (
    <div>
      <PageHeader title="Endpoint Events" subtitle="Device activity, process launches, and VPN heartbeat telemetry" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard
          label="Device Events" value={db.deviceEvents.length}
          sub={`${uniqueDeviceClients} client(s)`}
          accentColor="#0284c7"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
        />
        <StatCard
          label="Process Events" value={db.processEvents.length}
          sub={`${uniqueProcessClients} client(s)`}
          accentColor="#7c3aed"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>}
        />
        <StatCard
          label="Heartbeats" value={db.heartbeats.length}
          sub={`${db.heartbeats.length} records`}
          accentColor="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        />
        <StatCard
          label="Packets Sent" value={totalPacketsSent.toLocaleString()}
          sub={`${totalPacketsRecv.toLocaleString()} received`}
          accentColor="#f59e0b"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        />
      </div>

      {/* Device Events */}
      <div style={{ marginBottom: 14 }}>
        <SectionCard
          title="Device Events"
          subtitle="USB and hardware device insertions detected on endpoints"
          description="USB and hardware insertions detected on monitored endpoints"
          action={<ViewToggle expanded={showAllDevice} onToggle={() => setShowAllDevice(v => !v)} />}
        >
          <TableHead cols={[
            { label: "Timestamp",   w: "185px" },
            { label: "Client",      w: "160px" },
            { label: "Action",      w: "130px" },
            { label: "Hardware ID", w: "200px" },
            { label: "Device Client ID", w: "1fr" },
          ]} />
          {db.deviceEvents.length === 0 ? <EmptyState message="No device events recorded" /> : (
            displayedDevice.map((d, i) => (
              <TableRow key={d.id || i} last={i === displayedDevice.length - 1} cols={[
                { val: fmtTime(d.timestamp) ?? "—", w: "185px", muted: true, mono: true },
                { val: getClientName(d.client_id), w: "160px", mono: true, bold: true, color: "#111827" },
                { node: <StatusBadge value={d.action} />, w: "130px" },
                { val: d.device_info?.hardware_id ?? "—", w: "200px", mono: true },
                { val: d.device_info?.client_identifier ?? "—", w: "1fr", muted: true },
              ]} />
            ))
          )}
        </SectionCard>
      </div>

      {/* Process Events */}
      <div style={{ marginBottom: 14 }}>
        <SectionCard
          title="Process Events"
          subtitle="Processes launched or terminated on monitored endpoints"
          description="Processes launched or terminated on client endpoints"
          action={<ViewToggle expanded={showAllProcess} onToggle={() => setShowAllProcess(v => !v)} />}
        >
          <TableHead cols={[
            { label: "Timestamp",    w: "185px" },
            { label: "Client",       w: "160px" },
            { label: "Process Name", w: "200px" },
            { label: "PID",          w: "90px"  },
            { label: "Action",       w: "130px" },
          ]} />
          {db.processEvents.length === 0 ? <EmptyState message="No process events recorded" /> : (
            displayedProcess.map((p, i) => (
              <TableRow key={p.id || i} last={i === displayedProcess.length - 1} cols={[
                { val: fmtTime(p.timestamp) ?? "—", w: "185px", muted: true, mono: true },
                { val: getClientName(p.client_id), w: "160px", mono: true, bold: true, color: "#111827" },
                { val: p.process_name ?? "—", w: "200px", mono: true, color: "#374151" },
                { val: p.pid != null ? String(p.pid) : "—", w: "90px", mono: true, muted: true },
                { node: <StatusBadge value={p.action} />, w: "130px" },
              ]} />
            ))
          )}
        </SectionCard>
      </div>

      {/* Heartbeats */}
      <SectionCard
        title="VPN Heartbeats"
        subtitle="Session keepalive packets — sequence numbers and packet counters"
        description="Keepalive packets with sequence numbers and per-session counters"
        action={<ViewToggle expanded={showAllHB} onToggle={() => setShowAllHB(v => !v)} />}
      >
        <TableHead cols={[
          { label: "Timestamp",    w: "185px" },
          { label: "Client",       w: "180px" },
          { label: "Seq #",        w: "90px"  },
          { label: "Pkts Sent",    w: "110px" },
          { label: "Pkts Received",w: "1fr"   },
        ]} />
        {db.heartbeats.length === 0 ? <EmptyState message="No heartbeat records" /> : (
          displayedHB.map((h, i) => (
            <TableRow key={h.id || i} last={i === displayedHB.length - 1} cols={[
              { val: fmtTime(h.timestamp) ?? "—", w: "185px", muted: true, mono: true },
              { val: getClientNameBySession(h.session_id), w: "180px", mono: true, bold: true, color: "#111827" },
              { val: h.sequence_number != null ? String(h.sequence_number) : "—", w: "90px", mono: true, color: "#7a0c10" },
              { val: h.packets_sent != null ? h.packets_sent.toLocaleString() : "—", w: "110px", mono: true },
              { val: h.packets_received != null ? h.packets_received.toLocaleString() : "—", w: "1fr", mono: true },
            ]} />
          ))
        )}
        {db.heartbeats.length > 100 && showAllHB && (
          <div style={{ padding: "10px 24px", background: "#f9fafb", textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Showing latest 100 of {db.heartbeats.length} records</span>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
