import {
  getKinfloConvexRuntime,
  type KinfloConvexRuntimeMode,
} from "./kinfloConvexRuntime";

export type KinfloShellStatus =
  | "active"
  | "draft"
  | "preview"
  | "published"
  | "converted"
  | "nurture"
  | "done"
  | "pending"
  | "archived";

export type ShellMetricIconKey = "tenants" | "sites" | "templates" | "leads" | "launchGates";

export type ExperienceIconKey = "theme" | "navigation" | "audience" | "preview";

export type ShellDataMode = {
  label: string;
  description: string;
  source: "fixture" | "convex";
  runtimeMode: KinfloConvexRuntimeMode;
  runtimeLabel: string;
  activationGate: string;
  convexFunctions: string[];
};

export type ShellLiveAdapterStatus =
  | "fixture_fallback"
  | "generated_api_pending"
  | "live_smoke_pending";

export type ShellLiveAdapterBinding = {
  surface: string;
  fixtureSource: string;
  convexFunctions: string[];
  activationEvidence: string[];
  status: ShellLiveAdapterStatus;
};

export type ShellAdapterSwitchMode = "read_only" | "mixed" | "write" | "provider_gated";

export type ShellAdapterSwitchSurface = ShellLiveAdapterBinding & {
  id: string;
  requiredSmokeEvidence: string[];
  rollback: string;
  switchAllowed: boolean;
  providerWrites: boolean;
  liveConvexExecution: boolean;
};

export type ShellAdapterSwitchBatch = {
  order: number;
  id: string;
  label: string;
  mode: ShellAdapterSwitchMode;
  surfaces: ShellAdapterSwitchSurface[];
};

export type ShellAdapterSwitchRunwayStep = {
  order: number;
  batchId: string;
  label: string;
  stage: string;
  entryGate: string;
  exitEvidence: string[];
  rollbackOwner: string;
  canAdvance: boolean;
  liveConvexExecution: boolean;
  providerWrites: boolean;
};

export type ShellAdapterSwitchAcceptanceBatch = {
  order: number;
  batchId: string;
  label: string;
  acceptancePosture: "blocked_smoke_gap" | "blocked_owner_gate";
  surfaceCount: number;
  functionCount: number;
  generatedContractCoverage: "complete";
  smokeCoveredFunctions: number;
  smokeMissingFunctions: string[];
  nextHumanGate: string;
  rollbackGate: string;
  canSwitch: boolean;
  providerWrites: boolean;
  liveConvexExecution: boolean;
};

export type ShellAdapterSwitchCutoverStep = {
  order: number;
  batchId: string;
  label: string;
  surfaceCount: number;
  functionCount: number;
  entryCriteria: string[];
  switchActions: string[];
  postSwitchVerification: string[];
  rollbackControls: string[];
  adapterFlag: string;
  blockedUntil: string;
  canCutover: boolean;
  canImportGeneratedApi: boolean;
  generatedApiAvailable: boolean;
  providerWrites: boolean;
  liveConvexExecution: boolean;
};

export type ShellAdapterSwitchCutoverChecklist = {
  status: "provider_light_adapter_cutover_checklist";
  totalBatches: number;
  totalSurfaces: number;
  totalFunctions: number;
  readyBatches: number;
  blockedBatches: number;
  approvalGate: string;
  providerBoundary: string;
  sourceDocuments: string[];
  steps: ShellAdapterSwitchCutoverStep[];
};

export type ShellAdapterSwitchReadiness = {
  status: "provider_light_switch_plan";
  defaultBatchId: string;
  batches: ShellAdapterSwitchBatch[];
  runwaySteps: ShellAdapterSwitchRunwayStep[];
  acceptanceMatrix: ShellAdapterSwitchAcceptanceBatch[];
  cutoverChecklist: ShellAdapterSwitchCutoverChecklist;
  providerBoundary: string;
  activationEvidence: string[];
  documents: string[];
};

export type ShellHostedActivationStepStatus =
  | "pending_approval"
  | "ready_after_approval"
  | "blocked_provider_gate";

export type ShellHostedActivationStep = {
  order: number;
  id: string;
  label: string;
  owner: string;
  requiredBefore: string;
  commandOrAction: string;
  evidenceTarget: string;
  rollback: string;
  status: ShellHostedActivationStepStatus;
  providerWrites: boolean;
  liveConvexExecution: boolean;
};

export type ShellHostedActivationDecisionStatus =
  | "pending_owner_decision"
  | "ready_to_record"
  | "blocked_until_prior_gate";

export type ShellHostedActivationDecision = {
  id: string;
  label: string;
  owner: string;
  status: ShellHostedActivationDecisionStatus;
  requiredBefore: string;
  decisionNeeded: string;
  evidenceTarget: string;
  approvedState: string;
  blockedUntil: string;
  providerBoundary: string;
};

export type ShellHostedActivationConsole = {
  status: "provider_light_activation_console";
  decision: "blocked_until_approval";
  nextHumanGate: string;
  preActivationCommands: string[];
  blockedLiveActions: string[];
  evidenceSummary: string[];
  providerBoundary: string;
};

export type ShellGeneratedApiReviewSurface = {
  surface: string;
  totalBindings: number;
  queryBindings: number;
  mutationBindings: number;
  requiredFunctions?: string[];
  reviewPosture: "ready_for_codegen_review" | "smoke_manifest_gap";
  smokeCoverage: string;
  owner: string;
  blockedUntil: string;
};

export type ShellGeneratedApiReviewBoard = {
  status: "provider_light_generated_api_review";
  totalBindings: number;
  queryBindings: number;
  mutationBindings: number;
  smokeManifestFunctions: number;
  smokeManifestGaps: number;
  firstSwitchBatch: string;
  approvalGate: string;
  providerBoundary: string;
  documents: string[];
  surfaces: ShellGeneratedApiReviewSurface[];
};

export type ShellHostedSmokeGapMode =
  | "read_only"
  | "mutation_smoke_required"
  | "provider_gated_metadata"
  | "governance";

export type ShellHostedSmokeGap = {
  id: string;
  batchId: string;
  surface: string;
  functionName: string;
  smokeMode: ShellHostedSmokeGapMode;
  localProof: string;
  hostedProofRequired: string;
  rollbackArtifact: string;
  owner: string;
  blockedUntil: string;
  canRun: boolean;
  providerWrites: boolean;
  liveConvexExecution: boolean;
};

export type ShellHostedSmokeGapBacklog = {
  status: "provider_light_hosted_smoke_gap_backlog";
  totalGaps: number;
  readOnlyGaps: number;
  mutationGaps: number;
  providerGatedGaps: number;
  governanceGaps: number;
  approvalGate: string;
  providerBoundary: string;
  sourceDocuments: string[];
  gaps: ShellHostedSmokeGap[];
};

export type ShellHostedSmokeExecutionBatch = {
  id: string;
  order: number;
  label: string;
  smokeMode: ShellHostedSmokeGapMode | "mixed";
  functionCount: number;
  functions: string[];
  requiredBeforeRun: string;
  evidenceTarget: string;
  abortCondition: string;
  rollbackPlan: string;
  owner: string;
  blockedUntil: string;
  canRun: boolean;
  providerWrites: boolean;
  liveConvexExecution: boolean;
};

export type ShellHostedSmokeExecutionSequencer = {
  status: "provider_light_hosted_smoke_execution_sequencer";
  totalBatches: number;
  totalFunctions: number;
  readOnlyFirst: boolean;
  blockedBatches: number;
  approvalGate: string;
  providerBoundary: string;
  sourceDocuments: string[];
  batches: ShellHostedSmokeExecutionBatch[];
};

export type ShellHostedSmokeEvidenceStatus = "pending_human_gate";

export type ShellHostedSmokeEvidenceEntry = {
  id: string;
  batchId: string;
  order: number;
  label: string;
  status: ShellHostedSmokeEvidenceStatus;
  functionCount: number;
  expectedTranscript: string;
  evidenceSlots: string[];
  acceptanceCriteria: string[];
  abortIf: string;
  rollbackReference: string;
  owner: string;
  blockedUntil: string;
  canRecord: boolean;
  providerWrites: boolean;
  liveConvexExecution: boolean;
};

export type ShellHostedSmokeEvidenceLedger = {
  status: "provider_light_hosted_smoke_evidence_ledger";
  totalEvidenceEntries: number;
  pendingEntries: number;
  totalFunctions: number;
  blockedEntries: number;
  approvalGate: string;
  providerBoundary: string;
  sourceDocuments: string[];
  entries: ShellHostedSmokeEvidenceEntry[];
};

export type ShellHostedActivationRunbook = {
  status: "prepare_only_evidence_ledger";
  defaultStepId: string;
  providerBoundary: string;
  activationConsole: ShellHostedActivationConsole;
  generatedApiReviewBoard: ShellGeneratedApiReviewBoard;
  hostedSmokeGapBacklog: ShellHostedSmokeGapBacklog;
  hostedSmokeExecutionSequencer: ShellHostedSmokeExecutionSequencer;
  hostedSmokeEvidenceLedger: ShellHostedSmokeEvidenceLedger;
  decisionRegister: ShellHostedActivationDecision[];
  documents: string[];
  steps: ShellHostedActivationStep[];
  completionRules: string[];
  evidenceTargets: string[];
};

export type ShellActiveObjectSignal = {
  objectType: string;
  label: string;
  tenantSlug: string;
  siteKey: string;
  environment: string;
  environmentDetail: string;
  readinessLabel: string;
  readinessPercent: number;
  launchPosture: string;
  nextDecision: string;
  owner: string;
  requiredEvidence: string[];
  blockedLiveActions: string[];
  disabledActionLabel: string;
  disabledActionReason: string;
  unblockCondition: string;
  providerBoundary: string;
  evidenceLinks: string[];
  convexFunctions: string[];
};

export type ShellMetric = {
  label: string;
  value: string;
  detail: string;
  iconKey: ShellMetricIconKey;
};

export type ShellTenant = {
  name: string;
  slug: string;
  plan: string;
  sites: number;
  owner: string;
  status: KinfloShellStatus;
};

export type ShellBillingPlan = {
  key: string;
  label: string;
  price: string;
  fit: string;
  status: KinfloShellStatus;
  limits: { label: string; value: string }[];
  features: string[];
  gatedModules: string[];
};

export type ShellTenantEntitlement = {
  tenant: string;
  tenantSlug: string;
  planKey: string;
  planLabel: string;
  source: string;
  status: KinfloShellStatus;
  usage: { label: string; value: string; limit: string }[];
  featureOverrides: string[];
  nextReview: string;
};

export type ShellSite = {
  name: string;
  tenant: string;
  domain: string;
  route: string;
  template: string;
  status: KinfloShellStatus;
  previewPath: string;
};

export type ShellTemplate = {
  key: string;
  label: string;
  fit: string;
  blocks: string[];
  configurableFields: string[];
  imageDirection: string;
  qaChecks: string[];
  launchCriteria: string[];
};

export type ShellContentDraftBlock = {
  key: string;
  type: "hero" | "services" | "events" | "testimonials" | "lead_magnet" | "form" | "campaign" | "custom";
  label: string;
  title: string;
  body: string;
  status: "draft" | "published";
  persona: string;
  journeyStage: string;
};

