"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Sync initial state from DOM (set by the init script)
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !isDark;
    setIsDark(next);
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-white/10"
      title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      aria-label="Toggle theme"
    >
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
      <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
    </button>
  );
}
