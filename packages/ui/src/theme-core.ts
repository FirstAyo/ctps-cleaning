export type ThemePreference = "light" | "dark" | "system";

export const themeStorageKey = "ctps-theme";

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): "light" | "dark" {
  return preference === "system" ? (systemPrefersDark ? "dark" : "light") : preference;
}

export const themeInitScript = `(() => { try { const key = '${themeStorageKey}'; const value = localStorage.getItem(key); const preference = value === 'light' || value === 'dark' ? value : 'system'; const dark = preference === 'dark' || (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.classList.toggle('dark', dark); document.documentElement.dataset.theme = preference; document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; } catch {} })();`;
