import { useState } from "react";
import { ThemeProvider, useTheme } from "./lib/ThemeContext";
import PinLock from "./components/PinLock";
import BottomNav from "./components/BottomNav";
import Dashboard from "./pages/Dashboard";
import PersonalTrack from "./pages/PersonalTrack";
import FinancialTrack from "./pages/FinancialTrack";
import Profile from "./pages/Profile";

function AppInner() {
  const { t } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [page, setPage] = useState("dashboard");

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        color: t.textPrimary,
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div style={{ paddingBottom: "70px" }}>
        {page === "dashboard" && <Dashboard setPage={setPage} />}
        {page === "personal" && <PersonalTrack />}
        {page === "finance" && <FinancialTrack />}
        {page === "profile" && <Profile onLock={() => setUnlocked(false)} />}
      </div>
      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
