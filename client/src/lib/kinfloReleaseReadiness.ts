export type KinfloReleaseReadinessScope = {
  tenantSlug: string;
  siteSlug: string;
};

export type KinfloReleaseReadinessCheckStatus = "ready" | "pending" | "blocked";

export type KinfloReleaseReadinessCheck = {
  tenantSlug: string;
  siteSlug: string;
  key: string;
  label: string;
  status: KinfloReleaseReadinessCheckStatus;
  owner: string;
  evidence: string;
  nextAction: string;
  rollbackReference: string;
};

export const kinfloReleaseReadinessBlockedActions = [
  "release",
  "publish",
  "activate",
  "provider writes",
  "send",
  "upload",
  "persist",
] as const;

export type KinfloReleaseReadinessPacket = {
  scope: KinfloReleaseReadinessScope;
  status: "ready" | "blocked" | "empty";
  mode: "read_only_preview";
  summary: string;
  checks: KinfloReleaseReadinessCheck[];
  blockers: string[];
  nextAction: string;
  owner: string;
  evidence: string[];
  rollbackReference: string;
  blockedActions: readonly string[];
  canRelease: false;
  canPublish: false;
  canActivate: false;
  providerWrites: false;
  sends: false;
  uploads: false;
  persistence: false;
};

export type KinfloReleaseReadinessResolution =
  | { status: "ready" | "blocked" | "empty"; packet: KinfloReleaseReadinessPacket }
  | {
      status: "unauthorized" | "scope_mismatch";
      scope: Partial<KinfloReleaseReadinessScope>;
      reason: string;
      blockedActions: readonly string[];
      mode: "read_only_preview";
    };

const previewFixtures: readonly KinfloReleaseReadinessCheck[] = [
  {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    key: "source-scope",
    label: "Tenant/site source scope",
    status: "ready",
    owner: "KinFlo platform owner",
    evidence: "The selected Vanguard tenant and site are represented by one local fixture scope.",
    nextAction: "Keep the selected scope attached to every future release review.",
    rollbackReference: "Return to the scoped fixture snapshot before reviewing another site.",
  },
  {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    key: "review-evidence",
    label: "Review evidence packet",
    status: "ready",
    owner: "Vanguard quality owner",
    evidence: "Preview evidence, owner notes, and the rollback checkpoint are recorded locally.",
    nextAction: "Review the evidence packet with the named owner.",
    rollbackReference: "Hold the current provider-light preview and use the evidence packet as the rollback point.",
  },
  {
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    key: "hosted-gates",
    label: "Hosted activation gates",
    status: "ready",
    owner: "KinFlo release owner",
    evidence: "The hosted activation, provider, and production gates are explicitly represented as pending future work.",
    nextAction: "Obtain a separately approved hosted activation window before any live execution.",
    rollbackReference: "Keep the fixture adapter selected and preserve the no-write preview posture.",
  },
  {
    tenantSlug: "advisor-client-starter",
    siteSlug: "advisor-client-site",
    key: "domain-proof",
    label: "Domain ownership proof",
    status: "pending",
    owner: "Super admin",
    evidence: "Domain metadata exists in the local fixture, but DNS ownership and SSL proof are not available here.",
    nextAction: "Collect and review source-respecting domain evidence in a separately approved gate.",
    rollbackReference: "Keep the site on its local preview path until domain evidence is accepted.",
  },
  {
    tenantSlug: "advisor-client-starter",
    siteSlug: "advisor-client-site",
    key: "provider-proof",
    label: "Provider readiness proof",
    status: "blocked",
    owner: "Provider owner",
    evidence: "No provider smoke, secret access, send, upload, or storage write is available in this source-only slice.",
    nextAction: "Document the provider owner and approval boundary without adding a provider connection.",
    rollbackReference: "Keep provider actions disabled and return to the local fixture review packet.",
  },
  {
    tenantSlug: "advisor-client-starter",
    siteSlug: "advisor-client-site",
    key: "release-approval",
    label: "Release approval",
    status: "blocked",
    owner: "KinFlo release owner",
    evidence: "The preview contract has no production approval, deployment, or rollback execution evidence.",
    nextAction: "Resolve the domain and provider blockers before a release decision is considered.",
    rollbackReference: "Keep the site in draft/preview and preserve the current fixture state.",
  },
];

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeScope(scope: Partial<KinfloReleaseReadinessScope>) {
  return {
    tenantSlug: normalize(scope.tenantSlug),
    siteSlug: normalize(scope.siteSlug),
  };
}

