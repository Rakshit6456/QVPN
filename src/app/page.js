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
import ApiKeys from "../components/views/ApiKeys";
import Gateway from "../components/views/Gateway";

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

  const [db, setDb] = useState({
    clients: [], sessions: [], apiKeys: [], trafficStats: [],
    tunnelEvents: [], networkActivities: [],
    auditLogs: [], tunnelStates: [], userActivities: [], systemMetrics: [],
    qvpnAlerts: [], deviceEvents: [], heartbeats: [], processEvents: [],
  });

  useEffect(() => {
    const update = (key) => (data) => setDb(prev => ({ ...prev, [key]: data }));

    fetchAll("clients").then(update("clients"));
    fetchAll("sessions").then(update("sessions"));
    fetchAll("api_keys").then(update("apiKeys"));
    fetchAll("traffic_stats").then(update("trafficStats"));
    fetchAll("tunnel_events",      { orderCol: "occurred_at", ascending: false }).then(update("tunnelEvents"));
    fetchAll("network_activities", { orderCol: "timestamp",   ascending: false }).then(update("networkActivities"));
    fetchAll("audit_logs").then(update("auditLogs"));
    fetchAll("tunnel_states").then(update("tunnelStates"));
    fetchAll("user_activities",    { orderCol: "timestamp",   ascending: false }).then(update("userActivities"));
    fetchAll("system_metrics",     { orderCol: "timestamp",   ascending: false }).then(update("systemMetrics"));
    fetchAll("qvpn_alerts").then(update("qvpnAlerts"));
    fetchAll("device_events",      { orderCol: "timestamp",   ascending: false }).then(update("deviceEvents"));
    fetchAll("heartbeats",         { orderCol: "timestamp",   ascending: false }).then(update("heartbeats"));
    fetchAll("process_events",     { orderCol: "timestamp",   ascending: false }).then(update("processEvents"));
  }, []);

  const getClientNameBySession = (sessionId) => {
    const session = db.sessions.find(s => s.id === sessionId);
    if (!session) return "Unknown";
    const client = db.clients.find(c => c.id === session.client_id);
    return client ? client.client_identifier : "Unknown";
  };

  const ACTIVE_TUNNEL_STATUSES = new Set(["established", "connected", "active", "connecting", "reconnecting", "handshake"]);
  const activeSessions = db.sessions.filter(s => ACTIVE_TUNNEL_STATUSES.has(s.tunnel_status?.toLowerCase())).length;
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
          {activeTab === "overview"    && <Overview db={db} activeSessions={activeSessions} activeKeys={activeKeys} totalDown={totalDown} totalUp={totalUp} blockedCount={blockedCount} getClientNameBySession={getClientNameBySession} />}
          {activeTab === "algorithms"  && <Algorithms db={db} />}
          {activeTab === "sessions"    && <Sessions db={db} />}
          {activeTab === "tunnels"     && <Tunnels db={db} getClientNameBySession={getClientNameBySession} />}
          {activeTab === "network"     && <NetworkActivities db={db} />}
          {activeTab === "users"       && <UserActivities db={db} />}
          {activeTab === "gateway"     && <Gateway db={db} />}
          {activeTab === "apikeys"     && <ApiKeys db={db} />}
          {activeTab === "monitoring"  && <MonitoringAgent db={db} />}
          {activeTab === "endpoint"    && <EndpointEvents db={db} getClientNameBySession={getClientNameBySession} />}
        </div>
      </div>
    </div>
  );
}
