"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "keeper-app-theme";
const THEME_EVENT = "keeper-app-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getSnapshot(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function getServerSnapshot(): "light" | "dark" {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <div
      onClick={toggleTheme}
      style={{
        padding: "6px 12px",
        border: "1px solid var(--border)",
        borderRadius: 7,
        font: "600 11px -apple-system,sans-serif",
        color: "var(--sub)",
        cursor: "pointer",
      }}
    >
      {theme === "light" ? "Tối" : "Sáng"}
    </div>
  );
}
