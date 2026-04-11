import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/ThemeContext";

const TASKS = [
  {
    id: "wakeup",
    label: "Wake Up On Time",
    icon: "☀️",
    category: "lifestyle",
    type: "check",
    hint: "Did you wake up at your target time?",
  },
  {
    id: "water",
    label: "Water Intake",
    icon: "💧",
    category: "lifestyle",
    type: "counter",
    hint: "8 glasses = full score",
    max: 12,
    goal: 8,
  },
  {
    id: "noporn",
    label: "No Porn",
    icon: "🔒",
    category: "lifestyle",
    type: "check",
    hint: "Stayed clean today?",
  },
  {
    id: "nosugar",
    label: "No Sugar",
    icon: "🚫",
    category: "lifestyle",
    type: "check",
    hint: "Avoided refined sugars",
  },
  {
    id: "screen",
    label: "Screen Time ≤ 4h",
    icon: "📵",
    category: "lifestyle",
    type: "counter",
    hint: "Hours recreational screen",
    max: 12,
    goal: 4,
    inverted: true,
  },
  {
    id: "reading",
    label: "Reading (30+ min)",
    icon: "📖",
    category: "lifestyle",
    type: "check",
    hint: "Read a book or paper",
  },
  {
    id: "writing",
    label: "Writing Practice",
    icon: "✍️",
    category: "lifestyle",
    type: "check",
    hint: "Journaled or wrote creatively",
  },
  {
    id: "litreview",
    label: "Literature Review",
    icon: "🔬",
    category: "research",
    type: "check",
    hint: "Read & reviewed research papers",
  },
  {
    id: "deepwork",
    label: "Deep Work Session (2h+)",
    icon: "🧠",
    category: "research",
    type: "check",
    hint: "Uninterrupted focus block",
  },
  {
    id: "notes",
    label: "Research Notes / Zotero",
    icon: "🗂️",
    category: "research",
    type: "check",
    hint: "Annotated or organized references",
  },
];
const TOTAL = TASKS.length;

function getScore(d = {}) {
  return TASKS.reduce((acc, t) => {
    if (t.type === "check") return acc + (d[t.id] ? 1 : 0);
    const v = d[t.id] ?? 0;
    return acc + (t.inverted ? v <= t.goal : v >= t.goal ? 1 : 0);
  }, 0);
}

