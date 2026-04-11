import { createContext, useContext, useState, useEffect } from "react";

export const THEMES = {
  dark: {
    name: "Dark",
    icon: "🌙",
    // Backgrounds
    bg: "#0f0c1a",
    bgCard: "#17132a",
    bgInput: "#0d0a18",
    bgHover: "#1e1838",
    bgToggle: "#121020",
    // Borders
    border: "#2a2245",
    borderLight: "#1e1838",
    borderAccent: "#6c4fd4",
    // Text
    textPrimary: "#e8e0ff",
    textSecond: "#8a80b0",
    textMuted: "#4a4268",
    textHint: "#332e55",
    // Accent (purple)
    accent: "#7c5cbf",
    accentBright: "#9b7fe8",
    accentGlow: "rgba(124,92,191,0.25)",
    accentText: "#c4aaff",
    // Score / status
    success: "#4eab7a",
    successBg: "rgba(78,171,122,0.12)",
    successBorder: "rgba(78,171,122,0.3)",
    danger: "#e05555",
    dangerBg: "rgba(224,85,85,0.12)",
    dangerBorder: "rgba(224,85,85,0.3)",
    warn: "#e0a030",
    // Chart colors
    chart1: "#7c5cbf",
    chart2: "#4eab7a",
    chart3: "#e0a030",
    chart4: "#e05555",
    gradStart: "#7c5cbf",
    gradEnd: "#9b7fe8",
    // Bottom nav
    navBg: "#0d0a18",
    navBorder: "#1e1838",
  },
  light: {
    name: "Light",
    icon: "☀️",
    bg: "#f5f3ff",
    bgCard: "#ffffff",
    bgInput: "#f0eeff",
    bgHover: "#e8e4ff",
    bgToggle: "#ece8ff",
    border: "#d4cef0",
    borderLight: "#e8e4ff",
    borderAccent: "#7c5cbf",
    textPrimary: "#1a1535",
    textSecond: "#4a4070",
    textMuted: "#8880aa",
    textHint: "#b0aac8",
    accent: "#6c4fd4",
    accentBright: "#8060e8",
    accentGlow: "rgba(108,79,212,0.15)",
    accentText: "#5040b0",
    success: "#2d9e6a",
    successBg: "rgba(45,158,106,0.1)",
    successBorder: "rgba(45,158,106,0.3)",
    danger: "#cc4444",
    dangerBg: "rgba(204,68,68,0.1)",
    dangerBorder: "rgba(204,68,68,0.3)",
    warn: "#c08020",
    chart1: "#6c4fd4",
    chart2: "#2d9e6a",
    chart3: "#c08020",
    chart4: "#cc4444",
    gradStart: "#6c4fd4",
    gradEnd: "#8060e8",
    navBg: "#ffffff",
    navBorder: "#d4cef0",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const saved = localStorage.getItem("app_theme") || "system";
  const [mode, setMode] = useState(saved); // 'system' | 'light' | 'dark'

  const getEffective = () => {
    if (mode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return mode;
  };

  const [effective, setEffective] = useState(getEffective());

  useEffect(() => {
    const update = () => setEffective(getEffective());
    update();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mode]);

  function setTheme(m) {
    setMode(m);
    localStorage.setItem("app_theme", m);
  }

  const t = THEMES[effective];

  return (
    <ThemeContext.Provider value={{ mode, setTheme, t, effective }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
