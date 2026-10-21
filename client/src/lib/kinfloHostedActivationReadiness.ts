export type KinfloHostedActivationReadinessScope = {
  tenantSlug: string;
  siteSlug: string;
};

export type KinfloHostedActivationGateStatus = "ready" | "pending" | "blocked";

export type KinfloHostedActivationGate = {
  tenantSlug: string;
  siteSlug: string;
  key: "ownership" | "environment" | "codegen" | "preflight" | "smoke" | "rollback";
  label: string;
  status: KinfloHostedActivationGateStatus;
  owner: string;
  evidence: string;
  nextAction: string;
  rollbackReference: string;
};

export const kinfloHostedActivationBlockedActions = [
  "Convex codegen",
  "hosted deployment",
  "hosted smoke",
  "provider writes",
  "email/SMS",
  "uploads",
  "storage/persistence",
  "production changes",
] as const;

export type KinfloHostedActivationReadinessPacket = {
  scope: KinfloHostedActivationReadinessScope;
  status: "ready" | "blocked" | "empty";
  mode: "read_only_preview";
  summary: string;
  gates: KinfloHostedActivationGate[];
  blockers: string[];
  owner: string;
  evidence: string[];
  nextAction: string;
  rollbackReference: string;
  blockedActions: readonly string[];
  canRunActivationPreflight: false;
  canRunHostedSmoke: false;
  canDeploy: false;
  canPerformMutations: false;
  providerWrites: false;
  sends: false;
  uploads: false;
  storageWrites: false;
  persistence: false;
  productionChanges: false;
};

export type KinfloHostedActivationReadinessResolution =
  | { status: "ready" | "blocked" | "empty"; packet: KinfloHostedActivationReadinessPacket }
  | {
      status: "unauthorized" | "scope_mismatch";
      scope: Partial<KinfloHostedActivationReadinessScope>;
      reason: string;
      blockedActions: readonly string[];
      mode: "read_only_preview";
    };

const previewGates: readonly KinfloHostedActivationGate[] = [
  {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    key: "ownership",
    label: "Hosted deployment ownership",
    status: "pending",
    owner: "KinFlo platform owner",
    evidence: "The source-only packet names the development deployment binding without asserting hosted access or ownership.",
    nextAction: "Verify the selected development deployment binding in a separately approved read-only gate.",
    rollbackReference: "Keep the fixture adapter selected and preserve the current no-write preview.",
  },
  {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    key: "environment",
    label: "Environment and callback alignment",
    status: "blocked",
    owner: "KinFlo release owner",
    evidence: "Environment values, callbacks, and deployment configuration are intentionally outside this source-only contract.",
    nextAction: "Review environment and callback bindings without changing production configuration.",
    rollbackReference: "Leave the existing callback and fixture configuration unchanged if review is incomplete.",
  },
  {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    key: "codegen",
    label: "Generated API review",
    status: "blocked",
    owner: "KinFlo platform owner",
    evidence: "Generated Convex bindings are not imported or executed by this source-only slice.",
    nextAction: "Complete the separate local env and generated-binding review before any hosted execution decision.",
    rollbackReference: "Keep fixture APIs in place and do not commit generated bindings from this review surface.",
  },
  {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    key: "preflight",
    label: "Activation preflight",
    status: "pending",
    owner: "KinFlo release owner",
    evidence: "The existing Hosted Activation Ledger supplies the detailed preflight review packet; no preflight command runs here.",
    nextAction: "Review the existing preflight packet and obtain a bounded approval before running anything.",
    rollbackReference: "Return to the source-only ledger and keep all live action controls disabled.",
  },
  {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    key: "smoke",
    label: "Hosted read-only smoke",
    status: "blocked",
    owner: "KinFlo quality owner",
    evidence: "Hosted smoke, uploads, persistence, provider calls, and data mutations are excluded from this slice.",
    nextAction: "Approve a single bounded read-only smoke only after ownership and preflight evidence are accepted.",
    rollbackReference: "Keep the local fixture path active and stop on any write, scope leak, or unknown result.",
  },
  {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    key: "rollback",
    label: "Fixture rollback checkpoint",
    status: "ready",
    owner: "KinFlo release owner",
    evidence: "The fallback adapter and source-only review surfaces remain the documented rollback path.",
    nextAction: "Use the fixture checkpoint as the rollback reference for any later hosted review.",
    rollbackReference: "Restore the fixture adapter and retain the selected tenant/site scope.",
  },
];

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeScope(scope: Partial<KinfloHostedActivationReadinessScope>) {
  return {
    tenantSlug: normalize(scope.tenantSlug),
    siteSlug: normalize(scope.siteSlug),
  };
}

