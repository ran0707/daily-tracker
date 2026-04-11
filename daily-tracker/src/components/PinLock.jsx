import { useState } from "react";
import { useTheme } from "../lib/ThemeContext";

async function sha256(message) {
  const buf = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const PIN_KEY = "app_pin_hash";
const BTNS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function PinLock({ onUnlock }) {
  const { t } = useTheme();
  const isSetup = !localStorage.getItem(PIN_KEY);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState(isSetup ? "set" : "verify");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const press = async (val) => {
    if (locked) return;
    if (val === "⌫") {
      step === "confirm"
        ? setConfirm((c) => c.slice(0, -1))
        : setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }
    if (step === "confirm") {
      const next = confirm + val;
      setConfirm(next);
      if (next.length === 6) {
        if (next === pin) {
          localStorage.setItem(PIN_KEY, await sha256(next));
          onUnlock();
        } else {
          setError("PINs do not match. Try again.");
          setConfirm("");
          setPin("");
          setStep("set");
        }
      }
    } else {
      const next = pin + val;
      setPin(next);
      if (next.length === 6) {
        if (step === "set") {
          setStep("confirm");
        } else {
          if ((await sha256(next)) === localStorage.getItem(PIN_KEY)) {
            onUnlock();
          } else {
            const a = attempts + 1;
            setAttempts(a);
            if (a >= 5) {
              setLocked(true);
              setError("Too many attempts. Wait 30s.");
              setTimeout(() => {
                setLocked(false);
                setAttempts(0);
                setError("");
              }, 30000);
            } else {
              setError(
                `Wrong PIN. ${5 - a} attempt${5 - a !== 1 ? "s" : ""} left.`,
              );
            }
            setPin("");
          }
        }
      }
    }
  };

  const cur = step === "confirm" ? confirm : pin;
  const title =
    step === "set"
      ? "Create PIN"
      : step === "confirm"
        ? "Confirm PIN"
        : "Welcome Back";
  const sub =
    step === "set"
      ? "Set a 6-digit PIN to secure your app"
      : step === "confirm"
        ? "Re-enter to confirm"
        : "Enter your PIN to continue";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Space Grotesk',sans-serif",
        padding: "24px",
      }}
    >
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            margin: "0 auto 12px",
            background: `linear-gradient(135deg, ${t.accent}, ${t.accentBright})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            boxShadow: `0 8px 32px ${t.accentGlow}`,
          }}
        >
          ⚡
        </div>
        <div
          style={{
            color: t.textPrimary,
            fontSize: "22px",
            fontWeight: "700",
            letterSpacing: "-0.5px",
          }}
        >
          DailyOS
        </div>
        <div
          style={{
            color: t.textMuted,
            fontSize: "11px",
            fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: "0.15em",
            marginTop: "3px",
          }}
        >
          PERSONAL · RESEARCH · FINANCE
        </div>
      </div>
      <div
        style={{
          color: t.textPrimary,
          fontSize: "18px",
          fontWeight: "600",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: t.textMuted,
          fontSize: "13px",
          marginBottom: "32px",
          textAlign: "center",
        }}
      >
        {sub}
      </div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: i < cur.length ? t.accent : "transparent",
              border: `2px solid ${i < cur.length ? t.accent : t.border}`,
              transition: "all 0.15s",
              boxShadow: i < cur.length ? `0 0 8px ${t.accentGlow}` : "none",
            }}
          />
        ))}
      </div>
      <div style={{ height: "24px", marginBottom: "8px" }}>
        {error && (
          <div
            style={{
              color: t.danger,
              fontSize: "12px",
              fontFamily: "'JetBrains Mono',monospace",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 76px)",
          gap: "10px",
        }}
      >
        {BTNS.map((b, i) => (
          <button
            key={i}
            onClick={() => b && press(b)}
            disabled={locked || !b}
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "50%",
              background:
                b === "⌫" ? t.accentGlow : b ? t.bgCard : "transparent",
              border: b && b !== "⌫" ? `1.5px solid ${t.border}` : "none",
              color: b === "⌫" ? t.accentBright : t.textPrimary,
              fontSize: b === "⌫" ? "20px" : "22px",
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: "500",
              cursor: b && !locked ? "pointer" : "default",
              opacity: locked ? 0.4 : 1,
              transition: "all 0.15s",
            }}
          >
            {b}
          </button>
        ))}
      </div>
      {step === "verify" && (
        <button
          onClick={() => {
            if (window.confirm("Reset app? All local data cleared.")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          style={{
            marginTop: "36px",
            background: "none",
            border: "none",
            color: t.textHint,
            fontSize: "11px",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Forgot PIN? Reset
        </button>
      )}
    </div>
  );
}
