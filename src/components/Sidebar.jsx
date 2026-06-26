"use client";
import React from "react";
import Image from "next/image";

const ICONS = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  sessions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  algorithms: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  tunnels: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  network: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  monitoring: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  endpoint: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  apikeys: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
};

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { id: "overview",  label: "Overview"         },
      { id: "sessions",  label: "Active Sessions"  },
    ],
  },
  {
    label: "Security & Crypto",
    items: [
      { id: "algorithms", label: "Algorithms"         },
      { id: "tunnels",    label: "Tunnel States"      },
      { id: "network",    label: "Network Activities" },
      { id: "users",      label: "User Activities"    },
    ],
  },
  {
    label: "System & Settings",
    items: [
      { id: "apikeys",    label: "API Keys"          },
      { id: "monitoring", label: "Monitoring Agent"  },
      { id: "endpoint",   label: "Endpoint Events"   },
    ],
  },
];

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }) {
  return (
    <div style={{
      width: collapsed ? 64 : 272,
      minWidth: collapsed ? 64 : 272,
      background: "#ffffff",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      height: "100vh",
      position: "relative",
      transition: "width 0.22s ease, min-width 0.22s ease",
      overflow: "hidden",
    }}>

      {/* ── Logo area ── */}
      <div style={{
        padding: collapsed ? "18px 0" : "18px 16px",
        borderBottom: "1px solid #f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        minHeight: 70,
        flexShrink: 0,
      }}>
        {collapsed ? (
          /* collapsed: just the chip portion of the logo */
          <Image src="/qnnx-logo.png" alt="QNNX" width={36} height={36} style={{ objectFit: "contain", objectPosition: "left center" }} />
        ) : (
          <Image src="/qnnx-logo.png" alt="QNNX" width={130} height={36} style={{ objectFit: "contain", objectPosition: "left center" }} />
        )}

        {/* Collapse toggle */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "#f9fafb", border: "1px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, transition: "all 0.12s",
              color: "#9ca3af",
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#374151"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#9ca3af"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
      </div>

      {/* Expand toggle (when collapsed) */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
          style={{
            margin: "10px auto 0", width: 34, height: 34, borderRadius: "50%",
            background: "#f9fafb", border: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#9ca3af", transition: "all 0.12s",
            flexShrink: 0,
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#374151"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#9ca3af"; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      {/* ── Navigation ── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: collapsed ? "8px 0" : "8px 10px" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <p style={{
                margin: "16px 0 4px 8px", fontSize: 10.5, color: "#9ca3af",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                whiteSpace: "nowrap",
              }}>{group.label}</p>
            )}
            {collapsed && <div style={{ height: 10 }} />}

            {group.items.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: 11,
                    width: "100%",
                    textAlign: "left",
                    padding: collapsed ? "10px 0" : "10px 12px",
                    borderRadius: collapsed ? 0 : 10,
                    border: "none",
                    marginBottom: 2,
                    background: isActive ? "#f3eded" : "transparent",
                    color: isActive ? "#7a0c10" : "#4b5563",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    transition: "background 0.12s, color 0.12s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#111827"; } }}
                  onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; } }}
                >
                  <span style={{ color: isActive ? "#7a0c10" : "#9ca3af", flexShrink: 0, display: "flex" }}>
                    {ICONS[item.id]}
                  </span>
                  {!collapsed && item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── User footer ── */}
      <div style={{
        padding: collapsed ? "14px 0" : "14px 18px",
        borderTop: "1px solid #f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "#fde8e8", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#7a0c10" }}>AD</span>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Admin</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Signal Officer</div>
          </div>
        )}
      </div>
    </div>
  );
}
