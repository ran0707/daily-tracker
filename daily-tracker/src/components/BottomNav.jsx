import { useTheme } from "../lib/ThemeContext";

const TABS = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "personal", icon: "◎", label: "Personal" },
  { id: "finance", icon: "◈", label: "Finance" },
  { id: "anger", icon: "🧘", label: "Anger" },
  { id: "profile", icon: "◍", label: "Profile" },
];

export default function BottomNav({ page, setPage }) {
  const { t } = useTheme();
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: t.navBg,
        borderTop: `1px solid ${t.navBorder}`,
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 0 18px",
        backdropFilter: "blur(20px)",
        transition: "background 0.3s",
      }}
    >
      {TABS.map((tab) => {
        const active = page === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setPage(tab.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: "6px 14px",
              borderRadius: "12px",
              transition: "all 0.2s",
              background: active ? t.accentGlow : "none",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                lineHeight: 1,
                color: active ? t.accentBright : t.textMuted,
                transition: "all 0.2s",
                filter: active
                  ? `drop-shadow(0 0 6px ${t.accentGlow})`
                  : "none",
              }}
            >
              {tab.icon}
            </div>
            <div
              style={{
                fontSize: "9px",
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: active ? t.accentBright : t.textMuted,
                transition: "color 0.2s",
              }}
            >
              {tab.label}
            </div>
            {active && (
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: t.accentBright,
                  marginTop: "-1px",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
