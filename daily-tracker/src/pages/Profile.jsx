import { useState } from "react";
import { useTheme } from "../lib/ThemeContext";

async function sha256(msg) {
  const buf = new TextEncoder().encode(msg);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
const PIN_KEY = "app_pin_hash";

export default function Profile({ onLock }) {
  const { t, mode, setTheme } = useTheme();
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("API_KEY_PLACEHOLDER") || "",
  );
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [changePIN, setChangePIN] = useState(false);
  const [oldPIN, setOldPIN] = useState("");
  const [newPIN, setNewPIN] = useState("");
  const [conPIN, setConPIN] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  async function saveKey() {
    localStorage.setItem("API_KEY_PLACEHOLDER", apiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  async function changePinFn() {
    setPinMsg("");
    if (newPIN.length !== 6 || !/^\d+$/.test(newPIN)) {
      setPinMsg("PIN must be exactly 6 digits.");
      return;
    }
    if (newPIN !== conPIN) {
      setPinMsg("PINs do not match.");
      return;
    }
    if ((await sha256(oldPIN)) !== localStorage.getItem(PIN_KEY)) {
      setPinMsg("Current PIN incorrect.");
      return;
    }
    localStorage.setItem(PIN_KEY, await sha256(newPIN));
    setPinMsg("✓ PIN changed!");
    setOldPIN("");
    setNewPIN("");
    setConPIN("");
    setTimeout(() => {
      setChangePIN(false);
      setPinMsg("");
    }, 2000);
  }

  const card = (children, extra = {}) => (
    <div
      style={{
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "12px",
        ...extra,
      }}
    >
      {children}
    </div>
  );

  const inp = (label, val, setVal, type = "text", ph = "") => (
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
        onChange={(e) =>
          setVal(
            e.target.value
              .replace(type === "password" ? /\D/g : "", "" || e.target.value)
              .slice(0, type === "password" ? 6 : 9999),
          )
        }
        placeholder={ph}
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
        }}
      />
    </div>
  );

  const THEME_OPTS = [
    {
      id: "system",
      icon: "💻",
      label: "System Default",
      sub: "Follows your device setting",
    },
    { id: "dark", icon: "🌙", label: "Dark", sub: "Easy on the eyes at night" },
    { id: "light", icon: "☀️", label: "Light", sub: "Clean and bright" },
  ];

  return (
    <div
      style={{
        padding: "24px 16px 100px",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            color: t.textMuted,
            fontSize: "10px",
            fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Profile
        </div>
        <div
          style={{
            color: t.textPrimary,
            fontSize: "22px",
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: "700",
            letterSpacing: "-0.5px",
            marginTop: "2px",
          }}
        >
          DailyOS
        </div>
        <div
          style={{
            color: t.textMuted,
            fontSize: "10px",
            fontFamily: "'JetBrains Mono',monospace",
            marginTop: "2px",
          }}
        >
          Personal · Research · Finance
        </div>
      </div>

      {/* THEME */}
      {card(
        <>
          <div
            style={{
              color: t.textPrimary,
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "14px",
            }}
          >
            🎨 Theme
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {THEME_OPTS.map((o) => {
              const active = mode === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setTheme(o.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    background: active ? t.accentGlow : t.bgInput,
                    border: `1.5px solid ${active ? t.accent : t.border}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{o.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: active ? t.accentBright : t.textSecond,
                        fontFamily: "'Space Grotesk',sans-serif",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      {o.label}
                    </div>
                    <div
                      style={{
                        color: t.textMuted,
                        fontSize: "10px",
                        fontFamily: "'JetBrains Mono',monospace",
                        marginTop: "1px",
                      }}
                    >
                      {o.sub}
                    </div>
                  </div>
                  {active && (
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: t.accentBright,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>,
      )}

      {/* AI KEY */}
      {card(
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
            🤖 AI Coach Settings
          </div>
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
            Anthropic API Key
          </div>
          <div style={{ position: "relative" }}>
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-…"
              style={{
                width: "100%",
                background: t.bgInput,
                border: `1px solid ${t.border}`,
                borderRadius: "10px",
                padding: "10px 50px 10px 12px",
                color: t.textPrimary,
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: t.textMuted,
                cursor: "pointer",
                fontSize: "10px",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {showKey ? "hide" : "show"}
            </button>
          </div>
          <div
            style={{
              color: t.textMuted,
              fontSize: "10px",
              fontFamily: "'JetBrains Mono',monospace",
              marginTop: "6px",
              lineHeight: 1.6,
            }}
          >
            Stored locally on this device. Get your key at console.anthropic.com
          </div>
          <button
            onClick={saveKey}
            style={{
              marginTop: "10px",
              background: keySaved ? t.successBg : t.accentGlow,
              border: `1px solid ${keySaved ? t.successBorder : t.borderAccent}`,
              borderRadius: "8px",
              padding: "7px 18px",
              cursor: "pointer",
              color: keySaved ? t.success : t.accentBright,
              fontSize: "11px",
              fontFamily: "'JetBrains Mono',monospace",
              transition: "all 0.2s",
            }}
          >
            {keySaved ? "✓ Saved" : "Save Key"}
          </button>
        </>,
      )}

      {/* CHANGE PIN */}
      {card(
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
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
              🔐 Change PIN
            </div>
            <button
              onClick={() => {
                setChangePIN(!changePIN);
                setPinMsg("");
              }}
              style={{
                background: "none",
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                padding: "5px 12px",
                color: t.textSecond,
                fontSize: "10px",
                fontFamily: "'JetBrains Mono',monospace",
                cursor: "pointer",
              }}
            >
              {changePIN ? "Cancel" : "Change"}
            </button>
          </div>
          {changePIN && (
            <div style={{ marginTop: "14px" }}>
              {[
                ["Current PIN", oldPIN, setOldPIN],
                ["New PIN", newPIN, setNewPIN],
                ["Confirm New PIN", conPIN, setConPIN],
              ].map(([lb, val, set]) => (
                <div key={lb} style={{ marginBottom: "10px" }}>
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
                    {lb}
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    value={val}
                    onChange={(e) =>
                      set(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="••••••"
                    style={{
                      width: "100%",
                      background: t.bgInput,
                      border: `1px solid ${t.border}`,
                      borderRadius: "10px",
                      padding: "10px 12px",
                      color: t.textPrimary,
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              {pinMsg && (
                <div
                  style={{
                    color: pinMsg.startsWith("✓") ? t.success : t.danger,
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono',monospace",
                    marginBottom: "8px",
                  }}
                >
                  {pinMsg}
                </div>
              )}
              <button
                onClick={changePinFn}
                style={{
                  width: "100%",
                  padding: "11px",
                  background: t.accent,
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  color: "white",
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Update PIN
              </button>
            </div>
          )}
        </>,
      )}

      {/* LOCK */}
      {card(
        <>
          <div
            style={{
              color: t.textPrimary,
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "10px",
            }}
          >
            🔒 App Lock
          </div>
          <button
            onClick={onLock}
            style={{
              width: "100%",
              padding: "12px",
              background: t.dangerBg,
              border: `1px solid ${t.dangerBorder}`,
              borderRadius: "10px",
              cursor: "pointer",
              color: t.danger,
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            Lock App Now
          </button>
        </>,
      )}

      {/* ABOUT */}
      {card(
        <>
          <div
            style={{
              color: t.textPrimary,
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "10px",
            }}
          >
            ℹ️ About
          </div>
          {[
            ["Version", "2.0.0"],
            ["Stack", "React + Supabase"],
            ["AI", "Claude (Anthropic)"],
            ["Storage", "Supabase PostgreSQL"],
            ["Security", "SHA-256 PIN"],
          ].map(([k, v]) => (
            <div
              key={k}
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
                }}
              >
                {k}
              </span>
              <span
                style={{
                  color: t.textSecond,
                  fontSize: "10px",
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </>,
      )}
    </div>
  );
}
