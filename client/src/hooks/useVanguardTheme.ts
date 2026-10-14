import { useCallback, useEffect, useState } from "react";

export const VANGUARD_THEME_STORAGE_KEY = "kinflo:vanguard:theme:v1";

export type VanguardThemeMode = "light" | "dark" | "system";

function readStoredMode(): VanguardThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(VANGUARD_THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function resolveDarkMode(mode: VanguardThemeMode, media: MediaQueryList) {
  return mode === "dark" || (mode === "system" && media.matches);
}

export function useVanguardTheme(enabled = true) {
  const [mode, setModeState] = useState<VanguardThemeMode>(readStoredMode);

  useEffect(() => {
    if (!enabled) return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyMode = () => {
      document.documentElement.classList.toggle("dark", resolveDarkMode(mode, media));
      document.documentElement.style.colorScheme = resolveDarkMode(mode, media) ? "dark" : "light";
    };

    applyMode();
    if (mode !== "system") return undefined;
    media.addEventListener("change", applyMode);
    return () => media.removeEventListener("change", applyMode);
  }, [enabled, mode]);

  const setMode = useCallback((nextMode: VanguardThemeMode) => {
    window.localStorage.setItem(VANGUARD_THEME_STORAGE_KEY, nextMode);
    setModeState(nextMode);
  }, []);

  return { mode, setMode };
}
