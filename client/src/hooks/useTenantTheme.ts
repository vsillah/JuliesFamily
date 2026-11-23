import { useCallback, useEffect, useState } from "react";

export type TenantThemeMode = "light" | "dark" | "system";
export type ResolvedTenantThemeMode = "light" | "dark";

function storageKey(tenantSlug: string) {
  return tenantSlug === "vanguard-enterprises"
    ? "kinflo:vanguard:theme:v1"
    : `kinflo:tenant:${tenantSlug}:theme:v1`;
}

// Lets every theme control mounted for the same tenant key stay in step within one tab.
const THEME_CHANGE_EVENT = "kinflo:tenant-theme-change";

function readStoredMode(tenantSlug: string): TenantThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(storageKey(tenantSlug));
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function resolveMode(mode: TenantThemeMode, media: MediaQueryList): ResolvedTenantThemeMode {
  return mode === "dark" || (mode === "system" && media.matches) ? "dark" : "light";
}

export function useTenantTheme(tenantSlug: string, enabled = true) {
  const [mode, setModeState] = useState<TenantThemeMode>(() => readStoredMode(tenantSlug));
  const [resolvedMode, setResolvedMode] = useState<ResolvedTenantThemeMode>("light");

  useEffect(() => {
    setModeState(readStoredMode(tenantSlug));
    const syncMode = (event: Event) => {
      if ((event as CustomEvent<string>).detail === storageKey(tenantSlug)) {
        setModeState(readStoredMode(tenantSlug));
      }
    };
    window.addEventListener(THEME_CHANGE_EVENT, syncMode);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, syncMode);
  }, [tenantSlug]);

  useEffect(() => {
    if (!enabled) return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyMode = () => {
      const nextMode = resolveMode(mode, media);
      setResolvedMode(nextMode);
      document.documentElement.classList.toggle("dark", nextMode === "dark");
      document.documentElement.style.colorScheme = nextMode;
    };

    applyMode();
    if (mode !== "system") return undefined;
    media.addEventListener("change", applyMode);
    return () => media.removeEventListener("change", applyMode);
  }, [enabled, mode]);

  const setMode = useCallback((nextMode: TenantThemeMode) => {
    window.localStorage.setItem(storageKey(tenantSlug), nextMode);
    setModeState(nextMode);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: storageKey(tenantSlug) }));
  }, [tenantSlug]);

  return { mode, resolvedMode, setMode };
}