export type ShellContentDraft = {
  defaultSiteKey: string;
  defaultPageSlug: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  pageOptions: { slug: string; label: string; status: "draft" | "published" }[];
  blocks: ShellContentDraftBlock[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellBrandPaletteOption = {
  key: string;
  label: string;
  background: string;
  foreground: string;
  accent: string;
  description: string;
};

export type ShellBrandTypographyOption = {
  key: string;
  label: string;
  heading: string;
  body: string;
  scale: string;
};

export type ShellBrandButtonOption = {
  key: string;
  label: string;
  style: string;
  radius: number;
};

export type ShellBrandMediaOption = {
  key: string;
  label: string;
  treatment: string;
  ratio: string;
};

export type ShellBrandThemeDraft = {
  defaultSiteKey: string;
  defaultPaletteKey: string;
  defaultTypographyKey: string;
  defaultButtonKey: string;
  defaultMediaKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  paletteOptions: ShellBrandPaletteOption[];
  typographyOptions: ShellBrandTypographyOption[];
  buttonOptions: ShellBrandButtonOption[];
  mediaOptions: ShellBrandMediaOption[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellNavigationItemDraft = {
  key: string;
  label: string;
  href: string;
  placement: "header" | "footer";
  order: number;
  isVisible: boolean;
};

export type ShellNavigationDraft = {
  defaultSiteKey: string;
  defaultPlacement: "header" | "footer";
  siteOptions: { key: string; label: string; previewPath: string }[];
  placementOptions: { key: "header" | "footer"; label: string }[];
  items: ShellNavigationItemDraft[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellPreviewDeviceOption = {
  key: "desktop" | "tablet" | "mobile";
  label: string;
  width: number;
  evidence: string;
};

export type ShellPreviewStudioDraft = {
  defaultSiteSlug: string;
  defaultRoute: string;
  defaultPersona: string;
  defaultJourneyStage: string;
  defaultDevice: "desktop" | "tablet" | "mobile";
  siteOptions: { slug: string; label: string; previewPath: string }[];
  personaOptions: { key: string; label: string }[];
  journeyStageOptions: { key: string; label: string }[];
  deviceOptions: ShellPreviewDeviceOption[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellClientWebsiteStudioSite = {
  key: string;
  label: string;
  tenantSlug: string;
  previewPath: string;
  audience: string;
  primaryCTA: string;
  trustSignal: string;
  heroDirection: string;
  mobileReadiness: "ready" | "needs_review";
  navReadiness: "ready" | "needs_review";
  heroReadiness: "ready" | "needs_review";
  portalReadiness: "ready" | "needs_review";
  status: "local_review" | "design_ready" | "publish_gated";
};

export type ShellClientWebsiteStudioPattern = {
  key: string;
  label: string;
  evidence: string;
  appliesTo: string[];
};

export type ShellClientWebsiteLaunchBlueprint = {
  siteKey: string;
  label: string;
  launchPacketId?: string;
  templateKey: string;
  ownerRole: string;
  defaultPages: string[];
  adminPermissionGates: string[];
  launchSequence: string[];
  blockedProviderActions: string[];
  convexFunctions: string[];
};

export type ShellClientWebsiteAdminPermissionPreset = {
  siteKey: string;
  label: string;
  description: string;
  ownerRole: string;
  inviteRole: string;
  scope: "platform" | "tenant" | "site";
  permissionSet: string[];
  approvalGates: string[];
  blockedActions: string[];
  convexFunctions: string[];
};

export type ShellClientAdminHandoffMatrix = {
  status: "provider-light-admin-handoff-matrix";
  totalSites: number;
  platformScoped: number;
  tenantScoped: number;
  siteScoped: number;
  readyForInvite: number;
  blockedInvites: number;
  providerBoundary: string;
  rows: {
    siteKey: string;
    label: string;
    tenantSlug: string;
    ownerRole: string;
    inviteRole: string;
    scope: "platform" | "tenant" | "site";
    permissionCount: number;
    viewPermissions: string[];
    editPermissions: string[];
    publishPermissions: string[];
    blockedInviteAction: string;
    approvalGate: string;
    missingArtifact: string;
    nextHumanGate: string;
    canInvite: false;
    canGrantMembership: false;
    providerWrites: false;
    liveConvexExecution: false;
    convexFunctions: string[];
  }[];
};

export type ShellClientWebsiteProvisioningOrder = {
  siteKey: string;
  label: string;
  tenantSlug: string;
  launchBlueprintLabel: string;
  adminPresetLabel: string;
  templateKey: string;
  requestedPlan: string;
  orderStatus: "review_ready" | "blocked_provider_gate" | "draft";
  ownerRole: string;
  inviteRole: string;
  scope: "platform" | "tenant" | "site";
  setupSteps: string[];
  approvalEvidence: string[];
  blockedActions: string[];
  convexFunctions: string[];
};

export type ShellClientWebsiteProvisioningExecution = {
  manifestPath: string;
  status: "provider-light-dry-run-contract";
  totalOrders: number;
  dryRunSteps: number;
  referencedFunctions: number;
  providerBoundary: string;
  blockedUntil: string[];
  orderSteps: {
    siteKey: string;
    executionMode: string;
    allowedBeforeHostedActivation: boolean;
    steps: { id: string; mode: "read" | "write" | "mixed"; blockedLiveActions: string[] }[];
  }[];
};

export type ShellClientWebsiteSpinUpQueue = {
  status: "provider-light-website-spin-up-queue";
  totalRequests: number;
  readyRequests: number;
  blockedRequests: number;
  totalSteps: number;
  providerBoundary: string;
  requests: {
    siteKey: string;
    label: string;
    tenantSlug: string;
    templateKey: string;
    ownerRole: string;
    inviteRole: string;
    adminPresetLabel: string;
    launchBlueprintLabel: string;
    priority: "founding" | "client" | "campaign";
    queueStatus: "ready_for_review" | "blocked_human_gate" | "draft";
    stepCount: number;
    nextGate: string;
    canCreateTenant: false;
    canCreateSite: false;
    canInviteAdmin: false;
    canPublish: false;
    providerWrites: false;
    liveConvexExecution: false;
    steps: { order: number; label: string; mode: "read" | "write" | "review"; blockedLiveAction: string }[];
    convexFunctions: string[];
  }[];
};

export type ShellClientWebsiteConfigurationProfiles = {
  status: "provider-light-configuration-profiles";
  totalProfiles: number;
  readyProfiles: number;
  blockedProfiles: number;
  providerBoundary: string;
  profiles: {
    siteKey: string;
    label: string;
    tenantSlug: string;
    templateKey: string;
    requestedPlan: string;
    brandProfile: string;
    navigationProfile: string;
    contentPack: string;
    adminPresetLabel: string;
    launchBlueprintLabel: string;
    crmPipeline: string;
    configurationStatus: "ready_for_review" | "blocked_human_gate" | "draft";
    ownerRole: string;
    inviteRole: string;
    editableSurfaces: string[];
    lockedSurfaces: string[];
    nextGate: string;
    canSaveConfig: false;
    canPublish: false;
    providerWrites: false;
    liveConvexExecution: false;
    convexFunctions: string[];
  }[];
};

export type ShellClientWebsiteConfigurationReviewPacket = {
  siteKey: string;
  label: string;
  reviewPosture: "provider-light-configuration-review";
  selectedProfileStatus: "ready_for_review" | "blocked_human_gate" | "draft";
  editableSurfaceCount: number;
  lockedSurfaceCount: number;
  saveBlockerCount: number;
  requiredEvidenceCount: number;
  surfaces: {
    key: string;
    label: string;
    kind: "brand" | "navigation" | "content" | "crm" | "permissions";
    status: "reviewable" | "locked";
    evidence: string;
  }[];
  saveBlockers: string[];
  requiredEvidence: string[];
  blockedLiveActions: string[];
  nextGate: string;
  canSaveConfig: false;
  canPublish: false;
  providerWrites: false;
  liveConvexExecution: false;
  convexFunctions: string[];
};

export type ShellClientWebsiteConfigurationChangeSet = {
  siteKey: string;
  label: string;
  changeSetStatus: "provider-light-draft-change-set";
  draftChangeCount: number;
  lockedChangeCount: number;
  approvalEvidenceCount: number;
  changeGroups: {
    key: string;
    label: string;
    surface: "brand" | "navigation" | "content" | "crm" | "permissions";
    status: "draft_review" | "locked_by_gate";
    proposedChange: string;
    impact: string;
  }[];
  saveBlockers: string[];
  approvalEvidence: string[];
  blockedLiveActions: string[];
  nextGate: string;
  canSaveConfig: false;
  canPublish: false;
  providerWrites: false;
  liveConvexExecution: false;
  convexFunctions: string[];
};

export type ShellClientWebsiteConfigurationApprovalMatrix = {
  siteKey: string;
  label: string;
  approvalPosture: "provider-light-approval-matrix";
  requiredApprovalCount: number;
  acceptedApprovalCount: number;
  blockedApprovalCount: number;
  approvalRows: {
    key: string;
    role: string;
    responsibility: string;
    status: "ready_for_review" | "blocked_human_gate" | "pending_evidence";
    requiredEvidence: string;
  }[];
  saveBlockers: string[];
  approvalEvidence: string[];
  blockedLiveActions: string[];
  nextGate: string;
  canCaptureApproval: false;
  canSaveConfig: false;
  canPublish: false;
  providerWrites: false;
  liveConvexExecution: false;
  convexFunctions: string[];
};

export type ShellClientWebsiteLaunchPacket = {
  siteKey: string;
  label: string;
  status: "provider-light-export-preview";
  readinessScore: number;
  previewPath: string;
  adminInviteStatus: string;
  manifestPath: string;
  packetSections: string[];
  handoffChecklist: string[];
  blockedExportActions: string[];
  copyBlocks: string[];
  convexFunctions: string[];
};

export type ShellClientWebsiteStarterContentPack = {
  siteKey: string;
  label: string;
  status: "provider-light-read-only-query-contract";
  templateKey: string;
  persona: string;
  journeyStage: string;
  pageCount: number;
  blockCount: number;
  pages: { pageKey: string; title: string; route: string; purpose: string; blockTitles: string[] }[];
  handoffNotes: string[];
  blockedSeedingActions: string[];
  convexFunctions: string[];
};

export type ShellClientWebsiteOnboardingReadiness = {
  siteKey: string;
  label: string;
  status: "provider-light-readiness-contract";
  readinessScore: number;
  completedTasks: number;
  totalTasks: number;
  openTasks: number;
  criticalBlockers: string[];
  taskGroups: {
    groupKey: string;
    label: string;
    ownerRole: string;
    tasks: { taskKey: string; label: string; status: "complete" | "ready" | "blocked"; evidence: string }[];
  }[];
  nextAction: string;
  blockedActivationActions: string[];
  convexFunctions: string[];
};

export type ShellClientWebsiteLaunchSimulation = {
  siteKey: string;
  label: string;
  status: "provider-light-launch-simulation";
  targetMinutes: number;
  estimatedMinutes: number;
  withinTarget: boolean;
  previewPath: string;
  previewLinkReady: boolean;
  adminInviteReady: boolean;
  adminInvitePosture: string;
  launchOutcome: string;
  timeline: {
    stepKey: string;
    label: string;
    estimatedMinutes: number;
    status: "ready" | "blocked" | "review";
    evidence: string;
  }[];
  handoffArtifacts: string[];
  blockedLiveActions: string[];
  convexFunctions: string[];
};

export type ShellClientWebsitePolishScorecard = {
  siteKey: string;
  label: string;
  status: "provider-light-polish-review";
  overallScore: number;
  mobileScore: number;
  proofScore: number;
  accessibilityScore: number;
  designStandard: string;
  criteria: {
    key: string;
    label: string;
    score: number;
    status: "pass" | "review" | "blocked";
    evidence: string;
    nextAction: string;
  }[];
  viewportChecks: {
    viewport: "desktop" | "tablet" | "mobile";
    label: string;
    status: "pass" | "review" | "blocked";
    evidence: string;
  }[];
  blockedPolishActions: string[];
  convexFunctions: string[];
};

export type ShellClientWebsiteVisualQaBudget = {
  siteKey: string;
  label: string;
  status: "provider-light-visual-qa-budget";
  qaTarget: string;
  screenshotPlan: {
    viewport: "desktop" | "tablet" | "mobile";
    route: string;
    status: "pass" | "review" | "blocked";
    requiredEvidence: string;
  }[];
  accessibilityChecks: {
    key: string;
    label: string;
    status: "pass" | "review" | "blocked";
    evidence: string;
    nextAction: string;
  }[];
  performanceBudgets: {
    metric: "lcp" | "js" | "image" | "interaction";
    label: string;
    budget: string;
    currentEstimate: string;
    status: "pass" | "review" | "blocked";
    evidence: string;
  }[];
  regressionTargets: string[];
  blockedQaActions: string[];
  convexFunctions: string[];
};

export type ShellClientWebsiteVisualQaEvidencePacket = {
  siteKey: string;
  label: string;
  status: "provider-light-qa-evidence-packet";
  evidencePosture: string;
  evidenceItems: {
    key: string;
    label: string;
    kind: "screenshot" | "accessibility" | "performance" | "regression";
    status: "accepted" | "pending" | "blocked";
    requiredArtifact: string;
    currentEvidence: string;
    owner: "platform" | "tenant" | "client" | "provider";
  }[];
  approvalChecklist: {
    key: string;
    label: string;
    status: "ready" | "review" | "blocked";
    decisionGate: string;
  }[];
  openRisks: string[];
  blockedEvidenceActions: string[];
  convexFunctions: string[];
};

export type ShellClientWebsiteLaunchDecisionPacket = {
  siteKey: string;
  label: string;
  status: "provider-light-launch-decision";
  launchDecision: "go" | "review" | "no_go";
  decisionPosture: string;
  approvalOwner: string;
  decisionCriteria: {
    key: string;
    label: string;
    status: "ready" | "review" | "blocked";
    evidence: string;
    decisionGate: string;
  }[];
  rollbackPlan: {
    owner: string;
    status: "ready" | "review" | "blocked";
    steps: string[];
  };
  requiredSignoffs: string[];
  blockedLaunchActions: string[];
  convexFunctions: string[];
};

export type ShellClientWebsitePreviewReviewPacket = {
  siteKey: string;
  label: string;
  previewPath: string;
  route: string;
  persona: string;
  journeyStage: string;
  device: "desktop" | "tablet" | "mobile";
  reviewSource: "site-studio-preview";
  reviewPosture: "provider-light-preview-review";
  launchDecision: "go" | "review" | "no_go";
  context: { label: string; value: string }[];
  evidenceChecklist: {
    key: string;
    label: string;
    status: "accepted" | "ready" | "pending" | "blocked";
    evidence: string;
  }[];
  blockedLiveActions: string[];
  requiredBeforeClientShare: string[];
  convexFunctions: string[];
};

export type ShellClientWebsiteStudio = {
  defaultSiteKey: string;
  sites: ShellClientWebsiteStudioSite[];
  designPatterns: ShellClientWebsiteStudioPattern[];
  launchBlueprints: ShellClientWebsiteLaunchBlueprint[];
  adminPermissionPresets: ShellClientWebsiteAdminPermissionPreset[];
  adminHandoffMatrix: ShellClientAdminHandoffMatrix;
  provisioningOrders: ShellClientWebsiteProvisioningOrder[];
  provisioningExecution: ShellClientWebsiteProvisioningExecution;
  spinUpQueue: ShellClientWebsiteSpinUpQueue;
  configurationProfiles: ShellClientWebsiteConfigurationProfiles;
  configurationReviewPackets: ShellClientWebsiteConfigurationReviewPacket[];
  configurationChangeSets: ShellClientWebsiteConfigurationChangeSet[];
  configurationApprovalMatrices: ShellClientWebsiteConfigurationApprovalMatrix[];
  launchPackets: ShellClientWebsiteLaunchPacket[];
  starterContentPacks: ShellClientWebsiteStarterContentPack[];
  onboardingReadiness: ShellClientWebsiteOnboardingReadiness[];
  launchSimulations: ShellClientWebsiteLaunchSimulation[];
  polishScorecards: ShellClientWebsitePolishScorecard[];
  visualQaBudgets: ShellClientWebsiteVisualQaBudget[];
  visualQaEvidencePackets: ShellClientWebsiteVisualQaEvidencePacket[];
  launchDecisionPackets: ShellClientWebsiteLaunchDecisionPacket[];
  previewReviewPackets: ShellClientWebsitePreviewReviewPacket[];
  researchSources: { label: string; url: string }[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellAssetDraft = {
  key: string;
  name: string;
  kind: "logo" | "hero" | "program" | "campaign" | "document";
  status: "draft" | "approved" | "archived";
  siteKey: string;
  usage: string;
  storageProvider: "fixture" | "cloudinary" | "r2" | "s3";
  storageKey: string;
  publicUrl?: string;
  altText: string;
  provenance: string;
};

export type ShellAssetLibraryDraft = {
  defaultSiteKey: string;
  defaultAssetKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  kindOptions: { key: ShellAssetDraft["kind"]; label: string }[];
  statusOptions: { key: ShellAssetDraft["status"]; label: string }[];
  assets: ShellAssetDraft[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellDomainDraft = {
  key: string;
  siteKey: string;
  hostname: string;
  status: "pending" | "verified" | "disabled";
  isPrimary: boolean;
  verificationToken: string;
  sslStatus: "not_requested" | "pending" | "issued" | "blocked";
  providerStatus: "not_attached" | "ready_for_dns" | "attached" | "blocked";
  rollbackPlan: string;
};

export type ShellDomainReadinessDraft = {
  defaultSiteKey: string;
  defaultDomainKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  statusOptions: { key: ShellDomainDraft["status"]; label: string }[];
  domains: ShellDomainDraft[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
  dnsChecklist: string[];
};

export type ShellIntegrationProvider =
  | "sendgrid"
  | "twilio"
  | "stripe_billing"
  | "stripe_connect"
  | "cloudinary"
  | "object_storage"
  | "ai_gateway";

export type ShellIntegrationStatus =
  | "not_configured"
  | "ready_for_env"
  | "review_pending"
  | "active"
  | "paused";

export type ShellIntegrationDraft = {
  key: string;
  provider: ShellIntegrationProvider;
  label: string;
  scope: "platform" | "tenant" | "site";
  tenantSlug: string;
  siteKey?: string;
  status: ShellIntegrationStatus;
  envKeys: string[];
  useCase: string;
  providerBoundary: string;
  approvalNotes: string;
  smokeGate: string;
};

export type ShellIntegrationReadiness = {
  defaultTenantSlug: string;
  defaultSiteKey: string;
  defaultIntegrationKey: string;
  tenantOptions: { slug: string; label: string }[];
  siteOptions: { key: string; label: string; tenantSlug: string }[];
  providerOptions: { key: ShellIntegrationProvider; label: string; category: string }[];
  statusOptions: { key: ShellIntegrationStatus; label: string }[];
  integrations: ShellIntegrationDraft[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
  safetyChecklist: string[];
};

export type ShellCampaignChannel = "email" | "sms" | "multi_channel" | "ai_assisted";

export type ShellCampaignStatus = "draft" | "review_pending" | "approved" | "paused" | "archived";

export type ShellCampaignStepDraft = {
  key: string;
  channel: "email" | "sms" | "task" | "ai_draft";
  label: string;
  subject?: string;
  body: string;
  delayHours: number;
  requiresApproval: boolean;
  providerStatus: "not_queued" | "ready_for_review" | "approved" | "blocked";
};

export type ShellCampaignDraft = {
  key: string;
  siteKey: string;
  name: string;
  channel: ShellCampaignChannel;
  status: ShellCampaignStatus;
  objective: string;
  targetPersona: string;
  journeyStage: string;
  approvalOwner: string;
  providerBoundary: string;
  steps: ShellCampaignStepDraft[];
};

export type ShellCampaignAutomation = {
  defaultSiteKey: string;
  defaultCampaignKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  channelOptions: { key: ShellCampaignChannel; label: string }[];
  statusOptions: { key: ShellCampaignStatus; label: string }[];
  campaigns: ShellCampaignDraft[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
  safetyChecklist: string[];
};

export type ShellAiReviewStatus = "pending" | "approved" | "rejected";

export type ShellAiReviewRecord = {
  key: string;
  siteKey: string;
  campaignKey?: string;
  promptSummary: string;
  sourceInputs: string[];
  outputSummary: string;
  publishTarget: string;
  status: ShellAiReviewStatus;
  reviewer: string;
  reviewerNotes: string;
  providerBoundary: string;
};

export type ShellAiReviewQueue = {
  defaultSiteKey: string;
  defaultRecordKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  statusOptions: { key: ShellAiReviewStatus; label: string }[];
  records: ShellAiReviewRecord[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
  reviewChecklist: string[];
};

export type ShellExperienceControl = {
  label: string;
  value: string;
  iconKey: ExperienceIconKey;
};

export type ShellExperiencePreference = {
  scopeLabel: string;
  scopeKind: "user" | "tenant" | "site";
  tenant: string;
  site: string;
  defaultLandingPage: string;
  theme: "light" | "dark" | "system";
  dataDensity: "compact" | "comfortable" | "spacious";
  itemsPerPage: number;
  defaultContentFilter: string;
  notificationChannels: string[];
  workflowDefaults: { label: string; value: string }[];
  communicationDefaults: { label: string; value: string }[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellRole = {
  role: string;
  scope: string;
  access: string;
  owner: string;
};

export type ShellAccessRoleOption = {
  key: string;
  label: string;
  scope: "tenant" | "site";
  description: string;
  permissions: string[];
};

export type ShellAccessDelegation = {
  defaultEmail: string;
  defaultTenantSlug: string;
  defaultSiteKey: string;
  defaultRoleKey: string;
  tenantOptions: { slug: string; label: string }[];
  siteOptions: { key: string; label: string; tenantSlug: string }[];
  roleOptions: ShellAccessRoleOption[];
  providerBoundary: string;
  convexMutations: string[];
  activationEvidence: string[];
};

export type ShellLead = {
  name: string;
  email: string;
  site: string;
  persona: string;
  stage: string;
  owner: string;
  status: KinfloShellStatus;
  lastEvent: string;
};

export type ShellPipelineStage = {
  label: string;
  slug: string;
  leads: number;
  color: string;
};

export type ShellTask = {
  title: string;
  lead: string;
  owner: string;
  due: string;
  status: KinfloShellStatus;
};

export type ShellLeadCaptureContract = {
  label: string;
  blockType: "lead_magnet" | "form" | "campaign";
  convexFunction: string;
  runtime: "legacy fallback" | "convex ready";
  requiredFields: string[];
  fallback: string;
};

export type ShellSiteLaunchStep = {
  label: string;
  status: KinfloShellStatus;
};

export type ShellSiteLaunchPacket = {
  id: string;
  label: string;
  tenant: string;
  siteName: string;
  template: string;
  subdomain: string;
  ownerEmail: string;
  ownerRole: string;
  previewPath: string;
  configurationSummary: string[];
  permissionGates: string[];
  convexMutations: string[];
  launchChecklist: ShellSiteLaunchStep[];
};

export type ShellSiteCreationWizard = {
  defaultSiteName: string;
  defaultSubdomain: string;
  defaultTemplateKey: string;
  brandToneOptions: string[];
  ownerRoleOptions: string[];
  pageOptions: { key: string; label: string; required: boolean }[];
  readinessChecks: string[];
  convexMutations: string[];
};

export type ShellLaunchReadinessStatus = "ready" | "pending" | "blocked";

export type ShellLaunchReadinessStage = {
  key: string;
  label: string;
  surface: string;
  status: ShellLaunchReadinessStatus;
  owner: string;
  evidence: string;
  gate: string;
  convexFunctions: string[];
};

export type ShellLaunchReadinessSite = {
  key: string;
  label: string;
  tenant: string;
  previewPath: string;
  readinessPercent: number;
  launchDecision: "ready_for_review" | "needs_work" | "blocked";
  blockerSummary: string;
  stages: ShellLaunchReadinessStage[];
};

export type ShellLaunchReadiness = {
  defaultSiteKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  sites: ShellLaunchReadinessSite[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellLaunchGate = {
  label: string;
  status: KinfloShellStatus;
};

export type KinfloShellSnapshot = {
  dataMode: ShellDataMode;
  activeObjectSignal: ShellActiveObjectSignal;
  metrics: ShellMetric[];
  liveAdapterBindings: ShellLiveAdapterBinding[];
  tenants: ShellTenant[];
  sites: ShellSite[];
  billingPlans: ShellBillingPlan[];
  tenantEntitlements: ShellTenantEntitlement[];
  templates: ShellTemplate[];
  contentDraft: ShellContentDraft;
  brandTheme: ShellBrandThemeDraft;
  navigationDraft: ShellNavigationDraft;
  previewStudio: ShellPreviewStudioDraft;
  clientWebsiteStudio: ShellClientWebsiteStudio;
  assetLibrary: ShellAssetLibraryDraft;
  domainReadiness: ShellDomainReadinessDraft;
  integrationReadiness: ShellIntegrationReadiness;
  campaignAutomation: ShellCampaignAutomation;
  aiReview: ShellAiReviewQueue;
  experienceControls: ShellExperienceControl[];
  experiencePreferences: ShellExperiencePreference;
  roles: ShellRole[];
  accessDelegation: ShellAccessDelegation;
  leads: ShellLead[];
  pipelineStages: ShellPipelineStage[];
  tasks: ShellTask[];
  leadCaptureContracts: ShellLeadCaptureContract[];
  siteLaunchPackets: ShellSiteLaunchPacket[];
  siteCreationWizard: ShellSiteCreationWizard;
  launchReadiness: ShellLaunchReadiness;
  adapterSwitchReadiness: ShellAdapterSwitchReadiness;
  hostedActivationRunbook: ShellHostedActivationRunbook;
  launchGates: ShellLaunchGate[];
};

export type KinfloShellDataAdapter = {
  mode: ShellDataMode["source"];
  getSnapshot: () => KinfloShellSnapshot;
};

const fixtureTenants: ShellTenant[] = [
  {
    name: "Julie's Family Learning Program",
    slug: "julies-family",
    plan: "Founding Tenant",
    sites: 2,
    owner: "Vambah",
    status: "active",
  },
  {
    name: "Advisor Client Starter",
    slug: "advisor-client-starter",
    plan: "Client Build",
    sites: 1,
    owner: "Client Admin",
    status: "draft",
  },
  {
    name: "Campaign Microsite Lab",
    slug: "campaign-microsite-lab",
    plan: "Launch Lab",
    sites: 2,
    owner: "Campaign Editor",
    status: "draft",
  },
];

const fixtureSites: ShellSite[] = [
  {
    name: "Julie Family Public Site",
    tenant: "julies-family",
    domain: "juliesfamily.org",
    route: "/",
    template: "Nonprofit Learning Center",
    status: "published",
    previewPath: "/kinflo-sites/julies-family",
  },
  {
    name: "Tech Goes Home Cohort",
    tenant: "julies-family",
    domain: "tgh.juliesfamily.org",
    route: "/programs/tech-goes-home",
    template: "Campaign Microsite",
    status: "preview",
    previewPath: "/kinflo-sites/campaign-microsite",
  },
  {
    name: "Advisor Client Site",
    tenant: "advisor-client-starter",
    domain: "pending",
    route: "/",
    template: "Advisor Consultant",
    status: "draft",
    previewPath: "/kinflo-sites/advisor-client-site",
  },
];

const fixtureActiveObjectSignal: ShellActiveObjectSignal = {
  objectType: "Client site",
  label: "Julie Family Public Site",
  tenantSlug: "julies-family",
  siteKey: "julies-family-public",
  environment: "Fixture review",
  environmentDetail: "Provider-light shell using typed local fixtures until hosted Convex activation and generated API review pass.",
  readinessLabel: "3 of 5 Site Studio gates ready",
  readinessPercent: 60,
  launchPosture: "Review, not publish",
  nextDecision: "Review final screenshot, accessibility, performance, and rollback evidence before accepting the public launch.",
  owner: "platform.super_admin",
  requiredEvidence: [
    "hosted visual QA evidence",
    "read-only hosted smoke transcript",
    "publish rollback owner",
  ],
  blockedLiveActions: [
    "publish public site",
    "switch fixture adapter",
    "run hosted smoke",
  ],
  disabledActionLabel: "Live publish gated",
  disabledActionReason: "Hosted Convex activation, generated API review, visual QA evidence, domain readiness, and launch signoff are incomplete.",
  unblockCondition: "Approve hosted ownership and codegen window, pass read-only smokes, accept the launch decision packet, then approve mutation order and rollback.",
  providerBoundary: "This active-object signal is local evidence only. It does not publish content, write leads, switch adapters, execute hosted Convex, attach domains, send invites, or call providers.",
  evidenceLinks: [
    "docs/phase75-design-frame-adoption-backlog.md",
    "docs/phase76-active-object-signal.md",
    "docs/phase69-client-launch-decisions.md",
  ],
  convexFunctions: [
    "launchReadiness.getSiteLaunchReadiness",
    "siteFactory.listClientWebsiteLaunchDecisionPackets",
    "activation.readiness",
  ],
};

const fixtureBillingPlans: ShellBillingPlan[] = [
  {
    key: "pilot",
    label: "Pilot",
    price: "$0 while provider-gated",
    fit: "Early customers, proof sites, and launch partners",
    status: "active",
    limits: [
      { label: "Sites", value: "2" },
      { label: "Admins", value: "3" },
      { label: "Contacts", value: "500" },
      { label: "Campaigns", value: "2" },
      { label: "AI credits", value: "100" },
      { label: "Custom domains", value: "0" },
      { label: "Automations", value: "2" },
    ],
    features: ["Site factory", "CRM lead capture", "Manual override entitlements"],
    gatedModules: ["Stripe Billing gated", "Stripe Connect later", "Production import smoke pending"],
  },
  {
    key: "growth",
    label: "Growth",
    price: "$97/mo target",
    fit: "Client businesses that need multiple sites and reusable campaigns",
    status: "draft",
    limits: [
      { label: "Sites", value: "5" },
      { label: "Admins", value: "8" },
      { label: "Contacts", value: "5,000" },
      { label: "Campaigns", value: "10" },
      { label: "AI credits", value: "1,000" },
      { label: "Custom domains", value: "3" },
      { label: "Automations", value: "10" },
    ],
    features: ["Campaign microsites", "Custom domains", "Automation safety limits"],
    gatedModules: ["Stripe price ID", "Hosted Convex billing sync", "Live invoice webhooks"],
  },
  {
    key: "scale",
    label: "Scale",
    price: "$297/mo target",
    fit: "Higher-volume clients with many client sites and operators",
    status: "draft",
    limits: [
      { label: "Sites", value: "20" },
      { label: "Admins", value: "25" },
      { label: "Contacts", value: "25,000" },
      { label: "Campaigns", value: "50" },
      { label: "AI credits", value: "5,000" },
      { label: "Custom domains", value: "10" },
      { label: "Automations", value: "50" },
    ],
    features: ["Advanced CRM", "AI review workflows", "Priority launch support"],
    gatedModules: ["Stripe price ID", "Usage metering", "Client-owned payment module"],
  },
];

const fixtureTenantEntitlements: ShellTenantEntitlement[] = [
  {
    tenant: "Julie's Family Learning Program",
    tenantSlug: "julies-family",
    planKey: "pilot",
    planLabel: "Pilot",
    source: "founding tenant manual override",
    status: "active",
    usage: [
      { label: "Sites", value: "2", limit: "2" },
      { label: "Admins", value: "2", limit: "3" },
      { label: "Contacts", value: "184", limit: "500" },
      { label: "Campaigns", value: "1", limit: "2" },
    ],
    featureOverrides: ["custom domain review allowed", "public preview enabled", "AI generation review-only"],
    nextReview: "After hosted Convex smoke",
  },
  {
    tenant: "Advisor Client Starter",
    tenantSlug: "advisor-client-starter",
    planKey: "growth",
    planLabel: "Growth",
    source: "manual override before Stripe Billing",
    status: "draft",
    usage: [
      { label: "Sites", value: "1", limit: "5" },
      { label: "Admins", value: "1", limit: "8" },
      { label: "Contacts", value: "0", limit: "5,000" },
      { label: "Campaigns", value: "0", limit: "10" },
    ],
    featureOverrides: ["site factory enabled", "custom domain gated", "automations gated"],
    nextReview: "Before client launch",
  },
  {
    tenant: "Campaign Microsite Lab",
    tenantSlug: "campaign-microsite-lab",
    planKey: "pilot",
    planLabel: "Pilot",
    source: "pilot manual override",
    status: "draft",
    usage: [
      { label: "Sites", value: "2", limit: "2" },
      { label: "Admins", value: "1", limit: "3" },
      { label: "Contacts", value: "0", limit: "500" },
      { label: "Campaigns", value: "1", limit: "2" },
    ],
    featureOverrides: ["campaign microsite enabled", "AI credits capped", "Stripe Connect later"],
    nextReview: "After campaign copy approval",
  },
];

const fixtureTemplates: ShellTemplate[] = [
  {
    key: "nonprofit-learning-center",
    label: "Nonprofit Learning Center",
    fit: "Family learning, cohorts, volunteers, donors",
    blocks: ["Hero", "Services", "Events", "Testimonials", "Lead magnet"],
    configurableFields: ["Mission", "Program list", "Volunteer path", "Donor CTA", "Family intake"],
    imageDirection: "Warm documentary photography with real learning moments, clear faces, and visible community context.",
    qaChecks: ["Mobile hero crop", "Program scan depth", "Lead capture clarity", "Donor/volunteer path separation"],
    launchCriteria: ["Homepage copy approved", "Program page linked", "Intake destination tested", "Accessibility contrast checked"],
  },
  {
    key: "advisor-consultant",
    label: "Advisor Consultant",
    fit: "Client services, offers, case studies, intake",
    blocks: ["Hero", "Services", "Proof", "Form"],
    configurableFields: ["Offer stack", "Proof points", "Case-study slots", "Booking CTA", "Qualification questions"],
    imageDirection: "Editorial professional imagery with visible collaboration, calm work surfaces, and no generic handshake stock.",
    qaChecks: ["Offer hierarchy", "Proof before intake", "CTA specificity", "Mobile form length"],
    launchCriteria: ["Primary offer selected", "Proof block approved", "Booking/intake path tested", "Terms link present"],
  },
  {
    key: "campaign-microsite",
    label: "Campaign Microsite",
    fit: "Launches, cohorts, fundraising, local campaigns",
    blocks: ["Hero", "Campaign", "Proof", "Lead magnet"],
    configurableFields: ["Campaign goal", "Deadline", "Progress metric", "Supporter CTA", "Conversion source"],
    imageDirection: "High-trust campaign visuals that show people, progress, and a concrete next action.",
    qaChecks: ["Goal visibility", "Progress accuracy", "Single CTA dominance", "Share/mobile scan"],
    launchCriteria: ["Goal verified", "Lead source set", "Campaign copy approved", "Tracking reviewed"],
  },
];

const fixtureContentDraft: ShellContentDraft = {
  defaultSiteKey: "advisor-client-site",
  defaultPageSlug: "home",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  pageOptions: [
    { slug: "home", label: "Homepage", status: "draft" },
    { slug: "services", label: "Services", status: "draft" },
    { slug: "intake", label: "Intake", status: "draft" },
  ],
  blocks: [
    {
      key: "hero",
      type: "hero",
      label: "Hero",
      title: "Build a client-ready website without starting from zero",
      body: "Use KinFlo to configure the offer, proof, intake, and follow-up system from one tenant-safe shell.",
      status: "draft",
      persona: "client prospect",
      journeyStage: "awareness",
    },
    {
      key: "services",
      type: "services",
      label: "Services",
      title: "Advisory services with a clear path to action",
      body: "Package consultation, implementation support, and operating-system setup as reusable site content blocks.",
      status: "draft",
      persona: "client prospect",
      journeyStage: "consideration",
    },
    {
      key: "intake",
      type: "form",
      label: "Intake",
      title: "Start with the right questions",
      body: "Collect fit, urgency, goals, and preferred follow-up channel before a client enters the CRM pipeline.",
      status: "draft",
      persona: "qualified lead",
      journeyStage: "decision",
    },
  ],
  providerBoundary: "Live content save and publish are gated until generated Convex API bindings, hosted auth, and content smoke cleanup are approved.",
  convexFunctions: [
    "siteBuilder.getSiteDraft",
    "siteBuilder.createPage",
    "siteBuilder.updatePage",
    "siteBuilder.createContentBlock",
    "siteBuilder.updateContentBlock",
    "siteBuilder.upsertVisibilityRule",
    "siteBuilder.publishPage",
  ],
  activationEvidence: [
    "site admin can edit assigned site draft content",
    "editor cannot publish without content:publish",
    "visibility rules require explicit persona or journey context",
    "publish writes audit evidence and public preview resolves updated content",
  ],
};

const fixtureBrandTheme: ShellBrandThemeDraft = {
  defaultSiteKey: "advisor-client-site",
  defaultPaletteKey: "trust-minimal",
  defaultTypographyKey: "editorial-system",
  defaultButtonKey: "grounded-actions",
  defaultMediaKey: "documentary-proof",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  paletteOptions: [
    {
      key: "trust-minimal",
      label: "Trust Minimal",
      background: "#ffffff",
      foreground: "#111827",
      accent: "#0f766e",
      description: "Quiet operational shell for advisory and client-services sites.",
    },
    {
      key: "learning-warm",
      label: "Learning Warmth",
      background: "#fffaf3",
      foreground: "#1f2937",
      accent: "#b45309",
      description: "Human learning programs with warm proof and family-facing calls to action.",
    },
    {
      key: "campaign-clarity",
      label: "Campaign Clarity",
      background: "#f8fafc",
      foreground: "#172554",
      accent: "#dc2626",
      description: "High-contrast microsites for urgency, launches, and conversion campaigns.",
    },
  ],
  typographyOptions: [
    { key: "editorial-system", label: "Editorial System", heading: "Fraunces", body: "Inter", scale: "Measured" },
    { key: "operational-sans", label: "Operational Sans", heading: "Inter", body: "Inter", scale: "Compact" },
    { key: "community-serif", label: "Community Serif", heading: "Source Serif 4", body: "Public Sans", scale: "Open" },
  ],
  buttonOptions: [
    { key: "grounded-actions", label: "Grounded Actions", style: "Solid primary with quiet secondary links", radius: 8 },
    { key: "compact-tools", label: "Compact Tools", style: "Dense admin controls with icon-first affordances", radius: 6 },
    { key: "bold-campaign", label: "Bold Campaign", style: "High-contrast call-to-action buttons", radius: 10 },
  ],
  mediaOptions: [
    { key: "documentary-proof", label: "Documentary Proof", treatment: "Real people, clear context, light correction", ratio: "4:3" },
    { key: "cohort-momentum", label: "Cohort Momentum", treatment: "Groups, workshops, and collaborative moments", ratio: "16:9" },
    { key: "product-focus", label: "Product Focus", treatment: "Screens, dashboards, and service outcomes", ratio: "3:2" },
  ],
  providerBoundary: "Live theme save is gated until hosted Convex auth, generated API bindings, visual QA, and public renderer smoke are approved.",
  convexFunctions: [
    "controlPlane.updateThemeTokens",
    "siteBuilder.getSiteDraft",
    "publicSite.resolvePublishedSite",
  ],
  activationEvidence: [
    "site admin can update assigned theme tokens",
    "theme changes write audit evidence",
    "public preview resolves updated palette and typography",
    "visual QA passes mobile and desktop before publish",
  ],
};

const fixtureNavigationDraft: ShellNavigationDraft = {
  defaultSiteKey: "advisor-client-site",
  defaultPlacement: "header",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  placementOptions: [
    { key: "header", label: "Header" },
    { key: "footer", label: "Footer" },
  ],
  items: [
    { key: "home", label: "Home", href: "/", placement: "header", order: 1, isVisible: true },
    { key: "services", label: "Services", href: "/services", placement: "header", order: 2, isVisible: true },
    { key: "proof", label: "Proof", href: "/proof", placement: "header", order: 3, isVisible: true },
    { key: "intake", label: "Start Here", href: "/intake", placement: "header", order: 4, isVisible: true },
    { key: "privacy", label: "Privacy", href: "/privacy", placement: "footer", order: 1, isVisible: true },
    { key: "contact", label: "Contact", href: "/contact", placement: "footer", order: 2, isVisible: true },
  ],
  providerBoundary: "Live navigation save is gated until hosted Convex auth, generated API bindings, public preview smoke, and audit review are approved.",
  convexFunctions: [
    "siteBuilder.getSiteDraft",
    "siteBuilder.upsertNavigationItem",
    "publicSite.resolvePublishedSite",
  ],
  activationEvidence: [
    "site admin can update assigned site navigation",
    "navigation write is guarded by site:update",
    "public preview resolves updated header and footer order",
    "audit event records navigation_item_upserted",
  ],
};

const fixturePreviewStudio: ShellPreviewStudioDraft = {
  defaultSiteSlug: "advisor-client-site",
  defaultRoute: "/",
  defaultPersona: "provider",
  defaultJourneyStage: "consideration",
  defaultDevice: "desktop",
  siteOptions: [
    { slug: "julies-family", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { slug: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { slug: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  personaOptions: [
    { key: "anonymous", label: "Anonymous" },
    { key: "parent", label: "Parent" },
    { key: "provider", label: "Provider" },
    { key: "donor", label: "Donor" },
    { key: "volunteer", label: "Volunteer" },
  ],
  journeyStageOptions: [
    { key: "default", label: "Default" },
    { key: "awareness", label: "Awareness" },
    { key: "consideration", label: "Consideration" },
    { key: "decision", label: "Decision" },
    { key: "retention", label: "Retention" },
  ],
  deviceOptions: [
    { key: "desktop", label: "Desktop", width: 1440, evidence: "full navigation, hero, intake, and footer visible without overflow" },
    { key: "tablet", label: "Tablet", width: 834, evidence: "stacked sections preserve primary CTA and intake context" },
    { key: "mobile", label: "Mobile", width: 390, evidence: "no horizontal overflow and readable public conversion path" },
  ],
  providerBoundary: "Preview QA is local until hosted Convex reads, generated API bindings, lead smoke, and visual QA are approved.",
  convexFunctions: [
    "publicSite.resolvePublishedSite",
    "siteBuilder.publishPage",
    "crm.submitLead",
  ],
  activationEvidence: [
    "site preview resolves selected site and route",
    "audience context is explicit in the preview URL",
    "desktop, tablet, and mobile checks pass before publish",
    "public intake smoke confirms crm.submitLead contract",
  ],
};

const fixtureClientWebsiteStudio: ShellClientWebsiteStudio = {
  defaultSiteKey: "julies-family-public",
  sites: [
    {
      key: "julies-family-public",
      label: "Julie Family Public Site",
      tenantSlug: "julies-family",
      previewPath: "/kinflo-sites/julies-family",
      audience: "Parents, volunteers, donors, and community partners",
      primaryCTA: "Enroll or refer a family",
      trustSignal: "Program outcomes, founder story, and community proof must be visible before the first scroll break.",
      heroDirection: "A warm first-viewport program scene with a direct family learning promise and one clear enrollment path.",
      mobileReadiness: "ready",
      navReadiness: "ready",
      heroReadiness: "ready",
      portalReadiness: "needs_review",
      status: "local_review",
    },
    {
      key: "advisor-client-site",
      label: "Advisor Client Site",
      tenantSlug: "advisor-client-starter",
      previewPath: "/kinflo-sites/advisor-client-site",
      audience: "Service clients comparing offers, proof, and intake fit",
      primaryCTA: "Start the intake",
      trustSignal: "Proof, fit, and process clarity must be available before asking for a consultation.",
      heroDirection: "A quiet operational surface that explains the client result, shows credibility, and routes to intake.",
      mobileReadiness: "ready",
      navReadiness: "needs_review",
      heroReadiness: "ready",
      portalReadiness: "needs_review",
      status: "publish_gated",
    },
    {
      key: "campaign-microsite",
      label: "Campaign Microsite",
      tenantSlug: "campaign-microsite-lab",
      previewPath: "/kinflo-sites/campaign-microsite",
      audience: "Warm leads arriving from email, SMS, and referral campaigns",
      primaryCTA: "Claim the next step",
      trustSignal: "Offer terms, proof, and privacy expectations must be legible before conversion.",
      heroDirection: "A fast campaign page with a single offer, one visual proof point, and no competing navigation.",
      mobileReadiness: "needs_review",
      navReadiness: "ready",
      heroReadiness: "needs_review",
      portalReadiness: "needs_review",
      status: "local_review",
    },
  ],
  designPatterns: [
    {
      key: "mission-clarity",
      label: "Mission clarity before decoration",
      evidence: "Nonprofit and education exemplars prioritize a clear mission, immediate audience fit, and a visible next action.",
      appliesTo: ["julies-family-public", "advisor-client-site"],
    },
    {
      key: "parent-client-navigation",
      label: "Parent and client navigation",
      evidence: "Primary navigation should follow the visitor's intent: learn, verify, start, contact, and return to the portal.",
      appliesTo: ["julies-family-public", "advisor-client-site"],
    },
    {
      key: "mobile-first-public-preview",
      label: "Mobile-first public preview",
      evidence: "Public discovery and campaign traffic should pass the 390px review before any desktop polish is considered done.",
      appliesTo: ["julies-family-public", "advisor-client-site", "campaign-microsite"],
    },
    {
      key: "branded-portal-handoff",
      label: "Branded portal handoff",
      evidence: "The public page and logged-in portal need the same brand cues, role-aware expectations, and privacy boundary.",
      appliesTo: ["julies-family-public", "advisor-client-site", "campaign-microsite"],
    },
  ],
  launchBlueprints: [
    {
      siteKey: "julies-family-public",
      label: "Seeded tenant retrofit blueprint",
      templateKey: "nonprofit-learning-center",
      ownerRole: "platform.super_admin",
      defaultPages: ["home", "programs", "volunteer", "donate", "contact"],
      adminPermissionGates: ["site:view", "content:edit", "content:publish", "lead:view"],
      launchSequence: [
        "Treat Julie Family as the founding seeded tenant",
        "Map existing program, donation, volunteer, and intake pages to reusable content blocks",
        "Run visual QA before moving the public renderer off fixture data",
        "Keep live publish blocked until hosted Convex and generated API smokes pass",
      ],
      blockedProviderActions: [
        "hosted Convex deployment",
        "generated API import",
        "content publish write",
        "CRM lead write",
        "domain attachment",
      ],
      convexFunctions: [
        "siteFactory.listClientWebsiteLaunchBlueprints",
        "publicSite.resolvePublishedSite",
        "siteBuilder.updatePage",
        "siteBuilder.updateContentBlock",
        "crm.submitLead",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client starter blueprint",
      launchPacketId: "advisor-client-starter",
      templateKey: "advisor-consultant",
      ownerRole: "tenant.admin",
      defaultPages: ["home", "services", "proof", "intake", "privacy"],
      adminPermissionGates: ["tenant:create", "site:create", "member:invite", "content:edit", "content:publish"],
      launchSequence: [
        "Create tenant with Client Build plan",
        "Create site from Advisor Consultant template",
        "Seed proof-led homepage, services, intake, and privacy pages",
        "Invite tenant admin after role and site scope are reviewed",
        "Keep publish blocked until domain, hosted Convex, and lead smoke pass",
      ],
      blockedProviderActions: [
        "tenant create mutation",
        "client admin invitation email",
        "domain verification",
        "Stripe billing activation",
        "public publish write",
      ],
      convexFunctions: [
        "siteFactory.listClientWebsiteLaunchBlueprints",
        "controlPlane.createTenant",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "siteBuilder.publishPage",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite launch blueprint",
      launchPacketId: "campaign-microsite-lab",
      templateKey: "campaign-microsite",
      ownerRole: "site.editor",
      defaultPages: ["home", "offer", "proof", "signup", "privacy"],
      adminPermissionGates: ["site:create", "member:invite", "content:edit", "lead:view"],
      launchSequence: [
        "Attach campaign microsite to selected tenant or campaign lab",
        "Seed focused offer, proof, signup, and privacy blocks",
        "Scope editor permissions to the campaign site only",
        "Route submissions to the site CRM pipeline after lead smoke approval",
        "Keep campaign send blocked until consent and provider checks pass",
      ],
      blockedProviderActions: [
        "site create mutation",
        "campaign send",
        "SMS/email provider smoke",
        "AI copy publish",
        "public form lead write",
      ],
      convexFunctions: [
        "siteFactory.listClientWebsiteLaunchBlueprints",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "crm.submitLead",
        "campaigns.requestCampaignApproval",
      ],
    },
  ],
  adminPermissionPresets: [
    {
      siteKey: "julies-family-public",
      label: "Founding platform steward",
      description: "Super-admin only retrofit preset for the seeded Julie Family tenant until hosted auth, role sync, and public renderer smokes pass.",
      ownerRole: "platform.super_admin",
      inviteRole: "platform.super_admin",
      scope: "platform",
      permissionSet: ["site:view", "content:edit", "content:publish", "lead:view", "audit:view"],
      approvalGates: [
        "Confirm seeded tenant ownership",
        "Review content provenance before publish",
        "Keep client admin invitations disabled until role sync smoke passes",
      ],
      blockedActions: [
        "client admin invitation",
        "membership grant",
        "content publish write",
        "public lead write",
      ],
      convexFunctions: [
        "siteFactory.listClientWebsiteAdminPermissionPresets",
        "accessPolicy.viewerPermissionSnapshot",
        "roleCatalog.listRoleDefinitions",
        "controlPlane.grantMembership",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Tenant admin launch owner",
      description: "Client-ready tenant admin preset for advisory sites with site creation, scoped invitation, content editing, and publish review gates.",
      ownerRole: "tenant.admin",
      inviteRole: "tenant.admin",
      scope: "tenant",
      permissionSet: ["tenant:view", "site:create", "member:invite", "content:edit", "content:publish", "lead:view"],
      approvalGates: [
        "Create tenant after plan and entitlement review",
        "Invite client admin only after owner role is approved",
        "Require preview and lead smoke before publish",
      ],
      blockedActions: [
        "tenant create mutation",
        "client admin invitation email",
        "membership grant",
        "public publish write",
      ],
      convexFunctions: [
        "siteFactory.listClientWebsiteAdminPermissionPresets",
        "controlPlane.createTenant",
        "controlPlane.createInvitation",
        "controlPlane.grantMembership",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Site editor campaign operator",
      description: "Site-scoped editor preset for campaign microsites where content, leads, and campaigns stay limited to the selected site.",
      ownerRole: "site.editor",
      inviteRole: "site.editor",
      scope: "site",
      permissionSet: ["site:view", "member:invite", "content:edit", "lead:view", "campaign:manage"],
      approvalGates: [
        "Attach editor only to the selected campaign site",
        "Review campaign consent before provider activation",
        "Keep publish and send actions blocked until launch readiness passes",
      ],
      blockedActions: [
        "site editor invitation email",
        "campaign send",
        "AI copy publish",
        "public form lead write",
      ],
      convexFunctions: [
        "siteFactory.listClientWebsiteAdminPermissionPresets",
        "controlPlane.createInvitation",
        "accessPolicy.viewerPermissionSnapshot",
        "campaigns.requestCampaignApproval",
      ],
    },
  ],
  adminHandoffMatrix: {
    status: "provider-light-admin-handoff-matrix",
    totalSites: 3,
    platformScoped: 1,
    tenantScoped: 1,
    siteScoped: 1,
    readyForInvite: 0,
    blockedInvites: 3,
    providerBoundary: "Client admin invitations, membership grants, and permission writes remain blocked until hosted auth, role sync, owner signoff, and site-scoped smoke evidence pass.",
    rows: [
      {
        siteKey: "julies-family-public",
        label: "Julie Family Public Site",
        tenantSlug: "julies-family",
        ownerRole: "platform.super_admin",
        inviteRole: "platform.super_admin",
        scope: "platform",
        permissionCount: 5,
        viewPermissions: ["site:view", "lead:view", "audit:view"],
        editPermissions: ["content:edit"],
        publishPermissions: ["content:publish"],
        blockedInviteAction: "client admin invitation",
        approvalGate: "Confirm seeded tenant ownership",
        missingArtifact: "role sync smoke",
        nextHumanGate: "Approve founding tenant stewardship before inviting any non-platform admin.",
        canInvite: false,
        canGrantMembership: false,
        providerWrites: false,
        liveConvexExecution: false,
        convexFunctions: [
          "siteFactory.listClientWebsiteAdminPermissionPresets",
          "accessPolicy.viewerPermissionSnapshot",
          "roleCatalog.listRoleDefinitions",
          "controlPlane.grantMembership",
        ],
      },
      {
        siteKey: "advisor-client-site",
        label: "Advisor Client Site",
        tenantSlug: "advisor-client-starter",
        ownerRole: "tenant.admin",
        inviteRole: "tenant.admin",
        scope: "tenant",
        permissionCount: 6,
        viewPermissions: ["tenant:view", "lead:view"],
        editPermissions: ["site:create", "member:invite", "content:edit"],
        publishPermissions: ["content:publish"],
        blockedInviteAction: "client admin invitation email",
        approvalGate: "Invite client admin only after owner role is approved",
        missingArtifact: "tenant owner signoff",
        nextHumanGate: "Approve tenant owner, plan entitlement, and hosted read smoke before invitation delivery.",
        canInvite: false,
        canGrantMembership: false,
        providerWrites: false,
        liveConvexExecution: false,
        convexFunctions: [
          "siteFactory.listClientWebsiteAdminPermissionPresets",
          "controlPlane.createTenant",
          "controlPlane.createInvitation",
          "controlPlane.grantMembership",
        ],
      },
      {
        siteKey: "campaign-microsite",
        label: "Campaign Microsite",
        tenantSlug: "campaign-microsite-lab",
        ownerRole: "site.editor",
        inviteRole: "site.editor",
        scope: "site",
        permissionCount: 5,
        viewPermissions: ["site:view", "lead:view"],
        editPermissions: ["member:invite", "content:edit", "campaign:manage"],
        publishPermissions: [],
        blockedInviteAction: "site editor invitation email",
        approvalGate: "Attach editor only to the selected campaign site",
        missingArtifact: "campaign consent review",
        nextHumanGate: "Approve campaign consent, site scope, and provider-send boundary before editor invite.",
        canInvite: false,
        canGrantMembership: false,
        providerWrites: false,
        liveConvexExecution: false,
        convexFunctions: [
          "siteFactory.listClientWebsiteAdminPermissionPresets",
          "controlPlane.createInvitation",
          "accessPolicy.viewerPermissionSnapshot",
          "campaigns.requestCampaignApproval",
        ],
      },
    ],
  },
  provisioningOrders: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family seeded retrofit order",
      tenantSlug: "julies-family",
      launchBlueprintLabel: "Seeded tenant retrofit blueprint",
      adminPresetLabel: "Founding platform steward",
      templateKey: "nonprofit-learning-center",
      requestedPlan: "Founding platform",
      orderStatus: "review_ready",
      ownerRole: "platform.super_admin",
      inviteRole: "platform.super_admin",
      scope: "platform",
      setupSteps: [
        "Confirm the seeded tenant remains the founding platform tenant",
        "Map existing Julie Family pages into reusable content blocks",
        "Run public preview, lead capture, and content provenance review before publish",
      ],
      approvalEvidence: [
        "seeded tenant ownership note",
        "content provenance review",
        "public renderer fixture-to-live smoke",
      ],
      blockedActions: [
        "client admin invitation",
        "hosted Convex deployment",
        "generated API import",
        "public publish write",
        "CRM lead write",
      ],
      convexFunctions: [
        "siteFactory.listClientWebsiteProvisioningOrders",
        "siteFactory.listClientWebsiteLaunchBlueprints",
        "siteFactory.listClientWebsiteAdminPermissionPresets",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client tenant build order",
      tenantSlug: "advisor-client-starter",
      launchBlueprintLabel: "Advisor client starter blueprint",
      adminPresetLabel: "Tenant admin launch owner",
      templateKey: "advisor-consultant",
      requestedPlan: "Client Build",
      orderStatus: "blocked_provider_gate",
      ownerRole: "tenant.admin",
      inviteRole: "tenant.admin",
      scope: "tenant",
      setupSteps: [
        "Create tenant after plan and entitlement review",
        "Create site from Advisor Consultant template",
        "Invite tenant admin after role and domain review",
        "Run preview, lead, domain, and hosted Convex smokes before publish",
      ],
      approvalEvidence: [
        "plan entitlement approval",
        "tenant admin owner approval",
        "domain readiness smoke",
        "lead capture read-only smoke",
      ],
      blockedActions: [
        "controlPlane.createTenant mutation",
        "siteFactory.createSiteFromTemplate mutation",
        "client admin invitation email",
        "domain verification write",
        "Stripe billing activation",
      ],
      convexFunctions: [
        "siteFactory.listClientWebsiteProvisioningOrders",
        "controlPlane.createTenant",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "controlPlane.grantMembership",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite scoped editor order",
      tenantSlug: "campaign-microsite-lab",
      launchBlueprintLabel: "Campaign microsite launch blueprint",
      adminPresetLabel: "Site editor campaign operator",
      templateKey: "campaign-microsite",
      requestedPlan: "Campaign Lab",
      orderStatus: "draft",
      ownerRole: "site.editor",
      inviteRole: "site.editor",
      scope: "site",
      setupSteps: [
        "Attach microsite to the selected tenant or campaign lab",
        "Seed focused offer, proof, signup, and privacy blocks",
        "Scope editor access to the campaign site only",
        "Run consent, campaign approval, and provider-readiness review before send",
      ],
      approvalEvidence: [
        "campaign consent review",
        "site-scoped editor approval",
        "lead routing approval",
        "provider send smoke approval",
      ],
      blockedActions: [
        "site create mutation",
        "site editor invitation email",
        "campaign send",
        "AI copy publish",
        "public form lead write",
      ],
      convexFunctions: [
        "siteFactory.listClientWebsiteProvisioningOrders",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "crm.submitLead",
        "campaigns.requestCampaignApproval",
      ],
    },
  ],
  provisioningExecution: {
    manifestPath: "docs/convex-client-provisioning-execution-manifest.json",
    status: "provider-light-dry-run-contract",
    totalOrders: 3,
    dryRunSteps: 7,
    referencedFunctions: 18,
    providerBoundary: "Client provisioning execution remains a dry-run contract until hosted Convex activation, generated API review, read-only smokes, mutation smoke order, rollback owner, and provider approvals pass.",
    blockedUntil: [
      "Hosted Convex deployment is approved and configured outside committed source",
      "Generated API import/codegen is reviewed and approved",
      "Read-only hosted smokes pass for provisioning orders and public renderer",
      "Mutation smoke cleanup and rollback owner are approved",
      "Invitation delivery, domain, storage, billing, AI, SMS, and email provider gates are approved",
    ],
    orderSteps: [
      {
        siteKey: "julies-family-public",
        executionMode: "read_then_review",
        allowedBeforeHostedActivation: true,
        steps: [
          {
            id: "julie-seeded-tenant-confirmation",
            mode: "read",
            blockedLiveActions: ["membership grant", "content publish write", "public lead write"],
          },
          {
            id: "julie-content-provenance-review",
            mode: "read",
            blockedLiveActions: ["generated API import", "public publish write", "domain attachment"],
          },
        ],
      },
      {
        siteKey: "advisor-client-site",
        executionMode: "mutation_after_approval",
        allowedBeforeHostedActivation: false,
        steps: [
          {
            id: "advisor-plan-entitlement-review",
            mode: "read",
            blockedLiveActions: ["controlPlane.createTenant mutation", "Stripe billing activation"],
          },
          {
            id: "advisor-tenant-site-invite-sequence",
            mode: "write",
            blockedLiveActions: ["client admin invitation email", "membership grant", "public publish write"],
          },
          {
            id: "advisor-domain-lead-publish-smoke",
            mode: "mixed",
            blockedLiveActions: ["domain verification write", "public publish write", "CRM lead write"],
          },
        ],
      },
      {
        siteKey: "campaign-microsite",
        executionMode: "campaign_after_consent",
        allowedBeforeHostedActivation: false,
        steps: [
          {
            id: "campaign-site-editor-scope-review",
            mode: "read",
            blockedLiveActions: ["site editor invitation email", "public form lead write", "campaign send"],
          },
          {
            id: "campaign-send-provider-review",
            mode: "write",
            blockedLiveActions: ["campaign send", "AI copy publish", "SMS/email provider smoke"],
          },
        ],
      },
    ],
  },
  spinUpQueue: {
    status: "provider-light-website-spin-up-queue",
    totalRequests: 3,
    readyRequests: 1,
    blockedRequests: 2,
    totalSteps: 14,
    providerBoundary: "Website spin-up remains a super-admin review queue only. Tenant creation, site creation, admin invite delivery, public publishing, provider writes, and live Convex execution stay blocked until hosted activation, generated API review, owner signoff, and smoke evidence pass.",
    requests: [
      {
        siteKey: "julies-family-public",
        label: "Julie Family founding retrofit",
        tenantSlug: "julies-family",
        templateKey: "nonprofit-learning-center",
        ownerRole: "platform.super_admin",
        inviteRole: "platform.super_admin",
        adminPresetLabel: "Founding platform steward",
        launchBlueprintLabel: "Seeded tenant retrofit blueprint",
        priority: "founding",
        queueStatus: "ready_for_review",
        stepCount: 4,
        nextGate: "Confirm founding tenant ownership and fixture-to-live renderer parity.",
        canCreateTenant: false,
        canCreateSite: false,
        canInviteAdmin: false,
        canPublish: false,
        providerWrites: false,
        liveConvexExecution: false,
        steps: [
          { order: 1, label: "Confirm seeded tenant remains the founding platform tenant", mode: "review", blockedLiveAction: "tenant ownership mutation" },
          { order: 2, label: "Map existing Julie Family pages into reusable content blocks", mode: "read", blockedLiveAction: "siteBuilder.updateContentBlock mutation" },
          { order: 3, label: "Prepare super-admin-only launch packet and rollback note", mode: "review", blockedLiveAction: "client admin invitation" },
          { order: 4, label: "Hold public publish until hosted renderer and lead smoke pass", mode: "write", blockedLiveAction: "siteBuilder.publishPage mutation" },
        ],
        convexFunctions: [
          "siteFactory.listClientWebsiteProvisioningOrders",
          "publicSite.resolvePublishedSite",
          "siteBuilder.updateContentBlock",
          "siteBuilder.publishPage",
        ],
      },
      {
        siteKey: "advisor-client-site",
        label: "Advisor client tenant launch",
        tenantSlug: "advisor-client-starter",
        templateKey: "advisor-consultant",
        ownerRole: "tenant.admin",
        inviteRole: "tenant.admin",
        adminPresetLabel: "Tenant admin launch owner",
        launchBlueprintLabel: "Advisor client starter blueprint",
        priority: "client",
        queueStatus: "blocked_human_gate",
        stepCount: 5,
        nextGate: "Approve plan entitlement, tenant owner, domain posture, and hosted read smoke.",
        canCreateTenant: false,
        canCreateSite: false,
        canInviteAdmin: false,
        canPublish: false,
        providerWrites: false,
        liveConvexExecution: false,
        steps: [
          { order: 1, label: "Review Client Build plan entitlement", mode: "review", blockedLiveAction: "Stripe billing activation" },
          { order: 2, label: "Create tenant after owner approval", mode: "write", blockedLiveAction: "controlPlane.createTenant mutation" },
          { order: 3, label: "Create site from Advisor Consultant template", mode: "write", blockedLiveAction: "siteFactory.createSiteFromTemplate mutation" },
          { order: 4, label: "Prepare tenant admin invitation without sending email", mode: "write", blockedLiveAction: "controlPlane.createInvitation mutation" },
          { order: 5, label: "Run preview, lead, domain, and publish smokes after hosted activation", mode: "write", blockedLiveAction: "siteBuilder.publishPage mutation" },
        ],
        convexFunctions: [
          "controlPlane.createTenant",
          "siteFactory.createSiteFromTemplate",
          "controlPlane.createInvitation",
          "siteBuilder.publishPage",
          "crm.submitLead",
        ],
      },
      {
        siteKey: "campaign-microsite",
        label: "Campaign microsite scoped editor",
        tenantSlug: "campaign-microsite-lab",
        templateKey: "campaign-microsite",
        ownerRole: "site.editor",
        inviteRole: "site.editor",
        adminPresetLabel: "Site editor campaign operator",
        launchBlueprintLabel: "Campaign microsite launch blueprint",
        priority: "campaign",
        queueStatus: "draft",
        stepCount: 5,
        nextGate: "Approve campaign consent, site scope, lead routing, and provider-send boundary.",
        canCreateTenant: false,
        canCreateSite: false,
        canInviteAdmin: false,
        canPublish: false,
        providerWrites: false,
        liveConvexExecution: false,
        steps: [
          { order: 1, label: "Attach microsite to selected tenant or campaign lab", mode: "review", blockedLiveAction: "tenant association write" },
          { order: 2, label: "Create campaign microsite from template", mode: "write", blockedLiveAction: "siteFactory.createSiteFromTemplate mutation" },
          { order: 3, label: "Scope editor access to the campaign site only", mode: "write", blockedLiveAction: "controlPlane.createInvitation mutation" },
          { order: 4, label: "Prepare consent, lead routing, and campaign approval packet", mode: "review", blockedLiveAction: "campaigns.requestCampaignApproval mutation" },
          { order: 5, label: "Keep send and public form writes disabled until provider checks pass", mode: "write", blockedLiveAction: "campaign send" },
        ],
        convexFunctions: [
          "siteFactory.createSiteFromTemplate",
          "controlPlane.createInvitation",
          "campaigns.requestCampaignApproval",
          "crm.submitLead",
        ],
      },
    ],
  },
  configurationProfiles: {
    status: "provider-light-configuration-profiles",
    totalProfiles: 3,
    readyProfiles: 1,
    blockedProfiles: 2,
    providerBoundary: "Configuration profiles are local review records only. Saving brand, navigation, content, CRM, invite, publish, storage, billing, domain, provider, and live Convex changes remains blocked until hosted activation, generated API review, owner signoff, and smoke evidence pass.",
    profiles: [
      {
        siteKey: "julies-family-public",
        label: "Julie Family founding configuration",
        tenantSlug: "julies-family",
        templateKey: "nonprofit-learning-center",
        requestedPlan: "Founding platform",
        brandProfile: "Julie Family trust-and-learning system",
        navigationProfile: "Family, programs, volunteer, donate, contact",
        contentPack: "Family learning public content pack",
        adminPresetLabel: "Founding platform steward",
        launchBlueprintLabel: "Seeded tenant retrofit blueprint",
        crmPipeline: "family intake and partner interest",
        configurationStatus: "ready_for_review",
        ownerRole: "platform.super_admin",
        inviteRole: "platform.super_admin",
        editableSurfaces: ["brand review", "navigation review", "content provenance", "public preview"],
        lockedSurfaces: ["publish write", "lead write", "client invite", "domain attachment"],
        nextGate: "Confirm founding tenant ownership and public renderer parity before accepting live configuration.",
        canSaveConfig: false,
        canPublish: false,
        providerWrites: false,
        liveConvexExecution: false,
        convexFunctions: [
          "siteFactory.listClientWebsiteConfigurationProfiles",
          "siteFactory.listClientWebsiteProvisioningOrders",
          "publicSite.resolvePublishedSite",
          "siteBuilder.updateContentBlock",
        ],
      },
      {
        siteKey: "advisor-client-site",
        label: "Advisor client launch configuration",
        tenantSlug: "advisor-client-starter",
        templateKey: "advisor-consultant",
        requestedPlan: "Client Build",
        brandProfile: "Quiet advisory credibility system",
        navigationProfile: "Home, services, proof, intake, privacy",
        contentPack: "Advisor proof-led starter pack",
        adminPresetLabel: "Tenant admin launch owner",
        launchBlueprintLabel: "Advisor client starter blueprint",
        crmPipeline: "consultation intake and follow-up",
        configurationStatus: "blocked_human_gate",
        ownerRole: "tenant.admin",
        inviteRole: "tenant.admin",
        editableSurfaces: ["template selection", "starter copy review", "intake path", "permission scope"],
        lockedSurfaces: ["tenant create", "site create", "admin invitation", "Stripe billing", "domain verification"],
        nextGate: "Approve plan entitlement, tenant owner, domain posture, and hosted read smoke before configuration save.",
        canSaveConfig: false,
        canPublish: false,
        providerWrites: false,
        liveConvexExecution: false,
        convexFunctions: [
          "siteFactory.listClientWebsiteConfigurationProfiles",
          "controlPlane.createTenant",
          "siteFactory.createSiteFromTemplate",
          "controlPlane.createInvitation",
        ],
      },
      {
        siteKey: "campaign-microsite",
        label: "Campaign microsite configuration",
        tenantSlug: "campaign-microsite-lab",
        templateKey: "campaign-microsite",
        requestedPlan: "Campaign Lab",
        brandProfile: "Campaign offer proof system",
        navigationProfile: "Offer, proof, signup, privacy",
        contentPack: "Campaign conversion starter pack",
        adminPresetLabel: "Site editor campaign operator",
        launchBlueprintLabel: "Campaign microsite launch blueprint",
        crmPipeline: "campaign lead routing",
        configurationStatus: "draft",
        ownerRole: "site.editor",
        inviteRole: "site.editor",
        editableSurfaces: ["offer copy", "proof block", "signup path", "campaign consent notes"],
        lockedSurfaces: ["site create", "editor invitation", "public form write", "campaign send", "AI copy publish"],
        nextGate: "Approve campaign consent, site scope, lead routing, and provider-send boundary.",
        canSaveConfig: false,
        canPublish: false,
        providerWrites: false,
        liveConvexExecution: false,
        convexFunctions: [
          "siteFactory.listClientWebsiteConfigurationProfiles",
          "siteFactory.createSiteFromTemplate",
          "controlPlane.createInvitation",
          "campaigns.requestCampaignApproval",
        ],
      },
    ],
  },
  configurationReviewPackets: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family configuration review",
      reviewPosture: "provider-light-configuration-review",
      selectedProfileStatus: "ready_for_review",
      editableSurfaceCount: 4,
      lockedSurfaceCount: 4,
      saveBlockerCount: 4,
      requiredEvidenceCount: 4,
      surfaces: [
        { key: "brand", label: "Brand system", kind: "brand", status: "reviewable", evidence: "Julie Family trust-and-learning profile is mapped for review." },
        { key: "navigation", label: "Navigation", kind: "navigation", status: "reviewable", evidence: "Family, programs, volunteer, donate, and contact paths remain editable in fixture review." },
        { key: "content", label: "Content provenance", kind: "content", status: "reviewable", evidence: "Family learning public content pack keeps source provenance visible." },
        { key: "crm", label: "CRM intake", kind: "crm", status: "locked", evidence: "Family intake and partner interest writes stay blocked until live lead smoke passes." },
      ],
      saveBlockers: ["founding tenant ownership note", "public renderer parity smoke", "lead route smoke", "publish rollback owner"],
      requiredEvidence: ["seeded tenant ownership note", "content provenance review", "public renderer fixture-to-live smoke", "rollback owner acceptance"],
      blockedLiveActions: ["configuration save mutation", "content write", "public publish write", "CRM lead write"],
      nextGate: "Confirm founding tenant ownership and public renderer parity before accepting live configuration.",
      canSaveConfig: false,
      canPublish: false,
      providerWrites: false,
      liveConvexExecution: false,
      convexFunctions: [
        "siteFactory.listClientWebsiteConfigurationReviewPackets",
        "siteFactory.listClientWebsiteConfigurationProfiles",
        "siteBuilder.updateContentBlock",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client configuration review",
      reviewPosture: "provider-light-configuration-review",
      selectedProfileStatus: "blocked_human_gate",
      editableSurfaceCount: 4,
      lockedSurfaceCount: 5,
      saveBlockerCount: 5,
      requiredEvidenceCount: 5,
      surfaces: [
        { key: "brand", label: "Brand system", kind: "brand", status: "reviewable", evidence: "Quiet advisory credibility system is selected but remains local." },
        { key: "navigation", label: "Navigation", kind: "navigation", status: "reviewable", evidence: "Home, services, proof, intake, and privacy paths are ready for review." },
        { key: "content", label: "Starter copy", kind: "content", status: "reviewable", evidence: "Proof-led starter pack can be edited before client handoff." },
        { key: "permissions", label: "Tenant admin scope", kind: "permissions", status: "locked", evidence: "Tenant admin invite stays blocked until owner and hosted read smoke are approved." },
      ],
      saveBlockers: ["plan entitlement approval", "tenant owner approval", "hosted read smoke", "domain posture review", "client admin invite approval"],
      requiredEvidence: ["plan limit review", "tenant owner signoff", "preview URL review", "lead route smoke plan", "domain posture note"],
      blockedLiveActions: ["tenant create mutation", "site create mutation", "configuration save mutation", "client admin invitation", "Stripe billing activation"],
      nextGate: "Approve plan entitlement, tenant owner, domain posture, and hosted read smoke before configuration save.",
      canSaveConfig: false,
      canPublish: false,
      providerWrites: false,
      liveConvexExecution: false,
      convexFunctions: [
        "siteFactory.listClientWebsiteConfigurationReviewPackets",
        "siteFactory.listClientWebsiteConfigurationProfiles",
        "controlPlane.createTenant",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite configuration review",
      reviewPosture: "provider-light-configuration-review",
      selectedProfileStatus: "draft",
      editableSurfaceCount: 4,
      lockedSurfaceCount: 5,
      saveBlockerCount: 5,
      requiredEvidenceCount: 4,
      surfaces: [
        { key: "brand", label: "Offer system", kind: "brand", status: "reviewable", evidence: "Campaign offer proof system is draft-ready for local review." },
        { key: "content", label: "Proof block", kind: "content", status: "reviewable", evidence: "Offer copy, proof block, and signup path can be reviewed without writes." },
        { key: "crm", label: "Lead routing", kind: "crm", status: "locked", evidence: "Public form write stays blocked until lead route and consent review pass." },
        { key: "permissions", label: "Editor scope", kind: "permissions", status: "locked", evidence: "Site editor invite is blocked until campaign consent and site scope are approved." },
      ],
      saveBlockers: ["campaign consent review", "site scope approval", "lead routing review", "provider-send boundary", "AI copy approval"],
      requiredEvidence: ["campaign consent note", "site editor scope review", "lead route smoke plan", "provider-send boundary note"],
      blockedLiveActions: ["site create mutation", "editor invitation", "public form write", "campaign send", "AI copy publish"],
      nextGate: "Approve campaign consent, site scope, lead routing, and provider-send boundary.",
      canSaveConfig: false,
      canPublish: false,
      providerWrites: false,
      liveConvexExecution: false,
      convexFunctions: [
        "siteFactory.listClientWebsiteConfigurationReviewPackets",
        "siteFactory.listClientWebsiteConfigurationProfiles",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "campaigns.requestCampaignApproval",
      ],
    },
  ],
  configurationChangeSets: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family founding change set",
      changeSetStatus: "provider-light-draft-change-set",
      draftChangeCount: 4,
      lockedChangeCount: 2,
      approvalEvidenceCount: 4,
      changeGroups: [
        { key: "brand-trust", label: "Brand trust tone", surface: "brand", status: "draft_review", proposedChange: "Tune color and voice tokens toward family-learning trust while keeping the founding logo unchanged.", impact: "Improves public credibility without changing the live theme." },
        { key: "program-nav", label: "Program navigation", surface: "navigation", status: "draft_review", proposedChange: "Prioritize family programs, volunteer, donate, and contact paths for public review.", impact: "Clarifies the primary visitor path before launch." },
        { key: "origin-copy", label: "Origin story copy", surface: "content", status: "draft_review", proposedChange: "Map existing Julie Family pages into reusable provenance-aware content blocks.", impact: "Keeps source history visible before any content save." },
        { key: "lead-route", label: "Family intake route", surface: "crm", status: "locked_by_gate", proposedChange: "Prepare family intake lead routing but keep public form writes disabled.", impact: "Shows the CRM target without sending leads." },
      ],
      saveBlockers: ["seeded tenant ownership note", "content provenance approval", "public renderer parity smoke", "lead route smoke"],
      approvalEvidence: ["founding tenant note", "source page mapping", "fixture preview screenshot", "rollback owner acceptance"],
      blockedLiveActions: ["configuration save mutation", "content block write", "public publish write", "CRM lead write"],
      nextGate: "Approve tenant ownership, content provenance, and public renderer parity before enabling configuration save.",
      canSaveConfig: false,
      canPublish: false,
      providerWrites: false,
      liveConvexExecution: false,
      convexFunctions: [
        "siteFactory.listClientWebsiteConfigurationChangeSets",
        "siteFactory.listClientWebsiteConfigurationProfiles",
        "siteBuilder.updateContentBlock",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client draft change set",
      changeSetStatus: "provider-light-draft-change-set",
      draftChangeCount: 4,
      lockedChangeCount: 3,
      approvalEvidenceCount: 5,
      changeGroups: [
        { key: "credibility-brand", label: "Credibility brand system", surface: "brand", status: "draft_review", proposedChange: "Apply restrained advisory tokens and proof-led page rhythm for a client-ready review.", impact: "Gives the client a polished direction without writing theme records." },
        { key: "service-nav", label: "Service navigation", surface: "navigation", status: "draft_review", proposedChange: "Queue Home, services, proof, intake, and privacy paths as the selected navigation structure.", impact: "Makes the proposed information architecture inspectable." },
        { key: "proof-copy", label: "Proof-led starter copy", surface: "content", status: "draft_review", proposedChange: "Prepare starter content around outcomes, trust, intake, and advisory proof.", impact: "Moves the site toward handoff while preserving local-only review." },
        { key: "admin-scope", label: "Tenant admin scope", surface: "permissions", status: "locked_by_gate", proposedChange: "Hold client admin permissions at review-only until owner and hosted read smoke are approved.", impact: "Prevents accidental invitation or tenant mutation." },
      ],
      saveBlockers: ["plan entitlement approval", "tenant owner approval", "hosted read smoke", "domain posture review", "client admin invite approval"],
      approvalEvidence: ["plan limit review", "tenant owner signoff", "preview URL review", "domain posture note", "admin permission scope review"],
      blockedLiveActions: ["tenant create mutation", "site create mutation", "configuration save mutation", "client admin invitation", "Stripe billing activation"],
      nextGate: "Approve plan entitlement, tenant owner, hosted read smoke, domain posture, and admin scope before saving configuration.",
      canSaveConfig: false,
      canPublish: false,
      providerWrites: false,
      liveConvexExecution: false,
      convexFunctions: [
        "siteFactory.listClientWebsiteConfigurationChangeSets",
        "siteFactory.listClientWebsiteConfigurationProfiles",
        "controlPlane.createTenant",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite draft change set",
      changeSetStatus: "provider-light-draft-change-set",
      draftChangeCount: 4,
      lockedChangeCount: 3,
      approvalEvidenceCount: 4,
      changeGroups: [
        { key: "offer-brand", label: "Offer visual system", surface: "brand", status: "draft_review", proposedChange: "Queue a focused offer identity for a campaign landing page.", impact: "Creates a reviewable campaign look without provider writes." },
        { key: "proof-block", label: "Proof block", surface: "content", status: "draft_review", proposedChange: "Prepare proof, offer, and signup copy blocks for internal review.", impact: "Shows the campaign story before public publish." },
        { key: "lead-consent", label: "Lead consent path", surface: "crm", status: "locked_by_gate", proposedChange: "Model lead capture routing and consent checkpoints while keeping public form writes disabled.", impact: "Protects lead data until smoke and consent gates pass." },
        { key: "editor-scope", label: "Campaign editor scope", surface: "permissions", status: "locked_by_gate", proposedChange: "Hold campaign editor invitation until site scope and provider-send boundary are approved.", impact: "Prevents editor access before the launch gate is clear." },
      ],
      saveBlockers: ["campaign consent review", "site scope approval", "lead routing review", "provider-send boundary", "AI copy approval"],
      approvalEvidence: ["campaign consent note", "site editor scope review", "lead route smoke plan", "provider-send boundary note"],
      blockedLiveActions: ["site create mutation", "editor invitation", "public form write", "campaign send", "AI copy publish"],
      nextGate: "Approve campaign consent, site scope, lead routing, provider-send boundary, and AI copy review before saving configuration.",
      canSaveConfig: false,
      canPublish: false,
      providerWrites: false,
      liveConvexExecution: false,
      convexFunctions: [
        "siteFactory.listClientWebsiteConfigurationChangeSets",
        "siteFactory.listClientWebsiteConfigurationProfiles",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "campaigns.requestCampaignApproval",
      ],
    },
  ],
  configurationApprovalMatrices: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family founding approval matrix",
      approvalPosture: "provider-light-approval-matrix",
      requiredApprovalCount: 4,
      acceptedApprovalCount: 1,
      blockedApprovalCount: 3,
      approvalRows: [
        { key: "founding-owner", role: "Platform super admin", responsibility: "Confirm Julie Family remains the seeded founding tenant.", status: "ready_for_review", requiredEvidence: "seeded tenant ownership note" },
        { key: "content-provenance", role: "Content reviewer", responsibility: "Approve source mapping from existing Julie Family pages into reusable blocks.", status: "pending_evidence", requiredEvidence: "content provenance review" },
        { key: "public-preview", role: "Launch reviewer", responsibility: "Accept public preview parity before publish can be considered.", status: "blocked_human_gate", requiredEvidence: "public renderer fixture-to-live smoke" },
        { key: "lead-route", role: "CRM reviewer", responsibility: "Approve family intake lead route before CRM writes are enabled.", status: "blocked_human_gate", requiredEvidence: "lead route smoke plan" },
      ],
      saveBlockers: ["content provenance review", "public renderer parity smoke", "lead route smoke", "publish rollback owner"],
      approvalEvidence: ["seeded tenant ownership note", "source page mapping", "fixture preview screenshot", "rollback owner acceptance"],
      blockedLiveActions: ["configuration save mutation", "content block write", "public publish write", "CRM lead write"],
      nextGate: "Capture content provenance, public renderer parity, lead route smoke, and rollback owner acceptance before configuration save.",
      canCaptureApproval: false,
      canSaveConfig: false,
      canPublish: false,
      providerWrites: false,
      liveConvexExecution: false,
      convexFunctions: [
        "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
        "siteFactory.listClientWebsiteConfigurationChangeSets",
        "siteFactory.listClientWebsiteConfigurationProfiles",
        "siteBuilder.updateContentBlock",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client approval matrix",
      approvalPosture: "provider-light-approval-matrix",
      requiredApprovalCount: 5,
      acceptedApprovalCount: 0,
      blockedApprovalCount: 5,
      approvalRows: [
        { key: "plan-owner", role: "Platform super admin", responsibility: "Approve pilot plan limits before tenant creation is enabled.", status: "pending_evidence", requiredEvidence: "plan entitlement approval" },
        { key: "tenant-owner", role: "Client owner", responsibility: "Confirm owner scope and admin authority before invitation.", status: "blocked_human_gate", requiredEvidence: "tenant owner signoff" },
        { key: "hosted-smoke", role: "Technical reviewer", responsibility: "Review hosted read smoke before moving the site off fixtures.", status: "blocked_human_gate", requiredEvidence: "hosted read smoke transcript" },
        { key: "domain-posture", role: "Launch reviewer", responsibility: "Accept pending domain posture before public readiness.", status: "pending_evidence", requiredEvidence: "domain posture note" },
        { key: "admin-scope", role: "Access reviewer", responsibility: "Approve client admin permission preset before invite send.", status: "blocked_human_gate", requiredEvidence: "admin permission scope review" },
      ],
      saveBlockers: ["plan entitlement approval", "tenant owner approval", "hosted read smoke", "domain posture review", "client admin invite approval"],
      approvalEvidence: ["plan limit review", "tenant owner signoff", "preview URL review", "domain posture note", "admin permission scope review"],
      blockedLiveActions: ["tenant create mutation", "site create mutation", "configuration save mutation", "client admin invitation", "Stripe billing activation"],
      nextGate: "Capture plan, owner, hosted smoke, domain, and access approvals before any advisor client configuration save.",
      canCaptureApproval: false,
      canSaveConfig: false,
      canPublish: false,
      providerWrites: false,
      liveConvexExecution: false,
      convexFunctions: [
        "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
        "siteFactory.listClientWebsiteConfigurationChangeSets",
        "siteFactory.listClientWebsiteConfigurationProfiles",
        "controlPlane.createTenant",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite approval matrix",
      approvalPosture: "provider-light-approval-matrix",
      requiredApprovalCount: 5,
      acceptedApprovalCount: 0,
      blockedApprovalCount: 5,
      approvalRows: [
        { key: "campaign-consent", role: "Campaign reviewer", responsibility: "Approve consent posture before public form capture.", status: "blocked_human_gate", requiredEvidence: "campaign consent note" },
        { key: "site-scope", role: "Platform super admin", responsibility: "Confirm microsite scope and campaign owner before site creation.", status: "pending_evidence", requiredEvidence: "site scope approval" },
        { key: "lead-routing", role: "CRM reviewer", responsibility: "Accept lead route and consent handling before writes.", status: "blocked_human_gate", requiredEvidence: "lead route smoke plan" },
        { key: "provider-send", role: "Operations reviewer", responsibility: "Keep campaign sends blocked until provider-send boundary is approved.", status: "blocked_human_gate", requiredEvidence: "provider-send boundary note" },
        { key: "ai-copy", role: "Content reviewer", responsibility: "Approve AI-assisted copy before publish or send.", status: "blocked_human_gate", requiredEvidence: "AI copy approval" },
      ],
      saveBlockers: ["campaign consent review", "site scope approval", "lead routing review", "provider-send boundary", "AI copy approval"],
      approvalEvidence: ["campaign consent note", "site editor scope review", "lead route smoke plan", "provider-send boundary note", "AI copy approval"],
      blockedLiveActions: ["site create mutation", "editor invitation", "public form write", "campaign send", "AI copy publish"],
      nextGate: "Capture consent, site scope, lead routing, provider-send, and AI copy approvals before microsite save.",
      canCaptureApproval: false,
      canSaveConfig: false,
      canPublish: false,
      providerWrites: false,
      liveConvexExecution: false,
      convexFunctions: [
        "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
        "siteFactory.listClientWebsiteConfigurationChangeSets",
        "siteFactory.listClientWebsiteConfigurationProfiles",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "campaigns.requestCampaignApproval",
      ],
    },
  ],
  launchPackets: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family founding launch packet",
      status: "provider-light-export-preview",
      readinessScore: 80,
      previewPath: "/kinflo-sites/julies-family",
      adminInviteStatus: "super-admin-only",
      manifestPath: "docs/convex-client-launch-packet-manifest.json",
      packetSections: [
        "Founding tenant provenance",
        "Reusable public content map",
        "Preview URL and launch evidence",
        "Blocked provider actions",
        "Post-approval smoke checklist",
      ],
      handoffChecklist: [
        "Confirm Julie Family remains the seeded founding tenant.",
        "Review public content provenance before moving fixture content live.",
        "Keep publishing and lead writes blocked until hosted renderer smoke passes.",
      ],
      blockedExportActions: ["write packet file", "send packet email", "publish public site", "write CRM lead"],
      copyBlocks: ["Launch summary", "Evidence checklist", "Blocked action register"],
      convexFunctions: [
        "siteFactory.listClientWebsiteProvisioningOrders",
        "siteFactory.listClientWebsiteLaunchBlueprints",
        "siteFactory.listClientWebsiteAdminPermissionPresets",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client preview handoff packet",
      status: "provider-light-export-preview",
      readinessScore: 40,
      previewPath: "/kinflo-sites/advisor-client-site",
      adminInviteStatus: "tenant-admin-invite-gated",
      manifestPath: "docs/convex-client-launch-packet-manifest.json",
      packetSections: [
        "Client plan and entitlement review",
        "Tenant admin role and invite scope",
        "Preview URL and intake path",
        "Domain and lead smoke requirements",
        "Provider approval blockers",
      ],
      handoffChecklist: [
        "Review Client Build plan limits before tenant creation.",
        "Confirm tenant admin owner before invitation delivery.",
        "Run preview, lead, domain, and hosted Convex read-only smokes before publish.",
      ],
      blockedExportActions: ["write packet file", "send tenant admin invite", "activate Stripe billing", "attach custom domain", "publish public site"],
      copyBlocks: ["Client-facing launch summary", "Admin invitation scope", "Provider gate register"],
      convexFunctions: [
        "controlPlane.listPlanCatalog",
        "controlPlane.entitlementSnapshot",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite launch packet",
      status: "provider-light-export-preview",
      readinessScore: 20,
      previewPath: "/kinflo-sites/campaign-microsite",
      adminInviteStatus: "site-editor-invite-gated",
      manifestPath: "docs/convex-client-launch-packet-manifest.json",
      packetSections: [
        "Campaign objective and consent status",
        "Site editor permission scope",
        "Signup and lead routing review",
        "Campaign approval status",
        "Provider send blockers",
      ],
      handoffChecklist: [
        "Approve campaign consent before provider activation.",
        "Scope editor access to the selected campaign site only.",
        "Keep send, AI copy publish, and public form writes blocked until provider smokes pass.",
      ],
      blockedExportActions: ["write packet file", "send editor invite", "launch campaign send", "publish AI copy", "write public form lead"],
      copyBlocks: ["Campaign launch summary", "Consent checklist", "Provider send blocker register"],
      convexFunctions: [
        "accessPolicy.viewerPermissionSnapshot",
        "campaigns.listCampaignDrafts",
        "campaigns.requestCampaignApproval",
        "crm.submitLead",
        "publicSite.resolvePublishedSite",
      ],
    },
  ],
  starterContentPacks: [
    {
      siteKey: "julies-family-public",
      label: "Family learning public content pack",
      status: "provider-light-read-only-query-contract",
      templateKey: "nonprofit-learning-center",
      persona: "parent, volunteer, donor, and community partner",
      journeyStage: "awareness-to-decision",
      pageCount: 3,
      blockCount: 6,
      pages: [
        {
          pageKey: "home",
          title: "Home",
          route: "/",
          purpose: "Make the learning promise, audience, and enrollment path clear before the first scroll.",
          blockTitles: ["Warm family learning promise", "Program proof"],
        },
        {
          pageKey: "programs",
          title: "Programs",
          route: "/programs",
          purpose: "Organize learning, mentoring, family support, and digital access options into reusable blocks.",
          blockTitles: ["Program pathways", "Family fit intake"],
        },
        {
          pageKey: "volunteer",
          title: "Volunteer",
          route: "/volunteer",
          purpose: "Give volunteers one concrete service path and a safe handoff into follow-up.",
          blockTitles: ["Volunteer roles", "Volunteer interest"],
        },
      ],
      handoffNotes: [
        "Keep original Julie Family source provenance visible before replacing fixture copy.",
        "Confirm family intake routing before publishing public forms.",
        "Review donor and volunteer paths separately so audiences do not compete.",
      ],
      blockedSeedingActions: ["write page records", "write content blocks", "publish content", "write CRM lead"],
      convexFunctions: [
        "siteFactory.listClientWebsiteStarterContentPacks",
        "siteBuilder.createPage",
        "siteBuilder.createContentBlock",
        "siteBuilder.updateContentBlock",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor proof-led content pack",
      status: "provider-light-read-only-query-contract",
      templateKey: "advisor-consultant",
      persona: "service client evaluating fit and proof",
      journeyStage: "consideration-to-decision",
      pageCount: 3,
      blockCount: 6,
      pages: [
        {
          pageKey: "home",
          title: "Home",
          route: "/",
          purpose: "Explain the result, proof, and intake path without a marketing-heavy hero.",
          blockTitles: ["Client result statement", "Proof strip"],
        },
        {
          pageKey: "services",
          title: "Services",
          route: "/services",
          purpose: "Package offers, workshops, audits, and implementation help into clear buying paths.",
          blockTitles: ["Offer stack", "Qualification questions"],
        },
        {
          pageKey: "proof",
          title: "Proof",
          route: "/proof",
          purpose: "Collect case-study, credibility, and process evidence for the launch packet.",
          blockTitles: ["Case study slots", "Process clarity"],
        },
      ],
      handoffNotes: [
        "Proof and process clarity must be reviewed before intake goes live.",
        "Services copy should stay operational and specific, not generic consulting language.",
        "The tenant admin invite remains gated until role scope is approved.",
      ],
      blockedSeedingActions: ["write page records", "write content blocks", "send tenant admin invite", "publish public site"],
      convexFunctions: [
        "siteFactory.listClientWebsiteStarterContentPacks",
        "siteBuilder.createPage",
        "siteBuilder.createContentBlock",
        "siteBuilder.updateContentBlock",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign conversion content pack",
      status: "provider-light-read-only-query-contract",
      templateKey: "campaign-microsite",
      persona: "warm campaign lead from email, SMS, referral, or event traffic",
      journeyStage: "decision",
      pageCount: 3,
      blockCount: 6,
      pages: [
        {
          pageKey: "home",
          title: "Home",
          route: "/",
          purpose: "Keep the campaign promise, proof, and next action in one fast path.",
          blockTitles: ["Single offer hero", "Campaign proof"],
        },
        {
          pageKey: "signup",
          title: "Signup",
          route: "/signup",
          purpose: "Capture the campaign conversion with clear consent and source context.",
          blockTitles: ["Campaign signup", "Privacy expectation"],
        },
        {
          pageKey: "impact",
          title: "Impact",
          route: "/impact",
          purpose: "Show the evidence that justifies the campaign ask.",
          blockTitles: ["Impact metric", "Supporter proof"],
        },
      ],
      handoffNotes: [
        "Campaign copy cannot move to provider send until consent is approved.",
        "Lead routing must be reviewed before public forms write to CRM.",
        "AI copy publish and campaign send remain blocked until provider smokes pass.",
      ],
      blockedSeedingActions: ["write page records", "write content blocks", "write public form lead", "send campaign"],
      convexFunctions: [
        "siteFactory.listClientWebsiteStarterContentPacks",
        "siteBuilder.createPage",
        "siteBuilder.createContentBlock",
        "siteBuilder.updateContentBlock",
        "campaigns.requestCampaignApproval",
      ],
    },
  ],
  onboardingReadiness: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family founding onboarding tracker",
      status: "provider-light-readiness-contract",
      readinessScore: 67,
      completedTasks: 8,
      totalTasks: 12,
      openTasks: 4,
      criticalBlockers: [
        "Hosted Convex read-only smoke not approved",
        "Public lead write smoke not approved",
        "History purge or private-repo residual-risk decision still pending",
      ],
      taskGroups: [
        {
          groupKey: "content-provenance",
          label: "Content provenance",
          ownerRole: "platform.super_admin",
          tasks: [
            { taskKey: "source-map", label: "Map Julie source pages to reusable content blocks", status: "complete", evidence: "starter content pack and launch packet reference founding tenant provenance" },
            { taskKey: "copy-review", label: "Review family, volunteer, donor, and partner copy paths", status: "ready", evidence: "handoff notes separate donor and volunteer intent" },
            { taskKey: "publish-proof", label: "Approve public publish evidence", status: "blocked", evidence: "publish write remains hosted activation gated" },
          ],
        },
        {
          groupKey: "admin-handoff",
          label: "Admin handoff",
          ownerRole: "platform.super_admin",
          tasks: [
            { taskKey: "owner-scope", label: "Confirm founding platform steward scope", status: "complete", evidence: "admin permission preset keeps platform.super_admin owner role" },
            { taskKey: "lead-routing", label: "Confirm family intake and lead routing", status: "blocked", evidence: "crm.submitLead remains live-smoke gated" },
            { taskKey: "preview-link", label: "Keep preview link ready for review", status: "complete", evidence: "/kinflo-sites/julies-family preview path exists in launch packet" },
          ],
        },
      ],
      nextAction: "Approve hosted read-only smoke before moving founding tenant content off fixtures.",
      blockedActivationActions: ["publish public site", "write CRM lead", "switch adapter", "send external launch packet"],
      convexFunctions: [
        "siteFactory.listClientWebsiteOnboardingReadiness",
        "siteFactory.listClientWebsiteStarterContentPacks",
        "launchReadiness.getSiteLaunchReadiness",
        "publicSite.resolvePublishedSite",
        "crm.submitLead",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client onboarding tracker",
      status: "provider-light-readiness-contract",
      readinessScore: 58,
      completedTasks: 7,
      totalTasks: 12,
      openTasks: 5,
      criticalBlockers: [
        "Tenant creation mutation not approved",
        "Tenant admin invitation delivery not approved",
        "Domain and lead capture smokes not approved",
      ],
      taskGroups: [
        {
          groupKey: "tenant-setup",
          label: "Tenant setup",
          ownerRole: "platform.super_admin",
          tasks: [
            { taskKey: "plan-review", label: "Select Client Build plan and entitlement limits", status: "complete", evidence: "provisioning order requests client-build plan" },
            { taskKey: "tenant-create", label: "Create advisor tenant", status: "blocked", evidence: "controlPlane.createTenant remains provider-light gated" },
            { taskKey: "admin-invite", label: "Prepare tenant admin invite", status: "ready", evidence: "admin permission preset selects tenant.admin invite role" },
          ],
        },
        {
          groupKey: "site-launch",
          label: "Site launch",
          ownerRole: "tenant.admin",
          tasks: [
            { taskKey: "starter-copy", label: "Review proof-led starter pages", status: "ready", evidence: "starter pack includes home, services, and proof pages" },
            { taskKey: "lead-smoke", label: "Run intake lead smoke", status: "blocked", evidence: "crm.submitLead remains live-smoke gated" },
            { taskKey: "packet-review", label: "Review launch packet with owner", status: "ready", evidence: "launch packet export preview is assembled but export remains gated" },
          ],
        },
      ],
      nextAction: "Approve tenant creation and admin invite smoke order before client handoff.",
      blockedActivationActions: ["create tenant", "send tenant admin invite", "attach custom domain", "publish public site"],
      convexFunctions: [
        "siteFactory.listClientWebsiteOnboardingReadiness",
        "controlPlane.createTenant",
        "controlPlane.createInvitation",
        "siteFactory.createSiteFromTemplate",
        "launchReadiness.getSiteLaunchReadiness",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite onboarding tracker",
      status: "provider-light-readiness-contract",
      readinessScore: 42,
      completedTasks: 5,
      totalTasks: 12,
      openTasks: 7,
      criticalBlockers: [
        "Campaign consent review not approved",
        "Provider send and SMS/email smokes not approved",
        "Public form lead write not approved",
      ],
      taskGroups: [
        {
          groupKey: "campaign-consent",
          label: "Campaign consent",
          ownerRole: "platform.super_admin",
          tasks: [
            { taskKey: "goal-review", label: "Confirm campaign objective and audience", status: "complete", evidence: "campaign launch packet includes objective and consent section" },
            { taskKey: "consent-review", label: "Approve consent language and unsubscribe expectations", status: "blocked", evidence: "provider send remains gated" },
            { taskKey: "source-review", label: "Confirm conversion source tracking", status: "ready", evidence: "starter signup page includes privacy expectation block" },
          ],
        },
        {
          groupKey: "conversion-path",
          label: "Conversion path",
          ownerRole: "site.editor",
          tasks: [
            { taskKey: "copy-review", label: "Review focused offer and impact copy", status: "ready", evidence: "starter pack includes home, signup, and impact pages" },
            { taskKey: "lead-routing", label: "Smoke public form lead routing", status: "blocked", evidence: "crm.submitLead remains live-smoke gated" },
            { taskKey: "campaign-approval", label: "Request campaign approval", status: "blocked", evidence: "campaigns.requestCampaignApproval remains provider-light gated" },
          ],
        },
      ],
      nextAction: "Approve consent and provider-send review before live campaign launch.",
      blockedActivationActions: ["send campaign", "write public form lead", "publish AI copy", "send SMS/email"],
      convexFunctions: [
        "siteFactory.listClientWebsiteOnboardingReadiness",
        "campaigns.requestCampaignApproval",
        "crm.submitLead",
        "publicSite.resolvePublishedSite",
        "launchReadiness.getSiteLaunchReadiness",
      ],
    },
  ],
  launchSimulations: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family founding launch simulation",
      status: "provider-light-launch-simulation",
      targetMinutes: 15,
      estimatedMinutes: 12,
      withinTarget: true,
      previewPath: "/kinflo-sites/julies-family",
      previewLinkReady: true,
      adminInviteReady: true,
      adminInvitePosture: "platform-steward-handoff-prepared",
      launchOutcome: "Founding tenant can be reviewed from a preview link with platform steward scope prepared, but live publish and lead writes stay gated.",
      timeline: [
        { stepKey: "select-template", label: "Select nonprofit learning center template", estimatedMinutes: 1, status: "ready", evidence: "starter template and launch blueprint are already mapped" },
        { stepKey: "review-content-pack", label: "Review starter content pack", estimatedMinutes: 3, status: "ready", evidence: "family, programs, and volunteer pages are assembled" },
        { stepKey: "confirm-brand", label: "Confirm brand and preview posture", estimatedMinutes: 2, status: "review", evidence: "public preview path is available for visual review" },
        { stepKey: "prepare-invite", label: "Prepare platform steward handoff", estimatedMinutes: 2, status: "ready", evidence: "admin permission preset keeps platform steward scope explicit" },
        { stepKey: "review-blockers", label: "Review hosted and repository blockers", estimatedMinutes: 4, status: "blocked", evidence: "hosted Convex smoke and repository sharing decision remain gated" },
      ],
      handoffArtifacts: ["preview link", "starter content pack", "launch packet", "onboarding readiness tracker"],
      blockedLiveActions: ["publish public site", "write CRM lead", "switch adapter", "send external launch packet"],
      convexFunctions: [
        "siteFactory.listClientWebsiteLaunchSimulations",
        "siteFactory.listClientWebsiteOnboardingReadiness",
        "siteFactory.listClientWebsiteStarterContentPacks",
        "publicSite.resolvePublishedSite",
        "controlPlane.createInvitation",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client 15-minute launch simulation",
      status: "provider-light-launch-simulation",
      targetMinutes: 15,
      estimatedMinutes: 14,
      withinTarget: true,
      previewPath: "/kinflo-sites/advisor-client-site",
      previewLinkReady: true,
      adminInviteReady: true,
      adminInvitePosture: "tenant-admin-invite-prepared-not-sent",
      launchOutcome: "Advisor client site can reach preview-and-handoff review inside the target window after tenant creation and invite delivery are approved.",
      timeline: [
        { stepKey: "select-plan-template", label: "Select Client Build plan and advisor template", estimatedMinutes: 2, status: "ready", evidence: "provisioning order selects client-build and advisor-consultant" },
        { stepKey: "assemble-pages", label: "Assemble proof-led starter pages", estimatedMinutes: 3, status: "ready", evidence: "home, services, and proof pages are prepared" },
        { stepKey: "prepare-preview", label: "Prepare preview link", estimatedMinutes: 2, status: "ready", evidence: "public preview path is available" },
        { stepKey: "prepare-admin-invite", label: "Prepare tenant admin invite", estimatedMinutes: 3, status: "review", evidence: "tenant.admin invite role is selected but not sent" },
        { stepKey: "review-launch-blockers", label: "Review domain, lead, and hosted activation blockers", estimatedMinutes: 4, status: "blocked", evidence: "domain and lead capture smokes remain gated" },
      ],
      handoffArtifacts: ["preview link", "tenant admin invite draft", "launch packet", "onboarding readiness tracker"],
      blockedLiveActions: ["create tenant", "send tenant admin invite", "attach custom domain", "publish public site"],
      convexFunctions: [
        "siteFactory.listClientWebsiteLaunchSimulations",
        "controlPlane.createTenant",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite 15-minute launch simulation",
      status: "provider-light-launch-simulation",
      targetMinutes: 15,
      estimatedMinutes: 11,
      withinTarget: true,
      previewPath: "/kinflo-sites/campaign-microsite",
      previewLinkReady: true,
      adminInviteReady: true,
      adminInvitePosture: "site-editor-invite-prepared-not-sent",
      launchOutcome: "Campaign microsite can reach a preview and editor handoff quickly, but consent, lead writes, and provider sends remain blocked.",
      timeline: [
        { stepKey: "select-campaign-template", label: "Select campaign microsite template", estimatedMinutes: 1, status: "ready", evidence: "campaign-microsite starter template is available" },
        { stepKey: "assemble-campaign-pages", label: "Assemble campaign, signup, and impact pages", estimatedMinutes: 3, status: "ready", evidence: "starter content pack includes home, signup, and impact" },
        { stepKey: "prepare-preview", label: "Prepare preview link", estimatedMinutes: 2, status: "ready", evidence: "public preview path is available" },
        { stepKey: "prepare-editor-invite", label: "Prepare site editor invite", estimatedMinutes: 2, status: "review", evidence: "site.editor invite posture is selected but not sent" },
        { stepKey: "review-consent", label: "Review consent and provider blockers", estimatedMinutes: 3, status: "blocked", evidence: "campaign consent and provider sends remain gated" },
      ],
      handoffArtifacts: ["preview link", "site editor invite draft", "campaign launch packet", "consent blocker register"],
      blockedLiveActions: ["send campaign", "write public form lead", "publish AI copy", "send SMS/email"],
      convexFunctions: [
        "siteFactory.listClientWebsiteLaunchSimulations",
        "siteFactory.listClientWebsiteStarterContentPacks",
        "controlPlane.createInvitation",
        "campaigns.requestCampaignApproval",
        "publicSite.resolvePublishedSite",
      ],
    },
  ],
  polishScorecards: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family Apple-grade polish scorecard",
      status: "provider-light-polish-review",
      overallScore: 82,
      mobileScore: 84,
      proofScore: 80,
      accessibilityScore: 78,
      designStandard: "Clear first-viewport family promise, compact proof, calm public navigation, and no provider writes before hosted activation.",
      criteria: [
        {
          key: "first-viewport-signal",
          label: "First-viewport signal",
          score: 86,
          status: "pass",
          evidence: "Preview workbench shows the family learning promise, audience, and enrollment path before publish.",
          nextAction: "Replace fixture imagery with approved documentary program photography after source review.",
        },
        {
          key: "mobile-fit",
          label: "Mobile fit",
          score: 84,
          status: "pass",
          evidence: "Site Studio marks mobile public preview ready and keeps CTA text constrained.",
          nextAction: "Run hosted 390px screenshot QA after generated API review.",
        },
        {
          key: "proof-before-ask",
          label: "Proof before ask",
          score: 80,
          status: "review",
          evidence: "Launch packet and starter pack separate family, volunteer, donor, and partner proof paths.",
          nextAction: "Confirm final founder story and outcome proof before publish.",
        },
        {
          key: "accessibility-baseline",
          label: "Accessibility baseline",
          score: 78,
          status: "review",
          evidence: "Design system uses compact cards, visible focusable actions, and readable contrast tokens.",
          nextAction: "Run automated contrast and keyboard QA on the hosted public renderer.",
        },
      ],
      viewportChecks: [
        { viewport: "desktop", label: "Desktop public preview", status: "pass", evidence: "Hero, proof, and CTA are visible without competing navigation." },
        { viewport: "tablet", label: "Tablet public preview", status: "review", evidence: "Portal handoff still needs hosted renderer proof." },
        { viewport: "mobile", label: "390px public preview", status: "pass", evidence: "Mobile readiness is marked ready in the Site Studio fixture." },
      ],
      blockedPolishActions: ["publish public site", "replace fixture assets with provider storage", "write CRM lead", "switch adapter"],
      convexFunctions: [
        "siteFactory.listClientWebsitePolishScorecards",
        "siteFactory.listClientWebsiteLaunchSimulations",
        "siteFactory.listClientWebsiteOnboardingReadiness",
        "publicSite.resolvePublishedSite",
        "launchReadiness.getSiteLaunchReadiness",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client Apple-grade polish scorecard",
      status: "provider-light-polish-review",
      overallScore: 85,
      mobileScore: 86,
      proofScore: 84,
      accessibilityScore: 82,
      designStandard: "Quiet advisory surface, proof before intake, tight offer hierarchy, and tenant-admin handoff blocked until approval.",
      criteria: [
        {
          key: "offer-hierarchy",
          label: "Offer hierarchy",
          score: 88,
          status: "pass",
          evidence: "Starter content pack organizes home, services, and proof pages around a clear client result.",
          nextAction: "Review final service packaging with the tenant owner before domain attachment.",
        },
        {
          key: "mobile-fit",
          label: "Mobile fit",
          score: 86,
          status: "pass",
          evidence: "Mobile readiness is marked ready and the preview rail keeps the intake path visible.",
          nextAction: "Run live 390px smoke after tenant creation approval.",
        },
        {
          key: "proof-before-intake",
          label: "Proof before intake",
          score: 84,
          status: "pass",
          evidence: "Launch packet requires proof, fit, and process clarity before consultation asks.",
          nextAction: "Attach approved case-study proof when client content is available.",
        },
        {
          key: "permission-clarity",
          label: "Permission clarity",
          score: 82,
          status: "review",
          evidence: "Tenant admin invite posture is prepared but not sent.",
          nextAction: "Approve tenant admin owner and invitation delivery smoke order.",
        },
      ],
      viewportChecks: [
        { viewport: "desktop", label: "Desktop work surface", status: "pass", evidence: "Preview workbench keeps result, proof, CTA, and launch state together." },
        { viewport: "tablet", label: "Tablet offer scan", status: "pass", evidence: "Offer and proof summaries remain scannable in the launch rail." },
        { viewport: "mobile", label: "390px intake path", status: "review", evidence: "Hosted lead smoke remains gated before intake can become live." },
      ],
      blockedPolishActions: ["create tenant", "send tenant admin invite", "attach custom domain", "publish public site"],
      convexFunctions: [
        "siteFactory.listClientWebsitePolishScorecards",
        "siteFactory.listClientWebsiteLaunchSimulations",
        "controlPlane.createTenant",
        "controlPlane.createInvitation",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite Apple-grade polish scorecard",
      status: "provider-light-polish-review",
      overallScore: 76,
      mobileScore: 72,
      proofScore: 78,
      accessibilityScore: 77,
      designStandard: "Single offer, one proof path, consent clarity, and campaign-send blockers visible before any provider activation.",
      criteria: [
        {
          key: "single-offer-focus",
          label: "Single offer focus",
          score: 82,
          status: "pass",
          evidence: "Starter pack keeps campaign, signup, and impact pages focused on one conversion path.",
          nextAction: "Confirm final campaign objective before editor handoff.",
        },
        {
          key: "mobile-fit",
          label: "Mobile fit",
          score: 72,
          status: "review",
          evidence: "Site Studio still marks campaign mobile and hero readiness as needing review.",
          nextAction: "Tighten first-viewport copy and retest at 390px before send approval.",
        },
        {
          key: "consent-clarity",
          label: "Consent clarity",
          score: 74,
          status: "blocked",
          evidence: "Campaign consent review and provider-send checks remain blocked.",
          nextAction: "Approve consent language, unsubscribe expectations, and source tracking.",
        },
        {
          key: "proof-before-signup",
          label: "Proof before signup",
          score: 78,
          status: "review",
          evidence: "Impact page is prepared but final proof asset is not approved.",
          nextAction: "Attach approved impact proof before campaign traffic is sent.",
        },
      ],
      viewportChecks: [
        { viewport: "desktop", label: "Desktop campaign path", status: "pass", evidence: "Offer, proof, and signup are represented in the starter content pack." },
        { viewport: "tablet", label: "Tablet conversion scan", status: "review", evidence: "Consent and proof placement need one more visual pass." },
        { viewport: "mobile", label: "390px campaign path", status: "review", evidence: "Mobile readiness remains needs_review in the Site Studio fixture." },
      ],
      blockedPolishActions: ["send campaign", "write public form lead", "publish AI copy", "send SMS/email"],
      convexFunctions: [
        "siteFactory.listClientWebsitePolishScorecards",
        "siteFactory.listClientWebsiteLaunchSimulations",
        "siteFactory.listClientWebsiteStarterContentPacks",
        "campaigns.requestCampaignApproval",
        "publicSite.resolvePublishedSite",
      ],
    },
  ],
  visualQaBudgets: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family visual QA budget",
      status: "provider-light-visual-qa-budget",
      qaTarget: "Public demo should pass desktop and 390px mobile screenshot review before hosted publish is considered.",
      screenshotPlan: [
        { viewport: "desktop", route: "/kinflo-sites/julies-family", status: "pass", requiredEvidence: "Hero promise, proof, CTA, and navigation are visible without overlap." },
        { viewport: "tablet", route: "/kinflo-sites/julies-family?device=tablet", status: "review", requiredEvidence: "Portal handoff still needs hosted renderer screenshot evidence." },
        { viewport: "mobile", route: "/kinflo-sites/julies-family?device=mobile", status: "pass", requiredEvidence: "390px review keeps CTA, proof, and family learning promise readable." },
      ],
      accessibilityChecks: [
        { key: "landmarks", label: "Landmarks and headings", status: "pass", evidence: "Preview shell keeps one clear hero heading and navigable page sections.", nextAction: "Confirm landmarks in hosted public renderer." },
        { key: "contrast", label: "Contrast and readable controls", status: "review", evidence: "Fixture tokens are readable but automated contrast has not run against hosted output.", nextAction: "Run contrast audit after generated API review." },
        { key: "keyboard", label: "Keyboard path", status: "review", evidence: "Primary actions are native buttons/links but focus order needs hosted smoke.", nextAction: "Run keyboard smoke on preview link and intake form." },
      ],
      performanceBudgets: [
        { metric: "lcp", label: "Largest contentful paint", budget: "<= 2.5s on hosted preview", currentEstimate: "review pending", status: "review", evidence: "No hosted performance trace has been approved." },
        { metric: "image", label: "Hero image weight", budget: "<= 450KB optimized first viewport", currentEstimate: "asset provider pending", status: "review", evidence: "Fixture imagery has not moved through Cloudinary/R2 optimization." },
        { metric: "interaction", label: "CTA interaction", budget: "<= 200ms local response before provider writes", currentEstimate: "fixture-only", status: "pass", evidence: "Preview link and gated CTA render from local fixture state." },
      ],
      regressionTargets: ["first-viewport hero", "program proof strip", "family intake CTA"],
      blockedQaActions: ["hosted screenshot capture", "automated accessibility audit", "Lighthouse run", "publish public site"],
      convexFunctions: [
        "siteFactory.listClientWebsiteVisualQaBudgets",
        "siteFactory.listClientWebsitePolishScorecards",
        "publicSite.resolvePublishedSite",
        "launchReadiness.getSiteLaunchReadiness",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client visual QA budget",
      status: "provider-light-visual-qa-budget",
      qaTarget: "Advisor site should preserve proof-before-intake hierarchy across desktop, tablet, and mobile before tenant handoff.",
      screenshotPlan: [
        { viewport: "desktop", route: "/kinflo-sites/advisor-client-site", status: "pass", requiredEvidence: "Offer, proof, intake CTA, and launch state remain visible without decorative clutter." },
        { viewport: "tablet", route: "/kinflo-sites/advisor-client-site?device=tablet", status: "pass", requiredEvidence: "Offer scan and proof summary stay readable in the mid-size layout." },
        { viewport: "mobile", route: "/kinflo-sites/advisor-client-site?device=mobile", status: "review", requiredEvidence: "390px intake path needs hosted lead smoke evidence before handoff." },
      ],
      accessibilityChecks: [
        { key: "heading-order", label: "Heading order", status: "pass", evidence: "The preview workbench keeps a single result statement before support sections.", nextAction: "Confirm semantic heading order after public renderer swap." },
        { key: "form-labels", label: "Intake labels", status: "review", evidence: "Intake path remains fixture gated and needs hosted form label smoke.", nextAction: "Run form label and error-state smoke before client handoff." },
        { key: "focus-visible", label: "Focus visibility", status: "review", evidence: "Controls use shared button primitives but hosted focus audit is pending.", nextAction: "Run keyboard focus pass on preview and portal links." },
      ],
      performanceBudgets: [
        { metric: "lcp", label: "Largest contentful paint", budget: "<= 2.5s on hosted preview", currentEstimate: "review pending", status: "review", evidence: "Hosted performance trace not approved." },
        { metric: "js", label: "Public page JavaScript", budget: "<= 180KB route JS after code split", currentEstimate: "Vite bundle still app-wide", status: "review", evidence: "Next.js or route splitting decision remains open." },
        { metric: "interaction", label: "Preview open action", budget: "<= 200ms local response", currentEstimate: "fixture-only", status: "pass", evidence: "Open preview and gated publish controls respond from local shell state." },
      ],
      regressionTargets: ["offer hierarchy", "proof strip", "intake CTA"],
      blockedQaActions: ["tenant handoff screenshot capture", "hosted intake accessibility smoke", "route-level performance trace", "send tenant admin invite"],
      convexFunctions: [
        "siteFactory.listClientWebsiteVisualQaBudgets",
        "siteFactory.listClientWebsitePolishScorecards",
        "controlPlane.createTenant",
        "controlPlane.createInvitation",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite visual QA budget",
      status: "provider-light-visual-qa-budget",
      qaTarget: "Campaign microsite needs mobile-first visual QA, consent accessibility, and performance review before campaign traffic is sent.",
      screenshotPlan: [
        { viewport: "desktop", route: "/kinflo-sites/campaign-microsite", status: "pass", requiredEvidence: "Single offer, proof, and signup path stay focused." },
        { viewport: "tablet", route: "/kinflo-sites/campaign-microsite?device=tablet", status: "review", requiredEvidence: "Consent and proof placement need screenshot comparison." },
        { viewport: "mobile", route: "/kinflo-sites/campaign-microsite?device=mobile", status: "review", requiredEvidence: "390px first viewport still needs copy tightening and retest." },
      ],
      accessibilityChecks: [
        { key: "consent-copy", label: "Consent copy visibility", status: "blocked", evidence: "Consent language and unsubscribe expectations remain approval gated.", nextAction: "Approve consent language before provider-send smoke." },
        { key: "signup-labels", label: "Signup labels", status: "review", evidence: "Public form lead write is still gated.", nextAction: "Run form label and error-state smoke after lead route approval." },
        { key: "reduced-motion", label: "Reduced motion posture", status: "pass", evidence: "Current fixture does not require motion to understand the offer path.", nextAction: "Keep any future campaign animation optional and non-blocking." },
      ],
      performanceBudgets: [
        { metric: "lcp", label: "Largest contentful paint", budget: "<= 2.0s on campaign preview", currentEstimate: "review pending", status: "review", evidence: "Campaign route has no hosted trace yet." },
        { metric: "image", label: "Proof asset weight", budget: "<= 300KB optimized proof asset", currentEstimate: "asset pending", status: "review", evidence: "Final campaign proof asset is not approved." },
        { metric: "interaction", label: "Signup interaction", budget: "<= 200ms before provider write", currentEstimate: "blocked by lead smoke", status: "blocked", evidence: "Public form lead write remains gated." },
      ],
      regressionTargets: ["single offer hero", "consent block", "signup CTA"],
      blockedQaActions: ["campaign send", "public form lead write", "provider-send performance trace", "mobile screenshot approval"],
      convexFunctions: [
        "siteFactory.listClientWebsiteVisualQaBudgets",
        "siteFactory.listClientWebsitePolishScorecards",
        "campaigns.requestCampaignApproval",
        "crm.submitLead",
        "publicSite.resolvePublishedSite",
      ],
    },
  ],
  visualQaEvidencePackets: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family visual QA evidence packet",
      status: "provider-light-qa-evidence-packet",
      evidencePosture: "Local fixture evidence is organized, but hosted screenshots, accessibility crawl, and performance trace remain pending.",
      evidenceItems: [
        {
          key: "desktop-screenshot",
          label: "Desktop screenshot proof",
          kind: "screenshot",
          status: "accepted",
          requiredArtifact: "Hosted desktop screenshot with hero, proof, CTA, and navigation visible.",
          currentEvidence: "Local Site Studio and public preview smoke show the founding Julie Family path without overlap.",
          owner: "platform",
        },
        {
          key: "mobile-screenshot",
          label: "390px screenshot proof",
          kind: "screenshot",
          status: "accepted",
          requiredArtifact: "390px hosted screenshot with CTA and family learning promise readable.",
          currentEvidence: "Local mobile smoke is clean; hosted screenshot capture is not approved.",
          owner: "platform",
        },
        {
          key: "accessibility-crawl",
          label: "Accessibility crawl artifact",
          kind: "accessibility",
          status: "pending",
          requiredArtifact: "Automated contrast, landmarks, and keyboard result packet.",
          currentEvidence: "Manual fixture posture only; no crawler has run.",
          owner: "provider",
        },
        {
          key: "performance-trace",
          label: "Performance trace artifact",
          kind: "performance",
          status: "pending",
          requiredArtifact: "Hosted Lighthouse or equivalent trace with LCP and image budget evidence.",
          currentEvidence: "No hosted performance trace has been approved.",
          owner: "provider",
        },
      ],
      approvalChecklist: [
        { key: "founder-story", label: "Founder story and proof reviewed", status: "review", decisionGate: "Confirm final Julie Family story and proof copy before public publish." },
        { key: "accessibility-review", label: "Accessibility evidence accepted", status: "blocked", decisionGate: "Run hosted accessibility crawl after generated API review." },
        { key: "publish-approval", label: "Public publish approval", status: "blocked", decisionGate: "Approve hosted renderer, domain, storage, and rollback owner." },
      ],
      openRisks: ["hosted renderer not activated", "program imagery source review pending", "public publish rollback owner not assigned"],
      blockedEvidenceActions: ["capture hosted screenshot", "run accessibility crawler", "run Lighthouse trace", "publish public site"],
      convexFunctions: [
        "siteFactory.listClientWebsiteVisualQaEvidencePackets",
        "siteFactory.listClientWebsiteVisualQaBudgets",
        "siteFactory.listClientWebsitePolishScorecards",
        "publicSite.resolvePublishedSite",
        "launchReadiness.getSiteLaunchReadiness",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client visual QA evidence packet",
      status: "provider-light-qa-evidence-packet",
      evidencePosture: "Tenant handoff proof is organized around offer, proof, intake, and permission evidence before any client admin invite is sent.",
      evidenceItems: [
        {
          key: "desktop-offer-proof",
          label: "Desktop offer and proof screenshot",
          kind: "screenshot",
          status: "accepted",
          requiredArtifact: "Hosted desktop screenshot proving offer, proof, and intake hierarchy.",
          currentEvidence: "Local workbench shows proof-before-intake structure.",
          owner: "platform",
        },
        {
          key: "mobile-intake-proof",
          label: "390px intake screenshot",
          kind: "screenshot",
          status: "pending",
          requiredArtifact: "390px screenshot proving intake path and CTA remain visible.",
          currentEvidence: "Mobile readiness is marked ready, but hosted lead smoke is gated.",
          owner: "platform",
        },
        {
          key: "intake-accessibility",
          label: "Intake accessibility artifact",
          kind: "accessibility",
          status: "pending",
          requiredArtifact: "Form labels, focus order, and error-state accessibility result.",
          currentEvidence: "Fixture form path is not connected to hosted lead writes.",
          owner: "provider",
        },
        {
          key: "route-performance",
          label: "Route performance trace",
          kind: "performance",
          status: "pending",
          requiredArtifact: "Hosted route trace showing JS, LCP, and interaction budget.",
          currentEvidence: "Vite bundle remains app-wide until public rendering strategy is approved.",
          owner: "provider",
        },
      ],
      approvalChecklist: [
        { key: "tenant-owner", label: "Tenant owner confirmed", status: "review", decisionGate: "Confirm client owner and invite recipient before membership writes." },
        { key: "intake-smoke", label: "Intake smoke accepted", status: "blocked", decisionGate: "Approve public lead route, smoke data cleanup, and rollback owner." },
        { key: "handoff-approval", label: "Client handoff approval", status: "blocked", decisionGate: "Approve tenant creation, admin invite, domain, and preview evidence." },
      ],
      openRisks: ["tenant owner not approved", "lead route smoke not run", "route-level bundle budget not verified"],
      blockedEvidenceActions: ["create tenant", "send tenant admin invite", "run hosted intake accessibility smoke", "attach custom domain"],
      convexFunctions: [
        "siteFactory.listClientWebsiteVisualQaEvidencePackets",
        "siteFactory.listClientWebsiteVisualQaBudgets",
        "controlPlane.createTenant",
        "controlPlane.createInvitation",
        "crm.submitLead",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite visual QA evidence packet",
      status: "provider-light-qa-evidence-packet",
      evidencePosture: "Campaign proof is blocked on consent, lead-write, and provider-send evidence before any traffic or campaign delivery is allowed.",
      evidenceItems: [
        {
          key: "desktop-campaign-proof",
          label: "Desktop campaign screenshot",
          kind: "screenshot",
          status: "accepted",
          requiredArtifact: "Hosted desktop screenshot with single offer, proof, and signup path.",
          currentEvidence: "Local starter pack keeps campaign path focused.",
          owner: "platform",
        },
        {
          key: "mobile-campaign-proof",
          label: "390px campaign screenshot",
          kind: "screenshot",
          status: "pending",
          requiredArtifact: "390px screenshot after first-viewport copy tightening.",
          currentEvidence: "Mobile copy remains review-gated.",
          owner: "platform",
        },
        {
          key: "consent-accessibility",
          label: "Consent accessibility artifact",
          kind: "accessibility",
          status: "blocked",
          requiredArtifact: "Consent visibility, unsubscribe expectation, and signup label audit.",
          currentEvidence: "Consent language is not approved.",
          owner: "client",
        },
        {
          key: "signup-performance",
          label: "Signup performance trace",
          kind: "performance",
          status: "blocked",
          requiredArtifact: "Hosted signup interaction trace before provider write.",
          currentEvidence: "Public form lead write and provider sends remain gated.",
          owner: "provider",
        },
      ],
      approvalChecklist: [
        { key: "campaign-objective", label: "Campaign objective accepted", status: "review", decisionGate: "Confirm one campaign objective and proof asset." },
        { key: "consent-approval", label: "Consent language accepted", status: "blocked", decisionGate: "Approve consent copy, unsubscribe expectations, and source tracking." },
        { key: "send-approval", label: "Provider send approval", status: "blocked", decisionGate: "Approve lead smoke, campaign approval state, provider-send trace, and rollback owner." },
      ],
      openRisks: ["consent language blocked", "public lead smoke blocked", "mobile copy still needs retest"],
      blockedEvidenceActions: ["send campaign", "write public form lead", "run provider-send trace", "approve mobile screenshot"],
      convexFunctions: [
        "siteFactory.listClientWebsiteVisualQaEvidencePackets",
        "siteFactory.listClientWebsiteVisualQaBudgets",
        "campaigns.requestCampaignApproval",
        "crm.submitLead",
        "publicSite.resolvePublishedSite",
      ],
    },
  ],
  launchDecisionPackets: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family launch decision packet",
      status: "provider-light-launch-decision",
      launchDecision: "review",
      decisionPosture: "Local public preview and mobile evidence are organized, but hosted accessibility, performance, domain, and rollback gates must be accepted before publish.",
      approvalOwner: "platform.super_admin",
      decisionCriteria: [
        {
          key: "local-preview-proof",
          label: "Local preview proof",
          status: "ready",
          evidence: "Site Studio and public preview smokes show the family learning promise, proof, and CTA without overlap.",
          decisionGate: "Keep local proof as supporting evidence only until hosted renderer proof is captured.",
        },
        {
          key: "visual-evidence-packet",
          label: "Visual evidence packet reviewed",
          status: "review",
          evidence: "Evidence packet has two accepted local artifacts and two pending hosted artifacts.",
          decisionGate: "Review final screenshot, accessibility, and performance artifacts before accepting the public launch.",
        },
        {
          key: "hosted-accessibility",
          label: "Hosted accessibility accepted",
          status: "blocked",
          evidence: "No hosted accessibility crawler or keyboard smoke has run.",
          decisionGate: "Run hosted accessibility crawl after generated API review.",
        },
        {
          key: "publish-rollback",
          label: "Publish and rollback owner accepted",
          status: "blocked",
          evidence: "Public publish, domain, storage, and rollback owner remain gated.",
          decisionGate: "Assign rollback owner and approve publish order before any public launch.",
        },
      ],
      rollbackPlan: {
        owner: "platform.super_admin",
        status: "blocked",
        steps: ["keep fixture renderer active", "restore previous published route", "pause public lead intake"],
      },
      requiredSignoffs: ["founder story and proof", "hosted visual QA evidence", "publish rollback owner"],
      blockedLaunchActions: ["publish public site", "attach production domain", "enable public lead write", "accept hosted QA evidence"],
      convexFunctions: [
        "siteFactory.listClientWebsiteLaunchDecisionPackets",
        "siteFactory.listClientWebsiteVisualQaEvidencePackets",
        "siteFactory.listClientWebsiteVisualQaBudgets",
        "publicSite.resolvePublishedSite",
        "siteBuilder.publishPage",
        "launchReadiness.getSiteLaunchReadiness",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client launch decision packet",
      status: "provider-light-launch-decision",
      launchDecision: "review",
      decisionPosture: "Advisor site can move toward client handoff only after tenant owner, intake smoke, client admin invite, and custom-domain evidence are approved.",
      approvalOwner: "platform.super_admin",
      decisionCriteria: [
        {
          key: "offer-proof",
          label: "Offer and proof hierarchy",
          status: "ready",
          evidence: "Local workbench preserves proof-before-intake structure.",
          decisionGate: "Keep local proof as supporting evidence until hosted preview proof is captured.",
        },
        {
          key: "tenant-owner",
          label: "Tenant owner confirmed",
          status: "review",
          evidence: "Client owner and invite recipient are still review-gated.",
          decisionGate: "Confirm owner, invite recipient, and handoff scope before membership writes.",
        },
        {
          key: "lead-smoke",
          label: "Hosted lead smoke accepted",
          status: "blocked",
          evidence: "Public lead route and smoke cleanup are not approved.",
          decisionGate: "Approve public lead route, smoke data cleanup, and rollback owner.",
        },
        {
          key: "client-invite",
          label: "Client admin invitation approved",
          status: "blocked",
          evidence: "Tenant creation and admin invite remain disabled.",
          decisionGate: "Approve tenant creation, admin invite, and domain attachment order.",
        },
      ],
      rollbackPlan: {
        owner: "platform.super_admin",
        status: "blocked",
        steps: ["disable preview handoff", "revoke unsent invite posture", "return site to fixture-only state"],
      },
      requiredSignoffs: ["tenant owner", "hosted intake smoke", "client handoff approval"],
      blockedLaunchActions: ["create tenant", "send tenant admin invite", "attach custom domain", "enable public intake writes"],
      convexFunctions: [
        "siteFactory.listClientWebsiteLaunchDecisionPackets",
        "siteFactory.listClientWebsiteVisualQaEvidencePackets",
        "controlPlane.createTenant",
        "controlPlane.createInvitation",
        "crm.submitLead",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite launch decision packet",
      status: "provider-light-launch-decision",
      launchDecision: "no_go",
      decisionPosture: "Campaign launch is explicitly no-go until consent language, mobile screenshot, lead-write smoke, provider-send trace, and rollback owner are accepted.",
      approvalOwner: "platform.super_admin",
      decisionCriteria: [
        {
          key: "single-offer",
          label: "Single offer focus",
          status: "ready",
          evidence: "Starter content pack keeps one campaign path.",
          decisionGate: "Confirm final campaign objective before traffic is sent.",
        },
        {
          key: "consent-language",
          label: "Consent language accepted",
          status: "blocked",
          evidence: "Consent copy, unsubscribe expectations, and source tracking remain blocked.",
          decisionGate: "Approve consent language before provider-send smoke.",
        },
        {
          key: "lead-write",
          label: "Lead-write smoke accepted",
          status: "blocked",
          evidence: "Public form lead write is still gated.",
          decisionGate: "Approve public lead route, smoke cleanup, and rollback owner.",
        },
        {
          key: "provider-send",
          label: "Provider-send trace accepted",
          status: "blocked",
          evidence: "Campaign send and provider trace remain disabled.",
          decisionGate: "Approve campaign provider trace before any traffic or sends.",
        },
      ],
      rollbackPlan: {
        owner: "platform.super_admin",
        status: "blocked",
        steps: ["pause campaign traffic", "disable signup route", "revert campaign approval state"],
      },
      requiredSignoffs: ["campaign objective", "consent language", "provider-send rollback owner"],
      blockedLaunchActions: ["send campaign", "write public form lead", "run provider-send trace", "approve mobile screenshot"],
      convexFunctions: [
        "siteFactory.listClientWebsiteLaunchDecisionPackets",
        "siteFactory.listClientWebsiteVisualQaEvidencePackets",
        "campaigns.requestCampaignApproval",
        "crm.submitLead",
        "publicSite.resolvePublishedSite",
      ],
    },
  ],
  previewReviewPackets: [
    {
      siteKey: "julies-family-public",
      label: "Julie Family public preview review packet",
      previewPath: "/kinflo-sites/julies-family",
      route: "/",
      persona: "parent, volunteer, donor, and community partner",
      journeyStage: "awareness-to-decision",
      device: "desktop",
      reviewSource: "site-studio-preview",
      reviewPosture: "provider-light-preview-review",
      launchDecision: "review",
      context: [
        { label: "Site", value: "julies-family-public" },
        { label: "Route", value: "/" },
        { label: "Persona", value: "parent, volunteer, donor, and community partner" },
        { label: "Journey", value: "awareness-to-decision" },
        { label: "Device/source", value: "desktop / site-studio-preview" },
        { label: "Decision", value: "review" },
      ],
      evidenceChecklist: [
        { key: "url-context", label: "Preview URL context", status: "accepted", evidence: "studioSite, route, persona, journeyStage, device, and source are present." },
        { key: "visual-qa", label: "Visual QA packet", status: "ready", evidence: "4 fixture evidence items remain local." },
        { key: "launch-decision", label: "Launch decision criteria", status: "pending", evidence: "1 ready / 2 blocked." },
        { key: "hosted-smoke", label: "Hosted smoke evidence", status: "blocked", evidence: "Pending hosted Convex, generated API review, read-only smoke, and rollback approval." },
      ],
      blockedLiveActions: ["public publish write", "CRM lead write", "client sharing"],
      requiredBeforeClientShare: ["hosted read-only smoke", "generated API review", "visual QA evidence accepted", "publish rollback owner assigned"],
      convexFunctions: [
        "siteFactory.listClientWebsitePreviewReviewPackets",
        "siteFactory.listClientWebsiteVisualQaEvidencePackets",
        "siteFactory.listClientWebsiteLaunchDecisionPackets",
        "publicSite.resolvePublishedSite",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client preview review packet",
      previewPath: "/kinflo-sites/advisor-client-site",
      route: "/",
      persona: "service client evaluating fit and proof",
      journeyStage: "consideration-to-decision",
      device: "desktop",
      reviewSource: "site-studio-preview",
      reviewPosture: "provider-light-preview-review",
      launchDecision: "review",
      context: [
        { label: "Site", value: "advisor-client-site" },
        { label: "Route", value: "/" },
        { label: "Persona", value: "service client evaluating fit and proof" },
        { label: "Journey", value: "consideration-to-decision" },
        { label: "Device/source", value: "desktop / site-studio-preview" },
        { label: "Decision", value: "review" },
      ],
      evidenceChecklist: [
        { key: "url-context", label: "Preview URL context", status: "accepted", evidence: "studioSite, route, persona, journeyStage, device, and source are present." },
        { key: "visual-qa", label: "Visual QA packet", status: "ready", evidence: "4 fixture evidence items remain local." },
        { key: "launch-decision", label: "Launch decision criteria", status: "pending", evidence: "1 ready / 2 blocked." },
        { key: "hosted-smoke", label: "Hosted smoke evidence", status: "blocked", evidence: "Pending hosted Convex, generated API review, read-only smoke, and rollback approval." },
      ],
      blockedLiveActions: ["tenant create mutation", "client admin invitation", "public publish write", "CRM lead write", "client sharing"],
      requiredBeforeClientShare: ["tenant owner approval", "hosted preview smoke", "lead route smoke", "client invite approval"],
      convexFunctions: [
        "siteFactory.listClientWebsitePreviewReviewPackets",
        "siteFactory.listClientWebsiteVisualQaEvidencePackets",
        "siteFactory.listClientWebsiteLaunchDecisionPackets",
        "controlPlane.createTenant",
        "controlPlane.createInvitation",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite preview review packet",
      previewPath: "/kinflo-sites/campaign-microsite",
      route: "/",
      persona: "warm campaign lead from email, SMS, referral, or event traffic",
      journeyStage: "decision",
      device: "desktop",
      reviewSource: "site-studio-preview",
      reviewPosture: "provider-light-preview-review",
      launchDecision: "no_go",
      context: [
        { label: "Site", value: "campaign-microsite" },
        { label: "Route", value: "/" },
        { label: "Persona", value: "warm campaign lead from email, SMS, referral, or event traffic" },
        { label: "Journey", value: "decision" },
        { label: "Device/source", value: "desktop / site-studio-preview" },
        { label: "Decision", value: "no_go" },
      ],
      evidenceChecklist: [
        { key: "url-context", label: "Preview URL context", status: "accepted", evidence: "studioSite, route, persona, journeyStage, device, and source are present." },
        { key: "visual-qa", label: "Visual QA packet", status: "pending", evidence: "4 fixture evidence items remain local." },
        { key: "launch-decision", label: "Launch decision criteria", status: "blocked", evidence: "1 ready / 3 blocked." },
        { key: "hosted-smoke", label: "Hosted smoke evidence", status: "blocked", evidence: "Pending hosted Convex, generated API review, read-only smoke, and rollback approval." },
      ],
      blockedLiveActions: ["campaign send", "public form lead write", "AI copy publish", "client sharing"],
      requiredBeforeClientShare: ["campaign consent approval", "mobile screenshot approval", "lead smoke approval", "provider-send rollback owner assigned"],
      convexFunctions: [
        "siteFactory.listClientWebsitePreviewReviewPackets",
        "siteFactory.listClientWebsiteVisualQaEvidencePackets",
        "siteFactory.listClientWebsiteLaunchDecisionPackets",
        "campaigns.requestCampaignApproval",
        "crm.submitLead",
      ],
    },
  ],
  researchSources: [
    { label: "Kanopi nonprofit website examples", url: "https://kanopi.com/blog/best-nonprofit-websites/" },
    { label: "Azuro nonprofit design examples", url: "https://azurodigital.com/nonprofit-website-examples/" },
    { label: "Striped Horse school website design ideas", url: "https://www.stripedhorse.com/blog/school-website-design-ideas" },
    { label: "WeWeb client portal buying guide", url: "https://www.weweb.io/blog/client-portals-buying-guide" },
  ],
  providerBoundary: "Client website studio changes are local review notes until hosted Convex, generated API bindings, visual QA, domain readiness, and publish approval are complete.",
  convexFunctions: [
    "siteFactory.listClientWebsiteAdminPermissionPresets",
    "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
    "siteFactory.listClientWebsiteConfigurationProfiles",
    "siteFactory.listClientWebsiteLaunchDecisionPackets",
    "siteFactory.listClientWebsiteLaunchBlueprints",
    "siteFactory.listClientWebsiteLaunchSimulations",
    "siteFactory.listClientWebsiteOnboardingReadiness",
    "siteFactory.listClientWebsitePolishScorecards",
    "siteFactory.listClientWebsitePreviewReviewPackets",
    "siteFactory.listClientWebsiteProvisioningOrders",
    "siteFactory.listClientWebsiteVisualQaBudgets",
    "siteFactory.listClientWebsiteVisualQaEvidencePackets",
    "siteBuilder.getSiteDraft",
    "siteBuilder.updatePage",
    "publicSite.resolvePublishedSite",
    "siteBuilder.publishPage",
  ],
  activationEvidence: [
    "Client site has a selected design direction",
    "mobile public preview passes at 390px without overflow",
    "public CTA and trust signal are visible before publish",
    "portal handoff is reviewed before assigning client admin permissions",
    "publish action remains gated until provider activation is approved",
  ],
};

const fixtureAssetLibrary: ShellAssetLibraryDraft = {
  defaultSiteKey: "advisor-client-site",
  defaultAssetKey: "advisor-hero-proof",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  kindOptions: [
    { key: "logo", label: "Logo" },
    { key: "hero", label: "Hero" },
    { key: "program", label: "Program" },
    { key: "campaign", label: "Campaign" },
    { key: "document", label: "Document" },
  ],
  statusOptions: [
    { key: "draft", label: "Draft" },
    { key: "approved", label: "Approved" },
    { key: "archived", label: "Archived" },
  ],
  assets: [
    {
      key: "advisor-hero-proof",
      name: "Advisor collaboration hero",
      kind: "hero",
      status: "approved",
      siteKey: "advisor-client-site",
      usage: "Homepage hero and proof section",
      storageProvider: "fixture",
      storageKey: "generated_images/Professional_partnership_collaboration_meeting_f14bd523.png",
      altText: "Professionals reviewing a shared implementation plan around a table",
      provenance: "KinFlo generated image fixture reviewed for advisory template fit",
    },
    {
      key: "julie-program-community",
      name: "Community learning program",
      kind: "program",
      status: "approved",
      siteKey: "julies-family-public",
      usage: "Program overview and family intake pages",
      storageProvider: "fixture",
      storageKey: "generated_images/Hero_education_classroom_scene_8eef647c.png",
      altText: "Families and learners in a bright community classroom",
      provenance: "Julie public preview fixture, source retained in repo assets",
    },
    {
      key: "campaign-momentum",
      name: "Campaign momentum hero",
      kind: "campaign",
      status: "draft",
      siteKey: "campaign-microsite",
      usage: "Campaign hero and supporter progress block",
      storageProvider: "fixture",
      storageKey: "generated_images/Hands_together_showing_community_b0e0e375.png",
      altText: "Community members placing hands together in support of a shared goal",
      provenance: "Campaign microsite fixture awaiting copy and usage approval",
    },
  ],
  providerBoundary: "Asset uploads are gated until object storage, generated Convex API bindings, file-size policy, and provenance review are approved.",
  convexFunctions: [
    "siteBuilder.getSiteDraft",
    "siteBuilder.createAssetRecord",
    "publicSite.resolvePublishedSite",
  ],
  activationEvidence: [
    "asset metadata writes require asset:manage",
    "storage provider upload is approved before public URL use",
    "alt text and provenance are required before approval",
    "public preview confirms approved asset usage on the selected site",
  ],
};

const fixtureDomainReadiness: ShellDomainReadinessDraft = {
  defaultSiteKey: "advisor-client-site",
  defaultDomainKey: "advisor-primary-domain",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  statusOptions: [
    { key: "pending", label: "Pending" },
    { key: "verified", label: "Verified" },
    { key: "disabled", label: "Disabled" },
  ],
  domains: [
    {
      key: "advisor-primary-domain",
      siteKey: "advisor-client-site",
      hostname: "advisor.example.invalid",
      status: "pending",
      isPrimary: true,
      verificationToken: "kinflo-advisor-client-verify",
      sslStatus: "not_requested",
      providerStatus: "ready_for_dns",
      rollbackPlan: "Keep advisor client site on fixture preview route until DNS TXT and hosted resolver smoke pass.",
    },
    {
      key: "julie-public-domain",
      siteKey: "julies-family-public",
      hostname: "juliesfamily.org",
      status: "verified",
      isPrimary: true,
      verificationToken: "kinflo-julie-public-verify",
      sslStatus: "issued",
      providerStatus: "attached",
      rollbackPlan: "Leave public renderer on fixture mode and do not map live hostnames until generated API smoke is approved.",
    },
    {
      key: "campaign-lab-domain",
      siteKey: "campaign-microsite",
      hostname: "campaign.example.invalid",
      status: "disabled",
      isPrimary: false,
      verificationToken: "kinflo-campaign-lab-verify",
      sslStatus: "blocked",
      providerStatus: "blocked",
      rollbackPlan: "Keep campaign hostname disabled until plan limit, launch copy, and smoke data cleanup are reviewed.",
    },
  ],
  providerBoundary: "Domain metadata is local until hosted Convex, DNS ownership, SSL provisioning, Vercel domain attachment, and rollback approval are complete.",
  convexFunctions: [
    "siteBuilder.upsertDomain",
    "entitlements.checkEntitlementLimit",
    "publicSite.resolvePublishedSite",
  ],
  activationEvidence: [
    "customDomains entitlement limit is checked",
    "duplicate hostname rejection is verified",
    "verified primary domain updates site.primaryDomain",
    "DNS and SSL provider writes remain manually approved gates",
  ],
  dnsChecklist: [
    "Generate TXT verification token after hosted approval",
    "Confirm DNS ownership in provider console",
    "Attach hostname to Vercel only after rollback owner is named",
    "Issue SSL certificate after resolver smoke passes",
    "Keep fixture preview route available until public hostname resolves",
  ],
};

const fixtureIntegrationReadiness: ShellIntegrationReadiness = {
  defaultTenantSlug: "advisor-client-starter",
  defaultSiteKey: "advisor-client-site",
  defaultIntegrationKey: "advisor-sendgrid",
  tenantOptions: [
    { slug: "julies-family", label: "Julie's Family Learning Program" },
    { slug: "advisor-client-starter", label: "Advisor Client Starter" },
    { slug: "campaign-microsite-lab", label: "Campaign Microsite Lab" },
  ],
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", tenantSlug: "julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", tenantSlug: "advisor-client-starter" },
    { key: "campaign-microsite", label: "Campaign Microsite", tenantSlug: "campaign-microsite-lab" },
  ],
  providerOptions: [
    { key: "sendgrid", label: "SendGrid Email", category: "communications" },
    { key: "twilio", label: "Twilio SMS", category: "communications" },
    { key: "stripe_billing", label: "Stripe Billing", category: "payments" },
    { key: "stripe_connect", label: "Stripe Connect", category: "payments" },
    { key: "cloudinary", label: "Cloudinary Media", category: "storage" },
    { key: "object_storage", label: "Object Storage", category: "storage" },
    { key: "ai_gateway", label: "AI Gateway", category: "AI" },
  ],
  statusOptions: [
    { key: "not_configured", label: "Not configured" },
    { key: "ready_for_env", label: "Ready for env" },
    { key: "review_pending", label: "Review pending" },
    { key: "active", label: "Active" },
    { key: "paused", label: "Paused" },
  ],
  integrations: [
    {
      key: "advisor-sendgrid",
      provider: "sendgrid",
      label: "Advisor intake email",
      scope: "site",
      tenantSlug: "advisor-client-starter",
      siteKey: "advisor-client-site",
      status: "ready_for_env",
      envKeys: ["SENDGRID_API_KEY", "SENDGRID_FROM_EMAIL"],
      useCase: "Send client intake confirmations and internal lead notifications after hosted smoke approval.",
      providerBoundary: "SendGrid is mapped as env-key references only until sender identity, unsubscribe policy, and live email smoke are approved.",
      approvalNotes: "Use sandbox recipients first; do not send client email until tenant owner approval is recorded.",
      smokeGate: "Signed-in site admin creates one test lead and confirms queued email audit metadata before delivery is enabled.",
    },
    {
      key: "advisor-stripe-billing",
      provider: "stripe_billing",
      label: "Advisor subscription billing",
      scope: "tenant",
      tenantSlug: "advisor-client-starter",
      status: "review_pending",
      envKeys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "VITE_STRIPE_PUBLIC_KEY"],
      useCase: "Collect monthly SaaS subscription payments after plan catalog and entitlement sync are approved.",
      providerBoundary: "Stripe Billing remains disabled until price IDs, webhook replay checks, and cancellation flow smoke pass.",
      approvalNotes: "Keep manual entitlements as the source of truth until billing webhooks are verified.",
      smokeGate: "Test-mode Checkout, invoice payment, cancellation, and entitlement downgrade replay pass without production charges.",
    },
    {
      key: "julie-twilio",
      provider: "twilio",
      label: "Family SMS reminders",
      scope: "site",
      tenantSlug: "julies-family",
      siteKey: "julies-family-public",
      status: "not_configured",
      envKeys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"],
      useCase: "Send opt-in program reminders only after consent capture and message templates are approved.",
      providerBoundary: "Twilio is held behind consent, rate-limit, opt-out, and manual-send gates before any SMS leaves the system.",
      approvalNotes: "SMS is lower priority than email; require explicit opt-in proof before activation.",
      smokeGate: "One verified test number receives an opt-in, reminder, and STOP response in test mode or controlled live smoke.",
    },
    {
      key: "campaign-ai-gateway",
      provider: "ai_gateway",
      label: "Campaign copy assistant",
      scope: "tenant",
      tenantSlug: "campaign-microsite-lab",
      status: "paused",
      envKeys: ["AI_GATEWAY_API_KEY", "AI_GATEWAY_BASE_URL"],
      useCase: "Draft review-only campaign copy with tenant usage caps and approval before publish.",
      providerBoundary: "AI generation stays review-only until usage caps, provenance records, and approval workflows are enforced.",
      approvalNotes: "Do not publish generated content without human approval and source-safe review.",
      smokeGate: "Generated draft creates a proposal packet, records usage, and requires approval before touching public content.",
    },
  ],
  providerBoundary: "Integration readiness stores provider, scope, status, env key names, and approval notes only. Secrets stay in environment managers, and provider writes remain gated.",
  convexFunctions: [
    "integrations.listIntegrationSettings",
    "integrations.upsertIntegrationSetting",
    "accessPolicy.viewerPermissionSnapshot",
  ],
  activationEvidence: [
    "integration:manage permission gates tenant and site settings",
    "env key names are recorded without secret values",
    "upsert writes audit evidence without calling provider SDKs",
    "live email, SMS, payment, storage, and AI smokes stay manually approved gates",
  ],
  safetyChecklist: [
    "Record env key names, not values",
    "Confirm tenant or site scope before enabling a provider",
    "Keep sandbox/test mode until a provider-specific smoke passes",
    "Name the approval owner before activation",
    "Keep manual rollback path for every external provider",
  ],
};

const fixtureCampaignAutomation: ShellCampaignAutomation = {
  defaultSiteKey: "advisor-client-site",
  defaultCampaignKey: "advisor-intake-nurture",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  channelOptions: [
    { key: "email", label: "Email" },
    { key: "sms", label: "SMS" },
    { key: "multi_channel", label: "Email + SMS" },
    { key: "ai_assisted", label: "AI-assisted draft" },
  ],
  statusOptions: [
    { key: "draft", label: "Draft" },
    { key: "review_pending", label: "Review pending" },
    { key: "approved", label: "Approved" },
    { key: "paused", label: "Paused" },
    { key: "archived", label: "Archived" },
  ],
  campaigns: [
    {
      key: "advisor-intake-nurture",
      siteKey: "advisor-client-site",
      name: "Advisor intake nurture",
      channel: "email",
      status: "review_pending",
      objective: "Follow up with qualified advisory leads after the intake form without sending provider email until approval.",
      targetPersona: "client prospect",
      journeyStage: "consideration",
      approvalOwner: "Tenant Admin",
      providerBoundary: "Email sequence is review-only until SendGrid sender identity, unsubscribe footer, and live smoke are approved.",
      steps: [
        {
          key: "advisor-email-1",
          channel: "email",
          label: "Immediate confirmation",
          subject: "We received your KinFlo intake",
          body: "Confirm the inquiry, restate the next step, and route the lead to a human review queue.",
          delayHours: 0,
          requiresApproval: true,
          providerStatus: "ready_for_review",
        },
        {
          key: "advisor-task-1",
          channel: "task",
          label: "Human review task",
          body: "Assign a follow-up task to the site admin before any second-touch message is approved.",
          delayHours: 24,
          requiresApproval: true,
          providerStatus: "not_queued",
        },
      ],
    },
    {
      key: "julie-family-reminders",
      siteKey: "julies-family-public",
      name: "Family program reminders",
      channel: "multi_channel",
      status: "draft",
      objective: "Prepare opt-in family reminders for program sessions while consent and SMS policy are still gated.",
      targetPersona: "parent",
      journeyStage: "retention",
      approvalOwner: "Program Lead",
      providerBoundary: "SMS and email reminders stay local until consent proof, quiet hours, opt-out handling, and provider smoke pass.",
      steps: [
        {
          key: "julie-email-reminder",
          channel: "email",
          label: "Session reminder email",
          subject: "Your next Julie's Family session",
          body: "Remind families about time, location, materials, and support contact.",
          delayHours: 48,
          requiresApproval: true,
          providerStatus: "not_queued",
        },
        {
          key: "julie-sms-reminder",
          channel: "sms",
          label: "Opt-in SMS reminder",
          body: "Short SMS reminder with STOP language and program contact.",
          delayHours: 24,
          requiresApproval: true,
          providerStatus: "blocked",
        },
      ],
    },
    {
      key: "campaign-ai-proof",
      siteKey: "campaign-microsite",
      name: "Campaign proof copy review",
      channel: "ai_assisted",
      status: "paused",
      objective: "Generate review-only proof-point drafts for a campaign microsite without touching public content.",
      targetPersona: "supporter",
      journeyStage: "awareness",
      approvalOwner: "Campaign Editor",
      providerBoundary: "AI copy remains proposal-only until source inputs, reviewer notes, usage caps, and publish approval are recorded.",
      steps: [
        {
          key: "campaign-ai-draft",
          channel: "ai_draft",
          label: "Draft proof points",
          body: "Create source-safe draft proof bullets for human review; do not publish generated copy automatically.",
          delayHours: 0,
          requiresApproval: true,
          providerStatus: "blocked",
        },
      ],
    },
  ],
  providerBoundary: "Campaign automation stores drafts, steps, review state, and safety policy only. No provider send, lead enrollment, AI generation, webhook, or analytics promotion runs from this shell.",
  convexFunctions: [
    "campaigns.listCampaignDrafts",
    "campaigns.upsertCampaignDraft",
    "campaigns.requestCampaignApproval",
    "campaigns.approveCampaignDraft",
    "entitlements.checkEntitlementLimit",
  ],
  activationEvidence: [
    "campaign:manage can draft site-scoped campaigns",
    "campaign:approve is required before activation",
    "campaigns entitlement limit is checked before creation",
    "approval writes audit evidence without provider sends",
    "AI outputs remain proposal records until human review",
  ],
  safetyChecklist: [
    "Confirm tenant and site scope before drafting",
    "Require human approval for every outbound step",
    "Keep consent, unsubscribe, quiet hours, and rate limits explicit",
    "Record AI source inputs and reviewer before publish",
    "Run SendGrid, Twilio, and AI smokes separately after hosted activation",
  ],
};

const fixtureAiReview: ShellAiReviewQueue = {
  defaultSiteKey: "campaign-microsite",
  defaultRecordKey: "campaign-proof-ai-draft",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  statusOptions: [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ],
  records: [
    {
      key: "campaign-proof-ai-draft",
      siteKey: "campaign-microsite",
      campaignKey: "campaign-ai-proof",
      promptSummary: "Draft proof points for a campaign microsite using approved source notes and no private chat excerpts.",
      sourceInputs: ["approved campaign brief", "public program summary", "reviewer-provided proof notes"],
      outputSummary: "Three proof bullets and one supporter CTA prepared for human review.",
      publishTarget: "Campaign microsite proof block",
      status: "pending",
      reviewer: "Campaign Editor",
      reviewerNotes: "Confirm source-safe language and remove any claim without evidence before publish.",
      providerBoundary: "AI output is a proposal record only until reviewer approval and content publish smoke are complete.",
    },
    {
      key: "advisor-intake-ai-draft",
      siteKey: "advisor-client-site",
      campaignKey: "advisor-intake-nurture",
      promptSummary: "Summarize the intake value proposition for a first-touch advisory email.",
      sourceInputs: ["advisor template offer", "intake form questions", "tenant-approved positioning"],
      outputSummary: "Email opening and next-step paragraph ready for tenant admin review.",
      publishTarget: "Advisor intake nurture email step",
      status: "approved",
      reviewer: "Tenant Admin",
      reviewerNotes: "Approved for local fixture preview only; SendGrid smoke still required before delivery.",
      providerBoundary: "Approved review state does not send email or write generated copy to a provider.",
    },
    {
      key: "julie-reminder-ai-draft",
      siteKey: "julies-family-public",
      campaignKey: "julie-family-reminders",
      promptSummary: "Draft a parent-friendly reminder for an upcoming learning session.",
      sourceInputs: ["program schedule", "family-facing reminder policy", "SMS consent checklist"],
      outputSummary: "Short reminder draft rejected until opt-in and quiet-hour language are explicit.",
      publishTarget: "Family reminder SMS step",
      status: "rejected",
      reviewer: "Program Lead",
      reviewerNotes: "Needs explicit opt-out language and source confirmation before SMS review.",
      providerBoundary: "Rejected AI output remains local provenance and is not eligible for provider send.",
    },
  ],
  providerBoundary: "AI review stores prompt summaries, source inputs, output summaries, reviewer notes, and publish targets only. No AI provider call, content publish, email send, SMS send, or public-site mutation runs from this shell.",
  convexFunctions: [
    "aiReview.listAiGenerationRecords",
    "aiReview.upsertAiGenerationRecord",
    "aiReview.reviewAiGenerationRecord",
  ],
  activationEvidence: [
    "ai:draft can create provenance records",
    "ai:review is required for approval or rejection",
    "source inputs and publish target are recorded before publish",
    "review writes audit evidence without AI provider calls",
    "approved AI output still requires content or campaign smoke before public use",
  ],
  reviewChecklist: [
    "Confirm source inputs are approved for this tenant and site",
    "Reject private chat excerpts, secrets, and unsupported claims",
    "Name the target block, email, SMS, or campaign step before approval",
    "Record reviewer notes before generated copy reaches publish workflow",
    "Keep AI provider calls and public publish behind separate hosted smokes",
  ],
};

const fixtureExperienceControls: ShellExperienceControl[] = [
  { label: "Theme Tokens", value: "Palette, typography, spacing, radii", iconKey: "theme" },
  { label: "Navigation", value: "Header and footer placement per site", iconKey: "navigation" },
  { label: "Audience Rules", value: "Persona and journey-stage block visibility", iconKey: "audience" },
  { label: "Responsive Preview", value: "Desktop, tablet, phone launch checks", iconKey: "preview" },
];

const fixtureExperiencePreferences: ShellExperiencePreference = {
  scopeLabel: "Julie's Family site admin",
  scopeKind: "site",
  tenant: "Julie's Family Learning Program",
  site: "Julie Family Public Site",
  defaultLandingPage: "/admin/kinflo-os",
  theme: "system",
  dataDensity: "comfortable",
  itemsPerPage: 25,
  defaultContentFilter: "all",
  notificationChannels: ["email"],
  workflowDefaults: [
    { label: "Lead view", value: "Kanban by journey stage" },
    { label: "Task due date", value: "3 days after assignment" },
    { label: "New lead owner", value: "Manual assignment" },
  ],
  communicationDefaults: [
    { label: "Daily digest", value: "Off" },
    { label: "Weekly report", value: "On" },
    { label: "Critical alerts", value: "All lead and task activity" },
  ],
  providerBoundary: "Live preference save gated until generated Convex API bindings and hosted smoke are approved.",
  convexFunctions: ["preferences.getMyPreferences", "preferences.upsertMyPreferences"],
  activationEvidence: [
    "viewer reads own scoped preferences",
    "tenant/site scoped preferences require matching access",
    "upsert writes only the current user's preference record",
  ],
};

const fixtureRoles: ShellRole[] = [
  { role: "Super Admin", scope: "Platform", access: "Tenants, templates, billing gates, leads, audit events", owner: "Vambah" },
  { role: "Tenant Owner", scope: "Tenant", access: "Sites, members, theme, leads, domain metadata", owner: "Client lead" },
  { role: "Site Admin", scope: "Site", access: "Pages, navigation, blocks, lead workflow", owner: "Program lead" },
  { role: "Editor", scope: "Site", access: "Draft content, asset records, lead visibility", owner: "Content support" },
];

const fixtureAccessDelegation: ShellAccessDelegation = {
  defaultEmail: "client-admin@example.invalid",
  defaultTenantSlug: "advisor-client-starter",
  defaultSiteKey: "advisor-client-site",
  defaultRoleKey: "tenant.admin",
  tenantOptions: [
    { slug: "julies-family", label: "Julie's Family Learning Program" },
    { slug: "advisor-client-starter", label: "Advisor Client Starter" },
    { slug: "campaign-microsite-lab", label: "Campaign Microsite Lab" },
  ],
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", tenantSlug: "julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", tenantSlug: "advisor-client-starter" },
    { key: "campaign-microsite", label: "Campaign Microsite", tenantSlug: "campaign-microsite-lab" },
  ],
  roleOptions: [
    {
      key: "tenant.admin",
      label: "Tenant Admin",
      scope: "tenant",
      description: "Can manage tenant sites, members, content, lead workflow, and domain metadata.",
      permissions: ["site:create", "member:invite", "content:edit", "content:publish", "lead:manage", "domain:manage"],
    },
    {
      key: "site.admin",
      label: "Site Admin",
      scope: "site",
      description: "Can manage one site, its pages, public preview, lead intake, and site workflow.",
      permissions: ["content:edit", "content:publish", "lead:view", "lead:manage", "asset:manage"],
    },
    {
      key: "site.editor",
      label: "Site Editor",
      scope: "site",
      description: "Can edit draft content and review lead visibility without publishing or inviting users.",
      permissions: ["content:edit", "lead:view", "asset:manage"],
    },
  ],
  providerBoundary: "Live invitation creation is gated until hosted Convex auth, generated API bindings, email delivery, and smoke cleanup are approved.",
  convexMutations: [
    "controlPlane.createInvitation",
    "controlPlane.grantMembership",
    "controlPlane.acceptInvitation",
    "controlPlane.listAuditEvents",
  ],
  activationEvidence: [
    "client admin invitation is scoped to tenant and site",
    "token-hash-only invitation contract is preserved",
    "cross-tenant access denial passes before live invites",
  ],
};

const fixtureLeads: ShellLead[] = [
  {
    name: "Maria Alvarez",
    email: "maria@example.invalid",
    site: "Julie Family Public Site",
    persona: "Parent",
    stage: "new_lead",
    owner: "Program lead",
    status: "active",
    lastEvent: "Submitted family learning intake",
  },
  {
    name: "Devon Price",
    email: "devon@example.invalid",
    site: "Tech Goes Home Cohort",
    persona: "Volunteer",
    stage: "qualified",
    owner: "Volunteer coordinator",
    status: "nurture",
    lastEvent: "Assigned follow-up task",
  },
  {
    name: "Aisha Grant",
    email: "aisha@example.invalid",
    site: "Advisor Client Site",
    persona: "Client prospect",
    stage: "consultation",
    owner: "Client Admin",
    status: "converted",
    lastEvent: "Moved to converted",
  },
];

const fixturePipelineStages: ShellPipelineStage[] = [
  { label: "New Lead", slug: "new_lead", leads: 1, color: "Slate" },
  { label: "Qualified", slug: "qualified", leads: 1, color: "Sky" },
  { label: "Consultation", slug: "consultation", leads: 1, color: "Emerald" },
];

const fixtureTasks: ShellTask[] = [
  {
    title: "Call Maria about evening classes",
    lead: "Maria Alvarez",
    owner: "Program lead",
    due: "Next business day",
    status: "pending",
  },
  {
    title: "Send volunteer orientation packet",
    lead: "Devon Price",
    owner: "Volunteer coordinator",
    due: "This week",
    status: "active",
  },
];

const fixtureLeadCaptureContracts: ShellLeadCaptureContract[] = [
  {
    label: "Lead magnet download",
    blockType: "lead_magnet",
    convexFunction: "crm.submitLead",
    runtime: "legacy fallback",
    requiredFields: ["siteId", "email", "source"],
    fallback: "/api/leads until generated Convex API bindings are approved",
  },
  {
    label: "Advisor intake form",
    blockType: "form",
    convexFunction: "crm.submitLead",
    runtime: "legacy fallback",
    requiredFields: ["siteId", "email", "journeyStage"],
    fallback: "/api/leads until generated Convex API bindings are approved",
  },
  {
    label: "Campaign microsite signup",
    blockType: "campaign",
    convexFunction: "crm.submitLead",
    runtime: "legacy fallback",
    requiredFields: ["siteId", "email", "persona"],
    fallback: "/api/leads until generated Convex API bindings are approved",
  },
];

const fixtureSiteLaunchPackets: ShellSiteLaunchPacket[] = [
  {
    id: "advisor-client-starter",
    label: "Advisor Client Starter",
    tenant: "Advisor Client Starter",
    siteName: "Advisor Client Site",
    template: "Advisor Consultant",
    subdomain: "advisor-client",
    ownerEmail: "client-admin@example.invalid",
    ownerRole: "tenant.admin",
    previewPath: "/kinflo-sites/advisor-client-site",
    configurationSummary: [
      "Create tenant with Client Build plan",
      "Seed advisory template pages, navigation, and theme tokens",
      "Invite client admin with tenant and site permissions",
      "Keep publish state in draft until domain and content review pass",
    ],
    permissionGates: ["tenant:create", "site:create", "member:invite", "content:edit", "content:publish"],
    convexMutations: [
      "controlPlane.createTenant",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "controlPlane.listAuditEvents",
    ],
    launchChecklist: [
      { label: "Tenant packet prepared", status: "done" },
      { label: "Starter template selected", status: "done" },
      { label: "Client admin invite scoped", status: "done" },
      { label: "Domain verification", status: "pending" },
      { label: "Live Convex mutation smoke", status: "pending" },
    ],
  },
  {
    id: "campaign-microsite-lab",
    label: "Campaign Microsite Lab",
    tenant: "Campaign Microsite Lab",
    siteName: "Campaign Microsite",
    template: "Campaign Microsite",
    subdomain: "campaign-lab",
    ownerEmail: "campaign-editor@example.invalid",
    ownerRole: "site.editor",
    previewPath: "/kinflo-sites/campaign-microsite",
    configurationSummary: [
      "Create campaign tenant or attach to existing tenant",
      "Seed focused campaign blocks and lead capture",
      "Scope editor access to the campaign site only",
      "Route public form submissions to the site CRM pipeline",
    ],
    permissionGates: ["site:create", "member:invite", "content:edit", "lead:view"],
    convexMutations: [
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "crm.submitLead",
      "crm.listLeads",
    ],
    launchChecklist: [
      { label: "Campaign preview prepared", status: "done" },
      { label: "Site editor scope selected", status: "done" },
      { label: "Lead capture contract ready", status: "done" },
      { label: "Campaign copy approval", status: "pending" },
      { label: "Live public form smoke", status: "pending" },
    ],
  },
];

const fixtureLiveAdapterBindings: ShellLiveAdapterBinding[] = [
  {
    surface: "Activation readiness",
    fixtureSource: "data mode header and launch gates",
    convexFunctions: ["activation.readiness", "activation.seedSmokeSite"],
    activationEvidence: ["readiness counts", "activation smoke audit event"],
    status: "generated_api_pending",
  },
  {
    surface: "Tenant control plane",
    fixtureSource: "tenant, site, role, and audit tables",
    convexFunctions: [
      "controlPlane.listTenants",
      "controlPlane.listSitesForTenant",
      "controlPlane.listAuditEvents",
    ],
    activationEvidence: ["super admin tenant list", "tenant-scoped site list", "audit trail smoke"],
    status: "fixture_fallback",
  },
  {
    surface: "Admin experience preferences",
    fixtureSource: "data mode, filters, density, and landing-page defaults",
    convexFunctions: ["preferences.getMyPreferences", "preferences.upsertMyPreferences"],
    activationEvidence: ["viewer reads own scoped preferences", "tenant/site scoped preferences require matching access"],
    status: "fixture_fallback",
  },
  {
    surface: "Site factory",
    fixtureSource: "launch packets and site creation wizard",
    convexFunctions: [
      "siteFactory.listStarterTemplates",
      "siteFactory.listClientWebsiteAdminPermissionPresets",
      "siteFactory.listClientWebsiteLaunchBlueprints",
      "siteFactory.createSiteFromTemplate",
    ],
    activationEvidence: ["template list", "draft site created from template", "owner invite scoped"],
    status: "fixture_fallback",
  },
  {
    surface: "Launch readiness",
    fixtureSource: "site launch evidence across admin, content, preview, CRM, domain, integration, campaign, and AI gates",
    convexFunctions: ["launchReadiness.getSiteLaunchReadiness", "activation.readiness"],
    activationEvidence: ["site:view scoped", "read-only launch packet", "provider actions gated"],
    status: "generated_api_pending",
  },
  {
    surface: "Domain metadata",
    fixtureSource: "site domain rows and launch checklist",
    convexFunctions: ["siteBuilder.upsertDomain", "entitlements.checkEntitlementLimit"],
    activationEvidence: ["customDomains limit enforced", "primary verified hostname set", "duplicate hostname rejected"],
    status: "generated_api_pending",
  },
  {
    surface: "Integration readiness",
    fixtureSource: "provider settings, env key references, and activation gates",
    convexFunctions: ["integrations.listIntegrationSettings", "integrations.upsertIntegrationSetting"],
    activationEvidence: ["integration:manage scoped", "secret values excluded", "provider writes gated"],
    status: "generated_api_pending",
  },
  {
    surface: "Campaign automation",
    fixtureSource: "campaign drafts, review steps, safety gates, and approval state",
    convexFunctions: ["campaigns.listCampaignDrafts", "campaigns.upsertCampaignDraft", "campaigns.approveCampaignDraft"],
    activationEvidence: ["campaign:manage scoped", "campaign limit enforced", "provider sends gated"],
    status: "generated_api_pending",
  },
  {
    surface: "AI review provenance",
    fixtureSource: "AI prompt, source, output, reviewer, and publish-target records",
    convexFunctions: ["aiReview.listAiGenerationRecords", "aiReview.upsertAiGenerationRecord", "aiReview.reviewAiGenerationRecord"],
    activationEvidence: ["ai:draft scoped", "ai:review required", "provider calls gated"],
    status: "generated_api_pending",
  },
  {
    surface: "Public renderer",
    fixtureSource: "public preview resolver",
    convexFunctions: ["publicSite.resolvePublishedSite"],
    activationEvidence: ["published site resolves", "draft site hidden", "verified domain required"],
    status: "fixture_fallback",
  },
  {
    surface: "CRM lead workspace",
    fixtureSource: "lead, pipeline, task, and intake fixtures",
    convexFunctions: [
      "crm.submitLead",
      "crm.listLeads",
      "crm.getLeadTimeline",
      "crm.listJourneyProgressionRules",
      "crm.upsertJourneyProgressionRule",
      "crm.transitionLeadStage",
    ],
    activationEvidence: [
      "public form creates lead",
      "tenant admin sees scoped lead",
      "pipeline transition appends pipeline, journey, timeline, and audit events",
    ],
    status: "fixture_fallback",
  },
  {
    surface: "Plans and entitlements",
    fixtureSource: "plan cards and tenant entitlement table",
    convexFunctions: ["entitlements.entitlementUsageSnapshot", "entitlements.checkEntitlementLimit"],
    activationEvidence: ["usage snapshot matches site data", "manual override honored", "limit rejection audited"],
    status: "generated_api_pending",
  },
];

function adapterSwitchSurface(
  surface: string,
  id: string,
  rollback: string,
  requiredSmokeEvidence?: string[],
): ShellAdapterSwitchSurface {
  const binding = fixtureLiveAdapterBindings.find((item) => item.surface === surface);

  if (!binding) {
    throw new Error(`Missing fixture live adapter binding for ${surface}`);
  }

  return {
    ...binding,
    id,
    requiredSmokeEvidence: requiredSmokeEvidence ?? binding.activationEvidence,
    rollback,
    switchAllowed: false,
    providerWrites: false,
    liveConvexExecution: false,
  };
}

const fixtureAdapterSwitchReadiness: ShellAdapterSwitchReadiness = {
  status: "provider_light_switch_plan",
  defaultBatchId: "read-only-core",
  providerBoundary: "Adapter switching is local review state only. Generated API imports, live Convex execution, provider writes, and fixture replacement remain gated until hosted approval and smoke evidence pass.",
  activationEvidence: [
    "Phase 50 adapter switch plan validates against KINFLO_GENERATED_API_BINDINGS.",
    "Phase 51 parity gate proves the switch plan matches fixtureLiveAdapterBindings.",
    "generatedApiAvailable remains false.",
    "liveKinfloShellAdapter remains fail-closed.",
    "Each surface keeps fixture rollback until hosted smoke evidence is reviewed.",
  ],
  documents: [
    "docs/convex-adapter-switch-plan.json",
    "docs/phase50-adapter-switch-plan.md",
    "docs/phase51-adapter-switch-parity.md",
  ],
  runwaySteps: [
    {
      order: 10,
      batchId: "read-only-core",
      label: "Read-only core first",
      stage: "Hosted read-only smoke",
      entryGate: "Generated API bindings reviewed and Vambah approves read-only hosted smoke.",
      exitEvidence: [
        "tenant/site/audit scope matches fixtures",
        "public renderer hides draft data",
        "launch readiness reads stay provider-gated",
      ],
      rollbackOwner: "platform.super_admin",
      canAdvance: false,
      liveConvexExecution: false,
      providerWrites: false,
    },
    {
      order: 20,
      batchId: "user-scoped-preferences",
      label: "User preference bridge",
      stage: "Scoped mixed smoke",
      entryGate: "Read-only core smoke passes and preference permission owner is named.",
      exitEvidence: [
        "viewer reads only their own preferences",
        "tenant and site scoped preference checks hold",
        "local preference fallback restores without layout shift",
      ],
      rollbackOwner: "platform.super_admin",
      canAdvance: false,
      liveConvexExecution: false,
      providerWrites: false,
    },
    {
      order: 30,
      batchId: "site-creation-and-admin",
      label: "Site factory smoke",
      stage: "Mutation smoke",
      entryGate: "Mutation smoke order, smoke-site cleanup, and invite rollback are approved.",
      exitEvidence: [
        "activation smoke audit event is labeled test-only",
        "draft site creation maps template, owner, and permission preset",
        "pending invite can be revoked before delivery",
      ],
      rollbackOwner: "platform.super_admin",
      canAdvance: false,
      liveConvexExecution: false,
      providerWrites: false,
    },
    {
      order: 40,
      batchId: "public-crm-loop",
      label: "Public CRM loop",
      stage: "Lead-write smoke",
      entryGate: "Public resolver smoke passes and lead cleanup owner is accepted.",
      exitEvidence: [
        "public form creates one smoke lead",
        "tenant admin sees only scoped lead data",
        "pipeline transition appends timeline and audit events",
      ],
      rollbackOwner: "platform.super_admin",
      canAdvance: false,
      liveConvexExecution: false,
      providerWrites: false,
    },
    {
      order: 50,
      batchId: "provider-readiness-records",
      label: "Provider metadata only",
      stage: "Provider-gated metadata",
      entryGate: "Domain and integration records are approved as metadata without DNS, SSL, email, SMS, storage, billing, or AI writes.",
      exitEvidence: [
        "custom domain entitlement limit is enforced",
        "integration setting excludes secret values",
        "provider write signoff remains separate",
      ],
      rollbackOwner: "platform.super_admin",
      canAdvance: false,
      liveConvexExecution: false,
      providerWrites: false,
    },
    {
      order: 60,
      batchId: "campaign-and-ai-governance",
      label: "Campaign and AI governance",
      stage: "Provider-gated governance",
      entryGate: "Campaign consent, AI provenance reviewer, and provider-send rollback owner are accepted.",
      exitEvidence: [
        "campaign draft remains blocked before send",
        "AI generation record carries reviewer decision",
        "email, SMS, automation, and AI provider calls remain disabled",
      ],
      rollbackOwner: "platform.super_admin",
      canAdvance: false,
      liveConvexExecution: false,
      providerWrites: false,
    },
  ],
  acceptanceMatrix: [
    {
      order: 10,
      batchId: "read-only-core",
      label: "Read-only core shell data",
      acceptancePosture: "blocked_smoke_gap",
      surfaceCount: 4,
      functionCount: 8,
      generatedContractCoverage: "complete",
      smokeCoveredFunctions: 7,
      smokeMissingFunctions: ["launchReadiness.getSiteLaunchReadiness"],
      nextHumanGate: "Add launch readiness read-only hosted smoke, then approve first-batch owner review.",
      rollbackGate: "Keep tenant, entitlement, launch, and public renderer surfaces on fixtures until scope and public-safe resolver proof match.",
      canSwitch: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 20,
      batchId: "user-scoped-preferences",
      label: "User-scoped preference reads and writes",
      acceptancePosture: "blocked_smoke_gap",
      surfaceCount: 1,
      functionCount: 2,
      generatedContractCoverage: "complete",
      smokeCoveredFunctions: 0,
      smokeMissingFunctions: ["preferences.getMyPreferences", "preferences.upsertMyPreferences"],
      nextHumanGate: "Approve user-scoped preference permission smoke before shell personalization can move off fixtures.",
      rollbackGate: "Return density, default landing, filters, and site context to local fixture state if scope checks fail.",
      canSwitch: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 30,
      batchId: "site-creation-and-admin",
      label: "Site creation, invitations, and activation readiness",
      acceptancePosture: "blocked_smoke_gap",
      surfaceCount: 2,
      functionCount: 6,
      generatedContractCoverage: "complete",
      smokeCoveredFunctions: 4,
      smokeMissingFunctions: [
        "siteFactory.listClientWebsiteAdminPermissionPresets",
        "siteFactory.listClientWebsiteLaunchBlueprints",
      ],
      nextHumanGate: "Approve client permission preset and launch blueprint read smokes before template creation or invite smoke can advance.",
      rollbackGate: "Archive any smoke site, revoke pending invites, and return launch packets to fixtures if template creation or owner scope fails.",
      canSwitch: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 40,
      batchId: "public-crm-loop",
      label: "Public lead capture and CRM workflow",
      acceptancePosture: "blocked_smoke_gap",
      surfaceCount: 1,
      functionCount: 6,
      generatedContractCoverage: "complete",
      smokeCoveredFunctions: 3,
      smokeMissingFunctions: [
        "crm.listJourneyProgressionRules",
        "crm.upsertJourneyProgressionRule",
        "crm.transitionLeadStage",
      ],
      nextHumanGate: "Approve journey progression smoke, lead cleanup policy, and notification-provider pause before CRM mutation switch.",
      rollbackGate: "Mark smoke leads and workflow data as test-only, restore fixture CRM tables, and keep outbound notifications paused.",
      canSwitch: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 50,
      batchId: "provider-readiness-records",
      label: "Provider readiness metadata without provider writes",
      acceptancePosture: "blocked_smoke_gap",
      surfaceCount: 2,
      functionCount: 4,
      generatedContractCoverage: "complete",
      smokeCoveredFunctions: 2,
      smokeMissingFunctions: [
        "integrations.listIntegrationSettings",
        "integrations.upsertIntegrationSetting",
      ],
      nextHumanGate: "Approve integration metadata smoke and secret-value exclusion before provider readiness records can use hosted Convex.",
      rollbackGate: "Deactivate smoke domain metadata and return integration readiness rows to fixtures if entitlement, hostname, or secret-exclusion checks fail.",
      canSwitch: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 60,
      batchId: "campaign-and-ai-governance",
      label: "Campaign and AI governance records",
      acceptancePosture: "blocked_smoke_gap",
      surfaceCount: 2,
      functionCount: 6,
      generatedContractCoverage: "complete",
      smokeCoveredFunctions: 0,
      smokeMissingFunctions: [
        "campaigns.listCampaignDrafts",
        "campaigns.upsertCampaignDraft",
        "campaigns.approveCampaignDraft",
        "aiReview.listAiGenerationRecords",
        "aiReview.upsertAiGenerationRecord",
        "aiReview.reviewAiGenerationRecord",
      ],
      nextHumanGate: "Approve campaign governance, consent, AI provenance, and provider-call signoff before this batch can leave fixtures.",
      rollbackGate: "Pause campaign records, keep generated output unpublished, restore fixtures, and block email, SMS, automation, and AI provider calls.",
      canSwitch: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
  ],
  batches: [
    {
      order: 10,
      id: "read-only-core",
      label: "Read-only core shell data",
      mode: "read_only",
      surfaces: [
        adapterSwitchSurface(
          "Tenant control plane",
          "tenant-control-plane",
          "Return tenant/site/audit tables to fixtureKinfloShellAdapter if scope filtering or audit visibility fails.",
        ),
        adapterSwitchSurface(
          "Plans and entitlements",
          "plans-and-entitlements",
          "Restore fixture plan and entitlement cards if usage math, overrides, or limits diverge.",
        ),
        adapterSwitchSurface(
          "Public renderer",
          "public-renderer",
          "Keep preview routes on local fixtures if published/draft filtering or public-safe data fails.",
        ),
        adapterSwitchSurface(
          "Launch readiness",
          "launch-readiness",
          "Restore fixture launch readiness if any launch gate is overstated or cross-tenant evidence leaks.",
        ),
      ],
    },
    {
      order: 20,
      id: "user-scoped-preferences",
      label: "User-scoped preference reads and writes",
      mode: "mixed",
      surfaces: [
        adapterSwitchSurface(
          "Admin experience preferences",
          "admin-experience-preferences",
          "Return preference controls to local state if tenant/site permission checks or personal defaults fail.",
        ),
      ],
    },
    {
      order: 30,
      id: "site-creation-and-admin",
      label: "Site creation, invitations, and activation readiness",
      mode: "write",
      surfaces: [
        adapterSwitchSurface(
          "Activation readiness",
          "activation-readiness",
          "Keep activation smoke records labeled as smoke data and leave data mode on fixtures if seed output differs from manifest expectations.",
        ),
        adapterSwitchSurface(
          "Site factory",
          "site-factory",
          "Archive the smoke site, revoke pending invites, and return launch packets to fixtures if template creation or owner scope fails.",
        ),
      ],
    },
    {
      order: 40,
      id: "public-crm-loop",
      label: "Public lead capture and CRM workflow",
      mode: "write",
      surfaces: [
        adapterSwitchSurface(
          "CRM lead workspace",
          "crm-lead-workspace",
          "Mark smoke leads and workflow data as test-only, restore fixture CRM tables, and keep outbound notifications paused.",
        ),
      ],
    },
    {
      order: 50,
      id: "provider-readiness-records",
      label: "Provider readiness metadata without provider writes",
      mode: "provider_gated",
      surfaces: [
        adapterSwitchSurface(
          "Domain metadata",
          "domain-metadata",
          "Deactivate smoke domain metadata and keep DNS, SSL, and Vercel attachment blocked if hostname or entitlement checks fail.",
        ),
        adapterSwitchSurface(
          "Integration readiness",
          "integration-readiness",
          "Return integration readiness rows to fixtures and keep provider env activation blocked if settings expose secrets or scope incorrectly.",
        ),
      ],
    },
    {
      order: 60,
      id: "campaign-and-ai-governance",
      label: "Campaign and AI governance records",
      mode: "provider_gated",
      surfaces: [
        adapterSwitchSurface(
          "Campaign automation",
          "campaign-automation",
          "Pause campaign records, restore fixture campaign review state, and keep email, SMS, and automation sends blocked.",
        ),
        adapterSwitchSurface(
          "AI review provenance",
          "ai-review-provenance",
          "Keep generated output unpublished, return AI review rows to fixtures, and block AI provider calls until provenance smoke passes.",
        ),
      ],
    },
  ],
  cutoverChecklist: {
    status: "provider_light_adapter_cutover_checklist",
    totalBatches: 6,
    totalSurfaces: 12,
    totalFunctions: 32,
    readyBatches: 0,
    blockedBatches: 6,
    approvalGate: "Cutover is prepared only. Hosted Convex ownership, generated API review, Phase 92 evidence acceptance, rollback owner, and owner signoff must pass before any fixture adapter can import generated bindings.",
    providerBoundary: "This cutover checklist is local review metadata. It does not run codegen, import convex/_generated/api, set generatedApiAvailable true, execute live Convex, replace fixture reads, write providers, publish sites, or read secrets.",
    sourceDocuments: [
      "docs/phase87-adapter-switch-runway.md",
      "docs/phase89-adapter-switch-acceptance-matrix.md",
      "docs/phase92-hosted-smoke-evidence-ledger.md",
      "client/src/lib/kinfloConvexRuntime.ts",
    ],
    steps: [
      {
        order: 10,
        batchId: "read-only-core",
        label: "Read-only core shell data",
        surfaceCount: 4,
        functionCount: 8,
        entryCriteria: [
          "generated API bindings are reviewed against KINFLO_GENERATED_API_BINDINGS",
          "Phase 92 read-only evidence is accepted without scope leaks",
          "fixture fallback remains selected until owner signoff",
        ],
        switchActions: [
          "prepare read-only adapter import review",
          "keep generatedApiAvailable false",
          "keep tenant, plan, public renderer, and launch readiness fixtures active",
        ],
        postSwitchVerification: [
          "tenant and site queries match fixture scope",
          "public renderer keeps draft data hidden",
          "launch readiness keeps provider actions disabled",
        ],
        rollbackControls: [
          "return tenant, plan, public renderer, and launch readiness reads to fixtures",
          "leave generatedApiAvailable false",
          "record scope mismatch in the Phase 92 evidence ledger",
        ],
        adapterFlag: "generatedApiAvailable",
        blockedUntil: "Read-only hosted evidence and generated binding review are accepted.",
        canCutover: false,
        canImportGeneratedApi: false,
        generatedApiAvailable: false,
        providerWrites: false,
        liveConvexExecution: false,
      },
      {
        order: 20,
        batchId: "user-scoped-preferences",
        label: "User-scoped preference reads and writes",
        surfaceCount: 1,
        functionCount: 2,
        entryCriteria: [
          "read-only core cutover is accepted",
          "preference isolation and cleanup evidence are accepted",
          "preference rollback owner is named",
        ],
        switchActions: [
          "prepare preference adapter import review",
          "keep generatedApiAvailable false",
          "keep local preference fallback selected",
        ],
        postSwitchVerification: [
          "viewer reads only their own preference record",
          "reversible upsert cleanup restores shell defaults",
          "density, filters, site context, and landing page do not shift unexpectedly",
        ],
        rollbackControls: [
          "delete or overwrite smoke preference record",
          "restore fixture preference defaults",
          "pause user-scoped preference adapter switch",
        ],
        adapterFlag: "generatedApiAvailable",
        blockedUntil: "User preference smoke evidence and cleanup proof are accepted.",
        canCutover: false,
        canImportGeneratedApi: false,
        generatedApiAvailable: false,
        providerWrites: false,
        liveConvexExecution: false,
      },
      {
        order: 30,
        batchId: "site-creation-and-admin",
        label: "Site creation, invitations, and activation readiness",
        surfaceCount: 2,
        functionCount: 6,
        entryCriteria: [
          "client site factory read evidence is accepted",
          "smoke site cleanup policy is accepted",
          "invite delivery remains blocked until handoff signoff",
        ],
        switchActions: [
          "prepare activation and site factory adapter import review",
          "keep generatedApiAvailable false",
          "keep creation, invite, and publish actions disabled",
        ],
        postSwitchVerification: [
          "launch blueprint maps to selected site and permission preset",
          "activation readiness labels smoke data correctly",
          "client admin invitation remains gated",
        ],
        rollbackControls: [
          "archive smoke site records",
          "revoke pending smoke invitations before delivery",
          "return launch packets and permission presets to fixtures",
        ],
        adapterFlag: "generatedApiAvailable",
        blockedUntil: "Site factory smoke evidence, cleanup policy, and invite rollback are accepted.",
        canCutover: false,
        canImportGeneratedApi: false,
        generatedApiAvailable: false,
        providerWrites: false,
        liveConvexExecution: false,
      },
      {
        order: 40,
        batchId: "public-crm-loop",
        label: "Public lead capture and CRM workflow",
        surfaceCount: 1,
        functionCount: 6,
        entryCriteria: [
          "public resolver and lead smoke evidence are accepted",
          "notification providers remain paused",
          "smoke lead cleanup owner is named",
        ],
        switchActions: [
          "prepare CRM adapter import review",
          "keep generatedApiAvailable false",
          "keep public lead writes and workflow mutations gated",
        ],
        postSwitchVerification: [
          "journey rules remain site scoped",
          "lead transition appends timeline and audit evidence",
          "outbound notifications stay disabled",
        ],
        rollbackControls: [
          "mark smoke leads and CRM workflow data as test-only",
          "restore fixture CRM tables",
          "keep outbound notification providers paused",
        ],
        adapterFlag: "generatedApiAvailable",
        blockedUntil: "CRM smoke evidence, notification pause, and cleanup proof are accepted.",
        canCutover: false,
        canImportGeneratedApi: false,
        generatedApiAvailable: false,
        providerWrites: false,
        liveConvexExecution: false,
      },
      {
        order: 50,
        batchId: "provider-readiness-records",
        label: "Provider readiness metadata without provider writes",
        surfaceCount: 2,
        functionCount: 4,
        entryCriteria: [
          "provider metadata evidence excludes secret values",
          "DNS, SSL, email, SMS, storage, billing, and AI writes remain blocked",
          "metadata deactivation rollback is accepted",
        ],
        switchActions: [
          "prepare domain and integration adapter import review",
          "keep generatedApiAvailable false",
          "keep provider write paths disabled",
        ],
        postSwitchVerification: [
          "domain entitlement limits remain enforced",
          "integration settings never expose secret values",
          "provider call paths remain unreachable",
        ],
        rollbackControls: [
          "deactivate smoke metadata records",
          "return domain and integration readiness rows to fixtures",
          "keep provider env activation blocked",
        ],
        adapterFlag: "generatedApiAvailable",
        blockedUntil: "Metadata-only evidence, secret exclusion, and provider-call block proof are accepted.",
        canCutover: false,
        canImportGeneratedApi: false,
        generatedApiAvailable: false,
        providerWrites: false,
        liveConvexExecution: false,
      },
      {
        order: 60,
        batchId: "campaign-and-ai-governance",
        label: "Campaign and AI governance records",
        surfaceCount: 2,
        functionCount: 6,
        entryCriteria: [
          "campaign consent and provider-send pause are accepted",
          "AI provenance evidence shows no generation provider call",
          "publish rollback owner is named",
        ],
        switchActions: [
          "prepare campaign and AI review adapter import review",
          "keep generatedApiAvailable false",
          "keep sends, generation calls, and publish targets disabled",
        ],
        postSwitchVerification: [
          "campaign approval changes state without sending",
          "AI review decisions do not publish generated output",
          "email, SMS, automation, AI provider, and publish paths remain blocked",
        ],
        rollbackControls: [
          "pause or delete smoke campaign records",
          "revert AI review decisions",
          "restore fixture governance rows and keep generated output unpublished",
        ],
        adapterFlag: "generatedApiAvailable",
        blockedUntil: "Campaign and AI governance evidence, consent, and publish rollback are accepted.",
        canCutover: false,
        canImportGeneratedApi: false,
        generatedApiAvailable: false,
        providerWrites: false,
        liveConvexExecution: false,
      },
    ],
  },
};

const fixtureHostedSmokeGapBacklog: ShellHostedSmokeGapBacklog = {
  status: "provider_light_hosted_smoke_gap_backlog",
  totalGaps: 16,
  readOnlyGaps: 8,
  mutationGaps: 3,
  providerGatedGaps: 1,
  governanceGaps: 4,
  approvalGate: "Hosted smoke gap backlog cannot run until hosted Convex ownership, generated API review, live-smoke dry run, rollback owner, and Vambah's smoke execution approval are accepted.",
  providerBoundary: "This backlog is review-only. It does not create a hosted Convex deployment, run codegen, import generated API files, execute live Convex functions, write provider metadata, send campaigns, call AI providers, or publish client sites.",
  sourceDocuments: [
    "docs/convex-adapter-switch-plan.json",
    "docs/convex-live-smoke-manifest.json",
    "docs/phase89-adapter-switch-acceptance-matrix.md",
    "client/src/lib/kinfloGeneratedApiContract.ts",
  ],
  gaps: [
    {
      id: "launch-readiness-get-site-launch-readiness",
      batchId: "read-only-core",
      surface: "Launch readiness",
      functionName: "launchReadiness.getSiteLaunchReadiness",
      smokeMode: "read_only",
      localProof: "Phase 48 and the adapter switch acceptance matrix map launch readiness fixtures and keep provider actions gated.",
      hostedProofRequired: "Run a read-only hosted smoke that proves site:view scope, launch packet evidence, and provider action blocking for one approved smoke site.",
      rollbackArtifact: "Fixture launch readiness packet and adapter fallback remain authoritative if hosted gate state is overstated.",
      owner: "platform.super_admin",
      blockedUntil: "Read-only hosted smoke is approved after generated API review.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "preferences-get-my-preferences",
      batchId: "user-scoped-preferences",
      surface: "Admin experience preferences",
      functionName: "preferences.getMyPreferences",
      smokeMode: "read_only",
      localProof: "Phase 37 proves data mode, filters, density, and landing-page defaults through fixture-backed shell state.",
      hostedProofRequired: "Run a viewer-scoped hosted read confirming the signed-in user sees only their own preference record.",
      rollbackArtifact: "Local preference fallback restores density, filters, site context, and landing-page defaults.",
      owner: "platform.super_admin",
      blockedUntil: "User-scoped preference permission smoke is approved.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "preferences-upsert-my-preferences",
      batchId: "user-scoped-preferences",
      surface: "Admin experience preferences",
      functionName: "preferences.upsertMyPreferences",
      smokeMode: "mutation_smoke_required",
      localProof: "Phase 37 local edits remain fixture-backed and never persist through generated API imports.",
      hostedProofRequired: "Run one reversible preference upsert for the smoke user and confirm tenant/site scope checks hold.",
      rollbackArtifact: "Restore fixture preferences and delete or overwrite the smoke preference record.",
      owner: "platform.super_admin",
      blockedUntil: "Mutation smoke order and rollback owner are accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "site-factory-admin-permission-presets",
      batchId: "site-creation-and-admin",
      surface: "Site factory",
      functionName: "siteFactory.listClientWebsiteAdminPermissionPresets",
      smokeMode: "read_only",
      localProof: "Phase 58 maps client admin permission presets and keeps client handoff gated.",
      hostedProofRequired: "Run a read-only hosted preset query and confirm owner/invite roles remain tenant and site scoped.",
      rollbackArtifact: "Fixture permission presets remain active if hosted role scope diverges.",
      owner: "platform.super_admin",
      blockedUntil: "Client permission preset smoke is approved.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "site-factory-launch-blueprints",
      batchId: "site-creation-and-admin",
      surface: "Site factory",
      functionName: "siteFactory.listClientWebsiteLaunchBlueprints",
      smokeMode: "read_only",
      localProof: "Phase 56 maps launch blueprints, default pages, permission gates, and launch sequence fixtures.",
      hostedProofRequired: "Run a read-only hosted blueprint query and confirm it maps to the approved launch packet without enabling publish.",
      rollbackArtifact: "Fixture launch blueprint remains active if hosted blueprint content or permission gates diverge.",
      owner: "platform.super_admin",
      blockedUntil: "Launch blueprint read smoke is approved.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "crm-list-journey-progression-rules",
      batchId: "public-crm-loop",
      surface: "CRM lead workspace",
      functionName: "crm.listJourneyProgressionRules",
      smokeMode: "read_only",
      localProof: "Phase 34 maps journey progression rules and Phase 89 identifies the rule list as a CRM switch gap.",
      hostedProofRequired: "Run a tenant-scoped hosted read confirming progression rules do not leak across sites.",
      rollbackArtifact: "Fixture journey progression rules remain selected if hosted scope is wrong.",
      owner: "platform.super_admin",
      blockedUntil: "CRM journey read smoke is approved after public resolver and lead list smoke.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "crm-upsert-journey-progression-rule",
      batchId: "public-crm-loop",
      surface: "CRM lead workspace",
      functionName: "crm.upsertJourneyProgressionRule",
      smokeMode: "mutation_smoke_required",
      localProof: "Phase 34 validates the rule contract without running hosted mutations.",
      hostedProofRequired: "Run one reversible hosted rule upsert and confirm lead:manage authorization plus audit evidence.",
      rollbackArtifact: "Delete or mark the smoke rule as test-only and restore fixture CRM rule display.",
      owner: "platform.super_admin",
      blockedUntil: "CRM mutation smoke order, cleanup policy, and notification pause are accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "crm-transition-lead-stage",
      batchId: "public-crm-loop",
      surface: "CRM lead workspace",
      functionName: "crm.transitionLeadStage",
      smokeMode: "mutation_smoke_required",
      localProof: "Phase 89 lists lead-stage transition as missing from hosted smoke while CRM fixture transitions remain local.",
      hostedProofRequired: "Run one smoke lead stage transition and verify pipeline, journey, timeline, and audit events are appended.",
      rollbackArtifact: "Mark smoke lead workflow data as test-only and keep outbound notifications paused.",
      owner: "platform.super_admin",
      blockedUntil: "Public lead smoke, transition cleanup, and rollback owner are approved.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "integrations-list-integration-settings",
      batchId: "provider-readiness-records",
      surface: "Integration readiness",
      functionName: "integrations.listIntegrationSettings",
      smokeMode: "read_only",
      localProof: "Phase 45 maps provider settings, env key references, and activation evidence without secrets.",
      hostedProofRequired: "Run a read-only hosted integration-settings query and confirm secret values are excluded.",
      rollbackArtifact: "Fixture integration readiness rows remain active if hosted rows expose values or scope incorrectly.",
      owner: "platform.super_admin",
      blockedUntil: "Integration metadata smoke and secret-value exclusion review are approved.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "integrations-upsert-integration-setting",
      batchId: "provider-readiness-records",
      surface: "Integration readiness",
      functionName: "integrations.upsertIntegrationSetting",
      smokeMode: "provider_gated_metadata",
      localProof: "Phase 45 keeps provider readiness writes disabled while metadata fields are reviewable.",
      hostedProofRequired: "Run one metadata-only hosted upsert with secret values excluded and all provider calls disabled.",
      rollbackArtifact: "Return integration readiness rows to fixtures and deactivate the smoke metadata record.",
      owner: "platform.super_admin",
      blockedUntil: "Metadata-only provider boundary and rollback owner are accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "campaigns-list-campaign-drafts",
      batchId: "campaign-and-ai-governance",
      surface: "Campaign automation",
      functionName: "campaigns.listCampaignDrafts",
      smokeMode: "read_only",
      localProof: "Phase 46 maps campaign drafts, safety gates, and approval state in fixtures.",
      hostedProofRequired: "Run a read-only hosted campaign draft list and confirm campaign:manage scope and send gates.",
      rollbackArtifact: "Fixture campaign review state remains active if hosted draft scope diverges.",
      owner: "platform.super_admin",
      blockedUntil: "Campaign governance and consent smoke are approved.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "campaigns-upsert-campaign-draft",
      batchId: "campaign-and-ai-governance",
      surface: "Campaign automation",
      functionName: "campaigns.upsertCampaignDraft",
      smokeMode: "governance",
      localProof: "Phase 46 validates campaign draft editing without email, SMS, or automation sends.",
      hostedProofRequired: "Run one reversible campaign draft upsert and confirm provider send remains disabled.",
      rollbackArtifact: "Pause or delete the smoke campaign record and restore fixture campaign review state.",
      owner: "platform.super_admin",
      blockedUntil: "Campaign consent, provider-send rollback, and mutation order are accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "campaigns-approve-campaign-draft",
      batchId: "campaign-and-ai-governance",
      surface: "Campaign automation",
      functionName: "campaigns.approveCampaignDraft",
      smokeMode: "governance",
      localProof: "Phase 46 keeps live approval and live send buttons gated in the shell.",
      hostedProofRequired: "Run one approval-state hosted smoke that records approval without sending provider messages.",
      rollbackArtifact: "Revert the smoke draft approval state and keep email, SMS, and automation sends blocked.",
      owner: "platform.super_admin",
      blockedUntil: "Approval authority and provider-send signoff are accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "ai-review-list-generation-records",
      batchId: "campaign-and-ai-governance",
      surface: "AI review provenance",
      functionName: "aiReview.listAiGenerationRecords",
      smokeMode: "read_only",
      localProof: "Phase 47 maps AI prompt, source, output, reviewer, and publish target provenance.",
      hostedProofRequired: "Run a read-only hosted AI generation list and confirm ai:draft scope and provider calls remain absent.",
      rollbackArtifact: "Fixture AI review queue remains active if hosted provenance scope diverges.",
      owner: "platform.super_admin",
      blockedUntil: "AI provenance reviewer and provider-call boundary are approved.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "ai-review-upsert-generation-record",
      batchId: "campaign-and-ai-governance",
      surface: "AI review provenance",
      functionName: "aiReview.upsertAiGenerationRecord",
      smokeMode: "governance",
      localProof: "Phase 47 keeps AI output records local and blocks AI provider calls.",
      hostedProofRequired: "Run one hosted AI provenance record upsert using supplied metadata only, with no provider generation call.",
      rollbackArtifact: "Delete or mark the smoke AI generation record as test-only and keep generated output unpublished.",
      owner: "platform.super_admin",
      blockedUntil: "AI metadata-only smoke, reviewer owner, and rollback policy are accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "ai-review-review-generation-record",
      batchId: "campaign-and-ai-governance",
      surface: "AI review provenance",
      functionName: "aiReview.reviewAiGenerationRecord",
      smokeMode: "governance",
      localProof: "Phase 47 blocks live AI review and publish while provenance state remains inspectable.",
      hostedProofRequired: "Run one reviewer-decision hosted smoke and confirm publish target stays blocked.",
      rollbackArtifact: "Revert reviewer decision on the smoke AI record and keep publish/provider actions disabled.",
      owner: "platform.super_admin",
      blockedUntil: "AI reviewer authority and publish rollback are accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
  ],
};

const fixtureHostedSmokeExecutionSequencer: ShellHostedSmokeExecutionSequencer = {
  status: "provider_light_hosted_smoke_execution_sequencer",
  totalBatches: 6,
  totalFunctions: 16,
  readOnlyFirst: true,
  blockedBatches: 6,
  approvalGate: "Execution order is prepared only. Vambah must approve hosted ownership, generated API review, smoke window, rollback owner, and batch order before any hosted smoke runs.",
  providerBoundary: "This sequencer is local review metadata. It does not create a hosted Convex deployment, run codegen, import generated API files, execute live Convex functions, write provider metadata, send campaigns, call AI providers, publish sites, or read secrets.",
  sourceDocuments: [
    "docs/phase90-hosted-smoke-gap-backlog.md",
    "docs/convex-adapter-switch-plan.json",
    "docs/convex-live-smoke-manifest.json",
    "docs/phase89-adapter-switch-acceptance-matrix.md",
  ],
  batches: [
    {
      id: "read-only-core",
      order: 10,
      label: "Read-only core launch readiness",
      smokeMode: "read_only",
      functionCount: 1,
      functions: [
        "launchReadiness.getSiteLaunchReadiness",
      ],
      requiredBeforeRun: "Hosted Convex ownership, auth posture, generated API review, and read-only smoke approval are accepted.",
      evidenceTarget: "Capture launch readiness response, site:view scope, provider-action block state, and cross-tenant deny proof for the approved smoke site.",
      abortCondition: "Stop if site scope leaks, launch evidence is missing, provider action blocking is false, or generated API binding names diverge.",
      rollbackPlan: "Keep fixture launch readiness active and leave generatedApiAvailable false.",
      owner: "platform.super_admin",
      blockedUntil: "Hosted read-only smoke window is approved.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "user-scoped-preferences",
      order: 20,
      label: "User-scoped preference read and reversible write",
      smokeMode: "mixed",
      functionCount: 2,
      functions: [
        "preferences.getMyPreferences",
        "preferences.upsertMyPreferences",
      ],
      requiredBeforeRun: "Read-only user preference scope passes before one reversible preference upsert is authorized.",
      evidenceTarget: "Capture signed-in user isolation, tenant/site defaults, reversible upsert payload, and cleanup confirmation.",
      abortCondition: "Stop before mutation if another user can read the smoke preference, defaults cross tenant boundaries, or cleanup ownership is unclear.",
      rollbackPlan: "Delete or overwrite the smoke preference record and restore fixture density, filters, site context, and landing-page defaults.",
      owner: "platform.super_admin",
      blockedUntil: "Preference mutation smoke order and rollback owner are accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "site-creation-and-admin",
      order: 30,
      label: "Site factory blueprints and admin presets",
      smokeMode: "read_only",
      functionCount: 2,
      functions: [
        "siteFactory.listClientWebsiteAdminPermissionPresets",
        "siteFactory.listClientWebsiteLaunchBlueprints",
      ],
      requiredBeforeRun: "Client site fixture, permission preset, and launch packet owner are confirmed before hosted reads.",
      evidenceTarget: "Capture tenant-scoped preset and blueprint reads, owner/invite role mapping, default pages, permission gates, and publish disabled state.",
      abortCondition: "Stop if presets leak across tenants, launch packet links do not match the selected site, or publish/invite actions become enabled.",
      rollbackPlan: "Keep fixture permission presets and launch blueprints selected until hosted scope and launch packet mapping are accepted.",
      owner: "platform.super_admin",
      blockedUntil: "Client permission and launch blueprint read smokes are approved.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "public-crm-loop",
      order: 40,
      label: "CRM rules and lead-stage mutation path",
      smokeMode: "mixed",
      functionCount: 3,
      functions: [
        "crm.listJourneyProgressionRules",
        "crm.upsertJourneyProgressionRule",
        "crm.transitionLeadStage",
      ],
      requiredBeforeRun: "Public lead smoke, notification pause, cleanup policy, and CRM mutation rollback owner are accepted.",
      evidenceTarget: "Capture tenant-scoped rule reads, one reversible rule upsert, one smoke lead transition, timeline/audit append proof, and notification pause proof.",
      abortCondition: "Stop if outbound notifications are not paused, smoke lead data cannot be marked test-only, or audit events are missing.",
      rollbackPlan: "Delete or mark smoke CRM records as test-only, restore fixture journey rules, and keep outbound notifications paused.",
      owner: "platform.super_admin",
      blockedUntil: "CRM mutation smoke order and cleanup policy are accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "provider-readiness-records",
      order: 50,
      label: "Provider readiness metadata without provider writes",
      smokeMode: "provider_gated_metadata",
      functionCount: 2,
      functions: [
        "integrations.listIntegrationSettings",
        "integrations.upsertIntegrationSetting",
      ],
      requiredBeforeRun: "Secret-value exclusion, metadata-only write boundary, and provider-call block proof are accepted.",
      evidenceTarget: "Capture provider settings without secret values, one metadata-only upsert, and proof that DNS, email, payment, storage, and AI provider calls remain disabled.",
      abortCondition: "Stop if any secret value appears, provider call path is reachable, or metadata rows cannot be deactivated.",
      rollbackPlan: "Deactivate the smoke metadata record and return integration readiness rows to fixtures.",
      owner: "platform.super_admin",
      blockedUntil: "Metadata-only provider boundary and rollback owner are accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "campaign-and-ai-governance",
      order: 60,
      label: "Campaign and AI governance records",
      smokeMode: "governance",
      functionCount: 6,
      functions: [
        "campaigns.listCampaignDrafts",
        "campaigns.upsertCampaignDraft",
        "campaigns.approveCampaignDraft",
        "aiReview.listAiGenerationRecords",
        "aiReview.upsertAiGenerationRecord",
        "aiReview.reviewAiGenerationRecord",
      ],
      requiredBeforeRun: "Campaign consent, provider-send pause, AI provider-call block, reviewer authority, and publish rollback are accepted.",
      evidenceTarget: "Capture campaign draft read, reversible draft upsert, approval-state change without send, AI provenance read/upsert/review, and publish/provider blocks.",
      abortCondition: "Stop if email/SMS/automation send paths are reachable, AI generation calls can execute, or reviewer authority is ambiguous.",
      rollbackPlan: "Pause or delete smoke campaign records, revert AI review decisions, keep generated output unpublished, and restore fixture governance state.",
      owner: "platform.super_admin",
      blockedUntil: "Campaign and AI governance smoke order is accepted.",
      canRun: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
  ],
};

const fixtureHostedSmokeEvidenceLedger: ShellHostedSmokeEvidenceLedger = {
  status: "provider_light_hosted_smoke_evidence_ledger",
  totalEvidenceEntries: 6,
  pendingEntries: 6,
  totalFunctions: 16,
  blockedEntries: 6,
  approvalGate: "Evidence capture is prepared only. Hosted ownership, generated API review, smoke execution approval, rollback owner, and artifact storage path must be accepted before transcripts are recorded.",
  providerBoundary: "This evidence ledger is local review metadata. It does not create a hosted Convex deployment, run codegen, import generated API files, execute live Convex functions, record hosted transcripts, write provider metadata, send campaigns, call AI providers, publish sites, or read secrets.",
  sourceDocuments: [
    "docs/phase91-hosted-smoke-execution-sequencer.md",
    "docs/phase90-hosted-smoke-gap-backlog.md",
    "docs/convex-adapter-switch-plan.json",
    "docs/convex-live-smoke-manifest.json",
  ],
  entries: [
    {
      id: "evidence-read-only-core",
      batchId: "read-only-core",
      order: 10,
      label: "Read-only launch readiness transcript",
      status: "pending_human_gate",
      functionCount: 1,
      expectedTranscript: "Capture launch readiness response, site:view scope, provider-action block state, generated binding name, and cross-tenant deny proof.",
      evidenceSlots: [
        "hosted response excerpt without secrets",
        "site:view allow result",
        "cross-tenant deny result",
        "provider action disabled proof",
      ],
      acceptanceCriteria: [
        "launchReadiness.getSiteLaunchReadiness returns only the approved smoke site",
        "provider actions remain disabled",
        "no generated API binding name diverges from the contract",
      ],
      abortIf: "Stop if launch readiness leaks tenant data, provider actions enable, or the generated binding name diverges.",
      rollbackReference: "Keep fixture launch readiness selected and leave generatedApiAvailable false.",
      owner: "platform.super_admin",
      blockedUntil: "Read-only hosted smoke window and artifact storage path are approved.",
      canRecord: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "evidence-user-scoped-preferences",
      batchId: "user-scoped-preferences",
      order: 20,
      label: "User preference isolation and cleanup transcript",
      status: "pending_human_gate",
      functionCount: 2,
      expectedTranscript: "Capture preference read isolation, reversible upsert payload, cleanup confirmation, and restored fixture defaults.",
      evidenceSlots: [
        "signed-in user preference read",
        "other-user deny proof",
        "reversible upsert payload",
        "cleanup confirmation",
      ],
      acceptanceCriteria: [
        "preferences.getMyPreferences returns only the signed-in user's record",
        "preferences.upsertMyPreferences is reversible for the smoke user",
        "fixture defaults remain available after cleanup",
      ],
      abortIf: "Stop before mutation if preference scope leaks, cleanup ownership is unclear, or tenant/site defaults cross boundaries.",
      rollbackReference: "Delete or overwrite the smoke preference and restore fixture density, filters, site context, and landing-page defaults.",
      owner: "platform.super_admin",
      blockedUntil: "Preference mutation smoke order and rollback owner are accepted.",
      canRecord: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "evidence-site-creation-and-admin",
      batchId: "site-creation-and-admin",
      order: 30,
      label: "Client site factory scope transcript",
      status: "pending_human_gate",
      functionCount: 2,
      expectedTranscript: "Capture admin preset and launch blueprint reads, owner/invite role mapping, default page set, permission gates, and publish disabled state.",
      evidenceSlots: [
        "admin permission preset response",
        "launch blueprint response",
        "owner and invite role mapping",
        "publish and invite disabled proof",
      ],
      acceptanceCriteria: [
        "permission presets stay tenant and site scoped",
        "launch blueprints match the selected launch packet",
        "publish and invite actions remain gated",
      ],
      abortIf: "Stop if presets leak across tenants, blueprint content diverges from the selected site, or publish/invite actions enable.",
      rollbackReference: "Keep fixture permission presets and launch blueprints selected until hosted mapping is accepted.",
      owner: "platform.super_admin",
      blockedUntil: "Client permission and launch blueprint read smokes are approved.",
      canRecord: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "evidence-public-crm-loop",
      batchId: "public-crm-loop",
      order: 40,
      label: "CRM journey and lead transition transcript",
      status: "pending_human_gate",
      functionCount: 3,
      expectedTranscript: "Capture tenant-scoped rule reads, one reversible rule upsert, one smoke lead transition, timeline/audit append proof, and notification pause proof.",
      evidenceSlots: [
        "journey rule read response",
        "reversible rule upsert proof",
        "lead transition proof",
        "timeline and audit append evidence",
        "notification pause proof",
      ],
      acceptanceCriteria: [
        "journey rules do not leak across sites",
        "lead transition appends timeline and audit evidence",
        "outbound notifications remain paused",
      ],
      abortIf: "Stop if outbound notifications are reachable, smoke lead data cannot be marked test-only, or audit events are missing.",
      rollbackReference: "Delete or mark smoke CRM records as test-only, restore fixture journey rules, and keep notifications paused.",
      owner: "platform.super_admin",
      blockedUntil: "CRM mutation smoke order, cleanup policy, and rollback owner are accepted.",
      canRecord: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "evidence-provider-readiness-records",
      batchId: "provider-readiness-records",
      order: 50,
      label: "Provider metadata boundary transcript",
      status: "pending_human_gate",
      functionCount: 2,
      expectedTranscript: "Capture integration settings without secret values, one metadata-only upsert, deactivation proof, and provider-call disabled proof.",
      evidenceSlots: [
        "integration settings read without secret values",
        "metadata-only upsert payload",
        "metadata deactivation proof",
        "provider-call disabled proof",
      ],
      acceptanceCriteria: [
        "secret values never appear in reads or transcripts",
        "metadata writes do not call DNS, email, payment, storage, or AI providers",
        "smoke metadata can be deactivated",
      ],
      abortIf: "Stop if any secret value appears, a provider call path is reachable, or metadata rows cannot be deactivated.",
      rollbackReference: "Deactivate the smoke metadata record and return integration readiness rows to fixtures.",
      owner: "platform.super_admin",
      blockedUntil: "Metadata-only provider boundary and rollback owner are accepted.",
      canRecord: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      id: "evidence-campaign-and-ai-governance",
      batchId: "campaign-and-ai-governance",
      order: 60,
      label: "Campaign and AI governance transcript",
      status: "pending_human_gate",
      functionCount: 6,
      expectedTranscript: "Capture campaign draft read/upsert/approval without send, AI provenance read/upsert/review without generation, and publish/provider block proof.",
      evidenceSlots: [
        "campaign draft read response",
        "reversible campaign draft upsert proof",
        "approval-state change without send",
        "AI provenance read and upsert proof",
        "AI review decision proof",
        "publish and provider-call disabled proof",
      ],
      acceptanceCriteria: [
        "campaign approval does not send email, SMS, or automation messages",
        "AI provenance smokes do not call generation providers",
        "publish target remains blocked",
      ],
      abortIf: "Stop if email/SMS/automation send paths are reachable, AI generation can execute, or reviewer authority is ambiguous.",
      rollbackReference: "Pause or delete smoke campaign records, revert AI review decisions, keep generated output unpublished, and restore fixture governance state.",
      owner: "platform.super_admin",
      blockedUntil: "Campaign and AI governance smoke order, consent, provider-send pause, and publish rollback are accepted.",
      canRecord: false,
      providerWrites: false,
      liveConvexExecution: false,
    },
  ],
};

const fixtureHostedActivationRunbook: ShellHostedActivationRunbook = {
  status: "prepare_only_evidence_ledger",
  defaultStepId: "repo-sharing-risk",
  providerBoundary: "Hosted activation remains a prepare-only evidence ledger. The shell records approvals, commands, evidence targets, and rollback notes, but it does not provision Convex, run codegen, import generated API, execute live Convex functions, or call providers.",
  activationConsole: {
    status: "provider_light_activation_console",
    decision: "blocked_until_approval",
    nextHumanGate: "Approve hosted Convex ownership, billing, backup, auth, env policy, and codegen window before generated API files are created.",
    preActivationCommands: [
      "npm run kinflo:audit-secret-history",
      "npm run kinflo:inventory-env",
      "npm run kinflo:activation-preflight",
      "npm run kinflo:validate-generated-api",
      "npm run kinflo:validate-generated-api-review-board",
      "npm run kinflo:validate-live-smoke",
      "npm run kinflo:dry-run-live-smoke",
      "npm run kinflo:live-handoff",
      "npm run convex:check",
    ],
    blockedLiveActions: [
      "create hosted Convex deployment",
      "run npm run convex:codegen",
      "import generated Convex API module",
      "execute live Convex query, mutation, or action",
      "switch fixture adapter to generated API",
      "publish site, write lead, send invite, attach domain, send campaign, or call provider",
    ],
    evidenceSummary: [
      "Repo history posture and sharing decision are recorded before external/client review.",
      "Hosted Convex project URL and ownership notes are captured outside committed source.",
      "Generated bindings are reviewed against KINFLO_GENERATED_API_BINDINGS before imports.",
      "Read-only hosted smokes pass before mutation smokes.",
      "Cross-tenant deny proof is captured before adapter switch.",
      "Rollback path keeps generatedApiAvailable false until a reviewed switch lands.",
    ],
    providerBoundary: "This console is a read-only activation gate. It summarizes approvals, commands, evidence, and blocked actions only; it does not create providers, run codegen, import generated API, execute live Convex, or print secrets.",
  },
  generatedApiReviewBoard: {
    status: "provider_light_generated_api_review",
    totalBindings: 78,
    queryBindings: 40,
    mutationBindings: 38,
    smokeManifestFunctions: 45,
    smokeManifestGaps: 33,
    firstSwitchBatch: "read-only-core",
    approvalGate: "Run npm run convex:codegen only after hosted ownership, env policy, and generated binding review window are approved.",
    providerBoundary: "Generated API review is a local contract check only. It does not run codegen, commit convex/_generated files, import generated API, execute hosted Convex, read secrets, or switch the fixture adapter.",
    documents: [
      "client/src/lib/kinfloGeneratedApiContract.ts",
      "docs/phase26-generated-api-contract.md",
      "docs/convex-live-smoke-manifest.json",
      "docs/convex-adapter-switch-plan.json",
    ],
    surfaces: [
      {
        surface: "identity",
        totalBindings: 3,
        queryBindings: 1,
        mutationBindings: 2,
        reviewPosture: "ready_for_codegen_review",
        smokeCoverage: "covered by identity-bootstrap smoke",
        owner: "platform.super_admin",
        blockedUntil: "hosted auth and bootstrap approval",
      },
      {
        surface: "access",
        totalBindings: 5,
        queryBindings: 4,
        mutationBindings: 1,
        reviewPosture: "smoke_manifest_gap",
        smokeCoverage: "role catalog read coverage remains outside the live smoke manifest",
        owner: "platform.super_admin",
        blockedUntil: "role catalog read review and deny-check evidence",
      },
      {
        surface: "tenant control plane",
        totalBindings: 12,
        queryBindings: 4,
        mutationBindings: 8,
        reviewPosture: "smoke_manifest_gap",
        smokeCoverage: "invitation list read remains outside the live smoke manifest",
        owner: "platform.super_admin",
        blockedUntil: "tenant/site scope proof and invitation rollback review",
      },
      {
        surface: "plans and entitlements",
        totalBindings: 6,
        queryBindings: 4,
        mutationBindings: 2,
        reviewPosture: "ready_for_codegen_review",
        smokeCoverage: "covered by plan-entitlement-readonly and billing-entitlement-mutations smoke",
        owner: "platform.super_admin",
        blockedUntil: "billing provider boundary and override rollback accepted",
      },
      {
        surface: "site factory",
        totalBindings: 17,
        queryBindings: 16,
        mutationBindings: 1,
        requiredFunctions: [
          "siteFactory.listStarterTemplates",
          "siteFactory.listClientWebsiteAdminPermissionPresets",
          "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
          "siteFactory.listClientWebsiteConfigurationChangeSets",
          "siteFactory.listClientWebsiteConfigurationReviewPackets",
          "siteFactory.listClientWebsiteConfigurationProfiles",
          "siteFactory.listClientWebsiteLaunchBlueprints",
          "siteFactory.listClientWebsitePreviewReviewPackets",
          "siteFactory.createSiteFromTemplate",
        ],
        reviewPosture: "smoke_manifest_gap",
        smokeCoverage: "client website studio read models remain outside the live smoke manifest",
        owner: "platform.super_admin",
        blockedUntil: "client website review packets and template smoke are accepted",
      },
      {
        surface: "site builder",
        totalBindings: 10,
        queryBindings: 1,
        mutationBindings: 9,
        reviewPosture: "ready_for_codegen_review",
        smokeCoverage: "covered by site-builder-publish smoke",
        owner: "platform.super_admin",
        blockedUntil: "publish rollback and public resolver review",
      },
      {
        surface: "CRM",
        totalBindings: 10,
        queryBindings: 3,
        mutationBindings: 7,
        reviewPosture: "smoke_manifest_gap",
        smokeCoverage: "journey progression and transition smoke are not yet in the live manifest",
        owner: "platform.super_admin",
        blockedUntil: "lead-write cleanup and journey transition rollback owner",
      },
      {
        surface: "activation",
        totalBindings: 2,
        queryBindings: 1,
        mutationBindings: 1,
        reviewPosture: "ready_for_codegen_review",
        smokeCoverage: "covered by activation-seed smoke",
        owner: "platform.super_admin",
        blockedUntil: "smoke data cleanup policy accepted",
      },
      {
        surface: "public renderer",
        totalBindings: 1,
        queryBindings: 1,
        mutationBindings: 0,
        reviewPosture: "ready_for_codegen_review",
        smokeCoverage: "covered by public-renderer-readonly smoke",
        owner: "platform.super_admin",
        blockedUntil: "public-safe resolver proof and visual QA accepted",
      },
      {
        surface: "launch readiness",
        totalBindings: 1,
        queryBindings: 1,
        mutationBindings: 0,
        reviewPosture: "smoke_manifest_gap",
        smokeCoverage: "launchReadiness.getSiteLaunchReadiness remains outside the live smoke manifest",
        owner: "platform.super_admin",
        blockedUntil: "launch packet read-only hosted smoke added",
      },
      {
        surface: "experience preferences",
        totalBindings: 2,
        queryBindings: 1,
        mutationBindings: 1,
        reviewPosture: "smoke_manifest_gap",
        smokeCoverage: "preference read/write smoke remains outside the live smoke manifest",
        owner: "platform.super_admin",
        blockedUntil: "user-scoped preference permission proof",
      },
      {
        surface: "integration readiness",
        totalBindings: 2,
        queryBindings: 1,
        mutationBindings: 1,
        reviewPosture: "smoke_manifest_gap",
        smokeCoverage: "integration metadata smoke remains outside the live smoke manifest",
        owner: "platform.super_admin",
        blockedUntil: "secret-value exclusion and provider-write signoff",
      },
      {
        surface: "campaign automation",
        totalBindings: 4,
        queryBindings: 1,
        mutationBindings: 3,
        reviewPosture: "smoke_manifest_gap",
        smokeCoverage: "campaign governance smoke remains outside the live smoke manifest",
        owner: "platform.super_admin",
        blockedUntil: "campaign consent and provider-send rollback owner",
      },
      {
        surface: "AI review",
        totalBindings: 3,
        queryBindings: 1,
        mutationBindings: 2,
        reviewPosture: "smoke_manifest_gap",
        smokeCoverage: "AI provenance smoke remains outside the live smoke manifest",
        owner: "platform.super_admin",
        blockedUntil: "AI reviewer, source-safety, and provider-call signoff",
      },
    ],
  },
  hostedSmokeGapBacklog: fixtureHostedSmokeGapBacklog,
  hostedSmokeExecutionSequencer: fixtureHostedSmokeExecutionSequencer,
  hostedSmokeEvidenceLedger: fixtureHostedSmokeEvidenceLedger,
  decisionRegister: [
    {
      id: "credential-rotation-review",
      label: "Credential rotation review",
      owner: "Vambah",
      status: "pending_owner_decision",
      requiredBefore: "hosted env entry",
      decisionNeeded: "Confirm every credential family that may have appeared in historical .env.local has been rotated or accepted as already safe outside committed source.",
      evidenceTarget: "Provider-by-provider rotation note stored outside committed source; PR only records decision posture, never secret values.",
      approvedState: "Credential families are rotated or owner-confirmed before hosted env values are entered.",
      blockedUntil: "Historical .env.local exposure is reviewed in provider dashboards and 1Password.",
      providerBoundary: "This decision does not read, print, move, rotate, or validate secret values.",
    },
    {
      id: "history-purge-or-private-risk",
      label: "History purge or private-risk decision",
      owner: "Vambah",
      status: "pending_owner_decision",
      requiredBefore: "external/client sharing",
      decisionNeeded: "Choose whether to purge historical .env.local blobs or keep the repo private with accepted residual risk.",
      evidenceTarget: "Documented private-risk acceptance or integration-captain history purge plan.",
      approvedState: "Repository sharing posture is approved before public/client access.",
      blockedUntil: "Secret-history audit output is reviewed and sharing scope is decided.",
      providerBoundary: "This decision does not rewrite git history or expose historical file contents.",
    },
    {
      id: "hosted-convex-ownership",
      label: "Hosted Convex ownership",
      owner: "Vambah",
      status: "blocked_until_prior_gate",
      requiredBefore: "convex codegen",
      decisionNeeded: "Approve hosted Convex project ownership, billing, backup expectations, auth provider, and environment policy.",
      evidenceTarget: "Hosted project URL and owner/billing/backup notes captured outside committed source.",
      approvedState: "A single hosted Convex project is approved as the activation target.",
      blockedUntil: "Credential rotation and repository sharing posture decisions are recorded.",
      providerBoundary: "This decision does not create or select a hosted Convex deployment from the shell.",
    },
    {
      id: "env-and-codegen-window",
      label: "Env and codegen window",
      owner: "Vambah",
      status: "blocked_until_prior_gate",
      requiredBefore: "generated API import",
      decisionNeeded: "Approve when real env values may be entered locally and when `npm run convex:codegen` may run.",
      evidenceTarget: "Approved local-only codegen window plus `npm run kinflo:activation-preflight` output.",
      approvedState: "Generated API bindings can be produced and reviewed without committing secrets.",
      blockedUntil: "Hosted Convex ownership is approved.",
      providerBoundary: "This decision does not run codegen, import generated API files, or print env values.",
    },
    {
      id: "read-only-smoke-authorization",
      label: "Read-only smoke authorization",
      owner: "Vambah",
      status: "blocked_until_prior_gate",
      requiredBefore: "mutation smoke",
      decisionNeeded: "Approve read-only hosted smoke execution for activation readiness, role catalog, permissions, public resolver, launch readiness, and shell adapter parity.",
      evidenceTarget: "Read-only smoke transcript with no mutation writes beyond approved seed/readiness functions.",
      approvedState: "Read-only hosted smoke passes before any mutation smoke or adapter switch.",
      blockedUntil: "Generated API bindings are reviewed against KINFLO_GENERATED_API_BINDINGS.",
      providerBoundary: "This decision does not execute hosted Convex from the fixture shell.",
    },
    {
      id: "mutation-and-rollback-order",
      label: "Mutation and rollback order",
      owner: "Vambah",
      status: "blocked_until_prior_gate",
      requiredBefore: "adapter switch",
      decisionNeeded: "Approve the mutation smoke sequence, rollback owner, rollback command path, and conditions for returning to fixtures.",
      evidenceTarget: "Ordered smoke packet plus rollback note that keeps generatedApiAvailable false until switch review passes.",
      approvedState: "Mutation smoke order and rollback path are approved before the shell can move off fixtures.",
      blockedUntil: "Read-only hosted smokes pass.",
      providerBoundary: "This decision does not switch adapters or execute mutation smokes.",
    },
    {
      id: "adapter-switch-review",
      label: "Adapter switch review",
      owner: "Vambah",
      status: "blocked_until_prior_gate",
      requiredBefore: "live shell data",
      decisionNeeded: "Approve replacing fixture reads with generated API bindings one surface at a time after hosted smoke evidence passes.",
      evidenceTarget: "Surface-level adapter switch evidence, rollback confirmation, generated binding review, and no cross-tenant scope leak.",
      approvedState: "One approved surface can move from fixture data to generated API bindings in a scoped PR.",
      blockedUntil: "Mutation smoke order, rollback path, and hosted evidence ledger are accepted.",
      providerBoundary: "This decision does not import generated API files, switch adapters, or execute live shell reads.",
    },
    {
      id: "provider-write-and-client-launch-signoff",
      label: "Provider-write and client launch signoff",
      owner: "Vambah",
      status: "blocked_until_prior_gate",
      requiredBefore: "public/client launch",
      decisionNeeded: "Approve provider writes for invite delivery, email/SMS, billing, storage, domains, campaigns, AI, lead writes, and client sharing.",
      evidenceTarget: "Provider readiness notes, launch decision packet, visual QA evidence, rollback plan, and client sharing approval.",
      approvedState: "Client launch can proceed only after hosted smokes, provider readiness, and launch signoffs pass.",
      blockedUntil: "Adapter switch review and launch decision packets are approved.",
      providerBoundary: "This decision does not publish sites, write leads, send messages, attach domains, bill customers, or call providers.",
    },
  ],
  documents: [
    "docs/convex-hosted-activation-packet.json",
    "docs/convex-hosted-activation-ledger.json",
    "docs/convex-live-smoke-manifest.json",
    "docs/phase49-hosted-activation-packet.md",
    "docs/phase53-hosted-activation-ledger.md",
  ],
  steps: [
    {
      order: 10,
      id: "repo-sharing-risk",
      label: "Repo sharing risk posture",
      owner: "Vambah",
      requiredBefore: "external review",
      commandOrAction: "Approve history purge or private-repo residual-risk posture before public/client sharing.",
      evidenceTarget: "Secret-history audit result plus explicit sharing decision.",
      rollback: "Keep repository private and pause external/client review until history posture is approved.",
      status: "pending_approval",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 20,
      id: "hosted-convex-project",
      label: "Hosted Convex ownership",
      owner: "Vambah",
      requiredBefore: "convex codegen",
      commandOrAction: "Create or select hosted Convex project with ownership, billing, backup, auth, and env policy approved.",
      evidenceTarget: "Convex dashboard project URL and owner/billing/backup notes captured outside committed source.",
      rollback: "Keep all shell surfaces on fixtures and do not run hosted Convex commands.",
      status: "blocked_provider_gate",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 30,
      id: "env-and-codegen-approval",
      label: "Env and codegen approval",
      owner: "Vambah",
      requiredBefore: "generated API import",
      commandOrAction: "Configure Convex/auth env values outside committed source, then approve npm run convex:codegen.",
      evidenceTarget: "Generated bindings reviewed against KINFLO_GENERATED_API_BINDINGS without committing secrets.",
      rollback: "Delete generated files from the working tree and keep generatedApiAvailable false.",
      status: "blocked_provider_gate",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 40,
      id: "read-only-smoke-window",
      label: "Read-only hosted smokes",
      owner: "Vambah",
      requiredBefore: "mutation smoke",
      commandOrAction: "Run activation.readiness, viewer, role/access, tenant/site, public renderer, and launch readiness reads first.",
      evidenceTarget: "Read-only smoke outputs prove tenant/site scope and launchReadiness.getSiteLaunchReadiness parity.",
      rollback: "Stop activation and keep fixtureKinfloShellAdapter selected if any read leaks scope or mismatches fixture expectations.",
      status: "ready_after_approval",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 50,
      id: "mutation-smoke-window",
      label: "Mutation smoke order",
      owner: "Vambah",
      requiredBefore: "adapter switch",
      commandOrAction: "Run mutation smokes in docs/convex-live-smoke-manifest.json order after read-only smokes pass.",
      evidenceTarget: "Audit events, rollback notes, and smoke record ids captured for tenant, site, invite, publish, and lead flows.",
      rollback: "Archive smoke data and pause all mutation/provider steps on any permission, audit, or cleanup failure.",
      status: "ready_after_approval",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 60,
      id: "adapter-switch-review",
      label: "Fixture-to-live adapter switch",
      owner: "Vambah",
      requiredBefore: "live shell data",
      commandOrAction: "Switch adapters one surface at a time only after its smoke evidence passes.",
      evidenceTarget: "Surface-level switch evidence from Adapter Switch Readiness with rollback confirmed.",
      rollback: "Return the affected surface to fixture data and keep every other surface blocked until reviewed.",
      status: "pending_approval",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 70,
      id: "provider-write-approvals",
      label: "Provider write approvals",
      owner: "Vambah",
      requiredBefore: "DNS, billing, communications, storage, or AI writes",
      commandOrAction: "Approve each non-Convex provider separately: DNS, SSL, Vercel domain, Stripe, SendGrid, Twilio, storage, and AI.",
      evidenceTarget: "Separate provider smoke packet with consent, unsubscribe, usage cap, source-safety, and rollback proof.",
      rollback: "Keep provider metadata local and leave sends/uploads/domain attachment/AI generation disabled.",
      status: "blocked_provider_gate",
      providerWrites: false,
      liveConvexExecution: false,
    },
  ],
  completionRules: [
    "No hosted Convex deployment is created by this phase.",
    "No generated API is imported.",
    "No live Convex query, mutation, or action is executed.",
    "No provider API is touched.",
    "Every step remains review-only until Vambah approves the matching hosted gate.",
  ],
  evidenceTargets: [
    "activation.readiness hosted output",
    "launchReadiness.getSiteLaunchReadiness hosted output for Julie and one new client site",
    "publicSite.resolvePublishedSite hosted output for a published smoke page",
    "crm.submitLead smoke lead id plus crm.listLeads scoped proof",
    "controlPlane.listAuditEvents audit entries for identity, activation, site creation, invitation, publish, and lead capture",
    "cross-tenant deny proof for client admin role",
  ],
};

const fixtureSiteCreationWizard: ShellSiteCreationWizard = {
  defaultSiteName: "Advisor Client Site",
  defaultSubdomain: "advisor-client",
  defaultTemplateKey: "advisor-consultant",
  brandToneOptions: ["Calm advisory", "Community program", "Campaign urgency"],
  ownerRoleOptions: ["tenant.admin", "site.admin", "site.editor"],
  pageOptions: [
    { key: "home", label: "Home", required: true },
    { key: "services", label: "Services", required: true },
    { key: "proof", label: "Proof", required: false },
    { key: "intake", label: "Intake", required: true },
    { key: "privacy", label: "Privacy", required: true },
  ],
  readinessChecks: [
    "Template selected",
    "Site and subdomain named",
    "Required pages selected",
    "Owner role scoped",
    "Preview route prepared",
    "Live Convex smoke pending",
  ],
  convexMutations: [
    "controlPlane.createTenant",
    "siteFactory.createSiteFromTemplate",
    "controlPlane.createInvitation",
    "publicSite.resolvePublishedSite",
  ],
};

const fixtureLaunchReadiness: ShellLaunchReadiness = {
  defaultSiteKey: "advisor-client-site",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  sites: [
    {
      key: "advisor-client-site",
      label: "Advisor Client Site",
      tenant: "Advisor Client Starter",
      previewPath: "/kinflo-sites/advisor-client-site",
      readinessPercent: 76,
      launchDecision: "needs_work",
      blockerSummary: "Ready for Vambah review; blocked from live launch until domain, provider smoke, and hosted Convex activation pass.",
      stages: [
        {
          key: "site-factory",
          label: "Tenant and site packet",
          surface: "Site Factory",
          status: "ready",
          owner: "Super admin",
          evidence: "Advisor Client Starter launch packet and site creation wizard are complete.",
          gate: "Live mutation gated",
          convexFunctions: ["controlPlane.createTenant", "siteFactory.createSiteFromTemplate"],
        },
        {
          key: "access",
          label: "Client admin access",
          surface: "Access Delegation",
          status: "ready",
          owner: "Super admin",
          evidence: "tenant.admin invite target and token-hash-only contract are prepared.",
          gate: "Live invite gated",
          convexFunctions: ["controlPlane.createInvitation", "controlPlane.grantMembership"],
        },
        {
          key: "brand-content-nav",
          label: "Brand, content, and navigation",
          surface: "Brand, Content, Nav",
          status: "ready",
          owner: "Client admin",
          evidence: "Theme, homepage blocks, and header/footer navigation are present in fixture preview.",
          gate: "Live save and publish gated",
          convexFunctions: ["controlPlane.updateThemeTokens", "siteBuilder.updateContentBlock", "siteBuilder.upsertNavigationItem"],
        },
        {
          key: "preview-lead",
          label: "Preview and lead capture",
          surface: "Preview QA and CRM",
          status: "ready",
          owner: "Super admin",
          evidence: "Public preview route and crm.submitLead fallback contract are visible.",
          gate: "Live lead smoke gated",
          convexFunctions: ["publicSite.resolvePublishedSite", "crm.submitLead", "crm.listLeads"],
        },
        {
          key: "domain",
          label: "Domain readiness",
          surface: "Domain Readiness",
          status: "pending",
          owner: "Super admin",
          evidence: "Domain metadata exists, but DNS ownership and SSL provider proof are not live.",
          gate: "Live DNS save gated",
          convexFunctions: ["siteBuilder.upsertDomain", "entitlements.checkEntitlementLimit"],
        },
        {
          key: "providers",
          label: "Provider integrations",
          surface: "Integration Readiness",
          status: "pending",
          owner: "Super admin",
          evidence: "Provider records name env keys only; no SendGrid, Stripe, Twilio, storage, or AI smoke has run.",
          gate: "Live provider save gated",
          convexFunctions: ["integrations.listIntegrationSettings", "integrations.upsertIntegrationSetting"],
        },
        {
          key: "growth",
          label: "Campaign and AI review",
          surface: "Campaigns and AI Review",
          status: "pending",
          owner: "Client admin",
          evidence: "Campaign and AI provenance records are reviewable, but provider sends and generated content publish remain disabled.",
          gate: "Live send and AI publish gated",
          convexFunctions: ["campaigns.approveCampaignDraft", "aiReview.reviewAiGenerationRecord"],
        },
      ],
    },
    {
      key: "campaign-microsite",
      label: "Campaign Microsite",
      tenant: "Campaign Microsite Lab",
      previewPath: "/kinflo-sites/campaign-microsite",
      readinessPercent: 68,
      launchDecision: "needs_work",
      blockerSummary: "Campaign preview is prepared; launch waits on copy approval, AI review approval, consent language, and live public form smoke.",
      stages: [
        {
          key: "site-factory",
          label: "Microsite packet",
          surface: "Site Factory",
          status: "ready",
          owner: "Super admin",
          evidence: "Campaign microsite packet is queued with site.editor scope.",
          gate: "Live mutation gated",
          convexFunctions: ["siteFactory.createSiteFromTemplate", "controlPlane.createInvitation"],
        },
        {
          key: "content",
          label: "Campaign content",
          surface: "Content Draft Studio",
          status: "pending",
          owner: "Campaign editor",
          evidence: "Campaign proof block has AI provenance but needs final source-safe approval.",
          gate: "Live publish gated",
          convexFunctions: ["siteBuilder.updateContentBlock", "aiReview.reviewAiGenerationRecord"],
        },
        {
          key: "lead-capture",
          label: "Lead capture",
          surface: "Public Intake",
          status: "ready",
          owner: "Super admin",
          evidence: "Campaign microsite signup contract maps to crm.submitLead.",
          gate: "Live public form smoke gated",
          convexFunctions: ["publicSite.resolvePublishedSite", "crm.submitLead"],
        },
        {
          key: "campaign-send",
          label: "Campaign automation",
          surface: "Campaign Automation",
          status: "blocked",
          owner: "Super admin",
          evidence: "Consent, unsubscribe, quiet-hour, and provider-send smokes are not complete.",
          gate: "Live send gated",
          convexFunctions: ["campaigns.requestCampaignApproval", "campaigns.approveCampaignDraft"],
        },
      ],
    },
    {
      key: "julies-family-public",
      label: "Julie Family Public Site",
      tenant: "Julie's Family Learning Programs",
      previewPath: "/kinflo-sites/julies-family",
      readinessPercent: 84,
      launchDecision: "ready_for_review",
      blockerSummary: "Best current proof surface; still not production-active because hosted Convex/codegen/live smoke are pending.",
      stages: [
        {
          key: "public-renderer",
          label: "Public renderer",
          surface: "Public Preview",
          status: "ready",
          owner: "Super admin",
          evidence: "Julie public preview renders hero, services, and intake from fixture-backed site data.",
          gate: "Live renderer smoke gated",
          convexFunctions: ["publicSite.resolvePublishedSite"],
        },
        {
          key: "crm",
          label: "CRM intake",
          surface: "CRM Lead Workspace",
          status: "ready",
          owner: "Program lead",
          evidence: "Family learning intake maps to crm.submitLead and scoped CRM review.",
          gate: "Live lead write gated",
          convexFunctions: ["crm.submitLead", "crm.listLeads"],
        },
        {
          key: "domain-provider",
          label: "Hosted activation",
          surface: "Live Convex handoff",
          status: "pending",
          owner: "Super admin",
          evidence: "Generated API, hosted auth, domain, and provider smokes remain pending.",
          gate: "Convex deployment and generated API gated",
          convexFunctions: ["launchReadiness.getSiteLaunchReadiness", "activation.readiness"],
        },
      ],
    },
  ],
  providerBoundary: "Launch readiness is a local evidence packet only. It does not create tenants, invite users, publish content, attach domains, send campaigns, call AI providers, submit leads, or execute live Convex functions.",
  convexFunctions: [
    "launchReadiness.getSiteLaunchReadiness",
    "activation.readiness",
    "publicSite.resolvePublishedSite",
    "crm.submitLead",
  ],
  activationEvidence: [
    "site:view is required to read launch readiness",
    "readiness combines existing site-scoped contracts into one review packet",
    "provider actions stay behind their original disabled gates",
    "live launch requires hosted Convex, generated API bindings, and browser smoke",
  ],
};

const fixtureLaunchGates: ShellLaunchGate[] = [
  { label: "Phase 0 source import", status: "done" },
  { label: "Secret handling baseline", status: "done" },
  { label: "Drizzle-to-Convex map", status: "done" },
  { label: "Convex control plane", status: "done" },
  { label: "Site builder schema", status: "done" },
  { label: "Template factory", status: "done" },
  { label: "Public resolver", status: "done" },
  { label: "Invitation lifecycle", status: "done" },
  { label: "Role catalog", status: "done" },
  { label: "Access policy", status: "done" },
  { label: "Permission guard migration", status: "done" },
  { label: "Import contracts", status: "done" },
  { label: "CRM lead spine", status: "done" },
  { label: "Public lead capture adapter", status: "done" },
  { label: "Public site preview renderer", status: "done" },
  { label: "Site factory launch packets", status: "done" },
  { label: "Convex activation preflight", status: "done" },
  { label: "Convex runtime boundary", status: "done" },
  { label: "Template quality contracts", status: "done" },
  { label: "Site creation wizard contract", status: "done" },
  { label: "Plan entitlement contracts", status: "done" },
  { label: "Entitlement guard contracts", status: "done" },
  { label: "Custom domain entitlement guard", status: "done" },
  { label: "Live Convex handoff checklist", status: "done" },
  { label: "Live smoke manifest", status: "done" },
  { label: "Live smoke dry runner", status: "done" },
  { label: "TypeScript baseline gate", status: "done" },
  { label: "Admin preferences shell", status: "done" },
  { label: "Access delegation shell", status: "done" },
  { label: "Content draft shell", status: "done" },
  { label: "Brand theme shell", status: "done" },
  { label: "Navigation builder shell", status: "done" },
  { label: "Preview QA shell", status: "done" },
  { label: "Asset library shell", status: "done" },
  { label: "Domain readiness shell", status: "done" },
  { label: "Integration readiness shell", status: "done" },
  { label: "Campaign automation shell", status: "done" },
  { label: "AI review provenance shell", status: "done" },
  { label: "Launch readiness shell", status: "done" },
  { label: "Convex deployment and generated API", status: "pending" },
  { label: "Live admin smoke", status: "pending" },
];

function buildMetrics(): ShellMetric[] {
  const publishedSites = fixtureSites.filter((site) => site.status === "published").length;
  const draftSites = fixtureSites.filter((site) => site.status === "draft").length;
  const completeGates = fixtureLaunchGates.filter((gate) => gate.status === "done").length;
  const activeLeads = fixtureLeads.filter((lead) => lead.status === "active" || lead.status === "nurture").length;

  return [
    {
      label: "Tenants",
      value: String(fixtureTenants.length),
      detail: "1 platform seed, 2 templates queued",
      iconKey: "tenants",
    },
    {
      label: "Sites",
      value: String(fixtureSites.length),
      detail: `${publishedSites} published, ${draftSites} in draft`,
      iconKey: "sites",
    },
    {
      label: "Templates",
      value: String(fixtureTemplates.length),
      detail: "Learning, advisory, campaign",
      iconKey: "templates",
    },
    {
      label: "Leads",
      value: String(fixtureLeads.length),
      detail: `${activeLeads} active or nurturing`,
      iconKey: "leads",
    },
    {
      label: "Launch Gates",
      value: `${completeGates}/${fixtureLaunchGates.length}`,
      detail: "Convex auth, codegen, and live execution remain",
      iconKey: "launchGates",
    },
  ];
}

export const fixtureKinfloShellAdapter: KinfloShellDataAdapter = {
  mode: "fixture",
  getSnapshot: () => {
    const runtime = getKinfloConvexRuntime();

    return {
      dataMode: {
        label: "Fixture Data",
        description: "Convex API bindings are not generated yet. This shell is using typed fixture data that mirrors the Convex control-plane contract.",
        source: "fixture",
        runtimeMode: runtime.mode,
        runtimeLabel: runtime.label,
        activationGate: runtime.activationGate,
        convexFunctions: runtime.functionNames,
      },
      activeObjectSignal: fixtureActiveObjectSignal,
      metrics: buildMetrics(),
      liveAdapterBindings: fixtureLiveAdapterBindings,
      tenants: fixtureTenants,
      sites: fixtureSites,
      billingPlans: fixtureBillingPlans,
      tenantEntitlements: fixtureTenantEntitlements,
      templates: fixtureTemplates,
      contentDraft: fixtureContentDraft,
      brandTheme: fixtureBrandTheme,
      navigationDraft: fixtureNavigationDraft,
      previewStudio: fixturePreviewStudio,
      clientWebsiteStudio: fixtureClientWebsiteStudio,
      assetLibrary: fixtureAssetLibrary,
      domainReadiness: fixtureDomainReadiness,
      integrationReadiness: fixtureIntegrationReadiness,
      campaignAutomation: fixtureCampaignAutomation,
      aiReview: fixtureAiReview,
      experienceControls: fixtureExperienceControls,
      experiencePreferences: fixtureExperiencePreferences,
      roles: fixtureRoles,
      accessDelegation: fixtureAccessDelegation,
      leads: fixtureLeads,
      pipelineStages: fixturePipelineStages,
      tasks: fixtureTasks,
      leadCaptureContracts: fixtureLeadCaptureContracts,
      siteLaunchPackets: fixtureSiteLaunchPackets,
      siteCreationWizard: fixtureSiteCreationWizard,
      launchReadiness: fixtureLaunchReadiness,
      adapterSwitchReadiness: fixtureAdapterSwitchReadiness,
      hostedActivationRunbook: fixtureHostedActivationRunbook,
      launchGates: fixtureLaunchGates,
    };
  },
};

export const liveKinfloShellAdapter: KinfloShellDataAdapter = {
  mode: "convex",
  getSnapshot: () => {
    const runtime = getKinfloConvexRuntime();

    if (!runtime.canUseLiveData) {
      throw new Error("Live KinFlo shell adapter is gated until Convex URL, generated API bindings, and activation smoke are ready.");
    }

    throw new Error("Live KinFlo shell adapter requires generated Convex API bindings before fixture reads can be replaced.");
  },
};

export function selectKinfloShellDataAdapter() {
  const runtime = getKinfloConvexRuntime();
  return runtime.canUseLiveData ? liveKinfloShellAdapter : fixtureKinfloShellAdapter;
}

export function getKinfloShellSnapshot(adapter: KinfloShellDataAdapter = selectKinfloShellDataAdapter()) {
  return adapter.getSnapshot();
}
