"use client";

import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

/** The theme lives on <html data-theme> and in localStorage — both external
 *  to React, so the toggle reads them via useSyncExternalStore. */
function subscribe(callback: () => void): () => void {
  window.addEventListener("theme-change", callback);
  window.addEventListener("storage", callback); // other tabs
  return () => {
    window.removeEventListener("theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  // Matches the layout's pre-paint script default; corrected after hydration.
  return "light";
}

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("invoice-theme", next);
  } catch {
    // Private browsing: the toggle still works for this visit.
  }
  window.dispatchEvent(new Event("theme-change"));
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    applyTheme(getSnapshot() === "dark" ? "light" : "dark");
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
