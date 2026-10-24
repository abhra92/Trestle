"use client";

import { useSyncExternalStore } from "react";
import styles from "./theme-toggle.module.css";

type Theme = "light" | "dark";

const STORAGE_KEY = "trestle.theme";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function serverTheme(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  function choose(next: Theme) {
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The theme still applies for this session when storage is blocked.
    }
  }

  return (
    <div className={styles.group} role="group" aria-label="Theme">
      <button
        type="button"
        className={styles.option}
        aria-pressed={theme === "light"}
        onClick={() => choose("light")}
      >
        Paper
      </button>
      <button
        type="button"
        className={styles.option}
        aria-pressed={theme === "dark"}
        onClick={() => choose("dark")}
      >
        Candlelight
      </button>
    </div>
  );
}
