import { getKinfloIdentityRuntime } from "@/lib/kinfloIdentityRuntime";

export type VanguardOrderRuntime = {
  mode: "browser_local" | "local_fixture" | "convex_auth";
  liveAdapterEnabled: boolean;
  gate: string;
};

function enabled(value: unknown) {
  return typeof value === "string" && value.trim().toLowerCase() === "true";
}

export function getVanguardOrderRuntime(): VanguardOrderRuntime {
  const identity = getKinfloIdentityRuntime();
  if (identity.mode === "local_fixture") {
    return {
      mode: "local_fixture",
      liveAdapterEnabled: false,
      gate: "Development review mode keeps every order and source file on this device.",
    };
  }
  const adapterSelected = import.meta.env.VITE_KINFLO_VANGUARD_ORDER_ADAPTER_MODE === "preview_verified";
  const bindingsReviewed = enabled(import.meta.env.VITE_KINFLO_VANGUARD_ORDER_BINDINGS_REVIEWED);
  const mutationSmokeVerified = enabled(import.meta.env.VITE_KINFLO_VANGUARD_ORDER_MUTATION_SMOKE_VERIFIED);
  const uploadSmokeVerified = enabled(import.meta.env.VITE_KINFLO_VANGUARD_ORDER_UPLOAD_SMOKE_VERIFIED);
  if (
    identity.mode === "convex_auth"
    && identity.publicUrl
    && adapterSelected
    && bindingsReviewed
    && mutationSmokeVerified
    && uploadSmokeVerified
  ) {
    return {
      mode: "convex_auth",
      liveAdapterEnabled: true,
      gate: "Authenticated draft saving and private source storage are enabled for this verified preview.",
    };
  }
  return {
    mode: "browser_local",
    liveAdapterEnabled: false,
    gate: identity.mode === "convex_auth"
      ? "Private workspace activation is waiting for reviewed bindings and successful draft and upload checks."
      : "Private workspace sign-in is not configured. Your request remains in this browser.",
  };
}
