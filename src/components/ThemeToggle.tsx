"use client";

import { useEffect, useState } from "react";

/** Header theme toggle. Writes the choice to localStorage; the inline script
 *  in the layout applies it before first paint on every visit. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // The theme is set on <html> by the layout's pre-paint script; syncing
    // that external value into state can only happen after mount.
    const current = document.documentElement.dataset.theme;
    if (current === "dark" || current === "light") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(current);
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("invoice-theme", next);
    } catch {
      // Private browsing: the toggle still works for this visit.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-small"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? "☀︎ Light" : "☾ Dark"}
    </button>
  );
}
