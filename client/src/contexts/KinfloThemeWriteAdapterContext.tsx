import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useConvex, useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { getKinfloConvexRuntime } from "@/lib/kinfloConvexRuntime";
import {
  kinfloPaletteRegistry,
  type KinfloPaletteId,
  type KinfloPaletteTokens,
} from "@/lib/kinfloPaletteRegistry";

export type ThemeWriteInput = {
  siteId: string;
  paletteId: KinfloPaletteId;
  typography: { key: string; heading: string; body: string; scale: string };
  buttons: { key: string; style: string; radius: number };
  media: { key: string; treatment: string; ratio: string };
};

type ThemePalettePacket = {
  paletteId: KinfloPaletteId;
  registryVersion: "2026-10-14";
  light: KinfloPaletteTokens;
  dark: KinfloPaletteTokens;
};

type ThemeMutationInput = {
  siteId: string;
  palette: ThemePalettePacket;
  typography: ThemeWriteInput["typography"];
  buttons: ThemeWriteInput["buttons"];
  media: ThemeWriteInput["media"];
};

type SiteDraftResult = {
  theme: {
    palette?: unknown;
    typography?: unknown;
    buttons?: unknown;
    media?: unknown;
  } | null;
};

type ThemeWriteStatus = "blocked" | "ready" | "saving" | "saved" | "error";

type ThemeWriteAdapterContextValue = {
  enabled: boolean;
  status: ThemeWriteStatus;
  error: string | null;
  activationGate: string;
  save: (input: ThemeWriteInput) => Promise<void>;
  clearError: () => void;
};

const updateThemeTokensMutation = makeFunctionReference<"mutation", ThemeMutationInput, null>(
  "controlPlane:updateThemeTokens",
);
const getSiteDraftQuery = makeFunctionReference<"query", { siteId: string }, SiteDraftResult>(
  "siteBuilder:getSiteDraft",
);

function themePacket(input: ThemeWriteInput): ThemeMutationInput {
  const palette = kinfloPaletteRegistry[input.paletteId];
  return {
    siteId: input.siteId,
    palette: {
      paletteId: palette.id,
      registryVersion: "2026-10-14",
      light: palette.light,
      dark: palette.dark,
    },
    typography: input.typography,
    buttons: input.buttons,
    media: input.media,
  };
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function packetsMatch(saved: ThemeMutationInput, readback: SiteDraftResult) {
  return Boolean(readback.theme)
    && stableSerialize(readback.theme?.palette) === stableSerialize(saved.palette)
    && stableSerialize(readback.theme?.typography) === stableSerialize(saved.typography)
    && stableSerialize(readback.theme?.buttons) === stableSerialize(saved.buttons)
    && stableSerialize(readback.theme?.media) === stableSerialize(saved.media);
}

const blockedRuntime = getKinfloConvexRuntime();
const blockedValue: ThemeWriteAdapterContextValue = {
  enabled: false,
  status: "blocked",
  error: null,
  activationGate: blockedRuntime.themeWriteActivationGate,
  save: async () => {
    throw new Error("KinFlo theme write adapter is disabled");
  },
  clearError: () => undefined,
};

const KinfloThemeWriteAdapterContext = createContext<ThemeWriteAdapterContextValue>(blockedValue);

export function DisabledKinfloThemeWriteAdapterProvider({ children }: { children: ReactNode }) {
  return (
    <KinfloThemeWriteAdapterContext.Provider value={blockedValue}>
      {children}
    </KinfloThemeWriteAdapterContext.Provider>
  );
}

export function LiveKinfloThemeWriteAdapterProvider({ children }: { children: ReactNode }) {
  const runtime = getKinfloConvexRuntime();
  const convex = useConvex();
  const updateThemeTokens = useMutation(updateThemeTokensMutation);
  const enabled = runtime.canUseLiveThemeWrites;
  const [status, setStatus] = useState<ThemeWriteStatus>(enabled ? "ready" : "blocked");
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (input: ThemeWriteInput) => {
    if (!enabled) {
      throw new Error("KinFlo theme write adapter is disabled");
    }
    const packet = themePacket(input);
    setStatus("saving");
    setError(null);
    try {
      await updateThemeTokens(packet);
      const readback = await convex.query(getSiteDraftQuery, { siteId: input.siteId });
      if (!packetsMatch(packet, readback)) {
        throw new Error("Saved theme tokens did not match the verified site-draft read-back.");
      }
      setStatus("saved");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Theme tokens could not be saved.");
      setStatus("error");
    }
  }, [convex, enabled, updateThemeTokens]);

  const value = useMemo<ThemeWriteAdapterContextValue>(() => ({
    enabled,
    status,
    error,
    activationGate: runtime.themeWriteActivationGate,
    save,
    clearError: () => {
      setError(null);
      setStatus(enabled ? "ready" : "blocked");
    },
  }), [enabled, error, runtime.themeWriteActivationGate, save, status]);

  return (
    <KinfloThemeWriteAdapterContext.Provider value={value}>
      {children}
    </KinfloThemeWriteAdapterContext.Provider>
  );
}

export function useKinfloThemeWriteAdapter() {
  return useContext(KinfloThemeWriteAdapterContext);
}
