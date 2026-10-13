import {
  resolveKinfloGeneratedApiBinding,
  type KinfloGeneratedApiModule,
} from "./kinfloGeneratedApiContract";
import type { KinfloConvexFunctionName } from "./kinfloConvexRuntime";

export type KinfloGeneratedApiTree = Partial<
  Record<KinfloGeneratedApiModule, Record<string, unknown>>
>;

export type KinfloGeneratedApiSeamOptions = {
  allowMutationPaths?: readonly KinfloConvexFunctionName[];
};

export const PREFERENCE_SMOKE_GENERATED_API_PATH = "preferences.runPreferenceSmoke" as const;

// This seam accepts generated bindings only from a caller that already owns the
// ignored codegen output. Mutations are unreachable unless the caller supplies
// an exact allowlist; no current client surface supplies one.
export function resolveKinfloGeneratedApiHandle<THandle = unknown>(
  generatedApi: KinfloGeneratedApiTree,
  convexPath: KinfloConvexFunctionName,
  options: KinfloGeneratedApiSeamOptions = {},
): THandle {
  const binding = resolveKinfloGeneratedApiBinding(convexPath);
  if (!binding) {
    throw new Error(`Unreviewed KinFlo generated API binding: ${convexPath}`);
  }
  if (
    binding.kind === "mutation"
    && !options.allowMutationPaths?.includes(convexPath)
  ) {
    throw new Error(`KinFlo generated mutation binding is fail-closed: ${convexPath}`);
  }

  const handle = generatedApi[binding.module]?.[binding.exportName];
  if (!handle) {
    throw new Error(`Generated KinFlo API handle is unavailable: ${convexPath}`);
  }
  return handle as THandle;
}

// Kept separate from the product runtime manifest so the smoke operation cannot
// be mounted by a general adapter. A future, approval-bound harness must opt in
// to this exact handle and still pass both client and server gates.
export function resolvePreferenceSmokeGeneratedApiHandle<THandle = unknown>(
  generatedApi: KinfloGeneratedApiTree,
  clientGateOpen: boolean,
): THandle {
  if (!clientGateOpen) {
    throw new Error("KinFlo preference mutation smoke client gate is disabled");
  }
  const handle = generatedApi.preferences?.runPreferenceSmoke;
  if (!handle) {
    throw new Error(`Generated KinFlo API handle is unavailable: ${PREFERENCE_SMOKE_GENERATED_API_PATH}`);
  }
  return handle as THandle;
}
