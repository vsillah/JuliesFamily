export const VANGUARD_ORDER_PORTAL_PATH = "/kinflo-sites/vanguard-enterprises/orders";
export const VANGUARD_LOCAL_RECEIPT_STORAGE_KEY = "kinflo:vanguard:local-receipt:v1";

export type VanguardLocalReceipt = {
  schemaVersion: 1;
  receiptId: "VE-RRB-PREVIEW";
  source: "vanguard-reversr-embedded-intake";
  persistence: "session_local";
  sourcePackage: string[];
  goal: string;
  discipline: string;
  constraints: string[];
};

export type VanguardPortalMilestone = {
  key: string;
  label: string;
  state: "complete" | "current" | "upcoming";
  clientDetail: string;
};

export type VanguardPortalOrderFixture = {
  orderNumber: string;
  title: string;
  status: "intake_review";
  clientStatusLabel: string;
  dataMode: "synthetic_preview";
  lastUpdatedLabel: string;
  nextAction: string;
  milestones: VanguardPortalMilestone[];
};

export type VanguardAssistMode = "assist" | "co_edit" | "takeover";
export type VanguardDraftVisibility = "private" | "share_requested" | "shared" | "expired" | "revoked";
export type VanguardAssistConsentStatus = "not_granted" | "pending" | "active" | "expired" | "revoked";

export type VanguardAssistActivity = {
  id: string;
  actor: "client" | "associate" | "system";
  label: string;
  detail: string;
  occurredAtLabel: string;
};

export type VanguardAssistQueueItem = {
  requestNumber: string;
  orderNumber: string;
  title: string;
  visibility: VanguardDraftVisibility;
  visibilityLabel: string;
  consentStatus: VanguardAssistConsentStatus;
  consentLabel: string;
  mode: VanguardAssistMode;
  modeLabel: string;
  currentSection: string;
  sharedFields: string[];
  excludedFields: string[];
  expiresAtLabel: string;
  nextStep: string;
  activity: VanguardAssistActivity[];
};

export type VanguardOperationsQueueState =
  | "unassigned"
  | "intake_review"
  | "waiting_on_client"
  | "quote_ready"
  | "accepted_unplanned"
  | "in_progress"
  | "blocked"
  | "quality_review"
  | "ready_for_delivery"
  | "overdue";

export type VanguardAssignmentState = "unassigned" | "proposed" | "assigned" | "reassignment_review";
export type VanguardCapacityBand = "available" | "balanced" | "near_limit" | "at_limit";
export type VanguardOperationsRisk = "on_track" | "watch" | "at_risk" | "breached";

export type VanguardOperationsQueueItem = {
  orderNumber: string;
  title: string;
  queueState: VanguardOperationsQueueState;
  queueLabel: string;
  assignmentState: VanguardAssignmentState;
  assignmentLabel: string;
  discipline: string;
  requiredRole: string;
  dueLabel: string;
  ageLabel: string;
  risk: VanguardOperationsRisk;
  riskLabel: string;
  primaryOwner: string;
  blocker: string | null;
  escalationOwner: string;
  nextAction: string;
  evidenceLabel: string;
  auditEventCount: number;
};

export type VanguardCapacitySnapshot = {
  discipline: string;
  band: VanguardCapacityBand;
  bandLabel: string;
  activeWork: number;
  workLimit: number;
  availableSlots: number;
  routingNote: string;
};

export type VanguardInventoryReservationStatus = "not_reserved" | "partially_reserved" | "reserved" | "unavailable";
export type VanguardManufacturingDocumentStatus = "draft" | "in_review" | "issued" | "superseded";
export type VanguardQualityCheckStatus = "not_ready" | "ready" | "passed" | "hold" | "failed";
export type VanguardDeliveryReadiness = "blocked" | "assembling" | "review" | "ready";

export type VanguardMaterialRequirement = {
  id: string;
  itemName: string;
  requiredQuantity: string;
  availableQuantity: string;
  reservationStatus: VanguardInventoryReservationStatus;
  reservationLabel: string;
  needByLabel: string;
  evidenceLabel: string;
  blocker: string | null;
};

