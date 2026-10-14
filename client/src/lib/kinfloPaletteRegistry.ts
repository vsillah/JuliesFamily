export type KinfloPaletteId = "kinflo-default" | "reversr-vanguard" | "professional-neutral";

export type KinfloPaletteTokens = {
  background: string;
  foreground: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  accent: string;
  accentForeground: string;
  accentSoft: string;
  accentSoftForeground: string;
  secondary: string;
  muted: string;
};

export type KinfloTenantPalette = {
  id: KinfloPaletteId;
  label: string;
  description: string;
  light: KinfloPaletteTokens;
  dark: KinfloPaletteTokens;
};

export const KINFLO_DEFAULT_PALETTE_ID: KinfloPaletteId = "kinflo-default";

export const kinfloPaletteRegistry: Record<KinfloPaletteId, KinfloTenantPalette> = {
  "kinflo-default": {
    id: "kinflo-default",
    label: "KinFlo Grounded",
    description: "KinFlo's warm, practical default for community and learning organizations.",
    light: {
      background: "#faf8f5",
      foreground: "#29221d",
      surface: "#ffffff",
      surfaceMuted: "#f2ebe3",
      border: "#d9cfc4",
      accent: "#92400e",
      accentForeground: "#ffffff",
      accentSoft: "#ffedd5",
      accentSoftForeground: "#7c2d12",
      secondary: "#4d6028",
      muted: "#6b625b",
    },
    dark: {
      background: "#171310",
      foreground: "#f5f1ec",
      surface: "#211b17",
      surfaceMuted: "#2d251f",
      border: "#514339",
      accent: "#fbbf24",
      accentForeground: "#1f1705",
      accentSoft: "#49300f",
      accentSoftForeground: "#fde68a",
      secondary: "#b8cc72",
      muted: "#c9bdb2",
    },
  },
  "reversr-vanguard": {
    id: "reversr-vanguard",
    label: "ReversR Industrial",
    description: "Blue, graphite, and teal tokens shared by Vanguard and the ReversR order journey.",
    light: {
      background: "#f7f8fa",
      foreground: "#172033",
      surface: "#ffffff",
      surfaceMuted: "#e9edf3",
      border: "#cbd3df",
      accent: "#2563eb",
      accentForeground: "#ffffff",
      accentSoft: "#dbeafe",
      accentSoftForeground: "#1e3a8a",
      secondary: "#007a55",
      muted: "#5b6678",
    },
    dark: {
      background: "#0f1726",
      foreground: "#f6f7f9",
      surface: "#182235",
      surfaceMuted: "#222f46",
      border: "#43516a",
      accent: "#60a5fa",
      accentForeground: "#07111f",
      accentSoft: "#1e3a5f",
      accentSoftForeground: "#bfdbfe",
      secondary: "#5eead4",
      muted: "#bac3d2",
    },
  },
  "professional-neutral": {
    id: "professional-neutral",
    label: "Professional Neutral",
    description: "A calm teal and slate system for advisory, services, and future tenant sites.",
    light: {
      background: "#f8fafc",
      foreground: "#0f172a",
      surface: "#ffffff",
      surfaceMuted: "#e2e8f0",
      border: "#cbd5e1",
      accent: "#0f766e",
      accentForeground: "#ffffff",
      accentSoft: "#ccfbf1",
      accentSoftForeground: "#115e59",
      secondary: "#334155",
      muted: "#5b6678",
    },
    dark: {
      background: "#0f172a",
      foreground: "#f8fafc",
      surface: "#172033",
      surfaceMuted: "#243147",
      border: "#475569",
      accent: "#5eead4",
      accentForeground: "#0f172a",
      accentSoft: "#153f3d",
      accentSoftForeground: "#99f6e4",
      secondary: "#cbd5e1",
      muted: "#cbd5e1",
    },
  },
};

export const tenantPaletteAssignments: Record<string, KinfloPaletteId> = {
  "julies-family": "kinflo-default",
  "advisor-client-starter": "professional-neutral",
  "vanguard-enterprises": "reversr-vanguard",
  "campaign-microsite-lab": "professional-neutral",
};

export function isKinfloPaletteId(value: string): value is KinfloPaletteId {
  return Object.prototype.hasOwnProperty.call(kinfloPaletteRegistry, value);
}

export function resolveKinfloPalette(paletteId?: string): KinfloTenantPalette {
  return paletteId && isKinfloPaletteId(paletteId)
    ? kinfloPaletteRegistry[paletteId]
    : kinfloPaletteRegistry[KINFLO_DEFAULT_PALETTE_ID];
}

export function resolveTenantPaletteId(tenantSlug?: string): KinfloPaletteId {
  return tenantSlug ? tenantPaletteAssignments[tenantSlug] ?? KINFLO_DEFAULT_PALETTE_ID : KINFLO_DEFAULT_PALETTE_ID;
}

export function resolveTenantPalette(tenantSlug?: string): KinfloTenantPalette {
  return resolveKinfloPalette(resolveTenantPaletteId(tenantSlug));
}

export function getPaletteCssVariables(palette: KinfloTenantPalette, mode: "light" | "dark") {
  const tokens = palette[mode];
  return {
    "--kinflo-background": tokens.background,
    "--kinflo-foreground": tokens.foreground,
    "--kinflo-surface": tokens.surface,
    "--kinflo-surface-muted": tokens.surfaceMuted,
    "--kinflo-border": tokens.border,
    "--kinflo-accent": tokens.accent,
    "--kinflo-accent-foreground": tokens.accentForeground,
    "--kinflo-accent-soft": tokens.accentSoft,
    "--kinflo-accent-soft-foreground": tokens.accentSoftForeground,
    "--kinflo-secondary": tokens.secondary,
    "--kinflo-muted": tokens.muted,
  } as const;
}

export const kinfloPaletteOptions = Object.values(kinfloPaletteRegistry);
