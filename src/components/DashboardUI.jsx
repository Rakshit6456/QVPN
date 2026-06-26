"use client";
import React from "react";

/* ─── Status Badge ─────────────────────────────────────────── */
export function StatusBadge({ value }) {
  const map = {
    // Tunnel / session statuses
    active:                { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Active" },
    established:           { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Established" },
    connected:             { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Connected" },
    connecting:            { bg: "#fefce8", border: "#fef08a", color: "#854d0e", label: "Connecting" },
    allowed:               { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Allowed" },
    reconnecting:          { bg: "#fff7ed", border: "#fed7aa", color: "#c2410c", label: "Reconnecting" },
    handshake:             { bg: "#fff7ed", border: "#fed7aa", color: "#c2410c", label: "Handshake" },
    inactive:              { bg: "#f9fafb", border: "#e5e7eb", color: "#6b7280", label: "Inactive" },
    disconnected:          { bg: "#fff1f2", border: "#fecdd3", color: "#be123c", label: "Disconnected" },
    timed_out:             { bg: "#fff7ed", border: "#fed7aa", color: "#c2410c", label: "Timed Out" },
    blocked:               { bg: "#fff1f2", border: "#fecdd3", color: "#be123c", label: "Blocked" },
    banned:                { bg: "#fff1f2", border: "#fecdd3", color: "#be123c", label: "Banned" },
    // Tunnel events
    handshake_init:        { bg: "#fefce8", border: "#fef08a", color: "#854d0e", label: "Handshake Init" },
    handshake_complete:    { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Handshake Done" },
    client_disconnect:     { bg: "#fff1f2", border: "#fecdd3", color: "#be123c", label: "Client Disconnect" },
    gateway_timeout:       { bg: "#fff1f2", border: "#fecdd3", color: "#be123c", label: "Gateway Timeout" },
    system_metrics:        { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", label: "System Metrics" },
    network_activity:      { bg: "#f0f9ff", border: "#bae6fd", color: "#0284c7", label: "Network Activity" },
    // Network activities
    new_connection:        { bg: "#f0f9ff", border: "#bae6fd", color: "#0284c7", label: "New Connection" },
    // Auth events
    login_failed:          { bg: "#fff1f2", border: "#fecdd3", color: "#be123c", label: "Login Failed" },
    login_success:         { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Login Success" },
    login:                 { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Login" },
    config_changed:        { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", label: "Config Changed" },
    key_rotation:          { bg: "#faf5ff", border: "#e9d5ff", color: "#7c3aed", label: "Key Rotation" },
    user_signed_in:        { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Signed In" },
    user_login_failed:     { bg: "#fff1f2", border: "#fecdd3", color: "#be123c", label: "Login Failed" },
    user_updated_password: { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", label: "Pwd Updated" },
    user_signed_up:        { bg: "#faf5ff", border: "#e9d5ff", color: "#7c3aed", label: "Signed Up" },
    // Device & process events
    inserted:              { bg: "#f0f9ff", border: "#bae6fd", color: "#0284c7", label: "USB Inserted" },
    removed:               { bg: "#fff7ed", border: "#fed7aa", color: "#c2410c", label: "USB Removed" },
    launched:              { bg: "#faf5ff", border: "#e9d5ff", color: "#7c3aed", label: "Launched" },
    terminated:            { bg: "#fff1f2", border: "#fecdd3", color: "#be123c", label: "Terminated" },
  };
  const s = map[value?.toLowerCase()] ?? { bg: "#f9fafb", border: "#e5e7eb", color: "#6b7280", label: value ?? "—" };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 600,
      padding: "3px 9px", borderRadius: 20,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap", letterSpacing: "0.01em",
    }}>
      {s.label}
    </span>
  );
}

/* ─── Mini Progress Bar ───────────────────────────────────── */
export function MiniBar({ value, max = 100, color = "#16a34a", label }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{label}</span>
          <span style={{ fontSize: 12, color: "#111827", fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>{value}%</span>
        </div>
      )}
      <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 3, transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────── */
export function StatCard({ label, value, sub, accentColor = "#7a0c10", icon }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "22px 24px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
        {icon && (
          <span style={{ color: "#d1d5db", opacity: 0.8 }}>{icon}</span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#111827", lineHeight: 1, fontFamily: "var(--font-mono, monospace)", letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

/* ─── Section Card ────────────────────────────────────────── */
export function SectionCard({ title, subtitle, description, children, action }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "18px 22px 16px",
        borderBottom: "1px solid #ececec",
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.12em" }}>{title}</p>
          {description && <p style={{ margin: "5px 0 0", fontSize: 13, color: "#6b7280", fontWeight: 400, lineHeight: 1.4 }}>{description}</p>}
        </div>
        {action && <div style={{ flexShrink: 0, marginLeft: 12, marginTop: 2 }}>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ─── Table Head ──────────────────────────────────────────── */
export function TableHead({ cols }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: cols.map(c => c.w || "1fr").join(" "),
      padding: "10px 24px",
      borderBottom: "1px solid #ececec",
    }}>
      {cols.map((c, i) => (
        <span key={i} style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.label}</span>
      ))}
    </div>
  );
}

/* ─── Table Row ───────────────────────────────────────────── */
export function TableRow({ cols, last }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols.map(c => c.w || "1fr").join(" "),
        padding: "12px 24px",
        borderBottom: last ? "none" : "1px solid #f5f5f5",
        alignItems: "center",
        background: "#ffffff",
        transition: "background 0.12s",
      }}
      onMouseOver={(e) => e.currentTarget.style.background = "#fafafa"}
      onMouseOut={(e) => e.currentTarget.style.background = "#ffffff"}
    >
      {cols.map((c, i) => (
        <span key={i} style={{
          fontSize: c.mono ? 12 : 13,
          color: c.muted ? "#9ca3af" : (c.color || "#374151"),
          fontWeight: c.bold ? 600 : (c.mono ? 500 : 400),
          fontFamily: c.mono ? "var(--font-mono, monospace)" : "inherit",
          overflow: c.node ? "visible" : "hidden",
          textOverflow: c.node ? undefined : "ellipsis",
          whiteSpace: "nowrap",
          letterSpacing: c.mono ? "0.02em" : "inherit",
          display: c.node ? "flex" : undefined,
          alignItems: c.node ? "center" : undefined,
        }}>
          {c.node ?? c.val}
        </span>
      ))}
    </div>
  );
}

/* ─── Empty State ─────────────────────────────────────────── */
export function EmptyState({ message = "No data found" }) {
  return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: 48, height: 48, background: "#f3f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>{message}</p>
    </div>
  );
}

/* ─── Page Header ─────────────────────────────────────────── */
export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: "-0.025em", lineHeight: 1.1 }}>{title}</h1>
      {subtitle && <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280", fontWeight: 400 }}>{subtitle}</p>}
    </div>
  );
}

/* ─── View Toggle ─────────────────────────────────────────── */
export function ViewToggle({ expanded, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        background: "transparent", border: "1px solid #e5e7eb",
        borderRadius: 6, padding: "5px 12px",
        fontSize: 12, color: "#6b7280", fontWeight: 600,
        cursor: "pointer", transition: "all 0.12s",
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = "#7a0c10"; e.currentTarget.style.color = "#7a0c10"; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
    >
      {expanded ? "Show Less" : "View All"}
    </button>
  );
}