export type VanguardManufacturingDocumentVersion = {
  id: string;
  documentName: string;
  versionLabel: string;
  status: VanguardManufacturingDocumentStatus;
  statusLabel: string;
  preparedBy: string;
  reviewedAtLabel: string;
  evidenceLabel: string;
};

export type VanguardQualityCheck = {
  id: string;
  label: string;
  owner: string;
  status: VanguardQualityCheckStatus;
  statusLabel: string;
  requirement: string;
  evidenceLabel: string;
};

export type VanguardReceiptPrerequisite = {
  id: string;
  label: string;
  state: "complete" | "pending" | "blocked";
  stateLabel: string;
  detail: string;
};

export type VanguardFulfillmentEvidenceRecord = {
  orderNumber: string;
  title: string;
  queueState: Extract<VanguardOperationsQueueState, "in_progress" | "blocked" | "quality_review" | "ready_for_delivery">;
  queueLabel: string;
  deliveryReadiness: VanguardDeliveryReadiness;
  deliveryReadinessLabel: string;
  materials: VanguardMaterialRequirement[];
  documents: VanguardManufacturingDocumentVersion[];
  qualityChecks: VanguardQualityCheck[];
  receiptPrerequisites: VanguardReceiptPrerequisite[];
  deliveryEvidence: string[];
  blockedNextAction: string;
  recoveryStep: string;
  auditEventCount: number;
};

export const vanguardAssociateAssistContract = {
  systemOfRecord: "convex" as const,
  identityMode: "required_unavailable" as const,
  dataMode: "sample_queue" as const,
  liveAssistEnabled: false,
  providerWritesEnabled: false,
  generatedApiImportApproved: false,
  privateUploadsEnabled: false,
  visibilityStates: ["private", "share_requested", "shared", "expired", "revoked"] as const,
  consentStates: ["not_granted", "pending", "active", "expired", "revoked"] as const,
  modes: [
    {
      key: "assist",
      clientLabel: "Get guidance",
      associateLabel: "Assist",
      summary: "An associate can review the fields you share and leave comments.",
      scopes: ["view_draft", "comment"],
    },
    {
      key: "co_edit",
      clientLabel: "Work together",
      associateLabel: "Co-edit",
      summary: "An associate can comment and edit the fields you choose to share.",
      scopes: ["view_draft", "comment", "edit_draft"],
    },
    {
      key: "takeover",
      clientLabel: "Prepare it for me",
      associateLabel: "Prepare for client",
      summary: "An associate can complete the shared draft, then return it for your confirmation.",
      scopes: ["view_draft", "comment", "edit_draft", "submit_for_client", "takeover_session"],
    },
  ] as const,
  consentRules: [
    "The client chooses which draft fields an associate can see.",
    "Access expires at the stated time and can be revoked sooner.",
    "Every view, comment, edit, handoff, and revoke action is recorded.",
    "Submission still requires the client's final confirmation.",
  ],
  privacyBoundary: "Associates can only see fields the client chooses to share. Private files and uploads stay excluded.",
  blockedReason: "Client sign-in and an active sharing grant are required before an associate can open or change a draft.",
  recoveryStep: "Sign in, review the shared fields, choose an assistance level, and confirm the access end time.",
  handoffRules: {
    clientStartsSharing: true,
    associateAcceptsAssignment: true,
    revisionAwareEdits: true,
    clientOwnsSessionByDefault: true,
    revokeEndsAccessImmediately: true,
    expiredOrRevokedResumeRequiresNewConsent: true,
    takeoverReturnsToClientForConfirmation: true,
  },
};

