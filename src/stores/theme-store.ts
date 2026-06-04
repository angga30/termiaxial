import { create } from "zustand";
import type { AppTheme } from "../types/theme";
import darkTheme from "../styles/themes/dark.json";
import lightTheme from "../styles/themes/light.json";
import draculaTheme from "../styles/themes/dracula.json";

const BUILT_IN_THEMES: AppTheme[] = [
  darkTheme,
  lightTheme,
  draculaTheme,
] as AppTheme[];

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty("--bg", c.bg);
  root.style.setProperty("--bg-secondary", c.bgSecondary);
  root.style.setProperty("--bg-tertiary", c.bgTertiary);
  root.style.setProperty("--fg", c.fg);
  root.style.setProperty("--fg-secondary", c.fgSecondary);
  root.style.setProperty("--fg-muted", c.fgMuted);
  root.style.setProperty("--accent", c.accent);
  root.style.setProperty("--accent-hover", c.accentHover);
  root.style.setProperty("--border", c.border);
  root.style.setProperty("--color-error", c.error);
  root.style.setProperty("--color-success", c.success);
  root.style.setProperty("--color-warning", c.warning);
}

interface ThemeStore {
  currentTheme: AppTheme;
  themes: AppTheme[];
  setTheme: (id: string) => void;
  getTerminalTheme: () => AppTheme["terminal"];
}

export const useThemeStore = create<ThemeStore>((set, get) => {
  const savedId = localStorage.getItem("tmax-theme");
  const initial =
    BUILT_IN_THEMES.find((t) => t.id === savedId) || (darkTheme as AppTheme);
  applyTheme(initial);

  return {
    currentTheme: initial,
    themes: BUILT_IN_THEMES,
    setTheme: (id: string) => {
      const theme = BUILT_IN_THEMES.find((t) => t.id === id);
      if (theme) {
        applyTheme(theme);
        localStorage.setItem("tmax-theme", id);
        set({ currentTheme: theme });
      }
    },
    getTerminalTheme: () => get().currentTheme.terminal,
  };
});
