import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/ThemeContext";

const TOTAL = 10;

function getScore(d = {}) {
  const TASKS = [
    { id: "wakeup", type: "check" },
    { id: "water", type: "counter", goal: 8, inverted: false },
    { id: "noporn", type: "check" },
    { id: "nosugar", type: "check" },
    { id: "screen", type: "counter", goal: 4, inverted: true },
    { id: "reading", type: "check" },
    { id: "writing", type: "check" },
    { id: "litreview", type: "check" },
    { id: "deepwork", type: "check" },
    { id: "notes", type: "check" },
  ];
  return TASKS.reduce((acc, t) => {
    if (t.type === "check") return acc + (d[t.id] ? 1 : 0);
    const v = d[t.id] ?? 0;
    return acc + (t.inverted ? v <= t.goal : v >= t.goal ? 1 : 0);
  }, 0);
}

function scoreColor(s, t) {
  const p = s / TOTAL;
  return p >= 0.8 ? t.success : p >= 0.5 ? t.warn : t.danger;
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function Dashboard({ setPage }) {
  const { t } = useTheme();
  const [personal, setPersonal] = useState([]);
  const [finance, setFinance] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const f = from.toISOString().split("T")[0];
    const [{ data: p }, { data: fi }] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("*")
        .gte("log_date", f)
        .order("log_date"),
      supabase
        .from("financial_logs")
        .select("*")
        .gte("log_date", f)
        .order("log_date"),
    ]);
    setPersonal(p || []);
    setFinance(fi || []);
    setLoading(false);
  }

  const todayP = personal.find((d) => d.log_date === today);
  const todayScore = todayP?.score ?? 0;
  const mk = today.slice(0, 7);
  const mFin = finance.filter((d) => d.log_date.startsWith(mk));
  const mInc = mFin
    .filter((d) => d.type === "income")
    .reduce((a, b) => a + Number(b.amount), 0);
  const mExp = mFin
    .filter((d) => d.type === "expense")
    .reduce((a, b) => a + Number(b.amount), 0);
  const bal = mInc - mExp;
  const savR = mInc > 0 ? ((bal / mInc) * 100).toFixed(0) + "%" : "—";
  const avgP = personal.length
    ? (
        personal.reduce((a, b) => a + (b.score || 0), 0) / personal.length
      ).toFixed(1)
    : "0";

  const pChart = personal.slice(-14).map((d) => ({
    label: new Date(d.log_date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: d.score || 0,
  }));

  const dayMap = {};
  finance.forEach((d) => {
    if (!dayMap[d.log_date]) dayMap[d.log_date] = { inc: 0, exp: 0 };
    dayMap[d.log_date][d.type === "income" ? "inc" : "exp"] += Number(d.amount);
  });
  const fChart = Object.entries(dayMap)
    .slice(-14)
    .map(([date, v]) => ({
      label: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      Income: v.inc,
      Expense: v.exp,
    }));

  const catMap = {};
  mFin
    .filter((d) => d.type === "expense")
    .forEach((d) => {
      catMap[d.category] = (catMap[d.category] || 0) + Number(d.amount);
    });
  const pieData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  const PC = ["#7c5cbf", "#4eab7a", "#e0a030", "#e05555", "#3a8080", "#c0893a"];

  const card = (children, extra = {}) => (
    <div
      style={{
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: "16px",
        padding: "16px",
        transition: "background 0.3s",
        ...extra,
      }}
    >
      {children}
    </div>
  );

  const statCard = (icon, label, value, sub, color) =>
    card(
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
        <div
          style={{
            color: color || t.accentBright,
            fontFamily: "'Space Grotesk',sans-serif",
            fontSize: "22px",
            fontWeight: "700",
          }}
        >
          {value}
        </div>
        {sub && (
          <div
            style={{
              color: t.textMuted,
              fontSize: "10px",
              fontFamily: "'JetBrains Mono',monospace",
              marginTop: "2px",
            }}
          >
            {sub}
          </div>
        )}
        <div
          style={{
            color: t.textMuted,
            fontSize: "9px",
            fontFamily: "'JetBrains Mono',monospace",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginTop: "4px",
          }}
        >
          {label}
        </div>
      </div>,
    );

  const TT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
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
        {payload.map((p, i) => (
          <div
            key={i}
            style={{
              color: p.color,
              fontSize: "14px",
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: "600",
            }}
          >
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  async function getAI() {
    const key = localStorage.getItem("anthropic_key");
    if (!key) {
      setAiInsight("⚙️ Add Anthropic API key in Profile to enable AI.");
      return;
    }
    setLoadingAI(true);
    setAiInsight("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 350,
          messages: [
            {
              role: "user",
              content: `Personal AI coach for a researcher. Give 3 short specific insights (habits+finance). Be direct and motivating. Data: avg score ${avgP}/10, today ${todayScore}/10, ${personal.length} days tracked, monthly income ₹${fmt(mInc)}, expenses ₹${fmt(mExp)}, balance ₹${fmt(bal)}, savings ${savR}, top expenses: ${Object.entries(
                catMap,
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([k, v]) => k + ":₹" + fmt(v))
                .join(", ")}`,
            },
          ],
        }),
      });
      const d = await res.json();
      setAiInsight(d.content?.[0]?.text || "No insight.");
    } catch {
      setAiInsight("Failed. Check API key.");
    }
    setLoadingAI(false);
  }

  if (loading)
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            color: t.accentBright,
            fontFamily: "'Space Grotesk',sans-serif",
            opacity: 0.7,
          }}
        >
          Loading…
        </div>
      </div>
    );

  return (
    <div style={{ padding: "24px 16px", maxWidth: "500px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            color: t.textMuted,
            fontSize: "10px",
            fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Dashboard
        </div>
        <div
          style={{
            color: t.textPrimary,
            fontSize: "22px",
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: "700",
            marginTop: "2px",
            letterSpacing: "-0.5px",
          }}
        >
          {dateLabel}
        </div>
      </div>

      {/* Stat grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        {statCard(
          "🧠",
          "Today Score",
          `${todayScore}/${TOTAL}`,
          todayScore >= 7
            ? "Strong day"
            : todayScore >= 5
              ? "Good progress"
              : "Keep going",
          scoreColor(todayScore, t),
        )}
        {statCard(
          "💰",
          "Month Balance",
          `₹${fmt(Math.abs(bal))}`,
          bal >= 0 ? "surplus" : "deficit",
          bal >= 0 ? t.success : t.danger,
        )}
        {statCard("📈", "Avg Score", avgP, `${personal.length} days tracked`)}
        {statCard(
          "💸",
          "Savings Rate",
          savR,
          `₹${fmt(mInc)} income`,
          bal >= 0 ? t.success : t.danger,
        )}
      </div>

      {/* Today finance */}
      {card(
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                color: t.textPrimary,
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Today's Finance
            </div>
            <button
              onClick={() => setPage("finance")}
              style={{
                background: "none",
                border: "none",
                color: t.accentBright,
                fontSize: "11px",
                fontFamily: "'JetBrains Mono',monospace",
                cursor: "pointer",
              }}
            >
              Add →
            </button>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {[
              [
                "↑",
                "Income",
                finance
                  .filter((d) => d.log_date === today && d.type === "income")
                  .reduce((a, b) => a + Number(b.amount), 0),
                t.success,
                t.successBg,
                t.successBorder,
              ],
              [
                "↓",
                "Expense",
                finance
                  .filter((d) => d.log_date === today && d.type === "expense")
                  .reduce((a, b) => a + Number(b.amount), 0),
                t.danger,
                t.dangerBg,
                t.dangerBorder,
              ],
            ].map(([ic, lb, val, col, bg, bo]) => (
              <div
                key={lb}
                style={{
                  flex: 1,
                  background: bg,
                  border: `1px solid ${bo}`,
                  borderRadius: "12px",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: col,
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: "18px",
                    fontWeight: "700",
                  }}
                >
                  ₹{fmt(val)}
                </div>
                <div
                  style={{
                    color: col,
                    fontSize: "9px",
                    fontFamily: "'JetBrains Mono',monospace",
                    marginTop: "2px",
                    opacity: 0.8,
                  }}
                >
                  {ic} {lb.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </>,
        { marginBottom: "14px" },
      )}

      {/* Personal chart */}
      {pChart.length > 0 &&
        card(
          <>
            <div
              style={{
                color: t.textPrimary,
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Personal Score — 14 days
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart
                data={pChart}
                margin={{ top: 5, right: 4, left: -30, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={t.accent} stopOpacity={0.3} />
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
                  fill="url(#pg)"
                  dot={{ fill: t.accentBright, r: 2, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>,
          { marginBottom: "14px" },
        )}

      {/* Finance chart */}
      {fChart.length > 0 &&
        card(
          <>
            <div
              style={{
                color: t.textPrimary,
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Income vs Expense — 14 days
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart
                data={fChart}
                margin={{ top: 5, right: 4, left: -30, bottom: 0 }}
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
                  tick={{ fill: t.textMuted, fontSize: 8 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TT />} />
                <Bar dataKey="Income" fill={t.success} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill={t.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "8px",
                justifyContent: "center",
              }}
            >
              {[
                [t.success, "Income"],
                [t.danger, "Expense"],
              ].map(([c, l]) => (
                <div
                  key={l}
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "2px",
                      background: c,
                    }}
                  />
                  <span
                    style={{
                      color: t.textMuted,
                      fontSize: "9px",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </>,
          { marginBottom: "14px" },
        )}

      {/* Pie */}
      {pieData.length > 0 &&
        card(
          <>
            <div
              style={{
                color: t.textPrimary,
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "10px",
              }}
            >
              This Month Expenses
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PC[i % PC.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `₹${fmt(v)}`}
                    contentStyle={{
                      background: t.bgCard,
                      border: `1px solid ${t.border}`,
                      borderRadius: "8px",
                      color: t.textPrimary,
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {pieData.slice(0, 5).map((d, i) => (
                  <div
                    key={d.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "5px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "2px",
                        flexShrink: 0,
                        background: PC[i % PC.length],
                      }}
                    />
                    <span
                      style={{
                        color: t.textSecond,
                        fontSize: "10px",
                        fontFamily: "'JetBrains Mono',monospace",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.name}
                    </span>
                    <span
                      style={{
                        color: t.accentBright,
                        fontSize: "10px",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      ₹{fmt(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>,
          { marginBottom: "14px" },
        )}

      {/* AI */}
      {card(
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                color: t.textPrimary,
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              🤖 AI Coach
            </div>
            <button
              onClick={getAI}
              disabled={loadingAI}
              style={{
                background: t.accentGlow,
                border: `1px solid ${t.borderAccent}`,
                borderRadius: "8px",
                padding: "5px 14px",
                cursor: loadingAI ? "wait" : "pointer",
                color: t.accentBright,
                fontSize: "10px",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {loadingAI ? "…thinking" : "Analyse"}
            </button>
          </div>
          <div
            style={{
              color: aiInsight ? t.textSecond : t.textHint,
              fontSize: "12px",
              fontFamily: "'Space Grotesk',sans-serif",
              lineHeight: 1.7,
              fontStyle: aiInsight ? "italic" : "normal",
            }}
          >
            {aiInsight ||
              "Tap Analyse for personalised recommendations from AI."}
          </div>
        </>,
        { border: `1px solid ${t.borderAccent}`, marginBottom: "14px" },
      )}

      <div style={{ height: "80px" }} />
    </div>
  );
}
