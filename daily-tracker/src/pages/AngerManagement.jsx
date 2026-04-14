import { useState, useRef, useEffect } from "react";
import { useTheme } from "../lib/ThemeContext";

// Enhanced Anger detection with categorized Tanglish words
// Categories: ANGER, VULGARITY, HARSH, HYPER, OFFENSIVE
const ANGER_PATTERNS = {
  // ANGER - Expressions of anger and rage
  anger: {
    english: [
      "hate", "kill", "destroy", "smash", "explode", "furious", "enraged", "livid",
      "pissed", "mad", "angry", "infuriated", "seething", "furious", "raging",
    ],
    tanglish: [
      "neruppu", "adippan", "pattai", "vara", "sollrai", "thadi", "pidi", "aeri",
      "solli", "vachka", "sappu", "kothei", "parakram", "pozhappu", "moham",
      "koopam", "kuthumbram", "neruppu_potu", "surakkai", "udal_pozhappu",
    ],
    weight: 3,
  },

  // VULGARITY - Abusive and vulgar language
  vulgarity: {
    english: [
      "damn", "hell", "crap", "shit", "fuck", "asshole", "bastard", "bitch",
      "piss", "bloody", "goddamn",
    ],
    tanglish: [
      "soothukali", "aambulai", "thaevalai", "kudaa", "kuppai", "payyi", "thadi_payyi",
      "paakanam", "pakkadumba", "kottai", "saadha", "payya_kottai", "thozha_payyi",
      "vaanam_illai", "kuppu", "kuppai_kattiya",
    ],
    weight: 3.5,
  },

  // HARSH - Harsh and critical words
  harsh: {
    english: [
      "stupid", "idiot", "useless", "pathetic", "disgusting", "awful", "terrible",
      "horrible", "worthless", "loser", "dumb", "moron", "imbecile", "fool",
      "incompetent", "embarrassing", "pathetic",
    ],
    tanglish: [
      "aiyyoh", "madi", "vali", "poy", "poidum", "paavam", "mayakam", "thaviram",
      "mokkai", "kutha", "parakram", "kudaara", "kaattukari", "kettavan", "kettavai",
      "soothran", "kopuram", "kaakkai_kozhaam", "nesu", "aasai_vedikkai",
    ],
    weight: 2.5,
  },

  // HYPER - Hyperactive/over-excited aggressive language
  hyper: {
    english: [
      "literally", "omg", "wtf", "omfg", "seriously", "unbelievable", "insane",
      "crazy", "out of control", "losing it", "flipping out", "freaking out",
    ],
    tanglish: [
      "vera_azhuthu", "solraai", "verum_alavukku", "ivar_arasura", "kai_vithukka",
      "sollai_paavai", "vandha_kari", "pandravum", "pozhappu_katte", "kanna_kili",
      "kayya_vittukka", "udal_pozhappu_katte",
    ],
    weight: 2,
  },

  // OFFENSIVE - Personally offensive/insulting language
  offensive: {
    english: [
      "insult", "disrespect", "trash", "scum", "filth", "disgusting", "lowlife",
      "degenerate", "vile", "contemptible", "spineless", "coward", "weakling",
    ],
    tanglish: [
      "kadi", "kupiduvaan", "niraindha", "kupiyai", "parupu", "mukkam", "aagasam",
      "panni", "ponai", "saavadhanai", "thollai", "kaakkai", "aasai_vedikkai",
      "therikku_kudi", "nesukkili", "tholkai_kari",
    ],
    weight: 2.8,
  },

  // Pattern-based detection
  caps: { pattern: /[A-Z]{4,}/g, weight: 1.5 }, // Multiple consecutive caps
  exclamation: { pattern: /!{2,}/g, weight: 1.2 }, // Multiple exclamation marks
  question: { pattern: /\?{2,}/g, weight: 1.2 }, // Multiple question marks
  repeated_chars: { pattern: /([a-z])\1{2,}/g, weight: 1.3 }, // aaa, bbb, etc
};

const CALMING_RESPONSES = {
  high: [
    "🧘 Take a deep breath. Breathe in for 4 counts, hold for 4, exhale for 4.",
    "Your anger is valid, but it does not define you. You are more than this moment.",
    "This feeling is temporary. In an hour, this will matter much less.",
    "Walk away. Physical distance creates mental clarity. Move your body.",
    "What would your wisest self say to you right now? Listen to that voice.",
    "🇮🇳 Kudi vandha paavam mudi vidra... Athe karuthu. Karuthu kaale vendum.",
    "Neruppu atrukku naan aattai ilai. Nee aattai, nee uruvam.",
    "Shanthi adhikaar. Porvai aatkal. Kai kulukai.",
  ],
  medium: [
    "🌊 Feel the emotion without acting on it. Let it flow through you like water.",
    "What triggered this? Understanding the root helps you respond wisely.",
    "Your feelings are important. Express them without hurting others.",
    "Pause. Before you speak, ask: Will this bring me closer to peace?",
    "Channel this energy into something constructive—create, move, write.",
    "Aiyyoh... Innum paavam ilai. Kai kulukai, moha pattu.",
    "Vera maatama... Samayam ullamadi. Nee nallavan.",
    "Madi vara vendaadhum. Paavam vittupa, shanthi vangura.",
  ],
  low: [
    "💚 You're handling this well. Keep this calm awareness.",
    "Notice what you're feeling without judgment. That's true strength.",
    "Your mindfulness is protecting both you and those around you.",
    "Keep riding this wave of peace. Protect this state.",
    "You're in control. This clarity is your superpower.",
    "🧘 Nallaa irukka... Inta shanthi vaisanam vittupa.",
    "Kai kulukai nalla irukku. Inta samadhanai pidithu kolu.",
    "Nee sutrum ayyan. Inta anbu, inta shanthi - piditta kolu.",
  ],
};