export const vanguardAssistQueueFixture: VanguardAssistQueueItem = {
  requestNumber: "VA-DEMO-07",
  orderNumber: "VE-DEMO-1042",
  title: "Stainless mounting bracket rebuild",
  visibility: "shared",
  visibilityLabel: "Shared fields only",
  consentStatus: "active",
  consentLabel: "Active for this review",
  mode: "co_edit",
  modeLabel: "Co-edit",
  currentSection: "Build goal and constraints",
  sharedFields: ["Build goal", "Discipline", "Constraints", "Source-package categories"],
  excludedFields: ["Private files", "Billing details", "Other orders"],
  expiresAtLabel: "October 14 at 3:00 PM ET",
  nextStep: "Review the shared build goal and leave a comment for the client.",
  activity: [
    {
      id: "assist-activity-1",
      actor: "client",
      label: "Sharing approved",
      detail: "The client shared four draft fields for co-editing.",
      occurredAtLabel: "Today · 9:12 AM",
    },
    {
      id: "assist-activity-2",
      actor: "system",
      label: "Access window set",
      detail: "Access ends October 14 at 3:00 PM ET unless the client revokes it sooner.",
      occurredAtLabel: "Today · 9:12 AM",
    },
    {
      id: "assist-activity-3",
      actor: "associate",
      label: "Associate assigned",
      detail: "The request is ready for an associate to accept after sign-in is available.",
      occurredAtLabel: "Today · 9:18 AM",
    },
  ],
};

export const vanguardOperationsContract = {
  systemOfRecord: "convex" as const,
  dataMode: "sample_operations_queue" as const,
  liveAssignmentEnabled: false,
  liveEscalationEnabled: false,
  providerNotificationsEnabled: false,
  generatedApiImportApproved: false,
  queueStates: [
    "unassigned",
    "intake_review",
    "waiting_on_client",
    "quote_ready",
    "accepted_unplanned",
    "in_progress",
    "blocked",
    "quality_review",
    "ready_for_delivery",
    "overdue",
  ] as const,
  assignmentStates: ["unassigned", "proposed", "assigned", "reassignment_review"] as const,
  capacityBands: ["available", "balanced", "near_limit", "at_limit"] as const,
  transitionRules: [
    {
      from: "unassigned",
      to: "intake_review",
      requires: ["named primary owner", "assignment reason", "capacity check", "assignment audit event"],
    },
    {
      from: "intake_review",
      to: "waiting_on_client",
      requires: ["client-safe question", "response due date", "status event"],
    },
    {
      from: "intake_review",
      to: "quote_ready",
      requires: ["scope summary", "acceptance criteria", "risk review", "status event"],
    },
    {
      from: "accepted_unplanned",
      to: "in_progress",
      requires: ["work plan", "committed due date", "primary owner", "status event"],
    },
    {
      from: "in_progress",
      to: "blocked",
      requires: ["blocker reason", "blocker owner", "next review date", "status event"],
    },
    {
      from: "blocked",
      to: "prior_state",
      requires: ["resolution note", "evidence reference", "resume audit event"],
    },
  ] as const,
  routingInputs: [
    "discipline",
    "required capability",
    "location",
    "security handling",
    "due window",
    "current work in progress",
    "continuity owner",
  ] as const,
  loadBalancingRules: [
    "Show the routing inputs behind every candidate suggestion.",
    "A lead confirms assignments and records the reason for an override.",
    "Protected personal attributes are never routing inputs.",
    "Team capacity is separate from individual coaching or performance review.",
  ] as const,
  blockedReason: "Live assignment, reassignment, escalation, and provider notifications need active identity, approved generated bindings, and server-side authorization.",
  recoveryStep: "Review the queue and capacity preview now. Activate identity, generated bindings, and role checks before enabling an operations action.",
};

export const vanguardOperationsCapacityFixture: VanguardCapacitySnapshot[] = [
  {
    discipline: "CAD / CAM",
    band: "near_limit",
    bandLabel: "Near limit",
    activeWork: 5,
    workLimit: 6,
    availableSlots: 1,
    routingNote: "One new intake slot remains. Keep continuity work with the current owner when possible.",
  },
  {
    discipline: "Systems & network",
    band: "balanced",
    bandLabel: "Balanced",
    activeWork: 3,
    workLimit: 6,
    availableSlots: 3,
    routingNote: "Capacity is available for intake review and short discovery work.",
  },
  {
    discipline: "Datacenter",
    band: "at_limit",
    bandLabel: "At limit",
    activeWork: 4,
    workLimit: 4,
    availableSlots: 0,
    routingNote: "Route urgent work to an operations lead for a documented priority decision.",
  },
];

