"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { StatCard, SectionCard, TableHead, TableRow, EmptyState, PageHeader, ViewToggle, MiniBar } from "../DashboardUI";
import { fmtTime, fmtEventType } from "../../lib/fmt";

const SEVERITY_COLORS = { CRITICAL:"#dc2626", HIGH:"#f97316", MEDIUM:"#f59e0b", LOW:"#3b82f6", INFO:"#10b981" };
const PIE_COLORS = ["#dc2626","#f97316","#f59e0b","#3b82f6","#10b981","#8b5cf6"];

function SeverityBadge({ severity }) {
  const bg = { CRITICAL:"#fff1f2",HIGH:"#fff7ed",MEDIUM:"#fefce8",LOW:"#eff6ff",INFO:"#f0fdf4" };
  const border = { CRITICAL:"#fecdd3",HIGH:"#fed7aa",MEDIUM:"#fef08a",LOW:"#bfdbfe",INFO:"#bbf7d0" };
  const color = SEVERITY_COLORS;
  const s = severity || "MEDIUM";
  return (
    <span style={{ background:bg[s]||"#f9fafb", color:color[s]||"#6b7280", fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, border:`1px solid ${border[s]||"#e5e7eb"}`, whiteSpace:"nowrap" }}>
      {s}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 14px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)",fontSize:12 }}>
      {label && <p style={{margin:"0 0 6px",fontWeight:700,color:"#111827"}}>{label}</p>}
      {payload.map((p,i)=><p key={i} style={{margin:0,color:p.color||"#374151"}}>{p.name}: <strong>{typeof p.value==="number"?p.value.toFixed(1)+"%":p.value}</strong></p>)}
    </div>
  );
};