export default function PersonalTrack() {
  const { t } = useTheme();
  const today = new Date().toISOString().split("T")[0];
  const [data, setData] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("today");
  const [cv, setCv] = useState("daily");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const { data: rows } = await supabase
      .from("daily_logs")
      .select("*")
      .gte("log_date", from.toISOString().split("T")[0])
      .order("log_date");
    if (rows) {
      const td = rows.find((r) => r.log_date === today);
      if (td?.task_data) setData(td.task_data);
      setHistory(rows);
    }
    setLoading(false);
  }

  async function update(id, val) {
    const next = { ...data, [id]: val };
    setData(next);
    setSaving(true);
    const score = getScore(next);
    await supabase
      .from("daily_logs")
      .upsert(
        {
          log_date: today,
          task_data: next,
          score,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "log_date" },
      );
    setHistory((h) => {
      const e = h.find((r) => r.log_date === today);
      return e
        ? h.map((r) =>
            r.log_date === today ? { ...r, task_data: next, score } : r,
          )
        : [...h, { log_date: today, task_data: next, score }];
    });
    setSaving(false);
  }

  const score = getScore(data);
  const sc = (s) => {
    const p = s / TOTAL;
    return p >= 0.8 ? t.success : p >= 0.5 ? t.warn : t.danger;
  };

  const dChart = history.slice(-30).map((r) => ({
    label: new Date(r.log_date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: r.score || 0,
    date: r.log_date,
  }));
  const mMap = {};
  history.forEach((r) => {
    const mk = r.log_date.slice(0, 7);
    if (!mMap[mk]) mMap[mk] = [];
    mMap[mk].push(r.score || 0);
  });
  const mChart = Object.entries(mMap).map(([mk, s]) => ({
    label: new Date(mk + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    avg: parseFloat((s.reduce((a, b) => a + b, 0) / s.length).toFixed(1)),
    days: s.length,
    month: mk,
  }));

  const CheckTask = ({ task, value, onChange }) => {
    const on = !!value;
    return (
      <button
        onClick={() => onChange(!on)}
        style={{
          background: on ? t.accentGlow : "transparent",
          border: `1.5px solid ${on ? t.accent : t.border}`,
          borderRadius: "12px",
          padding: "12px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          transition: "all 0.2s",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "18px" }}>{task.icon}</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: on ? t.textPrimary : t.textSecond,
              fontSize: "13px",
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: "600",
            }}
          >
            {task.label}
          </div>
          <div
            style={{
              color: t.textMuted,
              fontSize: "10px",
              marginTop: "1px",
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            {task.hint}
          </div>
        </div>
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            background: on ? t.accent : "transparent",
            border: `2px solid ${on ? t.accent : t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: on ? "white" : t.textMuted,
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          {on ? "✓" : "✗"}
        </div>
      </button>
    );
  };

  const CounterTask = ({ task, value, onChange }) => {
    const v = value ?? 0;
    const met = task.inverted ? v <= task.goal : v >= task.goal;
    return (
      <div
        style={{
          background: met ? t.accentGlow : "transparent",
          border: `1.5px solid ${met ? t.accent : t.border}`,
          borderRadius: "12px",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          transition: "all 0.2s",
        }}
      >
        <span style={{ fontSize: "18px" }}>{task.icon}</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: met ? t.textPrimary : t.textSecond,
              fontSize: "13px",
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: "600",
            }}
          >
            {task.label}
          </div>
          <div
            style={{
              color: t.textMuted,
              fontSize: "10px",
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            {task.hint}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          {[-1, 1].map((d) => (
            <button
              key={d}
              onClick={() => onChange(Math.min(task.max, Math.max(0, v + d)))}
              style={{
                width: "28px",
                height: "28px",
                background: t.bgInput,
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                color: t.accentBright,
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {d < 0 ? "−" : "+"}
            </button>
          ))}
          <span
            style={{
              color: met ? t.accentBright : t.textSecond,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: "15px",
              minWidth: "22px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {v}
          </span>
        </div>
      </div>
    );
  };

  const SH = ({ label }) => (
    <div
      style={{
        color: t.textMuted,
        fontSize: "9.5px",
        fontFamily: "'JetBrains Mono',monospace",
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        marginBottom: "10px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span>{label}</span>
      <div style={{ flex: 1, height: "1px", background: t.border }} />
    </div>
  );

  const TT = ({ active, payload, label }) =>
    !active || !payload?.length ? null : (
      <div
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: "10px",
          padding: "10px 14px",
        }}
      >
        <div
          style={{
            color: t.textMuted,
            fontSize: "10px",
            fontFamily: "'JetBrains Mono',monospace",
            marginBottom: "4px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            color: t.accentBright,
            fontSize: "16px",
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: "600",
          }}
        >
          {payload[0].value}/{TOTAL}
        </div>
      </div>
    );

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div style={{ color: t.accentBright, opacity: 0.7 }}>Loading…</div>
      </div>
    );

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "9px 14px",
        color: tab === id ? t.accentBright : t.textMuted,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        borderBottom:
          tab === id ? `2px solid ${t.accentBright}` : "2px solid transparent",
        marginBottom: "-1px",
        transition: "color 0.2s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        padding: "24px 16px 100px",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${t.border}`,
          paddingBottom: "16px",
          marginBottom: "0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                color: t.textMuted,
                fontSize: "10px",
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Personal Track
            </div>
            <div
              style={{
                color: t.textPrimary,
                fontSize: "20px",
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: "700",
                letterSpacing: "-0.5px",
                marginTop: "2px",
              }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          {/* Score ring */}
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke={t.border}
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke={sc(score)}
              strokeWidth="6"
              strokeDasharray={`${(score / TOTAL) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dasharray 0.6s" }}
            />
            <text
              x="40"
              y="36"
              textAnchor="middle"
              fill={sc(score)}
              fontSize="16"
              fontFamily="'Space Grotesk',sans-serif"
              fontWeight="700"
            >
              {score}
            </text>
            <text
              x="40"
              y="50"
              textAnchor="middle"
              fill={t.textMuted}
              fontSize="9"
            >
              /{TOTAL}
            </text>
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${t.border}`,
          marginBottom: "20px",
        }}
      >
        {tabBtn("today", "Today")}
        {tabBtn("graphs", "Graphs")}
        {tabBtn("history", "History")}
        {saving && (
          <span
            style={{
              marginLeft: "auto",
              color: t.accentBright,
              fontSize: "10px",
              fontFamily: "'JetBrains Mono',monospace",
              alignSelf: "center",
              opacity: 0.7,
            }}
          >
            saving…
          </span>
        )}
      </div>

      {tab === "today" && (
        <>
          {/* progress bar */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  color: t.textMuted,
                  fontSize: "10px",
                  fontFamily: "'JetBrains Mono',monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Score
              </span>
              <span
                style={{
                  color: t.accentBright,
                  fontSize: "12px",
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: "700",
                }}
              >
                {score}/{TOTAL}
              </span>
            </div>
            <div
              style={{
                height: "6px",
                background: t.bgInput,
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(score / TOTAL) * 100}%`,
                  background: `linear-gradient(90deg,${t.accent},${t.accentBright})`,
                  borderRadius: "3px",
                  transition: "width 0.5s",
                }}
              />
            </div>
            <div
              style={{
                color: t.textMuted,
                fontSize: "10px",
                fontFamily: "'JetBrains Mono',monospace",
                marginTop: "5px",
              }}
            >
              {score >= 9
                ? "🏆 Exceptional"
                : score >= 7
                  ? "⚡ Strong"
                  : score >= 5
                    ? "📈 Good progress"
                    : score >= 3
                      ? "🔄 Keep going"
                      : "🌱 Start here"}
            </div>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <SH label="Lifestyle" />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "7px" }}
            >
              {TASKS.filter((t) => t.category === "lifestyle").map((task) =>
                task.type === "check" ? (
                  <CheckTask
                    key={task.id}
                    task={task}
                    value={data[task.id]}
                    onChange={(v) => update(task.id, v)}
                  />
                ) : (
                  <CounterTask
                    key={task.id}
                    task={task}
                    value={data[task.id]}
                    onChange={(v) => update(task.id, v)}
                  />
                ),
              )}
            </div>
          </div>
          <div>
            <SH label="Research" />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "7px" }}
            >
              {TASKS.filter((t) => t.category === "research").map((task) => (
                <CheckTask
                  key={task.id}
                  task={task}
                  value={data[task.id]}
                  onChange={(v) => update(task.id, v)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "graphs" && (
        <>
          <div
            style={{
              display: "flex",
              background: t.bgInput,
              borderRadius: "8px",
              padding: "3px",
              marginBottom: "18px",
              width: "fit-content",
            }}
          >
            {["daily", "monthly"].map((v) => (
              <button
                key={v}
                onClick={() => setCv(v)}
                style={{
                  background: cv === v ? t.bgCard : "none",
                  border:
                    cv === v
                      ? `1px solid ${t.border}`
                      : "1px solid transparent",
                  borderRadius: "6px",
                  padding: "6px 16px",
                  cursor: "pointer",
                  color: cv === v ? t.accentBright : t.textMuted,
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {cv === "daily" && dChart.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      color: t.textPrimary,
                      fontSize: "14px",
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontWeight: "600",
                    }}
                  >
                    Daily Score
                  </div>
                  <div
                    style={{
                      color: t.textMuted,
                      fontSize: "9px",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    Last {dChart.length} days
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      color: t.accentBright,
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontSize: "20px",
                      fontWeight: "700",
                    }}
                  >
                    {(
                      dChart.reduce((a, b) => a + b.score, 0) / dChart.length
                    ).toFixed(1)}
                  </div>
                  <div
                    style={{
                      color: t.textMuted,
                      fontSize: "9px",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    avg
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart
                  data={dChart}
                  margin={{ top: 5, right: 4, left: -28, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={t.accent}
                        stopOpacity={0.3}
                      />
                      <stop offset="95%" stopColor={t.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={t.borderLight}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: t.textMuted, fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, TOTAL]}
                    tick={{ fill: t.textMuted, fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TT />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={t.accentBright}
                    strokeWidth={2}
                    fill="url(#sg)"
                    dot={{ fill: t.accentBright, r: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ marginTop: "20px" }}>
                <SH label="Task hit rate — last 7 days" />
                {TASKS.map((task) => {
                  const last7 = dChart.slice(-7);
                  const hits = last7.filter(({ date }) => {
                    const d =
                      history.find((r) => r.log_date === date)?.task_data ?? {};
                    if (task.type === "check") return !!d[task.id];
                    const v = d[task.id] ?? 0;
                    return task.inverted ? v <= task.goal : v >= task.goal;
                  }).length;
                  return (
                    <div key={task.id} style={{ marginBottom: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "3px",
                        }}
                      >
                        <span
                          style={{
                            color: t.textSecond,
                            fontSize: "11px",
                            fontFamily: "'Space Grotesk',sans-serif",
                          }}
                        >
                          {task.icon} {task.label}
                        </span>
                        <span
                          style={{
                            color:
                              hits >= 5
                                ? t.success
                                : hits >= 3
                                  ? t.warn
                                  : t.danger,
                            fontSize: "10px",
                            fontFamily: "'JetBrains Mono',monospace",
                          }}
                        >
                          {hits}/7
                        </span>
                      </div>
                      <div
                        style={{
                          height: "4px",
                          background: t.bgInput,
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(hits / Math.max(last7.length, 1)) * 100}%`,
                            background: `linear-gradient(90deg,${t.accent},${t.accentBright})`,
                            borderRadius: "2px",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {cv === "monthly" && (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={mChart}
                  margin={{ top: 5, right: 4, left: -28, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={t.borderLight}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: t.textMuted, fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, TOTAL]}
                    tick={{ fill: t.textMuted, fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="avg" radius={[5, 5, 0, 0]}>
                    {mChart.map((e, i) => (
                      <Cell
                        key={i}
                        fill={
                          e.avg >= 8
                            ? t.success
                            : e.avg >= 6
                              ? t.warn
                              : t.danger
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {mChart.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                    marginTop: "16px",
                  }}
                >
                  {[
                    {
                      label: "Best Month",
                      value: mChart.reduce((a, b) => (b.avg > a.avg ? b : a))
                        .label,
                    },
                    { label: "Months", value: `${mChart.length}` },
                    {
                      label: "All-time Avg",
                      value: (
                        mChart.reduce((a, b) => a + b.avg, 0) / mChart.length
                      ).toFixed(1),
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        background: t.bgCard,
                        border: `1px solid ${t.border}`,
                        borderRadius: "10px",
                        padding: "10px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          color: t.accentBright,
                          fontFamily: "'Space Grotesk',sans-serif",
                          fontSize: "16px",
                          fontWeight: "700",
                        }}
                      >
                        {value}
                      </div>
                      <div
                        style={{
                          color: t.textMuted,
                          fontSize: "9px",
                          fontFamily: "'JetBrains Mono',monospace",
                          textTransform: "uppercase",
                          marginTop: "2px",
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "history" && (
        <>
          <div
            style={{
              color: t.textMuted,
              fontSize: "10px",
              fontFamily: "'JetBrains Mono',monospace",
              marginBottom: "14px",
            }}
          >
            {history.length} days logged
          </div>
          {[...history].reverse().map((r) => {
            const s = r.score || 0;
            const col = sc(s);
            const label = new Date(r.log_date + "T00:00:00").toLocaleDateString(
              "en-US",
              { weekday: "short", month: "short", day: "numeric" },
            );
            const isToday = r.log_date === today;
            return (
              <div
                key={r.log_date}
                style={{
                  background: t.bgCard,
                  border: `1px solid ${isToday ? t.borderAccent : t.border}`,
                  borderRadius: "12px",
                  padding: "12px 14px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: t.textSecond,
                        fontFamily: "'Space Grotesk',sans-serif",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      {label}
                    </span>
                    {isToday && (
                      <span
                        style={{
                          color: t.accentBright,
                          fontSize: "9px",
                          fontFamily: "'JetBrains Mono',monospace",
                          background: t.accentGlow,
                          padding: "1px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        today
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      height: "4px",
                      background: t.bgInput,
                      borderRadius: "2px",
                      marginTop: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(s / TOTAL) * 100}%`,
                        background: `linear-gradient(90deg,${t.accent},${t.accentBright})`,
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "3px",
                      marginTop: "5px",
                      flexWrap: "wrap",
                    }}
                  >
                    {TASKS.map((task) => {
                      const d = r.task_data || {};
                      const done =
                        task.type === "check"
                          ? !!d[task.id]
                          : task.inverted
                            ? (d[task.id] ?? 0) <= task.goal
                            : (d[task.id] ?? 0) >= task.goal;
                      return (
                        <span
                          key={task.id}
                          title={task.label}
                          style={{ fontSize: "9px", opacity: done ? 1 : 0.2 }}
                        >
                          {task.icon}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      color: col,
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    {s}
                  </span>
                  <span style={{ color: t.textMuted, fontSize: "11px" }}>
                    /{TOTAL}
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