function scopesMatch(left: Partial<KinfloReleaseReadinessScope>, right: Partial<KinfloReleaseReadinessScope>) {
  const normalizedLeft = normalizeScope(left);
  const normalizedRight = normalizeScope(right);
  return Boolean(normalizedLeft.tenantSlug && normalizedLeft.siteSlug)
    && normalizedLeft.tenantSlug === normalizedRight.tenantSlug
    && normalizedLeft.siteSlug === normalizedRight.siteSlug;
}

function emptyPacket(scope: KinfloReleaseReadinessScope, reason: string): KinfloReleaseReadinessPacket {
  return {
    scope,
    status: "empty",
    mode: "read_only_preview",
    summary: reason,
    checks: [],
    blockers: [reason],
    nextAction: "Add a source-only readiness record for this exact tenant/site pair.",
    owner: "KinFlo platform owner",
    evidence: [],
    rollbackReference: "Keep the existing scoped preview unchanged until evidence is available.",
    blockedActions: kinfloReleaseReadinessBlockedActions,
    canRelease: false,
    canPublish: false,
    canActivate: false,
    providerWrites: false,
    sends: false,
    uploads: false,
    persistence: false,
  };
}

export function resolveKinfloReleaseReadiness(input: {
  requestedScope: Partial<KinfloReleaseReadinessScope>;
  authorizedScope?: Partial<KinfloReleaseReadinessScope>;
  access?: "authorized" | "unauthorized";
  checks?: readonly KinfloReleaseReadinessCheck[];
}): KinfloReleaseReadinessResolution {
  const requestedScope = normalizeScope(input.requestedScope);
  if (input.access === "unauthorized" || !input.authorizedScope) {
    return {
      status: "unauthorized",
      scope: requestedScope,
      reason: input.access === "unauthorized"
        ? "Readiness is unavailable because the active admin scope is unauthorized."
        : "Readiness is unavailable because no authorized admin scope is available.",
      blockedActions: kinfloReleaseReadinessBlockedActions,
      mode: "read_only_preview",
    };
  }

  if (!requestedScope.tenantSlug || !requestedScope.siteSlug) {
    return {
      status: "empty",
      packet: emptyPacket(requestedScope, "Readiness is unavailable until both tenant and site scope are explicit."),
    };
  }

  if (input.authorizedScope && !scopesMatch(requestedScope, input.authorizedScope)) {
    return {
      status: "scope_mismatch",
      scope: requestedScope,
      reason: "The requested tenant/site pair does not match the authorized admin scope.",
      blockedActions: kinfloReleaseReadinessBlockedActions,
      mode: "read_only_preview",
    };
  }

  const checks = (input.checks ?? previewFixtures).filter((check) => scopesMatch(check, requestedScope));
  if (checks.length === 0) {
    return { status: "empty", packet: emptyPacket(requestedScope, "No readiness evidence is registered for this tenant/site pair.") };
  }

  const blockers = checks.filter((check) => check.status !== "ready");
  const firstBlocker = blockers[0];
  const packetStatus = blockers.length > 0 ? "blocked" : "ready";
  return {
    status: packetStatus,
    packet: {
      scope: requestedScope,
      status: packetStatus,
      mode: "read_only_preview",
      summary: blockers.length > 0
        ? `${blockers.length} readiness blocker(s) remain for this scoped preview.`
        : "The source-only readiness evidence is complete for this scope; live release remains gated.",
      checks,
      blockers: blockers.map((check) => `${check.label}: ${check.evidence}`),
      nextAction: firstBlocker?.nextAction ?? "Review the evidence packet and obtain a separately approved hosted activation decision.",
      owner: firstBlocker?.owner ?? checks[0].owner,
      evidence: checks.map((check) => `${check.label}: ${check.evidence}`),
      rollbackReference: firstBlocker?.rollbackReference ?? checks[0].rollbackReference,
      blockedActions: kinfloReleaseReadinessBlockedActions,
      canRelease: false,
      canPublish: false,
      canActivate: false,
      providerWrites: false,
      sends: false,
      uploads: false,
      persistence: false,
    },
  };
}

export function isKinfloReleaseReadinessPreviewOnly(resolution: KinfloReleaseReadinessResolution) {
  if (!("packet" in resolution)) {
    return false;
  }
  return resolution.packet.mode === "read_only_preview"
    && !resolution.packet.canRelease
    && !resolution.packet.canPublish
    && !resolution.packet.canActivate
    && !resolution.packet.providerWrites
    && !resolution.packet.sends
    && !resolution.packet.uploads
    && !resolution.packet.persistence;
}
