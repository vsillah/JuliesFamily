export const VANGUARD_ORDER_PERSISTENCE_FUNCTIONS = {
  createDraft: "orders.createDraft",
  promoteLocalIntake: "orders.promoteLocalIntake",
  saveDraftSection: "orders.saveDraftSection",
  getMyOrder: "orders.getMyOrder",
  listMyOrders: "orders.listMyOrders",
  submitOrder: "orders.submit",
  getSubmissionReceipt: "orders.getSubmissionReceipt",
  requestAssistance: "orders.requestAssistance",
  grantAssistance: "orders.grantAssistance",
  revokeAssistance: "orders.revokeAssistance",
  listOperationsQueue: "orderOps.listQueue",
  getOrderWorkspace: "orderOps.getOrderWorkspace",
  listCapacity: "orderOps.listCapacity",
  acceptAssistRequest: "orderOps.acceptAssistRequest",
  saveAssistedSection: "orderOps.saveAssistedSection",
  assignOrder: "orderOps.assign",
  reassignOrder: "orderOps.reassign",
  setBlocker: "orderOps.setBlocker",
  resolveBlocker: "orderOps.resolveBlocker",
  transitionStatus: "orderOps.transitionStatus",
  upsertMilestone: "orderOps.upsertMilestone",
  recordQuoteDecision: "orderOps.recordQuoteDecision",
  recordMaterialRequirement: "orderOps.recordMaterialRequirement",
  reserveInventory: "orderOps.reserveInventory",
  addManufacturingDocumentVersion: "orderOps.addManufacturingDocumentVersion",
  recordQualityCheck: "orderOps.recordQualityCheck",
  prepareDelivery: "orderOps.prepareDelivery",
  recordDelivery: "orderOps.recordDelivery",
  listMessages: "orderMessages.list",
  sendMessage: "orderMessages.send",
  listEvidenceManifest: "orderEvidence.listManifest",
  getEvidenceDownloadUrl: "orderEvidence.getDownloadUrl",
  getOperationsSnapshot: "orderMetrics.getOperationsSnapshot",
  getCycleTimeSeries: "orderMetrics.getCycleTimeSeries",
  getThroughputSeries: "orderMetrics.getThroughputSeries",
} as const;

export type VanguardOrderPersistenceFunction =
  (typeof VANGUARD_ORDER_PERSISTENCE_FUNCTIONS)[keyof typeof VANGUARD_ORDER_PERSISTENCE_FUNCTIONS];

export type VanguardOrderPersistenceMode =
  | "browser_local"
  | "schema_reviewed"
  | "bindings_reviewed"
  | "read_only_smoke_verified"
  | "draft_mutation_smoke_verified"
  | "preview_ready"
  | "live_ready";

export type VanguardOrderPersistenceGateKey =
  | "schemaMigrationReviewed"
  | "authPermissionsReviewed"
  | "generatedBindingsReviewed"
  | "readOnlySmokeVerified"
  | "mutationSmokeVerified"
  | "rollbackVerified"
  | "humanQaApproved"
  | "productionActivationApproved";

export type VanguardOrderPersistenceGate = {
  key: VanguardOrderPersistenceGateKey;
  passed: boolean;
  owner: "captain" | "engineering" | "security" | "human_qa";
};

export type VanguardOrderPersistenceReadiness = {
  mode: VanguardOrderPersistenceMode;
  browserLocalFallbackEnabled: true;
  liveReadsEnabled: false;
  liveWritesEnabled: false;
  privateUploadsEnabled: false;
  providerWritesEnabled: false;
  generatedApiImportApproved: false;
  requiredGates: readonly VanguardOrderPersistenceGate[];
  proposedFunctions: readonly VanguardOrderPersistenceFunction[];
};

export type VanguardOrderDraftSaveRequest = {
  orderId: string;
  sectionKey: "build_goal" | "discipline" | "constraints" | "acceptance" | "source_manifest";
  expectedRevision: number;
  idempotencyKey: string;
  payload: Record<string, unknown>;
};

