export const kinfloGovernancePermissions = [
  "platform:manage",
  "tenant:view",
  "tenant:manage",
  "site:view",
  "site:manage",
  "member:view",
  "member:manage",
  "content:view",
  "content:edit",
  "content:publish",
  "audience:view",
  "audience:manage",
  "experiment:view",
  "experiment:manage",
  "analytics:view",
  "preview:view",
  "preview:simulate",
] as const;

export type KinfloGovernancePermission = (typeof kinfloGovernancePermissions)[number];
export type KinfloGovernanceMembershipStatus = "active" | "inactive" | "pending" | "revoked";
export type KinfloGovernanceScopeType = "platform" | "tenant" | "site";
export type KinfloGovernanceRole =
  | "platform_super_admin"
  | "tenant_owner"
  | "tenant_admin"
  | "site_admin"
  | "content_editor"
  | "audience_manager"
  | "experiment_manager"
  | "analytics_viewer"
  | "preview_reviewer"
  | "site_viewer";

export type KinfloGovernanceUser = {
  id: string;
  displayName: string;
  email?: string;
  status: "active" | "inactive";
};

export type KinfloMembershipScope = {
  type: KinfloGovernanceScopeType;
  tenantSlug?: string;
  siteSlug?: string;
};

export type KinfloGovernanceMember = {
  userId: string;
  role: KinfloGovernanceRole;
  status: KinfloGovernanceMembershipStatus;
  scope: KinfloMembershipScope;
};

export const kinfloGovernanceRoleLabels: Record<KinfloGovernanceRole, string> = {
  platform_super_admin: "Platform super admin",
  tenant_owner: "Tenant owner",
  tenant_admin: "Tenant admin",
  site_admin: "Site admin",
  content_editor: "Content editor",
  audience_manager: "Audience manager",
  experiment_manager: "Experiment manager",
  analytics_viewer: "Analytics viewer",
  preview_reviewer: "Preview reviewer",
  site_viewer: "Site viewer",
};

export const kinfloGovernanceRoles = Object.keys(kinfloGovernanceRoleLabels) as KinfloGovernanceRole[];

export const kinfloGovernanceRoleScopeTypes: Record<KinfloGovernanceRole, readonly KinfloGovernanceScopeType[]> = {
  platform_super_admin: ["platform"],
  tenant_owner: ["tenant"],
  tenant_admin: ["tenant"],
  site_admin: ["site"],
  content_editor: ["site"],
  audience_manager: ["site"],
  experiment_manager: ["site"],
  analytics_viewer: ["site"],
  preview_reviewer: ["site"],
  site_viewer: ["site"],
};

export const kinfloGovernanceRoleMatrix: Record<KinfloGovernanceRole, readonly KinfloGovernancePermission[]> = {
  platform_super_admin: kinfloGovernancePermissions,
  tenant_owner: [
    "tenant:view", "tenant:manage", "site:view", "site:manage", "member:view", "member:manage",
    "content:view", "content:edit", "content:publish", "audience:view", "audience:manage",
    "experiment:view", "experiment:manage", "analytics:view", "preview:view", "preview:simulate",
  ],
  tenant_admin: [
    "tenant:view", "site:view", "site:manage", "member:view", "member:manage",
    "content:view", "content:edit", "content:publish", "audience:view", "audience:manage",
    "experiment:view", "experiment:manage", "analytics:view", "preview:view", "preview:simulate",
  ],
  site_admin: [
    "site:view", "site:manage", "content:view", "content:edit", "content:publish",
    "audience:view", "audience:manage", "experiment:view", "experiment:manage",
    "analytics:view", "preview:view", "preview:simulate",
  ],
  content_editor: ["site:view", "content:view", "content:edit", "preview:view", "preview:simulate"],
  audience_manager: ["site:view", "audience:view", "audience:manage", "preview:view", "preview:simulate"],
  experiment_manager: ["site:view", "experiment:view", "experiment:manage", "preview:view", "preview:simulate"],
  analytics_viewer: ["site:view", "analytics:view", "preview:view"],
  preview_reviewer: ["site:view", "content:view", "preview:view", "preview:simulate"],
  site_viewer: ["site:view", "content:view", "preview:view"],
};

export type KinfloCapabilityEvaluation = {
  status: "allowed" | "denied";
  permission: string;
  scope: KinfloMembershipScope;
  readOnly: true;
  previewOnly: true;
  authorizationChanged: false;
  impersonation: false;
  reason?:
    | "unknown_permission"
    | "invalid_scope"
    | "missing_membership"
    | "inactive_membership"
    | "membership_scope_mismatch"
    | "role_does_not_grant_permission";
  matchedMembership?: KinfloGovernanceMember;
};