export const vanguardOperationsQueueFixtures: VanguardOperationsQueueItem[] = [
  {
    orderNumber: "VE-DEMO-1042",
    title: "Stainless mounting bracket rebuild",
    queueState: "intake_review",
    queueLabel: "Intake review",
    assignmentState: "proposed",
    assignmentLabel: "Owner proposed",
    discipline: "CAD / CAM",
    requiredRole: "CAD technician",
    dueLabel: "Review due today · 3:00 PM ET",
    ageLabel: "In queue 3h 18m",
    risk: "watch",
    riskLabel: "Watch",
    primaryOwner: "Proposed: CAD intake rotation",
    blocker: null,
    escalationOwner: "Vanguard operations lead",
    nextAction: "Confirm the source-material categories and record missing measurements.",
    evidenceLabel: "Intake receipt + readiness record",
    auditEventCount: 4,
  },
  {
    orderNumber: "VE-DEMO-1038",
    title: "Network room migration plan",
    queueState: "waiting_on_client",
    queueLabel: "Waiting on client",
    assignmentState: "assigned",
    assignmentLabel: "Assigned",
    discipline: "Systems & network",
    requiredRole: "Network & systems engineer",
    dueLabel: "Client response due Oct 14",
    ageLabel: "Waiting 1d 4h",
    risk: "on_track",
    riskLabel: "On track",
    primaryOwner: "Systems continuity queue",
    blocker: "Rack diagram and maintenance window are still needed.",
    escalationOwner: "Engagement lead",
    nextAction: "Review the client-safe question list before the response window closes.",
    evidenceLabel: "Discovery notes + client question record",
    auditEventCount: 8,
  },
  {
    orderNumber: "VE-DEMO-1033",
    title: "Datacenter storage readiness review",
    queueState: "blocked",
    queueLabel: "Blocked",
    assignmentState: "reassignment_review",
    assignmentLabel: "Lead review needed",
    discipline: "Datacenter",
    requiredRole: "Datacenter engineer",
    dueLabel: "Milestone due Oct 14",
    ageLabel: "Blocked 18h",
    risk: "at_risk",
    riskLabel: "At risk",
    primaryOwner: "Datacenter delivery queue",
    blocker: "The discipline is at its work limit and the security-handling review is incomplete.",
    escalationOwner: "VP Operations",
    nextAction: "Choose whether to move the due date or pause lower-priority work, then record the reason.",
    evidenceLabel: "Capacity snapshot + blocker review",
    auditEventCount: 11,
  },
  {
    orderNumber: "VE-DEMO-1027",
    title: "Tooling drawing quality review",
    queueState: "quality_review",
    queueLabel: "Quality review",
    assignmentState: "assigned",
    assignmentLabel: "Assigned",
    discipline: "CAD / CAM",
    requiredRole: "Engineering quality owner",
    dueLabel: "Delivery target Oct 15",
    ageLabel: "In quality review 6h",
    risk: "on_track",
    riskLabel: "On track",
    primaryOwner: "Engineering quality queue",
    blocker: null,
    escalationOwner: "Engineering lead",
    nextAction: "Verify the drawing revision and attach the planned inspection result.",
    evidenceLabel: "Revision manifest + quality checklist",
    auditEventCount: 15,
  },
];

export const vanguardFulfillmentContract = {
  systemOfRecord: "convex" as const,
  dataMode: "sample_fulfillment_record" as const,
  adminOnly: true,
  inventoryReservationEnabled: false,
  manufacturingDocumentIssueEnabled: false,
  qualityCheckExecutionEnabled: false,
  deliveryEnabled: false,
  privateUploadsEnabled: false,
  providerWritesEnabled: false,
  generatedApiImportApproved: false,
  reservationStates: ["not_reserved", "partially_reserved", "reserved", "unavailable"] as const,
  documentStates: ["draft", "in_review", "issued", "superseded"] as const,
  qualityStates: ["not_ready", "ready", "passed", "hold", "failed"] as const,
  deliveryStates: ["blocked", "assembling", "review", "ready"] as const,
  receiptRequirements: [
    "approved delivery manifest",
    "issued manufacturing paperwork",
    "completed quality checks",
    "versioned delivery evidence",
    "named recipient and acceptance method",
  ],
  auditHooks: [
    "material_requirement_recorded",
    "inventory_reservation_requested",
    "inventory_reservation_changed",
    "manufacturing_document_version_added",
    "manufacturing_document_issued",
    "quality_check_recorded",
    "delivery_package_prepared",
    "delivery_recorded",
    "receipt_acknowledged",
  ],
  blockedReason: "Inventory, paperwork, quality, and delivery actions need an active associate identity and authorized order access.",
  recoveryStep: "Complete account activation, connect approved order services, and verify role checks before recording fulfillment work.",
};

