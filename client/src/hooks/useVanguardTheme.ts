import { useTenantTheme, type TenantThemeMode } from "@/hooks/useTenantTheme";

export const VANGUARD_THEME_STORAGE_KEY = "kinflo:vanguard:theme:v1";

export type VanguardThemeMode = TenantThemeMode;

export function useVanguardTheme(enabled = true) {
  return useTenantTheme("vanguard-enterprises", enabled);
}