function scopesMatch(left: Partial<KinfloHostedActivationReadinessScope>, right: Partial<KinfloHostedActivationReadinessScope>) {
  const normalizedLeft = normalizeScope(left);
  const normalizedRight = normalizeScope(right);
  return Boolean(normalizedLeft.tenantSlug && normalizedLeft.siteSlug)
    && normalizedLeft.tenantSlug === normalizedRight.tenantSlug
    && normalizedLeft.siteSlug === normalizedRight.siteSlug;
}

function emptyPacket(scope: KinfloHostedActivationReadinessScope, reason: string): KinfloHostedActivationReadinessPacket {
  return {
    scope,
    status: "empty",
    mode: "read_only_preview",
    summary: reason,
    gates: [],
    blockers: [reason],
    owner: "KinFlo platform owner",
    evidence: [],
    nextAction: "Add a source-only activation record for this exact tenant/site pair.",
    rollbackReference: "Keep the existing scoped preview unchanged until evidence is available.",
    blockedActions: kinfloHostedActivationBlockedActions,
    canRunActivationPreflight: false,
    canRunHostedSmoke: false,
    canDeploy: false,
    canPerformMutations: false,
    providerWrites: false,
    sends: false,
    uploads: false,
    storageWrites: false,
    persistence: false,
    productionChanges: false,
  };
}

export function resolveKinfloHostedActivationReadiness(input: {
  requestedScope: Partial<KinfloHostedActivationReadinessScope>;
  authorizedScope?: Partial<KinfloHostedActivationReadinessScope>;
  access?: "authorized" | "unauthorized";
  gates?: readonly KinfloHostedActivationGate[];
}): KinfloHostedActivationReadinessResolution {
  const requestedScope = normalizeScope(input.requestedScope);
  if (input.access === "unauthorized" || !input.authorizedScope) {
    return {
      status: "unauthorized",
      scope: requestedScope,
      reason: input.access === "unauthorized"
        ? "Hosted activation readiness is unavailable because the active admin scope is unauthorized."
        : "Hosted activation readiness is unavailable because no authorized admin scope is available.",
      blockedActions: kinfloHostedActivationBlockedActions,
      mode: "read_only_preview",
    };
  }

  if (!requestedScope.tenantSlug || !requestedScope.siteSlug) {
    return {
      status: "empty",
      packet: emptyPacket(requestedScope, "Hosted activation readiness is unavailable until both tenant and site scope are explicit."),
    };
  }

  if (!scopesMatch(requestedScope, input.authorizedScope)) {
    return {
      status: "scope_mismatch",
      scope: requestedScope,
      reason: "The requested tenant/site pair does not match the authorized admin scope.",
      blockedActions: kinfloHostedActivationBlockedActions,
      mode: "read_only_preview",
    };
  }

  const scopedGates = (input.gates ?? previewGates).filter((gate) => scopesMatch(gate, requestedScope));
  if (scopedGates.length === 0) {
    return { status: "empty", packet: emptyPacket(requestedScope, "No hosted activation evidence is registered for this tenant/site pair.") };
  }

  const blockers = scopedGates.filter((gate) => gate.status !== "ready");
  const firstBlocker = blockers[0];
  const status = blockers.length > 0 ? "blocked" : "ready";
  return {
    status,
    packet: {
      scope: requestedScope,
      status,
      mode: "read_only_preview",
      summary: blockers.length > 0
        ? `${blockers.length} hosted activation gate(s) remain for this scoped preview.`
        : "The source-only activation evidence is complete for this scope; live execution remains gated.",
      gates: scopedGates,
      blockers: blockers.map((gate) => `${gate.label}: ${gate.evidence}`),
      owner: firstBlocker?.owner ?? scopedGates[0].owner,
      evidence: scopedGates.map((gate) => `${gate.label}: ${gate.evidence}`),
      nextAction: firstBlocker?.nextAction ?? "Review the activation packet and obtain a separately approved hosted decision.",
      rollbackReference: firstBlocker?.rollbackReference ?? scopedGates[0].rollbackReference,
      blockedActions: kinfloHostedActivationBlockedActions,
      canRunActivationPreflight: false,
      canRunHostedSmoke: false,
      canDeploy: false,
      canPerformMutations: false,
      providerWrites: false,
      sends: false,
      uploads: false,
      storageWrites: false,
      persistence: false,
      productionChanges: false,
    },
  };
}

export function isKinfloHostedActivationReadinessPreviewOnly(resolution: KinfloHostedActivationReadinessResolution) {
  if (!("packet" in resolution)) return false;
  return resolution.packet.mode === "read_only_preview"
    && !resolution.packet.canRunActivationPreflight
    && !resolution.packet.canRunHostedSmoke
    && !resolution.packet.canDeploy
    && !resolution.packet.canPerformMutations
    && !resolution.packet.providerWrites
    && !resolution.packet.sends
    && !resolution.packet.uploads
    && !resolution.packet.storageWrites
    && !resolution.packet.persistence
    && !resolution.packet.productionChanges;
}