export const vanguardFulfillmentEvidenceFixture: VanguardFulfillmentEvidenceRecord = {
  orderNumber: "VE-DEMO-1042",
  title: "Stainless mounting bracket rebuild",
  queueState: "blocked",
  queueLabel: "Fulfillment blocked",
  deliveryReadiness: "blocked",
  deliveryReadinessLabel: "Delivery package blocked",
  materials: [
    {
      id: "material-plate-304",
      itemName: "304 stainless plate · 3/16 in",
      requiredQuantity: "2 blanks",
      availableQuantity: "2 available",
      reservationStatus: "reserved",
      reservationLabel: "Reserved",
      needByLabel: "Needed before cutting",
      evidenceLabel: "Stock count review",
      blocker: null,
    },
    {
      id: "material-fastener-kit",
      itemName: "M8 stainless fastener kit",
      requiredQuantity: "4 sets",
      availableQuantity: "2 available",
      reservationStatus: "partially_reserved",
      reservationLabel: "Partially reserved",
      needByLabel: "Needed before fit check",
      evidenceLabel: "Bin count review",
      blocker: "Two sets remain unavailable for the planned fit check.",
    },
    {
      id: "material-finish",
      itemName: "Passivation service lot",
      requiredQuantity: "1 lot",
      availableQuantity: "No slot confirmed",
      reservationStatus: "unavailable",
      reservationLabel: "Unavailable",
      needByLabel: "Needed before final inspection",
      evidenceLabel: "Supplier availability review",
      blocker: "A service window and handling owner still need confirmation.",
    },
  ],
  documents: [
    {
      id: "document-routing-sheet",
      documentName: "Manufacturing routing sheet",
      versionLabel: "Version 3",
      status: "in_review",
      statusLabel: "In review",
      preparedBy: "CAD / CAM queue",
      reviewedAtLabel: "Review due today · 2:00 PM ET",
      evidenceLabel: "Revision comparison + reviewer note",
    },
    {
      id: "document-inspection-plan",
      documentName: "Dimensional inspection plan",
      versionLabel: "Version 2",
      status: "draft",
      statusLabel: "Draft",
      preparedBy: "Engineering quality queue",
      reviewedAtLabel: "Waiting on drawing approval",
      evidenceLabel: "Characteristic list + tolerance review",
    },
    {
      id: "document-traveler",
      documentName: "Shop traveler",
      versionLabel: "Version 1",
      status: "superseded",
      statusLabel: "Superseded",
      preparedBy: "Operations planning",
      reviewedAtLabel: "Replaced by routing sheet version 3",
      evidenceLabel: "Supersession event",
    },
  ],
  qualityChecks: [
    {
      id: "quality-material-cert",
      label: "Material identity check",
      owner: "Receiving quality",
      status: "passed",
      statusLabel: "Passed",
      requirement: "Match grade and thickness to the approved material requirement.",
      evidenceLabel: "Receiving inspection record",
    },
    {
      id: "quality-dimensional",
      label: "Dimensional inspection",
      owner: "Engineering quality",
      status: "not_ready",
      statusLabel: "Not ready",
      requirement: "Inspect named characteristics after the routing sheet is issued.",
      evidenceLabel: "Inspection result pending",
    },
    {
      id: "quality-finish",
      label: "Finish and handling check",
      owner: "Quality lead",
      status: "hold",
      statusLabel: "On hold",
      requirement: "Confirm passivation lot, handling instructions, and final visual review.",
      evidenceLabel: "Hold reason + owner review",
    },
  ],
  receiptPrerequisites: [
    {
      id: "receipt-manifest",
      label: "Delivery manifest",
      state: "pending",
      stateLabel: "Pending",
      detail: "List each deliverable and its approved version.",
    },
    {
      id: "receipt-paperwork",
      label: "Issued paperwork",
      state: "blocked",
      stateLabel: "Blocked",
      detail: "Issue the routing sheet and inspection plan after review.",
    },
    {
      id: "receipt-quality",
      label: "Quality evidence",
      state: "blocked",
      stateLabel: "Blocked",
      detail: "Complete dimensional and finish checks with named results.",
    },
    {
      id: "receipt-recipient",
      label: "Recipient confirmation",
      state: "complete",
      stateLabel: "Complete",
      detail: "Named recipient and acceptance method are recorded.",
    },
  ],
  deliveryEvidence: [
    "Versioned deliverable manifest",
    "Issued manufacturing paperwork",
    "Quality result records",
    "Delivery event and recipient",
    "Client acceptance or rework request",
  ],
  blockedNextAction: "Confirm the missing fastener sets and passivation window before releasing paperwork or quality work.",
  recoveryStep: "Resolve material availability, approve current paperwork, then complete the remaining quality checks in order.",
  auditEventCount: 19,
};

