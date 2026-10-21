export type KinfloDashboardShellTab =
  | "tenants"
  | "sites"
  | "launch-readiness"
  | "factory"
  | "plans"
  | "brand"
  | "navigation"
  | "preview"
  | "site-studio"
  | "assets"
  | "domains"
  | "integrations"
  | "campaigns"
  | "content"
  | "templates"
  | "crm"
  | "experience"
  | "access";

export type KinfloDashboardWorkspaceKey =
  | "overview"
  | "website-configuration"
  | "personas-journeys"
  | "access"
  | "experiments"
  | "operations"
  | "communications"
  | "analytics"
  | "launch-governance";

export type KinfloDashboardWorkspaceStatus = "available" | "preview-only" | "blocked";

export type KinfloDashboardWorkspace = {
  key: KinfloDashboardWorkspaceKey;
  label: string;
  description: string;
  tab: KinfloDashboardShellTab;
  status: KinfloDashboardWorkspaceStatus;
  statusLabel: string;
  blockedReason?: string;
};

export const kinfloDashboardWorkspaces: readonly KinfloDashboardWorkspace[] = [
  {
    key: "overview",
    label: "Overview",
    description: "Scope health, readiness, and the next safe action.",
    tab: "tenants",
    status: "available",
    statusLabel: "Available",
  },
  {
    key: "website-configuration",
    label: "Website Configuration",
    description: "Configure brand, navigation, content, assets, and site previews.",
    tab: "site-studio",
    status: "available",
    statusLabel: "Available",
  },
  {
    key: "personas-journeys",
    label: "Personas and Journeys",
    description: "Review audience context and journey previews without changing defaults.",
    tab: "preview",
    status: "preview-only",
    statusLabel: "Preview only",
    blockedReason: "Live persona and journey rules are not activated in this shell phase.",
  },
  {
    key: "access",
    label: "Access",
    description: "Manage tenant/site membership posture and permission readiness.",
    tab: "access",
    status: "available",
    statusLabel: "Available",
  },
  {
    key: "experiments",
    label: "Experiments",
    description: "Inspect experiment readiness without activating a live allocation.",
    tab: "experience",
    status: "preview-only",
    statusLabel: "Preview only",
    blockedReason: "Live A/B allocation and persistence remain separately gated.",
  },
  {
    key: "operations",
    label: "Operations",
    description: "Review CRM and order-routing workspaces for this tenant/site.",
    tab: "crm",
    status: "preview-only",
    statusLabel: "Preview only",
    blockedReason: "Task routing and provider-backed operations are not activated here.",
  },
  {
    key: "communications",
    label: "Communications",
    description: "Inspect campaign and integration readiness without sending messages.",
    tab: "campaigns",
    status: "blocked",
    statusLabel: "Gated",
    blockedReason: "Email/SMS provider actions and sends are separately gated.",
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Review the analytics surface boundary before live metrics are connected.",
    tab: "experience",
    status: "blocked",
    statusLabel: "Gated",
    blockedReason: "Tenant-scoped event collection and live provider metrics are not active.",
  },
  {
    key: "launch-governance",
    label: "Launch and Governance",
    description: "Review launch readiness, domains, approvals, and release gates.",
    tab: "launch-readiness",
    status: "preview-only",
    statusLabel: "Preview only",
    blockedReason: "Publishing, domains, and live activation remain separately gated.",
  },
] as const;

export const kinfloDashboardWorkspaceGroups = [
  { key: "control", label: "Control", workspaceKeys: ["overview", "access"] },
  { key: "configure", label: "Configure", workspaceKeys: ["website-configuration", "personas-journeys", "experiments"] },
  { key: "operate", label: "Operate", workspaceKeys: ["operations", "communications", "analytics"] },
  { key: "launch", label: "Launch", workspaceKeys: ["launch-governance"] },
] as const;

export function resolveKinfloDashboardWorkspace(key: string | null | undefined) {
  return kinfloDashboardWorkspaces.find((workspace) => workspace.key === key) ?? kinfloDashboardWorkspaces[0];
}

export function buildKinfloDashboardWorkspaceHref(
  workspaceKey: KinfloDashboardWorkspaceKey,
  scope: { tenantSlug: string; siteKey: string },
) {
  const workspace = resolveKinfloDashboardWorkspace(workspaceKey);
  const params = new URLSearchParams({
    tab: workspace.tab,
    studioTenant: scope.tenantSlug,
    studioSite: scope.siteKey,
    workspace: workspace.key,
  });
  return `/admin/kinflo-os?${params.toString()}`;
}

export function isKinfloDashboardWorkspaceBlocked(workspace: KinfloDashboardWorkspace) {
  return workspace.status !== "available";
}
