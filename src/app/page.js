"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { fetchAll } from "../lib/supabase";

import Overview from "../components/views/Overview";
import Sessions from "../components/views/Sessions";
import Tunnels from "../components/views/Tunnels";
import NetworkActivities from "../components/views/NetworkActivities";
import UserActivities from "../components/views/UserActivities";
import MonitoringAgent from "../components/views/MonitoringAgent";
import Algorithms from "../components/views/Algorithms";
import EndpointEvents from "../components/views/EndpointEvents";

const PAGE_TITLES = {
  overview:   "Overview",
  algorithms: "Algorithm Intelligence",
  sessions:   "Active Sessions",
  tunnels:    "Tunnel States",
  network:    "Network Activities",
  users:      "User Activities",
  monitoring: "Monitoring Agent",
  endpoint:   "Endpoint Events",
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [collapsed, setCollapsed]  = useState(false);

  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState({
    clients: [], sessions: [], apiKeys: [], trafficStats: [],
    tunnelEvents: [], networkActivities: [],
    auditLogs: [], tunnelStates: [], userActivities: [], systemMetrics: [],
    qvpnAlerts: [], deviceEvents: [], heartbeats: [], processEvents: [],
  });

  useEffect(() => {
    async function fetchAllData() {
      const [
        clients, sessions, apiKeys, trafficStats,
        tunnelEvents, networkActivities,
        auditLogs, tunnelStates, userActivities, systemMetrics,
        qvpnAlerts, deviceEvents, heartbeats, processEvents,
      ] = await Promise.all([
        fetchAll("clients"),
        fetchAll("sessions"),
        fetchAll("api_keys"),
        fetchAll("traffic_stats"),
        fetchAll("tunnel_events",       { orderCol: "occurred_at", ascending: false }),
        fetchAll("network_activities",  { orderCol: "timestamp",   ascending: false }),
        fetchAll("audit_logs"),
        fetchAll("tunnel_states"),
        fetchAll("user_activities",     { orderCol: "timestamp",   ascending: false }),
        fetchAll("system_metrics",      { orderCol: "timestamp",   ascending: false }),
        fetchAll("qvpn_alerts"),
        fetchAll("device_events",       { orderCol: "timestamp",   ascending: false }),
        fetchAll("heartbeats",          { orderCol: "timestamp",   ascending: false }),
        fetchAll("process_events",      { orderCol: "timestamp",   ascending: false }),
      ]);

      setDb({
        clients, sessions, apiKeys, trafficStats,
        tunnelEvents, networkActivities,
        auditLogs, tunnelStates, userActivities, systemMetrics,
        qvpnAlerts, deviceEvents, heartbeats, processEvents,
      });
      setLoading(false);
    }
    fetchAllData();
  }, []);

  const getClientNameBySession = (sessionId) => {
    const session = db.sessions.find(s => s.id === sessionId);
    if (!session) return "Unknown";
    const client = db.clients.find(c => c.id === session.client_id);
    return client ? client.client_identifier : "Unknown";
  };

  const activeSessions = db.sessions.filter(s => s.tunnel_status?.toLowerCase() === "established").length;
  const activeKeys     = db.apiKeys.filter(k => k.status?.toLowerCase() === "active").length;
  const blockedCount   = db.networkActivities.filter(n => n.event_type?.toLowerCase() === "blocked").length;
  const totalDown      = db.trafficStats.reduce((acc, t) => acc + (t.bytes_received || 0), 0);
  const totalUp        = db.trafficStats.reduce((acc, t) => acc + (t.bytes_sent || 0), 0);

  return (
    <div style={{
      background: "#f0f2f7",
      height: "100vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "row",
      fontFamily: "var(--font-inter, 'Inter', sans-serif)",
      color: "#111827",
    }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <Header db={db} />

        <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto", overflowX: "hidden", position: "relative" }}>
          {loading && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              background: "rgba(240,242,247,0.85)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7a0c10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: "spin 0.9s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>Loading dashboard data…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {activeTab === "overview"    && <Overview db={db} activeSessions={activeSessions} activeKeys={activeKeys} totalDown={totalDown} totalUp={totalUp} blockedCount={blockedCount} getClientNameBySession={getClientNameBySession} />}
          {activeTab === "algorithms"  && <Algorithms db={db} />}
          {activeTab === "sessions"    && <Sessions db={db} />}
          {activeTab === "tunnels"     && <Tunnels db={db} getClientNameBySession={getClientNameBySession} />}
          {activeTab === "network"     && <NetworkActivities db={db} />}
          {activeTab === "users"       && <UserActivities db={db} />}
          {activeTab === "monitoring"  && <MonitoringAgent db={db} />}
          {activeTab === "endpoint"    && <EndpointEvents db={db} getClientNameBySession={getClientNameBySession} />}
        </div>
      </div>
    </div>
  );
}
