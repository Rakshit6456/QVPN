"use client";
import React, { useState, useEffect, useRef } from "react";

function fmtNotifTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1)  return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24)  return `${diffHrs}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return ""; }
}

function buildNotifications(db) {
  const items = [];

  // qvpn_alerts → direct security notifications
  (db.qvpnAlerts || []).forEach(a => {
    const sev = a.severity?.toUpperCase();
    items.push({
      id: a.alert_id || a.id,
      type: sev === "CRITICAL" ? "critical" : sev === "HIGH" ? "warning" : "info",
      title: sev === "CRITICAL" ? "Critical Security Alert"
           : sev === "HIGH"     ? "Security Warning"
           :                      "Security Notice",
      description: (a.description || "Alert detected").slice(0, 110),
      timestamp: a.timestamp,
    });
  });

  // tunnel_events → CLIENT_DISCONNECT
  (db.tunnelEvents || []).filter(e => e.event_type === "CLIENT_DISCONNECT").slice(0, 5).forEach(e => {
    items.push({
      id: e.id,
      type: "warning",
      title: "Client Disconnected",
      description: `${e.details?.client_identifier || "A client"} disconnected from the VPN tunnel.`,
      timestamp: e.occurred_at,
    });
  });

  // tunnel_events → GATEWAY_TIMEOUT
  (db.tunnelEvents || []).filter(e => e.event_type === "GATEWAY_TIMEOUT").slice(0, 3).forEach(e => {
    items.push({
      id: e.id,
      type: "warning",
      title: "Gateway Timeout",
      description: `Connection timed out${e.details?.client_identifier ? ` for ${e.details.client_identifier}` : ""}.`,
      timestamp: e.occurred_at,
    });
  });

  // tunnel_events → HANDSHAKE_COMPLETE
  (db.tunnelEvents || []).filter(e => e.event_type === "HANDSHAKE_COMPLETE").slice(0, 4).forEach(e => {
    items.push({
      id: e.id,
      type: "info",
      title: "Secure Tunnel Established",
      description: `${e.details?.algorithm || "PQC"} handshake completed${e.details?.remote_ip ? ` from ${e.details.remote_ip}` : ""}.`,
      timestamp: e.occurred_at,
    });
  });

  // api_keys → recently created
  (db.apiKeys || []).slice(0, 3).forEach(k => {
    items.push({
      id: k.id,
      type: "info",
      title: "API Key Registered",
      description: `"${k.name || k.key_id}" created with scope: ${(k.scopes || []).join(", ") || "none"}.`,
      timestamp: k.created_at,
    });
  });

  // user_activities → login events
  (db.userActivities || []).slice(0, 5).forEach(u => {
    const client = (db.clients || []).find(c => c.id === u.client_id);
    const who = u.username && u.username !== "UNKNOWN" ? u.username : "Unknown user";
    items.push({
      id: u.id,
      type: "info",
      title: "User Login Activity",
      description: `${who} login event${client ? ` on ${client.client_identifier}` : ""}.`,
      timestamp: u.timestamp,
    });
  });

  // device_events → USB insertions
  (db.deviceEvents || []).slice(0, 3).forEach(d => {
    const client = (db.clients || []).find(c => c.id === d.client_id);
    items.push({
      id: d.id,
      type: "warning",
      title: "USB Device Inserted",
      description: `Hardware ID ${d.device_info?.hardware_id || "unknown"} detected${client ? ` on ${client.client_identifier}` : ""}.`,
      timestamp: d.timestamp,
    });
  });

  return items
    .filter(n => n.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 15);
}

/* ── Icon components ─────────────────────────────────── */
function IconCritical() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="1.8"/>
      <line x1="12" y1="7" x2="12" y2="13" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="16.5" r="1.2" fill="#dc2626"/>
    </svg>
  );
}
function IconWarning() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="9" x2="12" y2="13" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="16.5" r="1.2" fill="#d97706"/>
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="1.8"/>
      <line x1="12" y1="16" x2="12" y2="12" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="8" r="1.2" fill="#2563eb"/>
    </svg>
  );
}

export default function Header({ db }) {
  const [open, setOpen]         = useState(false);
  const [cleared, setCleared]   = useState(false);
  const bellRef                 = useRef(null);
  const dropRef                 = useRef(null);

  const notifications = cleared ? [] : buildNotifications(db || {});
  const unread        = notifications.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (
        dropRef.current && !dropRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset cleared when db data updates
  useEffect(() => { setCleared(false); }, [db?.qvpnAlerts?.length, db?.tunnelEvents?.length]);

  return (
    <div style={{
      background: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 58,
      flexShrink: 0,
      position: "relative",
      zIndex: 50,
    }}>

      {/* ── Left: Search bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#f9fafb", border: "1px solid #e5e7eb",
        borderRadius: 8, padding: "7px 12px",
        width: 260, cursor: "text",
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ fontSize: 13, color: "#9ca3af", flex: 1 }}>Search (Ctrl + /)</span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "#9ca3af",
          background: "#ffffff", border: "1px solid #e5e7eb",
          borderRadius: 4, padding: "1px 5px", letterSpacing: "0.03em",
        }}>Ctrl + /</span>
      </div>

      {/* ── Right: Brand + Bell ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

        {/* Brand block */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>QNNX Quantum Secure Platform</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", lineHeight: 1.4 }}>All Systems Operational</div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 32, background: "#e5e7eb" }} />

        {/* Bell button */}
        <div style={{ position: "relative" }}>
          <button
            ref={bellRef}
            onClick={() => setOpen(v => !v)}
            style={{
              width: 38, height: 38, borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: open ? "#f9fafb" : "#ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative", transition: "all 0.12s",
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
            onMouseOut={(e) => { if (!open) { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e5e7eb"; } }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span style={{
                position: "absolute", top: 5, right: 5,
                width: 8, height: 8, borderRadius: "50%",
                background: "#dc2626",
                border: "1.5px solid #ffffff",
              }} />
            )}
          </button>

          {/* ── Notification dropdown ── */}
          {open && (
            <div
              ref={dropRef}
              style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                width: 360,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow: "0 6px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)",
                zIndex: 9999,
                overflow: "hidden",
              }}
            >
              {/* Dropdown header */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 18px 14px",
                borderBottom: "1px solid #f3f4f6",
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Security Alerts</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => setCleared(true)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 600, color: "#6b7280",
                      padding: "2px 4px", borderRadius: 4, transition: "color 0.1s",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = "#111827"}
                    onMouseOut={(e) => e.currentTarget.style.color = "#6b7280"}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "36px 18px", textAlign: "center" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ display: "block", margin: "0 auto 10px" }}>
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>No new alerts</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div
                      key={n.id || i}
                      style={{
                        display: "flex", gap: 10, padding: "11px 16px",
                        borderBottom: i < notifications.length - 1 ? "1px solid #f3f4f6" : "none",
                        transition: "background 0.1s", cursor: "default",
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = "#f9fafb"}
                      onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      {n.type === "critical" ? <IconCritical /> : n.type === "warning" ? <IconWarning /> : <IconInfo />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{n.title}</span>
                          <span style={{ fontSize: 11, color: "#b0b7c3", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>{fmtNotifTime(n.timestamp)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11.5, color: "#6b7280", lineHeight: 1.45, wordBreak: "break-word" }}>{n.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