export const vanguardOrderPortalContract = {
  systemOfRecord: "convex" as const,
  identityMode: "required_unavailable" as const,
  promotionFunction: "orders.promoteLocalIntake" as const,
  trackingFunction: "orders.getMyOrder" as const,
  providerWritesEnabled: false,
  generatedApiImportApproved: false,
  privateUploadsEnabled: false,
  blockedReason: "Client sign-in is required before a request can be saved or added to order history.",
  promotionRequirements: [
    "Verified client account",
    "Review of the request details",
    "Confirmation before sharing with Vanguard",
    "Saved order number and latest status",
  ],
  sourceManifestBoundary: "You can list the materials you have. Private file uploads are not available in this release.",
};

export const vanguardPortalOrderFixture: VanguardPortalOrderFixture = {
  orderNumber: "VE-DEMO-1042",
  title: "Stainless mounting bracket rebuild",
  status: "intake_review",
  clientStatusLabel: "Vanguard is reviewing your request",
  dataMode: "synthetic_preview",
  lastUpdatedLabel: "Preview only · no live updates",
  nextAction: "Vanguard confirms the available materials and records any missing inputs.",
  milestones: [
    {
      key: "request-received",
      label: "Request received",
      state: "complete",
      clientDetail: "The request has been received and is ready for an initial review.",
    },
    {
      key: "source-review",
      label: "Materials review",
      state: "current",
      clientDetail: "An associate checks which drawings, measurements, models, or samples are available.",
    },
    {
      key: "quote-scope",
      label: "Quote and scope",
      state: "upcoming",
      clientDetail: "Scope, assumptions, acceptance criteria, and commercial terms are versioned before approval.",
    },
    {
      key: "build-quality",
      label: "Build and quality evidence",
      state: "upcoming",
      clientDetail: "Fulfillment progress and named quality checks appear here after the order is accepted.",
    },
    {
      key: "delivery",
      label: "Delivery receipt",
      state: "upcoming",
      clientDetail: "Versioned deliverables and client acceptance remain tied to the order record.",
    },
  ],
};

export function createVanguardLocalReceipt(input: Omit<VanguardLocalReceipt, "schemaVersion" | "receiptId" | "source" | "persistence">): VanguardLocalReceipt {
  return {
    schemaVersion: 1,
    receiptId: "VE-RRB-PREVIEW",
    source: "vanguard-reversr-embedded-intake",
    persistence: "session_local",
    ...input,
  };
}

export function parseVanguardLocalReceipt(value: string | null): VanguardLocalReceipt | null {
  if (!value) return null;
  try {
    const candidate = JSON.parse(value) as Partial<VanguardLocalReceipt>;
    if (
      candidate.schemaVersion !== 1 ||
      candidate.receiptId !== "VE-RRB-PREVIEW" ||
      candidate.source !== "vanguard-reversr-embedded-intake" ||
      candidate.persistence !== "session_local" ||
      !Array.isArray(candidate.sourcePackage) ||
      typeof candidate.goal !== "string" ||
      typeof candidate.discipline !== "string" ||
      !Array.isArray(candidate.constraints)
    ) return null;
    return candidate as VanguardLocalReceipt;
  } catch {
    return null;
  }
}
