import { useState, useRef, useEffect } from "react";
import { useTheme } from "../lib/ThemeContext";

// Anger detection keywords and their weights
const ANGER_PATTERNS = {
  rage: {
    words: ["hate", "kill", "destroy", "smash", "explode", "furious", "enraged", "livid"],
    weight: 3,
  },
  frustration: {
    words: ["stupid", "idiot", "useless", "pathetic", "disgusting", "awful", "terrible"],
    weight: 2.5,
  },
  disappointment: {
    words: ["disappointed", "upset", "annoyed", "irritated", "bothered", "agitated"],
    weight: 1.5,
  },
  caps: { pattern: /[A-Z]{4,}/g, weight: 2 }, // Multiple consecutive caps
  exclamation: { pattern: /!{2,}/g, weight: 1.5 }, // Multiple exclamation marks
  question: { pattern: /\?{2,}/g, weight: 1.5 }, // Multiple question marks
};

const CALMING_RESPONSES = {
  high: [
    "🧘 Take a deep breath. Breathe in for 4 counts, hold for 4, exhale for 4.",
    "Your anger is valid, but it does not define you. You are more than this moment.",
    "This feeling is temporary. In an hour, this will matter much less.",
    "Walk away. Physical distance creates mental clarity. Move your body.",
    "What would your wisest self say to you right now? Listen to that voice.",
  ],
  medium: [
    "🌊 Feel the emotion without acting on it. Let it flow through you like water.",
    "What triggered this? Understanding the root helps you respond wisely.",
    "Your feelings are important. Express them without hurting others.",
    "Pause. Before you speak, ask: Will this bring me closer to peace?",
    "Channel this energy into something constructive—create, move, write.",
  ],
  low: [
    "💚 You're handling this well. Keep this calm awareness.",
    "Notice what you're feeling without judgment. That's true strength.",
    "Your mindfulness is protecting both you and those around you.",
    "Keep riding this wave of peace. Protect this state.",
    "You're in control. This clarity is your superpower.",
  ],
};

function calculateAngerLevel(text) {
  if (!text.trim()) return 0;

  let score = 0;
  const lowerText = text.toLowerCase();

  // Check keywords
  Object.values(ANGER_PATTERNS).forEach((pattern) => {
    if (pattern.words) {
      pattern.words.forEach((word) => {
        const count = (lowerText.match(new RegExp(`\\b${word}\\b`, "gi")) || [])
          .length;
        score += count * pattern.weight;
      });
    }
  });

  // Check caps
  const capsMatches = text.match(ANGER_PATTERNS.caps.pattern) || [];
  score += capsMatches.length * ANGER_PATTERNS.caps.weight;

  // Check exclamation marks
  const exclamationMatches = text.match(ANGER_PATTERNS.exclamation.pattern) || [];
  score += exclamationMatches.length * ANGER_PATTERNS.exclamation.weight;

  // Check question marks
  const questionMatches = text.match(ANGER_PATTERNS.question.pattern) || [];
  score += questionMatches.length * ANGER_PATTERNS.question.weight;

  // Text length factor (longer rants = higher anger)
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 20) {
    score += (wordCount - 20) * 0.1;
  }

  // Normalize to 0-10 scale
  const angerLevel = Math.min(Math.max(score / 2, 0), 10);
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

export default function AngerManagement() {
  const { t } = useTheme();
  const [message, setMessage] = useState("");
  const [angerLevel, setAngerLevel] = useState(0);
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
    setAngerLevel(level);

    const cat = getAngerCategory(level);
    const responses = CALMING_RESPONSES[cat];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    setResponse(selectedResponse);

    setHistory((prev) => [
      ...prev,
      {
        message: message.trim(),
        level,
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
      ? (history.reduce((sum, h) => sum + h.level, 0) / history.length).toFixed(1)
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
          <span style={{ fontSize: "20px", fontWeight: "600", color: angerColors.accent }}>
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
              <span style={{ color: t.accent, fontWeight: "600" }}>{history.length}</span>
            </div>
            <div>
              <span style={{ color: t.textMuted }}>Average Anger:</span>
              <br />
              <span style={{ color: t.accent, fontWeight: "600" }}>{avgAnger}/10</span>
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
                    <span style={{ color: t.textMuted }}>{entry.timestamp}</span>
                  </div>
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
