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