export type VanguardOrderDraftSaveResult = {
  orderId: string;
  revision: number;
  savedAt: number;
  saveState: "saved" | "conflict";
  changedSections: string[];
};

export type VanguardOrderTrackingMilestone = {
  key: string;
  label: string;
  state: "complete" | "current" | "upcoming" | "blocked";
  occurredAt: number | null;
};

export type VanguardOrderTrackingSnapshot = {
  orderId: string;
  orderNumber: string;
  revision: number;
  clientStatus: string;
  nextAction: string;
  updatedAt: number;
  milestones: VanguardOrderTrackingMilestone[];
};

export type VanguardOrderAssistScope =
  | "view_draft"
  | "comment"
  | "edit_draft"
  | "submit_for_client"
  | "takeover_session";

export type VanguardOrderAssistGrant = {
  orderId: string;
  grantedByUserId: string;
  grantedToUserId: string;
  scopes: VanguardOrderAssistScope[];
  sharedSectionKeys: string[];
  orderRevision: number;
  expiresAt: number;
  revokedAt: number | null;
};

export type VanguardOperationsQueueFilter = {
  siteId: string;
  states: string[];
  discipline?: string;
  assignedOwnerId?: string;
  cursor?: string;
  pageSize: number;
};

export type VanguardOperationsQueueRow = {
  orderId: string;
  orderNumber: string;
  clientSafeTitle: string;
  state: string;
  discipline: string;
  assignedOwnerId: string | null;
  dueAt: number | null;
  blockerAgeMs: number | null;
  revision: number;
};

export type VanguardInventoryReference = {
  requirementId: string;
  inventoryItemId: string | null;
  description: string;
  quantity: number;
  unit: string;
  reservationStatus: "not_reserved" | "partially_reserved" | "reserved" | "unavailable";
};

export type VanguardManufacturingDocumentReference = {
  documentId: string;
  documentType: string;
  version: number;
  status: "draft" | "in_review" | "issued" | "superseded";
  storageId: string;
  supersedesId: string | null;
};

export type VanguardOperationsMetricSnapshot = {
  contractVersion: 1;
  windowStart: number;
  windowEnd: number;
  throughput: number;
  medianCycleTimeMs: number | null;
  blockedOrderCount: number;
  workInProgressCount: number;
  inventoryReadyOrderCount: number;
  paperworkCompleteOrderCount: number;
};

const requiredGates: readonly VanguardOrderPersistenceGate[] = [
  { key: "schemaMigrationReviewed", passed: false, owner: "captain" },
  { key: "authPermissionsReviewed", passed: false, owner: "security" },
  { key: "generatedBindingsReviewed", passed: false, owner: "captain" },
  { key: "readOnlySmokeVerified", passed: false, owner: "engineering" },
  { key: "mutationSmokeVerified", passed: false, owner: "engineering" },
  { key: "rollbackVerified", passed: false, owner: "captain" },
  { key: "humanQaApproved", passed: false, owner: "human_qa" },
  { key: "productionActivationApproved", passed: false, owner: "captain" },
];

export const vanguardOrderPersistenceReadiness: VanguardOrderPersistenceReadiness = {
  mode: "browser_local",
  browserLocalFallbackEnabled: true,
  liveReadsEnabled: false,
  liveWritesEnabled: false,
  privateUploadsEnabled: false,
  providerWritesEnabled: false,
  generatedApiImportApproved: false,
  requiredGates,
  proposedFunctions: Object.values(VANGUARD_ORDER_PERSISTENCE_FUNCTIONS),
};

export function getVanguardOrderPersistenceReadiness(): VanguardOrderPersistenceReadiness {
  return vanguardOrderPersistenceReadiness;
}

export function requireVanguardLiveOrderPersistence(): never {
  const pending = requiredGates.filter((gate) => !gate.passed).map((gate) => gate.key);
  throw new Error(`Vanguard live order persistence is disabled; pending gates: ${pending.join(", ")}`);
}
