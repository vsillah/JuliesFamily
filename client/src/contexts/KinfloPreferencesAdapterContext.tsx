import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useConvex, useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { getKinfloConvexRuntime } from "@/lib/kinfloConvexRuntime";
import type { ShellExperiencePreference } from "@/lib/kinfloShellData";

type PreferenceValues = Pick<
  ShellExperiencePreference,
  | "defaultLandingPage"
  | "theme"
  | "dataDensity"
  | "itemsPerPage"
  | "defaultContentFilter"
  | "notificationChannels"
>;

type PreferenceDocument = Partial<Omit<PreferenceValues, "notificationChannels">> & {
  notificationPreferences?: { notificationChannels?: unknown };
};

type PreferenceQueryResult = {
  preferences: PreferenceDocument | null;
  defaults: Omit<PreferenceValues, "notificationChannels"> & {
    notificationPreferences: { notificationChannels: string[] };
  };
};

type PreferenceSaveInput = PreferenceValues;
type PreferenceMutationInput = Omit<PreferenceSaveInput, "notificationChannels"> & {
  notificationPreferences: { notificationChannels: string[] };
};
type PreferenceAdapterStatus = "blocked" | "loading" | "ready" | "saving" | "saved" | "error";

type PreferenceAdapterContextValue = {
  enabled: boolean;
  status: PreferenceAdapterStatus;
  preferences: PreferenceValues | null;
  error: string | null;
  save: (input: PreferenceSaveInput) => Promise<void>;
  retry: () => void;
  restoreFixtures: () => void;
};

const getMyPreferencesQuery = makeFunctionReference<
  "query",
  Record<string, never>,
  PreferenceQueryResult
>("preferences:getMyPreferences");

const upsertMyPreferencesMutation = makeFunctionReference<
  "mutation",
  PreferenceMutationInput,
  string
>("preferences:upsertMyPreferences");

const blockedValue: PreferenceAdapterContextValue = {
  enabled: false,
  status: "blocked",
  preferences: null,
  error: null,
  save: async () => {
    throw new Error("KinFlo preferences adapter is disabled");
  },
  retry: () => undefined,
  restoreFixtures: () => undefined,
};

const KinfloPreferencesAdapterContext = createContext<PreferenceAdapterContextValue>(blockedValue);

function asNotificationChannels(value: unknown, fallback: string[]) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return fallback;
  }
  return value;
}

function normalizePreferences(result: PreferenceQueryResult): PreferenceValues {
  const stored = result.preferences ?? {};
  return {
    defaultLandingPage: stored.defaultLandingPage ?? result.defaults.defaultLandingPage,
    theme: stored.theme ?? result.defaults.theme,
    dataDensity: stored.dataDensity ?? result.defaults.dataDensity,
    itemsPerPage: stored.itemsPerPage ?? result.defaults.itemsPerPage,
    defaultContentFilter: stored.defaultContentFilter ?? result.defaults.defaultContentFilter,
    notificationChannels: asNotificationChannels(
      stored.notificationPreferences?.notificationChannels,
      result.defaults.notificationPreferences.notificationChannels,
    ),
  };
}

export function DisabledKinfloPreferencesAdapterProvider({ children }: { children: ReactNode }) {
  return (
    <KinfloPreferencesAdapterContext.Provider value={blockedValue}>
      {children}
    </KinfloPreferencesAdapterContext.Provider>
  );
}

export function LiveKinfloPreferencesAdapterProvider({ children }: { children: ReactNode }) {
  const runtime = getKinfloConvexRuntime();
  const convex = useConvex();
  const upsert = useMutation(upsertMyPreferencesMutation);
  const [sessionFallback, setSessionFallback] = useState(false);
  const enabled = runtime.canUseLivePreferences && !sessionFallback;
  const [status, setStatus] = useState<PreferenceAdapterStatus>(enabled ? "loading" : "blocked");
  const [preferences, setPreferences] = useState<PreferenceValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadRevision, setLoadRevision] = useState(0);

  const load = useCallback(async () => {
    if (!enabled) {
      setStatus("blocked");
      setPreferences(null);
      setError(null);
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const result = await convex.query(getMyPreferencesQuery, {});
      setPreferences(normalizePreferences(result));
      setStatus("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Preferences could not be loaded.");
      setStatus("error");
    }
  }, [convex, enabled]);

  useEffect(() => {
    void load();
  }, [load, loadRevision]);

  const save = useCallback(async (input: PreferenceSaveInput) => {
    if (!enabled) {
      throw new Error("KinFlo preferences adapter is disabled");
    }
    setStatus("saving");
    setError(null);
    try {
      await upsert({
        defaultLandingPage: input.defaultLandingPage,
        theme: input.theme,
        dataDensity: input.dataDensity,
        itemsPerPage: input.itemsPerPage,
        defaultContentFilter: input.defaultContentFilter,
        notificationPreferences: { notificationChannels: input.notificationChannels },
      });
      const verified = normalizePreferences(await convex.query(getMyPreferencesQuery, {}));
      const exactMatch = JSON.stringify(verified) === JSON.stringify(input);
      if (!exactMatch) {
        throw new Error("Saved preferences did not match the verified read-back.");
      }
      setPreferences(verified);
      setStatus("saved");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Preferences could not be saved.");
      setStatus("error");
    }
  }, [convex, enabled, upsert]);

  const value = useMemo<PreferenceAdapterContextValue>(() => ({
    enabled,
    status,
    preferences,
    error,
    save,
    retry: () => setLoadRevision((revision) => revision + 1),
    restoreFixtures: () => {
      setSessionFallback(true);
      setPreferences(null);
      setError(null);
      setStatus("blocked");
    },
  }), [enabled, error, preferences, save, status]);

  return (
    <KinfloPreferencesAdapterContext.Provider value={value}>
      {children}
    </KinfloPreferencesAdapterContext.Provider>
  );
}

export function useKinfloPreferencesAdapter() {
  return useContext(KinfloPreferencesAdapterContext);
}
