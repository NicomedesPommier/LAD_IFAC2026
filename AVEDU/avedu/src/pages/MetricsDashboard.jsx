// =============================================================
// FILE: src/pages/MetricsDashboard.jsx
// Admin-only analytics dashboard. Reads /api/analytics/summary/ (gated to
// staff by the backend) and renders KPI info-boxes + lightweight CSS-bar
// charts. Everything is date-range + event-type filterable.
// No chart library — bars are plain divs so there's no new dependency.
// =============================================================
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { getMission, BETA_MISSIONS } from "../config/betaMissions";

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function fmtDuration(ms) {
  if (ms == null) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function fmtWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString();
}

const C = {
  bg: "#0a0f1e",
  panel: "#121a30",
  panel2: "#0e1528",
  border: "rgba(255,255,255,0.08)",
  text: "#e6ecff",
  dim: "#8a93b2",
  accent: "#3b82f6",
  green: "#34d399",
  amber: "#f59e0b",
  red: "#f87171",
};

const TH = { padding: "6px 10px", fontWeight: 600, whiteSpace: "nowrap" };
const TD = { padding: "7px 10px", whiteSpace: "nowrap" };

function InfoBox({ label, value, sub, color = C.accent }) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "14px 16px", minWidth: 150, flex: "1 1 150px",
    }}>
      <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.dim }}>{sub}</div>}
    </div>
  );
}

function BarRow({ label, value, max, suffix = "", color = C.accent }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <div style={{ width: 150, fontSize: 12, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={label}>{label}</div>
      <div style={{ flex: 1, background: C.panel2, borderRadius: 4, height: 18, position: "relative" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 4, transition: "width .3s" }} />
      </div>
      <div style={{ width: 70, textAlign: "right", fontSize: 12, color: C.dim, fontFamily: "monospace" }}>
        {value}{suffix}
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, flex: "1 1 380px", minWidth: 320 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, color: C.text }}>{title}</h3>
      {children}
    </div>
  );
}

