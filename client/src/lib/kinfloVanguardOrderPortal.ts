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

export const vanguardOrderPortalContract = {
  systemOfRecord: "convex" as const,
  identityMode: "required_unavailable" as const,
  promotionFunction: "orders.promoteLocalIntake" as const,
  trackingFunction: "orders.getMyOrder" as const,
  providerWritesEnabled: false,
  generatedApiImportApproved: false,
  privateUploadsEnabled: false,
  blockedReason: "KinFlo identity and generated Convex bindings remain gated in PR #15.",
  promotionRequirements: [
    "Authenticated KinFlo client identity",
    "Explicit field-transfer review and consent",
    "Server-issued idempotency key",
    "Convex order ID and revision response",
  ],
  sourceManifestBoundary: "Metadata categories only. Private files remain disabled until retention, access, and attachment-manifest rules are approved.",
};

export const vanguardPortalOrderFixture: VanguardPortalOrderFixture = {
  orderNumber: "VE-DEMO-1042",
  title: "Stainless mounting bracket rebuild",
  status: "intake_review",
  clientStatusLabel: "Vanguard is reviewing your request",
  dataMode: "synthetic_preview",
  lastUpdatedLabel: "Synthetic preview · no live timestamp",
  nextAction: "Vanguard confirms the source inventory and records any missing inputs.",
  milestones: [
    {
      key: "request-received",
      label: "Request received",
      state: "complete",
      clientDetail: "The order draft passed the submission boundary in this synthetic example.",
    },
    {
      key: "source-review",
      label: "Source inventory review",
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
      clientDetail: "Fulfillment progress and named quality gates appear here after the order is accepted.",
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
