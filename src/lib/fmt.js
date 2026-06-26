// Shared formatting utilities

export function fmtTime(ts) {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts.replace("T", " ").split(".")[0];
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${date}  ${time}`;
  } catch {
    return ts.replace("T", " ").split(".")[0];
  }
}

export function fmtBytes(bytes, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// Show first 8 chars of a UUID, styled as monospace
export function shortId(id) {
  if (!id) return null;
  if (/^[0-9a-f]{8}-/.test(id)) return id.slice(0, 8);
  return id.length > 18 ? id.slice(0, 18) + "…" : id;
}

// Extract readable summary from a JSON details object
export function fmtDetails(details) {
  if (!details) return null;
  const entries = Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return null;
  return entries.slice(0, 3).map(([k, v]) => {
    const key = k.replace(/_/g, " ");
    return `${key}: ${v}`;
  }).join("  ·  ");
}

// Make an event type human-readable
export function fmtEventType(type) {
  if (!type) return "—";
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