// Vertical bars for the per-day timeline.
function DayBars({ rows, color = C.accent }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <div style={{ color: C.dim, fontSize: 12 }}>No data in range.</div>;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140, overflowX: "auto", paddingBottom: 4 }}>
      {rows.map((r) => (
        <div key={r.label} title={`${r.label}: ${r.value}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 18 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", height: 110 }}>
            <div style={{ width: 14, height: `${Math.round((r.value / max) * 100)}%`, minHeight: r.value > 0 ? 2 : 0, background: color, borderRadius: "3px 3px 0 0" }} />
          </div>
          <div style={{ fontSize: 8, color: C.dim, transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{r.label.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

export default function MetricsDashboard() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(isoDaysAgo(14));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [typeFilter, setTypeFilter] = useState("all");
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | forbidden | error

  const betaMissionList = BETA_MISSIONS.filter((m) => m.available !== false);
  const totalMissions = betaMissionList.length;

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const token = localStorage.getItem("token");
      const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
      const [sumRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/summary/?from=${from}&to=${to}`, { headers }),
        fetch(`${API_BASE}/analytics/users/?from=${from}&to=${to}`, { headers }),
      ]);
      if (sumRes.status === 401 || sumRes.status === 403) { setStatus("forbidden"); return; }
      if (!sumRes.ok) { setStatus("error"); return; }
      setData(await sumRes.json());
      setUsers(usersRes.ok ? (await usersRes.json()).users || [] : []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  // Poll "online now" every 45s without reloading the whole range.
  useEffect(() => {
    if (status !== "ok") return;
    const id = setInterval(load, 45000);
    return () => clearInterval(id);
  }, [status, load]);

  const byDay = useMemo(() => data?.by_day || [], [data]);

  const eventTypes = useMemo(() => {
    const set = new Set(byDay.map((r) => r.event_type));
    return ["all", ...Array.from(set).sort()];
  }, [byDay]);

  const dayRows = useMemo(() => {
    const map = new Map();
    for (const r of byDay) {
      if (typeFilter !== "all" && r.event_type !== typeFilter) continue;
      map.set(r.date, (map.get(r.date) || 0) + r.count);
    }
    return Array.from(map.entries()).sort().map(([label, value]) => ({ label, value }));
  }, [byDay, typeFilter]);

  const typeTotals = useMemo(() => {
    const map = new Map();
    for (const r of byDay) map.set(r.event_type, (map.get(r.event_type) || 0) + r.count);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [byDay]);

  const betaMissions = useMemo(() => (data?.beta_missions || []), [data]);
  const totalCompletions = betaMissions.reduce((s, m) => s + (m.completions || 0), 0);
  const maxType = Math.max(1, ...typeTotals.map((t) => t.value));
  const maxAvg = Math.max(1, ...betaMissions.map((m) => m.avg_ms || 0));
  const maxFunnel = Math.max(1, ...betaMissions.map((m) => Math.max(m.starts || 0, m.completions || 0)));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "24px 28px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <button onClick={() => navigate("/")} style={{ background: "none", border: `1px solid ${C.border}`, color: C.dim, borderRadius: 6, padding: "4px 10px", cursor: "pointer", marginBottom: 8 }}>← Home</button>
          <h1 style={{ margin: 0, fontSize: 24 }}>📊 L.A.D Metrics</h1>
        </div>
        {status === "ok" && (
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
              {data.online_now} online now
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 18, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
        <label style={{ fontSize: 11, color: C.dim }}>From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            style={{ display: "block", marginTop: 4, background: C.panel2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px" }} />
        </label>
        <label style={{ fontSize: 11, color: C.dim }}>To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            style={{ display: "block", marginTop: 4, background: C.panel2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px" }} />
        </label>
        <div style={{ display: "flex", gap: 6 }}>
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => { setFrom(isoDaysAgo(d)); setTo(isoDaysAgo(0)); }}
              style={{ background: C.panel2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>
              {d}d
            </button>
          ))}
        </div>
        <label style={{ fontSize: 11, color: C.dim }}>Event type (per-day chart)
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            style={{ display: "block", marginTop: 4, background: C.panel2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px", maxWidth: 220 }}>
            {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <button onClick={load} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}>
          Apply
        </button>
      </div>

      {status === "loading" && <div style={{ color: C.dim }}>Loading…</div>}
      {status === "forbidden" && (
        <div style={{ background: C.panel, border: `1px solid ${C.red}`, borderRadius: 10, padding: 24, color: C.red }}>
          🔒 Admin access required. Sign in with a staff/superuser account to view metrics.
        </div>
      )}
      {status === "error" && (
        <div style={{ background: C.panel, border: `1px solid ${C.amber}`, borderRadius: 10, padding: 24, color: C.amber }}>
          Could not load metrics. Is the backend running?
        </div>
      )}

      {status === "ok" && data && (
        <>
          {/* KPI info boxes */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <InfoBox label="Online now" value={data.online_now} color={C.green} />
            <InfoBox label="Total events" value={data.total_events.toLocaleString()} sub={`${data.from} → ${data.to}`} />
            <InfoBox label="Beta completions" value={totalCompletions} color={C.amber} sub={`${betaMissions.length} missions seen`} />
            <InfoBox label="Active users" value={users.length} color={C.accent} sub={`${users.filter((u) => u.online).length} online`} />
          </div>

          {/* Charts */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Panel title={`Events per day${typeFilter !== "all" ? ` · ${typeFilter}` : ""}`}>
              <DayBars rows={dayRows} />
            </Panel>

            <Panel title="Events by type">
              {typeTotals.length === 0 ? <div style={{ color: C.dim, fontSize: 12 }}>No data.</div> :
                typeTotals.slice(0, 12).map((t) => (
                  <BarRow key={t.label} label={t.label} value={t.value} max={maxType} />
                ))}
            </Panel>

            <Panel title="Beta mission — avg time to complete">
              {betaMissions.length === 0 ? <div style={{ color: C.dim, fontSize: 12 }}>No beta completions yet.</div> :
                betaMissions.map((m) => (
                  <BarRow
                    key={m.target}
                    label={getMission(m.target)?.title || m.target}
                    value={Math.round((m.avg_ms || 0) / 1000)}
                    max={Math.round(maxAvg / 1000)}
                    suffix="s"
                    color={C.amber}
                  />
                ))}
            </Panel>

            <Panel title="Beta funnel — starts vs completions">
              {betaMissions.length === 0 ? <div style={{ color: C.dim, fontSize: 12 }}>No beta activity yet.</div> :
                betaMissions.map((m) => (
                  <div key={m.target} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: C.text, marginBottom: 2 }}>{getMission(m.target)?.title || m.target}</div>
                    <BarRow label="starts" value={m.starts || 0} max={maxFunnel} color={C.accent} />
                    <BarRow label="completions" value={m.completions || 0} max={maxFunnel} color={C.green} />
                    <div style={{ fontSize: 10, color: C.dim }}>
                      median/avg {fmtDuration(m.avg_ms)} · range {fmtDuration(m.min_ms)}–{fmtDuration(m.max_ms)}
                    </div>
                  </div>
                ))}
            </Panel>
          </div>

          {/* Per-user table — time on missions, activity, online */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: C.text }}>
              Per-user · time on missions <span style={{ color: C.dim, fontWeight: 400 }}>(click a row for per-mission times)</span>
            </h3>
            {users.length === 0 ? (
              <div style={{ color: C.dim, fontSize: 12 }}>No user activity in range.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: C.dim, textAlign: "left" }}>
                      <th style={TH}>User</th>
                      <th style={TH}>Missions</th>
                      <th style={TH}>Total time on missions</th>
                      <th style={TH}>Events</th>
                      <th style={TH}>Last active</th>
                      <th style={TH}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const open = expandedUser === u.user_id;
                      const hasDetail = u.missions && Object.keys(u.missions).length > 0;
                      return (
                        <React.Fragment key={u.user_id}>
                          <tr
                            style={{ borderTop: `1px solid ${C.border}`, cursor: hasDetail ? "pointer" : "default" }}
                            onClick={() => hasDetail && setExpandedUser(open ? null : u.user_id)}
                          >
                            <td style={TD}>
                              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: u.online ? C.green : "#3a4256", marginRight: 7, verticalAlign: "middle" }} />
                              <span style={{ color: C.text }}>{u.username}</span>
                            </td>
                            <td style={TD}>{u.missions_completed}/{totalMissions}</td>
                            <td style={{ ...TD, color: C.amber, fontFamily: "monospace" }}>{fmtDuration(u.total_mission_ms)}</td>
                            <td style={TD}>{u.events}</td>
                            <td style={{ ...TD, color: C.dim }}>{fmtWhen(u.last_active)}</td>
                            <td style={{ ...TD, color: C.dim, textAlign: "right" }}>{hasDetail ? (open ? "▾" : "▸") : ""}</td>
                          </tr>
                          {open && (
                            <tr>
                              <td colSpan={6} style={{ padding: "8px 10px", background: C.panel2 }}>
                                {betaMissionList.map((m) => {
                                  const mm = u.missions?.[m.id];
                                  return (
                                    <span key={m.id} style={{ display: "inline-block", marginRight: 14, marginBottom: 4, fontSize: 11 }}>
                                      <span style={{ color: C.dim }}>{m.title}: </span>
                                      <span style={{ color: mm ? C.green : "#555", fontFamily: "monospace" }}>
                                        {mm ? fmtDuration(mm.ms) : "—"}
                                      </span>
                                    </span>
                                  );
                                })}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