export type KinfloCapabilityPreviewMarker = {
  mode: "read_only_preview";
  capabilityMode: "preview_only";
  userId: string;
  role: string;
  permission: string;
  displayOnly: true;
  accessGranted: false;
  authorizationChanged: false;
  impersonation: false;
};

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase() || undefined;
}

function isKnownPermission(permission: string): permission is KinfloGovernancePermission {
  return kinfloGovernancePermissions.includes(permission as KinfloGovernancePermission);
}

function isValidScope(scope: KinfloMembershipScope) {
  if (scope.type === "platform") return !scope.tenantSlug && !scope.siteSlug;
  if (scope.type === "tenant") return Boolean(scope.tenantSlug) && !scope.siteSlug;
  return Boolean(scope.tenantSlug && scope.siteSlug);
}

function membershipCoversScope(membership: KinfloGovernanceMember, requested: KinfloMembershipScope) {
  if (!kinfloGovernanceRoleScopeTypes[membership.role]?.includes(membership.scope.type)) return false;
  if (membership.scope.type === "platform") return true;
  if (membership.scope.tenantSlug !== requested.tenantSlug) return false;
  if (membership.scope.type === "tenant") return requested.type === "tenant" || requested.type === "site";
  return requested.type === "site" && membership.scope.siteSlug === requested.siteSlug;
}

export function evaluateKinfloCapability(input: {
  actorUserId: string;
  requestedPermission: string;
  requestedScope: KinfloMembershipScope;
  memberships: readonly KinfloGovernanceMember[];
}): KinfloCapabilityEvaluation {
  const permission = normalize(input.requestedPermission) ?? "";
  const base = {
    permission,
    scope: input.requestedScope,
    readOnly: true as const,
    previewOnly: true as const,
    authorizationChanged: false as const,
    impersonation: false as const,
  };
  if (!isKnownPermission(permission)) return { ...base, status: "denied", reason: "unknown_permission" };
  if (!isValidScope(input.requestedScope)) return { ...base, status: "denied", reason: "invalid_scope" };

  const memberships = input.memberships.filter((membership) => membership.userId === input.actorUserId);
  if (memberships.length === 0) return { ...base, status: "denied", reason: "missing_membership" };
  if (memberships.every((membership) => membership.status !== "active")) {
    return { ...base, status: "denied", reason: "inactive_membership" };
  }
  const scopedMemberships = memberships.filter(
    (membership) => membership.status === "active" && membershipCoversScope(membership, input.requestedScope),
  );
  if (scopedMemberships.length === 0) return { ...base, status: "denied", reason: "membership_scope_mismatch" };
  const matchedMembership = scopedMemberships.find((membership) => kinfloGovernanceRoleMatrix[membership.role]?.includes(permission));
  if (!matchedMembership) return { ...base, status: "denied", reason: "role_does_not_grant_permission" };
  return { ...base, status: "allowed", matchedMembership };
}

export function buildKinfloCapabilitySimulationHref(input: {
  baseHref: string;
  userId: string;
  role: KinfloGovernanceRole;
  permission: KinfloGovernancePermission;
}) {
  const url = new URL(input.baseHref, "https://kinflo-preview.invalid");
  url.searchParams.set("capabilityMode", "preview_only");
  url.searchParams.set("previewMode", "read_only");
  url.searchParams.set("viewAsUser", input.userId);
  url.searchParams.set("simulatedRole", input.role);
  url.searchParams.set("simulatedPermission", input.permission);
  url.searchParams.set("authorizationChange", "none");
  url.searchParams.set("impersonation", "false");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function resolveKinfloCapabilityPreviewMarker(input: {
  capabilityMode?: string;
  userId?: string;
  role?: string;
  permission?: string;
}): KinfloCapabilityPreviewMarker | undefined {
  const userId = input.userId?.trim();
  const role = input.role?.trim();
  const permission = input.permission?.trim();
  if (input.capabilityMode !== "preview_only" || !userId || !role || !permission) return undefined;
  return {
    mode: "read_only_preview",
    capabilityMode: "preview_only",
    userId,
    role,
    permission,
    displayOnly: true,
    accessGranted: false,
    authorizationChanged: false,
    impersonation: false,
  };
}
