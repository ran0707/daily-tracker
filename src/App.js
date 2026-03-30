import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

// ─── TASKS ────────────────────────────────────────────────────────────────────
const TASKS = [
  { id: "wakeup",    label: "Wake Up On Time",        icon: "☀️", category: "lifestyle", type: "check",   hint: "Did you wake up at your target time?" },
  { id: "water",     label: "Water Intake",            icon: "💧", category: "lifestyle", type: "counter", hint: "8 glasses = full score", max: 12, goal: 8 },
  { id: "noporn",    label: "No Porn",                 icon: "🔒", category: "lifestyle", type: "check",   hint: "Stayed clean today?" },
  { id: "nosugar",   label: "No Sugar",                icon: "🚫", category: "lifestyle", type: "check",   hint: "Avoided refined sugars" },
  { id: "screen",    label: "Screen Time ≤ 4h",        icon: "📵", category: "lifestyle", type: "counter", hint: "Hours on recreational screen", max: 12, goal: 4, inverted: true },
  { id: "reading",   label: "Reading (30+ min)",       icon: "📖", category: "lifestyle", type: "check",   hint: "Read a book or paper" },
  { id: "writing",   label: "Writing Practice",        icon: "✍️", category: "lifestyle", type: "check",   hint: "Journaled or wrote creatively" },
  { id: "litreview", label: "Literature Review",       icon: "🔬", category: "research",  type: "check",   hint: "Read & reviewed research papers" },
  { id: "deepwork",  label: "Deep Work Session (2h+)", icon: "🧠", category: "research",  type: "check",   hint: "Uninterrupted focus block" },
  { id: "notes",     label: "Research Notes / Zotero", icon: "🗂️", category: "research",  type: "check",   hint: "Annotated or organized references" },
];
const TOTAL = TASKS.length;

const QUOTES = [
  "Small habits, compounded daily, build extraordinary researchers.",
  "The discipline of the body fuels the clarity of the mind.",
  "Every paper read today is a foundation for tomorrow's breakthrough.",
  "Deep work is the currency of academic excellence.",
  "Consistency in small things creates mastery in great ones.",
];

function getTodayKey() { return new Date().toISOString().split("T")[0]; }

function getScore(d = {}) {
  return TASKS.reduce((acc, t) => {
    if (t.type === "check") return acc + (d[t.id] ? 1 : 0);
    const v = d[t.id] ?? 0;
    return acc + (t.inverted ? (v <= t.goal ? 1 : 0) : (v >= t.goal ? 1 : 0));
  }, 0);
}

function scoreColor(s) {
  const p = s / TOTAL;
  return p >= 0.8 ? "#d4a843" : p >= 0.5 ? "#e09a3a" : "#c0724a";
}

function monthKey(date) { return date.slice(0, 7); }

// ─── SCORE ARC ────────────────────────────────────────────────────────────────
function ScoreArc({ score }) {
  const pct = score / TOTAL;
  const r = 52, circ = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#2a2218" strokeWidth="9" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 65 65)"
        style={{ transition: "stroke-dasharray 0.7s cubic-bezier(.4,2,.6,1), stroke 0.4s" }} />
      <text x="65" y="58" textAnchor="middle" fill={color} fontSize="26"
        fontFamily="'Playfair Display',serif" fontWeight="700">{score}</text>
      <text x="65" y="76" textAnchor="middle" fill="#5a4e38" fontSize="12"
        fontFamily="'Playfair Display',serif">/ {TOTAL}</text>
    </svg>
  );
}

