"use client";

import { MonitorCog, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { IconButton } from "./primitives";
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
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = resolveTheme(preference, systemPrefersDark);
    const next: ThemePreference = current === "dark" ? "light" : "dark";
    window.localStorage.setItem(themeStorageKey, next);
    setPreference(next);
    applyTheme(next, systemPrefersDark);
  };

  const ThemeIcon = preference === "system" ? MonitorCog : preference === "dark" ? Moon : Sun;
  const label = `${preference[0]?.toUpperCase()}${preference.slice(1)} theme`;

  return (
    <IconButton
      aria-label={`Theme: ${preference}. Activate to change theme`}
      onClick={cycleTheme}
      title={label}
    >
      <ThemeIcon aria-hidden="true" className="size-5" />
    </IconButton>
  );
}
