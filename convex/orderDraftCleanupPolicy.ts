export const VANGUARD_DRAFT_CLEANUP_LIMITS = {
  draftSections: 5,
  sourceItems: 40,
} as const;

type DraftCleanupOrder = {
  _id: string;
  tenantId: string;
  siteId: string;
  clientOwnerUserId: string;
  status: string;
  revision: number;
};

type DraftCleanupScope = {
  tenantId: string;
  siteId: string;
  ownerUserId: string;
};

type DraftCleanupReplay = {
  operation: string;
  requestFingerprint: string;
  orderRevision: number;
  createdAt: number;
  metadata?: unknown;
};

type DraftCleanupChild = {
  _id: string;
  tenantId: string;
  siteId: string;
  orderId: string;
};

type DraftCleanupSource = DraftCleanupChild & {
  storageId?: string;
};

export type DraftCleanupCounts = {
  draftSections: number;
  sourceItems: number;
  storedObjects: number;
};

export type DraftCleanupPlan = DraftCleanupCounts & {
  sectionIds: string[];
  sourceItemIds: string[];
  storageIds: string[];
};

function cleanupCountsFromMetadata(metadata: unknown): DraftCleanupCounts {
  if (!metadata || typeof metadata !== "object") {
    throw new Error("Draft cleanup replay is missing audit metadata");
  }
  const value = metadata as Record<string, unknown>;
  const counts = {
    draftSections: value.draftSections,
    sourceItems: value.sourceItems,
    storedObjects: value.storedObjects,
  };
  if (
    !Number.isSafeInteger(counts.draftSections)
    || !Number.isSafeInteger(counts.sourceItems)
    || !Number.isSafeInteger(counts.storedObjects)
    || (counts.draftSections as number) < 0
    || (counts.sourceItems as number) < 0
    || (counts.storedObjects as number) < 0
  ) {
    throw new Error("Draft cleanup replay has invalid audit metadata");
  }
  return counts as DraftCleanupCounts;
}

export function evaluateDraftCleanupRequest(input: {
  order: DraftCleanupOrder | null;
  scope: DraftCleanupScope;
  expectedRevision: number;
  fingerprint: string;
  replay?: DraftCleanupReplay | null;
}) {
  const { order, scope, expectedRevision, fingerprint, replay } = input;
  if (
    !order
    || order.tenantId !== scope.tenantId
    || order.siteId !== scope.siteId
    || order.clientOwnerUserId !== scope.ownerUserId
  ) {
    throw new Error("Order not found or unavailable");
  }
  if (replay) {
    if (replay.operation !== "cancel_draft" || replay.requestFingerprint !== fingerprint) {
      throw new Error("Idempotency key was already used for a different request");
    }
    return {
      kind: "replay" as const,
      revision: replay.orderRevision,
      cancelledAt: replay.createdAt,
      counts: cleanupCountsFromMetadata(replay.metadata),
    };
  }
  if (order.status !== "draft") {
    throw new Error("Only draft orders can be cancelled and cleaned up");
  }
  if (order.revision !== expectedRevision) {
    throw new Error(`Revision conflict: expected ${expectedRevision}, current ${order.revision}`);
  }
  return {
    kind: "execute" as const,
    nextRevision: order.revision + 1,
  };
}

function childMatchesOrder(
  child: DraftCleanupChild,
  order: DraftCleanupOrder,
) {
  return child.orderId === order._id
    && child.tenantId === order.tenantId
    && child.siteId === order.siteId;
}

export function buildDraftCleanupPlan(input: {
  order: DraftCleanupOrder;
  sections: DraftCleanupChild[];
  sources: DraftCleanupSource[];
}): DraftCleanupPlan {
  const { order, sections, sources } = input;
  if (sections.length > VANGUARD_DRAFT_CLEANUP_LIMITS.draftSections) {
    throw new Error("Draft cleanup exceeded the bounded section limit");
  }
  if (sources.length > VANGUARD_DRAFT_CLEANUP_LIMITS.sourceItems) {
    throw new Error("Draft cleanup exceeded the bounded source limit");
  }
  if (sections.some((section) => !childMatchesOrder(section, order))) {
    throw new Error("Draft section is outside the authorized order scope");
  }
  if (sources.some((source) => !childMatchesOrder(source, order))) {
    throw new Error("Draft source is outside the authorized order scope");
  }
  const storageIds = sources.flatMap((source) => source.storageId ? [source.storageId] : []);
  return {
    sectionIds: sections.map((section) => section._id),
    sourceItemIds: sources.map((source) => source._id),
    storageIds,
    draftSections: sections.length,
    sourceItems: sources.length,
    storedObjects: storageIds.length,
  };
}
