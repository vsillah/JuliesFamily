import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  Boxes,
  CheckCircle2,
  CircleDashed,
  Command,
  CreditCard,
  Edit3,
  ExternalLink,
  Factory,
  FormInput,
  Globe2,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  MailPlus,
  FileText,
  MonitorSmartphone,
  Palette,
  Plus,
  Rocket,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  UserRoundCheck,
  UserRoundCog,
  Workflow,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getKinfloShellSnapshot,
  type ExperienceIconKey,
  type ShellLiveAdapterStatus,
  type KinfloShellStatus,
  type ShellAiReviewRecord,
  type ShellCampaignDraft,
  type ShellClientAdminHandoffMatrix,
  type ShellClientWebsiteAdminPermissionPreset,
  type ShellClientWebsiteLaunchPacket,
  type ShellClientWebsiteLaunchSimulation,
  type ShellClientWebsiteOnboardingReadiness,
  type ShellClientWebsiteLaunchDecisionPacket,
  type ShellClientWebsitePolishScorecard,
  type ShellClientWebsiteConfigurationApprovalMatrix,
  type ShellClientWebsiteConfigurationChangeSet,
  type ShellClientWebsiteConfigurationProfiles,
  type ShellClientWebsiteConfigurationReviewPacket,
  type ShellClientWebsiteSpinUpQueue,
  type ShellClientWebsiteStudioSite,
  type ShellClientWebsiteVisualQaBudget,
  type ShellClientWebsiteVisualQaEvidencePacket,
  type ShellDomainDraft,
  type ShellHostedActivationDecision,
  type ShellHostedActivationStepStatus,
  type ShellIntegrationDraft,
  type ShellLaunchReadinessSite,
  type ShellMetricIconKey,
} from "@/lib/kinfloShellData";

const metricIcons: Record<ShellMetricIconKey, typeof Boxes> = {
  tenants: Boxes,
  sites: Globe2,
  templates: Factory,
  leads: UserRoundCheck,
  launchGates: Rocket,
};

const experienceIcons: Record<ExperienceIconKey, typeof Palette> = {
  theme: Palette,
  navigation: LayoutDashboard,
  audience: Workflow,
  preview: MonitorSmartphone,
};

const notificationChannelOptions = [
  { key: "email", label: "Email" },
  { key: "in-app", label: "In app" },
  { key: "weekly-digest", label: "Weekly digest" },
];

const shellTabValues = [
  "tenants",
  "sites",
  "launch-readiness",
  "adapter-switch",
  "hosted-activation",
  "factory",
  "plans",
  "brand",
  "navigation",
  "preview",
  "site-studio",
  "assets",
  "domains",
  "integrations",
  "campaigns",
  "ai-review",
  "content",
  "templates",
  "crm",
  "experience",
  "access",
] as const;

type ShellTabValue = (typeof shellTabValues)[number];
const clientWebsiteStudioLaneValues = ["queue", "configuration", "handoff", "workbench"] as const;
type ClientWebsiteStudioLane = (typeof clientWebsiteStudioLaneValues)[number];
const clientWebsiteWorkbenchStageValues = ["sites", "preview", "launch"] as const;
type ClientWebsiteWorkbenchStage = (typeof clientWebsiteWorkbenchStageValues)[number];
const clientWebsiteLaunchDossierValues = ["provisioning", "packets", "qa", "decision"] as const;
type ClientWebsiteLaunchDossier = (typeof clientWebsiteLaunchDossierValues)[number];

const shellTabLabels: Record<ShellTabValue, string> = {
  tenants: "Tenants",
  sites: "Sites",
  "launch-readiness": "Launch",
  "adapter-switch": "Switch",
  "hosted-activation": "Activation",
  factory: "Factory",
  plans: "Plans",
  brand: "Brand",
  navigation: "Nav",
  preview: "Preview",
  "site-studio": "Studio",
  assets: "Assets",
  domains: "Domains",
  integrations: "Integrations",
  campaigns: "Campaigns",
  "ai-review": "AI Review",
  content: "Content",
  templates: "Templates",
  crm: "CRM",
  experience: "Experience",
  access: "Access",
};

const workflowNavigationLanes: {
  key: "control" | "build" | "launch" | "growth" | "evidence" | "hosted-activation";
  label: string;
  description: string;
  icon: typeof Boxes;
  tabs: ShellTabValue[];
  primaryTab: ShellTabValue;
  status: "ready" | "review" | "blocked";
  blockedLiveAction: string;
}[] = [
  {
    key: "control",
    label: "Control",
    description: "Tenants, plans, experience, and access",
    icon: Command,
    tabs: ["tenants", "sites", "plans", "experience", "access"],
    primaryTab: "tenants",
    status: "review",
    blockedLiveAction: "client sharing gated",
  },
  {
    key: "build",
    label: "Build",
    description: "Factory, studio, content, brand, navigation, assets, and templates",
    icon: Factory,
    tabs: ["factory", "site-studio", "content", "brand", "navigation", "assets", "templates"],
    primaryTab: "site-studio",
    status: "ready",
    blockedLiveAction: "live content save gated",
  },
  {
    key: "launch",
    label: "Launch",
    description: "Readiness, preview, domains, and handoff gates",
    icon: Rocket,
    tabs: ["launch-readiness", "preview", "domains"],
    primaryTab: "launch-readiness",
    status: "blocked",
    blockedLiveAction: "public publish gated",
  },
  {
    key: "growth",
    label: "Growth",
    description: "CRM, campaigns, integrations, and provider setup",
    icon: Workflow,
    tabs: ["crm", "campaigns", "integrations"],
    primaryTab: "crm",
    status: "blocked",
    blockedLiveAction: "provider writes gated",
  },
  {
    key: "evidence",
    label: "Evidence",
    description: "AI review, adapter switch, proof, and audit posture",
    icon: FileText,
    tabs: ["ai-review", "adapter-switch"],
    primaryTab: "ai-review",
    status: "review",
    blockedLiveAction: "generated API import gated",
  },
  {
    key: "hosted-activation",
    label: "Hosted Activation",
    description: "Convex ownership, codegen, smoke, and rollback gates",
    icon: KeyRound,
    tabs: ["hosted-activation"],
    primaryTab: "hosted-activation",
    status: "blocked",
    blockedLiveAction: "hosted deployment gated",
  },
];

const workflowNavigationTabCoverage = workflowNavigationLanes.flatMap((lane) => lane.tabs);

const clientHandoffPermissionStripTestIds = {
  root: "section-kinflo-client-handoff-permission-strip",
  see: "section-kinflo-client-handoff-permission-strip-see",
  edit: "section-kinflo-client-handoff-permission-strip-edit",
  publish: "section-kinflo-client-handoff-permission-strip-publish",
  blockedInvite: "section-kinflo-client-handoff-permission-strip-blocked-invite",
  missingArtifact: "section-kinflo-client-handoff-permission-strip-missing-artifact",
  gatedAction: "section-kinflo-client-handoff-permission-strip-gated-action",
} as const;

const clientAdminHandoffMatrixTestIds = {
  root: "section-kinflo-client-admin-handoff-matrix",
  summary: "section-kinflo-client-admin-handoff-matrix-summary",
  table: "section-kinflo-client-admin-handoff-matrix-table",
  blocked: "section-kinflo-client-admin-handoff-matrix-blocked",
  gatedAction: "button-client-admin-handoff-matrix-gated",
} as const;

const clientHandoffWorkspaceTestIds = {
  root: "tabs-kinflo-client-handoff-workspace",
  selected: "section-kinflo-client-handoff-workspace-selected",
  matrix: "section-kinflo-client-handoff-workspace-matrix",
} as const;

const clientWebsiteSpinUpQueueTestIds = {
  root: "section-kinflo-client-website-spin-up-queue",
  summary: "section-kinflo-client-website-spin-up-summary",
  scroll: "section-kinflo-client-website-spin-up-scroll",
  gatedAction: "button-client-website-spin-up-gated",
} as const;

const clientWebsiteConfigurationProfileTestIds = {
  root: "section-kinflo-client-website-configuration-profiles",
  summary: "section-kinflo-client-website-configuration-summary",
  scroll: "section-kinflo-client-website-configuration-scroll",
  gatedAction: "button-client-website-configuration-gated",
} as const;

const hostedActivationOwnerChecklistTestIds = {
  root: "section-kinflo-hosted-activation-owner-checklist",
  summary: "section-kinflo-hosted-activation-owner-checklist-summary",
  scroll: "section-kinflo-hosted-activation-owner-checklist-scroll",
  nextGate: "text-hosted-activation-owner-checklist-next-gate",
  gatedAction: "button-hosted-activation-owner-checklist-gated",
} as const;

function readInitialShellTab(): ShellTabValue {
  if (typeof window === "undefined") {
    return "tenants";
  }
  const tab = new URLSearchParams(window.location.search).get("tab");
  return shellTabValues.includes(tab as ShellTabValue) ? (tab as ShellTabValue) : "tenants";
}

function readInitialClientWebsiteStudioLane(): ClientWebsiteStudioLane {
  if (typeof window === "undefined") {
    return "workbench";
  }
  const lane = new URLSearchParams(window.location.search).get("studioLane");
  return clientWebsiteStudioLaneValues.includes(lane as ClientWebsiteStudioLane)
    ? (lane as ClientWebsiteStudioLane)
    : "workbench";
}

function readInitialClientWebsiteStudioSiteKey(defaultSiteKey: string, siteKeys: string[]): string {
  if (typeof window === "undefined") {
    return defaultSiteKey;
  }
  const siteKey = new URLSearchParams(window.location.search).get("studioSite");
  return siteKey && siteKeys.includes(siteKey) ? siteKey : defaultSiteKey;
}

function readInitialClientWebsiteWorkbenchStage(): ClientWebsiteWorkbenchStage {
  if (typeof window === "undefined") {
    return "preview";
  }
  const stage = new URLSearchParams(window.location.search).get("studioStage");
  return clientWebsiteWorkbenchStageValues.includes(stage as ClientWebsiteWorkbenchStage)
    ? (stage as ClientWebsiteWorkbenchStage)
    : "preview";
}

function readInitialClientWebsiteLaunchDossier(): ClientWebsiteLaunchDossier {
  if (typeof window === "undefined") {
    return "provisioning";
  }
  const dossier = new URLSearchParams(window.location.search).get("studioDossier");
  return clientWebsiteLaunchDossierValues.includes(dossier as ClientWebsiteLaunchDossier)
    ? (dossier as ClientWebsiteLaunchDossier)
    : "provisioning";
}

function buildClientWebsiteStudioPreviewHref({
  previewPath,
  siteKey,
  route,
  persona,
  journeyStage,
  device,
}: {
  previewPath: string;
  siteKey?: string;
  route?: string;
  persona?: string;
  journeyStage?: string;
  device: "desktop" | "tablet" | "mobile";
}) {
  const params = new URLSearchParams();
  params.set("route", route?.trim() || "/");
  params.set("device", device);
  params.set("source", "site-studio-preview");
  if (siteKey?.trim()) {
    params.set("studioSite", siteKey);
  }
  if (persona?.trim()) {
    params.set("persona", persona);
  }
  if (journeyStage?.trim()) {
    params.set("journeyStage", journeyStage);
  }
  return `${previewPath}?${params.toString()}`;
}

function readInitialHostedActivationStepId(defaultStepId: string, stepIds: string[]): string {
  if (typeof window === "undefined") {
    return defaultStepId;
  }
  const stepId = new URLSearchParams(window.location.search).get("activationStep");
  return stepId && stepIds.includes(stepId) ? stepId : defaultStepId;
}

function readInitialHostedSmokeEvidenceBatchId(defaultBatchId: string, batchIds: string[]): string {
  if (typeof window === "undefined") {
    return defaultBatchId;
  }
  const batchId = new URLSearchParams(window.location.search).get("smokeEvidence");
  return batchId && batchIds.includes(batchId) ? batchId : defaultBatchId;
}

function readInitialAdapterSwitchBatchId(defaultBatchId: string, batchIds: string[]): string {
  if (typeof window === "undefined") {
    return defaultBatchId;
  }
  const batchId = new URLSearchParams(window.location.search).get("adapterBatch");
  return batchId && batchIds.includes(batchId) ? batchId : defaultBatchId;
}

function readInitialAdapterSwitchSurfaceId(defaultSurfaceId: string, surfaceIds: string[]): string {
  if (typeof window === "undefined") {
    return defaultSurfaceId;
  }
  const surfaceId = new URLSearchParams(window.location.search).get("adapterSurface");
  return surfaceId && surfaceIds.includes(surfaceId) ? surfaceId : defaultSurfaceId;
}

function statusBadge(status: KinfloShellStatus) {
  if (status === "active" || status === "published" || status === "done") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ready</Badge>;
  }
  if (status === "preview") {
    return <Badge className="bg-sky-600 hover:bg-sky-600">Preview</Badge>;
  }
  if (status === "converted") {
    return <Badge className="bg-teal-600 hover:bg-teal-600">Converted</Badge>;
  }
  if (status === "nurture") {
    return <Badge className="bg-amber-600 hover:bg-amber-600">Nurture</Badge>;
  }
  return <Badge variant="outline">Draft</Badge>;
}

function liveAdapterStatusBadge(status: ShellLiveAdapterStatus) {
  if (status === "live_smoke_pending") {
    return <Badge className="bg-amber-600 hover:bg-amber-600">Smoke pending</Badge>;
  }
  if (status === "generated_api_pending") {
    return <Badge variant="secondary">Codegen pending</Badge>;
  }
  return <Badge variant="outline">Fixture fallback</Badge>;
}

function launchReadinessStatusBadge(status: ShellLaunchReadinessSite["stages"][number]["status"]) {
  if (status === "ready") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ready</Badge>;
  }
  if (status === "blocked") {
    return <Badge variant="destructive">Blocked</Badge>;
  }
  return <Badge variant="outline">Pending</Badge>;
}

function hostedActivationStatusBadge(status: ShellHostedActivationStepStatus) {
  if (status === "ready_after_approval") {
    return <Badge className="bg-sky-600 hover:bg-sky-600">Ready after approval</Badge>;
  }
  if (status === "blocked_provider_gate") {
    return <Badge variant="destructive">Provider gate</Badge>;
  }
  return <Badge variant="outline">Pending approval</Badge>;
}