export default function MonitoringAgent({ db }) {
  const [localData, setLocalData]               = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [showAllAlerts, setShowAllAlerts]       = useState(false);
  const [sortOrder, setSortOrder]               = useState("desc");
  const [expandedAlerts, setExpandedAlerts]     = useState({});

  // Client selector — derived from systemMetrics
  const clientIds = [...new Set((db.systemMetrics || []).map(m => m.client_id).filter(Boolean))];
  const [selectedClientId, setSelectedClientId] = useState(() => clientIds[0] ?? null);
  const getClientLabel = (id) => {
    const c = (db.clients || []).find(c => c.id === id);
    return c?.client_identifier ?? id?.slice(0, 12) ?? "Unknown";
  };

  useEffect(() => {
    let active = true;
    async function checkLocalAgent() {
      try {
        const res = await fetch("http://localhost:9000/data",{method:"GET"});
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active) { setLocalData(data); setConnectionStatus("online"); }
      } catch {
        if (active) setConnectionStatus("offline");
      }
    }
    checkLocalAgent();
    const interval = setInterval(checkLocalAgent, 3000);
    return () => { active=false; clearInterval(interval); };
  }, []);

  const isOnline = connectionStatus === "online";
  let cpu=0, ram=0, disk=0, metricsTimestamp="—";

  // Filter metrics by selected client
  const clientMetrics = selectedClientId
    ? (db.systemMetrics || []).filter(m => m.client_id === selectedClientId)
    : (db.systemMetrics || []);

  if (isOnline && localData?.current_metrics) {
    cpu=localData.current_metrics.cpu_percent??0;
    ram=localData.current_metrics.ram_percent??0;
    disk=localData.current_metrics.disk_percent??0;
    metricsTimestamp=localData.current_metrics.timestamp;
  } else if (clientMetrics.length>0) {
    const latest = clientMetrics[0];
    cpu=latest.cpu_percent??latest.cpu_usage??0;
    ram=latest.ram_percent??latest.ram_usage??0;
    disk=latest.disk_percent??latest.disk_usage??0;
    metricsTimestamp=latest.timestamp||"—";
  }

  const fmtTs = (ts) => fmtTime(ts) ?? ts;

  // Filter alerts by selected client
  const clientAlertSource = selectedClientId
    ? (db.qvpnAlerts || []).filter(a => a.client_id === selectedClientId)
    : (db.qvpnAlerts || []);
  let rawAlerts = isOnline&&localData?.recent_alerts ? localData.recent_alerts : clientAlertSource;
  const filteredAlerts = rawAlerts.filter(a=>!(a.description||"").startsWith("[BACKEND]"));

  let alerts = filteredAlerts.map(a=>({
    id:a.id||a.alert_id, alert_types:a.alert_types||a.type||"ALERT",
    severity:a.severity||"MEDIUM",
    description:(a.description||"No description").replace(/^\[USER\]\s*/,""),
    status:a.status||"open", timestamp:a.timestamp||a.created_at||"",
  }));

  alerts.sort((a,b)=>{
    const tA=new Date(a.timestamp).getTime(), tB=new Date(b.timestamp).getTime();
    return sortOrder==="asc" ? tA-tB : tB-tA;
  });

  // Group duplicates
  let groupedAlerts=[];
  if (alerts.length>0) {
    let cur=[alerts[0]], gst=new Date(alerts[0].timestamp).getTime();
    for (let i=1;i<alerts.length;i++) {
      const ct=new Date(alerts[i].timestamp).getTime();
      if (alerts[i].description===cur[0].description&&Math.abs(ct-gst)/60000<=60) cur.push(alerts[i]);
      else { groupedAlerts.push(cur); cur=[alerts[i]]; gst=ct; }
    }
    groupedAlerts.push(cur);
  }

  const displayedAlerts = showAllAlerts ? groupedAlerts : groupedAlerts.slice(0,10);

  // Severity distribution
  const sevMap = alerts.reduce((acc,a)=>{acc[a.severity]=(acc[a.severity]||0)+1;return acc;},{});
  const sevData = Object.entries(sevMap).map(([name,value])=>({name: fmtEventType(name),value}));

  // Historical metrics for chart (filtered by selected client)
  const metricsChart = clientMetrics.slice(-20).reverse().map((m,i)=>({
    time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"}) : `T-${i}`,
    CPU: +(m.cpu_percent??m.cpu_usage??0).toFixed(1),
    RAM: +(m.ram_percent??m.ram_usage??0).toFixed(1),
    Disk: +(m.disk_percent??m.disk_usage??0).toFixed(1),
  }));

  const totalAlerts=alerts.length, criticalCount=alerts.filter(a=>a.severity==="CRITICAL").length;
  const activeThreats=isOnline?(localData?.has_active_threats?"Detected":"Secure"):(criticalCount>0?"Detected":"Secure");
  const statusColor={checking:"#f59e0b",online:"#10b981",offline:"#dc2626"};
  const statusLabel={checking:"Connecting...",online:"Live Telemetry",offline:"Supabase Mode"};

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28 }}>
        <PageHeader title="QVPN Monitoring Agent" subtitle="Endpoint threat intelligence and real-time security telemetry" />
        <div style={{ display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
          {/* Client selector */}
          {clientIds.length > 0 && (
            <div style={{ position:"relative" }}>
              <select
                value={selectedClientId ?? ""}
                onChange={e => setSelectedClientId(e.target.value || null)}
                style={{
                  appearance:"none",
                  background:"#ffffff",
                  border:"1px solid #e5e7eb",
                  borderRadius:8,
                  padding:"6px 28px 6px 10px",
                  fontSize:12,
                  fontWeight:600,
                  color:"#374151",
                  cursor:"pointer",
                  outline:"none",
                  boxShadow:"0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                {clientIds.map(id => (
                  <option key={id} value={id}>{getClientLabel(id)}</option>
                ))}
              </select>
              <svg style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          )}
          {/* Connection status pill */}
          {/* <div style={{ display:"flex",alignItems:"center",gap:8,background:"#ffffff",padding:"8px 16px",borderRadius:20,border:"1px solid #e5e7eb",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}> */}
            {/* <div style={{ width:7,height:7,borderRadius:"50%",background:statusColor[connectionStatus],boxShadow:`0 0 0 2px ${statusColor[connectionStatus]}33` }} /> */}
            {/* <span style={{ fontSize:12,fontWeight:600,color:"#374151" }}>{statusLabel[connectionStatus]}</span> */}
          {/* </div> */}
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:16,marginBottom:24 }}>
        <StatCard label="Threat Status" value={activeThreats} sub={isOnline?"Live engine":"DB history"} accentColor={activeThreats==="Secure"?"#10b981":"#dc2626"}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <StatCard label="Total Alerts" value={totalAlerts} sub={`${criticalCount} critical`} accentColor="#7a0c10"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <StatCard label="Host CPU" value={cpu>0?`${cpu}%`:"—"} sub={cpu>80?"⚠ High load":"Normal"} accentColor={cpu>80?"#dc2626":"#f59e0b"}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>}
        />
        <StatCard label="Host RAM" value={ram>0?`${ram}%`:"—"} sub={ram>80?"⚠ Critical":"Adequate"} accentColor={ram>80?"#dc2626":"#3b82f6"}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 19v-3"/><path d="M10 19v-3"/><path d="M14 19v-3"/><path d="M18 19v-3"/><path d="M8 11V9"/><path d="M16 11V9"/><path d="M12 11V9"/><path d="M2 15h20"/><path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.1a2 2 0 0 0 0-3.837Z"/></svg>}
        />
      </div>

      {/* Resource + Alert Severity */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20 }}>
        <SectionCard title="Device Resource Monitor" subtitle="Live CPU, RAM, and disk utilization">
          <div style={{ padding:"20px 24px",display:"flex",flexDirection:"column",gap:18 }}>
            <MiniBar label="CPU Core Load" value={cpu} color={cpu>80?"#dc2626":cpu>60?"#f59e0b":"#10b981"} />
            <MiniBar label="Physical RAM"  value={ram} color={ram>80?"#dc2626":ram>60?"#f59e0b":"#3b82f6"} />
            <MiniBar label="Disk Capacity" value={disk} color={disk>80?"#dc2626":"#f97316"} />
            <div style={{ paddingTop:8,borderTop:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:11,color:"#9ca3af" }}>Last sampled</span>
              <span style={{ fontSize:11,color:"#374151",fontFamily:"var(--font-mono,monospace)",fontWeight:600 }}>{fmtTs(metricsTimestamp)}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Alert Severity Distribution" subtitle="Breakdown by severity level">
          <div style={{ padding:"16px 24px 20px" }}>
            {sevData.length===0 ? <EmptyState message="No alerts" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sevData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {sevData.map((entry,i)=><Cell key={i} fill={SEVERITY_COLORS[entry.name]||PIE_COLORS[i%PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v,n)=>[v,n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12,paddingTop:8}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Historical metrics chart */}
      {metricsChart.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <SectionCard title="Historical System Metrics" subtitle="CPU, RAM, and Disk over time">
            <div style={{ padding:"16px 24px 20px" }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={metricsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="time" tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false} width={30} tickFormatter={v=>`${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12}} />
                  <Line type="monotone" dataKey="CPU"  stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="RAM"  stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Disk" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Alerts + Subsystems */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 280px",gap:20 }}>
        <SectionCard
          title="Security Alerts"
          subtitle="Real-time host activity and intrusion detection"
          action={
            <div style={{ display:"flex",gap:12,alignItems:"center" }}>
              <button onClick={()=>setSortOrder(s=>s==="asc"?"desc":"asc")}
                style={{ background:"transparent",border:"1px solid #e5e7eb",borderRadius:6,padding:"4px 10px",fontSize:11,color:"#6b7280",fontWeight:600,cursor:"pointer" }}>
                {sortOrder==="asc"?"Oldest ↑":"Newest ↓"}
              </button>
              <ViewToggle expanded={showAllAlerts} onToggle={()=>setShowAllAlerts(v=>!v)} />
            </div>
          }
        >
          <TableHead cols={[{label:"Time",w:"160px"},{label:"Severity",w:"110px"},{label:"Type",w:"170px"},{label:"Description",w:"1fr"}]} />
          {displayedAlerts.length===0 ? <EmptyState message="No alerts logged" /> : (
            displayedAlerts.map((group,i)=>{
              const a=group[0];
              const cleanTime=fmtTime(a.timestamp)??"—";
              const dups=group.length-1;
              const gid=`${a.description}-${i}`;
              const expanded=expandedAlerts[gid]||false;
              return (
                <div key={a.id||gid}>
                  <TableRow last={i===displayedAlerts.length-1&&!expanded} cols={[
                    {val:cleanTime,w:"160px",muted:true,mono:true},
                    {node:<SeverityBadge severity={a.severity}/>,w:"110px"},
                    {val:a.alert_types,w:"170px",mono:true,color:"#374151"},
                    {node:(
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:12,color:"#374151"}}>{a.description}</span>
                        {dups>0&&(
                          <span onClick={()=>setExpandedAlerts(p=>({...p,[gid]:!p[gid]}))}
                            style={{background:"#eff6ff",color:"#1d4ed8",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,cursor:"pointer",border:"1px solid #bfdbfe",whiteSpace:"nowrap"}}>
                            +{dups}
                          </span>
                        )}
                      </div>
                    ),w:"1fr"},
                  ]} />
                  {expanded&&dups>0&&(
                    <div style={{background:"#f9fafb",borderLeft:"3px solid #e5e7eb"}}>
                      {group.slice(1).map((dup,di)=>(
                        <TableRow key={dup.id||di} last={di===dups-1} cols={[
                          {val:fmtTime(dup.timestamp)??"—",w:"160px",muted:true,mono:true},
                          {node:<SeverityBadge severity={dup.severity}/>,w:"110px"},
                          {val:dup.alert_types,w:"170px",mono:true,muted:true},
                          {node:<span style={{fontSize:12,color:"#9ca3af"}}>{dup.description}</span>,w:"1fr"},
                        ]} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </SectionCard>

        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <SectionCard title="Agent Subsystems">
            <div style={{ padding:"4px 0 8px" }}>
              {[["Threat Heuristics",isOnline],["USB Port Monitor",isOnline],["Process Monitor",isOnline],["Network DoS Monitor",isOnline]].map(([label,on])=>(
                <div key={label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 24px",borderBottom:"1px solid #f9fafb" }}>
                  <span style={{fontSize:12,color:"#374151",fontWeight:500}}>{label}</span>
                  <span style={{ fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:on?"#f0fdf4":"#f9fafb",color:on?"#15803d":"#6b7280",border:`1px solid ${on?"#bbf7d0":"#e5e7eb"}` }}>
                    {on?"ACTIVE":"STANDBY"}
                  </span>
                </div>
              ))}
              {clientMetrics.length > 0 && (
                <div style={{ padding:"12px 24px" }}>
                  <span style={{fontSize:11,color:"#9ca3af"}}>Host ID: </span>
                  <code style={{fontSize:11,color:"#7a0c10",background:"rgba(122,12,16,0.05)",padding:"2px 6px",borderRadius:4,border:"1px solid rgba(122,12,16,0.15)"}}>
                    {clientMetrics[0].client_id?.slice(0,8) ?? "—"}
                  </code>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