function calculateAngerLevel(text) {
  if (!text.trim()) return 0;

  let score = 0;
  const lowerText = text.toLowerCase();

  // Check categorized keywords (both English and Tanglish)
  Object.entries(ANGER_PATTERNS).forEach(([category, pattern]) => {
    if (pattern.english || pattern.tanglish) {
      const words = [...(pattern.english || []), ...(pattern.tanglish || [])];
      words.forEach((word) => {
        // Match whole words or word variations
        const regex = new RegExp(`\\b${word}\\b|${word}`, "gi");
        const count = (lowerText.match(regex) || []).length;
        score += count * pattern.weight;
      });
    }
  });

  // Check caps
  const capsMatches = text.match(ANGER_PATTERNS.caps.pattern) || [];
  score += capsMatches.length * ANGER_PATTERNS.caps.weight;

  // Check exclamation marks
  const exclamationMatches =
    text.match(ANGER_PATTERNS.exclamation.pattern) || [];
  score += exclamationMatches.length * ANGER_PATTERNS.exclamation.weight;

  // Check question marks
  const questionMatches = text.match(ANGER_PATTERNS.question.pattern) || [];
  score += questionMatches.length * ANGER_PATTERNS.question.weight;

  // Check repeated characters (aaa, bbb, rrr)
  const repeatedMatches = text.match(ANGER_PATTERNS.repeated_chars.pattern) || [];
  score += repeatedMatches.length * ANGER_PATTERNS.repeated_chars.weight;

  // Text length factor (longer rants = higher anger)
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 20) {
    score += (wordCount - 20) * 0.1;
  }

  // Normalize to 0-10 scale
  const angerLevel = Math.min(Math.max(score / 2.5, 0), 10);
  return Math.round(angerLevel * 10) / 10;
}

function getAngerCategory(level) {
  if (level >= 7) return "high";
  if (level >= 4) return "medium";
  return "low";
}

function getAngerColors(level) {
  // Red (7-10), Orange (4-6), Yellow (1-3), Green (0)
  if (level >= 7) {
    return {
      bg: "rgba(220, 38, 38, 0.1)",
      border: "rgba(220, 38, 38, 0.5)",
      accent: "#dc2626",
      indicator: "🔴",
    };
  }
  if (level >= 4) {
    return {
      bg: "rgba(234, 88, 12, 0.1)",
      border: "rgba(234, 88, 12, 0.5)",
      accent: "#ea580c",
      indicator: "🟠",
    };
  }
  if (level > 0) {
    return {
      bg: "rgba(202, 138, 4, 0.1)",
      border: "rgba(202, 138, 4, 0.5)",
      accent: "#ca8a04",
      indicator: "🟡",
    };
  }
  return {
    bg: "rgba(34, 197, 94, 0.1)",
    border: "rgba(34, 197, 94, 0.5)",
    accent: "#22c55e",
    indicator: "🟢",
  };
}

function detectAngerTypes(text) {
  const lowerText = text.toLowerCase();
  const detected = [];

  if (Object.entries(ANGER_PATTERNS.anger).some(([key, arr]) => 
    arr && arr.some(word => lowerText.includes(word))
  )) detected.push("Anger");

  if (Object.entries(ANGER_PATTERNS.vulgarity).some(([key, arr]) => 
    arr && arr.some(word => lowerText.includes(word))
  )) detected.push("Vulgarity");

  if (Object.entries(ANGER_PATTERNS.harsh).some(([key, arr]) => 
    arr && arr.some(word => lowerText.includes(word))
  )) detected.push("Harsh");

  if (Object.entries(ANGER_PATTERNS.hyper).some(([key, arr]) => 
    arr && arr.some(word => lowerText.includes(word))
  )) detected.push("Hyper");

  if (Object.entries(ANGER_PATTERNS.offensive).some(([key, arr]) => 
    arr && arr.some(word => lowerText.includes(word))
  )) detected.push("Offensive");

  return detected;
}

