export type KinfloIdentityMode = "disabled" | "convex_auth" | "local_fixture";

export type KinfloIdentityRuntime = {
  requestedMode: string;
  mode: KinfloIdentityMode;
  publicUrl?: string;
  configured: boolean;
  gate: string;
};

function readEnvValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getKinfloIdentityRuntime(): KinfloIdentityRuntime {
  const requestedMode = readEnvValue(import.meta.env.VITE_KINFLO_IDENTITY_MODE) ?? "disabled";
  const publicUrl = readEnvValue(import.meta.env.VITE_CONVEX_URL);

  if (requestedMode === "local_fixture") {
    if (import.meta.env.DEV) {
      return {
        requestedMode,
        mode: "local_fixture",
        configured: true,
        gate: "Local fixture identity is enabled for development-only visual QA.",
      };
    }

    return {
      requestedMode,
      mode: "disabled",
      configured: false,
      gate: "Local fixture identity is never allowed in a production build.",
    };
  }

  if (requestedMode === "convex_auth" && publicUrl) {
    return {
      requestedMode,
      mode: "convex_auth",
      publicUrl,
      configured: true,
      gate: "KinFlo admin identity is isolated on Convex Auth.",
    };
  }

  if (requestedMode === "convex_auth") {
    return {
      requestedMode,
      mode: "disabled",
      configured: false,
      gate: "VITE_CONVEX_URL is required before KinFlo Convex Auth can start.",
    };
  }

  return {
    requestedMode,
    mode: "disabled",
    configured: false,
    gate: "Set VITE_KINFLO_IDENTITY_MODE=convex_auth and provide VITE_CONVEX_URL through the approved environment path.",
  };
}
