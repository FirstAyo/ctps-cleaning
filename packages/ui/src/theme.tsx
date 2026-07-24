"use client";

import { useEffect, useState } from "react";

import { Button } from "./primitives";
import { resolveTheme, themeStorageKey, type ThemePreference } from "./theme-core";

export function applyTheme(preference: ThemePreference, systemPrefersDark: boolean) {
  const resolved = resolveTheme(preference, systemPrefersDark);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = preference;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const stored = window.localStorage.getItem(themeStorageKey);
      const preference: ThemePreference =
        stored === "light" || stored === "dark" ? stored : "system";
      applyTheme(preference, media.matches);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return children;
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    setPreference(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  const cycleTheme = () => {
    const next: ThemePreference =
      preference === "system" ? "light" : preference === "light" ? "dark" : "system";
    if (next === "system") window.localStorage.removeItem(themeStorageKey);
    else window.localStorage.setItem(themeStorageKey, next);
    setPreference(next);
    applyTheme(next, window.matchMedia("(prefers-color-scheme: dark)").matches);
  };

  return (
    <Button
      aria-label={`Theme: ${preference}. Activate to change theme`}
      onClick={cycleTheme}
      size="sm"
      variant="ghost"
    >
      <span aria-hidden="true" className="text-base">
        ◐
      </span>
      <span className="capitalize">{preference}</span>
    </Button>
  );
}
