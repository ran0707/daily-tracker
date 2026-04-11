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

const INC_CATS = [
  "Salary",
  "Freelance",
  "Research Grant",
  "Investment",
  "Gift",
  "Other Income",
];
const EXP_CATS = [
  "Food",
  "Transport",
  "Books & Research",
  "Utilities",
  "Healthcare",
  "Shopping",
  "Entertainment",
  "Rent",
  "Savings",
  "Other",
];
const PC = [
  "#7c5cbf",
  "#4eab7a",
  "#e0a030",
  "#e05555",
  "#3a8080",
  "#c0893a",
  "#6a5acd",
  "#a0604a",
];
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function FinancialTrack() {
  const { t } = useTheme();
  const today = new Date().toISOString().split("T")[0];
  const mk = today.slice(0, 7);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("today");
  const [showAdd, setShowAdd] = useState(false);
  const [aiTxt, setAiTxt] = useState("");
  const [loadAI, setLoadAI] = useState(false);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const { data } = await supabase
      .from("financial_logs")
      .select("*")
      .gte("log_date", from.toISOString().split("T")[0])
      .order("created_at", { ascending: false });
    setTxns(data || []);
    setLoading(false);
  }

  async function addTxn() {
    if (!amount || !cat) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("financial_logs")
      .insert({
        log_date: today,
        type,
        amount: parseFloat(amount),
        category: cat,
        note,
      })
      .select()
      .single();
    if (!error && data) {
      setTxns((x) => [data, ...x]);
      setAmount("");
      setCat("");
      setNote("");
      setShowAdd(false);
    }
    setSaving(false);
  }

  async function delTxn(id) {
    await supabase.from("financial_logs").delete().eq("id", id);
    setTxns((x) => x.filter((r) => r.id !== id));
  }

  const todayT = txns.filter((x) => x.log_date === today);
  const todayIn = todayT
    .filter((x) => x.type === "income")
    .reduce((a, b) => a + Number(b.amount), 0);
  const todayEx = todayT
    .filter((x) => x.type === "expense")
    .reduce((a, b) => a + Number(b.amount), 0);
  const mT = txns.filter((x) => x.log_date.startsWith(mk));
  const mIn = mT
    .filter((x) => x.type === "income")
    .reduce((a, b) => a + Number(b.amount), 0);
  const mEx = mT
    .filter((x) => x.type === "expense")
    .reduce((a, b) => a + Number(b.amount), 0);
  const bal = mIn - mEx;

  const catMap = {};
  mT.filter((x) => x.type === "expense").forEach((x) => {
    catMap[x.category] = (catMap[x.category] || 0) + Number(x.amount);
  });
  const pieData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const dayMap = {};
  txns.forEach((x) => {
    if (!dayMap[x.log_date]) dayMap[x.log_date] = { inc: 0, exp: 0 };
    dayMap[x.log_date][x.type === "income" ? "inc" : "exp"] += Number(x.amount);
  });
  const barData = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([d, v]) => ({
      label: new Date(d + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      Income: v.inc,
      Expense: v.exp,
    }));

  async function getAI() {
    const key = localStorage.getItem("anthropic_key");
    if (!key) {
      setAiTxt("⚙️ Add Anthropic API key in Profile.");
      return;
    }
    setLoadAI(true);
    try {
      const top = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k, v]) => `${k}:₹${fmt(v)}`)
        .join(", ");
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
              content: `Financial advisor for a researcher in India. Give 2-3 specific actionable money insights. Monthly income ₹${fmt(mIn)}, expenses ₹${fmt(mEx)}, balance ₹${fmt(bal)}, savings ${mIn > 0 ? ((bal / mIn) * 100).toFixed(0) : 0}%, top expenses: ${top}. Be specific and practical.`,
            },
          ],
        }),
      });
      const d = await res.json();
      setAiTxt(d.content?.[0]?.text || "No insight.");
    } catch {
      setAiTxt("Failed. Check API key.");
    }
    setLoadAI(false);
  }

  const inp = (
    label,
    val,
    setVal,
    type = "text",
    placeholder = "",
    extra = {},
  ) => (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          color: t.textMuted,
          fontSize: "9px",
          fontFamily: "'JetBrains Mono',monospace",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: t.bgInput,
          border: `1px solid ${t.border}`,
          borderRadius: "10px",
          padding: "10px 12px",
          color: t.textPrimary,
          fontFamily: "'Space Grotesk',sans-serif",
          fontSize: "14px",
          outline: "none",
          boxSizing: "border-box",
          ...extra,
        }}
      />
    </div>
  );

  const TxnRow = ({ txn }) => {
    const isIn = txn.type === "income";
    return (
      <div
        style={{
          background: t.bgCard,
          border: `1px solid ${isIn ? t.successBorder : t.dangerBorder}`,
          borderRadius: "12px",
          padding: "12px 14px",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            flexShrink: 0,
            background: isIn ? t.successBg : t.dangerBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isIn ? t.success : t.danger,
            fontSize: "16px",
            fontWeight: "700",
          }}
        >
          {isIn ? "↑" : "↓"}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: t.textSecond,
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            {txn.category}
          </div>
          {txn.note && (
            <div
              style={{
                color: t.textMuted,
                fontSize: "10px",
                fontFamily: "'JetBrains Mono',monospace",
                marginTop: "1px",
              }}
            >
              {txn.note}
            </div>
          )}
        </div>
        <div
          style={{
            color: isIn ? t.success : t.danger,
            fontFamily: "'Space Grotesk',sans-serif",
            fontSize: "16px",
            fontWeight: "700",
          }}
        >
          {isIn ? "+" : "−"}₹{fmt(txn.amount)}
        </div>
        <button
          onClick={() => delTxn(txn.id)}
          style={{
            background: "none",
            border: "none",
            color: t.textMuted,
            cursor: "pointer",
            fontSize: "16px",
            padding: "4px",
          }}
        >
          ✕
        </button>
      </div>
    );
  };

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "9px 12px",
        color: tab === id ? t.accentBright : t.textMuted,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: "9.5px",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        borderBottom:
          tab === id ? `2px solid ${t.accentBright}` : "2px solid transparent",
        marginBottom: "-1px",
      }}
    >
      {label}
    </button>
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
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
            Finance Track
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
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            background: showAdd ? t.bgHover : t.accentGlow,
            border: `1.5px solid ${t.accent}`,
            borderRadius: "12px",
            padding: "8px 18px",
            color: t.accentBright,
            fontSize: "12px",
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {showAdd ? "✕ Close" : "+ Add"}
        </button>
      </div>

      {/* Balance row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        {[
          ["↑", "Income", mIn, t.success, t.successBg, t.successBorder],
          ["↓", "Expense", mEx, t.danger, t.dangerBg, t.dangerBorder],
          [
            "=",
            "Balance",
            Math.abs(bal),
            bal >= 0 ? t.success : t.danger,
            bal >= 0 ? t.successBg : t.dangerBg,
            bal >= 0 ? t.successBorder : t.dangerBorder,
          ],
        ].map(([ic, lb, val, col, bg, bo]) => (
          <div
            key={lb}
            style={{
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
                fontSize: "8px",
                fontFamily: "'JetBrains Mono',monospace",
                marginBottom: "4px",
              }}
            >
              {ic} {lb.toUpperCase()}
            </div>
            <div
              style={{
                color: col,
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              ₹{fmt(val)}
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div
          style={{
            background: t.bgCard,
            border: `1px solid ${t.borderAccent}`,
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              color: t.textPrimary,
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "14px",
            }}
          >
            New Transaction
          </div>
          <div
            style={{
              display: "flex",
              background: t.bgInput,
              borderRadius: "10px",
              padding: "3px",
              marginBottom: "12px",
            }}
          >
            {["expense", "income"].map((v) => (
              <button
                key={v}
                onClick={() => {
                  setType(v);
                  setCat("");
                }}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  background:
                    type === v
                      ? v === "income"
                        ? t.successBg
                        : t.dangerBg
                      : "none",
                  border:
                    type === v
                      ? `1px solid ${v === "income" ? t.successBorder : t.dangerBorder}`
                      : "1px solid transparent",
                  color:
                    type === v
                      ? v === "income"
                        ? t.success
                        : t.danger
                      : t.textMuted,
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {v === "income" ? "↑ Income" : "↓ Expense"}
              </button>
            ))}
          </div>
          {inp("Amount (₹)", amount, setAmount, "number", "0.00")}
          <div style={{ marginBottom: "10px" }}>
            <div
              style={{
                color: t.textMuted,
                fontSize: "9px",
                fontFamily: "'JetBrains Mono',monospace",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: "6px",
              }}
            >
              Category
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {(type === "income" ? INC_CATS : EXP_CATS).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontFamily: "'Space Grotesk',sans-serif",
                    transition: "all 0.15s",
                    background: cat === c ? t.accentGlow : t.bgInput,
                    border: `1px solid ${cat === c ? t.accent : t.border}`,
                    color: cat === c ? t.accentBright : t.textMuted,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          {inp("Note (optional)", note, setNote, "text", "Brief description…")}
          <button
            onClick={addTxn}
            disabled={saving || !amount || !cat}
            style={{
              width: "100%",
              padding: "12px",
              background: !amount || !cat ? t.bgInput : t.accent,
              border: "none",
              borderRadius: "10px",
              cursor: saving ? "wait" : "pointer",
              color: !amount || !cat ? t.textMuted : "white",
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
          >
            {saving ? "Saving…" : "Add Transaction"}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${t.border}`,
          marginBottom: "18px",
        }}
      >
        {tabBtn("today", "Today")}
        {tabBtn("month", "Month")}
        {tabBtn("charts", "Charts")}
        {tabBtn("ai", "AI")}
      </div>

      {tab === "today" && (
        <>
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
            {[
              [todayIn, t.success, t.successBg, t.successBorder, "↑ TODAY IN"],
              [todayEx, t.danger, t.dangerBg, t.dangerBorder, "↓ TODAY OUT"],
            ].map(([val, col, bg, bo, lb]) => (
              <div
                key={lb}
                style={{
                  flex: 1,
                  background: bg,
                  border: `1px solid ${bo}`,
                  borderRadius: "12px",
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: col,
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: "20px",
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
                  {lb}
                </div>
              </div>
            ))}
          </div>
          {todayT.length === 0 ? (
            <div
              style={{
                color: t.textMuted,
                textAlign: "center",
                padding: "40px 0",
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: "15px",
              }}
            >
              No transactions today.
              <br />
              <span style={{ fontSize: "12px" }}>Tap + Add to record one.</span>
            </div>
          ) : (
            todayT.map((x) => <TxnRow key={x.id} txn={x} />)
          )}
        </>
      )}

      {tab === "month" && (
        <>
          {Object.entries(
            txns
              .filter((x) => x.log_date.startsWith(mk))
              .reduce((acc, x) => {
                if (!acc[x.log_date]) acc[x.log_date] = [];
                acc[x.log_date].push(x);
                return acc;
              }, {}),
          )
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, xs]) => (
              <div key={date} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    color: t.textMuted,
                    fontSize: "10px",
                    fontFamily: "'JetBrains Mono',monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "6px",
                  }}
                >
                  {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {xs.map((x) => (
                  <TxnRow key={x.id} txn={x} />
                ))}
              </div>
            ))}
          {mT.length === 0 && (
            <div
              style={{
                color: t.textMuted,
                textAlign: "center",
                padding: "40px 0",
              }}
            >
              No transactions this month.
            </div>
          )}
        </>
      )}

      {tab === "charts" && (
        <>
          {barData.length > 0 && (
            <>
              <div
                style={{
                  color: t.textPrimary,
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "12px",
                }}
              >
                Income vs Expense
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={barData}
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
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: t.textMuted, fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                  />
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
                  <Bar
                    dataKey="Income"
                    fill={t.success}
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="Expense"
                    fill={t.danger}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  margin: "8px 0 20px",
                }}
              >
                {[
                  [t.success, "Income"],
                  [t.danger, "Expense"],
                ].map(([c, l]) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
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
            </>
          )}
          {pieData.length > 0 && (
            <>
              <div
                style={{
                  color: t.textPrimary,
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "12px",
                }}
              >
                Expense Breakdown
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={58}
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
                  {pieData.map((d, i) => (
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
            </>
          )}
          {barData.length === 0 && (
            <div
              style={{
                color: t.textMuted,
                textAlign: "center",
                padding: "40px 0",
              }}
            >
              Add transactions to see charts.
            </div>
          )}
        </>
      )}

      {tab === "ai" && (
        <div
          style={{
            background: t.bgCard,
            border: `1px solid ${t.borderAccent}`,
            borderRadius: "14px",
            padding: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                color: t.textPrimary,
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: "15px",
                fontWeight: "600",
              }}
            >
              🤖 AI Financial Coach
            </div>
            <button
              onClick={getAI}
              disabled={loadAI}
              style={{
                background: t.accentGlow,
                border: `1px solid ${t.borderAccent}`,
                borderRadius: "8px",
                padding: "6px 14px",
                cursor: loadAI ? "wait" : "pointer",
                color: t.accentBright,
                fontSize: "10px",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {loadAI ? "…" : "Analyse"}
            </button>
          </div>
          <div
            style={{
              background: t.bgInput,
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "12px",
            }}
          >
            {[
              ["Monthly Income", `₹${fmt(mIn)}`, t.success],
              ["Monthly Expense", `₹${fmt(mEx)}`, t.danger],
              [
                "Net Balance",
                `₹${fmt(Math.abs(bal))}`,
                bal >= 0 ? t.success : t.danger,
              ],
              [
                "Savings Rate",
                mIn > 0 ? `${((bal / mIn) * 100).toFixed(0)}%` : "—",
                t.accentBright,
              ],
            ].map(([lb, val, col]) => (
              <div
                key={lb}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: t.textMuted,
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {lb}
                </span>
                <span
                  style={{
                    color: col,
                    fontSize: "14px",
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: "600",
                  }}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              color: aiTxt ? t.textSecond : t.textMuted,
              fontSize: "12px",
              fontFamily: "'Space Grotesk',sans-serif",
              lineHeight: 1.8,
              fontStyle: aiTxt ? "italic" : "normal",
            }}
          >
            {aiTxt || "Tap Analyse for personalised financial recommendations."}
          </div>
        </div>
      )}
    </div>
  );
}