// ─── TASK ROWS ────────────────────────────────────────────────────────────────
function CheckTask({ task, value, onChange }) {
  const on = !!value;
  return (
    <button onClick={() => onChange(!on)} style={{
      background: on ? "rgba(212,168,67,0.1)" : "rgba(255,255,255,0.02)",
      border: `1.5px solid ${on ? "#d4a843" : "#2e2416"}`,
      borderRadius: "10px", padding: "13px 15px", cursor: "pointer",
      display: "flex", alignItems: "center", gap: "11px", width: "100%",
      transition: "all 0.2s", textAlign: "left",
    }}>
      <span style={{ fontSize: "18px" }}>{task.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: on ? "#e8d49a" : "#7a6a50", fontSize: "13.5px",
          fontFamily: "'Playfair Display',serif", fontWeight: "600" }}>{task.label}</div>
        <div style={{ color: "#4a3e28", fontSize: "10.5px", marginTop: "2px",
          fontFamily: "'DM Mono',monospace" }}>{task.hint}</div>
      </div>
      <div style={{ width: "26px", height: "26px", borderRadius: "50%",
        background: on ? "#d4a843" : "transparent",
        border: `2px solid ${on ? "#d4a843" : "#2e2416"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", color: on ? "#161008" : "#4a3e28", transition: "all 0.2s", flexShrink: 0 }}>
        {on ? "✓" : "✗"}
      </div>
    </button>
  );
}

function CounterTask({ task, value, onChange }) {
  const v = value ?? 0;
  const met = task.inverted ? v <= task.goal : v >= task.goal;
  return (
    <div style={{
      background: met ? "rgba(212,168,67,0.1)" : "rgba(255,255,255,0.02)",
      border: `1.5px solid ${met ? "#d4a843" : "#2e2416"}`,
      borderRadius: "10px", padding: "13px 15px",
      display: "flex", alignItems: "center", gap: "11px", transition: "all 0.2s",
    }}>
      <span style={{ fontSize: "18px" }}>{task.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: met ? "#e8d49a" : "#7a6a50", fontSize: "13.5px",
          fontFamily: "'Playfair Display',serif", fontWeight: "600" }}>{task.label}</div>
        <div style={{ color: "#4a3e28", fontSize: "10.5px", marginTop: "2px",
          fontFamily: "'DM Mono',monospace" }}>{task.hint}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0 }}>
        <button onClick={() => onChange(Math.max(0, v - 1))}
          style={{ width: "26px", height: "26px", background: "#1e1408",
            border: "1.5px solid #2e2416", borderRadius: "6px", color: "#d4a843",
            fontSize: "15px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center" }}>−</button>
        <span style={{ color: met ? "#d4a843" : "#7a6a50", fontFamily: "'DM Mono',monospace",
          fontSize: "15px", minWidth: "22px", textAlign: "center", fontWeight: "600" }}>{v}</span>
        <button onClick={() => onChange(Math.min(task.max, v + 1))}
          style={{ width: "26px", height: "26px", background: "#1e1408",
            border: "1.5px solid #2e2416", borderRadius: "6px", color: "#d4a843",
            fontSize: "15px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center" }}>+</button>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const s = payload[0].value;
  return (
    <div style={{ background: "#1e1408", border: "1px solid #3a2e18",
      borderRadius: "8px", padding: "10px 14px" }}>
      <div style={{ color: "#5a4e38", fontSize: "10px", fontFamily: "'DM Mono',monospace",
        marginBottom: "4px" }}>{label}</div>
      <div style={{ color: scoreColor(s), fontSize: "18px",
        fontFamily: "'Playfair Display',serif", fontWeight: "700" }}>
        {s} <span style={{ color: "#3a3020", fontSize: "12px" }}>/ {TOTAL}</span>
      </div>
    </div>
  );
}

function HeatmapCalendar({ history, month }) {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDow = new Date(y, m - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${month}-${String(d).padStart(2, "0")}`;
    const score = history[key] !== undefined ? getScore(history[key]) : null;
    cells.push({ day: d, key, score });
  }
  const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px", marginBottom: "4px" }}>
        {DOW.map(d => (
          <div key={d} style={{ color: "#4a3e28", fontSize: "9px",
            fontFamily: "'DM Mono',monospace", textAlign: "center", paddingBottom: "2px" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px" }}>
        {cells.map((c, i) => {
          if (!c) return <div key={`e${i}`} />;
          const isToday = c.key === getTodayKey();
          const col = c.score === null ? "#1e1408"
            : c.score >= 8 ? "#d4a843"
            : c.score >= 6 ? "#c0893a"
            : c.score >= 4 ? "#9a5c30"
            : c.score >= 1 ? "#6a3820"
            : "#2a1e10";
          return (
            <div key={c.key} title={c.score !== null ? `${c.key}: ${c.score}/${TOTAL}` : c.key}
              style={{ aspectRatio: "1", background: col, borderRadius: "4px",
                border: isToday ? "1.5px solid #d4a843" : "1.5px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "9px", color: c.score !== null ? "rgba(255,255,255,0.45)" : "transparent",
                fontFamily: "'DM Mono',monospace", cursor: "default" }}>
              {c.day}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "10px", justifyContent: "flex-end" }}>
        <span style={{ color: "#4a3e28", fontSize: "9px", fontFamily: "'DM Mono',monospace" }}>less</span>
        {["#2a1e10","#6a3820","#9a5c30","#c0893a","#d4a843"].map(c => (
          <div key={c} style={{ width: "11px", height: "11px", background: c, borderRadius: "2px" }} />
        ))}
        <span style={{ color: "#4a3e28", fontSize: "9px", fontFamily: "'DM Mono',monospace" }}>more</span>
      </div>
    </div>
  );
}

function SectionHead({ label }) {
  return (
    <div style={{ color: "#4a3e28", fontSize: "9.5px", fontFamily: "'DM Mono',monospace",
      textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "10px",
      display: "flex", alignItems: "center", gap: "8px" }}>
      <span>{label}</span>
      <div style={{ flex: 1, height: "1px", background: "#221a08" }} />
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DailyTracker() {
  const todayKey = getTodayKey();
  const [data, setData]       = useState({});
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved]     = useState(false);
  const [tab, setTab]         = useState("today");
  const [chartView, setChartView] = useState("daily");
  const [selMonth, setSelMonth]   = useState(monthKey(todayKey));
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    (async () => {
      try {
        const r = await localStorage.get(`tracker:${todayKey}`);
        if (r) setData(JSON.parse(r.value));
      } catch {}
      try {
        const keys = await localStorage.list("tracker:");
        if (keys?.keys) {
          const hist = {};
          for (const k of keys.keys) {
            try {
              const r = await localStorage.get(k);
              if (r) hist[k.replace("tracker:", "")] = JSON.parse(r.value);
            } catch {}
          }
          setHistory(hist);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function updateField(id, val) {
    const next = { ...data, [id]: val };
    setData(next);
    setSaved(false);
    try {
      await localStorage.set(`tracker:${todayKey}`, JSON.stringify(next));
      setHistory(h => ({ ...h, [todayKey]: next }));
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {}
  }

  const score = getScore(data);
  const lifestyle = TASKS.filter(t => t.category === "lifestyle");
  const research  = TASKS.filter(t => t.category === "research");
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const allDays = Object.entries(history).sort(([a], [b]) => a.localeCompare(b));

  const dailyData = allDays.slice(-30).map(([date, d]) => ({
    label: new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: getScore(d), date,
  }));

  const monthMap = {};
  allDays.forEach(([date, d]) => {
    const mk = monthKey(date);
    if (!monthMap[mk]) monthMap[mk] = [];
    monthMap[mk].push(getScore(d));
  });
  const monthlyData = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([mk, scores]) => ({
    label: new Date(mk + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    avg: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
    days: scores.length, month: mk,
  }));

  const availableMonths = [...new Set(allDays.map(([d]) => monthKey(d)))].sort((a, b) => b.localeCompare(a));
  if (!availableMonths.includes(selMonth)) availableMonths.unshift(selMonth);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#161008", display: "flex",
      alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#d4a843", fontFamily: "'Playfair Display',serif", fontSize: "18px", opacity: 0.7 }}>
        Loading your journal…
      </div>
    </div>
  );

  const TABS = ["today", "graphs", "history"];

  return (
    <div style={{ minHeight: "100vh", background: "#161008", fontFamily: "sans-serif", paddingBottom: "60px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ borderBottom: "1px solid #221a08", padding: "26px 22px 18px", maxWidth: "500px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#4a3e28", fontSize: "10px", fontFamily: "'DM Mono',monospace",
              letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "4px" }}>Daily Log</div>
            <div style={{ color: "#e8d49a", fontSize: "21px", fontFamily: "'Playfair Display',serif",
              fontWeight: "700", lineHeight: 1.25 }}>{dateLabel}</div>
            <div style={{ color: "#4a3e28", fontSize: "10px", fontFamily: "'DM Mono',monospace", marginTop: "4px" }}>{todayKey}</div>
          </div>
          <ScoreArc score={score} />
        </div>
        <div style={{ marginTop: "12px", background: "#1a1006", borderLeft: "3px solid #d4a843",
          padding: "9px 13px", borderRadius: "0 6px 6px 0" }}>
          <div style={{ color: "#7a6a50", fontSize: "11.5px", fontFamily: "'Playfair Display',serif",
            fontStyle: "italic", lineHeight: 1.55 }}>"{quote}"</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "0 22px" }}>
        <div style={{ display: "flex", marginTop: "18px", borderBottom: "1px solid #221a08" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "9px 16px",
              color: tab === t ? "#d4a843" : "#4a3e28",
              fontFamily: "'DM Mono',monospace", fontSize: "11px",
              textTransform: "uppercase", letterSpacing: "0.1em",
              borderBottom: tab === t ? "2px solid #d4a843" : "2px solid transparent",
              marginBottom: "-1px", transition: "color 0.2s",
            }}>{t}</button>
          ))}
          {saved && <span style={{ marginLeft: "auto", color: "#d4a843", fontSize: "10px",
            fontFamily: "'DM Mono',monospace", alignSelf: "center", opacity: 0.8 }}>✓ saved</span>}
        </div>

        {/* ══ TODAY ══ */}
        {tab === "today" && (
          <div style={{ marginTop: "22px" }}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                <span style={{ color: "#4a3e28", fontSize: "10px", fontFamily: "'DM Mono',monospace",
                  textTransform: "uppercase", letterSpacing: "0.12em" }}>Today's Score</span>
                <span style={{ color: "#d4a843", fontSize: "12px", fontFamily: "'Playfair Display',serif",
                  fontWeight: "700" }}>{score} / {TOTAL}</span>
              </div>
              <div style={{ height: "5px", background: "#221a08", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(score / TOTAL) * 100}%`,
                  background: "linear-gradient(90deg, #c0724a, #d4a843)", borderRadius: "3px",
                  transition: "width 0.5s cubic-bezier(.4,2,.6,1)" }} />
              </div>
              <div style={{ color: "#4a3e28", fontSize: "10.5px", fontFamily: "'DM Mono',monospace", marginTop: "5px" }}>
                {score >= 9 ? "🏆 Exceptional day" : score >= 7 ? "⚡ Strong performance"
                  : score >= 5 ? "📈 Good progress" : score >= 3 ? "🔄 Keep going" : "🌱 Every point counts"}
              </div>
            </div>
            <div style={{ marginBottom: "22px" }}>
              <SectionHead label="Lifestyle" />
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {lifestyle.map(t => t.type === "check"
                  ? <CheckTask key={t.id} task={t} value={data[t.id]} onChange={v => updateField(t.id, v)} />
                  : <CounterTask key={t.id} task={t} value={data[t.id]} onChange={v => updateField(t.id, v)} />
                )}
              </div>
            </div>
            <div>
              <SectionHead label="Research" />
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {research.map(t => (
                  <CheckTask key={t.id} task={t} value={data[t.id]} onChange={v => updateField(t.id, v)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ GRAPHS ══ */}
        {tab === "graphs" && (
          <div style={{ marginTop: "22px" }}>
            <div style={{ display: "flex", background: "#1a1006", borderRadius: "8px",
              padding: "3px", marginBottom: "22px", width: "fit-content" }}>
              {["daily", "monthly"].map(v => (
                <button key={v} onClick={() => setChartView(v)} style={{
                  background: chartView === v ? "#2e2010" : "none",
                  border: chartView === v ? "1px solid #3a2e18" : "1px solid transparent",
                  borderRadius: "6px", padding: "6px 18px", cursor: "pointer",
                  color: chartView === v ? "#d4a843" : "#4a3e28",
                  fontFamily: "'DM Mono',monospace", fontSize: "10.5px",
                  textTransform: "uppercase", letterSpacing: "0.1em", transition: "all 0.2s",
                }}>{v}</button>
              ))}
            </div>

            {dailyData.length === 0 && (
              <div style={{ color: "#3a3020", fontFamily: "'Playfair Display',serif",
                fontSize: "15px", textAlign: "center", paddingTop: "50px", lineHeight: 1.8 }}>
                No data yet.<br />
                <span style={{ fontSize: "12px", color: "#2a2010" }}>Complete today's log to see graphs.</span>
              </div>
            )}

            {/* DAILY */}
            {chartView === "daily" && dailyData.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                  <div>
                    <div style={{ color: "#e8d49a", fontSize: "15px", fontFamily: "'Playfair Display',serif", fontWeight: "700" }}>Daily Score</div>
                    <div style={{ color: "#4a3e28", fontSize: "10px", fontFamily: "'DM Mono',monospace", marginTop: "2px" }}>Last {dailyData.length} days</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: scoreColor(Math.round(dailyData.reduce((a,b)=>a+b.score,0)/dailyData.length)),
                      fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: "700" }}>
                      {(dailyData.reduce((a, b) => a + b.score, 0) / dailyData.length).toFixed(1)}
                    </div>
                    <div style={{ color: "#4a3e28", fontSize: "9.5px", fontFamily: "'DM Mono',monospace" }}>avg / {TOTAL}</div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyData} margin={{ top: 10, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4a843" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d4a843" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1a10" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#4a3e28", fontSize: 9, fontFamily: "'DM Mono',monospace" }}
                      axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={[0, TOTAL]} tick={{ fill: "#4a3e28", fontSize: 9, fontFamily: "'DM Mono',monospace" }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={7} stroke="#3a3020" strokeDasharray="4 3" />
                    <Area type="monotone" dataKey="score" stroke="#d4a843" strokeWidth={2}
                      fill="url(#sg)" dot={{ fill: "#d4a843", r: 3, strokeWidth: 0 }}
                      activeDot={{ fill: "#e8d49a", r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "18px" }}>
                  {[
                    { label: "Best Day", value: `${Math.max(...dailyData.map(d => d.score))}`, unit: `/${TOTAL}` },
                    { label: "7-day Avg", value: (dailyData.slice(-7).reduce((a,b)=>a+b.score,0)/Math.min(7,dailyData.length)).toFixed(1), unit: "" },
                    { label: "Total Days", value: `${dailyData.length}`, unit: "" },
                  ].map(({ label, value, unit }) => (
                    <div key={label} style={{ background: "#1a1006", border: "1px solid #221a08",
                      borderRadius: "9px", padding: "12px 10px", textAlign: "center" }}>
                      <div style={{ color: "#d4a843", fontFamily: "'Playfair Display',serif",
                        fontSize: "20px", fontWeight: "700" }}>{value}<span style={{ fontSize: "11px", color: "#3a3020" }}>{unit}</span></div>
                      <div style={{ color: "#4a3e28", fontSize: "9px", fontFamily: "'DM Mono',monospace",
                        marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "24px" }}>
                  <SectionHead label="Task hit rate — last 7 days" />
                  {TASKS.map(task => {
                    const last7 = dailyData.slice(-7);
                    const hits = last7.filter(({ date }) => {
                      const d = history[date] ?? {};
                      if (task.type === "check") return !!d[task.id];
                      const v = d[task.id] ?? 0;
                      return task.inverted ? v <= task.goal : v >= task.goal;
                    }).length;
                    const pct = last7.length ? hits / last7.length : 0;
                    return (
                      <div key={task.id} style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span style={{ color: "#7a6a50", fontSize: "11px", fontFamily: "'Playfair Display',serif" }}>
                            {task.icon} {task.label}
                          </span>
                          <span style={{ color: hits >= 5 ? "#d4a843" : hits >= 3 ? "#e09a3a" : "#c0724a",
                            fontSize: "10.5px", fontFamily: "'DM Mono',monospace" }}>{hits}/{last7.length}</span>
                        </div>
                        <div style={{ height: "4px", background: "#1e1408", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct * 100}%`,
                            background: `linear-gradient(90deg, #c0724a, #d4a843)`, borderRadius: "2px",
                            transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MONTHLY */}
            {chartView === "monthly" && (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ color: "#e8d49a", fontSize: "15px", fontFamily: "'Playfair Display',serif", fontWeight: "700" }}>Monthly Overview</div>
                  <div style={{ color: "#4a3e28", fontSize: "10px", fontFamily: "'DM Mono',monospace", marginTop: "2px" }}>Average daily score per month</div>
                </div>

                {monthlyData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={monthlyData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1a10" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: "#4a3e28", fontSize: 9, fontFamily: "'DM Mono',monospace" }}
                          axisLine={false} tickLine={false} />
                        <YAxis domain={[0, TOTAL]} tick={{ fill: "#4a3e28", fontSize: 9, fontFamily: "'DM Mono',monospace" }}
                          axisLine={false} tickLine={false} />
                        <Tooltip content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div style={{ background: "#1e1408", border: "1px solid #3a2e18",
                              borderRadius: "8px", padding: "10px 14px" }}>
                              <div style={{ color: "#5a4e38", fontSize: "10px", fontFamily: "'DM Mono',monospace", marginBottom: "4px" }}>{label}</div>
                              <div style={{ color: scoreColor(payload[0].value), fontSize: "18px",
                                fontFamily: "'Playfair Display',serif", fontWeight: "700" }}>{payload[0].value} avg</div>
                              <div style={{ color: "#4a3e28", fontSize: "9.5px", fontFamily: "'DM Mono',monospace" }}>{payload[0].payload.days} days logged</div>
                            </div>
                          );
                        }} />
                        <Bar dataKey="avg" radius={[5, 5, 0, 0]}>
                          {monthlyData.map((entry, i) => (
                            <Cell key={i} fill={entry.avg >= 8 ? "#d4a843" : entry.avg >= 6 ? "#c0893a" : entry.avg >= 4 ? "#9a6030" : "#6a3820"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* monthly summary cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "16px" }}>
                      {[
                        { label: "Best Month", value: monthlyData.reduce((a,b) => b.avg > a.avg ? b : a).label },
                        { label: "Months Tracked", value: `${monthlyData.length}` },
                        { label: "All-time Avg", value: (monthlyData.reduce((a,b)=>a+b.avg,0)/monthlyData.length).toFixed(1) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: "#1a1006", border: "1px solid #221a08",
                          borderRadius: "9px", padding: "12px 10px", textAlign: "center" }}>
                          <div style={{ color: "#d4a843", fontFamily: "'Playfair Display',serif",
                            fontSize: "16px", fontWeight: "700" }}>{value}</div>
                          <div style={{ color: "#4a3e28", fontSize: "9px", fontFamily: "'DM Mono',monospace",
                            marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ color: "#3a3020", fontFamily: "'Playfair Display',serif",
                    fontSize: "14px", textAlign: "center", padding: "40px 0" }}>No monthly data yet.</div>
                )}

                {/* HEATMAP */}
                <div style={{ marginTop: "28px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ color: "#e8d49a", fontSize: "13px", fontFamily: "'Playfair Display',serif", fontWeight: "600" }}>
                      {new Date(selMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => {
                        const idx = availableMonths.indexOf(selMonth);
                        if (idx < availableMonths.length - 1) setSelMonth(availableMonths[idx + 1]);
                      }} style={{ background: "#1e1408", border: "1px solid #2e2416", borderRadius: "5px",
                        color: "#7a6a50", fontSize: "13px", cursor: "pointer", padding: "3px 10px" }}>‹</button>
                      <button onClick={() => {
                        const idx = availableMonths.indexOf(selMonth);
                        if (idx > 0) setSelMonth(availableMonths[idx - 1]);
                      }} style={{ background: "#1e1408", border: "1px solid #2e2416", borderRadius: "5px",
                        color: "#7a6a50", fontSize: "13px", cursor: "pointer", padding: "3px 10px" }}>›</button>
                    </div>
                  </div>
                  <HeatmapCalendar history={history} month={selMonth} />
                  {monthlyData.find(m => m.month === selMonth) && (() => {
                    const md = monthlyData.find(m => m.month === selMonth);
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
                        {[{ label: "Days Logged", value: `${md.days}` }, { label: "Avg Score", value: `${md.avg}/${TOTAL}` }].map(({ label, value }) => (
                          <div key={label} style={{ background: "#1a1006", border: "1px solid #221a08",
                            borderRadius: "9px", padding: "11px 14px" }}>
                            <div style={{ color: "#d4a843", fontFamily: "'Playfair Display',serif", fontSize: "17px", fontWeight: "700" }}>{value}</div>
                            <div style={{ color: "#4a3e28", fontSize: "9.5px", fontFamily: "'DM Mono',monospace",
                              marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {tab === "history" && (
          <div style={{ marginTop: "22px" }}>
            <div style={{ color: "#4a3e28", fontSize: "10.5px", fontFamily: "'DM Mono',monospace", marginBottom: "14px" }}>
              {allDays.length} day{allDays.length !== 1 ? "s" : ""} logged in total
            </div>
            {allDays.length === 0 && (
              <div style={{ color: "#3a3020", fontFamily: "'Playfair Display',serif",
                fontSize: "15px", textAlign: "center", paddingTop: "40px" }}>
                No history yet.<br />Complete today's log first.
              </div>
            )}
            {[...allDays].reverse().map(([date, d]) => {
              const s = getScore(d);
              const col = scoreColor(s);
              const label = new Date(date + "T00:00:00").toLocaleDateString("en-US",
                { weekday: "short", month: "short", day: "numeric" });
              const isToday = date === todayKey;
              return (
                <div key={date} style={{ background: "#1a1006",
                  border: `1px solid ${isToday ? "#3a2e18" : "#221a08"}`,
                  borderRadius: "10px", padding: "13px 15px", marginBottom: "8px",
                  display: "flex", alignItems: "center", gap: "13px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <span style={{ color: "#8a7a60", fontFamily: "'Playfair Display',serif",
                        fontSize: "13.5px", fontWeight: "600" }}>{label}</span>
                      {isToday && <span style={{ color: "#d4a843", fontSize: "9px",
                        fontFamily: "'DM Mono',monospace", background: "rgba(212,168,67,0.15)",
                        padding: "1px 6px", borderRadius: "4px" }}>today</span>}
                    </div>
                    <div style={{ height: "4px", background: "#221a08", borderRadius: "2px",
                      marginTop: "7px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(s / TOTAL) * 100}%`,
                        background: `linear-gradient(90deg, #c0724a, ${col})`, borderRadius: "2px" }} />
                    </div>
                    <div style={{ display: "flex", gap: "4px", marginTop: "7px", flexWrap: "wrap" }}>
                      {TASKS.map(t => {
                        let done = false;
                        if (t.type === "check") done = !!d[t.id];
                        else { const v = d[t.id] ?? 0; done = t.inverted ? v <= t.goal : v >= t.goal; }
                        return <span key={t.id} title={t.label} style={{ fontSize: "9px", opacity: done ? 1 : 0.2 }}>{t.icon}</span>;
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ color: col, fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: "700" }}>{s}</span>
                    <span style={{ color: "#2e2416", fontFamily: "'DM Mono',monospace", fontSize: "11px" }}>/{TOTAL}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}