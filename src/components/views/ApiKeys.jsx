"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { StatusBadge, StatCard, SectionCard, TableHead, TableRow, EmptyState, PageHeader, ViewToggle } from "../DashboardUI";
import { fmtTime, shortId } from "../../lib/fmt";

const COLORS = ["#10b981", "#7a0c10", "#f59e0b", "#3b82f6", "#8b5cf6", "#06b6d4", "#f97316"];

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

function ScopeBadge({ scope }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
      background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
      whiteSpace: "nowrap", letterSpacing: "0.02em",
    }}>
      {scope}
    </span>
  );
}

function isExpiringSoon(expiresAt) {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt) - new Date();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function ApiKeys({ db }) {
  const [showAll, setShowAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const keys = db.apiKeys || [];

  const totalKeys   = keys.length;
  const activeKeys  = keys.filter(k => k.status?.toLowerCase() === "active").length;
  const revokedKeys = keys.filter(k => ["revoked", "inactive", "disabled"].includes(k.status?.toLowerCase())).length;
  const expiringSoon = keys.filter(k => isExpiringSoon(k.expires_at)).length;

  // Status distribution
  const statusMap = {};
  keys.forEach(k => {
    const s = k.status || "unknown";
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const statusChartData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Scope frequency
  const scopeMap = {};
  keys.forEach(k => {
    const scopes = Array.isArray(k.scopes) ? k.scopes : (k.scopes ? [k.scopes] : []);
    scopes.forEach(s => { scopeMap[s] = (scopeMap[s] || 0) + 1; });
  });
  const scopeChartData = Object.entries(scopeMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Filtered + searched keys for the table
  const filtered = keys.filter(k => {
    if (statusFilter !== "all" && k.status?.toLowerCase() !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (k.name || k.key_id || k.id || "").toLowerCase();
      const id = (k.id || "").toLowerCase();
      if (!name.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });
  const displayed = showAll ? filtered : filtered.slice(0, 10);

  const uniqueStatuses = [...new Set(keys.map(k => k.status?.toLowerCase()).filter(Boolean))];

  return (
    <div>
      <PageHeader title="API Keys" subtitle="Manage and monitor all issued API credentials" />

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard
          label="Total Keys" value={totalKeys}
          sub="All issued credentials"
          accentColor="#7a0c10"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>}
        />
        <StatCard
          label="Active Keys" value={activeKeys}
          sub={`${totalKeys > 0 ? Math.round((activeKeys / totalKeys) * 100) : 0}% of total`}
          accentColor="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <StatCard
          label="Revoked / Inactive" value={revokedKeys}
          sub="Disabled credentials"
          accentColor="#6b7280"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
        />
        <StatCard
          label="Expiring Soon" value={expiringSoon}
          sub="Within 7 days"
          accentColor="#f59e0b"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <SectionCard title="Key Status Distribution" subtitle="Breakdown of all keys by current status">
          <div style={{ padding: "12px 16px 14px" }}>
            {statusChartData.length === 0 ? <EmptyState message="No key data available" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                    {statusChartData.map((entry, i) => {
                      const c = entry.name === "active" ? "#10b981" : entry.name === "revoked" ? "#7a0c10" : entry.name === "inactive" ? "#9ca3af" : COLORS[i % COLORS.length];
                      return <Cell key={i} fill={c} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Scope Usage" subtitle="How many keys have each permission scope">
          <div style={{ padding: "12px 16px 14px" }}>
            {scopeChartData.length === 0 ? <EmptyState message="No scope data available" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scopeChartData} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="value" name="Keys" radius={[0, 4, 4, 0]}>
                    {scopeChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Table with filter + search */}
      <SectionCard
        title="All API Keys"
        subtitle={`${filtered.length} key${filtered.length !== 1 ? "s" : ""}${statusFilter !== "all" ? ` · ${statusFilter}` : ""}${search ? ` · "${search}"` : ""}`}
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: 6, padding: "4px 10px",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowAll(false); }}
                placeholder="Search keys…"
                style={{
                  border: "none", background: "transparent", outline: "none",
                  fontSize: 12, color: "#374151", width: 120,
                }}
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setShowAll(false); }}
              style={{
                border: "1px solid #e5e7eb", background: "#f9fafb",
                borderRadius: 6, padding: "5px 10px",
                fontSize: 12, color: "#374151", cursor: "pointer", outline: "none",
              }}
            >
              <option value="all">All statuses</option>
              {uniqueStatuses.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>

            <ViewToggle expanded={showAll} onToggle={() => setShowAll(v => !v)} />
          </div>
        }
      >
        <TableHead cols={[
          { label: "Key Name / ID",  w: "200px" },
          { label: "Status",         w: "110px" },
          { label: "Scopes",         w: "1fr"   },
          { label: "Created",        w: "170px" },
          { label: "Expires",        w: "170px" },
          { label: "Last Used",      w: "170px" },
        ]} />

        {keys.length === 0 ? (
          <EmptyState message="No API keys found" />
        ) : filtered.length === 0 ? (
          <EmptyState message="No keys match the current filter" />
        ) : (
          displayed.map((k, i) => {
            const scopes = Array.isArray(k.scopes) ? k.scopes : (k.scopes ? [k.scopes] : []);
            const expired = isExpired(k.expires_at);
            const expiring = isExpiringSoon(k.expires_at);
            const expiresColor = expired ? "#be123c" : expiring ? "#b45309" : "#9ca3af";
            const displayName = k.name || k.key_id || shortId(k.id) || "—";

            return (
              <TableRow key={k.id || i} last={i === displayed.length - 1} cols={[
                {
                  node: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", fontFamily: "var(--font-mono, monospace)" }}>
                        {displayName}
                      </span>
                      {k.id && k.name && (
                        <span style={{ fontSize: 10.5, color: "#9ca3af", fontFamily: "var(--font-mono, monospace)" }}>
                          {shortId(k.id)}
                        </span>
                      )}
                    </div>
                  ),
                  w: "200px",
                },
                { node: <StatusBadge value={k.status} />, w: "110px" },
                {
                  node: scopes.length > 0 ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {scopes.slice(0, 4).map((s, si) => <ScopeBadge key={si} scope={s} />)}
                      {scopes.length > 4 && (
                        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>+{scopes.length - 4}</span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
                  ),
                  w: "1fr",
                },
                { val: fmtTime(k.created_at) ?? "—", w: "170px", muted: true, mono: true },
                {
                  node: (
                    <span style={{ fontSize: 12, color: expiresColor, fontFamily: "var(--font-mono, monospace)", fontWeight: expiring || expired ? 600 : 400 }}>
                      {k.expires_at ? (expired ? "Expired" : expiring ? `⚠ ${fmtTime(k.expires_at)}` : fmtTime(k.expires_at)) : "—"}
                    </span>
                  ),
                  w: "170px",
                },
                { val: fmtTime(k.last_used_at) ?? "—", w: "170px", muted: true, mono: true },
              ]} />
            );
          })
        )}
      </SectionCard>
    </div>
  );
}