function HostedActivationOwnerChecklist({
  decisions,
  nextHumanGate,
  providerBoundary,
  testIds,
}: {
  decisions: ShellHostedActivationDecision[];
  nextHumanGate: string;
  providerBoundary: string;
  testIds: typeof hostedActivationOwnerChecklistTestIds;
}) {
  const pendingOwnerDecisions = decisions.filter((decision) => decision.status === "pending_owner_decision").length;
  const blockedUntilPriorGate = decisions.filter((decision) => decision.status === "blocked_until_prior_gate").length;
  const readyToRecord = decisions.filter((decision) => decision.status === "ready_to_record").length;
  const nextDecision = decisions.find((decision) => decision.status === "pending_owner_decision")
    ?? decisions.find((decision) => decision.status === "blocked_until_prior_gate")
    ?? decisions[0];
  const summaryItems = [
    { label: "Decisions", value: decisions.length },
    { label: "Owner", value: pendingOwnerDecisions },
    { label: "Prior gate", value: blockedUntilPriorGate },
    { label: "Ready", value: readyToRecord },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" data-testid={testIds.root}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-300 bg-slate-50">
              Owner gate
            </Badge>
            <Badge className="bg-slate-950 hover:bg-slate-950">prepare only</Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">Hosted activation owner checklist</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600" data-testid={testIds.nextGate}>
            {nextHumanGate}
          </p>
        </div>
        <Button disabled variant="outline" data-testid={testIds.gatedAction}>
          <KeyRound className="mr-2 h-4 w-4" />
          Approval capture gated
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4" data-testid={testIds.summary}>
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.38fr)]">
        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1" data-testid={testIds.scroll}>
          {decisions.map((decision) => (
            <div key={decision.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3" data-testid={`card-hosted-activation-owner-checklist-${decision.id}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-950">{decision.label}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {decision.owner} · before {decision.requiredBefore}
                  </div>
                </div>
                <Badge variant={decision.status === "pending_owner_decision" ? "secondary" : "outline"} className="self-start whitespace-nowrap">
                  {decision.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600">{decision.decisionNeeded}</p>
              <div className="mt-3 rounded-lg border border-white bg-white p-2 text-xs leading-5 text-slate-600">
                <span className="font-medium text-slate-900">Evidence: </span>
                {decision.evidenceTarget}
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-[11px] font-medium uppercase tracking-normal text-amber-700">Next owner action</div>
          <div className="mt-2 text-sm font-semibold text-amber-950">{nextDecision?.label ?? "Owner decision pending"}</div>
          <p className="mt-2 text-xs leading-5 text-amber-900">
            {nextDecision?.blockedUntil ?? "Owner approval is required before hosted activation can move forward."}
          </p>
          <div className="mt-3 rounded-lg border border-amber-200 bg-white/70 p-2 text-xs leading-5 text-amber-900">
            {providerBoundary}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ConfigurationAffordanceStrip({
  surface,
  objectLabel,
  stateLabel,
  provenanceNotes,
  activationEvidence,
  blockedLiveAction,
  disabledActionLabel,
  readinessPercent,
  testId,
}: {
  surface: string;
  objectLabel: string;
  stateLabel: string;
  provenanceNotes: string[];
  activationEvidence: string[];
  blockedLiveAction: string;
  disabledActionLabel: string;
  readinessPercent: number;
  testId: string;
}) {
  return (
    <section
      className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)_minmax(220px,0.9fr)]"
      data-testid={testId}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-slate-300 bg-white">
            Field affordance
          </Badge>
          <Badge className="bg-slate-950 hover:bg-slate-950">{stateLabel}</Badge>
        </div>
        <div className="mt-3 font-semibold text-slate-950">{surface}</div>
        <p className="mt-1 break-words text-xs leading-5 text-slate-600">{objectLabel}</p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">Activation evidence</span>
            <span className="text-slate-500">{readinessPercent}%</span>
          </div>
          <Progress value={readinessPercent} className="mt-2 h-1.5" />
        </div>
      </div>

      <div className="min-w-0 rounded-lg border border-white bg-white p-3">
        <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">Provenance notes</div>
        <div className="mt-3 space-y-2">
          {provenanceNotes.slice(0, 3).map((note) => (
            <div key={note} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
              <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="min-w-0 break-words">{note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="text-[11px] font-medium uppercase tracking-normal text-amber-700">Hosted gate</div>
        <div className="mt-3 space-y-2">
          {activationEvidence.slice(0, 2).map((item) => (
            <div key={item} className="flex items-start gap-2 text-xs leading-5 text-amber-900">
              <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="min-w-0 break-words">{item}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-amber-900">{blockedLiveAction}</p>
        <Button disabled variant="outline" size="sm" className="mt-3 w-full justify-start bg-white" data-testid={`${testId}-blocked-action`}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          {disabledActionLabel}
        </Button>
      </div>
    </section>
  );
}

function ClientHandoffPermissionStrip({
  site,
  permissionPreset,
  launchPacket,
  onboardingReadiness,
  launchSimulation,
  testId,
}: {
  site?: ShellClientWebsiteStudioSite;
  permissionPreset?: ShellClientWebsiteAdminPermissionPreset;
  launchPacket?: ShellClientWebsiteLaunchPacket;
  onboardingReadiness?: ShellClientWebsiteOnboardingReadiness;
  launchSimulation?: ShellClientWebsiteLaunchSimulation;
  testId: string;
}) {
  const permissionSet = permissionPreset?.permissionSet ?? [];
  const canSee = permissionSet.filter((permission) => permission.endsWith(":view") || permission === "audit:view");
  const canEdit = permissionSet.filter((permission) => permission.includes(":edit") || permission.includes(":manage") || permission.includes(":create"));
  const canPublish = permissionSet.filter((permission) => permission.includes(":publish"));
  const blockedInvite = permissionPreset?.blockedActions.find((action) => action.includes("invitation") || action.includes("membership"))
    ?? "client admin invite";
  const missingHandoffArtifact = onboardingReadiness && onboardingReadiness.openTasks > 0
    ? `${onboardingReadiness.openTasks} onboarding task${onboardingReadiness.openTasks === 1 ? "" : "s"} still open`
    : launchPacket?.handoffChecklist.find((item) => item.toLowerCase().includes("privacy") || item.toLowerCase().includes("approval"))
      ?? "client handoff approval";

  const permissionColumns = [
    {
      key: "see",
      label: "Who can see",
      value: canSee.length > 0 ? canSee.join(", ") : "site:view pending",
      testId: `${testId}-see`,
    },
    {
      key: "edit",
      label: "Who can edit",
      value: canEdit.length > 0 ? canEdit.join(", ") : "content:edit pending",
      testId: `${testId}-edit`,
    },
    {
      key: "publish",
      label: "Who can publish",
      value: canPublish.length > 0 ? canPublish.join(", ") : "content:publish gated",
      testId: `${testId}-publish`,
    },
  ];

  return (
    <section
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.8fr)]"
      data-testid={testId}
    >
      <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-slate-300 bg-white">
                Permission strip
              </Badge>
              <Badge className="bg-slate-950 hover:bg-slate-950">{permissionPreset?.scope ?? "site"} scope</Badge>
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-950">Client handoff permission strip</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {site?.label ?? "No site selected"} uses {permissionPreset?.label ?? "a pending permission preset"} before any invite or membership write is enabled.
            </p>
          </div>
          <Badge variant="outline" className="self-start border-amber-300 bg-amber-50 text-amber-800">
            Handoff gated
          </Badge>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {permissionColumns.map((column) => (
            <div key={column.key} className="min-w-0 rounded-lg border border-white bg-white p-3" data-testid={column.testId}>
              <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">{column.label}</div>
              <div className="mt-1 break-words text-sm font-semibold text-slate-950">{column.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3" data-testid={`${testId}-blocked-invite`}>
            <div className="text-[11px] font-medium uppercase tracking-normal text-amber-700">Blocked invite</div>
            <div className="mt-1 text-sm font-semibold text-amber-950">{blockedInvite}</div>
            <p className="mt-2 text-xs leading-5 text-amber-900">
              Invite delivery and membership grants stay disabled until hosted auth, role sync, and client handoff approval are accepted.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3" data-testid={`${testId}-missing-artifact`}>
            <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">Missing handoff artifact</div>
            <div className="mt-1 text-sm font-semibold text-slate-950">{missingHandoffArtifact}</div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Launch packet: {launchPacket?.label ?? "pending"} · Simulation: {launchSimulation?.label ?? "pending"}
            </p>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-xl border border-slate-900 bg-slate-950 p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-normal text-slate-400">Onboarding readiness</div>
            <div className="mt-1 text-2xl font-semibold">{onboardingReadiness?.readinessScore ?? 0}%</div>
          </div>
          <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
            {onboardingReadiness?.completedTasks ?? 0}/{onboardingReadiness?.totalTasks ?? 0} complete
          </Badge>
        </div>
        <Progress value={onboardingReadiness?.readinessScore ?? 0} className="mt-4 h-1.5 bg-white/10" />
        <div className="mt-4 space-y-2">
          {(onboardingReadiness?.criticalBlockers ?? permissionPreset?.approvalGates ?? []).slice(0, 3).map((item) => (
            <div key={item} className="flex items-start gap-2 text-xs leading-5 text-slate-300">
              <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <Button disabled variant="secondary" className="mt-4 w-full justify-start" data-testid={`${testId}-gated-action`}>
          <UserRoundCog className="mr-2 h-4 w-4" />
          Client handoff invite gated
        </Button>
      </div>
    </section>
  );
}

function ClientAdminHandoffMatrix({
  matrix,
  testIds,
}: {
  matrix: ShellClientAdminHandoffMatrix;
  testIds: typeof clientAdminHandoffMatrixTestIds;
}) {
  const summaryItems = [
    { label: "Sites", value: matrix.totalSites },
    { label: "Platform", value: matrix.platformScoped },
    { label: "Tenant", value: matrix.tenantScoped },
    { label: "Site", value: matrix.siteScoped },
    { label: "Ready", value: matrix.readyForInvite },
    { label: "Blocked", value: matrix.blockedInvites },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" data-testid={testIds.root}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-300 bg-slate-50">
              Admin handoff matrix
            </Badge>
            <Badge className="bg-slate-950 hover:bg-slate-950">{matrix.status.replaceAll("_", " ")}</Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">Client admin handoff matrix</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Super-admin review across all client websites before any invitation, membership grant, provider write, or live permission mutation is enabled.
          </p>
        </div>
        <Button disabled variant="outline" data-testid={testIds.gatedAction}>
          <UserRoundCog className="mr-2 h-4 w-4" />
          Admin handoff gated
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-6" data-testid={testIds.summary}>
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 max-h-[360px] overflow-y-auto rounded-xl border border-slate-200" data-testid={testIds.table}>
        <Table>
          <TableHeader className="sticky top-0 bg-white">
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Invite</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Gate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.rows.map((row) => (
              <TableRow key={row.siteKey}>
                <TableCell className="min-w-[180px]">
                  <div className="font-medium text-slate-950">{row.label}</div>
                  <div className="text-xs text-slate-500">{row.tenantSlug}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50">{row.scope}</Badge>
                </TableCell>
                <TableCell className="text-sm">{row.ownerRole}</TableCell>
                <TableCell className="text-sm">{row.inviteRole}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "see", value: row.viewPermissions.length },
                      { label: "edit", value: row.editPermissions.length },
                      { label: "publish", value: row.publishPermissions.length },
                    ].map((item) => (
                      <Badge key={item.label} variant="secondary" className="text-[10px]">
                        {item.label}: {item.value}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="min-w-[220px]">
                  <div className="text-sm font-medium text-slate-950">{row.approvalGate}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{row.missingArtifact}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.35fr)]">
        <div className="max-h-[220px] overflow-y-auto rounded-xl border border-amber-200 bg-amber-50 p-3" data-testid={testIds.blocked}>
          <div className="text-sm font-semibold text-amber-950">Blocked handoff actions</div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {matrix.rows.map((row) => (
              <div key={row.siteKey} className="rounded-lg border border-amber-200 bg-white/70 p-2 text-xs leading-5 text-amber-900">
                <div className="font-semibold">{row.blockedInviteAction}</div>
                <div>{row.nextHumanGate}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          {matrix.providerBoundary}
        </p>
      </div>
    </section>
  );
}

function ClientWebsiteSpinUpQueue({
  queue,
  testIds,
}: {
  queue: ShellClientWebsiteSpinUpQueue;
  testIds: typeof clientWebsiteSpinUpQueueTestIds;
}) {
  const summaryItems = [
    { label: "Requests", value: queue.totalRequests },
    { label: "Ready", value: queue.readyRequests },
    { label: "Blocked", value: queue.blockedRequests },
    { label: "Steps", value: queue.totalSteps },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" data-testid={testIds.root}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-300 bg-slate-50">
              Super-admin queue
            </Badge>
            <Badge className="bg-slate-950 hover:bg-slate-950">{queue.status.replaceAll("_", " ")}</Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">Website spin-up queue</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Ordered client website requests for tenant, template, admin preset, invite, and publish review before any live mutation or provider action can run.
          </p>
        </div>
        <Button disabled variant="outline" data-testid={testIds.gatedAction}>
          <Factory className="mr-2 h-4 w-4" />
          Website spin-up gated
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4" data-testid={testIds.summary}>
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 max-h-[440px] space-y-3 overflow-y-auto overflow-x-hidden pr-1" data-testid={testIds.scroll}>
        {queue.requests.map((request) => (
          <article
            key={request.siteKey}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            data-testid={`card-client-website-spin-up-${request.siteKey}`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{request.priority}</Badge>
                  <Badge variant="outline" className="bg-white">{request.queueStatus.replaceAll("_", " ")}</Badge>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-950">{request.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  {request.tenantSlug} · {request.templateKey} · {request.adminPresetLabel}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs lg:w-[300px]">
                {[
                  { label: "Owner", value: request.ownerRole },
                  { label: "Invite", value: request.inviteRole },
                  { label: "Steps", value: request.stepCount },
                ].map((item) => (
                  <div key={item.label} className="min-w-0 rounded-lg border border-slate-200 bg-white p-2">
                    <div className="text-[10px] uppercase tracking-normal text-slate-500">{item.label}</div>
                    <div className="mt-1 truncate font-semibold text-slate-950" title={String(item.value)}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.38fr)]">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">Spin-up sequence</div>
                  <Badge variant="outline" className="bg-white">Live writes off</Badge>
                </div>
                <div className="mt-3 max-h-[190px] space-y-2 overflow-y-auto pr-1">
                  {request.steps.map((step) => (
                    <div key={`${request.siteKey}-${step.order}`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-semibold text-slate-500">
                        {step.order}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800">{step.label}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="bg-white text-[10px]">{step.mode}</Badge>
                          <span className="text-slate-500">{step.blockedLiveAction}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="text-[11px] font-medium uppercase tracking-normal text-amber-700">Next gate</div>
                  <p className="mt-1 text-xs leading-5 text-amber-900">{request.nextGate}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Tenant", request.canCreateTenant],
                    ["Site", request.canCreateSite],
                    ["Invite", request.canInviteAdmin],
                    ["Publish", request.canPublish],
                    ["Provider", request.providerWrites],
                    ["Convex", request.liveConvexExecution],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-2 text-xs">
                      <div className="text-[10px] uppercase tracking-normal text-slate-500">{label}</div>
                      <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-700">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                        {value ? "on" : "off"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex max-h-[92px] flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                  {request.convexFunctions.map((functionName) => (
                    <Badge key={functionName} variant="outline" className="max-w-full whitespace-normal break-all text-left text-[10px]">
                      {functionName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        {queue.providerBoundary}
      </p>
    </section>
  );
}

function ClientWebsiteConfigurationProfiles({
  profiles,
  selectedReviewPacket,
  selectedChangeSet,
  selectedApprovalMatrix,
  testIds,
}: {
  profiles: ShellClientWebsiteConfigurationProfiles;
  selectedReviewPacket?: ShellClientWebsiteConfigurationReviewPacket;
  selectedChangeSet?: ShellClientWebsiteConfigurationChangeSet;
  selectedApprovalMatrix?: ShellClientWebsiteConfigurationApprovalMatrix;
  testIds: typeof clientWebsiteConfigurationProfileTestIds;
}) {
  const summaryItems = [
    { label: "Profiles", value: profiles.totalProfiles },
    { label: "Ready", value: profiles.readyProfiles },
    { label: "Blocked", value: profiles.blockedProfiles },
    { label: "Writes", value: "0" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" data-testid={testIds.root}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-300 bg-slate-50">
              Configuration profiles
            </Badge>
            <Badge className="bg-slate-950 hover:bg-slate-950">{profiles.status.replaceAll("_", " ")}</Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">Client site configuration profiles</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Compare each site's template, brand, navigation, starter content, admin preset, CRM pipeline, and locked surfaces before any live save or publish action is enabled.
          </p>
        </div>
        <Button disabled variant="outline" data-testid={testIds.gatedAction}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Configuration save gated
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4" data-testid={testIds.summary}>
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">{item.value}</div>
          </div>
        ))}
      </div>

      {selectedReviewPacket ? (
        <div
          className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"
          data-testid="section-kinflo-client-configuration-review-packet"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selectedReviewPacket.reviewPosture.replaceAll("_", " ")}</Badge>
                <Badge variant="outline" className="bg-white">{selectedReviewPacket.selectedProfileStatus.replaceAll("_", " ")}</Badge>
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-950">{selectedReviewPacket.label}</div>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Selected-site configuration review keeps editable surfaces, locked surfaces, save blockers, and required evidence visible without enabling live saves.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs lg:w-[320px]">
              {[
                { label: "Editable", value: selectedReviewPacket.editableSurfaceCount },
                { label: "Locked", value: selectedReviewPacket.lockedSurfaceCount },
                { label: "Blockers", value: selectedReviewPacket.saveBlockerCount },
                { label: "Evidence", value: selectedReviewPacket.requiredEvidenceCount },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="text-[10px] uppercase tracking-normal text-slate-500">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)]">
            <div
              className="grid max-h-[230px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2"
              data-testid="section-kinflo-client-configuration-review-surfaces"
            >
              {selectedReviewPacket.surfaces.map((surface) => (
                <div key={surface.key} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-950">{surface.label}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-normal text-slate-500">{surface.kind}</div>
                    </div>
                    <Badge variant={surface.status === "reviewable" ? "secondary" : "outline"} className="shrink-0">
                      {surface.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{surface.evidence}</p>
                </div>
              ))}
            </div>

            <Tabs defaultValue="blockers" className="min-w-0" data-testid="tabs-kinflo-client-configuration-review-detail">
              <TabsList className="grid h-auto w-full grid-cols-3 bg-white p-1">
                <TabsTrigger value="blockers" className="px-1 text-[11px]" data-testid="tab-kinflo-client-configuration-blockers">Blockers</TabsTrigger>
                <TabsTrigger value="evidence" className="px-1 text-[11px]" data-testid="tab-kinflo-client-configuration-evidence">Evidence</TabsTrigger>
                <TabsTrigger value="functions" className="px-1 text-[11px]" data-testid="tab-kinflo-client-configuration-functions">Functions</TabsTrigger>
              </TabsList>

              <TabsContent value="blockers" className="mt-2" data-testid="section-kinflo-client-configuration-save-blockers">
                <div className="max-h-[170px] space-y-2 overflow-y-auto pr-1">
                  {selectedReviewPacket.saveBlockers.map((blocker) => (
                    <div key={blocker} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-900">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{blocker}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="evidence" className="mt-2" data-testid="section-kinflo-client-configuration-required-evidence">
                <div className="max-h-[170px] space-y-2 overflow-y-auto pr-1">
                  {selectedReviewPacket.requiredEvidence.map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-xs leading-5 text-emerald-800">
                      <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="functions" className="mt-2" data-testid="section-kinflo-client-configuration-functions">
                <div className="flex max-h-[170px] flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {selectedReviewPacket.convexFunctions.map((functionName) => (
                    <Badge key={functionName} variant="outline" className="max-w-full whitespace-normal break-all text-left text-[10px]">
                      {functionName}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_220px]">
            <p className="rounded-lg border border-amber-200 bg-white p-3 text-xs leading-5 text-amber-900">
              {selectedReviewPacket.nextGate}
            </p>
            <Button disabled variant="outline" className="justify-start bg-white" data-testid="button-client-configuration-review-gated">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Save still gated
            </Button>
          </div>
        </div>
      ) : null}

      {selectedChangeSet ? (
        <div
          className="mt-4 rounded-xl border border-slate-200 bg-white p-3"
          data-testid="section-kinflo-client-configuration-change-set"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-slate-50">{selectedChangeSet.changeSetStatus.replaceAll("_", " ")}</Badge>
                <Badge className="bg-slate-950 hover:bg-slate-950">local draft only</Badge>
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-950">{selectedChangeSet.label}</div>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Proposed configuration changes are reviewable here, but the actual save remains blocked until ownership, hosted smoke, and provider boundaries are approved.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs lg:w-[360px]">
              {[
                { label: "Draft", value: selectedChangeSet.draftChangeCount },
                { label: "Locked", value: selectedChangeSet.lockedChangeCount },
                { label: "Evidence", value: selectedChangeSet.approvalEvidenceCount },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="text-[10px] uppercase tracking-normal text-slate-500">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)]">
            <div className="grid max-h-[210px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2" data-testid="section-kinflo-client-configuration-change-set-draft">
              {selectedChangeSet.changeGroups.map((group) => (
                <div key={group.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-950">{group.label}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-normal text-slate-500">{group.surface}</div>
                    </div>
                    <Badge variant={group.status === "draft_review" ? "secondary" : "outline"} className="shrink-0">
                      {group.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-700">{group.proposedChange}</p>
                  <p className="mt-2 rounded-md border border-slate-200 bg-white p-2 text-[11px] leading-4 text-slate-500">{group.impact}</p>
                </div>
              ))}
            </div>

            <Tabs defaultValue="blockers" className="min-w-0" data-testid="tabs-kinflo-client-configuration-change-set-detail">
              <TabsList className="grid h-auto w-full grid-cols-3 bg-slate-100 p-1">
                <TabsTrigger value="blockers" className="px-1 text-[11px]" data-testid="tab-kinflo-client-configuration-change-blockers">Blockers</TabsTrigger>
                <TabsTrigger value="evidence" className="px-1 text-[11px]" data-testid="tab-kinflo-client-configuration-change-evidence">Evidence</TabsTrigger>
                <TabsTrigger value="functions" className="px-1 text-[11px]" data-testid="tab-kinflo-client-configuration-change-functions">Functions</TabsTrigger>
              </TabsList>

              <TabsContent value="blockers" className="mt-2" data-testid="section-kinflo-client-configuration-change-blockers">
                <div className="max-h-[150px] space-y-2 overflow-y-auto pr-1">
                  {selectedChangeSet.saveBlockers.map((blocker) => (
                    <div key={blocker} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-900">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{blocker}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="evidence" className="mt-2" data-testid="section-kinflo-client-configuration-change-evidence">
                <div className="max-h-[150px] space-y-2 overflow-y-auto pr-1">
                  {selectedChangeSet.approvalEvidence.map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-xs leading-5 text-emerald-800">
                      <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="functions" className="mt-2" data-testid="section-kinflo-client-configuration-change-functions">
                <div className="flex max-h-[150px] flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {selectedChangeSet.convexFunctions.map((functionName) => (
                    <Badge key={functionName} variant="outline" className="max-w-full whitespace-normal break-all text-left text-[10px]">
                      {functionName}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_220px]">
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              {selectedChangeSet.nextGate}
            </p>
            <Button disabled variant="outline" className="justify-start" data-testid="button-client-configuration-change-set-gated">
              <Save className="mr-2 h-4 w-4" />
              Draft save gated
            </Button>
          </div>
        </div>
      ) : null}

      {selectedApprovalMatrix ? (
        <div
          className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"
          data-testid="section-kinflo-client-configuration-approval-matrix"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selectedApprovalMatrix.approvalPosture.replaceAll("_", " ")}</Badge>
                <Badge variant="outline" className="bg-white">capture gated</Badge>
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-950">{selectedApprovalMatrix.label}</div>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Configuration approvals are mapped by role and evidence requirement, but approval capture, saves, invitations, provider writes, and hosted Convex execution remain blocked.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs lg:w-[360px]">
              {[
                { label: "Required", value: selectedApprovalMatrix.requiredApprovalCount },
                { label: "Accepted", value: selectedApprovalMatrix.acceptedApprovalCount },
                { label: "Blocked", value: selectedApprovalMatrix.blockedApprovalCount },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="text-[10px] uppercase tracking-normal text-slate-500">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)]">
            <div className="grid max-h-[210px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2" data-testid="section-kinflo-client-configuration-approval-rows">
              {selectedApprovalMatrix.approvalRows.map((row) => (
                <div key={row.key} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-950">{row.role}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-normal text-slate-500">{row.requiredEvidence}</div>
                    </div>
                    <Badge variant={row.status === "ready_for_review" ? "secondary" : "outline"} className="shrink-0">
                      {row.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{row.responsibility}</p>
                </div>
              ))}
            </div>

            <Tabs defaultValue="blockers" className="min-w-0" data-testid="tabs-kinflo-client-configuration-approval-detail">
              <TabsList className="grid h-auto w-full grid-cols-3 bg-white p-1">
                <TabsTrigger value="blockers" className="px-1 text-[11px]" data-testid="tab-kinflo-client-configuration-approval-blockers">Blockers</TabsTrigger>
                <TabsTrigger value="evidence" className="px-1 text-[11px]" data-testid="tab-kinflo-client-configuration-approval-evidence">Evidence</TabsTrigger>
                <TabsTrigger value="functions" className="px-1 text-[11px]" data-testid="tab-kinflo-client-configuration-approval-functions">Functions</TabsTrigger>
              </TabsList>

              <TabsContent value="blockers" className="mt-2" data-testid="section-kinflo-client-configuration-approval-blockers">
                <div className="max-h-[150px] space-y-2 overflow-y-auto pr-1">
                  {selectedApprovalMatrix.saveBlockers.map((blocker) => (
                    <div key={blocker} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-900">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{blocker}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="evidence" className="mt-2" data-testid="section-kinflo-client-configuration-approval-evidence">
                <div className="max-h-[150px] space-y-2 overflow-y-auto pr-1">
                  {selectedApprovalMatrix.approvalEvidence.map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-xs leading-5 text-emerald-800">
                      <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="functions" className="mt-2" data-testid="section-kinflo-client-configuration-approval-functions">
                <div className="flex max-h-[150px] flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {selectedApprovalMatrix.convexFunctions.map((functionName) => (
                    <Badge key={functionName} variant="outline" className="max-w-full whitespace-normal break-all text-left text-[10px]">
                      {functionName}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_220px]">
            <p className="rounded-lg border border-amber-200 bg-white p-3 text-xs leading-5 text-amber-900">
              {selectedApprovalMatrix.nextGate}
            </p>
            <Button disabled variant="outline" className="justify-start bg-white" data-testid="button-client-configuration-approval-gated">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Approval capture gated
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 max-h-[260px] space-y-3 overflow-y-auto overflow-x-hidden pr-1" data-testid={testIds.scroll}>
        {profiles.profiles.map((profile) => (
          <article
            key={profile.siteKey}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            data-testid={`card-client-website-configuration-${profile.siteKey}`}
          >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{profile.requestedPlan}</Badge>
                  <Badge variant="outline" className="bg-white">{profile.configurationStatus.replaceAll("_", " ")}</Badge>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-950">{profile.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  {profile.tenantSlug} · {profile.templateKey} · {profile.adminPresetLabel}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 xl:w-[520px]">
                {[
                  { label: "Brand", value: profile.brandProfile },
                  { label: "Navigation", value: profile.navigationProfile },
                  { label: "Content", value: profile.contentPack },
                  { label: "CRM", value: profile.crmPipeline },
                ].map((item) => (
                  <div key={`${profile.siteKey}-${item.label}`} className="min-w-0 rounded-lg border border-slate-200 bg-white p-2">
                    <div className="text-[10px] uppercase tracking-normal text-slate-500">{item.label}</div>
                    <div className="mt-1 truncate font-semibold text-slate-950" title={item.value}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.38fr)]">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">Editable review surfaces</div>
                  <div className="mt-3 flex max-h-[96px] flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {profile.editableSurfaces.map((surface) => (
                      <Badge key={surface} variant="outline" className="bg-slate-50 text-[10px]">{surface}</Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="text-[11px] font-medium uppercase tracking-normal text-amber-700">Locked live surfaces</div>
                  <div className="mt-3 flex max-h-[96px] flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {profile.lockedSurfaces.map((surface) => (
                      <Badge key={surface} variant="outline" className="border-amber-200 bg-white text-amber-900 text-[10px]">{surface}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-amber-200 bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-normal text-amber-700">Next gate</div>
                  <p className="mt-1 text-xs leading-5 text-amber-900">{profile.nextGate}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Save", profile.canSaveConfig],
                    ["Publish", profile.canPublish],
                    ["Provider", profile.providerWrites],
                    ["Convex", profile.liveConvexExecution],
                  ].map(([label, value]) => (
                    <div key={`${profile.siteKey}-${String(label)}`} className="rounded-lg border border-slate-200 bg-white p-2 text-xs">
                      <div className="text-[10px] uppercase tracking-normal text-slate-500">{label}</div>
                      <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-700">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                        {value ? "on" : "off"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        {profiles.providerBoundary}
      </p>
    </section>
  );
}

function DecisionGateRail({
  title,
  owner,
  posture,
  evidence,
  rollback,
  blockedActions,
  disabledActionLabel,
  testId,
}: {
  title: string;
  owner: string;
  posture: string;
  evidence: string[];
  rollback: string;
  blockedActions: string[];
  disabledActionLabel: string;
  testId: string;
}) {
  return (
    <Card className="border-slate-900 bg-slate-950 text-white shadow-sm" data-testid={testId}>
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">Decision rail</Badge>
            <CardTitle className="mt-3 text-base leading-tight">{title}</CardTitle>
            <p className="mt-2 text-sm leading-6 text-slate-300">{posture}</p>
          </div>
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid={`${testId}-owner`}>
          <div className="text-[11px] font-medium uppercase tracking-normal text-slate-400">Owner</div>
          <div className="mt-1 truncate text-sm font-semibold">{owner}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid={`${testId}-evidence`}>
          <div className="text-[11px] font-medium uppercase tracking-normal text-slate-400">Required evidence</div>
          <div className="mt-3 space-y-2">
            {evidence.slice(0, 4).map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs leading-5 text-slate-300">
                <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3" data-testid={`${testId}-rollback`}>
          <div className="text-[11px] font-medium uppercase tracking-normal text-amber-100">Rollback</div>
          <p className="mt-1 text-xs leading-5 text-amber-50">{rollback}</p>
        </div>

        <div className="rounded-xl border border-rose-300/30 bg-rose-400/10 p-3" data-testid={`${testId}-blocked-actions`}>
          <div className="text-[11px] font-medium uppercase tracking-normal text-rose-100">Blocked live actions</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {blockedActions.slice(0, 4).map((action) => (
              <Badge key={action} variant="outline" className="border-rose-200/30 bg-white/10 text-rose-50">
                {action}
              </Badge>
            ))}
          </div>
        </div>

        <Button disabled variant="secondary" className="w-full justify-start" data-testid={`${testId}-disabled-action`}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          {disabledActionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function ProofBeforePublishCards({
  evidencePacket,
  decisionPacket,
}: {
  evidencePacket?: ShellClientWebsiteVisualQaEvidencePacket;
  decisionPacket?: ShellClientWebsiteLaunchDecisionPacket;
}) {
  const acceptedEvidence = evidencePacket?.evidenceItems.filter((item) => item.status === "accepted").length ?? 0;
  const totalEvidence = evidencePacket?.evidenceItems.length ?? 0;
  const accessibilityEvidence = evidencePacket?.evidenceItems.find((item) => item.kind === "accessibility")
    ?? evidencePacket?.evidenceItems[0];
  const performanceEvidence = evidencePacket?.evidenceItems.find((item) => item.kind === "performance")
    ?? evidencePacket?.evidenceItems[1]
    ?? evidencePacket?.evidenceItems[0];
  const approvalReady = evidencePacket?.approvalChecklist.filter((item) => item.status === "ready").length ?? 0;
  const approvalTotal = evidencePacket?.approvalChecklist.length ?? 0;
  const openRisks = evidencePacket?.openRisks ?? [];
  const blockedActions = decisionPacket?.blockedLaunchActions ?? evidencePacket?.blockedEvidenceActions ?? [];

  return (
    <div
      className="rounded-lg border border-slate-900 bg-slate-950 p-4 text-white shadow-sm"
      data-testid="section-kinflo-client-proof-before-publish-cards"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">Proof before publish</Badge>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              Provider-light
            </Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold">Publish proof package</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            QA evidence, approval checklist, rollback, and open risks stay visible beside the launch decision before any public action is enabled.
          </p>
        </div>
        <Badge className="self-start border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
          {decisionPacket?.launchDecision.replaceAll("_", " ") ?? "review"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid="card-client-proof-qa-evidence">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-normal text-slate-400">QA evidence</div>
              <div className="mt-1 text-sm font-semibold">{acceptedEvidence}/{totalEvidence} accepted</div>
            </div>
            <MonitorSmartphone className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-300">{evidencePacket?.evidencePosture}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid="card-client-proof-access-performance">
          <div className="text-[11px] font-medium uppercase tracking-normal text-slate-400">Accessibility and performance</div>
          <div className="mt-3 grid gap-2">
            {[accessibilityEvidence, performanceEvidence].filter(Boolean).map((item) => (
              <div key={item?.key} className="rounded-lg border border-white/10 bg-slate-900/80 p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-100">{item?.label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">{item?.currentEvidence}</div>
                  </div>
                  <Badge variant={item?.status === "blocked" ? "destructive" : item?.status === "accepted" ? "secondary" : "outline"}>
                    {item?.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid="card-client-proof-approval-checklist">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-normal text-slate-400">Approval checklist</div>
              <div className="mt-1 text-sm font-semibold">{approvalReady}/{approvalTotal} ready</div>
            </div>
            <ListChecks className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 space-y-2">
            {evidencePacket?.approvalChecklist.slice(0, 3).map((item) => (
              <div key={item.key} className="flex items-start gap-2 text-xs leading-5 text-slate-300">
                {item.status === "ready" ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3" data-testid="card-client-proof-rollback">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-normal text-amber-100">Rollback</div>
              <div className="mt-1 text-sm font-semibold text-amber-50">Owner: {decisionPacket?.rollbackPlan.owner}</div>
            </div>
            <Badge variant={decisionPacket?.rollbackPlan.status === "blocked" ? "destructive" : "outline"}>
              {decisionPacket?.rollbackPlan.status}
            </Badge>
          </div>
          <div className="mt-3 space-y-2">
            {decisionPacket?.rollbackPlan.steps.map((step) => (
              <div key={step} className="flex items-start gap-2 text-xs leading-5 text-amber-50">
                <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-rose-300/30 bg-rose-400/10 p-3 lg:col-span-2" data-testid="card-client-proof-open-risks">
          <div className="text-[11px] font-medium uppercase tracking-normal text-rose-100">Open risks and blocked launch actions</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="flex flex-wrap gap-2">
              {openRisks.map((risk) => (
                <Badge key={risk} variant="outline" className="border-rose-200/30 bg-white/10 text-rose-50">
                  {risk}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {blockedActions.slice(0, 4).map((action) => (
                <Badge key={action} variant="outline" className="border-amber-200/30 bg-white/10 text-amber-50">
                  {action}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Button disabled variant="secondary" className="mt-4 w-full justify-start" data-testid="button-client-proof-before-publish-gated">
        <ShieldCheck className="mr-2 h-4 w-4" />
        Publish proof remains gated
      </Button>
    </div>
  );
}

function MobileInspectionMode({
  site,
  polishScorecard,
  visualQaBudget,
  evidencePacket,
  decisionPacket,
  persona,
  journeyStage,
  previewPath,
}: {
  site?: ShellClientWebsiteStudioSite;
  polishScorecard?: ShellClientWebsitePolishScorecard;
  visualQaBudget?: ShellClientWebsiteVisualQaBudget;
  evidencePacket?: ShellClientWebsiteVisualQaEvidencePacket;
  decisionPacket?: ShellClientWebsiteLaunchDecisionPacket;
  persona?: string;
  journeyStage?: string;
  previewPath: string;
}) {
  const mobileViewport = polishScorecard?.viewportChecks.find((check) => check.viewport === "mobile");
  const mobileScreenshot = visualQaBudget?.screenshotPlan.find((item) => item.viewport === "mobile");
  const mobileEvidence = evidencePacket?.evidenceItems.find((item) => item.kind === "screenshot" && item.label.includes("390px"))
    ?? evidencePacket?.evidenceItems.find((item) => item.kind === "screenshot");
  const accessibilityEvidence = visualQaBudget?.accessibilityChecks.find((item) => item.status !== "pass")
    ?? visualQaBudget?.accessibilityChecks[0];
  const performanceEvidence = visualQaBudget?.performanceBudgets.find((item) => item.metric === "interaction")
    ?? visualQaBudget?.performanceBudgets[0];
  const blockedActions = decisionPacket?.blockedLaunchActions ?? visualQaBudget?.blockedQaActions ?? [];
  const mobileQualityItems = [
    accessibilityEvidence
      ? { label: accessibilityEvidence.label, status: accessibilityEvidence.status, detail: accessibilityEvidence.nextAction }
      : undefined,
    performanceEvidence
      ? { label: performanceEvidence.label, status: performanceEvidence.status, detail: performanceEvidence.evidence }
      : undefined,
  ].filter(Boolean) as { label: string; status: "pass" | "review" | "blocked"; detail: string }[];

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      data-testid="section-kinflo-client-mobile-inspection-mode"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
              <MonitorSmartphone className="mr-1 h-3 w-3" />
              390px inspection
            </Badge>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              Local evidence only
            </Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">Mobile inspection mode</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Device, audience context, screenshot evidence, accessibility posture, and launch decision stay together before any client handoff or public publish path is enabled.
          </p>
        </div>
        <Badge className="self-start border border-slate-300 bg-slate-950 text-white hover:bg-slate-950">
          {polishScorecard?.mobileScore ?? 0}% mobile
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 2xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div className="grid gap-3 2xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" data-testid="card-client-mobile-device-context">
            <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">Device and audience</div>
            <div className="mt-3 grid gap-2">
              <div className="rounded-lg border border-slate-200 bg-white p-2">
                <div className="text-xs text-slate-500">Device</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">390px mobile first viewport</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2">
                <div className="text-xs text-slate-500">Persona</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">{persona ?? site?.audience ?? "Audience pending"}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2">
                <div className="text-xs text-slate-500">Journey</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">{journeyStage ?? "review"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" data-testid="card-client-mobile-screenshot-evidence">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">Screenshot evidence</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">{mobileScreenshot?.status ?? mobileEvidence?.status ?? "review"}</div>
              </div>
              <ImageIcon className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              {mobileScreenshot?.requiredEvidence ?? mobileEvidence?.requiredArtifact ?? "390px screenshot evidence is required before publish."}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {mobileEvidence?.currentEvidence ?? mobileViewport?.evidence}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" data-testid="card-client-mobile-touch-truncation">
            <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">Touch and truncation</div>
            <div className="mt-3 space-y-2">
              <div className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>CTA remains visible: {site?.primaryCTA ?? "CTA pending"}</span>
              </div>
              <div className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>Headline wraps inside the first viewport before launch signoff.</span>
              </div>
              <div className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>Tap targets, collapsed navigation, and intake path stay review-gated.</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" data-testid="card-client-mobile-accessibility-performance">
            <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">Accessibility and performance</div>
            <div className="mt-3 space-y-2">
              {mobileQualityItems.map((item) => (
                <div key={item?.label} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-950">{item?.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        {item.detail}
                      </div>
                    </div>
                    <Badge variant={item?.status === "blocked" ? "destructive" : item?.status === "pass" ? "secondary" : "outline"}>
                      {item?.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white" data-testid="card-client-mobile-launch-decision">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-normal text-slate-400">Launch decision</div>
              <div className="mt-1 text-lg font-semibold">{decisionPacket?.launchDecision.replaceAll("_", " ") ?? "review"}</div>
            </div>
            <ShieldCheck className="h-5 w-5 shrink-0 text-amber-300" />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{decisionPacket?.decisionPosture}</p>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] font-medium uppercase tracking-normal text-slate-400">Preview path</div>
            <div className="mt-1 break-all text-xs text-slate-300">{previewPath}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {blockedActions.slice(0, 4).map((action) => (
              <Badge key={action} variant="outline" className="border-amber-200/30 bg-white/10 text-amber-50">
                {action}
              </Badge>
            ))}
          </div>
          <Button disabled variant="secondary" className="mt-4 w-full justify-start" data-testid="button-client-mobile-inspection-gated">
            <MonitorSmartphone className="mr-2 h-4 w-4" />
            Mobile publish proof gated
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminKinfloShell() {
  const { isLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const [location, navigate] = useLocation();
  const snapshot = getKinfloShellSnapshot();
  const [activeTab, setActiveTab] = useState<ShellTabValue>(readInitialShellTab);
  const [selectedLaunchPacketId, setSelectedLaunchPacketId] = useState(snapshot.siteLaunchPackets[0]?.id ?? "");
  const [launchReadinessSiteKey, setLaunchReadinessSiteKey] = useState(snapshot.launchReadiness.defaultSiteKey);
  const adapterSwitchBatchIds = useMemo(
    () => snapshot.adapterSwitchReadiness.batches.map((batch) => batch.id),
    [snapshot.adapterSwitchReadiness.batches],
  );
  const [adapterSwitchBatchId, setAdapterSwitchBatchId] = useState(() => readInitialAdapterSwitchBatchId(
    snapshot.adapterSwitchReadiness.defaultBatchId,
    adapterSwitchBatchIds,
  ));
  const defaultAdapterSwitchSurfaceIds = snapshot.adapterSwitchReadiness.batches
    .find((batch) => batch.id === snapshot.adapterSwitchReadiness.defaultBatchId)
    ?.surfaces.map((surface) => surface.id) ?? [];
  const [adapterSwitchSurfaceId, setAdapterSwitchSurfaceId] = useState(() => readInitialAdapterSwitchSurfaceId(
    defaultAdapterSwitchSurfaceIds[0] ?? "",
    defaultAdapterSwitchSurfaceIds,
  ));
  const hostedActivationStepIds = useMemo(
    () => snapshot.hostedActivationRunbook.steps.map((step) => step.id),
    [snapshot.hostedActivationRunbook.steps],
  );
  const [hostedActivationStepId, setHostedActivationStepId] = useState(() => readInitialHostedActivationStepId(
    snapshot.hostedActivationRunbook.defaultStepId,
    hostedActivationStepIds,
  ));
  const hostedSmokeEvidenceBatchIds = useMemo(
    () => snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.entries.map((entry) => entry.batchId),
    [snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.entries],
  );
  const [hostedSmokeEvidenceBatchId, setHostedSmokeEvidenceBatchId] = useState(() => readInitialHostedSmokeEvidenceBatchId(
    hostedSmokeEvidenceBatchIds[0] ?? "",
    hostedSmokeEvidenceBatchIds,
  ));
  const [wizardTemplateKey, setWizardTemplateKey] = useState(snapshot.siteCreationWizard.defaultTemplateKey);
  const [wizardSiteName, setWizardSiteName] = useState(snapshot.siteCreationWizard.defaultSiteName);
  const [wizardSubdomain, setWizardSubdomain] = useState(snapshot.siteCreationWizard.defaultSubdomain);
  const [wizardBrandTone, setWizardBrandTone] = useState(snapshot.siteCreationWizard.brandToneOptions[0] ?? "");
  const [wizardOwnerRole, setWizardOwnerRole] = useState(snapshot.siteCreationWizard.ownerRoleOptions[0] ?? "");
  const [selectedPlanKey, setSelectedPlanKey] = useState(snapshot.billingPlans[0]?.key ?? "");
  const [experienceTheme, setExperienceTheme] = useState(snapshot.experiencePreferences.theme);
  const [experienceDensity, setExperienceDensity] = useState(snapshot.experiencePreferences.dataDensity);
  const [experienceLandingPage, setExperienceLandingPage] = useState(snapshot.experiencePreferences.defaultLandingPage);
  const [experienceContentFilter, setExperienceContentFilter] = useState(snapshot.experiencePreferences.defaultContentFilter);
  const [experienceItemsPerPage, setExperienceItemsPerPage] = useState(snapshot.experiencePreferences.itemsPerPage);
  const [experienceNotificationChannels, setExperienceNotificationChannels] = useState(
    snapshot.experiencePreferences.notificationChannels,
  );
  const [accessInviteEmail, setAccessInviteEmail] = useState(snapshot.accessDelegation.defaultEmail);
  const [accessTenantSlug, setAccessTenantSlug] = useState(snapshot.accessDelegation.defaultTenantSlug);
  const [accessSiteKey, setAccessSiteKey] = useState(snapshot.accessDelegation.defaultSiteKey);
  const [accessRoleKey, setAccessRoleKey] = useState(snapshot.accessDelegation.defaultRoleKey);
  const [contentSiteKey, setContentSiteKey] = useState(snapshot.contentDraft.defaultSiteKey);
  const [contentPageSlug, setContentPageSlug] = useState(snapshot.contentDraft.defaultPageSlug);
  const [selectedContentBlockKey, setSelectedContentBlockKey] = useState(snapshot.contentDraft.blocks[0]?.key ?? "");
  const [contentDraftTitle, setContentDraftTitle] = useState(snapshot.contentDraft.blocks[0]?.title ?? "");
  const [contentDraftBody, setContentDraftBody] = useState(snapshot.contentDraft.blocks[0]?.body ?? "");
  const [brandSiteKey, setBrandSiteKey] = useState(snapshot.brandTheme.defaultSiteKey);
  const [brandPaletteKey, setBrandPaletteKey] = useState(snapshot.brandTheme.defaultPaletteKey);
  const [brandTypographyKey, setBrandTypographyKey] = useState(snapshot.brandTheme.defaultTypographyKey);
  const [brandButtonKey, setBrandButtonKey] = useState(snapshot.brandTheme.defaultButtonKey);
  const [brandMediaKey, setBrandMediaKey] = useState(snapshot.brandTheme.defaultMediaKey);
  const defaultNavigationItem = snapshot.navigationDraft.items.find(
    (item) => item.placement === snapshot.navigationDraft.defaultPlacement,
  ) ?? snapshot.navigationDraft.items[0];
  const [navigationSiteKey, setNavigationSiteKey] = useState(snapshot.navigationDraft.defaultSiteKey);
  const [navigationPlacement, setNavigationPlacement] = useState(snapshot.navigationDraft.defaultPlacement);
  const [selectedNavigationItemKey, setSelectedNavigationItemKey] = useState(defaultNavigationItem?.key ?? "");
  const [navigationLabel, setNavigationLabel] = useState(defaultNavigationItem?.label ?? "");
  const [navigationHref, setNavigationHref] = useState(defaultNavigationItem?.href ?? "");
  const [navigationVisible, setNavigationVisible] = useState(defaultNavigationItem?.isVisible ?? true);
  const [previewSiteSlug, setPreviewSiteSlug] = useState(snapshot.previewStudio.defaultSiteSlug);
  const [previewRoute, setPreviewRoute] = useState(snapshot.previewStudio.defaultRoute);
  const [previewPersona, setPreviewPersona] = useState(snapshot.previewStudio.defaultPersona);
  const [previewJourneyStage, setPreviewJourneyStage] = useState(snapshot.previewStudio.defaultJourneyStage);
  const [previewDevice, setPreviewDevice] = useState(snapshot.previewStudio.defaultDevice);
  const clientWebsiteStudioSiteKeys = useMemo(
    () => snapshot.clientWebsiteStudio.sites.map((site) => site.key),
    [snapshot.clientWebsiteStudio.sites],
  );
  const [clientWebsiteStudioSiteKey, setClientWebsiteStudioSiteKey] = useState(() => readInitialClientWebsiteStudioSiteKey(
    snapshot.clientWebsiteStudio.defaultSiteKey,
    clientWebsiteStudioSiteKeys,
  ));
  const [clientWebsiteStudioLane, setClientWebsiteStudioLane] = useState<ClientWebsiteStudioLane>(readInitialClientWebsiteStudioLane);
  const [clientWebsiteWorkbenchStage, setClientWebsiteWorkbenchStage] = useState<ClientWebsiteWorkbenchStage>(readInitialClientWebsiteWorkbenchStage);
  const [clientWebsiteLaunchDossier, setClientWebsiteLaunchDossier] = useState<ClientWebsiteLaunchDossier>(readInitialClientWebsiteLaunchDossier);
  const defaultAsset = snapshot.assetLibrary.assets.find((asset) => asset.key === snapshot.assetLibrary.defaultAssetKey)
    ?? snapshot.assetLibrary.assets[0];
  const [assetSiteKey, setAssetSiteKey] = useState(snapshot.assetLibrary.defaultSiteKey);
  const [selectedAssetKey, setSelectedAssetKey] = useState(defaultAsset?.key ?? "");
  const [assetName, setAssetName] = useState(defaultAsset?.name ?? "");
  const [assetKind, setAssetKind] = useState(defaultAsset?.kind ?? "hero");
  const [assetStatus, setAssetStatus] = useState(defaultAsset?.status ?? "draft");
  const [assetUsage, setAssetUsage] = useState(defaultAsset?.usage ?? "");
  const [assetAltText, setAssetAltText] = useState(defaultAsset?.altText ?? "");
  const [assetProvenance, setAssetProvenance] = useState(defaultAsset?.provenance ?? "");
  const defaultDomain = snapshot.domainReadiness.domains.find((domain) => domain.key === snapshot.domainReadiness.defaultDomainKey)
    ?? snapshot.domainReadiness.domains[0];
  const [domainSiteKey, setDomainSiteKey] = useState(snapshot.domainReadiness.defaultSiteKey);
  const [selectedDomainKey, setSelectedDomainKey] = useState(defaultDomain?.key ?? "");
  const [domainHostname, setDomainHostname] = useState(defaultDomain?.hostname ?? "");
  const [domainStatus, setDomainStatus] = useState<ShellDomainDraft["status"]>(defaultDomain?.status ?? "pending");
  const [domainIsPrimary, setDomainIsPrimary] = useState(defaultDomain?.isPrimary ?? false);
  const [domainVerificationToken, setDomainVerificationToken] = useState(defaultDomain?.verificationToken ?? "");
  const [domainRollbackPlan, setDomainRollbackPlan] = useState(defaultDomain?.rollbackPlan ?? "");
  const defaultIntegration = snapshot.integrationReadiness.integrations.find(
    (integration) => integration.key === snapshot.integrationReadiness.defaultIntegrationKey,
  ) ?? snapshot.integrationReadiness.integrations[0];
  const [integrationTenantSlug, setIntegrationTenantSlug] = useState(snapshot.integrationReadiness.defaultTenantSlug);
  const [integrationSiteKey, setIntegrationSiteKey] = useState(snapshot.integrationReadiness.defaultSiteKey);
  const [selectedIntegrationKey, setSelectedIntegrationKey] = useState(defaultIntegration?.key ?? "");
  const [integrationProvider, setIntegrationProvider] = useState<ShellIntegrationDraft["provider"]>(defaultIntegration?.provider ?? "sendgrid");
  const [integrationStatus, setIntegrationStatus] = useState<ShellIntegrationDraft["status"]>(defaultIntegration?.status ?? "not_configured");
  const [integrationEnvKeys, setIntegrationEnvKeys] = useState(defaultIntegration?.envKeys.join("\n") ?? "");
  const [integrationApprovalNotes, setIntegrationApprovalNotes] = useState(defaultIntegration?.approvalNotes ?? "");
  const defaultCampaign = snapshot.campaignAutomation.campaigns.find(
    (campaign) => campaign.key === snapshot.campaignAutomation.defaultCampaignKey,
  ) ?? snapshot.campaignAutomation.campaigns[0];
  const [campaignSiteKey, setCampaignSiteKey] = useState(snapshot.campaignAutomation.defaultSiteKey);
  const [selectedCampaignKey, setSelectedCampaignKey] = useState(defaultCampaign?.key ?? "");
  const [campaignName, setCampaignName] = useState(defaultCampaign?.name ?? "");
  const [campaignChannel, setCampaignChannel] = useState<ShellCampaignDraft["channel"]>(defaultCampaign?.channel ?? "email");
  const [campaignStatus, setCampaignStatus] = useState<ShellCampaignDraft["status"]>(defaultCampaign?.status ?? "draft");
  const [campaignObjective, setCampaignObjective] = useState(defaultCampaign?.objective ?? "");
  const [campaignApprovalOwner, setCampaignApprovalOwner] = useState(defaultCampaign?.approvalOwner ?? "");
  const defaultAiRecord = snapshot.aiReview.records.find((record) => record.key === snapshot.aiReview.defaultRecordKey)
    ?? snapshot.aiReview.records[0];
  const [aiReviewSiteKey, setAiReviewSiteKey] = useState(snapshot.aiReview.defaultSiteKey);
  const [selectedAiRecordKey, setSelectedAiRecordKey] = useState(defaultAiRecord?.key ?? "");
  const [aiPromptSummary, setAiPromptSummary] = useState(defaultAiRecord?.promptSummary ?? "");
  const [aiOutputSummary, setAiOutputSummary] = useState(defaultAiRecord?.outputSummary ?? "");
  const [aiPublishTarget, setAiPublishTarget] = useState(defaultAiRecord?.publishTarget ?? "");
  const [aiReviewerNotes, setAiReviewerNotes] = useState(defaultAiRecord?.reviewerNotes ?? "");
  const [aiReviewStatus, setAiReviewStatus] = useState<ShellAiReviewRecord["status"]>(defaultAiRecord?.status ?? "pending");
  const [wizardPageKeys, setWizardPageKeys] = useState(
    snapshot.siteCreationWizard.pageOptions.filter((page) => page.required).map((page) => page.key),
  );
  const selectedLaunchPacket = useMemo(
    () => snapshot.siteLaunchPackets.find((packet) => packet.id === selectedLaunchPacketId) ?? snapshot.siteLaunchPackets[0],
    [selectedLaunchPacketId, snapshot.siteLaunchPackets],
  );
  const selectedLaunchReadinessSite = useMemo(
    () => snapshot.launchReadiness.sites.find((site) => site.key === launchReadinessSiteKey) ?? snapshot.launchReadiness.sites[0],
    [launchReadinessSiteKey, snapshot.launchReadiness.sites],
  );
  const launchReadinessCounts = useMemo(() => {
    const stages = selectedLaunchReadinessSite?.stages ?? [];
    return {
      ready: stages.filter((stage) => stage.status === "ready").length,
      pending: stages.filter((stage) => stage.status === "pending").length,
      blocked: stages.filter((stage) => stage.status === "blocked").length,
      total: stages.length,
    };
  }, [selectedLaunchReadinessSite]);
  const selectedAdapterSwitchBatch = useMemo(
    () => snapshot.adapterSwitchReadiness.batches.find((batch) => batch.id === adapterSwitchBatchId)
      ?? snapshot.adapterSwitchReadiness.batches[0],
    [adapterSwitchBatchId, snapshot.adapterSwitchReadiness.batches],
  );
  const selectedAdapterSwitchSurface = useMemo(
    () => selectedAdapterSwitchBatch?.surfaces.find((surface) => surface.id === adapterSwitchSurfaceId)
      ?? selectedAdapterSwitchBatch?.surfaces[0],
    [adapterSwitchSurfaceId, selectedAdapterSwitchBatch],
  );
  const selectedAdapterSwitchAcceptance = useMemo(
    () => snapshot.adapterSwitchReadiness.acceptanceMatrix.find((batch) => batch.batchId === adapterSwitchBatchId)
      ?? snapshot.adapterSwitchReadiness.acceptanceMatrix[0],
    [adapterSwitchBatchId, snapshot.adapterSwitchReadiness.acceptanceMatrix],
  );
  const adapterSwitchTotals = useMemo(() => {
    const surfaces = snapshot.adapterSwitchReadiness.batches.flatMap((batch) => batch.surfaces);
    return {
      total: surfaces.length,
      blocked: surfaces.filter((surface) => !surface.switchAllowed).length,
      generatedApiPending: surfaces.filter((surface) => surface.status === "generated_api_pending").length,
      fixtureFallback: surfaces.filter((surface) => surface.status === "fixture_fallback").length,
      liveExecutionBlocked: surfaces.filter((surface) => !surface.liveConvexExecution).length,
    };
  }, [snapshot.adapterSwitchReadiness.batches]);
  const selectedHostedActivationStep = useMemo(
    () => snapshot.hostedActivationRunbook.steps.find((step) => step.id === hostedActivationStepId)
      ?? snapshot.hostedActivationRunbook.steps[0],
    [hostedActivationStepId, snapshot.hostedActivationRunbook.steps],
  );
  const selectedHostedSmokeEvidenceEntry = useMemo(
    () => snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.entries.find((entry) => entry.batchId === hostedSmokeEvidenceBatchId)
      ?? snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.entries[0],
    [hostedSmokeEvidenceBatchId, snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.entries],
  );
  const hostedActivationTotals = useMemo(() => {
    const steps = snapshot.hostedActivationRunbook.steps;
    return {
      total: steps.length,
      pendingApproval: steps.filter((step) => step.status === "pending_approval").length,
      providerGated: steps.filter((step) => step.status === "blocked_provider_gate").length,
      readyAfterApproval: steps.filter((step) => step.status === "ready_after_approval").length,
      liveExecutionBlocked: steps.filter((step) => !step.liveConvexExecution).length,
    };
  }, [snapshot.hostedActivationRunbook.steps]);
  const commandBrief = useMemo(() => {
    const primarySite = snapshot.launchReadiness.sites[0];
    return {
      headline: primarySite?.label ?? "KinFlo OS",
      decision: primarySite?.launchDecision === "ready_for_review" ? "Ready for staged review" : "Needs launch review",
      blocker: primarySite?.blockerSummary ?? snapshot.dataMode.activationGate,
      nextGate: snapshot.hostedActivationRunbook.steps.find((step) => step.status === "blocked_provider_gate")
        ?? snapshot.hostedActivationRunbook.steps[0],
      proof: [
        `${launchReadinessCounts.ready}/${launchReadinessCounts.total} launch checks ready`,
        `${adapterSwitchTotals.total} adapter surfaces mapped`,
        `${hostedActivationTotals.providerGated} hosted gates blocked`,
      ],
    };
  }, [
    adapterSwitchTotals.total,
    hostedActivationTotals.providerGated,
    launchReadinessCounts.ready,
    launchReadinessCounts.total,
    snapshot.dataMode.activationGate,
    snapshot.hostedActivationRunbook.steps,
    snapshot.launchReadiness.sites,
  ]);
  const selectedWizardTemplate = useMemo(
    () => snapshot.templates.find((template) => template.key === wizardTemplateKey) ?? snapshot.templates[0],
    [snapshot.templates, wizardTemplateKey],
  );
  const selectedPlan = useMemo(
    () => snapshot.billingPlans.find((plan) => plan.key === selectedPlanKey) ?? snapshot.billingPlans[0],
    [selectedPlanKey, snapshot.billingPlans],
  );
  const requiredPageKeys = useMemo(
    () => snapshot.siteCreationWizard.pageOptions.filter((page) => page.required).map((page) => page.key),
    [snapshot.siteCreationWizard.pageOptions],
  );
  const requiredPagesSelected = requiredPageKeys.every((pageKey) => wizardPageKeys.includes(pageKey));
  const experiencePreferencesDirty = (
    experienceTheme !== snapshot.experiencePreferences.theme
    || experienceDensity !== snapshot.experiencePreferences.dataDensity
    || experienceLandingPage !== snapshot.experiencePreferences.defaultLandingPage
    || experienceContentFilter !== snapshot.experiencePreferences.defaultContentFilter
    || experienceItemsPerPage !== snapshot.experiencePreferences.itemsPerPage
    || experienceNotificationChannels.join("|") !== snapshot.experiencePreferences.notificationChannels.join("|")
  );
  const selectedNotificationSummary = experienceNotificationChannels.length > 0
    ? experienceNotificationChannels.join(", ")
    : "none";
  const filteredAccessSites = useMemo(
    () => snapshot.accessDelegation.siteOptions.filter((site) => site.tenantSlug === accessTenantSlug),
    [accessTenantSlug, snapshot.accessDelegation.siteOptions],
  );
  const selectedAccessRole = useMemo(
    () => snapshot.accessDelegation.roleOptions.find((role) => role.key === accessRoleKey) ?? snapshot.accessDelegation.roleOptions[0],
    [accessRoleKey, snapshot.accessDelegation.roleOptions],
  );
  const selectedAccessTenant = useMemo(
    () => snapshot.accessDelegation.tenantOptions.find((tenant) => tenant.slug === accessTenantSlug) ?? snapshot.accessDelegation.tenantOptions[0],
    [accessTenantSlug, snapshot.accessDelegation.tenantOptions],
  );
  const selectedAccessSite = useMemo(
    () => snapshot.accessDelegation.siteOptions.find((site) => site.key === accessSiteKey) ?? filteredAccessSites[0],
    [accessSiteKey, filteredAccessSites, snapshot.accessDelegation.siteOptions],
  );
  const accessReadiness = [
    { label: "Invite email entered", done: accessInviteEmail.includes("@") },
    { label: "Tenant selected", done: Boolean(selectedAccessTenant) },
    { label: "Scope selected", done: selectedAccessRole?.scope === "tenant" || Boolean(selectedAccessSite) },
    { label: "Role permissions previewed", done: Boolean(selectedAccessRole?.permissions.length) },
    { label: "Live invitation smoke pending", done: false },
  ];
  const accessReadyCount = accessReadiness.filter((item) => item.done).length;
  const accessReadinessPercent = Math.round((accessReadyCount / accessReadiness.length) * 100);
  const selectedContentSite = useMemo(
    () => snapshot.contentDraft.siteOptions.find((site) => site.key === contentSiteKey) ?? snapshot.contentDraft.siteOptions[0],
    [contentSiteKey, snapshot.contentDraft.siteOptions],
  );
  const selectedContentPage = useMemo(
    () => snapshot.contentDraft.pageOptions.find((page) => page.slug === contentPageSlug) ?? snapshot.contentDraft.pageOptions[0],
    [contentPageSlug, snapshot.contentDraft.pageOptions],
  );
  const selectedContentBlock = useMemo(
    () => snapshot.contentDraft.blocks.find((block) => block.key === selectedContentBlockKey) ?? snapshot.contentDraft.blocks[0],
    [selectedContentBlockKey, snapshot.contentDraft.blocks],
  );
  const contentDraftDirty = Boolean(
    selectedContentBlock
    && (contentDraftTitle !== selectedContentBlock.title || contentDraftBody !== selectedContentBlock.body),
  );
  const contentReadiness = [
    { label: "Assigned site selected", done: Boolean(selectedContentSite) },
    { label: "Page selected", done: Boolean(selectedContentPage) },
    { label: "Block selected", done: Boolean(selectedContentBlock) },
    { label: "Draft text present", done: Boolean(contentDraftTitle.trim() && contentDraftBody.trim()) },
    { label: "Live publish smoke pending", done: false },
  ];
  const contentReadyCount = contentReadiness.filter((item) => item.done).length;
  const contentReadinessPercent = Math.round((contentReadyCount / contentReadiness.length) * 100);
  const selectedBrandSite = useMemo(
    () => snapshot.brandTheme.siteOptions.find((site) => site.key === brandSiteKey) ?? snapshot.brandTheme.siteOptions[0],
    [brandSiteKey, snapshot.brandTheme.siteOptions],
  );
  const selectedBrandPalette = useMemo(
    () => snapshot.brandTheme.paletteOptions.find((palette) => palette.key === brandPaletteKey) ?? snapshot.brandTheme.paletteOptions[0],
    [brandPaletteKey, snapshot.brandTheme.paletteOptions],
  );
  const selectedBrandTypography = useMemo(
    () => snapshot.brandTheme.typographyOptions.find((typography) => typography.key === brandTypographyKey) ?? snapshot.brandTheme.typographyOptions[0],
    [brandTypographyKey, snapshot.brandTheme.typographyOptions],
  );
  const selectedBrandButton = useMemo(
    () => snapshot.brandTheme.buttonOptions.find((button) => button.key === brandButtonKey) ?? snapshot.brandTheme.buttonOptions[0],
    [brandButtonKey, snapshot.brandTheme.buttonOptions],
  );
  const selectedBrandMedia = useMemo(
    () => snapshot.brandTheme.mediaOptions.find((media) => media.key === brandMediaKey) ?? snapshot.brandTheme.mediaOptions[0],
    [brandMediaKey, snapshot.brandTheme.mediaOptions],
  );
  const brandThemeDirty = (
    brandSiteKey !== snapshot.brandTheme.defaultSiteKey
    || brandPaletteKey !== snapshot.brandTheme.defaultPaletteKey
    || brandTypographyKey !== snapshot.brandTheme.defaultTypographyKey
    || brandButtonKey !== snapshot.brandTheme.defaultButtonKey
    || brandMediaKey !== snapshot.brandTheme.defaultMediaKey
  );
  const brandReadiness = [
    { label: "Site selected", done: Boolean(selectedBrandSite) },
    { label: "Palette selected", done: Boolean(selectedBrandPalette) },
    { label: "Typography selected", done: Boolean(selectedBrandTypography) },
    { label: "Buttons and media selected", done: Boolean(selectedBrandButton && selectedBrandMedia) },
    { label: "Live visual smoke pending", done: false },
  ];
  const brandReadyCount = brandReadiness.filter((item) => item.done).length;
  const brandReadinessPercent = Math.round((brandReadyCount / brandReadiness.length) * 100);
  const selectedNavigationSite = useMemo(
    () => snapshot.navigationDraft.siteOptions.find((site) => site.key === navigationSiteKey) ?? snapshot.navigationDraft.siteOptions[0],
    [navigationSiteKey, snapshot.navigationDraft.siteOptions],
  );
  const filteredNavigationItems = useMemo(
    () => snapshot.navigationDraft.items.filter((item) => item.placement === navigationPlacement),
    [navigationPlacement, snapshot.navigationDraft.items],
  );
  const selectedNavigationItem = useMemo(
    () => filteredNavigationItems.find((item) => item.key === selectedNavigationItemKey) ?? filteredNavigationItems[0],
    [filteredNavigationItems, selectedNavigationItemKey],
  );
  const navigationPreviewItems = useMemo(
    () => filteredNavigationItems
      .map((item) => (
        item.key === selectedNavigationItem?.key
          ? { ...item, label: navigationLabel, href: navigationHref, isVisible: navigationVisible }
          : item
      ))
      .sort((left, right) => left.order - right.order),
    [filteredNavigationItems, navigationHref, navigationLabel, navigationVisible, selectedNavigationItem],
  );
  const navigationDraftDirty = Boolean(
    selectedNavigationItem
    && (
      navigationLabel !== selectedNavigationItem.label
      || navigationHref !== selectedNavigationItem.href
      || navigationVisible !== selectedNavigationItem.isVisible
    ),
  );
  const navigationReadiness = [
    { label: "Assigned site selected", done: Boolean(selectedNavigationSite) },
    { label: "Placement selected", done: Boolean(navigationPlacement) },
    { label: "Navigation item selected", done: Boolean(selectedNavigationItem) },
    { label: "Label and href present", done: Boolean(navigationLabel.trim() && navigationHref.trim()) },
    { label: "Live navigation smoke pending", done: false },
  ];
  const navigationReadyCount = navigationReadiness.filter((item) => item.done).length;
  const navigationReadinessPercent = Math.round((navigationReadyCount / navigationReadiness.length) * 100);
  const selectedPreviewSite = useMemo(
    () => snapshot.previewStudio.siteOptions.find((site) => site.slug === previewSiteSlug) ?? snapshot.previewStudio.siteOptions[0],
    [previewSiteSlug, snapshot.previewStudio.siteOptions],
  );
  const selectedPreviewDevice = useMemo(
    () => snapshot.previewStudio.deviceOptions.find((device) => device.key === previewDevice) ?? snapshot.previewStudio.deviceOptions[0],
    [previewDevice, snapshot.previewStudio.deviceOptions],
  );
  const previewQuery = useMemo(() => {
    const params = new URLSearchParams();
    const route = previewRoute.trim() || "/";
    params.set("route", route);
    if (previewPersona !== "anonymous") {
      params.set("persona", previewPersona);
    }
    if (previewJourneyStage !== "default") {
      params.set("journeyStage", previewJourneyStage);
    }
    params.set("device", previewDevice);
    return params.toString();
  }, [previewDevice, previewJourneyStage, previewPersona, previewRoute]);
  const previewHref = `${selectedPreviewSite?.previewPath ?? "/kinflo-sites/advisor-client-site"}?${previewQuery}`;
  const previewReadiness = [
    { label: "Site selected", done: Boolean(selectedPreviewSite) },
    { label: "Route set", done: Boolean(previewRoute.trim()) },
    { label: "Audience context explicit", done: Boolean(previewPersona && previewJourneyStage) },
    { label: "Device checkpoint selected", done: Boolean(selectedPreviewDevice) },
    { label: "Live lead smoke pending", done: false },
  ];
  const previewReadyCount = previewReadiness.filter((item) => item.done).length;
  const previewReadinessPercent = Math.round((previewReadyCount / previewReadiness.length) * 100);
  const selectedClientWebsiteStudioSite = useMemo(
    () => snapshot.clientWebsiteStudio.sites.find((site) => site.key === clientWebsiteStudioSiteKey)
      ?? snapshot.clientWebsiteStudio.sites[0],
    [clientWebsiteStudioSiteKey, snapshot.clientWebsiteStudio.sites],
  );
  const clientWebsiteStudioReadiness = [
    { label: "Mobile public preview", done: selectedClientWebsiteStudioSite?.mobileReadiness === "ready" },
    { label: "Visitor navigation path", done: selectedClientWebsiteStudioSite?.navReadiness === "ready" },
    { label: "First-viewport hero proof", done: selectedClientWebsiteStudioSite?.heroReadiness === "ready" },
    { label: "Branded portal handoff", done: selectedClientWebsiteStudioSite?.portalReadiness === "ready" },
    { label: "Provider publish approval", done: false },
  ];
  const clientWebsiteStudioReadyCount = clientWebsiteStudioReadiness.filter((item) => item.done).length;
  const clientWebsiteStudioReadinessPercent = Math.round(
    (clientWebsiteStudioReadyCount / clientWebsiteStudioReadiness.length) * 100,
  );
  const clientWebsiteStudioPreviewPath = selectedClientWebsiteStudioSite?.previewPath ?? "/kinflo-sites/julies-family";
  const selectedClientWebsiteLaunchBlueprint = useMemo(
    () => snapshot.clientWebsiteStudio.launchBlueprints.find((blueprint) => blueprint.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.launchBlueprints[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.launchBlueprints],
  );
  const selectedClientWebsiteAdminPermissionPreset = useMemo(
    () => snapshot.clientWebsiteStudio.adminPermissionPresets.find((preset) => preset.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.adminPermissionPresets[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.adminPermissionPresets],
  );
  const selectedClientWebsiteProvisioningOrder = useMemo(
    () => snapshot.clientWebsiteStudio.provisioningOrders.find((order) => order.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.provisioningOrders[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.provisioningOrders],
  );
  const selectedClientWebsiteProvisioningExecution = useMemo(
    () => snapshot.clientWebsiteStudio.provisioningExecution.orderSteps.find((order) => order.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.provisioningExecution.orderSteps[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.provisioningExecution.orderSteps],
  );
  const selectedClientWebsiteConfigurationReviewPacket = useMemo(
    () => snapshot.clientWebsiteStudio.configurationReviewPackets.find((packet) => packet.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.configurationReviewPackets[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.configurationReviewPackets],
  );
  const selectedClientWebsiteConfigurationChangeSet = useMemo(
    () => snapshot.clientWebsiteStudio.configurationChangeSets.find((changeSet) => changeSet.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.configurationChangeSets[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.configurationChangeSets],
  );
  const selectedClientWebsiteConfigurationApprovalMatrix = useMemo(
    () => snapshot.clientWebsiteStudio.configurationApprovalMatrices.find((matrix) => matrix.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.configurationApprovalMatrices[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.configurationApprovalMatrices],
  );
  const selectedClientWebsiteLaunchPacket = useMemo(
    () => snapshot.clientWebsiteStudio.launchPackets.find((packet) => packet.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.launchPackets[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.launchPackets],
  );
  const selectedClientWebsiteStarterContentPack = useMemo(
    () => snapshot.clientWebsiteStudio.starterContentPacks.find((pack) => pack.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.starterContentPacks[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.starterContentPacks],
  );
  const clientWebsiteStudioPreviewRoute = selectedClientWebsiteStarterContentPack?.pages[0]?.route ?? "/";
  const clientWebsiteStudioPreviewPersona = selectedClientWebsiteStarterContentPack?.persona ?? selectedClientWebsiteStudioSite?.audience;
  const clientWebsiteStudioPreviewJourneyStage = selectedClientWebsiteStarterContentPack?.journeyStage ?? "review";
  const clientWebsiteStudioPreviewHref = buildClientWebsiteStudioPreviewHref({
    previewPath: clientWebsiteStudioPreviewPath,
    siteKey: selectedClientWebsiteStudioSite?.key,
    route: clientWebsiteStudioPreviewRoute,
    persona: clientWebsiteStudioPreviewPersona,
    journeyStage: clientWebsiteStudioPreviewJourneyStage,
    device: "desktop",
  });
  const clientWebsiteStudioMobilePreviewHref = buildClientWebsiteStudioPreviewHref({
    previewPath: clientWebsiteStudioPreviewPath,
    siteKey: selectedClientWebsiteStudioSite?.key,
    route: clientWebsiteStudioPreviewRoute,
    persona: clientWebsiteStudioPreviewPersona,
    journeyStage: clientWebsiteStudioPreviewJourneyStage,
    device: "mobile",
  });
  const selectedClientWebsiteOnboardingReadiness = useMemo(
    () => snapshot.clientWebsiteStudio.onboardingReadiness.find((readiness) => readiness.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.onboardingReadiness[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.onboardingReadiness],
  );
  const selectedClientWebsiteLaunchSimulation = useMemo(
    () => snapshot.clientWebsiteStudio.launchSimulations.find((simulation) => simulation.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.launchSimulations[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.launchSimulations],
  );
  const selectedClientWebsitePolishScorecard = useMemo(
    () => snapshot.clientWebsiteStudio.polishScorecards.find((scorecard) => scorecard.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.polishScorecards[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.polishScorecards],
  );
  const selectedClientWebsiteVisualQaBudget = useMemo(
    () => snapshot.clientWebsiteStudio.visualQaBudgets.find((budget) => budget.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.visualQaBudgets[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.visualQaBudgets],
  );
  const selectedClientWebsiteVisualQaEvidencePacket = useMemo(
    () => snapshot.clientWebsiteStudio.visualQaEvidencePackets.find((packet) => packet.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.visualQaEvidencePackets[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.visualQaEvidencePackets],
  );
  const selectedClientWebsiteLaunchDecisionPacket = useMemo(
    () => snapshot.clientWebsiteStudio.launchDecisionPackets.find((packet) => packet.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.launchDecisionPackets[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.launchDecisionPackets],
  );
  const selectedClientWebsitePreviewReviewPacket = useMemo(
    () => snapshot.clientWebsiteStudio.previewReviewPackets.find((packet) => packet.siteKey === selectedClientWebsiteStudioSite?.key)
      ?? snapshot.clientWebsiteStudio.previewReviewPackets[0],
    [selectedClientWebsiteStudioSite, snapshot.clientWebsiteStudio.previewReviewPackets],
  );
  const clientWebsiteStudioStatusLabel = selectedClientWebsiteStudioSite?.status.replaceAll("_", " ") ?? "not selected";
  const clientWebsiteLaunchDecisionLabel = selectedClientWebsiteLaunchDecisionPacket?.launchDecision.replaceAll("_", " ") ?? "review";
  const clientWebsiteLaunchDecisionBlockedCount = selectedClientWebsiteLaunchDecisionPacket?.decisionCriteria.filter((item) => item.status === "blocked").length ?? 0;
  const clientWebsiteLaunchDecisionReadyCount = selectedClientWebsiteLaunchDecisionPacket?.decisionCriteria.filter((item) => item.status === "ready").length ?? 0;
  const clientWebsiteLaunchDecisionTone = selectedClientWebsiteLaunchDecisionPacket?.launchDecision === "no_go"
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
  const clientWebsitePreviewReviewContext = selectedClientWebsitePreviewReviewPacket?.context ?? [];
  const clientWebsitePreviewReviewEvidence = selectedClientWebsitePreviewReviewPacket?.evidenceChecklist.map((item) => ({
    label: item.label,
    value: item.evidence,
    done: item.status === "accepted" || item.status === "ready",
  })) ?? [];
  const clientWebsitePreviewReviewBlockedActions = selectedClientWebsitePreviewReviewPacket?.blockedLiveActions ?? [];
  const clientWebsiteStudioReviewStats = [
    { label: "Tenant", value: selectedClientWebsiteStudioSite?.tenantSlug ?? "Pending" },
    { label: "Readiness", value: `${clientWebsiteStudioReadyCount}/${clientWebsiteStudioReadiness.length}` },
    { label: "Permission", value: selectedClientWebsiteAdminPermissionPreset?.scope ?? "Pending" },
    { label: "Order", value: selectedClientWebsiteProvisioningOrder?.orderStatus.replaceAll("_", " ") ?? "Pending" },
  ];
  const clientWebsiteStudioCommandStats = [
    { label: "Decision", value: clientWebsiteLaunchDecisionLabel },
    { label: "Ready proof", value: `${clientWebsiteLaunchDecisionReadyCount}` },
    { label: "Blocked gates", value: `${clientWebsiteLaunchDecisionBlockedCount}` },
    { label: "Signoffs", value: `${selectedClientWebsiteLaunchDecisionPacket?.requiredSignoffs.length ?? 0}` },
  ];
  const clientWebsiteWorkbenchGridContract = [
    { label: "Site rail", value: "Page tree and site queue", status: "Fixture" },
    { label: "Preview canvas", value: "Device-framed local renderer", status: "Review" },
    { label: "Evidence rail", value: "QA, permissions, rollback", status: "Gated" },
    { label: "Launch controls", value: "Publish, handoff, domain disabled", status: "Blocked" },
  ];
  const selectedAssetSite = useMemo(
    () => snapshot.assetLibrary.siteOptions.find((site) => site.key === assetSiteKey) ?? snapshot.assetLibrary.siteOptions[0],
    [assetSiteKey, snapshot.assetLibrary.siteOptions],
  );
  const filteredAssets = useMemo(
    () => snapshot.assetLibrary.assets.filter((asset) => asset.siteKey === assetSiteKey),
    [assetSiteKey, snapshot.assetLibrary.assets],
  );
  const selectedAsset = useMemo(
    () => filteredAssets.find((asset) => asset.key === selectedAssetKey) ?? filteredAssets[0],
    [filteredAssets, selectedAssetKey],
  );
  const assetDraftDirty = Boolean(
    selectedAsset
    && (
      assetName !== selectedAsset.name
      || assetKind !== selectedAsset.kind
      || assetStatus !== selectedAsset.status
      || assetUsage !== selectedAsset.usage
      || assetAltText !== selectedAsset.altText
      || assetProvenance !== selectedAsset.provenance
    ),
  );
  const assetReadiness = [
    { label: "Site selected", done: Boolean(selectedAssetSite) },
    { label: "Asset selected", done: Boolean(selectedAsset) },
    { label: "Usage and alt text present", done: Boolean(assetUsage.trim() && assetAltText.trim()) },
    { label: "Provenance recorded", done: Boolean(assetProvenance.trim()) },
    { label: "Object storage upload pending", done: false },
  ];
  const assetReadyCount = assetReadiness.filter((item) => item.done).length;
  const assetReadinessPercent = Math.round((assetReadyCount / assetReadiness.length) * 100);
  const selectedDomainSite = useMemo(
    () => snapshot.domainReadiness.siteOptions.find((site) => site.key === domainSiteKey) ?? snapshot.domainReadiness.siteOptions[0],
    [domainSiteKey, snapshot.domainReadiness.siteOptions],
  );
  const filteredDomains = useMemo(
    () => snapshot.domainReadiness.domains.filter((domain) => domain.siteKey === domainSiteKey),
    [domainSiteKey, snapshot.domainReadiness.domains],
  );
  const selectedDomain = useMemo(
    () => filteredDomains.find((domain) => domain.key === selectedDomainKey) ?? filteredDomains[0],
    [filteredDomains, selectedDomainKey],
  );
  const domainDraftDirty = Boolean(
    selectedDomain
    && (
      domainHostname !== selectedDomain.hostname
      || domainStatus !== selectedDomain.status
      || domainIsPrimary !== selectedDomain.isPrimary
      || domainVerificationToken !== selectedDomain.verificationToken
      || domainRollbackPlan !== selectedDomain.rollbackPlan
    ),
  );
  const domainReadiness = [
    { label: "Site selected", done: Boolean(selectedDomainSite) },
    { label: "Bare hostname entered", done: Boolean(domainHostname.trim() && !domainHostname.includes("/") && !domainHostname.includes(":")) },
    { label: "Verification token recorded", done: Boolean(domainVerificationToken.trim()) },
    { label: "Rollback plan documented", done: Boolean(domainRollbackPlan.trim()) },
    { label: "DNS and SSL provider writes pending", done: false },
  ];
  const domainReadyCount = domainReadiness.filter((item) => item.done).length;
  const domainReadinessPercent = Math.round((domainReadyCount / domainReadiness.length) * 100);
  const filteredIntegrationSites = useMemo(
    () => snapshot.integrationReadiness.siteOptions.filter((site) => site.tenantSlug === integrationTenantSlug),
    [integrationTenantSlug, snapshot.integrationReadiness.siteOptions],
  );
  const filteredIntegrations = useMemo(
    () => snapshot.integrationReadiness.integrations.filter((integration) => integration.tenantSlug === integrationTenantSlug),
    [integrationTenantSlug, snapshot.integrationReadiness.integrations],
  );
  const selectedIntegration = useMemo(
    () => filteredIntegrations.find((integration) => integration.key === selectedIntegrationKey) ?? filteredIntegrations[0],
    [filteredIntegrations, selectedIntegrationKey],
  );
  const selectedIntegrationProvider = useMemo(
    () => snapshot.integrationReadiness.providerOptions.find((provider) => provider.key === integrationProvider) ?? snapshot.integrationReadiness.providerOptions[0],
    [integrationProvider, snapshot.integrationReadiness.providerOptions],
  );
  const integrationDraftDirty = Boolean(
    selectedIntegration
    && (
      integrationProvider !== selectedIntegration.provider
      || integrationStatus !== selectedIntegration.status
      || integrationEnvKeys !== selectedIntegration.envKeys.join("\n")
      || integrationApprovalNotes !== selectedIntegration.approvalNotes
    ),
  );
  const integrationReadiness = [
    { label: "Tenant selected", done: Boolean(integrationTenantSlug) },
    { label: "Provider selected", done: Boolean(selectedIntegrationProvider) },
    { label: "Env key names recorded", done: integrationEnvKeys.split("\n").some((key) => Boolean(key.trim())) },
    { label: "Approval notes recorded", done: Boolean(integrationApprovalNotes.trim()) },
    { label: "Live provider smoke pending", done: false },
  ];
  const integrationReadyCount = integrationReadiness.filter((item) => item.done).length;
  const integrationReadinessPercent = Math.round((integrationReadyCount / integrationReadiness.length) * 100);
  const selectedCampaignSite = useMemo(
    () => snapshot.campaignAutomation.siteOptions.find((site) => site.key === campaignSiteKey) ?? snapshot.campaignAutomation.siteOptions[0],
    [campaignSiteKey, snapshot.campaignAutomation.siteOptions],
  );
  const filteredCampaigns = useMemo(
    () => snapshot.campaignAutomation.campaigns.filter((campaign) => campaign.siteKey === campaignSiteKey),
    [campaignSiteKey, snapshot.campaignAutomation.campaigns],
  );
  const selectedCampaign = useMemo(
    () => filteredCampaigns.find((campaign) => campaign.key === selectedCampaignKey) ?? filteredCampaigns[0],
    [filteredCampaigns, selectedCampaignKey],
  );
  const selectedCampaignChannel = useMemo(
    () => snapshot.campaignAutomation.channelOptions.find((channel) => channel.key === campaignChannel) ?? snapshot.campaignAutomation.channelOptions[0],
    [campaignChannel, snapshot.campaignAutomation.channelOptions],
  );
  const campaignDraftDirty = Boolean(
    selectedCampaign
    && (
      campaignName !== selectedCampaign.name
      || campaignChannel !== selectedCampaign.channel
      || campaignStatus !== selectedCampaign.status
      || campaignObjective !== selectedCampaign.objective
      || campaignApprovalOwner !== selectedCampaign.approvalOwner
    ),
  );
  const campaignReadiness = [
    { label: "Site selected", done: Boolean(selectedCampaignSite) },
    { label: "Campaign selected", done: Boolean(selectedCampaign) },
    { label: "Objective documented", done: Boolean(campaignObjective.trim()) },
    { label: "Approval owner named", done: Boolean(campaignApprovalOwner.trim()) },
    { label: "Live send and AI execution pending", done: false },
  ];
  const campaignReadyCount = campaignReadiness.filter((item) => item.done).length;
  const campaignReadinessPercent = Math.round((campaignReadyCount / campaignReadiness.length) * 100);
  const selectedAiReviewSite = useMemo(
    () => snapshot.aiReview.siteOptions.find((site) => site.key === aiReviewSiteKey) ?? snapshot.aiReview.siteOptions[0],
    [aiReviewSiteKey, snapshot.aiReview.siteOptions],
  );
  const filteredAiRecords = useMemo(
    () => snapshot.aiReview.records.filter((record) => record.siteKey === aiReviewSiteKey),
    [aiReviewSiteKey, snapshot.aiReview.records],
  );
  const selectedAiRecord = useMemo(
    () => filteredAiRecords.find((record) => record.key === selectedAiRecordKey) ?? filteredAiRecords[0],
    [filteredAiRecords, selectedAiRecordKey],
  );
  const aiReviewDraftDirty = Boolean(
    selectedAiRecord
    && (
      aiPromptSummary !== selectedAiRecord.promptSummary
      || aiOutputSummary !== selectedAiRecord.outputSummary
      || aiPublishTarget !== selectedAiRecord.publishTarget
      || aiReviewerNotes !== selectedAiRecord.reviewerNotes
      || aiReviewStatus !== selectedAiRecord.status
    ),
  );
  const aiReviewReadiness = [
    { label: "Site selected", done: Boolean(selectedAiReviewSite) },
    { label: "AI record selected", done: Boolean(selectedAiRecord) },
    { label: "Source inputs recorded", done: Boolean(selectedAiRecord?.sourceInputs.length) },
    { label: "Publish target named", done: Boolean(aiPublishTarget.trim()) },
    { label: "Reviewer notes recorded", done: Boolean(aiReviewerNotes.trim()) },
    { label: "Live AI generation and publish pending", done: false },
  ];
  const aiReviewReadyCount = aiReviewReadiness.filter((item) => item.done).length;
  const aiReviewReadinessPercent = Math.round((aiReviewReadyCount / aiReviewReadiness.length) * 100);
  const wizardReadiness = [
    { label: "Template selected", done: Boolean(selectedWizardTemplate) },
    { label: "Site and subdomain named", done: Boolean(wizardSiteName.trim() && wizardSubdomain.trim()) },
    { label: "Required pages selected", done: requiredPagesSelected },
    { label: "Owner role scoped", done: Boolean(wizardOwnerRole) },
    { label: "Preview route prepared", done: Boolean(selectedLaunchPacket?.previewPath) },
    { label: "Live Convex smoke pending", done: false },
  ];
  const wizardReadyCount = wizardReadiness.filter((item) => item.done).length;
  const wizardReadinessPercent = Math.round((wizardReadyCount / wizardReadiness.length) * 100);

  const toggleWizardPage = (pageKey: string, checked: boolean) => {
    setWizardPageKeys((current) => {
      if (checked) {
        return current.includes(pageKey) ? current : [...current, pageKey];
      }
      return current.filter((item) => item !== pageKey);
    });
  };

  const toggleExperienceNotification = (channel: string, checked: boolean) => {
    setExperienceNotificationChannels((current) => {
      if (checked) {
        return current.includes(channel) ? current : [...current, channel];
      }
      return current.filter((item) => item !== channel);
    });
  };

  const handleAccessTenantChange = (tenantSlug: string) => {
    setAccessTenantSlug(tenantSlug);
    const nextSite = snapshot.accessDelegation.siteOptions.find((site) => site.tenantSlug === tenantSlug);
    if (nextSite) {
      setAccessSiteKey(nextSite.key);
    }
  };

  const handleContentBlockChange = (blockKey: string) => {
    const nextBlock = snapshot.contentDraft.blocks.find((block) => block.key === blockKey);
    setSelectedContentBlockKey(blockKey);
    if (nextBlock) {
      setContentDraftTitle(nextBlock.title);
      setContentDraftBody(nextBlock.body);
    }
  };

  const hydrateNavigationItem = (item?: { key: string; label: string; href: string; isVisible: boolean }) => {
    if (!item) {
      return;
    }
    setSelectedNavigationItemKey(item.key);
    setNavigationLabel(item.label);
    setNavigationHref(item.href);
    setNavigationVisible(item.isVisible);
  };

  const handleNavigationPlacementChange = (placement: typeof navigationPlacement) => {
    setNavigationPlacement(placement);
    hydrateNavigationItem(snapshot.navigationDraft.items.find((item) => item.placement === placement));
  };

  const handleNavigationItemChange = (itemKey: string) => {
    hydrateNavigationItem(snapshot.navigationDraft.items.find((item) => item.key === itemKey));
  };

  const hydrateAsset = (asset?: {
    key: string;
    name: string;
    kind: typeof assetKind;
    status: typeof assetStatus;
    usage: string;
    altText: string;
    provenance: string;
  }) => {
    if (!asset) {
      return;
    }
    setSelectedAssetKey(asset.key);
    setAssetName(asset.name);
    setAssetKind(asset.kind);
    setAssetStatus(asset.status);
    setAssetUsage(asset.usage);
    setAssetAltText(asset.altText);
    setAssetProvenance(asset.provenance);
  };

  const handleAssetSiteChange = (siteKey: string) => {
    setAssetSiteKey(siteKey);
    hydrateAsset(snapshot.assetLibrary.assets.find((asset) => asset.siteKey === siteKey));
  };

  const handleAssetChange = (assetKey: string) => {
    hydrateAsset(snapshot.assetLibrary.assets.find((asset) => asset.key === assetKey));
  };

  const hydrateDomain = (domain?: ShellDomainDraft) => {
    if (!domain) {
      return;
    }
    setSelectedDomainKey(domain.key);
    setDomainHostname(domain.hostname);
    setDomainStatus(domain.status);
    setDomainIsPrimary(domain.isPrimary);
    setDomainVerificationToken(domain.verificationToken);
    setDomainRollbackPlan(domain.rollbackPlan);
  };

  const handleDomainSiteChange = (siteKey: string) => {
    setDomainSiteKey(siteKey);
    hydrateDomain(snapshot.domainReadiness.domains.find((domain) => domain.siteKey === siteKey));
  };

  const handleDomainChange = (domainKey: string) => {
    hydrateDomain(snapshot.domainReadiness.domains.find((domain) => domain.key === domainKey));
  };

  const hydrateIntegration = (integration?: ShellIntegrationDraft) => {
    if (!integration) {
      return;
    }
    setSelectedIntegrationKey(integration.key);
    setIntegrationProvider(integration.provider);
    setIntegrationStatus(integration.status);
    setIntegrationEnvKeys(integration.envKeys.join("\n"));
    setIntegrationApprovalNotes(integration.approvalNotes);
    if (integration.siteKey) {
      setIntegrationSiteKey(integration.siteKey);
    }
  };

  const handleIntegrationTenantChange = (tenantSlug: string) => {
    setIntegrationTenantSlug(tenantSlug);
    const nextSite = snapshot.integrationReadiness.siteOptions.find((site) => site.tenantSlug === tenantSlug);
    if (nextSite) {
      setIntegrationSiteKey(nextSite.key);
    }
    hydrateIntegration(snapshot.integrationReadiness.integrations.find((integration) => integration.tenantSlug === tenantSlug));
  };

  const handleIntegrationChange = (integrationKey: string) => {
    hydrateIntegration(snapshot.integrationReadiness.integrations.find((integration) => integration.key === integrationKey));
  };

  const hydrateCampaign = (campaign?: ShellCampaignDraft) => {
    if (!campaign) {
      return;
    }
    setSelectedCampaignKey(campaign.key);
    setCampaignName(campaign.name);
    setCampaignChannel(campaign.channel);
    setCampaignStatus(campaign.status);
    setCampaignObjective(campaign.objective);
    setCampaignApprovalOwner(campaign.approvalOwner);
  };

  const handleCampaignSiteChange = (siteKey: string) => {
    setCampaignSiteKey(siteKey);
    hydrateCampaign(snapshot.campaignAutomation.campaigns.find((campaign) => campaign.siteKey === siteKey));
  };

  const handleCampaignChange = (campaignKey: string) => {
    hydrateCampaign(snapshot.campaignAutomation.campaigns.find((campaign) => campaign.key === campaignKey));
  };

  const hydrateAiReviewRecord = (record?: ShellAiReviewRecord) => {
    if (!record) {
      return;
    }
    setSelectedAiRecordKey(record.key);
    setAiPromptSummary(record.promptSummary);
    setAiOutputSummary(record.outputSummary);
    setAiPublishTarget(record.publishTarget);
    setAiReviewerNotes(record.reviewerNotes);
    setAiReviewStatus(record.status);
  };

  const handleAiReviewSiteChange = (siteKey: string) => {
    setAiReviewSiteKey(siteKey);
    hydrateAiReviewRecord(snapshot.aiReview.records.find((record) => record.siteKey === siteKey));
  };

  const handleAiReviewRecordChange = (recordKey: string) => {
    hydrateAiReviewRecord(snapshot.aiReview.records.find((record) => record.key === recordKey));
  };

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    const nextTab = readInitialShellTab();
    const nextLane = readInitialClientWebsiteStudioLane();
    const nextSiteKey = readInitialClientWebsiteStudioSiteKey(
      snapshot.clientWebsiteStudio.defaultSiteKey,
      clientWebsiteStudioSiteKeys,
    );
    const nextStage = readInitialClientWebsiteWorkbenchStage();
    const nextDossier = readInitialClientWebsiteLaunchDossier();
    const nextAdapterSwitchBatchId = readInitialAdapterSwitchBatchId(
      snapshot.adapterSwitchReadiness.defaultBatchId,
      adapterSwitchBatchIds,
    );
    const nextAdapterSwitchSurfaceIds = snapshot.adapterSwitchReadiness.batches
      .find((batch) => batch.id === nextAdapterSwitchBatchId)
      ?.surfaces.map((surface) => surface.id) ?? [];
    const nextAdapterSwitchSurfaceId = readInitialAdapterSwitchSurfaceId(
      nextAdapterSwitchSurfaceIds[0] ?? "",
      nextAdapterSwitchSurfaceIds,
    );
    const nextHostedActivationStepId = readInitialHostedActivationStepId(
      snapshot.hostedActivationRunbook.defaultStepId,
      hostedActivationStepIds,
    );
    const nextHostedSmokeEvidenceBatchId = readInitialHostedSmokeEvidenceBatchId(
      hostedSmokeEvidenceBatchIds[0] ?? "",
      hostedSmokeEvidenceBatchIds,
    );
    setActiveTab((current) => (current === nextTab ? current : nextTab));
    setClientWebsiteStudioSiteKey((current) => (current === nextSiteKey ? current : nextSiteKey));
    setClientWebsiteStudioLane((current) => (current === nextLane ? current : nextLane));
    setClientWebsiteWorkbenchStage((current) => (current === nextStage ? current : nextStage));
    setClientWebsiteLaunchDossier((current) => (current === nextDossier ? current : nextDossier));
    setAdapterSwitchBatchId((current) => (current === nextAdapterSwitchBatchId ? current : nextAdapterSwitchBatchId));
    setAdapterSwitchSurfaceId((current) => (current === nextAdapterSwitchSurfaceId ? current : nextAdapterSwitchSurfaceId));
    setHostedActivationStepId((current) => (current === nextHostedActivationStepId ? current : nextHostedActivationStepId));
    setHostedSmokeEvidenceBatchId((current) => (current === nextHostedSmokeEvidenceBatchId ? current : nextHostedSmokeEvidenceBatchId));
  }, [
    adapterSwitchBatchIds,
    clientWebsiteStudioSiteKeys,
    hostedActivationStepIds,
    hostedSmokeEvidenceBatchIds,
    location,
    snapshot.adapterSwitchReadiness.batches,
    snapshot.adapterSwitchReadiness.defaultBatchId,
    snapshot.clientWebsiteStudio.defaultSiteKey,
    snapshot.hostedActivationRunbook.defaultStepId,
  ]);

  useEffect(() => {
    if (activeTab !== "hosted-activation" || typeof window === "undefined") {
      return;
    }
    const hasSmokeEvidenceParam = new URLSearchParams(window.location.search).has("smokeEvidence");
    if (!hasSmokeEvidenceParam) {
      return;
    }
    window.setTimeout(() => {
      document
        .querySelector('[data-testid="section-kinflo-hosted-smoke-evidence-focus"]')
        ?.scrollIntoView({ block: "start" });
    }, 250);
  }, [activeTab, hostedSmokeEvidenceBatchId, location]);

  const updateKinfloShellRoute = (updates: Record<string, string | undefined>) => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const query = params.toString();
    navigate(query ? `/admin/kinflo-os?${query}` : "/admin/kinflo-os");
  };

  const selectShellTab = (tab: ShellTabValue) => {
    setActiveTab(tab);
    const shouldKeepDossier = tab === "site-studio"
      && clientWebsiteStudioLane === "workbench"
      && clientWebsiteWorkbenchStage === "launch";
    updateKinfloShellRoute({
      tab,
      studioSite: tab === "site-studio" ? clientWebsiteStudioSiteKey : undefined,
      studioLane: tab === "site-studio" ? clientWebsiteStudioLane : undefined,
      studioStage: tab === "site-studio" && clientWebsiteStudioLane === "workbench" ? clientWebsiteWorkbenchStage : undefined,
      studioDossier: shouldKeepDossier ? clientWebsiteLaunchDossier : undefined,
      adapterBatch: tab === "adapter-switch" ? adapterSwitchBatchId : undefined,
      adapterSurface: tab === "adapter-switch" ? adapterSwitchSurfaceId : undefined,
      activationStep: tab === "hosted-activation" ? hostedActivationStepId : undefined,
      smokeEvidence: tab === "hosted-activation" ? hostedSmokeEvidenceBatchId : undefined,
    });
  };

  const selectClientWebsiteStudioSite = (siteKey: string) => {
    setActiveTab("site-studio");
    setClientWebsiteStudioSiteKey(siteKey);
    updateKinfloShellRoute({
      tab: "site-studio",
      studioSite: siteKey,
      studioLane: clientWebsiteStudioLane,
      studioStage: clientWebsiteStudioLane === "workbench" ? clientWebsiteWorkbenchStage : undefined,
      studioDossier: clientWebsiteStudioLane === "workbench" && clientWebsiteWorkbenchStage === "launch" ? clientWebsiteLaunchDossier : undefined,
      adapterBatch: undefined,
      adapterSurface: undefined,
      activationStep: undefined,
      smokeEvidence: undefined,
    });
  };

  const selectClientWebsiteStudioLane = (lane: ClientWebsiteStudioLane) => {
    setActiveTab("site-studio");
    setClientWebsiteStudioLane(lane);
    updateKinfloShellRoute({
      tab: "site-studio",
      studioSite: clientWebsiteStudioSiteKey,
      studioLane: lane,
      studioStage: lane === "workbench" ? clientWebsiteWorkbenchStage : undefined,
      studioDossier: lane === "workbench" && clientWebsiteWorkbenchStage === "launch" ? clientWebsiteLaunchDossier : undefined,
      adapterBatch: undefined,
      adapterSurface: undefined,
      activationStep: undefined,
      smokeEvidence: undefined,
    });
  };

  const selectClientWebsiteWorkbenchStage = (stage: ClientWebsiteWorkbenchStage) => {
    setActiveTab("site-studio");
    setClientWebsiteStudioLane("workbench");
    setClientWebsiteWorkbenchStage(stage);
    updateKinfloShellRoute({
      tab: "site-studio",
      studioSite: clientWebsiteStudioSiteKey,
      studioLane: "workbench",
      studioStage: stage,
      studioDossier: stage === "launch" ? clientWebsiteLaunchDossier : undefined,
      adapterBatch: undefined,
      adapterSurface: undefined,
      activationStep: undefined,
      smokeEvidence: undefined,
    });
  };

  const selectClientWebsiteLaunchDossier = (dossier: ClientWebsiteLaunchDossier) => {
    setActiveTab("site-studio");
    setClientWebsiteStudioLane("workbench");
    setClientWebsiteWorkbenchStage("launch");
    setClientWebsiteLaunchDossier(dossier);
    updateKinfloShellRoute({
      tab: "site-studio",
      studioSite: clientWebsiteStudioSiteKey,
      studioLane: "workbench",
      studioStage: "launch",
      studioDossier: dossier,
      adapterBatch: undefined,
      adapterSurface: undefined,
      activationStep: undefined,
      smokeEvidence: undefined,
    });
  };

  const selectAdapterSwitchBatch = (batchId: string) => {
    const batch = snapshot.adapterSwitchReadiness.batches.find((item) => item.id === batchId);
    const surfaceId = batch?.surfaces[0]?.id ?? "";
    setActiveTab("adapter-switch");
    setAdapterSwitchBatchId(batchId);
    setAdapterSwitchSurfaceId(surfaceId);
    updateKinfloShellRoute({
      tab: "adapter-switch",
      studioSite: undefined,
      studioLane: undefined,
      studioStage: undefined,
      studioDossier: undefined,
      adapterBatch: batchId,
      adapterSurface: surfaceId,
      activationStep: undefined,
      smokeEvidence: undefined,
    });
  };

  const selectAdapterSwitchSurface = (surfaceId: string) => {
    setActiveTab("adapter-switch");
    setAdapterSwitchSurfaceId(surfaceId);
    updateKinfloShellRoute({
      tab: "adapter-switch",
      studioSite: undefined,
      studioLane: undefined,
      studioStage: undefined,
      studioDossier: undefined,
      adapterBatch: adapterSwitchBatchId,
      adapterSurface: surfaceId,
      activationStep: undefined,
      smokeEvidence: undefined,
    });
  };

  const selectHostedActivationStep = (stepId: string) => {
    setActiveTab("hosted-activation");
    setHostedActivationStepId(stepId);
    updateKinfloShellRoute({
      tab: "hosted-activation",
      studioSite: undefined,
      studioLane: undefined,
      studioStage: undefined,
      studioDossier: undefined,
      adapterBatch: undefined,
      adapterSurface: undefined,
      activationStep: stepId,
      smokeEvidence: hostedSmokeEvidenceBatchId,
    });
  };

  const selectHostedSmokeEvidenceBatch = (batchId: string) => {
    setActiveTab("hosted-activation");
    setHostedSmokeEvidenceBatchId(batchId);
    updateKinfloShellRoute({
      tab: "hosted-activation",
      studioSite: undefined,
      studioLane: undefined,
      studioStage: undefined,
      studioDossier: undefined,
      adapterBatch: undefined,
      adapterSurface: undefined,
      activationStep: hostedActivationStepId,
      smokeEvidence: batchId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading shell...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white/95">
        <div className={`mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:px-8 ${activeTab === "site-studio" ? "gap-2 py-3" : "gap-5 py-6"}`}>
          <Breadcrumbs items={[{ label: "Admin Dashboard", href: "/admin" }, { label: "KinFlo OS" }]} />
          <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between ${activeTab === "site-studio" ? "gap-2" : "gap-4"}`}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-slate-950 text-white hover:bg-slate-950">Convex Phase 1</Badge>
                <Badge variant="outline" className="border-slate-300 bg-white">Provider-light shell</Badge>
              </div>
              <h1 className={`${activeTab === "site-studio" ? "mt-2 text-2xl sm:text-3xl" : "mt-3 text-3xl sm:text-4xl"} font-semibold leading-tight tracking-normal`}>KinFlo OS</h1>
              <p className={`${activeTab === "site-studio" ? "hidden" : "mt-2"} max-w-3xl text-base leading-7 text-slate-600`}>
                The operating shell for tenants, sites, templates, permissions, and configurable public experiences.
              </p>
            </div>
            <div className={`${activeTab === "site-studio" ? "hidden sm:flex" : "flex"} flex-wrap gap-2`}>
              <Button className="bg-slate-950 hover:bg-slate-800" onClick={() => selectShellTab("factory")} data-testid="button-create-tenant">
                <Plus className="mr-2 h-4 w-4" />
                New Tenant
              </Button>
              <Button variant="outline" className="border-slate-300 bg-white" onClick={() => selectShellTab("factory")} data-testid="button-create-site">
                <Globe2 className="mr-2 h-4 w-4" />
                New Site
              </Button>
            </div>
          </div>
          <div
            className={`${activeTab === "site-studio" ? "hidden" : "grid"} min-w-0 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]`}
            data-testid="section-kinflo-active-object-signal"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                  {snapshot.activeObjectSignal.objectType}
                </Badge>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  {snapshot.activeObjectSignal.environment}
                </Badge>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {snapshot.activeObjectSignal.readinessLabel}
                </Badge>
                <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                  Owner: {snapshot.activeObjectSignal.owner}
                </Badge>
              </div>
              <div className="mt-2 truncate text-base font-semibold leading-tight text-slate-950" data-testid="text-kinflo-active-object-name">
                {snapshot.activeObjectSignal.label}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-active-object-next-decision">
                {snapshot.activeObjectSignal.nextDecision}
              </p>
            </div>
            <div className="min-w-0 rounded-md border border-amber-200 bg-white p-3" data-testid="section-kinflo-active-object-unblock-condition">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-50 hover:text-amber-900"
                disabled
                data-testid="button-active-object-live-gated"
              >
                <ShieldCheck className="mr-2 h-3 w-3" />
                {snapshot.activeObjectSignal.disabledActionLabel}
              </Button>
              <p className="mt-2 text-xs leading-5 text-amber-900" data-testid="text-kinflo-active-object-disabled-reason">
                {snapshot.activeObjectSignal.disabledActionReason}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className={`mx-auto w-full max-w-7xl overflow-x-hidden px-4 sm:px-6 lg:px-8 ${activeTab === "site-studio" ? "py-3" : "py-7"}`}>
        <section
          className={`grid rounded-lg border border-slate-200 bg-white shadow-sm ${
            activeTab === "site-studio"
              ? "hidden"
              : "gap-5 p-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:p-6"
          }`}
          data-testid="section-kinflo-command-brief"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 hover:bg-emerald-50">Command Brief</Badge>
              <Badge variant="outline" className="border-slate-300 bg-white">{snapshot.dataMode.runtimeLabel}</Badge>
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{snapshot.activeObjectSignal.environment}</Badge>
            </div>
            <h2 className={`${activeTab === "site-studio" ? "mt-2 text-lg" : "mt-4 text-2xl md:text-3xl"} max-w-3xl font-semibold leading-tight tracking-normal`}>
              {commandBrief.decision}
            </h2>
            <p className={`${activeTab === "site-studio" ? "hidden" : "mt-3"} max-w-3xl text-sm leading-6 text-slate-600`}>
              {commandBrief.headline}: {commandBrief.blocker}
            </p>
            <div className={`${activeTab === "site-studio" ? "hidden" : "mt-5 rounded-md border border-slate-200 bg-slate-50 p-4"}`} data-testid="section-kinflo-active-object-detail">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase tracking-normal text-slate-500">{snapshot.activeObjectSignal.objectType}</div>
                  <div className="mt-1 truncate text-lg font-semibold leading-tight text-slate-950">
                    {snapshot.activeObjectSignal.label}
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {snapshot.activeObjectSignal.environmentDetail}
                  </p>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-72">
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">Readiness</div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">{snapshot.activeObjectSignal.readinessLabel}</div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">Owner</div>
                    <div className="mt-1 truncate text-sm font-semibold text-slate-950">{snapshot.activeObjectSignal.owner}</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Next decision</div>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {snapshot.activeObjectSignal.nextDecision}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {snapshot.activeObjectSignal.requiredEvidence.map((item) => (
                      <Badge key={item} variant="outline" className="border-slate-200 bg-white text-slate-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="min-w-0 rounded-md border border-amber-200 bg-amber-50 p-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full border-amber-300 bg-white text-amber-900 hover:bg-white hover:text-amber-900"
                    disabled
                    data-testid="button-active-object-live-detail-gated"
                  >
                    <ShieldCheck className="mr-2 h-3 w-3" />
                    {snapshot.activeObjectSignal.disabledActionLabel}
                  </Button>
                  <p className="mt-2 text-xs leading-5 text-amber-900">
                    {snapshot.activeObjectSignal.disabledActionReason}
                  </p>
                </div>
              </div>
            </div>
            <div className={`${activeTab === "site-studio" ? "mt-2" : "mt-4"} flex flex-wrap gap-2`}>
              {commandBrief.proof.map((item) => (
                <Badge key={item} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-slate-900 bg-slate-950 p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-300">Next gate</div>
                <p className="mt-1 text-lg font-semibold leading-tight">{commandBrief.nextGate?.label}</p>
              </div>
              {commandBrief.nextGate ? hostedActivationStatusBadge(commandBrief.nextGate.status) : null}
            </div>
            <p className={`${activeTab === "site-studio" ? "hidden" : "mt-3"} text-sm leading-6 text-slate-300`}>{commandBrief.nextGate?.evidenceTarget}</p>
            <div className={`${activeTab === "site-studio" ? "hidden" : "mt-4 rounded-md border border-white/10 bg-white/5 p-3"}`} data-testid="section-kinflo-active-object-unblock-detail">
              <div className="text-xs font-medium uppercase tracking-normal text-slate-400">Unblock condition</div>
              <p className="mt-1 text-sm leading-6 text-slate-300">{snapshot.activeObjectSignal.unblockCondition}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {snapshot.activeObjectSignal.blockedLiveActions.map((action) => (
                  <Badge key={action} variant="outline" className="border-slate-700 bg-slate-900 text-slate-200">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
            <div className={`${activeTab === "site-studio" ? "mt-3 grid-cols-3" : "mt-4 sm:grid-cols-3"} grid gap-2`}>
              <Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" onClick={() => selectShellTab("launch-readiness")}>
                <Rocket className="mr-2 h-3 w-3" />
                Launch
              </Button>
              <Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" onClick={() => selectShellTab("adapter-switch")}>
                <Workflow className="mr-2 h-3 w-3" />
                Switch
              </Button>
              <Button size="sm" className="bg-white text-slate-950 hover:bg-slate-200" onClick={() => selectShellTab("hosted-activation")}>
                <KeyRound className="mr-2 h-3 w-3" />
                Activation
              </Button>
            </div>
          </div>
        </section>

        <div className={`${activeTab === "site-studio" ? "hidden" : "mt-5 grid"} gap-3 md:grid-cols-2 xl:grid-cols-5`}>
          {snapshot.metrics.map((metric) => {
            const Icon = metricIcons[metric.iconKey];
            return (
              <Card key={metric.label} className="border-slate-200 bg-white shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-normal text-slate-500">{metric.label}</CardTitle>
                  <Icon className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tracking-normal">{metric.value}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{metric.detail}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className={`${activeTab === "site-studio" ? "hidden" : "mt-5"} border-slate-200 bg-white shadow-none`}>
          <CardHeader className="flex flex-col gap-3 space-y-0 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">Data Mode</CardTitle>
                <Badge variant="outline">{snapshot.dataMode.label}</Badge>
                <Badge variant="secondary">{snapshot.dataMode.runtimeLabel}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                {snapshot.dataMode.description}
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              {snapshot.dataMode.runtimeMode === "live_ready" ? "Convex live" : "Convex gated"}
            </Badge>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
            <div className="min-w-0">
              <div className="text-sm font-medium">Activation gate</div>
              <p className="mt-1 text-sm text-muted-foreground">{snapshot.dataMode.activationGate}</p>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">Convex contract</div>
              <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                {snapshot.dataMode.convexFunctions.slice(0, 8).map((functionName) => (
                  <Badge key={functionName} variant="secondary">{functionName}</Badge>
                ))}
                {snapshot.dataMode.convexFunctions.length > 8 ? (
                  <Badge variant="outline">+{snapshot.dataMode.convexFunctions.length - 8} more mapped</Badge>
                ) : null}
              </div>
            </div>
            <div className="min-w-0 lg:col-span-2">
              <div className="text-sm font-medium">Live adapter readiness</div>
              <div className="mt-2 grid gap-3 md:hidden">
                {snapshot.liveAdapterBindings.map((binding) => (
                  <div key={binding.surface} className="rounded-md border p-3 text-sm">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
                      <div>
                        <div className="font-medium">{binding.surface}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{binding.fixtureSource}</div>
                      </div>
                      {liveAdapterStatusBadge(binding.status)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {binding.convexFunctions.map((functionName) => (
                        <Badge key={functionName} variant="secondary" className="max-w-full whitespace-normal break-all text-left">{functionName}</Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {binding.activationEvidence.map((item) => (
                        <Badge key={item} variant="outline" className="max-w-full whitespace-normal break-words text-left">{item}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 hidden rounded-md border md:block">
                <Table className="min-w-[920px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Surface</TableHead>
                      <TableHead>Fixture source</TableHead>
                      <TableHead>Convex functions</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.liveAdapterBindings.map((binding) => (
                      <TableRow key={binding.surface}>
                        <TableCell className="font-medium">{binding.surface}</TableCell>
                        <TableCell>{binding.fixtureSource}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {binding.convexFunctions.map((functionName) => (
                              <Badge key={functionName} variant="secondary">{functionName}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {binding.activationEvidence.map((item) => (
                              <Badge key={item} variant="outline">{item}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{liveAdapterStatusBadge(binding.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => selectShellTab(value as ShellTabValue)} className={`${activeTab === "site-studio" ? "mt-1" : "mt-7"} min-w-0`}>
          <section
            className={`${activeTab === "site-studio" ? "mb-1 rounded-md px-2 py-1.5" : "mb-3 rounded-2xl p-3"} border border-slate-200 bg-white shadow-sm`}
            data-testid="section-kinflo-workflow-navigation-rail"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className={`${activeTab === "site-studio" ? "text-xs" : "text-sm"} font-semibold text-slate-950`}>Workflow navigation</div>
                <p className={`${activeTab === "site-studio" ? "hidden" : "mt-1"} text-xs leading-5 text-slate-500`}>
                  Control, Build, Launch, Growth, Evidence, and Hosted Activation group every existing tab by work mode.
                </p>
              </div>
              <Badge variant="outline" className={`${activeTab === "site-studio" ? "text-[11px]" : ""} self-start border-amber-200 bg-amber-50 text-amber-700`}>
                {workflowNavigationTabCoverage.length}/{shellTabValues.length} tabs reachable
              </Badge>
            </div>
            <div className={`${activeTab === "site-studio" ? "hidden" : "mt-3 grid"} gap-2 md:grid-cols-2 xl:grid-cols-3`} data-testid="section-kinflo-workflow-navigation-lanes">
              {workflowNavigationLanes.map((lane) => {
                const LaneIcon = lane.icon;
                const isActiveLane = lane.tabs.includes(activeTab);
                const laneTone = lane.status === "blocked"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : lane.status === "ready"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-slate-50 text-slate-800";

                return (
                  <button
                    key={lane.key}
                    type="button"
                    onClick={() => selectShellTab(lane.primaryTab)}
                    aria-pressed={isActiveLane}
                    className={`min-w-0 rounded-xl border p-3 text-left transition ${
                      isActiveLane
                        ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    data-testid={`button-kinflo-workflow-lane-${lane.key}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2">
                        <div className={`mt-0.5 rounded-lg border p-1.5 ${isActiveLane ? "border-white/10 bg-white/10 text-white" : laneTone}`}>
                          <LaneIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{lane.label}</div>
                          <div className={`mt-1 line-clamp-2 text-xs leading-5 ${isActiveLane ? "text-slate-300" : "text-slate-500"}`}>
                            {lane.description}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={isActiveLane ? "shrink-0 border-white/10 bg-white/10 text-white" : "shrink-0 bg-white"}
                      >
                        {lane.tabs.length}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5" data-testid={`section-kinflo-workflow-lane-tabs-${lane.key}`}>
                      {lane.tabs.map((tabValue) => (
                        <span
                          key={tabValue}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${
                            activeTab === tabValue
                              ? isActiveLane
                                ? "border-emerald-200/30 bg-emerald-300/20 text-emerald-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : isActiveLane
                                ? "border-white/10 bg-white/10 text-slate-200"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                          data-testid={`dot-kinflo-workflow-lane-${lane.key}-${tabValue}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              activeTab === tabValue ? "bg-emerald-400" : lane.status === "blocked" ? "bg-amber-400" : "bg-slate-300"
                            }`}
                          />
                          {shellTabLabels[tabValue]}
                        </span>
                      ))}
                    </div>
                    <div className={`mt-3 text-xs leading-5 ${isActiveLane ? "text-amber-100" : "text-amber-700"}`}>
                      {lane.blockedLiveAction}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className={`${activeTab === "site-studio" ? "hidden sm:block" : "block"} w-full min-w-0 overflow-x-auto rounded-md border border-slate-200 bg-white`}>
            <TabsList className={`${activeTab === "site-studio" ? "p-0.5" : "p-1"} flex h-auto min-w-max justify-start gap-1 bg-white`}>
            {shellTabValues.map((tabValue) => (
              <TabsTrigger key={tabValue} className="shrink-0" value={tabValue}>
                {shellTabLabels[tabValue]}
              </TabsTrigger>
            ))}
            </TabsList>
          </div>

          <TabsContent value="tenants" className="mt-6">
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Tenant Control Plane</h2>
                  <p className="text-sm text-muted-foreground">Tenant records, membership scope, and site ownership.</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/admin/role-provisioning">
                    <UserRoundCog className="mr-2 h-4 w-4" />
                    Roles
                  </Link>
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Sites</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-right">State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.tenants.map((tenant) => (
                      <TableRow key={tenant.slug}>
                        <TableCell>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                        </TableCell>
                        <TableCell>{tenant.plan}</TableCell>
                        <TableCell>{tenant.sites}</TableCell>
                        <TableCell>{tenant.owner}</TableCell>
                        <TableCell className="text-right">{statusBadge(tenant.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="sites" className="mt-6">
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Site Factory Queue</h2>
                  <p className="text-sm text-muted-foreground">Site creation, templates, publishing, and public resolution.</p>
                </div>
                <Button variant="outline" disabled>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead className="text-right">State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.sites.map((site) => (
                      <TableRow key={`${site.tenant}-${site.name}`}>
                        <TableCell>
                          <div className="font-medium">{site.name}</div>
                          <div className="text-xs text-muted-foreground">{site.route}</div>
                        </TableCell>
                        <TableCell>{site.tenant}</TableCell>
                        <TableCell>{site.domain}</TableCell>
                        <TableCell>{site.template}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={site.previewPath}>
                              <ExternalLink className="mr-2 h-3 w-3" />
                              Open
                            </Link>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">{statusBadge(site.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="launch-readiness" className="mt-6">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Launch Readiness</h2>
                    <p className="text-sm text-muted-foreground">One review packet for the client website launch path across setup, access, content, preview, CRM, domains, providers, campaigns, and AI review.</p>
                  </div>
                  <Badge variant="outline">
                    <ListChecks className="mr-1 h-3 w-3" />
                    Read-only
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle className="text-base">Client Site Launch Packet</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedLaunchReadinessSite?.tenant}</p>
                    </div>
                    <div className="w-full lg:w-[280px]">
                      <Label>Site</Label>
                      <Select value={launchReadinessSiteKey} onValueChange={setLaunchReadinessSiteKey}>
                        <SelectTrigger className="mt-2" data-testid="select-kinflo-launch-readiness-site">
                          <SelectValue placeholder="Select launch site" />
                        </SelectTrigger>
                        <SelectContent>
                          {snapshot.launchReadiness.siteOptions.map((site) => (
                            <SelectItem key={site.key} value={site.key}>
                              {site.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="rounded-md border p-4">
                        <div className="text-sm font-medium">Launch readiness</div>
                        <div className="mt-3 text-3xl font-bold" data-testid="text-kinflo-launch-readiness-status">
                          {selectedLaunchReadinessSite?.readinessPercent ?? 0}%
                        </div>
                        <Progress value={selectedLaunchReadinessSite?.readinessPercent ?? 0} className="mt-3" />
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary">{launchReadinessCounts.ready} ready</Badge>
                          <Badge variant="outline">{launchReadinessCounts.pending} pending</Badge>
                          <Badge variant={launchReadinessCounts.blocked > 0 ? "destructive" : "outline"}>
                            {launchReadinessCounts.blocked} blocked
                          </Badge>
                        </div>
                      </div>
                      <div className="rounded-md border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-sm font-medium">{selectedLaunchReadinessSite?.label}</div>
                            <p className="mt-2 text-sm text-muted-foreground" data-testid="text-kinflo-launch-readiness-blocker">
                              {selectedLaunchReadinessSite?.blockerSummary}
                            </p>
                          </div>
                          <Badge variant={selectedLaunchReadinessSite?.launchDecision === "ready_for_review" ? "secondary" : "outline"}>
                            {selectedLaunchReadinessSite?.launchDecision.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" asChild data-testid="button-open-launch-preview">
                            <Link href={selectedLaunchReadinessSite?.previewPath ?? "/admin/kinflo-os"}>
                              <ExternalLink className="mr-2 h-3 w-3" />
                              Open preview
                            </Link>
                          </Button>
                          <Button size="sm" disabled data-testid="button-live-launch-gated">
                            <Rocket className="mr-2 h-3 w-3" />
                            Live launch gated
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3 border-b px-4 py-3 text-sm font-medium md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_120px]">
                        <span>Stage</span>
                        <span className="hidden md:block">Evidence</span>
                        <span>Status</span>
                      </div>
                      <div className="divide-y">
                        {(selectedLaunchReadinessSite?.stages ?? []).map((stage) => (
                          <div key={stage.key} className="grid grid-cols-[minmax(0,1fr)_96px] gap-3 px-4 py-3 text-sm md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_120px]">
                            <div className="min-w-0">
                              <div className="font-medium">{stage.label}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{stage.surface} · {stage.owner}</div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {stage.convexFunctions.map((functionName) => (
                                  <Badge key={functionName} variant="secondary" className="max-w-full whitespace-normal break-all text-left">{functionName}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="hidden min-w-0 text-muted-foreground md:block">
                              <div>{stage.evidence}</div>
                              <div className="mt-1 text-xs">{stage.gate}</div>
                            </div>
                            <div>{launchReadinessStatusBadge(stage.status)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border p-4 text-sm text-muted-foreground">
                      {snapshot.launchReadiness.providerBoundary}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <DecisionGateRail
                  title="Launch decision gate"
                  owner={selectedLaunchReadinessSite?.stages.find((stage) => stage.status === "blocked")?.owner
                    ?? selectedLaunchReadinessSite?.stages[0]?.owner
                    ?? "Vambah"}
                  posture={selectedLaunchReadinessSite?.blockerSummary ?? snapshot.launchReadiness.providerBoundary}
                  evidence={snapshot.launchReadiness.activationEvidence}
                  rollback="Keep the public site on provider-light preview, block live lead writes, and hold client handoff until launch evidence is accepted."
                  blockedActions={["publish client site", "write live lead", "send campaign traffic", "attach production domain"]}
                  disabledActionLabel="Live launch remains gated"
                  testId="section-kinflo-launch-decision-gate-rail"
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Launch Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">The launch packet is a read-only query contract until generated API bindings and live smoke are approved.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.launchReadiness.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span className="min-w-0 break-all">{functionName}</span>
                        <Badge variant="outline">Mapped</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activation Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.launchReadiness.activationEvidence.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="adapter-switch" className="mt-6">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Adapter Switch Readiness</h2>
                    <p className="text-sm text-muted-foreground">
                      Review the controlled order for replacing fixture surfaces with generated Convex API bindings after hosted approval.
                    </p>
                  </div>
                  <Badge variant="outline">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Provider-light
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">Fixture-To-Live Switch Packet</CardTitle>
                        <Badge variant="secondary">{snapshot.adapterSwitchReadiness.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{snapshot.adapterSwitchReadiness.providerBoundary}</p>
                    </div>
                    <div className="grid w-full gap-3 lg:w-[360px]">
                      <div>
                        <Label>Switch batch</Label>
                        <Select value={adapterSwitchBatchId} onValueChange={selectAdapterSwitchBatch}>
                          <SelectTrigger className="mt-2" data-testid="select-kinflo-adapter-switch-batch">
                            <SelectValue placeholder="Select switch batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.adapterSwitchReadiness.batches.map((batch) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.order}. {batch.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Focus surface</Label>
                        <Select value={selectedAdapterSwitchSurface?.id ?? ""} onValueChange={selectAdapterSwitchSurface}>
                          <SelectTrigger className="mt-2" data-testid="select-kinflo-adapter-switch-surface">
                            <SelectValue placeholder="Select switch surface" />
                          </SelectTrigger>
                          <SelectContent>
                            {(selectedAdapterSwitchBatch?.surfaces ?? []).map((surface) => (
                              <SelectItem key={surface.id} value={surface.id}>
                                {surface.surface}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-md border p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Surfaces</div>
                        <div className="mt-1 text-2xl font-semibold" data-testid="text-kinflo-adapter-switch-surfaces">
                          {adapterSwitchTotals.total}
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Switch blocked</div>
                        <div className="mt-1 text-2xl font-semibold">{adapterSwitchTotals.blocked}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Codegen pending</div>
                        <div className="mt-1 text-2xl font-semibold">{adapterSwitchTotals.generatedApiPending}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live calls blocked</div>
                        <div className="mt-1 text-2xl font-semibold">{adapterSwitchTotals.liveExecutionBlocked}</div>
                      </div>
                    </div>

                    <div className="rounded-md border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-medium">{selectedAdapterSwitchBatch?.label}</div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Batch {selectedAdapterSwitchBatch?.order} · {selectedAdapterSwitchBatch?.mode.replace(/_/g, " ")}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {selectedAdapterSwitchBatch?.surfaces.length ?? 0} surfaces
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" data-testid="section-kinflo-adapter-switch-surface-focus">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <MonitorSmartphone className="h-4 w-4 text-slate-500" />
                            <h3 className="text-sm font-semibold text-slate-950">{selectedAdapterSwitchSurface?.surface}</h3>
                            {selectedAdapterSwitchSurface ? liveAdapterStatusBadge(selectedAdapterSwitchSurface.status) : null}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-600" data-testid="text-kinflo-adapter-switch-surface-focus">
                            {selectedAdapterSwitchSurface?.fixtureSource}
                          </p>
                        </div>
                        <Button size="sm" disabled variant="outline" data-testid="button-adapter-switch-surface-focus-gated">
                          <Workflow className="mr-2 h-3 w-3" />
                          Surface switch gated
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="min-w-0 rounded-md border border-white bg-white p-3">
                          <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">Generated API contract</div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(selectedAdapterSwitchSurface?.convexFunctions ?? []).map((functionName) => (
                              <Badge key={functionName} variant="secondary" className="max-w-full whitespace-normal break-all text-left text-[11px]">
                                {functionName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="min-w-0 rounded-md border border-white bg-white p-3">
                          <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">Smoke evidence required</div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(selectedAdapterSwitchSurface?.requiredSmokeEvidence ?? []).map((item) => (
                              <Badge key={item} variant="outline" className="max-w-full whitespace-normal break-words text-left text-[11px]">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                          <div className="text-slate-500">Switch allowed</div>
                          <div className="mt-1 font-semibold text-slate-950">{selectedAdapterSwitchSurface?.switchAllowed ? "yes" : "no"}</div>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                          <div className="text-slate-500">Provider writes</div>
                          <div className="mt-1 font-semibold text-slate-950">{selectedAdapterSwitchSurface?.providerWrites ? "yes" : "no"}</div>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                          <div className="text-slate-500">Live Convex</div>
                          <div className="mt-1 font-semibold text-slate-950">{selectedAdapterSwitchSurface?.liveConvexExecution ? "yes" : "no"}</div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                        <span className="font-medium text-amber-950">Rollback: </span>
                        {selectedAdapterSwitchSurface?.rollback}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4" data-testid="section-kinflo-adapter-switch-runway">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Workflow className="h-4 w-4 text-slate-500" />
                            <h3 className="text-sm font-semibold">Fixture-to-live runway</h3>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-600" data-testid="text-kinflo-adapter-switch-runway">
                            Every batch remains fixture-backed until its entry gate, smoke evidence, and rollback owner are accepted.
                          </p>
                        </div>
                        <Badge variant="outline">{snapshot.adapterSwitchReadiness.runwaySteps.length} gated steps</Badge>
                      </div>

                      <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3" data-testid="section-kinflo-adapter-switch-runway-scroll">
                        {snapshot.adapterSwitchReadiness.runwaySteps.map((step) => (
                          <div
                            key={step.batchId}
                            className={`rounded-md border p-3 ${step.batchId === selectedAdapterSwitchBatch?.id ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}
                            data-testid={`card-adapter-switch-runway-${step.batchId}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">Step {step.order}</div>
                                <div className="mt-1 text-sm font-semibold text-slate-950">{step.label}</div>
                                <div className="mt-1 text-xs text-slate-600">{step.stage}</div>
                              </div>
                              <Badge variant={step.canAdvance ? "secondary" : "outline"} className="shrink-0">
                                {step.canAdvance ? "ready" : "gated"}
                              </Badge>
                            </div>

                            <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                              <span className="font-medium text-slate-900">Gate: </span>
                              {step.entryGate}
                            </div>

                            <div className="mt-3 space-y-2">
                              {step.exitEvidence.slice(0, 2).map((item) => (
                                <div key={item} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                                  <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-md border border-slate-100 px-2 py-1">
                                <div className="text-slate-500">Live Convex</div>
                                <div className="font-medium text-slate-900">{step.liveConvexExecution ? "yes" : "no"}</div>
                              </div>
                              <div className="rounded-md border border-slate-100 px-2 py-1">
                                <div className="text-slate-500">Provider writes</div>
                                <div className="font-medium text-slate-900">{step.providerWrites ? "yes" : "no"}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4" data-testid="section-kinflo-adapter-switch-acceptance-matrix">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-slate-500" />
                            <h3 className="text-sm font-semibold">Switch Acceptance Matrix</h3>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-600" data-testid="text-kinflo-adapter-switch-acceptance-matrix">
                            Each batch must have generated contract coverage, hosted smoke coverage, rollback proof, and owner approval before the fixture adapter can be replaced.
                          </p>
                        </div>
                        <Badge variant="outline">
                          {snapshot.adapterSwitchReadiness.acceptanceMatrix.length} batches
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900" data-testid="card-adapter-switch-selected-acceptance">
                          <div className="font-semibold">{selectedAdapterSwitchAcceptance?.label}</div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="rounded-md border border-amber-200 bg-white px-2 py-1">
                              <div className="text-amber-700">Functions</div>
                              <div className="font-semibold text-amber-950">{selectedAdapterSwitchAcceptance?.functionCount}</div>
                            </div>
                            <div className="rounded-md border border-amber-200 bg-white px-2 py-1">
                              <div className="text-amber-700">Smoke gaps</div>
                              <div className="font-semibold text-amber-950">{selectedAdapterSwitchAcceptance?.smokeMissingFunctions.length}</div>
                            </div>
                            <div className="rounded-md border border-amber-200 bg-white px-2 py-1">
                              <div className="text-amber-700">Contract</div>
                              <div className="font-semibold text-amber-950">{selectedAdapterSwitchAcceptance?.generatedContractCoverage}</div>
                            </div>
                            <div className="rounded-md border border-amber-200 bg-white px-2 py-1">
                              <div className="text-amber-700">Switch</div>
                              <div className="font-semibold text-amber-950">{selectedAdapterSwitchAcceptance?.canSwitch ? "ready" : "blocked"}</div>
                            </div>
                          </div>
                          <div className="mt-3 rounded-md bg-white p-2">
                            <span className="font-medium text-amber-950">Next gate: </span>
                            {selectedAdapterSwitchAcceptance?.nextHumanGate}
                          </div>
                        </div>

                        <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1 md:grid-cols-2" data-testid="section-kinflo-adapter-switch-acceptance-scroll">
                          {snapshot.adapterSwitchReadiness.acceptanceMatrix.map((batch) => (
                            <div
                              key={batch.batchId}
                              className={`rounded-md border p-3 ${batch.batchId === selectedAdapterSwitchBatch?.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}
                              data-testid={`card-adapter-switch-acceptance-${batch.batchId}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">Batch {batch.order}</div>
                                  <div className="mt-1 text-sm font-semibold text-slate-950">{batch.label}</div>
                                  <div className="mt-1 text-xs text-slate-600">{batch.surfaceCount} surfaces · {batch.functionCount} functions</div>
                                </div>
                                <Badge variant={batch.canSwitch ? "secondary" : "outline"} className="shrink-0">
                                  {batch.canSwitch ? "ready" : batch.acceptancePosture.replaceAll("_", " ")}
                                </Badge>
                              </div>

                              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                <div className="rounded-md border border-slate-100 px-2 py-1">
                                  <div className="text-slate-500">Contract</div>
                                  <div className="font-medium text-slate-950">{batch.generatedContractCoverage}</div>
                                </div>
                                <div className="rounded-md border border-slate-100 px-2 py-1">
                                  <div className="text-slate-500">Covered</div>
                                  <div className="font-medium text-slate-950">{batch.smokeCoveredFunctions}</div>
                                </div>
                                <div className="rounded-md border border-slate-100 px-2 py-1">
                                  <div className="text-slate-500">Gaps</div>
                                  <div className="font-medium text-slate-950">{batch.smokeMissingFunctions.length}</div>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-1">
                                {batch.smokeMissingFunctions.slice(0, 3).map((functionName) => (
                                  <Badge key={functionName} variant="outline" className="max-w-full whitespace-normal break-all text-left text-[11px]">
                                    {functionName}
                                  </Badge>
                                ))}
                                {batch.smokeMissingFunctions.length > 3 ? (
                                  <Badge variant="secondary" className="text-[11px]">
                                    +{batch.smokeMissingFunctions.length - 3} more
                                  </Badge>
                                ) : null}
                              </div>

                              <div className="mt-3 rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                                <span className="font-medium text-slate-900">Rollback: </span>
                                {batch.rollbackGate}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4" data-testid="section-kinflo-adapter-switch-cutover-checklist">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Command className="h-4 w-4 text-slate-500" />
                            <h3 className="text-sm font-semibold">Fixture-to-Live Cutover Checklist</h3>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-600" data-testid="text-kinflo-adapter-switch-cutover-checklist">
                            {snapshot.adapterSwitchReadiness.cutoverChecklist.approvalGate}
                          </p>
                        </div>
                        <Button disabled variant="outline" data-testid="button-adapter-switch-cutover-gated">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Cutover gated
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-5" data-testid="section-kinflo-adapter-switch-cutover-summary">
                        {[
                          { label: "Batches", value: snapshot.adapterSwitchReadiness.cutoverChecklist.totalBatches },
                          { label: "Surfaces", value: snapshot.adapterSwitchReadiness.cutoverChecklist.totalSurfaces },
                          { label: "Functions", value: snapshot.adapterSwitchReadiness.cutoverChecklist.totalFunctions },
                          { label: "Ready", value: snapshot.adapterSwitchReadiness.cutoverChecklist.readyBatches },
                          { label: "Blocked", value: snapshot.adapterSwitchReadiness.cutoverChecklist.blockedBatches },
                        ].map((item) => (
                          <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                            <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
                            <div className="mt-1 text-lg font-semibold text-slate-950">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid max-h-[560px] gap-3 overflow-y-auto pr-1 xl:grid-cols-2" data-testid="section-kinflo-adapter-switch-cutover-scroll">
                        {snapshot.adapterSwitchReadiness.cutoverChecklist.steps.map((step) => (
                          <div key={step.batchId} className="rounded-md border border-slate-200 bg-white p-3" data-testid={`card-adapter-switch-cutover-${step.batchId}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">Batch {step.order}</div>
                                <div className="mt-1 text-sm font-semibold text-slate-950">{step.label}</div>
                                <div className="mt-1 text-xs text-slate-600">{step.surfaceCount} surfaces · {step.functionCount} functions</div>
                              </div>
                              <Badge variant="outline" className="shrink-0 border-rose-200 bg-rose-50 text-rose-700">
                                {step.canCutover ? "ready" : "blocked"}
                              </Badge>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              <div className="rounded-md border border-slate-100 px-2 py-1">
                                <div className="text-slate-500">Import API</div>
                                <div className="font-medium text-slate-950">{step.canImportGeneratedApi ? "yes" : "no"}</div>
                              </div>
                              <div className="rounded-md border border-slate-100 px-2 py-1">
                                <div className="text-slate-500">API flag</div>
                                <div className="font-medium text-slate-950">{step.generatedApiAvailable ? "true" : "false"}</div>
                              </div>
                              <div className="rounded-md border border-slate-100 px-2 py-1">
                                <div className="text-slate-500">Live calls</div>
                                <div className="font-medium text-slate-950">{step.liveConvexExecution ? "yes" : "no"}</div>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                                <div className="text-xs font-medium text-slate-900">Entry criteria</div>
                                <div className="mt-2 space-y-1">
                                  {step.entryCriteria.map((item) => (
                                    <div key={item} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                                      <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                                <div className="text-xs font-medium text-emerald-900">Post-switch verification</div>
                                <div className="mt-2 space-y-1">
                                  {step.postSwitchVerification.map((item) => (
                                    <div key={item} className="flex items-start gap-2 text-xs leading-5 text-emerald-800">
                                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 rounded-md border border-rose-100 bg-rose-50 p-3">
                              <div className="text-xs font-medium text-rose-900">Rollback controls</div>
                              <div className="mt-2 space-y-1">
                                {step.rollbackControls.map((item) => (
                                  <div key={item} className="flex items-start gap-2 text-xs leading-5 text-rose-700">
                                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                              <span className="font-medium text-slate-900">Blocked until: </span>
                              {step.blockedUntil}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {snapshot.adapterSwitchReadiness.cutoverChecklist.sourceDocuments.map((documentPath) => (
                          <div key={documentPath} className="rounded-md border border-slate-200 px-3 py-2 text-xs">
                            <span className="break-all">{documentPath}</span>
                          </div>
                        ))}
                      </div>

                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        {snapshot.adapterSwitchReadiness.cutoverChecklist.providerBoundary}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {(selectedAdapterSwitchBatch?.surfaces ?? []).map((surface) => (
                        <div
                          key={surface.id}
                          className={`rounded-md border p-4 ${surface.id === selectedAdapterSwitchSurface?.id ? "border-slate-900 bg-slate-50" : "bg-white"}`}
                          data-testid={`card-adapter-switch-${surface.id}`}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-medium">{surface.surface}</h3>
                                {liveAdapterStatusBadge(surface.status)}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{surface.fixtureSource}</p>
                            </div>
                            <Button size="sm" disabled data-testid="button-adapter-switch-gated">
                              <Workflow className="mr-2 h-3 w-3" />
                              Live switch gated
                            </Button>
                          </div>

                          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <div className="min-w-0">
                              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Convex functions</div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {surface.convexFunctions.map((functionName) => (
                                  <Badge key={functionName} variant="secondary" className="max-w-full whitespace-normal break-all text-left">
                                    {functionName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Smoke evidence</div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {surface.requiredSmokeEvidence.map((item) => (
                                  <Badge key={item} variant="outline" className="max-w-full whitespace-normal break-words text-left">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                              <div className="text-xs text-muted-foreground">Switch allowed</div>
                              <div className="font-medium">{surface.switchAllowed ? "yes" : "no"}</div>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                              <div className="text-xs text-muted-foreground">Provider writes</div>
                              <div className="font-medium">{surface.providerWrites ? "yes" : "no"}</div>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                              <div className="text-xs text-muted-foreground">Live Convex execution</div>
                              <div className="font-medium">{surface.liveConvexExecution ? "yes" : "no"}</div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-md border p-3 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Rollback: </span>
                            {surface.rollback}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <DecisionGateRail
                  title="Adapter switch decision gate"
                  owner="Vambah / platform.super_admin"
                  posture={`${selectedAdapterSwitchBatch?.label ?? "Switch batch"} stays fixture-backed until generated bindings, smoke evidence, and rollback order are accepted.`}
                  evidence={(selectedAdapterSwitchBatch?.surfaces ?? []).flatMap((surface) => surface.requiredSmokeEvidence)}
                  rollback={selectedAdapterSwitchBatch?.surfaces[0]?.rollback
                    ?? "Return the affected surface to fixture data and keep every other surface blocked until reviewed."}
                  blockedActions={["run codegen", "import generated API", "execute live Convex", "switch fixture adapter"]}
                  disabledActionLabel="Live adapter switch remains gated"
                  testId="section-kinflo-adapter-switch-decision-gate-rail"
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Switch Gate Evidence</CardTitle>
                    <p className="text-sm text-muted-foreground">These checks must stay green before any hosted adapter replacement is approved.</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.adapterSwitchReadiness.activationEvidence.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Source Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.adapterSwitchReadiness.documents.map((documentPath) => (
                      <div key={documentPath} className="rounded-md border px-3 py-2 text-sm">
                        <span className="break-all">{documentPath}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Provider Boundary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4" />
                      <span>No generated API is imported.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4" />
                      <span>No live Convex query, mutation, or action is executed.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4" />
                      <span>No DNS, SSL, email, SMS, storage, payment, or AI provider writes are performed.</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="hosted-activation" className="mt-6">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Hosted Activation Ledger</h2>
                    <p className="text-sm text-muted-foreground">
                      Track the human-owned approval and evidence gates before KinFlo moves from fixture proof to hosted Convex execution.
                    </p>
                  </div>
                  <Badge variant="outline">
                    <ListChecks className="mr-1 h-3 w-3" />
                    Review-only
                  </Badge>
                </div>

                <HostedActivationOwnerChecklist
                  decisions={snapshot.hostedActivationRunbook.decisionRegister}
                  nextHumanGate={snapshot.hostedActivationRunbook.activationConsole.nextHumanGate}
                  providerBoundary={snapshot.hostedActivationRunbook.activationConsole.providerBoundary}
                  testIds={hostedActivationOwnerChecklistTestIds}
                />

                <Card className="overflow-hidden border-slate-200 shadow-sm" data-testid="section-kinflo-hosted-activation-console">
                  <CardHeader className="border-b border-slate-100 bg-slate-950 text-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
                            Activation Console
                          </Badge>
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                            {snapshot.hostedActivationRunbook.activationConsole.decision.replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <CardTitle className="mt-4 text-xl">Hosted Convex remains approval-gated</CardTitle>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300" data-testid="text-kinflo-hosted-activation-next-gate">
                          {snapshot.hostedActivationRunbook.activationConsole.nextHumanGate}
                        </p>
                      </div>
                      <Button disabled variant="secondary" className="self-start" data-testid="button-hosted-activation-console-gated">
                        <KeyRound className="mr-2 h-4 w-4" />
                        Hosted activation gated
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 p-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">Pre-activation command order</div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {snapshot.hostedActivationRunbook.activationConsole.preActivationCommands.map((command) => (
                            <div key={command} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium">
                              {command}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-medium">Evidence posture</div>
                        <div className="mt-3 space-y-2">
                          {snapshot.hostedActivationRunbook.activationConsole.evidenceSummary.slice(0, 4).map((item) => (
                            <div key={item} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                              <CircleDashed className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4" data-testid="section-kinflo-hosted-activation-blocked-actions">
                      <div className="flex items-center gap-2 text-sm font-medium text-rose-800">
                        <ShieldCheck className="h-4 w-4" />
                        Blocked live actions
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {snapshot.hostedActivationRunbook.activationConsole.blockedLiveActions.map((action) => (
                          <Badge key={action} variant="outline" className="border-rose-200 bg-white text-rose-700">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      {snapshot.hostedActivationRunbook.activationConsole.providerBoundary}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm" data-testid="section-kinflo-generated-api-review-board">
                  <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">Generated API Review Board</CardTitle>
                        <Badge variant="secondary">{snapshot.hostedActivationRunbook.generatedApiReviewBoard.status.replaceAll("_", " ")}</Badge>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground" data-testid="text-kinflo-generated-api-review-board">
                        {snapshot.hostedActivationRunbook.generatedApiReviewBoard.approvalGate}
                      </p>
                    </div>
                    <Button disabled variant="outline" data-testid="button-generated-api-review-gated">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Codegen review gated
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-5">
                      {[
                        { label: "Bindings", value: snapshot.hostedActivationRunbook.generatedApiReviewBoard.totalBindings },
                        { label: "Queries", value: snapshot.hostedActivationRunbook.generatedApiReviewBoard.queryBindings },
                        { label: "Mutations", value: snapshot.hostedActivationRunbook.generatedApiReviewBoard.mutationBindings },
                        { label: "Smoke funcs", value: snapshot.hostedActivationRunbook.generatedApiReviewBoard.smokeManifestFunctions },
                        { label: "Gaps", value: snapshot.hostedActivationRunbook.generatedApiReviewBoard.smokeManifestGaps },
                      ].map((item) => (
                        <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
                          <div className="mt-1 text-lg font-semibold text-slate-950">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                      First switch batch: <span className="font-semibold">{snapshot.hostedActivationRunbook.generatedApiReviewBoard.firstSwitchBatch}</span>. Generated bindings still need owner review before any fixture adapter imports the generated Convex API module.
                    </div>

                    <div className="grid max-h-[460px] gap-3 overflow-y-auto pr-1 md:grid-cols-2" data-testid="section-kinflo-generated-api-review-scroll">
                      {snapshot.hostedActivationRunbook.generatedApiReviewBoard.surfaces.map((surface) => (
                        <div key={surface.surface} className="rounded-lg border border-slate-200 bg-white p-4" data-testid={`card-generated-api-review-${surface.surface.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold">{surface.surface}</div>
                              <div className="mt-1 text-xs text-slate-600">
                                {surface.queryBindings} query · {surface.mutationBindings} mutation
                              </div>
                            </div>
                            <Badge variant={surface.reviewPosture === "ready_for_codegen_review" ? "secondary" : "outline"} className="shrink-0">
                              {surface.reviewPosture.replaceAll("_", " ")}
                            </Badge>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-md border border-slate-100 px-2 py-1">
                              <div className="text-slate-500">Total</div>
                              <div className="font-medium text-slate-950">{surface.totalBindings}</div>
                            </div>
                            <div className="rounded-md border border-slate-100 px-2 py-1">
                              <div className="text-slate-500">Owner</div>
                              <div className="truncate font-medium text-slate-950" title={surface.owner}>{surface.owner}</div>
                            </div>
                            <div className="rounded-md border border-slate-100 px-2 py-1">
                              <div className="text-slate-500">Import</div>
                              <div className="font-medium text-slate-950">blocked</div>
                            </div>
                          </div>

                          {surface.requiredFunctions && surface.requiredFunctions.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`${surface.surface} required generated API functions`}>
                              {surface.requiredFunctions.slice(0, 5).map((functionName) => (
                                <Badge key={functionName} variant="outline" className="max-w-full truncate border-slate-200 bg-slate-50 text-[11px] font-normal text-slate-700" title={functionName}>
                                  {functionName}
                                </Badge>
                              ))}
                              {surface.requiredFunctions.length > 5 ? (
                                <Badge variant="secondary" className="text-[11px] font-normal">
                                  +{surface.requiredFunctions.length - 5} more
                                </Badge>
                              ) : null}
                            </div>
                          ) : null}

                          <p className="mt-3 text-xs leading-5 text-slate-600">{surface.smokeCoverage}</p>
                          <div className="mt-3 rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                            <span className="font-medium text-slate-900">Blocked until: </span>
                            {surface.blockedUntil}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {snapshot.hostedActivationRunbook.generatedApiReviewBoard.documents.map((documentPath) => (
                        <div key={documentPath} className="rounded-md border border-slate-200 px-3 py-2 text-xs">
                          <span className="break-all">{documentPath}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {snapshot.hostedActivationRunbook.generatedApiReviewBoard.providerBoundary}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm" data-testid="section-kinflo-hosted-smoke-gap-backlog">
                  <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">Hosted Smoke Gap Backlog</CardTitle>
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          {snapshot.hostedActivationRunbook.hostedSmokeGapBacklog.totalGaps} gaps
                        </Badge>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground" data-testid="text-kinflo-hosted-smoke-gap-backlog">
                        {snapshot.hostedActivationRunbook.hostedSmokeGapBacklog.approvalGate}
                      </p>
                    </div>
                    <Button disabled variant="outline" data-testid="button-hosted-smoke-gap-gated">
                      <ListChecks className="mr-2 h-4 w-4" />
                      Smoke execution gated
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-5" data-testid="section-kinflo-hosted-smoke-gap-summary">
                      {[
                        { label: "Total", value: snapshot.hostedActivationRunbook.hostedSmokeGapBacklog.totalGaps },
                        { label: "Read-only", value: snapshot.hostedActivationRunbook.hostedSmokeGapBacklog.readOnlyGaps },
                        { label: "Mutations", value: snapshot.hostedActivationRunbook.hostedSmokeGapBacklog.mutationGaps },
                        { label: "Provider", value: snapshot.hostedActivationRunbook.hostedSmokeGapBacklog.providerGatedGaps },
                        { label: "Governance", value: snapshot.hostedActivationRunbook.hostedSmokeGapBacklog.governanceGaps },
                      ].map((item) => (
                        <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
                          <div className="mt-1 text-lg font-semibold text-slate-950">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid max-h-[460px] gap-3 overflow-y-auto pr-1 md:grid-cols-2" data-testid="section-kinflo-hosted-smoke-gap-scroll">
                      {snapshot.hostedActivationRunbook.hostedSmokeGapBacklog.gaps.map((gap) => (
                        <div key={gap.id} className="rounded-lg border border-slate-200 bg-white p-4" data-testid={`card-hosted-smoke-gap-${gap.id}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="break-all text-sm font-semibold">{gap.functionName}</div>
                              <div className="mt-1 text-xs text-slate-600">{gap.surface} · {gap.batchId}</div>
                            </div>
                            <Badge
                              variant={gap.smokeMode === "read_only" ? "secondary" : "outline"}
                              className="shrink-0"
                            >
                              {gap.smokeMode.replaceAll("_", " ")}
                            </Badge>
                          </div>

                          <div className="mt-3 grid gap-2 text-xs">
                            <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                              <span className="font-medium text-slate-900">Local proof: </span>
                              <span className="text-slate-600">{gap.localProof}</span>
                            </div>
                            <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                              <span className="font-medium text-slate-900">Hosted proof: </span>
                              <span className="text-slate-600">{gap.hostedProofRequired}</span>
                            </div>
                            <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                              <span className="font-medium text-slate-900">Rollback: </span>
                              <span className="text-slate-600">{gap.rollbackArtifact}</span>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">Owner: {gap.owner}</Badge>
                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                              can run: {gap.canRun ? "yes" : "no"}
                            </Badge>
                          </div>
                          <p className="mt-3 text-xs leading-5 text-slate-600">{gap.blockedUntil}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {snapshot.hostedActivationRunbook.hostedSmokeGapBacklog.sourceDocuments.map((documentPath) => (
                        <div key={documentPath} className="rounded-md border border-slate-200 px-3 py-2 text-xs">
                          <span className="break-all">{documentPath}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {snapshot.hostedActivationRunbook.hostedSmokeGapBacklog.providerBoundary}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm" data-testid="section-kinflo-hosted-smoke-execution-sequencer">
                  <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">Hosted Smoke Execution Sequencer</CardTitle>
                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                          {snapshot.hostedActivationRunbook.hostedSmokeExecutionSequencer.blockedBatches} blocked
                        </Badge>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground" data-testid="text-kinflo-hosted-smoke-execution-sequencer">
                        {snapshot.hostedActivationRunbook.hostedSmokeExecutionSequencer.approvalGate}
                      </p>
                    </div>
                    <Button disabled variant="outline" data-testid="button-hosted-smoke-execution-gated">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Batch execution gated
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-4" data-testid="section-kinflo-hosted-smoke-execution-summary">
                      {[
                        { label: "Batches", value: snapshot.hostedActivationRunbook.hostedSmokeExecutionSequencer.totalBatches },
                        { label: "Functions", value: snapshot.hostedActivationRunbook.hostedSmokeExecutionSequencer.totalFunctions },
                        { label: "Blocked", value: snapshot.hostedActivationRunbook.hostedSmokeExecutionSequencer.blockedBatches },
                        { label: "Read-only first", value: snapshot.hostedActivationRunbook.hostedSmokeExecutionSequencer.readOnlyFirst ? "yes" : "no" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
                          <div className="mt-1 text-lg font-semibold text-slate-950">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1 xl:grid-cols-2" data-testid="section-kinflo-hosted-smoke-execution-scroll">
                      {snapshot.hostedActivationRunbook.hostedSmokeExecutionSequencer.batches.map((batch) => (
                        <div key={batch.id} className="rounded-lg border border-slate-200 bg-white p-4" data-testid={`card-hosted-smoke-execution-${batch.id}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Batch {batch.order}</div>
                              <div className="mt-1 text-sm font-semibold text-slate-950">{batch.label}</div>
                            </div>
                            <Badge
                              variant={batch.smokeMode === "read_only" ? "secondary" : "outline"}
                              className="shrink-0"
                            >
                              {batch.smokeMode.replaceAll("_", " ")}
                            </Badge>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline">{batch.functionCount} functions</Badge>
                            <Badge variant="outline">Owner: {batch.owner}</Badge>
                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                              can run: {batch.canRun ? "yes" : "no"}
                            </Badge>
                          </div>

                          <div className="mt-3 grid gap-2 text-xs">
                            <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                              <span className="font-medium text-slate-900">Required first: </span>
                              <span className="text-slate-600">{batch.requiredBeforeRun}</span>
                            </div>
                            <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                              <span className="font-medium text-slate-900">Evidence: </span>
                              <span className="text-slate-600">{batch.evidenceTarget}</span>
                            </div>
                            <div className="rounded-md border border-rose-100 bg-rose-50 p-2">
                              <span className="font-medium text-rose-900">Abort if: </span>
                              <span className="text-rose-700">{batch.abortCondition}</span>
                            </div>
                            <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                              <span className="font-medium text-slate-900">Rollback: </span>
                              <span className="text-slate-600">{batch.rollbackPlan}</span>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {batch.functions.map((functionName) => (
                              <Badge key={functionName} variant="outline" className="max-w-full whitespace-normal break-all text-left text-[11px]">
                                {functionName}
                              </Badge>
                            ))}
                          </div>
                          <p className="mt-3 text-xs leading-5 text-slate-600">{batch.blockedUntil}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {snapshot.hostedActivationRunbook.hostedSmokeExecutionSequencer.sourceDocuments.map((documentPath) => (
                        <div key={documentPath} className="rounded-md border border-slate-200 px-3 py-2 text-xs">
                          <span className="break-all">{documentPath}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {snapshot.hostedActivationRunbook.hostedSmokeExecutionSequencer.providerBoundary}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm" data-testid="section-kinflo-hosted-smoke-evidence-ledger">
                  <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">Hosted Smoke Evidence Ledger</CardTitle>
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                          {snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.pendingEntries} pending
                        </Badge>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground" data-testid="text-kinflo-hosted-smoke-evidence-ledger">
                        {snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.approvalGate}
                      </p>
                    </div>
                    <div className="grid w-full gap-3 lg:w-[320px]">
                      <div>
                        <Label>Focus evidence</Label>
                        <Select value={selectedHostedSmokeEvidenceEntry?.batchId ?? ""} onValueChange={selectHostedSmokeEvidenceBatch}>
                          <SelectTrigger className="mt-2" data-testid="select-kinflo-hosted-smoke-evidence">
                            <SelectValue placeholder="Select smoke evidence batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.entries.map((entry) => (
                              <SelectItem key={entry.batchId} value={entry.batchId}>
                                {entry.order}. {entry.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button disabled variant="outline" data-testid="button-hosted-smoke-evidence-gated">
                        <FileText className="mr-2 h-4 w-4" />
                        Evidence capture gated
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-4" data-testid="section-kinflo-hosted-smoke-evidence-summary">
                      {[
                        { label: "Entries", value: snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.totalEvidenceEntries },
                        { label: "Functions", value: snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.totalFunctions },
                        { label: "Pending", value: snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.pendingEntries },
                        { label: "Blocked", value: snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.blockedEntries },
                      ].map((item) => (
                        <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
                          <div className="mt-1 text-lg font-semibold text-slate-950">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" data-testid="section-kinflo-hosted-smoke-evidence-focus">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <h3 className="text-sm font-semibold text-slate-950">{selectedHostedSmokeEvidenceEntry?.label}</h3>
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                              {selectedHostedSmokeEvidenceEntry?.status.replaceAll("_", " ")}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-600" data-testid="text-kinflo-hosted-smoke-evidence-focus">
                            {selectedHostedSmokeEvidenceEntry?.expectedTranscript}
                          </p>
                        </div>
                        <Button size="sm" disabled variant="outline" data-testid="button-hosted-smoke-evidence-focus-gated">
                          <ShieldCheck className="mr-2 h-3 w-3" />
                          Recording gated
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="rounded-md border border-white bg-white p-3">
                          <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">Evidence slots</div>
                          <div className="mt-2 space-y-1">
                            {(selectedHostedSmokeEvidenceEntry?.evidenceSlots ?? []).map((slot) => (
                              <div key={slot} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                                <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span>{slot}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-md border border-white bg-white p-3">
                          <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">Acceptance criteria</div>
                          <div className="mt-2 space-y-1">
                            {(selectedHostedSmokeEvidenceEntry?.acceptanceCriteria ?? []).map((criterion) => (
                              <div key={criterion} className="flex items-start gap-2 text-xs leading-5 text-emerald-800">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{criterion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                          <div className="text-slate-500">Functions</div>
                          <div className="mt-1 font-semibold text-slate-950">{selectedHostedSmokeEvidenceEntry?.functionCount}</div>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                          <div className="text-slate-500">Owner</div>
                          <div className="mt-1 truncate font-semibold text-slate-950" title={selectedHostedSmokeEvidenceEntry?.owner}>
                            {selectedHostedSmokeEvidenceEntry?.owner}
                          </div>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                          <div className="text-slate-500">Can record</div>
                          <div className="mt-1 font-semibold text-slate-950">{selectedHostedSmokeEvidenceEntry?.canRecord ? "yes" : "no"}</div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs lg:grid-cols-2">
                        <div className="rounded-md border border-rose-100 bg-rose-50 p-2">
                          <span className="font-medium text-rose-900">Abort if: </span>
                          <span className="text-rose-700">{selectedHostedSmokeEvidenceEntry?.abortIf}</span>
                        </div>
                        <div className="rounded-md border border-slate-100 bg-white p-2">
                          <span className="font-medium text-slate-900">Rollback: </span>
                          <span className="text-slate-600">{selectedHostedSmokeEvidenceEntry?.rollbackReference}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid max-h-[560px] gap-3 overflow-y-auto pr-1 xl:grid-cols-2" data-testid="section-kinflo-hosted-smoke-evidence-scroll">
                      {snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`rounded-lg border p-4 ${entry.batchId === selectedHostedSmokeEvidenceEntry?.batchId ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}
                          data-testid={`card-hosted-smoke-evidence-${entry.batchId}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Batch {entry.order}</div>
                              <div className="mt-1 text-sm font-semibold text-slate-950">{entry.label}</div>
                            </div>
                            <Badge variant="outline" className="shrink-0 border-amber-200 bg-amber-50 text-amber-800">
                              {entry.status.replaceAll("_", " ")}
                            </Badge>
                          </div>

                          <p className="mt-3 text-xs leading-5 text-slate-600">{entry.expectedTranscript}</p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline">{entry.functionCount} functions</Badge>
                            <Badge variant="outline">Owner: {entry.owner}</Badge>
                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                              record: {entry.canRecord ? "yes" : "no"}
                            </Badge>
                          </div>

                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                              <div className="text-xs font-medium text-slate-900">Evidence slots</div>
                              <div className="mt-2 space-y-1">
                                {entry.evidenceSlots.map((slot) => (
                                  <div key={slot} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                                    <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span>{slot}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                              <div className="text-xs font-medium text-emerald-900">Acceptance criteria</div>
                              <div className="mt-2 space-y-1">
                                {entry.acceptanceCriteria.map((criterion) => (
                                  <div key={criterion} className="flex items-start gap-2 text-xs leading-5 text-emerald-800">
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{criterion}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 text-xs">
                            <div className="rounded-md border border-rose-100 bg-rose-50 p-2">
                              <span className="font-medium text-rose-900">Abort if: </span>
                              <span className="text-rose-700">{entry.abortIf}</span>
                            </div>
                            <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                              <span className="font-medium text-slate-900">Rollback: </span>
                              <span className="text-slate-600">{entry.rollbackReference}</span>
                            </div>
                          </div>
                          <p className="mt-3 text-xs leading-5 text-slate-600">{entry.blockedUntil}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.sourceDocuments.map((documentPath) => (
                        <div key={documentPath} className="rounded-md border border-slate-200 px-3 py-2 text-xs">
                          <span className="break-all">{documentPath}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.providerBoundary}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm" data-testid="section-kinflo-hosted-activation-decision-register">
                  <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">Human Decision Register</CardTitle>
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          {snapshot.hostedActivationRunbook.decisionRegister.length} decisions
                        </Badge>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Record the owner-owned approvals that must happen outside committed source before hosted activation, generated API review, live smokes, provider writes, or client sharing.
                      </p>
                    </div>
                    <Button disabled variant="outline" data-testid="button-hosted-activation-decision-gated">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Decision capture gated
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {snapshot.hostedActivationRunbook.decisionRegister.map((decision) => (
                        <div key={decision.id} className="rounded-lg border border-slate-200 bg-white p-4" data-testid={`card-hosted-activation-decision-${decision.id}`}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold">{decision.label}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Owner: {decision.owner} · Required before {decision.requiredBefore}
                              </div>
                            </div>
                            <Badge variant={decision.status === "pending_owner_decision" ? "secondary" : "outline"} className="self-start whitespace-nowrap">
                              {decision.status.replaceAll("_", " ")}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-3 text-sm leading-6">
                            <p className="text-slate-700" data-testid={`text-hosted-activation-decision-${decision.id}`}>
                              {decision.decisionNeeded}
                            </p>
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                              <div className="font-medium text-slate-800">Evidence target</div>
                              <div className="mt-1">{decision.evidenceTarget}</div>
                            </div>
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                              <div className="font-medium">Blocked until</div>
                              <div className="mt-1">{decision.blockedUntil}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground" data-testid="text-hosted-activation-decision-boundary">
                      The register captures decision posture only. It does not read secrets, rewrite history, create providers, run codegen, execute live Convex, send messages, publish sites, or approve client sharing.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">Hosted Activation Evidence Packet</CardTitle>
                        <Badge variant="secondary">{snapshot.hostedActivationRunbook.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{snapshot.hostedActivationRunbook.providerBoundary}</p>
                    </div>
                    <div className="w-full lg:w-[320px]">
                      <Label>Activation step</Label>
                      <Select value={hostedActivationStepId} onValueChange={selectHostedActivationStep}>
                        <SelectTrigger className="mt-2" data-testid="select-kinflo-hosted-activation-step">
                          <SelectValue placeholder="Select activation step" />
                        </SelectTrigger>
                        <SelectContent>
                          {snapshot.hostedActivationRunbook.steps.map((step) => (
                            <SelectItem key={step.id} value={step.id}>
                              {step.order}. {step.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-md border p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Steps</div>
                        <div className="mt-1 text-2xl font-semibold" data-testid="text-kinflo-hosted-activation-steps">
                          {hostedActivationTotals.total}
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending approval</div>
                        <div className="mt-1 text-2xl font-semibold">{hostedActivationTotals.pendingApproval}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Provider gated</div>
                        <div className="mt-1 text-2xl font-semibold">{hostedActivationTotals.providerGated}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live blocked</div>
                        <div className="mt-1 text-2xl font-semibold">{hostedActivationTotals.liveExecutionBlocked}</div>
                      </div>
                    </div>

                    <div className="rounded-md border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{selectedHostedActivationStep?.label}</h3>
                            {selectedHostedActivationStep ? hostedActivationStatusBadge(selectedHostedActivationStep.status) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Owner: {selectedHostedActivationStep?.owner} · Required before {selectedHostedActivationStep?.requiredBefore}
                          </p>
                        </div>
                        <Button size="sm" disabled data-testid="button-hosted-activation-gated">
                          <KeyRound className="mr-2 h-3 w-3" />
                          Hosted action gated
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-md bg-muted/40 p-3">
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Command or action</div>
                          <p className="mt-2 text-sm">{selectedHostedActivationStep?.commandOrAction}</p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-3">
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Evidence target</div>
                          <p className="mt-2 text-sm">{selectedHostedActivationStep?.evidenceTarget}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                        <div className="rounded-md border px-3 py-2">
                          <div className="text-xs text-muted-foreground">Provider writes</div>
                          <div className="font-medium">{selectedHostedActivationStep?.providerWrites ? "yes" : "no"}</div>
                        </div>
                        <div className="rounded-md border px-3 py-2">
                          <div className="text-xs text-muted-foreground">Live Convex execution</div>
                          <div className="font-medium">{selectedHostedActivationStep?.liveConvexExecution ? "yes" : "no"}</div>
                        </div>
                        <div className="rounded-md border px-3 py-2">
                          <div className="text-xs text-muted-foreground">Ready after approval</div>
                          <div className="font-medium">{selectedHostedActivationStep?.status === "ready_after_approval" ? "yes" : "no"}</div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-md border p-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Rollback: </span>
                        {selectedHostedActivationStep?.rollback}
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      {snapshot.hostedActivationRunbook.steps.map((step) => (
                        <div key={step.id} className="rounded-md border p-3" data-testid={`card-hosted-activation-${step.id}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{step.order}. {step.label}</div>
                              <p className="mt-1 text-xs text-muted-foreground">{step.requiredBefore}</p>
                            </div>
                            {hostedActivationStatusBadge(step.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <DecisionGateRail
                  title="Hosted activation decision gate"
                  owner={selectedHostedActivationStep?.owner ?? "Vambah"}
                  posture={snapshot.hostedActivationRunbook.activationConsole.nextHumanGate}
                  evidence={[
                    selectedHostedActivationStep?.evidenceTarget ?? "Hosted activation evidence target is pending.",
                    ...snapshot.hostedActivationRunbook.activationConsole.evidenceSummary,
                  ]}
                  rollback={selectedHostedActivationStep?.rollback
                    ?? "Keep all shell surfaces on fixtures and do not run hosted Convex commands."}
                  blockedActions={snapshot.hostedActivationRunbook.activationConsole.blockedLiveActions}
                  disabledActionLabel="Hosted activation remains gated"
                  testId="section-kinflo-hosted-activation-decision-gate-rail"
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Completion Rules</CardTitle>
                    <p className="text-sm text-muted-foreground">These rules prevent local evidence from being mistaken for hosted activation.</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.hostedActivationRunbook.completionRules.map((rule) => (
                      <div key={rule} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="mt-0.5 h-4 w-4" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Evidence Targets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.hostedActivationRunbook.evidenceTargets.map((target) => (
                      <div key={target} className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                        {target}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Source Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.hostedActivationRunbook.documents.map((documentPath) => (
                      <div key={documentPath} className="rounded-md border px-3 py-2 text-sm">
                        <span className="break-all">{documentPath}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Provider Boundary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4" />
                      <span>No hosted Convex deployment is created.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4" />
                      <span>No generated API is imported.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4" />
                      <span>No live Convex query, mutation, or action is executed.</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="factory" className="mt-6">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Site Factory Launch Packets</h2>
                    <p className="text-sm text-muted-foreground">Prepare tenant, site, template, invite, and permission scope before live Convex mutations are enabled.</p>
                  </div>
                  <Badge variant="outline">
                    <Factory className="mr-1 h-3 w-3" />
                    Provider-light
                  </Badge>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-base">Site Creation Wizard</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Configure a launch-ready site packet before live Convex mutations are enabled.
                        </p>
                      </div>
                      <Badge variant="secondary">{wizardReadyCount}/{wizardReadiness.length} ready</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="kinflo-wizard-site-name">Site name</Label>
                        <Input
                          id="kinflo-wizard-site-name"
                          value={wizardSiteName}
                          onChange={(event) => setWizardSiteName(event.target.value)}
                          data-testid="input-kinflo-wizard-site-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kinflo-wizard-subdomain">Subdomain</Label>
                        <Input
                          id="kinflo-wizard-subdomain"
                          value={wizardSubdomain}
                          onChange={(event) => setWizardSubdomain(event.target.value)}
                          data-testid="input-kinflo-wizard-subdomain"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Template</Label>
                        <Select value={wizardTemplateKey} onValueChange={setWizardTemplateKey}>
                          <SelectTrigger data-testid="select-kinflo-wizard-template">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.templates.map((template) => (
                              <SelectItem key={template.key} value={template.key}>
                                {template.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Owner role</Label>
                        <Select value={wizardOwnerRole} onValueChange={setWizardOwnerRole}>
                          <SelectTrigger data-testid="select-kinflo-wizard-owner-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.siteCreationWizard.ownerRoleOptions.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Brand tone</Label>
                        <div className="flex flex-wrap gap-2">
                          {snapshot.siteCreationWizard.brandToneOptions.map((tone) => (
                            <Button
                              key={tone}
                              type="button"
                              size="sm"
                              variant={wizardBrandTone === tone ? "default" : "outline"}
                              onClick={() => setWizardBrandTone(tone)}
                              data-testid={`button-brand-tone-${tone.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                            >
                              {tone}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                      <div>
                        <div className="text-sm font-medium">Pages</div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {snapshot.siteCreationWizard.pageOptions.map((page) => (
                            <label key={page.key} className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                              <Checkbox
                                checked={wizardPageKeys.includes(page.key)}
                                disabled={page.required}
                                onCheckedChange={(checked) => toggleWizardPage(page.key, checked === true)}
                                data-testid={`checkbox-page-${page.key}`}
                              />
                              <span>
                                <span className="font-medium">{page.label}</span>
                                {page.required ? <span className="ml-2 text-xs text-muted-foreground">required</span> : null}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Readiness</span>
                          <span className="text-muted-foreground">{wizardReadinessPercent}%</span>
                        </div>
                        <Progress value={wizardReadinessPercent} className="mt-2" />
                        <div className="mt-3 space-y-2">
                          {wizardReadiness.map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.done ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <CircleDashed className="h-3.5 w-3.5" />
                              )}
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {selectedWizardTemplate ? (
                      <div className="rounded-md border p-3 text-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="font-medium">{selectedWizardTemplate.label}</div>
                            <div className="mt-1 text-muted-foreground">{selectedWizardTemplate.imageDirection}</div>
                          </div>
                          <Badge variant="outline">{wizardBrandTone}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedWizardTemplate.launchCriteria.map((criterion) => (
                            <Badge key={criterion} variant="secondary">{criterion}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        Draft route: <span className="font-medium text-foreground">/{wizardSubdomain || "subdomain"}</span>
                      </div>
                      <Button disabled>
                        <Rocket className="mr-2 h-4 w-4" />
                        Live mutation gated
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  {snapshot.siteLaunchPackets.map((packet) => {
                    const selected = packet.id === selectedLaunchPacket?.id;
                    return (
                      <Card key={packet.id} className={selected ? "border-primary" : undefined}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <CardTitle className="text-base">{packet.label}</CardTitle>
                              <p className="mt-1 text-sm text-muted-foreground">{packet.tenant} · {packet.template}</p>
                            </div>
                            {selected ? <Badge>Prepared</Badge> : <Badge variant="outline">Queued</Badge>}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                              <div className="text-xs text-muted-foreground">Subdomain</div>
                              <div className="font-medium">{packet.subdomain}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Owner role</div>
                              <div className="font-medium">{packet.ownerRole}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => setSelectedLaunchPacketId(packet.id)}>
                              <Rocket className="mr-2 h-3 w-3" />
                              Prepare
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={packet.previewPath}>
                                <ExternalLink className="mr-2 h-3 w-3" />
                                Preview
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {selectedLaunchPacket ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Prepared Launch Packet</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedLaunchPacket.siteName} for {selectedLaunchPacket.tenant}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-md border p-3 text-sm">
                        <div className="font-medium">{selectedLaunchPacket.ownerEmail}</div>
                        <div className="mt-1 text-muted-foreground">{selectedLaunchPacket.ownerRole} · invitation prepared as token-hash-only contract</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Configuration</div>
                        <div className="mt-2 space-y-2">
                          {selectedLaunchPacket.configurationSummary.map((item) => (
                            <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Permission gates</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedLaunchPacket.permissionGates.map((permission) => (
                            <Badge key={permission} variant="secondary">{permission}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Convex Contract</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {[...selectedLaunchPacket.convexMutations, ...snapshot.siteCreationWizard.convexMutations]
                          .filter((mutationName, index, all) => all.indexOf(mutationName) === index)
                          .map((mutationName) => (
                          <Badge key={mutationName} variant="outline">{mutationName}</Badge>
                        ))}
                      </div>
                      <div className="rounded-lg border">
                        {selectedLaunchPacket.launchChecklist.map((gate, index) => {
                          const done = gate.status === "done";
                          return (
                            <div
                              key={gate.label}
                              className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                                index === 0 ? "" : "border-t"
                              }`}
                            >
                              <span>{gate.label}</span>
                              {done ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <CircleDashed className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </section>
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Plans And Entitlements</h2>
                    <p className="text-sm text-muted-foreground">Plan limits, feature gates, and manual override state before Stripe Billing is connected.</p>
                  </div>
                  <Badge variant="outline">
                    <CreditCard className="mr-1 h-3 w-3" />
                    Stripe Billing gated
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Plan Catalog</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Select a provider-light KinFlo plan to inspect limits before live billing sync.
                      </p>
                    </div>
                    <div className="w-full md:w-56">
                      <Select value={selectedPlanKey} onValueChange={setSelectedPlanKey}>
                        <SelectTrigger data-testid="select-kinflo-plan">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {snapshot.billingPlans.map((plan) => (
                            <SelectItem key={plan.key} value={plan.key}>
                              {plan.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  {selectedPlan ? (
                    <CardContent className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{selectedPlan.label}</h3>
                            {statusBadge(selectedPlan.status)}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{selectedPlan.fit}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target price</div>
                          <div className="mt-1 text-xl font-semibold">{selectedPlan.price}</div>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Limit</TableHead>
                              <TableHead className="text-right">Included</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedPlan.limits.map((limit) => (
                              <TableRow key={limit.label}>
                                <TableCell>{limit.label}</TableCell>
                                <TableCell className="text-right font-medium">{limit.value}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-sm font-medium">Feature gates</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedPlan.features.map((feature) => (
                              <Badge key={feature} variant="secondary">{feature}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Provider gates</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedPlan.gatedModules.map((moduleName) => (
                              <Badge key={moduleName} variant="outline">{moduleName}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  ) : null}
                </Card>

                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead className="text-right">State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snapshot.tenantEntitlements.map((entitlement) => (
                        <TableRow key={entitlement.tenantSlug}>
                          <TableCell>
                            <div className="font-medium">{entitlement.tenant}</div>
                            <div className="text-xs text-muted-foreground">{entitlement.tenantSlug}</div>
                          </TableCell>
                          <TableCell>{entitlement.planLabel}</TableCell>
                          <TableCell>{entitlement.source}</TableCell>
                          <TableCell>{entitlement.nextReview}</TableCell>
                          <TableCell className="text-right">{statusBadge(entitlement.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="rounded-md border bg-background p-2">
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Entitlement Overrides</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Manual override rows stay reviewable until Stripe Billing writes the canonical subscription state.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {snapshot.tenantEntitlements.map((entitlement) => (
                      <div key={entitlement.tenantSlug} className="rounded-md border p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{entitlement.tenant}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{entitlement.planLabel} · {entitlement.source}</div>
                          </div>
                          <Badge variant="outline">manual override</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {entitlement.usage.map((usage) => (
                            <div key={usage.label} className="rounded-md bg-muted/40 px-3 py-2">
                              <div className="text-xs text-muted-foreground">{usage.label}</div>
                              <div className="font-medium">{usage.value} / {usage.limit}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {entitlement.featureOverrides.map((override) => (
                            <Badge key={override} variant="secondary">{override}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">These calls stay behind `billing:manage` until hosted Convex activation.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      "controlPlane.listPlanCatalog",
                      "controlPlane.syncDefaultBillingPlans",
                      "controlPlane.entitlementSnapshot",
                      "controlPlane.setTenantEntitlementOverride",
                    ].map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span>{functionName}</span>
                        <Badge variant="outline">billing:manage</Badge>
                      </div>
                    ))}
                    <Button className="w-full" disabled>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Live billing sync gated
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="brand" className="mt-6">
            <section className="grid max-w-[calc(100vw-2rem)] min-w-0 gap-6 sm:max-w-none xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Brand Theme Studio</h2>
                    <p className="text-sm text-muted-foreground">Configure the visual system a client site will inherit before live theme token writes are enabled.</p>
                  </div>
                  <Badge variant="outline" className="self-start">
                    <Palette className="mr-1 h-3 w-3" />
                    Provider-light theme
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Theme Token Draft</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedBrandSite?.label}</p>
                    </div>
                    <Badge variant={brandThemeDirty ? "default" : "secondary"}>
                      {brandThemeDirty ? "Local edits" : "Fixture theme"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ConfigurationAffordanceStrip
                      surface="Brand theme configuration"
                      objectLabel={selectedBrandSite?.label ?? "No site selected"}
                      stateLabel={brandThemeDirty ? "Local edits" : "Fixture theme"}
                      provenanceNotes={[
                        `Palette: ${selectedBrandPalette?.label ?? "pending"}`,
                        `Typography: ${selectedBrandTypography?.label ?? "pending"}`,
                        `Media: ${selectedBrandMedia?.label ?? "pending"}`,
                      ]}
                      activationEvidence={snapshot.brandTheme.activationEvidence}
                      blockedLiveAction="Live theme save is blocked until hosted Convex, generated API bindings, visual QA, and public renderer smoke are approved."
                      disabledActionLabel="Live theme save gated"
                      readinessPercent={brandReadinessPercent}
                      testId="section-kinflo-configuration-affordance-brand"
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <div className="space-y-2">
                        <Label>Site</Label>
                        <Select value={brandSiteKey} onValueChange={setBrandSiteKey}>
                          <SelectTrigger data-testid="select-kinflo-brand-site">
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.brandTheme.siteOptions.map((site) => (
                              <SelectItem key={site.key} value={site.key}>
                                {site.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Palette</Label>
                        <Select value={brandPaletteKey} onValueChange={setBrandPaletteKey}>
                          <SelectTrigger data-testid="select-kinflo-brand-palette">
                            <SelectValue placeholder="Select palette" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.brandTheme.paletteOptions.map((palette) => (
                              <SelectItem key={palette.key} value={palette.key}>
                                {palette.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Typography</Label>
                        <Select value={brandTypographyKey} onValueChange={setBrandTypographyKey}>
                          <SelectTrigger data-testid="select-kinflo-brand-typography">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.brandTheme.typographyOptions.map((typography) => (
                              <SelectItem key={typography.key} value={typography.key}>
                                {typography.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Buttons</Label>
                        <Select value={brandButtonKey} onValueChange={setBrandButtonKey}>
                          <SelectTrigger data-testid="select-kinflo-brand-buttons">
                            <SelectValue placeholder="Select buttons" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.brandTheme.buttonOptions.map((button) => (
                              <SelectItem key={button.key} value={button.key}>
                                {button.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Media</Label>
                        <Select value={brandMediaKey} onValueChange={setBrandMediaKey}>
                          <SelectTrigger data-testid="select-kinflo-brand-media">
                            <SelectValue placeholder="Select media" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.brandTheme.mediaOptions.map((media) => (
                              <SelectItem key={media.key} value={media.key}>
                                {media.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div
                        className="rounded-md border p-5"
                        style={{
                          backgroundColor: selectedBrandPalette?.background,
                          color: selectedBrandPalette?.foreground,
                        }}
                      >
                        <div className="flex flex-wrap gap-2">
                          {[selectedBrandPalette?.background, selectedBrandPalette?.foreground, selectedBrandPalette?.accent].map((color) => (
                            <span
                              key={color}
                              className="h-8 w-8 rounded-full border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="mt-5 max-w-2xl">
                          <div className="text-sm font-medium opacity-75">{selectedBrandPalette?.label}</div>
                          <h3 className="mt-2 text-2xl font-semibold">{selectedBrandTypography?.heading} for confident public pages</h3>
                          <p className="mt-2 text-sm opacity-80">{selectedBrandPalette?.description}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              disabled
                              style={{
                                backgroundColor: selectedBrandPalette?.accent,
                                borderRadius: selectedBrandButton?.radius,
                                color: selectedBrandPalette?.background,
                              }}
                            >
                              Preview action
                            </Button>
                            <Button disabled variant="outline" style={{ borderRadius: selectedBrandButton?.radius }}>
                              Secondary path
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-md border p-3 text-sm">
                          <div className="font-medium">Token Packet</div>
                          <div className="mt-3 space-y-2 text-muted-foreground">
                            <div>Heading: {selectedBrandTypography?.heading}</div>
                            <div>Body: {selectedBrandTypography?.body}</div>
                            <div>Buttons: {selectedBrandButton?.style}</div>
                            <div>Media: {selectedBrandMedia?.treatment}</div>
                            <div>Ratio: {selectedBrandMedia?.ratio}</div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Readiness</span>
                            <span className="text-muted-foreground">{brandReadinessPercent}%</span>
                          </div>
                          <Progress value={brandReadinessPercent} className="mt-2" />
                          <div className="mt-3 space-y-2">
                            {brandReadiness.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <CircleDashed className="h-3.5 w-3.5" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">{snapshot.brandTheme.providerBoundary}</div>
                      <Button disabled data-testid="button-save-brand-theme">
                        <Save className="mr-2 h-4 w-4" />
                        Live theme save gated
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Theme Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">Theme saves remain gated until generated API bindings and visual smoke are approved.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.brandTheme.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span className="min-w-0 break-all">{functionName}</span>
                        <Badge variant="outline">Mapped</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activation Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.brandTheme.activationEvidence.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button asChild variant="outline" className="w-full">
                  <Link href={selectedBrandSite?.previewPath ?? "/kinflo-sites/advisor-client-site"}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview Route
                  </Link>
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="navigation" className="mt-6">
            <section className="grid max-w-[calc(100vw-2rem)] min-w-0 gap-6 sm:max-w-none xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">Navigation Builder</h2>
                    <p className="text-sm text-muted-foreground">Configure header and footer links for a client site before live navigation writes are enabled.</p>
                  </div>
                  <Badge variant="outline" className="self-start">
                    <LayoutDashboard className="mr-1 h-3 w-3" />
                    Provider-light nav
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Navigation Draft</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedNavigationSite?.label} · {navigationPlacement}
                      </p>
                    </div>
                    <Badge variant={navigationDraftDirty ? "default" : "secondary"}>
                      {navigationDraftDirty ? "Local edits" : "Fixture navigation"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ConfigurationAffordanceStrip
                      surface="Navigation configuration"
                      objectLabel={`${selectedNavigationSite?.label ?? "No site selected"} · ${navigationPlacement}`}
                      stateLabel={navigationDraftDirty ? "Local edits" : "Fixture navigation"}
                      provenanceNotes={[
                        `Item: ${selectedNavigationItem?.label ?? "pending"}`,
                        `Href: ${navigationHref || "pending"}`,
                        `Visibility: ${navigationVisible ? "visible" : "hidden"}`,
                      ]}
                      activationEvidence={snapshot.navigationDraft.activationEvidence}
                      blockedLiveAction="Live navigation save is blocked until hosted Convex, generated API bindings, public preview smoke, and audit review are approved."
                      disabledActionLabel="Live navigation save gated"
                      readinessPercent={navigationReadinessPercent}
                      testId="section-kinflo-configuration-affordance-navigation"
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Site</Label>
                        <Select value={navigationSiteKey} onValueChange={setNavigationSiteKey}>
                          <SelectTrigger data-testid="select-kinflo-navigation-site">
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.navigationDraft.siteOptions.map((site) => (
                              <SelectItem key={site.key} value={site.key}>
                                {site.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Placement</Label>
                        <Select
                          value={navigationPlacement}
                          onValueChange={(value) => handleNavigationPlacementChange(value as typeof navigationPlacement)}
                        >
                          <SelectTrigger data-testid="select-kinflo-navigation-placement">
                            <SelectValue placeholder="Select placement" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.navigationDraft.placementOptions.map((placement) => (
                              <SelectItem key={placement.key} value={placement.key}>
                                {placement.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Item</Label>
                        <Select value={selectedNavigationItem?.key ?? ""} onValueChange={handleNavigationItemChange}>
                          <SelectTrigger data-testid="select-kinflo-navigation-item">
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredNavigationItems.map((item) => (
                              <SelectItem key={item.key} value={item.key}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="kinflo-navigation-label">Label</Label>
                            <Input
                              id="kinflo-navigation-label"
                              value={navigationLabel}
                              onChange={(event) => setNavigationLabel(event.target.value)}
                              data-testid="input-kinflo-navigation-label"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="kinflo-navigation-href">Href</Label>
                            <Input
                              id="kinflo-navigation-href"
                              value={navigationHref}
                              onChange={(event) => setNavigationHref(event.target.value)}
                              data-testid="input-kinflo-navigation-href"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                          <Checkbox
                            checked={navigationVisible}
                            onCheckedChange={(checked) => setNavigationVisible(checked === true)}
                            data-testid="checkbox-kinflo-navigation-visible"
                          />
                          <span>Visible in public navigation</span>
                        </label>

                        <div className="rounded-md border p-4 text-sm">
                          <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="font-medium">{selectedNavigationSite?.label}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{selectedNavigationSite?.previewPath}</div>
                            </div>
                            <Badge variant="outline" className="self-start">{navigationPlacement}</Badge>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {navigationPreviewItems.map((item) => (
                              <span
                                key={item.key}
                                className={`rounded-md border px-3 py-2 ${
                                  item.isVisible ? "bg-background" : "bg-muted text-muted-foreground line-through"
                                }`}
                              >
                                {item.label}
                                <span className="ml-2 text-xs text-muted-foreground">{item.href}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedNavigationItem ? (
                          <div className="rounded-md border p-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{selectedNavigationItem.label}</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  order {selectedNavigationItem.order} · {selectedNavigationItem.href}
                                </div>
                              </div>
                              <Badge variant={selectedNavigationItem.isVisible ? "secondary" : "outline"}>
                                {selectedNavigationItem.isVisible ? "Visible" : "Hidden"}
                              </Badge>
                            </div>
                          </div>
                        ) : null}
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Readiness</span>
                            <span className="text-muted-foreground">{navigationReadinessPercent}%</span>
                          </div>
                          <Progress value={navigationReadinessPercent} className="mt-2" />
                          <div className="mt-3 space-y-2">
                            {navigationReadiness.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <CircleDashed className="h-3.5 w-3.5" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">{snapshot.navigationDraft.providerBoundary}</div>
                      <Button disabled data-testid="button-save-navigation">
                        <Save className="mr-2 h-4 w-4" />
                        Live navigation save gated
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Navigation Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">Navigation writes remain gated until generated API bindings and public preview smoke are approved.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.navigationDraft.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span className="min-w-0 break-all">{functionName}</span>
                        <Badge variant="outline">Mapped</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activation Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.navigationDraft.activationEvidence.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button asChild variant="outline" className="w-full">
                  <Link href={selectedNavigationSite?.previewPath ?? "/kinflo-sites/advisor-client-site"}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview Route
                  </Link>
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <section className="grid max-w-[calc(100vw-2rem)] min-w-0 gap-6 sm:max-w-none xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">Preview QA Studio</h2>
                    <p className="text-sm text-muted-foreground">Review a site route by audience and device before live publish and lead-capture smoke are enabled.</p>
                  </div>
                  <Badge variant="outline" className="self-start">
                    <MonitorSmartphone className="mr-1 h-3 w-3" />
                    Provider-light preview
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Public Preview Packet</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedPreviewSite?.label} · {selectedPreviewDevice?.label}
                      </p>
                    </div>
                    <Badge variant="secondary">{previewReadyCount}/{previewReadiness.length} ready</Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Site</Label>
                        <Select value={previewSiteSlug} onValueChange={setPreviewSiteSlug}>
                          <SelectTrigger data-testid="select-kinflo-preview-site">
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.previewStudio.siteOptions.map((site) => (
                              <SelectItem key={site.slug} value={site.slug}>
                                {site.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kinflo-preview-route">Route</Label>
                        <Input
                          id="kinflo-preview-route"
                          value={previewRoute}
                          onChange={(event) => setPreviewRoute(event.target.value)}
                          data-testid="input-kinflo-preview-route"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Device</Label>
                        <Select value={previewDevice} onValueChange={(value) => setPreviewDevice(value as typeof previewDevice)}>
                          <SelectTrigger data-testid="select-kinflo-preview-device">
                            <SelectValue placeholder="Select device" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.previewStudio.deviceOptions.map((device) => (
                              <SelectItem key={device.key} value={device.key}>
                                {device.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Persona</Label>
                        <Select value={previewPersona} onValueChange={setPreviewPersona}>
                          <SelectTrigger data-testid="select-kinflo-preview-persona">
                            <SelectValue placeholder="Select persona" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.previewStudio.personaOptions.map((persona) => (
                              <SelectItem key={persona.key} value={persona.key}>
                                {persona.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Journey stage</Label>
                        <Select value={previewJourneyStage} onValueChange={setPreviewJourneyStage}>
                          <SelectTrigger data-testid="select-kinflo-preview-journey-stage">
                            <SelectValue placeholder="Select journey stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.previewStudio.journeyStageOptions.map((stage) => (
                              <SelectItem key={stage.key} value={stage.key}>
                                {stage.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0 rounded-md border p-4 text-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="font-medium">{selectedPreviewSite?.label}</div>
                            <div className="mt-1 break-all text-xs text-muted-foreground" data-testid="text-kinflo-preview-url">
                              {previewHref}
                            </div>
                          </div>
                          <Badge variant="outline" className="self-start">{selectedPreviewDevice?.width}px</Badge>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-md bg-muted/40 px-3 py-2">
                            <div className="text-xs text-muted-foreground">Persona</div>
                            <div className="font-medium">{previewPersona}</div>
                          </div>
                          <div className="rounded-md bg-muted/40 px-3 py-2">
                            <div className="text-xs text-muted-foreground">Journey</div>
                            <div className="font-medium">{previewJourneyStage}</div>
                          </div>
                          <div className="rounded-md bg-muted/40 px-3 py-2">
                            <div className="text-xs text-muted-foreground">Device</div>
                            <div className="font-medium">{selectedPreviewDevice?.label}</div>
                          </div>
                        </div>
                        <div className="mt-4 rounded-md border px-3 py-2 text-muted-foreground">
                          {selectedPreviewDevice?.evidence}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Readiness</span>
                          <span className="text-muted-foreground">{previewReadinessPercent}%</span>
                        </div>
                        <Progress value={previewReadinessPercent} className="mt-2" />
                        <div className="mt-3 space-y-2">
                          {previewReadiness.map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.done ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <CircleDashed className="h-3.5 w-3.5" />
                              )}
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">{snapshot.previewStudio.providerBoundary}</div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild data-testid="button-open-preview-qa">
                          <Link href={previewHref}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open preview
                          </Link>
                        </Button>
                        <Button disabled variant="outline" data-testid="button-publish-preview-qa">
                          <Rocket className="mr-2 h-4 w-4" />
                          Live publish gated
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Preview Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">Preview reads and publish/lead checks stay gated until generated bindings and smoke approval.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.previewStudio.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span className="min-w-0 break-all">{functionName}</span>
                        <Badge variant="outline">Mapped</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activation Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.previewStudio.activationEvidence.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="site-studio" className="mt-2">
            <section className="min-w-0 space-y-2 overflow-hidden" data-testid="section-kinflo-client-studio-compact-shell">
              <div
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                data-testid="section-kinflo-client-control-room-frame"
              >
                <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="min-w-0 p-2 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        <Command className="mr-1 h-3 w-3" />
                        Control Room
                      </Badge>
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        Local review only
                      </Badge>
                    </div>
                    <h2 className="mt-1 max-w-3xl text-lg font-semibold leading-tight text-slate-950 sm:mt-2 sm:text-2xl">
                      Client Website Design Studio
                    </h2>
                    <p className="mt-2 hidden max-w-3xl text-sm leading-5 text-slate-600 sm:block">
                      Configure the selected client site, inspect the public experience, and keep every provider, publish, lead, invite, campaign, and launch action gated until the activation evidence is complete.
                    </p>
                    <div className="mt-3 hidden grid-cols-2 gap-2 sm:grid lg:grid-cols-4" data-testid="section-kinflo-client-command-stats">
                      {clientWebsiteStudioCommandStats.map((stat) => (
                        <div key={stat.label} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                          <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">{stat.label}</div>
                          <div className="mt-1 truncate text-sm font-semibold text-slate-950">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0 border-t border-slate-200 bg-slate-950 p-2 text-white lg:border-l lg:border-t-0 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-medium uppercase tracking-normal text-slate-400 sm:text-xs">Selected site</div>
                        <div className="mt-0.5 text-base font-semibold leading-snug sm:mt-1 sm:text-lg">{selectedClientWebsiteStudioSite?.label}</div>
                        <p className="mt-1 hidden text-sm leading-5 text-slate-300 sm:block">
                          {selectedClientWebsiteLaunchDecisionPacket?.decisionPosture}
                        </p>
                      </div>
                      <Badge className={`shrink-0 border ${clientWebsiteLaunchDecisionTone}`}>
                        {clientWebsiteLaunchDecisionLabel}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3">
                      <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 sm:px-3 sm:py-2">
                        <div className="text-[11px] uppercase tracking-normal text-slate-400">Readiness</div>
                        <div className="mt-1 text-sm font-semibold">{clientWebsiteStudioReadinessPercent}%</div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 sm:px-3 sm:py-2">
                        <div className="text-[11px] uppercase tracking-normal text-slate-400">Blocked</div>
                        <div className="mt-1 text-sm font-semibold">{clientWebsiteLaunchDecisionBlockedCount}</div>
                      </div>
                      <div className="min-w-0 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 sm:px-3 sm:py-2">
                        <div className="text-[11px] uppercase tracking-normal text-slate-400">Owner</div>
                        <div className="mt-1 truncate text-sm font-semibold">{selectedClientWebsiteLaunchDecisionPacket?.approvalOwner}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="hidden grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:grid lg:grid-cols-4"
                data-testid="section-kinflo-client-studio-operating-frame"
              >
                {clientWebsiteStudioReviewStats.map((stat) => (
                  <div key={stat.label} className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{stat.label}</div>
                    <div className="mt-1 truncate text-sm font-semibold text-slate-950">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div
                className="hidden grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:grid lg:grid-cols-4"
                data-testid="section-kinflo-client-workbench-grid-contract"
              >
                {clientWebsiteWorkbenchGridContract.map((item) => (
                  <div key={item.label} className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
                        <div className="mt-1 truncate text-sm font-semibold text-slate-950">{item.value}</div>
                      </div>
                      <Badge variant="outline" className="shrink-0 bg-white">{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="min-w-0 overflow-hidden" data-testid="tabs-kinflo-client-studio-lanes">
                <div
                  className="sticky top-0 z-20 flex flex-col gap-1 border-y border-slate-200 bg-white/95 py-1.5 backdrop-blur sm:gap-2 sm:py-2 lg:flex-row lg:items-center lg:justify-between"
                  data-testid="section-kinflo-client-studio-lane-switcher"
                >
                  <div className="grid h-auto w-full grid-cols-4 gap-1 rounded-md bg-slate-100 p-1 lg:max-w-3xl" role="tablist" aria-label="Client studio lanes">
                    {[
                      { value: "queue", label: "Spin up", testId: "tab-kinflo-client-studio-lane-queue" },
                      { value: "configuration", label: "Configure", testId: "tab-kinflo-client-studio-lane-configuration" },
                      { value: "handoff", label: "Handoff", testId: "tab-kinflo-client-studio-lane-handoff" },
                      { value: "workbench", label: "Workbench", testId: "tab-kinflo-client-studio-lane-workbench" },
                    ].map((lane) => {
                      const isActiveLane = clientWebsiteStudioLane === lane.value;
                      return (
                        <button
                          key={lane.value}
                          type="button"
                          role="tab"
                          aria-selected={isActiveLane}
                          onClick={() => selectClientWebsiteStudioLane(lane.value as ClientWebsiteStudioLane)}
                          className={`rounded-sm px-2 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
                            isActiveLane
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                          }`}
                          data-testid={lane.testId}
                        >
                          {lane.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="hidden grid-cols-3 gap-2 text-xs sm:grid lg:w-[360px]" data-testid="section-kinflo-client-studio-lane-summary">
                    {[
                      { label: "Requests", value: snapshot.clientWebsiteStudio.spinUpQueue.totalRequests },
                      { label: "Profiles", value: snapshot.clientWebsiteStudio.configurationProfiles.totalProfiles },
                      { label: "Sites", value: snapshot.clientWebsiteStudio.sites.length },
                    ].map((item) => (
                      <div key={item.label} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
                        <div className="truncate text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-950">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`${clientWebsiteStudioLane === "queue" ? "block" : "hidden"} mt-2 max-h-[min(540px,calc(100vh-15rem))] overflow-y-auto overflow-x-hidden pr-1`}
                  data-testid="section-kinflo-client-studio-lane-queue"
                >
                  <ClientWebsiteSpinUpQueue
                    queue={snapshot.clientWebsiteStudio.spinUpQueue}
                    testIds={clientWebsiteSpinUpQueueTestIds}
                  />
                </div>

                <div
                  className={`${clientWebsiteStudioLane === "configuration" ? "block" : "hidden"} mt-2 max-h-[min(540px,calc(100vh-15rem))] overflow-y-auto overflow-x-hidden pr-1`}
                  data-testid="section-kinflo-client-studio-lane-configuration"
                >
                  <ClientWebsiteConfigurationProfiles
                    profiles={snapshot.clientWebsiteStudio.configurationProfiles}
                    selectedReviewPacket={selectedClientWebsiteConfigurationReviewPacket}
                    selectedChangeSet={selectedClientWebsiteConfigurationChangeSet}
                    selectedApprovalMatrix={selectedClientWebsiteConfigurationApprovalMatrix}
                    testIds={clientWebsiteConfigurationProfileTestIds}
                  />
                </div>

                <div
                  className={`${clientWebsiteStudioLane === "handoff" ? "block" : "hidden"} mt-2 max-h-[min(540px,calc(100vh-15rem))] overflow-y-auto overflow-x-hidden pr-1`}
                  data-testid="section-kinflo-client-studio-lane-handoff"
                >
                  <Tabs defaultValue="selected" className="min-w-0" data-testid={clientHandoffWorkspaceTestIds.root}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <TabsList className="grid h-auto w-full grid-cols-2 bg-slate-100 p-1 lg:max-w-xl">
                        <TabsTrigger value="selected" data-testid="tab-kinflo-client-handoff-selected">Selected site</TabsTrigger>
                        <TabsTrigger value="matrix" data-testid="tab-kinflo-client-handoff-matrix">All site permissions</TabsTrigger>
                      </TabsList>
                      <p className="text-xs leading-5 text-slate-500 lg:max-w-lg">
                        Client handoff stays reviewable without forcing the full permission matrix into the default page flow.
                      </p>
                    </div>

                    <TabsContent value="selected" className="mt-3" data-testid={clientHandoffWorkspaceTestIds.selected}>
                      <ClientHandoffPermissionStrip
                        site={selectedClientWebsiteStudioSite}
                        permissionPreset={selectedClientWebsiteAdminPermissionPreset}
                        launchPacket={selectedClientWebsiteLaunchPacket}
                        onboardingReadiness={selectedClientWebsiteOnboardingReadiness}
                        launchSimulation={selectedClientWebsiteLaunchSimulation}
                        testId={clientHandoffPermissionStripTestIds.root}
                      />
                    </TabsContent>

                    <TabsContent value="matrix" className="mt-3" data-testid={clientHandoffWorkspaceTestIds.matrix}>
                      <ClientAdminHandoffMatrix
                        matrix={snapshot.clientWebsiteStudio.adminHandoffMatrix}
                        testIds={clientAdminHandoffMatrixTestIds}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <div
                  className={`${clientWebsiteStudioLane === "workbench" ? "block" : "hidden"} mt-2 max-h-[min(540px,calc(100vh-15rem))] overflow-y-auto overflow-x-hidden pr-1`}
                  data-testid="section-kinflo-client-studio-lane-workbench"
                >
                  <div
                    className="min-w-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:p-3"
                    data-testid="section-kinflo-client-workbench-grid"
                  >
                    <Tabs value={clientWebsiteWorkbenchStage} onValueChange={(value) => selectClientWebsiteWorkbenchStage(value as ClientWebsiteWorkbenchStage)} className="min-w-0" data-testid="tabs-kinflo-client-workbench-stage">
                      <TabsList className="grid h-auto w-full grid-cols-3 bg-slate-100 p-1">
                        <TabsTrigger value="sites" data-testid="tab-kinflo-client-workbench-sites">Sites</TabsTrigger>
                        <TabsTrigger value="preview" data-testid="tab-kinflo-client-workbench-preview">Preview</TabsTrigger>
                        <TabsTrigger value="launch" data-testid="tab-kinflo-client-workbench-launch">Launch</TabsTrigger>
                      </TabsList>

                  <TabsContent value="sites" className="mt-4" data-testid="section-kinflo-client-workbench-sites">
                    <div className="max-h-[calc(100vh-18rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3" data-testid="section-kinflo-client-site-rail">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <div>
                      <div className="text-sm font-semibold">Client sites</div>
                      <div className="mt-0.5 text-xs text-slate-500">Role-adaptive review queue</div>
                    </div>
                    <Badge variant="secondary">{snapshot.clientWebsiteStudio.sites.length}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {snapshot.clientWebsiteStudio.sites.map((site) => {
                      const isSelected = site.key === clientWebsiteStudioSiteKey;
                      return (
                        <button
                          key={site.key}
                          type="button"
                          onClick={() => selectClientWebsiteStudioSite(site.key)}
                          aria-pressed={isSelected}
                          className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                            isSelected
                              ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-medium">{site.label}</div>
                              <div className={`mt-1 truncate text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                                {site.tenantSlug}
                              </div>
                            </div>
                            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${isSelected ? "bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,0.18)]" : "bg-slate-300"}`} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <Badge variant={site.mobileReadiness === "ready" ? "secondary" : "outline"} className={isSelected ? "border-white/10 bg-white/10 text-white hover:bg-white/10" : ""}>Mobile</Badge>
                            <Badge variant={site.navReadiness === "ready" ? "secondary" : "outline"} className={isSelected ? "border-white/10 bg-white/10 text-white hover:bg-white/10" : ""}>Nav</Badge>
                            <Badge variant={site.heroReadiness === "ready" ? "secondary" : "outline"} className={isSelected ? "border-white/10 bg-white/10 text-white hover:bg-white/10" : ""}>Hero</Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3" data-testid="section-kinflo-client-page-tree">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Page tree</div>
                        <div className="mt-0.5 text-xs text-slate-500">Launch blueprint pages</div>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        {selectedClientWebsiteLaunchBlueprint?.defaultPages.length ?? 0}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {(selectedClientWebsiteLaunchBlueprint?.defaultPages ?? []).map((page) => (
                        <div key={page} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                          <span className="min-w-0 truncate">{page}</span>
                          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                        </div>
                      ))}
                    </div>
                  </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-4" data-testid="section-kinflo-client-workbench-preview">
                    <Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm" data-testid="section-kinflo-client-preview-workbench">
                  <CardHeader className="space-y-0 border-b border-slate-100">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Sparkles className="h-4 w-4 text-slate-500" />
                          Preview Workbench
                        </CardTitle>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {selectedClientWebsiteStudioSite?.label} - {selectedClientWebsiteStudioSite?.audience}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
                        {(["Desktop", "Tablet", "Mobile"] as const).map((device) => (
                          <Badge
                            key={device}
                            variant={device === "Desktop" ? "secondary" : "outline"}
                            className={`rounded-md border ${device === "Desktop" ? "border-slate-900 bg-white text-slate-950" : "border-transparent bg-transparent text-slate-500"}`}
                          >
                            {device}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-[min(420px,calc(100vh-18rem))] space-y-4 overflow-y-auto pt-4">
                    <div className="max-h-[280px] overflow-y-auto overflow-x-hidden rounded-xl border border-amber-200 bg-amber-50 p-3" data-testid="section-kinflo-client-preview-review-packet">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                            <FileText className="h-4 w-4" />
                            Preview review packet
                          </div>
                          <p className="mt-1 text-xs leading-5 text-amber-900" data-testid="text-kinflo-client-preview-review-packet">
                            Local review context for the selected client site. Publish, lead capture, and client sharing stay gated.
                          </p>
                        </div>
                        <Badge variant="outline" className="w-fit border-amber-300 bg-white text-amber-900">
                          provider-light
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2" data-testid="section-kinflo-client-preview-review-context">
                        {clientWebsitePreviewReviewContext.map((item) => (
                          <div key={item.label} className="min-w-0 rounded-md border border-amber-200 bg-white px-2 py-1.5">
                            <div className="text-[10px] font-medium uppercase tracking-normal text-amber-700">{item.label}</div>
                            <div className="mt-0.5 truncate text-xs font-semibold text-slate-950" title={item.value}>
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(130px,0.58fr)] gap-2">
                        <div className="grid max-h-32 gap-2 overflow-y-auto pr-1 lg:max-h-40" data-testid="section-kinflo-client-preview-review-evidence">
                          {clientWebsitePreviewReviewEvidence.map((item) => (
                            <div key={item.label} className="flex items-start gap-2 rounded-md border border-amber-200 bg-white p-2 text-xs leading-5 text-slate-700">
                              {item.done ? (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              ) : (
                                <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                              )}
                              <div className="min-w-0">
                                <div className="font-medium text-slate-950">{item.label}</div>
                                <div className="mt-0.5 text-slate-600">{item.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-md border border-amber-200 bg-white p-2" data-testid="section-kinflo-client-preview-review-gates">
                          <div className="text-xs font-medium uppercase tracking-normal text-amber-700">Blocked live actions</div>
                          <div className="mt-2 grid gap-2">
                            {clientWebsitePreviewReviewBlockedActions.map((action) => (
                              <div key={action} className="flex items-start gap-2 text-xs leading-5 text-slate-700">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100" data-testid="section-kinflo-client-preview-canvas">
                      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Globe2 className="h-3.5 w-3.5" />
                          <span className="truncate">{clientWebsiteStudioPreviewPath}</span>
                        </div>
                        <Badge variant="outline" className="border-slate-300 bg-white">Preview only</Badge>
                      </div>
                      <div className="grid gap-5 p-4 2xl:grid-cols-[minmax(0,1fr)_220px] lg:p-5">
                        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-device-frame">
                          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            <div className="min-w-0 text-sm font-semibold text-slate-950">{selectedClientWebsiteStudioSite?.label}</div>
                            <Badge variant="secondary" className="shrink-0">{clientWebsiteStudioStatusLabel}</Badge>
                          </div>
                          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                            {(selectedClientWebsiteLaunchBlueprint?.defaultPages ?? []).slice(0, 5).map((page) => (
                              <span key={page}>{page}</span>
                            ))}
                          </div>
                          <div
                            className="mt-5 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-3"
                            data-testid="section-kinflo-client-preview-link-context"
                          >
                            <div className="min-w-0">
                              <div className="font-medium uppercase tracking-normal text-slate-500">Persona</div>
                              <div className="mt-1 truncate font-semibold text-slate-950">{clientWebsiteStudioPreviewPersona}</div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium uppercase tracking-normal text-slate-500">Journey</div>
                              <div className="mt-1 truncate font-semibold text-slate-950">{clientWebsiteStudioPreviewJourneyStage}</div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium uppercase tracking-normal text-slate-500">Source</div>
                              <div className="mt-1 truncate font-semibold text-slate-950">site-studio-preview</div>
                            </div>
                          </div>
                          <h3 className="mt-5 max-w-2xl text-2xl font-semibold leading-tight tracking-normal text-slate-950 md:text-3xl">
                            {selectedClientWebsiteStudioSite?.heroDirection}
                          </h3>
                          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                            {selectedClientWebsiteStudioSite?.trustSignal}
                          </p>
                          <div className="mt-5 border-t border-dashed border-slate-200 pt-3" data-testid="section-kinflo-client-fold-line">
                            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                              <span>390px fold check</span>
                              <span>Hero, proof, and CTA must remain scannable before launch.</span>
                            </div>
                          </div>
                          <div className="mt-5 flex flex-wrap gap-2">
                            <Button size="sm" asChild data-testid="button-open-client-website-preview">
                              <Link href={clientWebsiteStudioPreviewHref}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open preview
                              </Link>
                            </Button>
                            <Button size="sm" disabled variant="outline" data-testid="button-client-website-publish-gated">
                              <Rocket className="mr-2 h-4 w-4" />
                              Publish gated
                            </Button>
                          </div>
                          <div className="mt-6 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-3">
                            <div>
                              <div className="text-xs font-medium uppercase tracking-normal text-slate-500">CTA</div>
                              <div className="mt-1 truncate text-sm font-medium">{selectedClientWebsiteStudioSite?.primaryCTA}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Audience</div>
                              <div className="mt-1 truncate text-sm font-medium">{selectedClientWebsiteStudioSite?.audience}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Launch</div>
                              <div className="mt-1 text-sm font-medium">Approval gated</div>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Design readiness</span>
                            <span className="text-slate-500">{clientWebsiteStudioReadinessPercent}%</span>
                          </div>
                          <Progress value={clientWebsiteStudioReadinessPercent} className="mt-2" />
                          <Badge variant="secondary" className="mt-3" data-testid="text-kinflo-client-website-readiness">
                            {clientWebsiteStudioReadyCount}/{clientWebsiteStudioReadiness.length} ready
                          </Badge>
                          <div className="mt-4 space-y-2">
                            {clientWebsiteStudioReadiness.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-slate-600">
                                {item.done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <CircleDashed className="h-3.5 w-3.5" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-3" data-testid="section-kinflo-client-control-room-path">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" />
                          Ready proof
                        </div>
                        <p className="mt-2 text-xs leading-5 text-emerald-700">
                          {clientWebsiteLaunchDecisionReadyCount} criterion is accepted for local review and can support the handoff packet.
                        </p>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                          <CircleDashed className="h-4 w-4" />
                          Review queue
                        </div>
                        <p className="mt-2 text-xs leading-5 text-amber-700">
                          Hosted evidence, owner signoff, and rollback acceptance stay visible before any client-facing launch.
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                          <ShieldCheck className="h-4 w-4" />
                          Blocked actions
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {selectedClientWebsiteLaunchDecisionPacket?.blockedLaunchActions.length ?? 0} live actions remain disabled in this provider-light shell.
                        </p>
                      </div>
                    </div>

                    <MobileInspectionMode
                      site={selectedClientWebsiteStudioSite}
                      polishScorecard={selectedClientWebsitePolishScorecard}
                      visualQaBudget={selectedClientWebsiteVisualQaBudget}
                      evidencePacket={selectedClientWebsiteVisualQaEvidencePacket}
                      decisionPacket={selectedClientWebsiteLaunchDecisionPacket}
                      persona={selectedClientWebsiteStarterContentPack?.persona}
                      journeyStage={selectedClientWebsiteStarterContentPack?.journeyStage}
                      previewPath={clientWebsiteStudioMobilePreviewHref}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      {snapshot.clientWebsiteStudio.designPatterns.map((pattern) => {
                        const applies = Boolean(
                          selectedClientWebsiteStudioSite
                          && pattern.appliesTo.includes(selectedClientWebsiteStudioSite.key),
                        );
                        return (
                          <div key={pattern.key} className="rounded-md border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium">{pattern.label}</div>
                                <p className="mt-1 text-sm leading-6 text-slate-600">{pattern.evidence}</p>
                              </div>
                              <Badge variant={applies ? "secondary" : "outline"}>{applies ? "Apply" : "Context"}</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="launch" className="mt-4" data-testid="section-kinflo-client-workbench-launch">
                    <div
                      className="grid max-h-[calc(100vh-18rem)] min-w-0 gap-3 overflow-y-auto overflow-x-hidden pr-1 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:overflow-hidden lg:pr-0"
                      data-testid="section-kinflo-client-launch-rail"
                    >
                      <div className="hidden min-h-0 min-w-0 max-h-[calc(100vh-18rem)] space-y-3 overflow-y-auto overflow-x-hidden pr-1 lg:block" data-testid="section-kinflo-client-launch-command-column">
                  <div className="rounded-2xl border border-slate-900 bg-slate-950 p-3 text-white shadow-sm lg:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-slate-300">Launch command rail</div>
                        <div className="mt-1 text-lg font-semibold">{selectedClientWebsiteStudioSite?.label}</div>
                      </div>
                      <Badge className={`border ${clientWebsiteLaunchDecisionTone}`}>
                        {clientWebsiteLaunchDecisionLabel}
                      </Badge>
                    </div>
                    <p className="mt-3 hidden text-sm leading-6 text-slate-300 lg:block">
                      Blueprint, permissions, evidence, and provider boundaries stay visible while the public site is reviewed.
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <div className="text-[10px] uppercase tracking-normal text-slate-400">Ready</div>
                        <div className="mt-1 text-sm font-semibold">{clientWebsiteLaunchDecisionReadyCount}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <div className="text-[10px] uppercase tracking-normal text-slate-400">Blocked</div>
                        <div className="mt-1 text-sm font-semibold">{clientWebsiteLaunchDecisionBlockedCount}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <div className="text-[10px] uppercase tracking-normal text-slate-400">Signoffs</div>
                        <div className="mt-1 text-sm font-semibold">{selectedClientWebsiteLaunchDecisionPacket?.requiredSignoffs.length ?? 0}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-sm lg:p-4" data-testid="section-kinflo-client-compact-launch-controls">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-amber-950">Compact launch controls</div>
                        <p className="mt-1 hidden text-xs leading-5 text-amber-900 lg:block">
                          Live operations stay disabled until hosted evidence and owner signoff are accepted.
                        </p>
                      </div>
                      <Badge variant="outline" className="border-amber-300 bg-white text-amber-900">
                        Provider-light
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <Button disabled variant="outline" className="justify-start border-amber-300 bg-white text-amber-900 hover:bg-white hover:text-amber-900" data-testid="button-client-compact-publish-gated">
                        <Rocket className="mr-2 h-4 w-4" />
                        Publish gated
                      </Button>
                      <Button disabled variant="outline" className="justify-start border-amber-300 bg-white text-amber-900 hover:bg-white hover:text-amber-900" data-testid="button-client-compact-handoff-gated">
                        <MailPlus className="mr-2 h-4 w-4" />
                        Handoff gated
                      </Button>
                      <Button disabled variant="outline" className="justify-start border-amber-300 bg-white text-amber-900 hover:bg-white hover:text-amber-900" data-testid="button-client-compact-domain-gated">
                        <Globe2 className="mr-2 h-4 w-4" />
                        Domain gated
                      </Button>
                    </div>
                    <div className="mt-3 hidden space-y-2 lg:block">
                      {selectedClientWebsiteLaunchDecisionPacket?.blockedLaunchActions.slice(0, 3).map((action) => (
                        <div key={action} className="flex items-start gap-2 text-xs leading-5 text-amber-900">
                          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
                    <Label>Client site</Label>
                    <Select value={clientWebsiteStudioSiteKey} onValueChange={selectClientWebsiteStudioSite}>
                      <SelectTrigger className="mt-2" data-testid="select-kinflo-client-website-site">
                        <SelectValue placeholder="Select client site" />
                      </SelectTrigger>
                      <SelectContent>
                        {snapshot.clientWebsiteStudio.sites.map((site) => (
                          <SelectItem key={site.key} value={site.key}>
                            {site.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="hidden rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm lg:block">
                    {snapshot.clientWebsiteStudio.providerBoundary}
                  </div>
                      </div>

                      <Tabs
                        value={clientWebsiteLaunchDossier}
                        onValueChange={(value) => selectClientWebsiteLaunchDossier(value as ClientWebsiteLaunchDossier)}
                        className="min-h-0 min-w-0 max-h-[calc(100vh-18rem)] overflow-hidden"
                        data-testid="tabs-kinflo-client-launch-dossier"
                      >
                        <TabsList className="grid h-auto w-full grid-cols-4 bg-slate-100 p-1">
                          <TabsTrigger value="provisioning" data-testid="tab-kinflo-client-launch-dossier-provisioning">Provision</TabsTrigger>
                          <TabsTrigger value="packets" data-testid="tab-kinflo-client-launch-dossier-packets">Packets</TabsTrigger>
                          <TabsTrigger value="qa" data-testid="tab-kinflo-client-launch-dossier-qa">QA</TabsTrigger>
                          <TabsTrigger value="decision" data-testid="tab-kinflo-client-launch-dossier-decision">Decision</TabsTrigger>
                        </TabsList>

                        <TabsContent
                          value="provisioning"
                          className="mt-2 max-h-[calc(100vh-21rem)] overflow-hidden pr-0"
                          data-testid="section-kinflo-client-launch-dossier-provisioning"
                        >

                  <div className="flex max-h-[min(340px,calc(100vh-21rem))] flex-col overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:p-3 lg:p-4" data-testid="section-kinflo-client-provisioning-workbench">
                    <div className="flex shrink-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Workflow className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">Provisioning workbench</h3>
                          <Badge variant="secondary" className="text-[10px]">Provisioning Order</Badge>
                        </div>
                        <p className="mt-0.5 text-sm leading-5 text-slate-600" data-testid="text-kinflo-client-provisioning-order">
                          {selectedClientWebsiteProvisioningOrder?.label}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedClientWebsiteProvisioningOrder?.orderStatus.replaceAll("_", " ")}</Badge>
                    </div>

                    <div className="mt-2 grid shrink-0 grid-cols-4 gap-1 sm:gap-2" data-testid="section-kinflo-client-provisioning-summary-chips">
                      {[
                        { label: "Plan", value: selectedClientWebsiteProvisioningOrder?.requestedPlan },
                        { label: "Template", value: selectedClientWebsiteProvisioningOrder?.templateKey },
                        { label: "Owner", value: selectedClientWebsiteProvisioningOrder?.ownerRole },
                        { label: "Invite", value: selectedClientWebsiteProvisioningOrder?.inviteRole },
                      ].map((item) => (
                        <div key={item.label} className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 sm:px-2 sm:py-2">
                          <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
                          <div className="mt-0.5 truncate text-[11px] font-semibold text-slate-950 sm:text-xs" title={item.value}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Tabs defaultValue="order" className="mt-3 flex min-h-0 flex-1 flex-col" data-testid="tabs-kinflo-client-provisioning-workbench">
                      <TabsList className="grid h-auto w-full shrink-0 grid-cols-2 bg-slate-100 p-1">
                        <TabsTrigger value="order" data-testid="tab-kinflo-client-provisioning-order">Order</TabsTrigger>
                        <TabsTrigger value="dry-run" data-testid="tab-kinflo-client-provisioning-dry-run">Dry run</TabsTrigger>
                      </TabsList>

                      <TabsContent value="order" className="mt-3 min-h-0 flex-1" data-testid="section-kinflo-client-provisioning-order">
                        <div
                          className="grid max-h-[190px] min-h-0 grid-cols-[minmax(118px,0.82fr)_minmax(140px,1.18fr)] gap-2 overflow-y-auto overflow-x-hidden sm:max-h-[240px] lg:max-h-[360px]"
                          data-testid="section-kinflo-client-provisioning-order-cockpit"
                        >
                          <div
                            className="min-h-0 rounded-md border border-slate-200 bg-slate-50 p-2 sm:p-3"
                            data-testid="section-kinflo-client-provisioning-order-scroll"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium">Setup order</div>
                                <div className="mt-0.5 text-xs text-slate-500">
                                  {selectedClientWebsiteProvisioningOrder?.setupSteps.length ?? 0} provider-light steps
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-white">Ordered</Badge>
                            </div>
                            <div className="mt-2 max-h-[108px] space-y-2 overflow-y-auto pr-1 sm:max-h-[145px] lg:max-h-[230px]">
                              {selectedClientWebsiteProvisioningOrder?.setupSteps.map((step, index) => (
                                <div key={step} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] leading-4 text-slate-600 sm:grid-cols-[1.5rem_minmax(0,1fr)] sm:gap-2 sm:px-3 sm:py-2 sm:text-xs sm:leading-5">
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500 sm:h-6 sm:w-6">
                                    {index + 1}
                                  </div>
                                  <span className="min-w-0">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div
                            className="min-h-0 rounded-md border border-slate-200 bg-white p-2 sm:p-3"
                            data-testid="section-kinflo-client-provisioning-order-detail-tabs"
                          >
                            <Tabs defaultValue="evidence" className="min-h-0" data-testid="tabs-kinflo-client-provisioning-order-detail">
                              <TabsList className="grid h-auto w-full grid-cols-3 bg-slate-100 p-1">
                                <TabsTrigger value="evidence" className="px-1 text-[11px] sm:text-xs" data-testid="tab-kinflo-client-provisioning-evidence">Evidence</TabsTrigger>
                                <TabsTrigger value="blocked" className="px-1 text-[11px] sm:text-xs" data-testid="tab-kinflo-client-provisioning-blocked">Blocked</TabsTrigger>
                                <TabsTrigger value="functions" className="px-1 text-[11px] sm:text-xs" data-testid="tab-kinflo-client-provisioning-functions">Functions</TabsTrigger>
                              </TabsList>

                              <TabsContent value="evidence" className="mt-2 sm:mt-3" data-testid="section-kinflo-client-provisioning-evidence-panel">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-medium">Approval evidence</div>
                                    <div className="mt-0.5 text-xs text-slate-500">
                                      {selectedClientWebsiteProvisioningOrder?.approvalEvidence.length ?? 0} required proof items
                                    </div>
                                  </div>
                                  <Badge variant="secondary">Proof first</Badge>
                                </div>
                                <div className="mt-2 grid max-h-[108px] gap-2 overflow-y-auto pr-1 sm:max-h-[145px] lg:max-h-[230px]">
                                  {selectedClientWebsiteProvisioningOrder?.approvalEvidence.map((item) => (
                                    <div key={item} className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-[11px] font-medium leading-4 text-emerald-800 sm:px-3 sm:py-2 sm:text-xs sm:leading-5">
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>

                              <TabsContent value="blocked" className="mt-2 sm:mt-3" data-testid="section-kinflo-client-provisioning-blocked-panel">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-medium">Blocked live actions</div>
                                    <div className="mt-0.5 text-xs text-slate-500">
                                      {selectedClientWebsiteProvisioningOrder?.blockedActions.length ?? 0} actions remain gated
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Gated</Badge>
                                </div>
                                <div className="mt-2 grid max-h-[108px] gap-2 overflow-y-auto pr-1 sm:max-h-[145px] lg:max-h-[230px]">
                                  {selectedClientWebsiteProvisioningOrder?.blockedActions.map((action) => (
                                    <div key={action} className="flex items-start gap-1.5 rounded-md border border-slate-100 bg-slate-50 p-2 text-[11px] leading-4 text-slate-600 sm:gap-2 sm:text-xs sm:leading-5">
                                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                      <span>{action}</span>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>

                              <TabsContent value="functions" className="mt-2 sm:mt-3" data-testid="section-kinflo-client-provisioning-functions-panel">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-medium">Convex contract</div>
                                    <div className="mt-0.5 text-xs text-slate-500">
                                      {selectedClientWebsiteProvisioningOrder?.convexFunctions.length ?? 0} mapped functions
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="bg-white">Mapped</Badge>
                                </div>
                                <div className="mt-2 flex max-h-[108px] flex-wrap gap-1.5 overflow-y-auto pr-1 sm:max-h-[145px] lg:max-h-[230px]">
                                  {selectedClientWebsiteProvisioningOrder?.convexFunctions.map((functionName) => (
                                    <Badge key={functionName} variant="outline" className="max-w-full whitespace-normal break-all text-left text-[11px]">{functionName}</Badge>
                                  ))}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </div>
                        <Button disabled variant="outline" className="mt-2 hidden h-9 w-full lg:flex" data-testid="button-client-provisioning-order-gated">
                          <Workflow className="mr-2 h-4 w-4" />
                          Provisioning gated
                        </Button>
                      </TabsContent>

                      <TabsContent value="dry-run" className="mt-3 min-h-0 flex-1" data-testid="section-kinflo-client-provisioning-execution">
                        <div className="max-h-[190px] space-y-2 overflow-y-auto pr-1 sm:max-h-[240px] lg:max-h-[360px]" data-testid="section-kinflo-client-provisioning-dry-run-scroll">
                          <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <ListChecks className="h-4 w-4 text-slate-500" />
                                  <div className="text-sm font-semibold">Execution Dry Run</div>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-slate-600" data-testid="text-kinflo-client-provisioning-execution">
                                  {snapshot.clientWebsiteStudio.provisioningExecution.manifestPath}
                                </p>
                              </div>
                              <Badge variant="outline">{snapshot.clientWebsiteStudio.provisioningExecution.status.replaceAll("_", " ")}</Badge>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {[
                                { label: "Orders", value: snapshot.clientWebsiteStudio.provisioningExecution.totalOrders },
                                { label: "Steps", value: snapshot.clientWebsiteStudio.provisioningExecution.dryRunSteps },
                                { label: "Functions", value: snapshot.clientWebsiteStudio.provisioningExecution.referencedFunctions },
                              ].map((item) => (
                                <div key={item.label} className="rounded-md border border-slate-200 bg-white p-2">
                                  <div className="text-[10px] font-medium uppercase tracking-normal text-slate-500">{item.label}</div>
                                  <div className="mt-1 text-xs font-semibold">{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <p className="text-xs leading-5 text-slate-600">
                            {snapshot.clientWebsiteStudio.provisioningExecution.providerBoundary}
                          </p>

                          <div>
                            <div className="text-sm font-medium">Selected order steps</div>
                            <div className="mt-2 space-y-2">
                              {selectedClientWebsiteProvisioningExecution?.steps.map((step) => (
                                <div key={step.id} className="rounded-md border border-slate-200 p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 text-sm font-medium">{step.id}</div>
                                    <Badge variant="secondary">{step.mode}</Badge>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    {step.blockedLiveActions.map((action) => (
                                      <div key={action} className="flex items-start gap-2 text-xs text-slate-600">
                                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        <span>{action}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium">Blocked until</div>
                            <div className="mt-2 grid gap-2">
                              {snapshot.clientWebsiteStudio.provisioningExecution.blockedUntil.map((gate) => (
                                <div key={gate} className="flex items-start gap-2 rounded-md border border-slate-100 bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                                  <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                  <span>{gate}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Button disabled variant="outline" className="mt-3 hidden w-full lg:flex" data-testid="button-client-provisioning-dry-run-gated">
                          <ListChecks className="mr-2 h-4 w-4" />
                          Dry run gated
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>

                        </TabsContent>

                        <TabsContent
                          value="packets"
                          className="mt-3 grid max-h-[calc(100vh-21rem)] gap-3 overflow-y-auto pr-1 xl:grid-cols-2"
                          data-testid="section-kinflo-client-launch-dossier-packets"
                        >

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-launch-packet">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">Launch Packet</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-client-launch-packet">
                          {selectedClientWebsiteLaunchPacket?.label}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedClientWebsiteLaunchPacket?.status.replaceAll("_", " ")}</Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Readiness</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteLaunchPacket?.readinessScore}%</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Sections</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteLaunchPacket?.packetSections.length}</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Invite</div>
                        <div className="mt-1 break-words text-sm font-medium">{selectedClientWebsiteLaunchPacket?.adminInviteStatus}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Manifest</div>
                      <div className="mt-1 break-all text-sm text-slate-700">{selectedClientWebsiteLaunchPacket?.manifestPath}</div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Packet sections</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedClientWebsiteLaunchPacket?.packetSections.map((section) => (
                          <Badge key={section} variant="secondary" className="whitespace-normal text-left">{section}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Handoff checklist</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteLaunchPacket?.handoffChecklist.map((item) => (
                          <div key={item} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedClientWebsiteLaunchPacket?.blockedExportActions.map((action) => (
                          <Badge key={action} variant="outline" className="whitespace-normal text-left">{action}</Badge>
                        ))}
                      </div>
                      <Button disabled variant="outline" className="mt-4 w-full" data-testid="button-client-launch-packet-export-gated">
                        <FileText className="mr-2 h-4 w-4" />
                        Export gated
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-starter-content-pack">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">Starter Content Pack</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-client-starter-content-pack">
                          {selectedClientWebsiteStarterContentPack?.label}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedClientWebsiteStarterContentPack?.status.replaceAll("_", " ")}</Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Pages</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteStarterContentPack?.pageCount}</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Blocks</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteStarterContentPack?.blockCount}</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Template</div>
                        <div className="mt-1 break-words text-sm font-medium">{selectedClientWebsiteStarterContentPack?.templateKey}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Audience</div>
                      <div className="mt-1 text-sm text-slate-700">{selectedClientWebsiteStarterContentPack?.persona}</div>
                      <div className="mt-2 text-xs text-slate-500">{selectedClientWebsiteStarterContentPack?.journeyStage}</div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Starter pages</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteStarterContentPack?.pages.map((page) => (
                          <div key={page.pageKey} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{page.title}</div>
                                <div className="mt-1 text-xs text-slate-500">{page.route}</div>
                              </div>
                              <Badge variant="secondary">{page.blockTitles.length} blocks</Badge>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-600">{page.purpose}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {page.blockTitles.map((title) => (
                                <Badge key={title} variant="outline" className="whitespace-normal text-left">{title}</Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Handoff notes</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteStarterContentPack?.handoffNotes.map((note) => (
                          <div key={note} className="flex items-start gap-2 text-xs text-slate-600">
                            <CircleDashed className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedClientWebsiteStarterContentPack?.blockedSeedingActions.map((action) => (
                          <Badge key={action} variant="outline" className="whitespace-normal text-left">{action}</Badge>
                        ))}
                      </div>
                      <Button disabled variant="outline" className="mt-4 w-full" data-testid="button-client-starter-content-seed-gated">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Content seed gated
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-onboarding-readiness">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <ListChecks className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">Onboarding Readiness</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-client-onboarding-readiness">
                          {selectedClientWebsiteOnboardingReadiness?.label}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedClientWebsiteOnboardingReadiness?.status.replaceAll("_", " ")}</Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Score</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteOnboardingReadiness?.readinessScore}%</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Tasks</div>
                        <div className="mt-1 text-sm font-medium">
                          {selectedClientWebsiteOnboardingReadiness?.completedTasks}/{selectedClientWebsiteOnboardingReadiness?.totalTasks}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Open</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteOnboardingReadiness?.openTasks}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                      <div className="text-xs font-medium uppercase tracking-normal text-amber-800">Critical blockers</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteOnboardingReadiness?.criticalBlockers.map((blocker) => (
                          <div key={blocker} className="flex items-start gap-2 text-xs text-amber-900">
                            <ShieldCheck className="mt-0.5 h-3.5 w-3.5" />
                            <span>{blocker}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {selectedClientWebsiteOnboardingReadiness?.taskGroups.map((group) => (
                        <div key={group.groupKey} className="rounded-md border border-slate-200 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium">{group.label}</div>
                              <div className="mt-1 text-xs text-slate-500">{group.ownerRole}</div>
                            </div>
                            <Badge variant="secondary">{group.tasks.length} tasks</Badge>
                          </div>
                          <div className="mt-3 space-y-2">
                            {group.tasks.map((task) => (
                              <div key={task.taskKey} className="rounded-md border border-slate-100 p-2">
                                <div className="flex items-start gap-2">
                                  {task.status === "complete" ? (
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <CircleDashed className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium text-slate-700">{task.label}</div>
                                    <div className="mt-1 text-xs leading-5 text-slate-500">{task.evidence}</div>
                                  </div>
                                  <Badge variant={task.status === "blocked" ? "destructive" : "outline"} className="ml-auto whitespace-nowrap">
                                    {task.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Next action</div>
                      <div className="mt-1 text-sm leading-6 text-slate-700">{selectedClientWebsiteOnboardingReadiness?.nextAction}</div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedClientWebsiteOnboardingReadiness?.blockedActivationActions.map((action) => (
                          <Badge key={action} variant="outline" className="whitespace-normal text-left">{action}</Badge>
                        ))}
                      </div>
                      <Button disabled variant="outline" className="mt-4 w-full" data-testid="button-client-onboarding-readiness-gated">
                        <ListChecks className="mr-2 h-4 w-4" />
                        Onboarding activation gated
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-launch-simulation">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Rocket className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">15-Minute Launch Simulation</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-client-launch-simulation">
                          {selectedClientWebsiteLaunchSimulation?.label}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedClientWebsiteLaunchSimulation?.status.replaceAll("_", " ")}</Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Estimate</div>
                        <div className="mt-1 text-sm font-medium">
                          {selectedClientWebsiteLaunchSimulation?.estimatedMinutes}/{selectedClientWebsiteLaunchSimulation?.targetMinutes} min
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Preview</div>
                        <div className="mt-1 break-all text-sm font-medium">{selectedClientWebsiteLaunchSimulation?.previewPath}</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Invite</div>
                        <div className="mt-1 break-words text-sm font-medium">{selectedClientWebsiteLaunchSimulation?.adminInvitePosture}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Outcome</div>
                      <div className="mt-1 text-sm leading-6 text-slate-700">{selectedClientWebsiteLaunchSimulation?.launchOutcome}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant={selectedClientWebsiteLaunchSimulation?.withinTarget ? "secondary" : "destructive"}>
                          {selectedClientWebsiteLaunchSimulation?.withinTarget ? "within 15 min" : "over target"}
                        </Badge>
                        <Badge variant={selectedClientWebsiteLaunchSimulation?.previewLinkReady ? "secondary" : "outline"}>
                          preview prepared
                        </Badge>
                        <Badge variant={selectedClientWebsiteLaunchSimulation?.adminInviteReady ? "secondary" : "outline"}>
                          invite prepared
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Timeline</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteLaunchSimulation?.timeline.map((step) => (
                          <div key={step.stepKey} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-start gap-2">
                              {step.status === "ready" ? (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <CircleDashed className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{step.label}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">{step.evidence}</div>
                              </div>
                              <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                                <Badge variant={step.status === "blocked" ? "destructive" : "outline"}>{step.status}</Badge>
                                <span className="text-xs text-slate-500">{step.estimatedMinutes} min</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Handoff artifacts</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedClientWebsiteLaunchSimulation?.handoffArtifacts.map((artifact) => (
                          <Badge key={artifact} variant="secondary" className="whitespace-normal text-left">{artifact}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedClientWebsiteLaunchSimulation?.blockedLiveActions.map((action) => (
                          <Badge key={action} variant="outline" className="whitespace-normal text-left">{action}</Badge>
                        ))}
                      </div>
                      <Button disabled variant="outline" className="mt-4 w-full" data-testid="button-client-launch-simulation-gated">
                        <Rocket className="mr-2 h-4 w-4" />
                        Live launch simulation gated
                      </Button>
                    </div>
                  </div>

                        </TabsContent>

                        <TabsContent
                          value="qa"
                          className="mt-3 grid max-h-[calc(100vh-21rem)] gap-3 overflow-y-auto pr-1 xl:grid-cols-2"
                          data-testid="section-kinflo-client-launch-dossier-qa"
                        >

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-polish-scorecard">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">Polish Scorecard</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-client-polish-scorecard">
                          {selectedClientWebsitePolishScorecard?.label}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedClientWebsitePolishScorecard?.status.replaceAll("_", " ")}</Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Overall</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsitePolishScorecard?.overallScore}%</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Mobile</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsitePolishScorecard?.mobileScore}%</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Proof</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsitePolishScorecard?.proofScore}%</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Access</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsitePolishScorecard?.accessibilityScore}%</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Design standard</div>
                      <div className="mt-1 text-sm leading-6 text-slate-700">{selectedClientWebsitePolishScorecard?.designStandard}</div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Criteria</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsitePolishScorecard?.criteria.map((criterion) => (
                          <div key={criterion.key} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-start gap-2">
                              {criterion.status === "pass" ? (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <CircleDashed className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{criterion.label}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">{criterion.evidence}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-600">{criterion.nextAction}</div>
                              </div>
                              <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                                <Badge variant={criterion.status === "blocked" ? "destructive" : "outline"}>{criterion.status}</Badge>
                                <span className="text-xs text-slate-500">{criterion.score}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Viewport checks</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsitePolishScorecard?.viewportChecks.map((check) => (
                          <div key={check.viewport} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{check.label}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">{check.evidence}</div>
                              </div>
                              <Badge variant={check.status === "blocked" ? "destructive" : check.status === "pass" ? "secondary" : "outline"}>
                                {check.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedClientWebsitePolishScorecard?.blockedPolishActions.map((action) => (
                          <Badge key={action} variant="outline" className="whitespace-normal text-left">{action}</Badge>
                        ))}
                      </div>
                      <Button disabled variant="outline" className="mt-4 w-full" data-testid="button-client-polish-review-gated">
                        <Palette className="mr-2 h-4 w-4" />
                        Polish review gated
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-visual-qa-budget">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <MonitorSmartphone className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">Visual QA Budget</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-client-visual-qa-budget">
                          {selectedClientWebsiteVisualQaBudget?.label}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedClientWebsiteVisualQaBudget?.status.replaceAll("_", " ")}</Badge>
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">QA target</div>
                      <div className="mt-1 text-sm leading-6 text-slate-700">{selectedClientWebsiteVisualQaBudget?.qaTarget}</div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Screens</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteVisualQaBudget?.screenshotPlan.length}</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Access</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteVisualQaBudget?.accessibilityChecks.length}</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Budgets</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteVisualQaBudget?.performanceBudgets.length}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Screenshot plan</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteVisualQaBudget?.screenshotPlan.map((check) => (
                          <div key={`${check.viewport}-${check.route}`} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium capitalize">{check.viewport}</div>
                                <div className="mt-1 break-all text-xs text-slate-500">{check.route}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-600">{check.requiredEvidence}</div>
                              </div>
                              <Badge variant={check.status === "blocked" ? "destructive" : check.status === "pass" ? "secondary" : "outline"}>
                                {check.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Accessibility checks</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteVisualQaBudget?.accessibilityChecks.map((check) => (
                          <div key={check.key} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-start gap-2">
                              {check.status === "pass" ? (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <CircleDashed className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{check.label}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">{check.evidence}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-600">{check.nextAction}</div>
                              </div>
                              <Badge variant={check.status === "blocked" ? "destructive" : "outline"} className="ml-auto shrink-0">
                                {check.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Performance budgets</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteVisualQaBudget?.performanceBudgets.map((budget) => (
                          <div key={`${budget.metric}-${budget.label}`} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{budget.label}</div>
                                <div className="mt-1 text-xs text-slate-500">{budget.budget} - {budget.currentEstimate}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-600">{budget.evidence}</div>
                              </div>
                              <Badge variant={budget.status === "blocked" ? "destructive" : budget.status === "pass" ? "secondary" : "outline"}>
                                {budget.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Regression targets</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedClientWebsiteVisualQaBudget?.regressionTargets.map((target) => (
                          <Badge key={target} variant="secondary" className="whitespace-normal text-left">{target}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedClientWebsiteVisualQaBudget?.blockedQaActions.map((action) => (
                          <Badge key={action} variant="outline" className="whitespace-normal text-left">{action}</Badge>
                        ))}
                      </div>
                      <Button disabled variant="outline" className="mt-4 w-full" data-testid="button-client-visual-qa-gated">
                        <MonitorSmartphone className="mr-2 h-4 w-4" />
                        Visual QA gated
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-visual-qa-evidence-packet">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">Visual QA Evidence</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-client-visual-qa-evidence-packet">
                          {selectedClientWebsiteVisualQaEvidencePacket?.label}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedClientWebsiteVisualQaEvidencePacket?.status.replaceAll("_", " ")}</Badge>
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Evidence posture</div>
                      <div className="mt-1 text-sm leading-6 text-slate-700">{selectedClientWebsiteVisualQaEvidencePacket?.evidencePosture}</div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Artifacts</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteVisualQaEvidencePacket?.evidenceItems.length}</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Accepted</div>
                        <div className="mt-1 text-sm font-medium">
                          {selectedClientWebsiteVisualQaEvidencePacket?.evidenceItems.filter((item) => item.status === "accepted").length}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Blocked</div>
                        <div className="mt-1 text-sm font-medium">
                          {selectedClientWebsiteVisualQaEvidencePacket?.evidenceItems.filter((item) => item.status === "blocked").length}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Risks</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteVisualQaEvidencePacket?.openRisks.length}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Required artifacts</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteVisualQaEvidencePacket?.evidenceItems.map((item) => (
                          <div key={item.key} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{item.label}</div>
                                <div className="mt-1 text-xs uppercase tracking-normal text-slate-500">{item.kind} · {item.owner}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-600">{item.requiredArtifact}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">{item.currentEvidence}</div>
                              </div>
                              <Badge variant={item.status === "blocked" ? "destructive" : item.status === "accepted" ? "secondary" : "outline"}>
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Approval checklist</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteVisualQaEvidencePacket?.approvalChecklist.map((item) => (
                          <div key={item.key} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-start gap-2">
                              {item.status === "ready" ? (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <CircleDashed className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{item.label}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-600">{item.decisionGate}</div>
                              </div>
                              <Badge variant={item.status === "blocked" ? "destructive" : "outline"} className="ml-auto shrink-0">
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Open risks</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedClientWebsiteVisualQaEvidencePacket?.openRisks.map((risk) => (
                          <Badge key={risk} variant="secondary" className="whitespace-normal text-left">{risk}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedClientWebsiteVisualQaEvidencePacket?.blockedEvidenceActions.map((action) => (
                          <Badge key={action} variant="outline" className="whitespace-normal text-left">{action}</Badge>
                        ))}
                      </div>
                      <Button disabled variant="outline" className="mt-4 w-full" data-testid="button-client-visual-qa-evidence-gated">
                        <FileText className="mr-2 h-4 w-4" />
                        Visual QA evidence gated
                      </Button>
                    </div>
                  </div>

                  <ProofBeforePublishCards
                    evidencePacket={selectedClientWebsiteVisualQaEvidencePacket}
                    decisionPacket={selectedClientWebsiteLaunchDecisionPacket}
                  />

                        </TabsContent>

                        <TabsContent
                          value="decision"
                          className="mt-3 grid max-h-[calc(100vh-21rem)] gap-3 overflow-y-auto pr-1 xl:grid-cols-2"
                          data-testid="section-kinflo-client-launch-dossier-decision"
                        >

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-launch-decision-packet">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">Launch Decision</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-client-launch-decision-packet">
                          {selectedClientWebsiteLaunchDecisionPacket?.label}
                        </p>
                      </div>
                      <Badge variant={selectedClientWebsiteLaunchDecisionPacket?.launchDecision === "no_go" ? "destructive" : "outline"}>
                        {selectedClientWebsiteLaunchDecisionPacket?.launchDecision.replaceAll("_", " ")}
                      </Badge>
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Decision posture</div>
                      <div className="mt-1 text-sm leading-6 text-slate-700">{selectedClientWebsiteLaunchDecisionPacket?.decisionPosture}</div>
                      <div className="mt-2 text-xs text-slate-500">Owner: {selectedClientWebsiteLaunchDecisionPacket?.approvalOwner}</div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Criteria</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteLaunchDecisionPacket?.decisionCriteria.length}</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Ready</div>
                        <div className="mt-1 text-sm font-medium">
                          {selectedClientWebsiteLaunchDecisionPacket?.decisionCriteria.filter((item) => item.status === "ready").length}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Blocked</div>
                        <div className="mt-1 text-sm font-medium">
                          {selectedClientWebsiteLaunchDecisionPacket?.decisionCriteria.filter((item) => item.status === "blocked").length}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Signoffs</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteLaunchDecisionPacket?.requiredSignoffs.length}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Decision criteria</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteLaunchDecisionPacket?.decisionCriteria.map((criterion) => (
                          <div key={criterion.key} className="rounded-md border border-slate-200 p-3">
                            <div className="flex items-start gap-2">
                              {criterion.status === "ready" ? (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <CircleDashed className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{criterion.label}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">{criterion.evidence}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-600">{criterion.decisionGate}</div>
                              </div>
                              <Badge variant={criterion.status === "blocked" ? "destructive" : "outline"} className="ml-auto shrink-0">
                                {criterion.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">Rollback plan</div>
                          <div className="mt-1 text-xs text-slate-500">Owner: {selectedClientWebsiteLaunchDecisionPacket?.rollbackPlan.owner}</div>
                        </div>
                        <Badge variant={selectedClientWebsiteLaunchDecisionPacket?.rollbackPlan.status === "blocked" ? "destructive" : "outline"}>
                          {selectedClientWebsiteLaunchDecisionPacket?.rollbackPlan.status}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {selectedClientWebsiteLaunchDecisionPacket?.rollbackPlan.steps.map((step) => (
                          <div key={step} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                            <CircleDashed className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Required signoffs</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedClientWebsiteLaunchDecisionPacket?.requiredSignoffs.map((signoff) => (
                          <Badge key={signoff} variant="secondary" className="whitespace-normal text-left">{signoff}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedClientWebsiteLaunchDecisionPacket?.blockedLaunchActions.map((action) => (
                          <Badge key={action} variant="outline" className="whitespace-normal text-left">{action}</Badge>
                        ))}
                      </div>
                      <Button disabled variant="outline" className="mt-4 w-full" data-testid="button-client-launch-decision-gated">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Launch decision gated
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-website-blueprint">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <ListChecks className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">Launch Blueprint</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-client-website-blueprint">
                          {selectedClientWebsiteLaunchBlueprint?.label}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedClientWebsiteLaunchBlueprint?.ownerRole}</Badge>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="text-sm font-medium">Default pages</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedClientWebsiteLaunchBlueprint?.defaultPages.map((page) => (
                            <Badge key={page} variant="secondary">{page}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Permission gates</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedClientWebsiteLaunchBlueprint?.adminPermissionGates.map((permission) => (
                            <Badge key={permission} variant="outline">{permission}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Blocked provider actions</div>
                        <div className="mt-2 space-y-2">
                          {selectedClientWebsiteLaunchBlueprint?.blockedProviderActions.map((action) => (
                            <div key={action} className="flex items-start gap-2 text-xs text-slate-600">
                              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Launch sequence</div>
                        <div className="mt-2 space-y-2">
                          {selectedClientWebsiteLaunchBlueprint?.launchSequence.map((step) => (
                            <div key={step} className="flex items-start gap-2 text-sm text-slate-600">
                              <CircleDashed className="mt-0.5 h-4 w-4 text-slate-400" />
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedClientWebsiteLaunchBlueprint?.convexFunctions.map((functionName) => (
                          <Badge key={functionName} variant="outline" className="max-w-full whitespace-normal break-all text-left">{functionName}</Badge>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 w-full"
                        disabled={!selectedClientWebsiteLaunchBlueprint?.launchPacketId}
                        onClick={() => {
                          if (selectedClientWebsiteLaunchBlueprint?.launchPacketId) {
                            setSelectedLaunchPacketId(selectedClientWebsiteLaunchBlueprint.launchPacketId);
                            selectShellTab("factory");
                          }
                        }}
                        data-testid="button-open-client-website-blueprint-factory"
                      >
                        <Factory className="mr-2 h-4 w-4" />
                        Open factory packet
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-testid="section-kinflo-client-admin-permission-preset">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4 text-slate-500" />
                          <h3 className="text-base font-semibold">Admin Permission Preset</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600" data-testid="text-kinflo-client-admin-permission-preset">
                          {selectedClientWebsiteAdminPermissionPreset?.label}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedClientWebsiteAdminPermissionPreset?.scope} scope</Badge>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {selectedClientWebsiteAdminPermissionPreset?.description}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Owner role</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteAdminPermissionPreset?.ownerRole}</div>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">Invite role</div>
                        <div className="mt-1 text-sm font-medium">{selectedClientWebsiteAdminPermissionPreset?.inviteRole}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Permission set</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedClientWebsiteAdminPermissionPreset?.permissionSet.map((permission) => (
                          <Badge key={permission} variant="outline">{permission}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Approval gates</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteAdminPermissionPreset?.approvalGates.map((gate) => (
                          <div key={gate} className="flex items-start gap-2 text-sm text-slate-600">
                            <CircleDashed className="mt-0.5 h-4 w-4 text-slate-400" />
                            <span>{gate}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium">Blocked permission actions</div>
                      <div className="mt-2 space-y-2">
                        {selectedClientWebsiteAdminPermissionPreset?.blockedActions.map((action) => (
                          <div key={action} className="flex items-start gap-2 text-xs text-slate-600">
                            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedClientWebsiteAdminPermissionPreset?.convexFunctions.map((functionName) => (
                          <Badge key={functionName} variant="outline" className="max-w-full whitespace-normal break-all text-left">{functionName}</Badge>
                        ))}
                      </div>
                      <Button disabled variant="outline" className="mt-4 w-full" data-testid="button-client-admin-permission-gated">
                        <UserRoundCog className="mr-2 h-4 w-4" />
                        Admin handoff gated
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-medium">Activation Evidence</div>
                    <div className="mt-3 space-y-2">
                      {snapshot.clientWebsiteStudio.activationEvidence.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-slate-600">
                          <CircleDashed className="mt-0.5 h-4 w-4 text-slate-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-medium">Research Sources</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Public inspiration translated into KinFlo review criteria.</p>
                    <div className="mt-3 space-y-2">
                      {snapshot.clientWebsiteStudio.researchSources.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                        >
                          <span className="min-w-0">{source.label}</span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-medium">Convex Design Contract</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Mapped only. Live writes stay off until hosted activation approval.</p>
                    <div className="mt-3 space-y-2">
                      {snapshot.clientWebsiteStudio.convexFunctions.map((functionName) => (
                        <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                          <span className="min-w-0 break-all">{functionName}</span>
                          <Badge variant="outline">Mapped</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                        </TabsContent>
                      </Tabs>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="assets" className="mt-6">
            <section className="grid max-w-[calc(100vw-2rem)] min-w-0 gap-6 sm:max-w-none xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">Asset Library</h2>
                    <p className="text-sm text-muted-foreground">Prepare media metadata, usage, alt text, and provenance before storage-provider uploads are enabled.</p>
                  </div>
                  <Badge variant="outline" className="self-start">
                    <ImageIcon className="mr-1 h-3 w-3" />
                    Provider-light assets
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Asset Metadata Draft</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedAssetSite?.label} · {selectedAsset?.storageProvider}
                      </p>
                    </div>
                    <Badge variant={assetDraftDirty ? "default" : "secondary"}>
                      {assetDraftDirty ? "Local edits" : "Fixture asset"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ConfigurationAffordanceStrip
                      surface="Asset metadata configuration"
                      objectLabel={`${selectedAssetSite?.label ?? "No site selected"} · ${selectedAsset?.storageProvider ?? "fixture"}`}
                      stateLabel={assetDraftDirty ? "Local edits" : "Fixture asset"}
                      provenanceNotes={[
                        `Asset: ${assetName || "pending"}`,
                        `Usage: ${assetUsage || "pending"}`,
                        `Provenance: ${assetProvenance || "pending"}`,
                      ]}
                      activationEvidence={snapshot.assetLibrary.activationEvidence}
                      blockedLiveAction="Live asset upload is blocked until object storage, generated Convex API bindings, file-size policy, and provenance review are approved."
                      disabledActionLabel="Live asset upload gated"
                      readinessPercent={assetReadinessPercent}
                      testId="section-kinflo-configuration-affordance-assets"
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Site</Label>
                        <Select value={assetSiteKey} onValueChange={handleAssetSiteChange}>
                          <SelectTrigger data-testid="select-kinflo-asset-site">
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.assetLibrary.siteOptions.map((site) => (
                              <SelectItem key={site.key} value={site.key}>
                                {site.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Asset</Label>
                        <Select value={selectedAsset?.key ?? ""} onValueChange={handleAssetChange}>
                          <SelectTrigger data-testid="select-kinflo-asset-record">
                            <SelectValue placeholder="Select asset" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredAssets.map((asset) => (
                              <SelectItem key={asset.key} value={asset.key}>
                                {asset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Kind</Label>
                        <Select value={assetKind} onValueChange={(value) => setAssetKind(value as typeof assetKind)}>
                          <SelectTrigger data-testid="select-kinflo-asset-kind">
                            <SelectValue placeholder="Select kind" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.assetLibrary.kindOptions.map((kind) => (
                              <SelectItem key={kind.key} value={kind.key}>
                                {kind.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={assetStatus} onValueChange={(value) => setAssetStatus(value as typeof assetStatus)}>
                          <SelectTrigger data-testid="select-kinflo-asset-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.assetLibrary.statusOptions.map((status) => (
                              <SelectItem key={status.key} value={status.key}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-asset-name">Name</Label>
                          <Input
                            id="kinflo-asset-name"
                            value={assetName}
                            onChange={(event) => setAssetName(event.target.value)}
                            data-testid="input-kinflo-asset-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-asset-usage">Usage</Label>
                          <Input
                            id="kinflo-asset-usage"
                            value={assetUsage}
                            onChange={(event) => setAssetUsage(event.target.value)}
                            data-testid="input-kinflo-asset-usage"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-asset-alt-text">Alt text</Label>
                          <textarea
                            id="kinflo-asset-alt-text"
                            value={assetAltText}
                            onChange={(event) => setAssetAltText(event.target.value)}
                            rows={3}
                            className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="textarea-kinflo-asset-alt-text"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-asset-provenance">Provenance</Label>
                          <textarea
                            id="kinflo-asset-provenance"
                            value={assetProvenance}
                            onChange={(event) => setAssetProvenance(event.target.value)}
                            rows={3}
                            className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="textarea-kinflo-asset-provenance"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-md border p-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium">{assetName}</div>
                              <div className="mt-1 break-all text-xs text-muted-foreground">{selectedAsset?.storageKey}</div>
                            </div>
                            <Badge variant={assetStatus === "approved" ? "secondary" : "outline"}>{assetStatus}</Badge>
                          </div>
                          <div className="mt-3 grid gap-2">
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                              <div className="text-xs text-muted-foreground">Kind</div>
                              <div className="font-medium">{assetKind}</div>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                              <div className="text-xs text-muted-foreground">Usage</div>
                              <div className="font-medium">{assetUsage}</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Readiness</span>
                            <span className="text-muted-foreground">{assetReadinessPercent}%</span>
                          </div>
                          <Progress value={assetReadinessPercent} className="mt-2" />
                          <div className="mt-3 space-y-2">
                            {assetReadiness.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <CircleDashed className="h-3.5 w-3.5" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">{snapshot.assetLibrary.providerBoundary}</div>
                      <Button disabled data-testid="button-create-asset-record">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Live asset upload gated
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Asset Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">Asset records stay metadata-only until object storage and generated bindings are approved.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.assetLibrary.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span className="min-w-0 break-all">{functionName}</span>
                        <Badge variant="outline">Mapped</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activation Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.assetLibrary.activationEvidence.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button asChild variant="outline" className="w-full">
                  <Link href={selectedAssetSite?.previewPath ?? "/kinflo-sites/advisor-client-site"}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview asset usage
                  </Link>
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="domains" className="mt-6">
            <section className="grid max-w-[calc(100vw-2rem)] min-w-0 gap-6 sm:max-w-none xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">Domain Readiness</h2>
                    <p className="text-sm text-muted-foreground">Prepare hostname metadata, verification tokens, and rollback notes before DNS or SSL provider writes are enabled.</p>
                  </div>
                  <Badge variant="outline" className="self-start">
                    <Globe2 className="mr-1 h-3 w-3" />
                    DNS provider gated
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Domain Metadata Draft</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedDomainSite?.label} · {selectedDomain?.providerStatus}
                      </p>
                    </div>
                    <Badge variant={domainDraftDirty ? "default" : "secondary"}>
                      {domainDraftDirty ? "Local edits" : "Fixture domain"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ConfigurationAffordanceStrip
                      surface="Domain readiness configuration"
                      objectLabel={`${selectedDomainSite?.label ?? "No site selected"} · ${selectedDomain?.providerStatus ?? "not attached"}`}
                      stateLabel={domainDraftDirty ? "Local edits" : "Fixture domain"}
                      provenanceNotes={[
                        `Hostname: ${domainHostname || "pending"}`,
                        `Primary route: ${domainIsPrimary ? "primary" : "secondary"}`,
                        `SSL: ${selectedDomain?.sslStatus ?? "not requested"}`,
                      ]}
                      activationEvidence={snapshot.domainReadiness.activationEvidence}
                      blockedLiveAction="Live DNS save is blocked until hosted Convex, DNS ownership, SSL provisioning, Vercel domain attachment, and rollback approval are complete."
                      disabledActionLabel="Live DNS save gated"
                      readinessPercent={domainReadinessPercent}
                      testId="section-kinflo-configuration-affordance-domains"
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Site</Label>
                        <Select value={domainSiteKey} onValueChange={handleDomainSiteChange}>
                          <SelectTrigger data-testid="select-kinflo-domain-site">
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.domainReadiness.siteOptions.map((site) => (
                              <SelectItem key={site.key} value={site.key}>
                                {site.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Domain</Label>
                        <Select value={selectedDomain?.key ?? ""} onValueChange={handleDomainChange}>
                          <SelectTrigger data-testid="select-kinflo-domain-record">
                            <SelectValue placeholder="Select domain" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDomains.map((domain) => (
                              <SelectItem key={domain.key} value={domain.key}>
                                {domain.hostname}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={domainStatus} onValueChange={(value) => setDomainStatus(value as ShellDomainDraft["status"])}>
                          <SelectTrigger data-testid="select-kinflo-domain-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.domainReadiness.statusOptions.map((status) => (
                              <SelectItem key={status.key} value={status.key}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Primary</Label>
                        <label className="flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm">
                          <Checkbox
                            checked={domainIsPrimary}
                            onCheckedChange={(checked) => setDomainIsPrimary(Boolean(checked))}
                            data-testid="checkbox-kinflo-domain-primary"
                          />
                          Use as primary domain
                        </label>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-domain-hostname">Bare hostname</Label>
                          <Input
                            id="kinflo-domain-hostname"
                            value={domainHostname}
                            onChange={(event) => setDomainHostname(event.target.value)}
                            data-testid="input-kinflo-domain-hostname"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-domain-token">TXT verification token</Label>
                          <textarea
                            id="kinflo-domain-token"
                            value={domainVerificationToken}
                            onChange={(event) => setDomainVerificationToken(event.target.value)}
                            rows={3}
                            className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="textarea-kinflo-domain-token"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-domain-rollback">Rollback plan</Label>
                          <textarea
                            id="kinflo-domain-rollback"
                            value={domainRollbackPlan}
                            onChange={(event) => setDomainRollbackPlan(event.target.value)}
                            rows={3}
                            className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="textarea-kinflo-domain-rollback"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-md border p-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="break-all font-medium">{domainHostname}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{selectedDomain?.sslStatus}</div>
                            </div>
                            <Badge variant={domainStatus === "verified" ? "secondary" : "outline"}>{domainStatus}</Badge>
                          </div>
                          <div className="mt-3 grid gap-2">
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                              <div className="text-xs text-muted-foreground">Provider status</div>
                              <div className="font-medium">{selectedDomain?.providerStatus}</div>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                              <div className="text-xs text-muted-foreground">Primary route</div>
                              <div className="font-medium">{domainIsPrimary ? "Primary" : "Secondary"}</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Readiness</span>
                            <span className="text-muted-foreground">{domainReadinessPercent}%</span>
                          </div>
                          <Progress value={domainReadinessPercent} className="mt-2" />
                          <div className="mt-3 space-y-2">
                            {domainReadiness.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <CircleDashed className="h-3.5 w-3.5" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">{snapshot.domainReadiness.providerBoundary}</div>
                      <Button disabled data-testid="button-save-domain-readiness">
                        <Globe2 className="mr-2 h-4 w-4" />
                        Live DNS save gated
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Domain Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">Domain records stay metadata-only until hosted activation and provider ownership are approved.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.domainReadiness.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span className="min-w-0 break-all">{functionName}</span>
                        <Badge variant="outline">Mapped</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">DNS Checklist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.domainReadiness.dnsChecklist.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activation Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.domainReadiness.activationEvidence.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button asChild variant="outline" className="w-full">
                  <Link href={selectedDomainSite?.previewPath ?? "/kinflo-sites/advisor-client-site"}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview before DNS
                  </Link>
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            <section className="grid max-w-[calc(100vw-2rem)] min-w-0 gap-6 sm:max-w-none xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">Integration Readiness</h2>
                    <p className="text-sm text-muted-foreground">Prepare email, SMS, payment, storage, and AI providers without storing secrets or calling provider APIs.</p>
                  </div>
                  <Badge variant="outline" className="self-start">
                    <KeyRound className="mr-1 h-3 w-3" />
                    Provider writes gated
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Provider Settings Draft</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedIntegration?.label ?? "Integration"} · {selectedIntegrationProvider?.category ?? "provider"}
                      </p>
                    </div>
                    <Badge variant={integrationDraftDirty ? "default" : "secondary"}>
                      {integrationDraftDirty ? "Local edits" : "Fixture integration"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ConfigurationAffordanceStrip
                      surface="Provider integration configuration"
                      objectLabel={`${selectedIntegration?.label ?? "Integration"} · ${selectedIntegrationProvider?.category ?? "provider"}`}
                      stateLabel={integrationDraftDirty ? "Local edits" : "Fixture integration"}
                      provenanceNotes={[
                        `Provider: ${selectedIntegrationProvider?.label ?? integrationProvider}`,
                        `Env keys: ${integrationEnvKeys.split("\n").filter((key) => Boolean(key.trim())).length} named`,
                        `Smoke gate: ${selectedIntegration?.smokeGate ?? "pending"}`,
                      ]}
                      activationEvidence={snapshot.integrationReadiness.activationEvidence}
                      blockedLiveAction="Live provider save is blocked until hosted activation, provider env review, smoke approval, and per-provider write signoff are complete."
                      disabledActionLabel="Live provider save gated"
                      readinessPercent={integrationReadinessPercent}
                      testId="section-kinflo-configuration-affordance-integrations"
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Tenant</Label>
                        <Select value={integrationTenantSlug} onValueChange={handleIntegrationTenantChange}>
                          <SelectTrigger data-testid="select-kinflo-integration-tenant">
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.integrationReadiness.tenantOptions.map((tenant) => (
                              <SelectItem key={tenant.slug} value={tenant.slug}>
                                {tenant.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Site</Label>
                        <Select value={integrationSiteKey} onValueChange={setIntegrationSiteKey}>
                          <SelectTrigger data-testid="select-kinflo-integration-site">
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredIntegrationSites.map((site) => (
                              <SelectItem key={site.key} value={site.key}>
                                {site.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Provider packet</Label>
                        <Select value={selectedIntegration?.key ?? ""} onValueChange={handleIntegrationChange}>
                          <SelectTrigger data-testid="select-kinflo-integration-record">
                            <SelectValue placeholder="Select provider packet" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredIntegrations.map((integration) => (
                              <SelectItem key={integration.key} value={integration.key}>
                                {integration.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={integrationStatus} onValueChange={(value) => setIntegrationStatus(value as ShellIntegrationDraft["status"])}>
                          <SelectTrigger data-testid="select-kinflo-integration-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.integrationReadiness.statusOptions.map((status) => (
                              <SelectItem key={status.key} value={status.key}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0 space-y-4">
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <Select value={integrationProvider} onValueChange={(value) => setIntegrationProvider(value as ShellIntegrationDraft["provider"])}>
                            <SelectTrigger data-testid="select-kinflo-integration-provider">
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {snapshot.integrationReadiness.providerOptions.map((provider) => (
                                <SelectItem key={provider.key} value={provider.key}>
                                  {provider.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-integration-env-keys">Env key names</Label>
                          <textarea
                            id="kinflo-integration-env-keys"
                            value={integrationEnvKeys}
                            onChange={(event) => setIntegrationEnvKeys(event.target.value)}
                            rows={4}
                            className="min-h-[112px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="textarea-kinflo-integration-env-keys"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-integration-approval-notes">Approval notes</Label>
                          <textarea
                            id="kinflo-integration-approval-notes"
                            value={integrationApprovalNotes}
                            onChange={(event) => setIntegrationApprovalNotes(event.target.value)}
                            rows={4}
                            className="min-h-[112px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="textarea-kinflo-integration-approval-notes"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-md border p-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="break-words font-medium">{selectedIntegration?.useCase}</div>
                              <div className="mt-2 text-xs text-muted-foreground">{selectedIntegration?.smokeGate}</div>
                            </div>
                            <Badge variant={integrationStatus === "active" ? "secondary" : "outline"}>{integrationStatus}</Badge>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Readiness</span>
                            <span className="text-muted-foreground">{integrationReadinessPercent}%</span>
                          </div>
                          <Progress value={integrationReadinessPercent} className="mt-2" />
                          <div className="mt-3 space-y-2">
                            {integrationReadiness.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <CircleDashed className="h-3.5 w-3.5" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">{snapshot.integrationReadiness.providerBoundary}</div>
                      <Button disabled data-testid="button-save-integration-readiness">
                        <KeyRound className="mr-2 h-4 w-4" />
                        Live provider save gated
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Integration Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">Provider settings store readiness metadata only until hosted activation and per-provider smokes are approved.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.integrationReadiness.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span className="min-w-0 break-all">{functionName}</span>
                        <Badge variant="outline">Mapped</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Safety Checklist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.integrationReadiness.safetyChecklist.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activation Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.integrationReadiness.activationEvidence.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="campaigns" className="mt-6">
            <section className="grid max-w-[calc(100vw-2rem)] min-w-0 gap-6 sm:max-w-none xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">Campaign Automation</h2>
                    <p className="text-sm text-muted-foreground">Draft email, SMS, task, and AI-assisted campaign steps behind review and approval gates.</p>
                  </div>
                  <Badge variant="outline" className="self-start">
                    <Workflow className="mr-1 h-3 w-3" />
                    Sends gated
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Campaign Draft Packet</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedCampaignSite?.label} · {selectedCampaignChannel?.label}
                      </p>
                    </div>
                    <Badge variant={campaignDraftDirty ? "default" : "secondary"}>
                      {campaignDraftDirty ? "Local edits" : "Fixture campaign"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ConfigurationAffordanceStrip
                      surface="Campaign automation configuration"
                      objectLabel={`${selectedCampaignSite?.label ?? "No site selected"} · ${selectedCampaignChannel?.label ?? "channel"}`}
                      stateLabel={campaignDraftDirty ? "Local edits" : "Fixture campaign"}
                      provenanceNotes={[
                        `Campaign: ${campaignName || "pending"}`,
                        `Approval owner: ${campaignApprovalOwner || "pending"}`,
                        `Steps: ${selectedCampaign?.steps.length ?? 0} review-only`,
                      ]}
                      activationEvidence={snapshot.campaignAutomation.activationEvidence}
                      blockedLiveAction="Live campaign send is blocked until consent proof, campaign approval, provider-send smoke, and rollback owner approval are complete."
                      disabledActionLabel="Live campaign send gated"
                      readinessPercent={campaignReadinessPercent}
                      testId="section-kinflo-configuration-affordance-campaigns"
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Site</Label>
                        <Select value={campaignSiteKey} onValueChange={handleCampaignSiteChange}>
                          <SelectTrigger data-testid="select-kinflo-campaign-site">
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.campaignAutomation.siteOptions.map((site) => (
                              <SelectItem key={site.key} value={site.key}>
                                {site.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Campaign</Label>
                        <Select value={selectedCampaign?.key ?? ""} onValueChange={handleCampaignChange}>
                          <SelectTrigger data-testid="select-kinflo-campaign-record">
                            <SelectValue placeholder="Select campaign" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredCampaigns.map((campaign) => (
                              <SelectItem key={campaign.key} value={campaign.key}>
                                {campaign.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Channel</Label>
                        <Select value={campaignChannel} onValueChange={(value) => setCampaignChannel(value as ShellCampaignDraft["channel"])}>
                          <SelectTrigger data-testid="select-kinflo-campaign-channel">
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.campaignAutomation.channelOptions.map((channel) => (
                              <SelectItem key={channel.key} value={channel.key}>
                                {channel.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={campaignStatus} onValueChange={(value) => setCampaignStatus(value as ShellCampaignDraft["status"])}>
                          <SelectTrigger data-testid="select-kinflo-campaign-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.campaignAutomation.statusOptions.map((status) => (
                              <SelectItem key={status.key} value={status.key}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-campaign-name">Campaign name</Label>
                          <Input
                            id="kinflo-campaign-name"
                            value={campaignName}
                            onChange={(event) => setCampaignName(event.target.value)}
                            data-testid="input-kinflo-campaign-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-campaign-objective">Objective</Label>
                          <textarea
                            id="kinflo-campaign-objective"
                            value={campaignObjective}
                            onChange={(event) => setCampaignObjective(event.target.value)}
                            rows={4}
                            className="min-h-[112px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="textarea-kinflo-campaign-objective"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-campaign-approval-owner">Approval owner</Label>
                          <Input
                            id="kinflo-campaign-approval-owner"
                            value={campaignApprovalOwner}
                            onChange={(event) => setCampaignApprovalOwner(event.target.value)}
                            data-testid="input-kinflo-campaign-approval-owner"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-md border p-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="break-words font-medium">{campaignName}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{selectedCampaign?.targetPersona} · {selectedCampaign?.journeyStage}</div>
                            </div>
                            <Badge variant={campaignStatus === "approved" ? "secondary" : "outline"}>{campaignStatus}</Badge>
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">{selectedCampaign?.providerBoundary}</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Readiness</span>
                            <span className="text-muted-foreground">{campaignReadinessPercent}%</span>
                          </div>
                          <Progress value={campaignReadinessPercent} className="mt-2" />
                          <div className="mt-3 space-y-2">
                            {campaignReadiness.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <CircleDashed className="h-3.5 w-3.5" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <div className="border-b px-4 py-3 text-sm font-medium">Review steps</div>
                      <div className="divide-y">
                        {(selectedCampaign?.steps ?? []).map((step) => (
                          <div key={step.key} className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[minmax(0,1fr)_120px_130px] md:items-center">
                            <div className="min-w-0">
                              <div className="font-medium">{step.label}</div>
                              <div className="mt-1 break-words text-xs text-muted-foreground">{step.subject ?? step.body}</div>
                            </div>
                            <Badge variant="outline" className="w-fit">{step.channel}</Badge>
                            <Badge variant={step.providerStatus === "approved" ? "secondary" : "outline"} className="w-fit">
                              {step.providerStatus}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">{snapshot.campaignAutomation.providerBoundary}</div>
                      <div className="flex flex-wrap gap-2">
                        <Button disabled variant="outline" data-testid="button-request-campaign-approval">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Live approval gated
                        </Button>
                        <Button disabled data-testid="button-launch-campaign-automation">
                          <MailPlus className="mr-2 h-4 w-4" />
                          Live send gated
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Campaign Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">Campaign records stay draft and approval metadata until hosted provider smokes are approved.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.campaignAutomation.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span className="min-w-0 break-all">{functionName}</span>
                        <Badge variant="outline">Mapped</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Safety Checklist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.campaignAutomation.safetyChecklist.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activation Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.campaignAutomation.activationEvidence.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="ai-review" className="mt-6">
            <section className="grid max-w-[calc(100vw-2rem)] min-w-0 gap-6 sm:max-w-none xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">AI Review</h2>
                    <p className="text-sm text-muted-foreground">Track prompt provenance, source inputs, reviewer notes, and publish targets before generated content can move downstream.</p>
                  </div>
                  <Badge variant="outline" className="self-start">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Provider gated
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">AI Provenance Packet</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedAiReviewSite?.label} · {selectedAiRecord?.reviewer}
                      </p>
                    </div>
                    <Badge variant={aiReviewDraftDirty ? "default" : "secondary"}>
                      {aiReviewDraftDirty ? "Local edits" : "Fixture AI record"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ConfigurationAffordanceStrip
                      surface="AI review configuration"
                      objectLabel={`${selectedAiReviewSite?.label ?? "No site selected"} · ${selectedAiRecord?.reviewer ?? "reviewer pending"}`}
                      stateLabel={aiReviewDraftDirty ? "Local edits" : "Fixture AI record"}
                      provenanceNotes={[
                        `Target: ${aiPublishTarget || "pending"}`,
                        `Sources: ${selectedAiRecord?.sourceInputs.length ?? 0} recorded`,
                        `Reviewer notes: ${aiReviewerNotes || "pending"}`,
                      ]}
                      activationEvidence={snapshot.aiReview.activationEvidence}
                      blockedLiveAction="Live AI review and publish are blocked until provider generation, usage caps, reviewer approval, and content publish smoke are approved."
                      disabledActionLabel="Live AI publish gated"
                      readinessPercent={aiReviewReadinessPercent}
                      testId="section-kinflo-configuration-affordance-ai-review"
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Site</Label>
                        <Select value={aiReviewSiteKey} onValueChange={handleAiReviewSiteChange}>
                          <SelectTrigger data-testid="select-kinflo-ai-review-site">
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.aiReview.siteOptions.map((site) => (
                              <SelectItem key={site.key} value={site.key}>
                                {site.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>AI record</Label>
                        <Select value={selectedAiRecord?.key ?? ""} onValueChange={handleAiReviewRecordChange}>
                          <SelectTrigger data-testid="select-kinflo-ai-review-record">
                            <SelectValue placeholder="Select AI record" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredAiRecords.map((record) => (
                              <SelectItem key={record.key} value={record.key}>
                                {record.publishTarget}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={aiReviewStatus} onValueChange={(value) => setAiReviewStatus(value as ShellAiReviewRecord["status"])}>
                          <SelectTrigger data-testid="select-kinflo-ai-review-status">
                            <SelectValue placeholder="Select review status" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.aiReview.statusOptions.map((status) => (
                              <SelectItem key={status.key} value={status.key}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-ai-prompt-summary">Prompt summary</Label>
                          <textarea
                            id="kinflo-ai-prompt-summary"
                            value={aiPromptSummary}
                            onChange={(event) => setAiPromptSummary(event.target.value)}
                            rows={3}
                            className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="textarea-kinflo-ai-prompt-summary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-ai-output-summary">Output summary</Label>
                          <textarea
                            id="kinflo-ai-output-summary"
                            value={aiOutputSummary}
                            onChange={(event) => setAiOutputSummary(event.target.value)}
                            rows={3}
                            className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="textarea-kinflo-ai-output-summary"
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="kinflo-ai-publish-target">Publish target</Label>
                            <Input
                              id="kinflo-ai-publish-target"
                              value={aiPublishTarget}
                              onChange={(event) => setAiPublishTarget(event.target.value)}
                              data-testid="input-kinflo-ai-publish-target"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="kinflo-ai-reviewer-notes">Reviewer notes</Label>
                            <Input
                              id="kinflo-ai-reviewer-notes"
                              value={aiReviewerNotes}
                              onChange={(event) => setAiReviewerNotes(event.target.value)}
                              data-testid="input-kinflo-ai-reviewer-notes"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-md border p-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="break-words font-medium">{aiPublishTarget}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{selectedAiRecord?.campaignKey ?? "site content"}</div>
                            </div>
                            <Badge variant={aiReviewStatus === "approved" ? "secondary" : "outline"}>{aiReviewStatus}</Badge>
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">{selectedAiRecord?.providerBoundary}</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Readiness</span>
                            <span className="text-muted-foreground">{aiReviewReadinessPercent}%</span>
                          </div>
                          <Progress value={aiReviewReadinessPercent} className="mt-2" />
                          <div className="mt-3 space-y-2">
                            {aiReviewReadiness.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <CircleDashed className="h-3.5 w-3.5" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <div className="border-b px-4 py-3 text-sm font-medium">Source Inputs</div>
                      <div className="divide-y">
                        {(selectedAiRecord?.sourceInputs ?? []).map((source) => (
                          <div key={source} className="flex items-start gap-2 px-4 py-3 text-sm text-muted-foreground">
                            <CircleDashed className="mt-0.5 h-4 w-4" />
                            <span>{source}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">{snapshot.aiReview.providerBoundary}</div>
                      <div className="flex flex-wrap gap-2">
                        <Button disabled variant="outline" data-testid="button-review-ai-record">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Live AI review gated
                        </Button>
                        <Button disabled data-testid="button-publish-ai-output">
                          <Edit3 className="mr-2 h-4 w-4" />
                          Live AI publish gated
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex AI Review Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">AI records stay provenance and review metadata until provider generation and publish smokes are approved.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.aiReview.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span className="min-w-0 break-all">{functionName}</span>
                        <Badge variant="outline">Mapped</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Review Checklist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.aiReview.reviewChecklist.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activation Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshot.aiReview.activationEvidence.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Content Draft Studio</h2>
                    <p className="text-sm text-muted-foreground">Configure page copy and block visibility before live siteBuilder mutations are enabled.</p>
                  </div>
                  <Badge variant="outline">
                    <Edit3 className="mr-1 h-3 w-3" />
                    Provider-light draft
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Draft Page Content</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedContentSite?.label} · {selectedContentPage?.label}
                      </p>
                    </div>
                    <Badge variant={contentDraftDirty ? "default" : "secondary"}>
                      {contentDraftDirty ? "Local edits" : "Fixture draft"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ConfigurationAffordanceStrip
                      surface="Content draft configuration"
                      objectLabel={`${selectedContentSite?.label ?? "No site selected"} · ${selectedContentPage?.label ?? "No page selected"}`}
                      stateLabel={contentDraftDirty ? "Local edits" : "Fixture draft"}
                      provenanceNotes={[
                        `Block: ${selectedContentBlock?.label ?? "pending"}`,
                        `Persona: ${selectedContentBlock?.persona ?? "pending"}`,
                        `Journey: ${selectedContentBlock?.journeyStage ?? "pending"}`,
                      ]}
                      activationEvidence={snapshot.contentDraft.activationEvidence}
                      blockedLiveAction="Live content save and publish are blocked until generated Convex API bindings, hosted auth, and content smoke cleanup are approved."
                      disabledActionLabel="Live content publish gated"
                      readinessPercent={contentReadinessPercent}
                      testId="section-kinflo-configuration-affordance-content"
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Site</Label>
                        <Select value={contentSiteKey} onValueChange={setContentSiteKey}>
                          <SelectTrigger data-testid="select-kinflo-content-site">
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.contentDraft.siteOptions.map((site) => (
                              <SelectItem key={site.key} value={site.key}>
                                {site.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Page</Label>
                        <Select value={contentPageSlug} onValueChange={setContentPageSlug}>
                          <SelectTrigger data-testid="select-kinflo-content-page">
                            <SelectValue placeholder="Select page" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.contentDraft.pageOptions.map((page) => (
                              <SelectItem key={page.slug} value={page.slug}>
                                {page.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Block</Label>
                        <Select value={selectedContentBlockKey} onValueChange={handleContentBlockChange}>
                          <SelectTrigger data-testid="select-kinflo-content-block">
                            <SelectValue placeholder="Select block" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.contentDraft.blocks.map((block) => (
                              <SelectItem key={block.key} value={block.key}>
                                {block.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-content-title">Block title</Label>
                          <Input
                            id="kinflo-content-title"
                            value={contentDraftTitle}
                            onChange={(event) => setContentDraftTitle(event.target.value)}
                            data-testid="input-kinflo-content-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kinflo-content-body">Block body</Label>
                          <textarea
                            id="kinflo-content-body"
                            value={contentDraftBody}
                            onChange={(event) => setContentDraftBody(event.target.value)}
                            rows={6}
                            className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="textarea-kinflo-content-body"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedContentBlock ? (
                          <div className="rounded-md border p-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{selectedContentBlock.label}</div>
                                <div className="mt-1 text-xs text-muted-foreground">{selectedContentBlock.type} · {selectedContentBlock.status}</div>
                              </div>
                              <Badge variant="outline">{selectedContentBlock.journeyStage}</Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge variant="secondary">{selectedContentBlock.persona}</Badge>
                              <Badge variant="secondary">{selectedContentBlock.journeyStage}</Badge>
                            </div>
                          </div>
                        ) : null}
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Readiness</span>
                            <span className="text-muted-foreground">{contentReadinessPercent}%</span>
                          </div>
                          <Progress value={contentReadinessPercent} className="mt-2" />
                          <div className="mt-3 space-y-2">
                            {contentReadiness.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <CircleDashed className="h-3.5 w-3.5" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border p-3 text-sm">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview packet</div>
                      <div className="mt-2 font-medium">{contentDraftTitle}</div>
                      <p className="mt-1 text-muted-foreground">{contentDraftBody}</p>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">{snapshot.contentDraft.providerBoundary}</div>
                      <div className="flex flex-wrap gap-2">
                        <Button disabled data-testid="button-save-content-draft">
                          <Edit3 className="mr-2 h-4 w-4" />
                          Live draft save gated
                        </Button>
                        <Button disabled variant="outline" data-testid="button-publish-content-draft">
                          <Rocket className="mr-2 h-4 w-4" />
                          Live publish gated
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Content Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">Draft and publish writes stay gated until generated bindings and live smoke pass.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.contentDraft.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span>{functionName}</span>
                        <Badge variant="outline">gated</Badge>
                      </div>
                    ))}
                    <div className="space-y-2">
                      {snapshot.contentDraft.activationEvidence.map((item) => (
                        <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Preview Route</CardTitle>
                    <p className="text-sm text-muted-foreground">Public preview still resolves through the fixture renderer until live publish smoke passes.</p>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild>
                      <Link href={selectedContentSite?.previewPath ?? "/kinflo-sites/advisor-client-site"}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open public preview
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Starter Templates</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Template contracts define configurable fields, image direction, QA checks, and launch criteria before live site creation.
                </p>
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                {snapshot.templates.map((template) => (
                  <Card key={template.key}>
                    <CardHeader>
                      <CardTitle className="text-base">{template.label}</CardTitle>
                      <p className="text-sm text-muted-foreground">{template.fit}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Blocks</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                        {template.blocks.map((block) => (
                          <Badge key={block} variant="secondary">{block}</Badge>
                        ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configure</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {template.configurableFields.map((field) => (
                            <Badge key={field} variant="outline">{field}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-md border p-3 text-sm text-muted-foreground">
                        <div className="mb-1 font-medium text-foreground">Image direction</div>
                        {template.imageDirection}
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-1">
                        <div>
                          <div className="font-medium">QA checks</div>
                          <div className="mt-2 space-y-1 text-muted-foreground">
                            {template.qaChecks.map((check) => (
                              <div key={check} className="flex gap-2">
                                <ListChecks className="mt-0.5 h-3.5 w-3.5" />
                                <span>{check}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Launch criteria</div>
                          <div className="mt-2 space-y-1 text-muted-foreground">
                            {template.launchCriteria.map((criterion) => (
                              <div key={criterion} className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" />
                                <span>{criterion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="crm" className="mt-6">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">CRM Lead Workspace</h2>
                    <p className="text-sm text-muted-foreground">Site-scoped lead intake, assignment, and follow-up state.</p>
                  </div>
                  <Badge variant="outline">
                    <UserRoundCheck className="mr-1 h-3 w-3" />
                    crm.submitLead
                  </Badge>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Persona</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-right">State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snapshot.leads.map((lead) => (
                        <TableRow key={lead.email}>
                          <TableCell>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-xs text-muted-foreground">{lead.email}</div>
                          </TableCell>
                          <TableCell>{lead.site}</TableCell>
                          <TableCell>{lead.persona}</TableCell>
                          <TableCell>{lead.stage}</TableCell>
                          <TableCell>{lead.owner}</TableCell>
                          <TableCell className="text-right">{statusBadge(lead.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="rounded-md border bg-background p-2">
                      <FormInput className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Public Intake</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Lead blocks map to `crm.submitLead` with `/api/leads` as the temporary runtime fallback.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.leadCaptureContracts.map((contract) => (
                      <div key={contract.label} className="rounded-md border px-3 py-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{contract.label}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{contract.blockType} · {contract.convexFunction}</div>
                          </div>
                          <Badge variant="outline">{contract.runtime}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {contract.requiredFields.map((field) => (
                            <Badge key={field} variant="secondary">{field}</Badge>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{contract.fallback}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="rounded-md border bg-background p-2">
                      <Workflow className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Pipeline</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Phase 12 stages mirror `pipelineStages`.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.pipelineStages.map((stage) => (
                      <div key={stage.slug} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">{stage.label}</div>
                          <div className="text-xs text-muted-foreground">{stage.color}</div>
                        </div>
                        <Badge variant="secondary">{stage.leads}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="rounded-md border bg-background p-2">
                      <ListChecks className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Follow-up Tasks</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Task records stay scoped to lead and site.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.tasks.map((task) => (
                      <div key={`${task.lead}-${task.title}`} className="rounded-md border px-3 py-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{task.lead} · {task.owner}</div>
                          </div>
                          {statusBadge(task.status)}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{task.due}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="experience" className="mt-6">
            <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 max-w-full space-y-4">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">Experience Preferences</h2>
                    <p className="text-sm text-muted-foreground">Scoped shell defaults for {snapshot.experiencePreferences.scopeLabel}.</p>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    <SlidersHorizontal className="mr-1 h-3 w-3" />
                    {snapshot.experiencePreferences.scopeKind} scope
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Shell Defaults</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {snapshot.experiencePreferences.tenant} · {snapshot.experiencePreferences.site}
                      </p>
                    </div>
                    <Badge variant={experiencePreferencesDirty ? "default" : "secondary"}>
                      {experiencePreferencesDirty ? "Local changes" : "Fixture defaults"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select value={experienceTheme} onValueChange={(value) => setExperienceTheme(value as typeof experienceTheme)}>
                          <SelectTrigger data-testid="select-kinflo-experience-theme">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Data density</Label>
                        <Select value={experienceDensity} onValueChange={(value) => setExperienceDensity(value as typeof experienceDensity)}>
                          <SelectTrigger data-testid="select-kinflo-experience-density">
                            <SelectValue placeholder="Select density" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="comfortable">Comfortable</SelectItem>
                            <SelectItem value="spacious">Spacious</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Default landing page</Label>
                        <Select value={experienceLandingPage} onValueChange={setExperienceLandingPage}>
                          <SelectTrigger data-testid="select-kinflo-default-landing-page">
                            <SelectValue placeholder="Select landing page" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="/admin/kinflo-os">KinFlo OS</SelectItem>
                            <SelectItem value="/admin/kinflo-os?tab=crm">CRM workspace</SelectItem>
                            <SelectItem value="/admin/kinflo-os?tab=factory">Site factory</SelectItem>
                            <SelectItem value="/admin/kinflo-os?tab=plans">Plans</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Default content filter</Label>
                        <Select value={experienceContentFilter} onValueChange={setExperienceContentFilter}>
                          <SelectTrigger data-testid="select-kinflo-default-content-filter">
                            <SelectValue placeholder="Select filter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All content</SelectItem>
                            <SelectItem value="draft">Drafts</SelectItem>
                            <SelectItem value="needs-review">Needs review</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kinflo-items-per-page">Items per page</Label>
                        <Input
                          id="kinflo-items-per-page"
                          type="number"
                          min={10}
                          max={100}
                          step={5}
                          value={experienceItemsPerPage}
                          onChange={(event) => setExperienceItemsPerPage(Number(event.target.value))}
                          data-testid="input-kinflo-items-per-page"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Notification channels</Label>
                        <div className="grid gap-2 rounded-md border p-3">
                          {notificationChannelOptions.map((channel) => (
                            <label key={channel.key} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={experienceNotificationChannels.includes(channel.key)}
                                onCheckedChange={(checked) => toggleExperienceNotification(channel.key, checked === true)}
                                data-testid={`checkbox-notification-${channel.key}`}
                              />
                              <span>{channel.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-3">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Landing</div>
                        <div className="mt-1 font-medium">{experienceLandingPage}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rows</div>
                        <div className="mt-1 font-medium">{experienceItemsPerPage} · {experienceDensity}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Alerts</div>
                        <div className="mt-1 font-medium">{selectedNotificationSummary}</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        {snapshot.experiencePreferences.providerBoundary}
                      </div>
                      <Button disabled data-testid="button-save-experience-preferences">
                        <Save className="mr-2 h-4 w-4" />
                        Live preference save gated
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  {snapshot.experienceControls.map((control) => {
                    const Icon = experienceIcons[control.iconKey];
                    return (
                      <Card key={control.label}>
                        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                          <div className="rounded-md border bg-background p-2">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{control.label}</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">{control.value}</p>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="rounded-md border bg-background p-2">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Workflow Defaults</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Lead, task, digest, and report defaults.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[...snapshot.experiencePreferences.workflowDefaults, ...snapshot.experiencePreferences.communicationDefaults].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">Preference reads and writes stay scoped to the current synced user.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.experiencePreferences.convexFunctions.map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span>{functionName}</span>
                        <Badge variant="outline">current user</Badge>
                      </div>
                    ))}
                    <div className="space-y-2">
                      {snapshot.experiencePreferences.activationEvidence.map((item) => (
                        <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="access" className="mt-6">
            <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">Permission Model</h2>
                  <Badge variant="outline">
                    <KeyRound className="mr-1 h-3 w-3" />
                    Scoped roles
                  </Badge>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snapshot.roles.map((role) => (
                        <TableRow key={role.role}>
                          <TableCell className="font-medium">{role.role}</TableCell>
                          <TableCell>{role.scope}</TableCell>
                          <TableCell>{role.access}</TableCell>
                          <TableCell>{role.owner}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Access Delegation Packet</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Prepare a scoped client admin or editor invitation before live Convex writes are enabled.
                      </p>
                    </div>
                    <Badge variant="secondary">{accessReadyCount}/{accessReadiness.length} ready</Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="kinflo-access-email">Invite email</Label>
                        <Input
                          id="kinflo-access-email"
                          type="email"
                          value={accessInviteEmail}
                          onChange={(event) => setAccessInviteEmail(event.target.value)}
                          data-testid="input-kinflo-access-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tenant</Label>
                        <Select value={accessTenantSlug} onValueChange={handleAccessTenantChange}>
                          <SelectTrigger data-testid="select-kinflo-access-tenant">
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.accessDelegation.tenantOptions.map((tenant) => (
                              <SelectItem key={tenant.slug} value={tenant.slug}>
                                {tenant.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Site scope</Label>
                        <Select value={accessSiteKey} onValueChange={setAccessSiteKey}>
                          <SelectTrigger data-testid="select-kinflo-access-site">
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredAccessSites.map((site) => (
                              <SelectItem key={site.key} value={site.key}>
                                {site.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={accessRoleKey} onValueChange={setAccessRoleKey}>
                          <SelectTrigger data-testid="select-kinflo-access-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.accessDelegation.roleOptions.map((role) => (
                              <SelectItem key={role.key} value={role.key}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {selectedAccessRole ? (
                      <div className="rounded-md border p-3 text-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="font-medium">{selectedAccessRole.label}</div>
                            <div className="mt-1 text-muted-foreground">{selectedAccessRole.description}</div>
                          </div>
                          <Badge variant="outline" className="w-fit">{selectedAccessRole.scope} scope</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedAccessRole.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary">{permission}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                      <div className="rounded-md border p-3 text-sm">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prepared scope</div>
                        <div className="mt-2 space-y-1">
                          <div className="font-medium">{accessInviteEmail}</div>
                          <div className="text-muted-foreground">{selectedAccessTenant?.label}</div>
                          <div className="text-muted-foreground">{selectedAccessRole?.scope === "tenant" ? "All tenant sites" : selectedAccessSite?.label}</div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Readiness</span>
                          <span className="text-muted-foreground">{accessReadinessPercent}%</span>
                        </div>
                        <Progress value={accessReadinessPercent} className="mt-2" />
                        <div className="mt-3 space-y-2">
                          {accessReadiness.map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.done ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <CircleDashed className="h-3.5 w-3.5" />
                              )}
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        {snapshot.accessDelegation.providerBoundary}
                      </div>
                      <Button disabled data-testid="button-create-access-invite">
                        <MailPlus className="mr-2 h-4 w-4" />
                        Live invite gated
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Invitation Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">Invitation writes stay disabled until auth, email, and cross-tenant smoke gates pass.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.accessDelegation.convexMutations.map((mutationName) => (
                      <div key={mutationName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span>{mutationName}</span>
                        <Badge variant="outline">gated</Badge>
                      </div>
                    ))}
                    <div className="space-y-2">
                      {snapshot.accessDelegation.activationEvidence.map((item) => (
                        <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Launch Gates</h2>
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="rounded-lg border">
                  {snapshot.launchGates.map((gate, index) => {
                    const done = gate.status === "done";
                    return (
                      <div
                        key={gate.label}
                        className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                          index === 0 ? "" : "border-t"
                        }`}
                      >
                        <span>{gate.label}</span>
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <CircleDashed className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Next Activation Gate</h2>
            <p className="text-sm text-muted-foreground">Convex deployment, generated API bindings, and live admin smoke.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/guide">
              <Settings2 className="mr-2 h-4 w-4" />
              Admin Guide
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