export default function AngerManagement() {
  const { t } = useTheme();
  const [message, setMessage] = useState("");
  const [angerLevel, setAngerLevel] = useState(0);
  const [angerTypes, setAngerTypes] = useState([]);
  const [response, setResponse] = useState("");
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  const angerColors = getAngerColors(angerLevel);
  const category = getAngerCategory(angerLevel);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [message]);

  function handleMessage() {
    if (!message.trim()) return;

    const level = calculateAngerLevel(message);
    const types = detectAngerTypes(message);
    setAngerLevel(level);
    setAngerTypes(types);

    const cat = getAngerCategory(level);
    const responses = CALMING_RESPONSES[cat];
    const selectedResponse =
      responses[Math.floor(Math.random() * responses.length)];
    setResponse(selectedResponse);

    setHistory((prev) => [
      ...prev,
      {
        message: message.trim(),
        level,
        types,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessage("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleMessage();
    }
  }

  const avgAnger =
    history.length > 0
      ? (history.reduce((sum, h) => sum + h.level, 0) / history.length).toFixed(
          1,
        )
      : 0;

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        transition: "all 0.3s",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            marginBottom: "8px",
            color: t.textPrimary,
          }}
        >
          🧘 Anger Sanctuary
        </h1>
        <p style={{ color: t.textSecond, fontSize: "14px" }}>
          Express yourself freely. We'll help you find peace.
        </p>
      </div>

      {/* Current Anger Level Display */}
      <div
        style={{
          background: angerColors.bg,
          border: `2px solid ${angerColors.border}`,
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
          transition: "all 0.3s",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <span style={{ fontSize: "24px" }}>{angerColors.indicator}</span>
          <span
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: angerColors.accent,
            }}
          >
            Anger Level: {angerLevel}/10
          </span>
        </div>
        <div
          style={{
            height: "8px",
            background: t.bgCard,
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${angerLevel * 10}%`,
              height: "100%",
              background: angerColors.accent,
              transition: "width 0.3s",
            }}
          />
        </div>

        {/* Anger Type Tags */}
        {angerTypes.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: `1px solid ${angerColors.border}`,
            }}
          >
            {angerTypes.map((type) => (
              <div
                key={type}
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: angerColors.accent,
                  color: "#fff",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {type}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tell me what's bothering you... Don't hold back."
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            background: t.bgInput,
            border: `1px solid ${t.border}`,
            color: t.textPrimary,
            fontFamily: "inherit",
            fontSize: "14px",
            resize: "none",
            overflow: "hidden",
            minHeight: "80px",
            maxHeight: "150px",
            transition: "all 0.2s",
          }}
        />
        <button
          onClick={handleMessage}
          style={{
            padding: "10px 16px",
            background: angerColors.accent,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.2s",
            opacity: message.trim() ? 1 : 0.5,
            pointerEvents: message.trim() ? "auto" : "none",
          }}
        >
          Vent & Analyze
        </button>
      </div>

      {/* Calming Response */}
      {response && (
        <div
          style={{
            background: t.bgCard,
            border: `1px solid ${angerColors.border}`,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            animation: "slideIn 0.3s ease",
          }}
        >
          <p style={{ color: t.textSecond, lineHeight: "1.6", margin: 0 }}>
            {response}
          </p>
        </div>
      )}

      {/* Statistics */}
      {history.length > 0 && (
        <div
          style={{
            background: t.bgCard,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              color: t.textPrimary,
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            📊 Today's Pattern
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              fontSize: "13px",
            }}
          >
            <div>
              <span style={{ color: t.textMuted }}>Total Vents:</span>
              <br />
              <span style={{ color: t.accent, fontWeight: "600" }}>
                {history.length}
              </span>
            </div>
            <div>
              <span style={{ color: t.textMuted }}>Average Anger:</span>
              <br />
              <span style={{ color: t.accent, fontWeight: "600" }}>
                {avgAnger}/10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div
          style={{
            background: t.bgCard,
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <h3
            style={{
              color: t.textPrimary,
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            📝 Venting History
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {[...history].reverse().map((entry, idx) => {
              const colors = getAngerColors(entry.level);
              return (
                <div
                  key={idx}
                  style={{
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    padding: "10px",
                    fontSize: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: colors.accent, fontWeight: "600" }}>
                      {entry.level}/10
                    </span>
                    <span style={{ color: t.textMuted }}>
                      {entry.timestamp}
                    </span>
                  </div>

                  {/* Anger Type Tags in History */}
                  {entry.types && entry.types.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        flexWrap: "wrap",
                        marginBottom: "6px",
                      }}
                    >
                      {entry.types.map((type) => (
                        <div
                          key={type}
                          style={{
                            fontSize: "9px",
                            fontWeight: "600",
                            padding: "2px 6px",
                            borderRadius: "12px",
                            background: colors.accent,
                            color: "#fff",
                            textTransform: "uppercase",
                            opacity: 0.8,
                          }}
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                  )}

                  <p
                    style={{
                      color: t.textSecond,
                      margin: 0,
                      lineHeight: "1.4",
                      wordBreak: "break-word",
                    }}
                  >
                    "{entry.message.substring(0, 100)}
                    {entry.message.length > 100 ? "..." : ""}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
