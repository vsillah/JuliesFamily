import {
  mutationGeneric as mutation,
  paginationOptsValidator,
  paginationResultValidator,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import {
  buildOrderStatus,
  orderDraftSectionKey,
  orderParticipantRole,
  orderParticipantStatus,
  orderQuoteStatus,
  orderSourceItemKind,
  orderSourceStorageStatus,
  orderStatusEventType,
} from "./schema";
import {
  validateVanguardPrivateIgesMetadata,
  validateVanguardStoredSource,
} from "./orderUploadPolicy";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

const VANGUARD_TENANT_SLUG = "vanguard-enterprises";
const VANGUARD_SITE_SLUG = "vanguard-enterprises";
const TRANSFER_CONSENT_VERSION = "vanguard-browser-receipt-transfer-v1";
const SUBMISSION_CONFIRMATION_VERSION = "vanguard-order-submission-v1";
const MAX_SECTION_PAYLOAD_BYTES = 128_000;
const MAX_SOURCE_ITEMS = 40;

const orderSummaryValidator = v.object({
  orderId: v.id("buildOrders"),
  orderNumber: v.string(),
  title: v.string(),
  discipline: v.union(v.null(), v.string()),
  status: buildOrderStatus,
  revision: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  submittedAt: v.union(v.null(), v.number()),
});

const orderCreationResultValidator = v.object({
  orderId: v.id("buildOrders"),
  orderNumber: v.string(),
  revision: v.number(),
  createdAt: v.number(),
  deduplicated: v.boolean(),
});

const orderSectionValidator = v.object({
  sectionId: v.id("orderDraftSections"),
  sectionKey: orderDraftSectionKey,
  payload: v.any(),
  sectionRevision: v.number(),
  orderRevision: v.number(),
  updatedAt: v.number(),
});

const orderSourceItemValidator = v.object({
  sourceItemId: v.id("orderSourceItems"),
  sourceKey: v.string(),
  kind: orderSourceItemKind,
  label: v.string(),
  mediaType: v.union(v.null(), v.string()),
  byteSize: v.union(v.null(), v.number()),
  checksumSha256: v.union(v.null(), v.string()),
  storageStatus: v.union(v.null(), orderSourceStorageStatus),
  storedAt: v.union(v.null(), v.number()),
  createdAt: v.number(),
});

const orderParticipantValidator = v.object({
  participantId: v.id("orderParticipants"),
  userId: v.id("users"),
  role: orderParticipantRole,
  status: orderParticipantStatus,
  transferConsentVersion: v.union(v.null(), v.string()),
  transferConfirmedFieldKeys: v.array(v.string()),
  transferConfirmedAt: v.union(v.null(), v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const orderQuoteValidator = v.object({
  quoteId: v.id("orderQuotes"),
  version: v.number(),
  status: orderQuoteStatus,
  currency: v.string(),
  totalCents: v.number(),
  scopeSummary: v.string(),
  createdAt: v.number(),
  decidedAt: v.union(v.null(), v.number()),
});

const orderStatusEventValidator = v.object({
  statusEventId: v.id("orderStatusEvents"),
  eventType: orderStatusEventType,
  fromStatus: v.union(v.null(), buildOrderStatus),
  toStatus: buildOrderStatus,
  orderRevision: v.number(),
  occurredAt: v.number(),
});

const submissionReceiptValidator = v.object({
  orderId: v.id("buildOrders"),
  orderNumber: v.string(),
  status: v.literal("submitted"),
  revision: v.number(),
  submittedAt: v.number(),
});

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  const objectValue = value as Record<string, unknown>;
  return `{${Object.keys(objectValue)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(objectValue[key])}`)
    .join(",")}}`;
}

function requestFingerprint(value: unknown) {
  const serialized = stableSerialize(value);
  let left = 0x811c9dc5;
  let right = 0x9e3779b9;
  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193) >>> 0;
    right = Math.imul(right ^ (code + index), 0x85ebca6b) >>> 0;
  }
  return `fp-v1:${left.toString(16).padStart(8, "0")}${right.toString(16).padStart(8, "0")}:${serialized.length}`;
}

function requireIdempotencyKey(value: string) {
  if (value.length < 16 || value.length > 120 || !/^[A-Za-z0-9:_-]+$/.test(value)) {
    throw new Error("Idempotency key must be 16-120 URL-safe characters");
  }
  return value;
}

function requireText(value: string, label: string, maxLength: number) {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new Error(`${label} must be between 1 and ${maxLength} characters`);
  }
  return normalized;
}

function requireStringList(values: string[], label: string, maxItems: number, maxItemLength: number) {
  if (values.length === 0 || values.length > maxItems) {
    throw new Error(`${label} must include between 1 and ${maxItems} items`);
  }
  const normalized = values.map((value) => requireText(value, label, maxItemLength));
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${label} cannot contain duplicate values`);
  }
  return normalized;
}

function requireRevision(value: number) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error("Expected revision must be a positive integer");
  }
  return value;
}

function requirePayloadSize(payload: unknown) {
  const serialized = stableSerialize(payload);
  if (new TextEncoder().encode(serialized).byteLength > MAX_SECTION_PAYLOAD_BYTES) {
    throw new Error(`Section payload exceeds ${MAX_SECTION_PAYLOAD_BYTES} bytes`);
  }
  return payload;
}

function sourceKey(index: number, label: string) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";
  return `local-${index + 1}-${slug}`;
}

function privateSourceKey(checksumSha256: string) {
  return `private-${checksumSha256.slice(0, 32)}`;
}

function orderNumberFor(orderId: unknown, timestamp: number) {
  const date = new Date(timestamp).toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = String(orderId).replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase();
  return `VGD-${date}-${suffix}`;
}

function mapOrderSummary(order: any) {
  return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    title: order.title,
    discipline: order.discipline ?? null,
    status: order.status,
    revision: order.revision,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    submittedAt: order.submittedAt ?? null,
  };
}

async function requireCurrentUser(ctx: AnyCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();
  if (!user) {
    throw new Error("User must be synced before using Vanguard orders");
  }
  return user;
}

async function requireVanguardScope(ctx: AnyCtx) {
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", VANGUARD_TENANT_SLUG))
    .unique();
  if (!tenant || tenant.status !== "active") {
    throw new Error("Vanguard order scope is unavailable");
  }
  const site = await ctx.db
    .query("sites")
    .withIndex("by_tenant_slug", (q: any) =>
      q.eq("tenantId", tenant._id).eq("slug", VANGUARD_SITE_SLUG),
    )
    .unique();
  if (!site || site.status === "archived") {
    throw new Error("Vanguard order scope is unavailable");
  }
  return { tenant, site };
}

async function requireOwnedOrder(ctx: AnyCtx, orderId: any, userId: any, scope: any) {
  const order = await ctx.db.get(orderId);
  if (
    !order
    || order.tenantId !== scope.tenant._id
    || order.siteId !== scope.site._id
    || order.clientOwnerUserId !== userId
  ) {
    throw new Error("Order not found or unavailable");
  }
  return order;
}

async function findAuditReplay(ctx: AnyCtx, orderId: any, actorUserId: any, idempotencyKey: string) {
  return await ctx.db
    .query("orderAuditEvents")
    .withIndex("by_order_and_actor_and_idempotency_key", (q: any) =>
      q.eq("orderId", orderId).eq("actorUserId", actorUserId).eq("idempotencyKey", idempotencyKey),
    )
    .unique();
}

function requireMatchingReplay(auditEvent: any, operation: string, fingerprint: string, sectionKey?: string) {
  if (
    auditEvent.operation !== operation
    || auditEvent.requestFingerprint !== fingerprint
    || auditEvent.sectionKey !== sectionKey
  ) {
    throw new Error("Idempotency key was already used for a different request");
  }
}

async function createOrderFoundation(
  ctx: MutationCtx,
  args: {
    scope: any;
    user: any;
    title: string;
    discipline?: string;
    source: "blank_draft" | "local_intake_promotion";
    idempotencyKey: string;
    fingerprint: string;
    localReceiptId?: string;
    localReceiptVersion?: number;
    transferredFieldKeys: string[];
    transferConsentVersion?: string;
    eventType: "order_created" | "local_intake_promoted";
    operation: "create_draft" | "promote_local_intake";
  },
) {
  const timestamp = Date.now();
  const orderId = await ctx.db.insert("buildOrders", {
    tenantId: args.scope.tenant._id,
    siteId: args.scope.site._id,
    clientOwnerUserId: args.user._id,
    orderNumber: `VGD-PENDING-${timestamp}`,
    title: args.title,
    ...(args.discipline ? { discipline: args.discipline } : {}),
    status: "draft",
    source: args.source,
    revision: 1,
    creationIdempotencyKey: args.idempotencyKey,
    creationRequestFingerprint: args.fingerprint,
    ...(args.source === "local_intake_promotion"
      ? {
          localReceiptId: args.localReceiptId,
          localReceiptVersion: args.localReceiptVersion,
        }
      : {}),
    transferredFieldKeys: args.transferredFieldKeys,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  const orderNumber = orderNumberFor(orderId, timestamp);
  await ctx.db.patch(orderId, { orderNumber });
  await ctx.db.insert("orderParticipants", {
    tenantId: args.scope.tenant._id,
    siteId: args.scope.site._id,
    orderId,
    userId: args.user._id,
    role: "client_owner",
    status: "active",
    ...(args.transferConsentVersion
      ? {
          transferConsentVersion: args.transferConsentVersion,
          transferConfirmedAt: timestamp,
        }
      : {}),
    transferConfirmedFieldKeys: args.transferredFieldKeys,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  await ctx.db.insert("orderStatusEvents", {
    tenantId: args.scope.tenant._id,
    siteId: args.scope.site._id,
    orderId,
    eventType: args.eventType,
    toStatus: "draft",
    orderRevision: 1,
    actorUserId: args.user._id,
    idempotencyKey: args.idempotencyKey,
    occurredAt: timestamp,
  });
  await ctx.db.insert("orderAuditEvents", {
    tenantId: args.scope.tenant._id,
    siteId: args.scope.site._id,
    orderId,
    operation: args.operation,
    actorUserId: args.user._id,
    idempotencyKey: args.idempotencyKey,
    requestFingerprint: args.fingerprint,
    orderRevision: 1,
    createdAt: timestamp,
  });
  return { orderId, orderNumber, revision: 1, createdAt: timestamp };
}

export const createDraft = mutation({
  args: {
    title: v.string(),
    discipline: v.optional(v.string()),
    idempotencyKey: v.string(),
  },
  returns: orderCreationResultValidator,
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const title = requireText(args.title, "Order title", 160);
    const discipline = args.discipline
      ? requireText(args.discipline, "Discipline", 120)
      : undefined;
    const idempotencyKey = requireIdempotencyKey(args.idempotencyKey);
    const fingerprint = requestFingerprint({ title, discipline: discipline ?? null });
    const existing = await ctx.db
      .query("buildOrders")
      .withIndex("by_site_and_owner_and_creation_key", (q: any) =>
        q.eq("siteId", scope.site._id)
          .eq("clientOwnerUserId", user._id)
          .eq("creationIdempotencyKey", idempotencyKey),
      )
      .unique();
    if (existing) {
      if (existing.source !== "blank_draft" || existing.creationRequestFingerprint !== fingerprint) {
        throw new Error("Idempotency key was already used for a different request");
      }
      return {
        orderId: existing._id,
        orderNumber: existing.orderNumber,
        revision: existing.revision,
        createdAt: existing.createdAt,
        deduplicated: true,
      };
    }
    const created = await createOrderFoundation(ctx, {
      scope,
      user,
      title,
      discipline,
      source: "blank_draft",
      idempotencyKey,
      fingerprint,
      transferredFieldKeys: [],
      eventType: "order_created",
      operation: "create_draft",
    });
    return { ...created, deduplicated: false };
  },
});

export const promoteLocalIntake = mutation({
  args: {
    receipt: v.object({
      schemaVersion: v.literal(1),
      receiptId: v.string(),
      source: v.literal("vanguard-reversr-embedded-intake"),
      persistence: v.literal("session_local"),
      sourcePackage: v.array(v.string()),
      goal: v.string(),
      discipline: v.string(),
      constraints: v.array(v.string()),
    }),
    confirmation: v.object({
      confirmed: v.literal(true),
      consentVersion: v.literal("vanguard-browser-receipt-transfer-v1"),
      fieldKeys: v.array(
        v.union(
          v.literal("sourcePackage"),
          v.literal("goal"),
          v.literal("discipline"),
          v.literal("constraints"),
        ),
      ),
    }),
    idempotencyKey: v.string(),
  },
  returns: orderCreationResultValidator,
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const receiptId = requireText(args.receipt.receiptId, "Receipt ID", 120);
    const sourcePackage = requireStringList(
      args.receipt.sourcePackage,
      "Source package",
      MAX_SOURCE_ITEMS,
      160,
    );
    const goal = requireText(args.receipt.goal, "Build goal", 4_000);
    const discipline = requireText(args.receipt.discipline, "Discipline", 120);
    const constraints = requireStringList(args.receipt.constraints, "Constraints", 40, 500);
    const requiredFields = ["constraints", "discipline", "goal", "sourcePackage"];
    const confirmedFields = [...new Set(args.confirmation.fieldKeys)].sort();
    if (
      confirmedFields.length !== requiredFields.length
      || confirmedFields.some((field, index) => field !== requiredFields[index])
      || args.confirmation.consentVersion !== TRANSFER_CONSENT_VERSION
    ) {
      throw new Error("All browser receipt fields require explicit transfer confirmation");
    }
    const idempotencyKey = requireIdempotencyKey(args.idempotencyKey);
    const normalizedReceipt = {
      ...args.receipt,
      receiptId,
      sourcePackage,
      goal,
      discipline,
      constraints,
    };
    const fingerprint = requestFingerprint({
      receipt: normalizedReceipt,
      consentVersion: args.confirmation.consentVersion,
      confirmedFields,
    });
    const existing = await ctx.db
      .query("buildOrders")
      .withIndex("by_site_and_owner_and_creation_key", (q: any) =>
        q.eq("siteId", scope.site._id)
          .eq("clientOwnerUserId", user._id)
          .eq("creationIdempotencyKey", idempotencyKey),
      )
      .unique();
    if (existing) {
      if (
        existing.source !== "local_intake_promotion"
        || existing.creationRequestFingerprint !== fingerprint
        || existing.localReceiptId !== receiptId
      ) {
        throw new Error("Idempotency key was already used for a different request");
      }
      return {
        orderId: existing._id,
        orderNumber: existing.orderNumber,
        revision: existing.revision,
        createdAt: existing.createdAt,
        deduplicated: true,
      };
    }
    const created = await createOrderFoundation(ctx, {
      scope,
      user,
      title: goal.slice(0, 160),
      discipline,
      source: "local_intake_promotion",
      idempotencyKey,
      fingerprint,
      localReceiptId: receiptId,
      localReceiptVersion: args.receipt.schemaVersion,
      transferredFieldKeys: confirmedFields,
      transferConsentVersion: args.confirmation.consentVersion,
      eventType: "local_intake_promoted",
      operation: "promote_local_intake",
    });
    const initialSections = [
      { sectionKey: "source_manifest" as const, payload: { sourcePackage } },
      { sectionKey: "build_goal" as const, payload: { goal } },
      { sectionKey: "discipline" as const, payload: { discipline } },
      { sectionKey: "constraints" as const, payload: { constraints } },
    ];
    for (const section of initialSections) {
      await ctx.db.insert("orderDraftSections", {
        tenantId: scope.tenant._id,
        siteId: scope.site._id,
        orderId: created.orderId,
        sectionKey: section.sectionKey,
        payload: section.payload,
        sectionRevision: 1,
        orderRevision: 1,
        createdByUserId: user._id,
        updatedByUserId: user._id,
        createdAt: created.createdAt,
        updatedAt: created.createdAt,
      });
    }
    for (const [index, label] of sourcePackage.entries()) {
      await ctx.db.insert("orderSourceItems", {
        tenantId: scope.tenant._id,
        siteId: scope.site._id,
        orderId: created.orderId,
        sourceKey: sourceKey(index, label),
        kind: "browser_receipt_reference",
        label,
        declaredByUserId: user._id,
        createdAt: created.createdAt,
      });
    }
    return { ...created, deduplicated: false };
  },
});

export const saveDraftSection = mutation({
  args: {
    orderId: v.id("buildOrders"),
    sectionKey: orderDraftSectionKey,
    expectedRevision: v.number(),
    idempotencyKey: v.string(),
    payload: v.record(v.string(), v.any()),
  },
  returns: v.object({
    orderId: v.id("buildOrders"),
    revision: v.number(),
    savedAt: v.number(),
    saveState: v.union(v.literal("saved"), v.literal("conflict")),
    changedSections: v.array(orderDraftSectionKey),
    deduplicated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const order = await requireOwnedOrder(ctx, args.orderId, user._id, scope);
    const expectedRevision = requireRevision(args.expectedRevision);
    const idempotencyKey = requireIdempotencyKey(args.idempotencyKey);
    const payload = requirePayloadSize(args.payload);
    const fingerprint = requestFingerprint({
      orderId: String(args.orderId),
      sectionKey: args.sectionKey,
      expectedRevision,
      payload,
    });
    const replay = await findAuditReplay(ctx, order._id, user._id, idempotencyKey);
    if (replay) {
      requireMatchingReplay(replay, "save_draft_section", fingerprint, args.sectionKey);
      return {
        orderId: order._id,
        revision: replay.orderRevision,
        savedAt: replay.createdAt,
        saveState: "saved" as const,
        changedSections: [],
        deduplicated: true,
      };
    }
    if (order.status !== "draft") {
      throw new Error("Only draft orders can be edited");
    }
    if (order.revision !== expectedRevision) {
      const changed = await ctx.db
        .query("orderDraftSections")
        .withIndex("by_order_and_order_revision", (q: any) =>
          q.eq("orderId", order._id).gt("orderRevision", expectedRevision),
        )
        .take(25);
      return {
        orderId: order._id,
        revision: order.revision,
        savedAt: order.updatedAt,
        saveState: "conflict" as const,
        changedSections: [...new Set(changed.map((section) => section.sectionKey))],
        deduplicated: false,
      };
    }
    const timestamp = Date.now();
    const nextRevision = order.revision + 1;
    const existingSection = await ctx.db
      .query("orderDraftSections")
      .withIndex("by_order_and_key", (q: any) =>
        q.eq("orderId", order._id).eq("sectionKey", args.sectionKey),
      )
      .unique();
    if (existingSection) {
      await ctx.db.patch(existingSection._id, {
        payload,
        sectionRevision: existingSection.sectionRevision + 1,
        orderRevision: nextRevision,
        updatedByUserId: user._id,
        updatedAt: timestamp,
      });
    } else {
      await ctx.db.insert("orderDraftSections", {
        tenantId: scope.tenant._id,
        siteId: scope.site._id,
        orderId: order._id,
        sectionKey: args.sectionKey,
        payload,
        sectionRevision: 1,
        orderRevision: nextRevision,
        createdByUserId: user._id,
        updatedByUserId: user._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    await ctx.db.patch(order._id, { revision: nextRevision, updatedAt: timestamp });
    await ctx.db.insert("orderAuditEvents", {
      tenantId: scope.tenant._id,
      siteId: scope.site._id,
      orderId: order._id,
      operation: "save_draft_section",
      actorUserId: user._id,
      idempotencyKey,
      requestFingerprint: fingerprint,
      orderRevision: nextRevision,
      sectionKey: args.sectionKey,
      createdAt: timestamp,
    });
    return {
      orderId: order._id,
      revision: nextRevision,
      savedAt: timestamp,
      saveState: "saved" as const,
      changedSections: [args.sectionKey],
      deduplicated: false,
    };
  },
});

export const prepareUpload = mutation({
  args: {
    orderId: v.id("buildOrders"),
    expectedRevision: v.number(),
    idempotencyKey: v.string(),
    fileName: v.string(),
    mediaType: v.string(),
    byteSize: v.number(),
    checksumSha256: v.string(),
  },
  returns: v.object({
    orderId: v.id("buildOrders"),
    sourceItemId: v.id("orderSourceItems"),
    revision: v.number(),
    uploadUrl: v.union(v.null(), v.string()),
    uploadState: v.union(v.literal("upload_required"), v.literal("already_stored")),
    deduplicated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const order = await requireOwnedOrder(ctx, args.orderId, user._id, scope);
    const expectedRevision = requireRevision(args.expectedRevision);
    const idempotencyKey = requireIdempotencyKey(args.idempotencyKey);
    const metadata = validateVanguardPrivateIgesMetadata({
      fileName: args.fileName,
      mediaType: args.mediaType,
      byteSize: args.byteSize,
      checksumSha256: args.checksumSha256,
    });
    const fingerprint = requestFingerprint({
      orderId: String(order._id),
      ...metadata,
    });
    const replay = await ctx.db
      .query("orderSourceItems")
      .withIndex("by_order_and_upload_key", (q: any) =>
        q.eq("orderId", order._id).eq("uploadIdempotencyKey", idempotencyKey),
      )
      .unique();
    if (replay) {
      if (
        replay.uploadRequestFingerprint !== fingerprint
        || replay.declaredByUserId !== user._id
        || replay.tenantId !== scope.tenant._id
        || replay.siteId !== scope.site._id
      ) {
        throw new Error("Idempotency key was already used for a different request");
      }
      return {
        orderId: order._id,
        sourceItemId: replay._id,
        revision: order.revision,
        uploadUrl: replay.storageStatus === "stored_private"
          ? null
          : await ctx.storage.generateUploadUrl(),
        uploadState: replay.storageStatus === "stored_private"
          ? "already_stored" as const
          : "upload_required" as const,
        deduplicated: true,
      };
    }
    if (order.status !== "draft") {
      throw new Error("Private source files can only be added to draft orders");
    }
    if (order.revision !== expectedRevision) {
      throw new Error(`Revision conflict: expected ${expectedRevision}, current ${order.revision}`);
    }
    const sourceRows = await ctx.db
      .query("orderSourceItems")
      .withIndex("by_order_and_created_at", (q) => q.eq("orderId", order._id))
      .take(MAX_SOURCE_ITEMS + 1);
    if (sourceRows.length >= MAX_SOURCE_ITEMS) {
      throw new Error(`Order source manifest cannot exceed ${MAX_SOURCE_ITEMS} items`);
    }
    const sourceKeyValue = privateSourceKey(metadata.checksumSha256);
    const duplicateSource = await ctx.db
      .query("orderSourceItems")
      .withIndex("by_order_and_source_key", (q: any) =>
        q.eq("orderId", order._id).eq("sourceKey", sourceKeyValue),
      )
      .unique();
    if (duplicateSource) {
      throw new Error("This private source is already present in the order manifest");
    }
    const timestamp = Date.now();
    const nextRevision = order.revision + 1;
    const sourceItemId = await ctx.db.insert("orderSourceItems", {
      tenantId: scope.tenant._id,
      siteId: scope.site._id,
      orderId: order._id,
      sourceKey: sourceKeyValue,
      kind: "model",
      label: metadata.fileName,
      mediaType: metadata.mediaType,
      byteSize: metadata.byteSize,
      checksumSha256: metadata.checksumSha256,
      storageStatus: "upload_prepared",
      uploadIdempotencyKey: idempotencyKey,
      uploadRequestFingerprint: fingerprint,
      declaredByUserId: user._id,
      updatedByUserId: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await ctx.db.patch(order._id, { revision: nextRevision, updatedAt: timestamp });
    await ctx.db.insert("orderAuditEvents", {
      tenantId: scope.tenant._id,
      siteId: scope.site._id,
      orderId: order._id,
      operation: "prepare_source_upload",
      actorUserId: user._id,
      idempotencyKey,
      requestFingerprint: fingerprint,
      orderRevision: nextRevision,
      metadata: { sourceItemId, kind: "model", byteSize: metadata.byteSize },
      createdAt: timestamp,
    });
    return {
      orderId: order._id,
      sourceItemId,
      revision: nextRevision,
      uploadUrl: await ctx.storage.generateUploadUrl(),
      uploadState: "upload_required" as const,
      deduplicated: false,
    };
  },
});

export const attachStoredSource = mutation({
  args: {
    orderId: v.id("buildOrders"),
    sourceItemId: v.id("orderSourceItems"),
    storageId: v.id("_storage"),
    expectedRevision: v.number(),
    idempotencyKey: v.string(),
  },
  returns: v.object({
    orderId: v.id("buildOrders"),
    sourceItemId: v.id("orderSourceItems"),
    revision: v.number(),
    attachmentState: v.union(v.literal("stored"), v.literal("rejected")),
    rejectionCode: v.union(
      v.null(),
      v.literal("stored_size_mismatch"),
      v.literal("stored_type_mismatch"),
      v.literal("stored_checksum_mismatch"),
    ),
    deduplicated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const order = await requireOwnedOrder(ctx, args.orderId, user._id, scope);
    const expectedRevision = requireRevision(args.expectedRevision);
    const idempotencyKey = requireIdempotencyKey(args.idempotencyKey);
    const fingerprint = requestFingerprint({
      orderId: String(order._id),
      sourceItemId: String(args.sourceItemId),
      storageId: String(args.storageId),
      expectedRevision,
    });
    const replay = await findAuditReplay(ctx, order._id, user._id, idempotencyKey);
    if (replay) {
      requireMatchingReplay(replay, "attach_stored_source", fingerprint);
      const rejected = replay.metadata?.outcome === "rejected";
      return {
        orderId: order._id,
        sourceItemId: args.sourceItemId,
        revision: replay.orderRevision,
        attachmentState: rejected ? "rejected" as const : "stored" as const,
        rejectionCode: rejected
          ? replay.metadata?.code === "stored_size_mismatch"
            ? "stored_size_mismatch" as const
            : replay.metadata?.code === "stored_checksum_mismatch"
              ? "stored_checksum_mismatch" as const
              : "stored_type_mismatch" as const
          : null,
        deduplicated: true,
      };
    }
    const sourceItem = await ctx.db.get(args.sourceItemId);
    if (
      !sourceItem
      || sourceItem.orderId !== order._id
      || sourceItem.tenantId !== scope.tenant._id
      || sourceItem.siteId !== scope.site._id
      || sourceItem.declaredByUserId !== user._id
    ) {
      throw new Error("Private source not found or unavailable");
    }
    if (order.status !== "draft") {
      throw new Error("Private source files can only be attached to draft orders");
    }
    if (order.revision !== expectedRevision) {
      throw new Error(`Revision conflict: expected ${expectedRevision}, current ${order.revision}`);
    }
    if (sourceItem.storageStatus !== "upload_prepared" || sourceItem.storageId) {
      throw new Error("Private source upload is not awaiting attachment");
    }
    const declared = validateVanguardPrivateIgesMetadata({
      fileName: sourceItem.label,
      mediaType: sourceItem.mediaType ?? "application/octet-stream",
      byteSize: sourceItem.byteSize ?? 0,
      checksumSha256: sourceItem.checksumSha256 ?? "",
    });
    const stored = await ctx.db.system.get(args.storageId);
    if (!stored) {
      throw new Error("Uploaded private source was not found");
    }
    const validation = validateVanguardStoredSource(declared, {
      contentType: stored.contentType,
      size: stored.size,
      sha256: stored.sha256,
    });
    const timestamp = Date.now();
    const nextRevision = order.revision + 1;
    if (!validation.ok) {
      await ctx.storage.delete(args.storageId);
      await ctx.db.delete(sourceItem._id);
      await ctx.db.patch(order._id, { revision: nextRevision, updatedAt: timestamp });
      await ctx.db.insert("orderAuditEvents", {
        tenantId: scope.tenant._id,
        siteId: scope.site._id,
        orderId: order._id,
        operation: "attach_stored_source",
        actorUserId: user._id,
        idempotencyKey,
        requestFingerprint: fingerprint,
        orderRevision: nextRevision,
        metadata: { outcome: "rejected", code: validation.code },
        createdAt: timestamp,
      });
      return {
        orderId: order._id,
        sourceItemId: sourceItem._id,
        revision: nextRevision,
        attachmentState: "rejected" as const,
        rejectionCode: validation.code,
        deduplicated: false,
      };
    }
    await ctx.db.patch(sourceItem._id, {
      storageId: args.storageId,
      storageStatus: "stored_private",
      updatedByUserId: user._id,
      updatedAt: timestamp,
      storedAt: timestamp,
    });
    await ctx.db.patch(order._id, { revision: nextRevision, updatedAt: timestamp });
    await ctx.db.insert("orderAuditEvents", {
      tenantId: scope.tenant._id,
      siteId: scope.site._id,
      orderId: order._id,
      operation: "attach_stored_source",
      actorUserId: user._id,
      idempotencyKey,
      requestFingerprint: fingerprint,
      orderRevision: nextRevision,
      metadata: { outcome: "stored", sourceItemId: sourceItem._id },
      createdAt: timestamp,
    });
    return {
      orderId: order._id,
      sourceItemId: sourceItem._id,
      revision: nextRevision,
      attachmentState: "stored" as const,
      rejectionCode: null,
      deduplicated: false,
    };
  },
});

export const cancelPreparedUpload = mutation({
  args: {
    orderId: v.id("buildOrders"),
    sourceItemId: v.id("orderSourceItems"),
    expectedRevision: v.number(),
    idempotencyKey: v.string(),
  },
  returns: v.object({
    orderId: v.id("buildOrders"),
    revision: v.number(),
    cancelled: v.boolean(),
    deduplicated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const order = await requireOwnedOrder(ctx, args.orderId, user._id, scope);
    const expectedRevision = requireRevision(args.expectedRevision);
    const idempotencyKey = requireIdempotencyKey(args.idempotencyKey);
    const fingerprint = requestFingerprint({
      orderId: String(order._id),
      sourceItemId: String(args.sourceItemId),
      expectedRevision,
    });
    const replay = await findAuditReplay(ctx, order._id, user._id, idempotencyKey);
    if (replay) {
      requireMatchingReplay(replay, "cancel_source_upload", fingerprint);
      return {
        orderId: order._id,
        revision: replay.orderRevision,
        cancelled: true,
        deduplicated: true,
      };
    }
    if (order.status !== "draft") {
      throw new Error("Prepared uploads can only be cancelled on draft orders");
    }
    if (order.revision !== expectedRevision) {
      throw new Error(`Revision conflict: expected ${expectedRevision}, current ${order.revision}`);
    }
    const sourceItem = await ctx.db.get(args.sourceItemId);
    if (
      !sourceItem
      || sourceItem.orderId !== order._id
      || sourceItem.tenantId !== scope.tenant._id
      || sourceItem.siteId !== scope.site._id
      || sourceItem.declaredByUserId !== user._id
      || sourceItem.storageStatus !== "upload_prepared"
      || sourceItem.storageId
    ) {
      throw new Error("Prepared private source not found or unavailable");
    }
    const timestamp = Date.now();
    const nextRevision = order.revision + 1;
    await ctx.db.delete(sourceItem._id);
    await ctx.db.patch(order._id, { revision: nextRevision, updatedAt: timestamp });
    await ctx.db.insert("orderAuditEvents", {
      tenantId: scope.tenant._id,
      siteId: scope.site._id,
      orderId: order._id,
      operation: "cancel_source_upload",
      actorUserId: user._id,
      idempotencyKey,
      requestFingerprint: fingerprint,
      orderRevision: nextRevision,
      metadata: { outcome: "cancelled_before_storage" },
      createdAt: timestamp,
    });
    return {
      orderId: order._id,
      revision: nextRevision,
      cancelled: true,
      deduplicated: false,
    };
  },
});

export const removeStoredSource = mutation({
  args: {
    orderId: v.id("buildOrders"),
    sourceItemId: v.id("orderSourceItems"),
    expectedRevision: v.number(),
    idempotencyKey: v.string(),
  },
  returns: v.object({
    orderId: v.id("buildOrders"),
    revision: v.number(),
    removed: v.boolean(),
    deduplicated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const order = await requireOwnedOrder(ctx, args.orderId, user._id, scope);
    const expectedRevision = requireRevision(args.expectedRevision);
    const idempotencyKey = requireIdempotencyKey(args.idempotencyKey);
    const fingerprint = requestFingerprint({
      orderId: String(order._id),
      sourceItemId: String(args.sourceItemId),
      expectedRevision,
    });
    const replay = await findAuditReplay(ctx, order._id, user._id, idempotencyKey);
    if (replay) {
      requireMatchingReplay(replay, "remove_stored_source", fingerprint);
      return {
        orderId: order._id,
        revision: replay.orderRevision,
        removed: true,
        deduplicated: true,
      };
    }
    if (order.status !== "draft") {
      throw new Error("Private source files can only be removed from draft orders");
    }
    if (order.revision !== expectedRevision) {
      throw new Error(`Revision conflict: expected ${expectedRevision}, current ${order.revision}`);
    }
    const sourceItem = await ctx.db.get(args.sourceItemId);
    if (
      !sourceItem
      || sourceItem.orderId !== order._id
      || sourceItem.tenantId !== scope.tenant._id
      || sourceItem.siteId !== scope.site._id
      || sourceItem.declaredByUserId !== user._id
      || sourceItem.storageStatus !== "stored_private"
      || !sourceItem.storageId
    ) {
      throw new Error("Private source not found or unavailable");
    }
    const timestamp = Date.now();
    const nextRevision = order.revision + 1;
    await ctx.storage.delete(sourceItem.storageId);
    await ctx.db.delete(sourceItem._id);
    await ctx.db.patch(order._id, { revision: nextRevision, updatedAt: timestamp });
    await ctx.db.insert("orderAuditEvents", {
      tenantId: scope.tenant._id,
      siteId: scope.site._id,
      orderId: order._id,
      operation: "remove_stored_source",
      actorUserId: user._id,
      idempotencyKey,
      requestFingerprint: fingerprint,
      orderRevision: nextRevision,
      metadata: { outcome: "removed" },
      createdAt: timestamp,
    });
    return {
      orderId: order._id,
      revision: nextRevision,
      removed: true,
      deduplicated: false,
    };
  },
});

export const getStoredSourceDownloadUrl = query({
  args: {
    orderId: v.id("buildOrders"),
    sourceItemId: v.id("orderSourceItems"),
  },
  returns: v.union(
    v.null(),
    v.object({
      sourceItemId: v.id("orderSourceItems"),
      fileName: v.string(),
      mediaType: v.string(),
      byteSize: v.number(),
      url: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const order = await requireOwnedOrder(ctx, args.orderId, user._id, scope);
    const sourceItem = await ctx.db.get(args.sourceItemId);
    if (
      !sourceItem
      || sourceItem.orderId !== order._id
      || sourceItem.tenantId !== scope.tenant._id
      || sourceItem.siteId !== scope.site._id
      || sourceItem.storageStatus !== "stored_private"
      || !sourceItem.storageId
      || !sourceItem.mediaType
      || !sourceItem.byteSize
    ) {
      return null;
    }
    const url = await ctx.storage.getUrl(sourceItem.storageId);
    if (!url) {
      return null;
    }
    return {
      sourceItemId: sourceItem._id,
      fileName: sourceItem.label,
      mediaType: sourceItem.mediaType,
      byteSize: sourceItem.byteSize,
      url,
    };
  },
});

export const getMyOrder = query({
  args: { orderId: v.id("buildOrders") },
  returns: v.object({
    order: orderSummaryValidator,
    sections: v.array(orderSectionValidator),
    sourceItems: v.array(orderSourceItemValidator),
    participants: v.array(orderParticipantValidator),
    quotes: v.array(orderQuoteValidator),
    statusEvents: v.array(orderStatusEventValidator),
    truncated: v.object({
      sections: v.boolean(),
      sourceItems: v.boolean(),
      participants: v.boolean(),
      quotes: v.boolean(),
      statusEvents: v.boolean(),
    }),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const order = await requireOwnedOrder(ctx, args.orderId, user._id, scope);
    const [sectionRows, sourceRows, participantRows, quoteRows, statusRows] = await Promise.all([
      ctx.db
        .query("orderDraftSections")
        .withIndex("by_order_and_updated_at", (q) => q.eq("orderId", order._id))
        .order("asc")
        .take(6),
      ctx.db
        .query("orderSourceItems")
        .withIndex("by_order_and_created_at", (q) => q.eq("orderId", order._id))
        .order("asc")
        .take(101),
      ctx.db
        .query("orderParticipants")
        .withIndex("by_order_and_status", (q) => q.eq("orderId", order._id))
        .take(26),
      ctx.db
        .query("orderQuotes")
        .withIndex("by_order_and_version", (q) => q.eq("orderId", order._id))
        .order("desc")
        .take(26),
      ctx.db
        .query("orderStatusEvents")
        .withIndex("by_order_and_occurred_at", (q) => q.eq("orderId", order._id))
        .order("desc")
        .take(101),
    ]);
    return {
      order: mapOrderSummary(order),
      sections: sectionRows.slice(0, 5).map((section) => ({
        sectionId: section._id,
        sectionKey: section.sectionKey,
        payload: section.payload,
        sectionRevision: section.sectionRevision,
        orderRevision: section.orderRevision,
        updatedAt: section.updatedAt,
      })),
      sourceItems: sourceRows.slice(0, 100).map((item) => ({
        sourceItemId: item._id,
        sourceKey: item.sourceKey,
        kind: item.kind,
        label: item.label,
        mediaType: item.mediaType ?? null,
        byteSize: item.byteSize ?? null,
        checksumSha256: item.checksumSha256 ?? null,
        storageStatus: item.storageStatus ?? null,
        storedAt: item.storedAt ?? null,
        createdAt: item.createdAt,
      })),
      participants: participantRows.slice(0, 25).map((participant) => ({
        participantId: participant._id,
        userId: participant.userId,
        role: participant.role,
        status: participant.status,
        transferConsentVersion: participant.transferConsentVersion ?? null,
        transferConfirmedFieldKeys: participant.transferConfirmedFieldKeys,
        transferConfirmedAt: participant.transferConfirmedAt ?? null,
        createdAt: participant.createdAt,
        updatedAt: participant.updatedAt,
      })),
      quotes: quoteRows.slice(0, 25).map((quote) => ({
        quoteId: quote._id,
        version: quote.version,
        status: quote.status,
        currency: quote.currency,
        totalCents: quote.totalCents,
        scopeSummary: quote.scopeSummary,
        createdAt: quote.createdAt,
        decidedAt: quote.decidedAt ?? null,
      })),
      statusEvents: statusRows.slice(0, 100).map((event) => ({
        statusEventId: event._id,
        eventType: event.eventType,
        fromStatus: event.fromStatus ?? null,
        toStatus: event.toStatus,
        orderRevision: event.orderRevision,
        occurredAt: event.occurredAt,
      })),
      truncated: {
        sections: sectionRows.length > 5,
        sourceItems: sourceRows.length > 100,
        participants: participantRows.length > 25,
        quotes: quoteRows.length > 25,
        statusEvents: statusRows.length > 100,
      },
    };
  },
});

export const listMyOrders = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(orderSummaryValidator),
  handler: async (ctx, args) => {
    if (args.paginationOpts.numItems < 1 || args.paginationOpts.numItems > 50) {
      throw new Error("Order page size must be between 1 and 50");
    }
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const result = await ctx.db
      .query("buildOrders")
      .withIndex("by_site_and_owner_and_updated_at", (q: any) =>
        q.eq("siteId", scope.site._id).eq("clientOwnerUserId", user._id),
      )
      .order("desc")
      .paginate(args.paginationOpts);
    return { ...result, page: result.page.map(mapOrderSummary) };
  },
});

export const submit = mutation({
  args: {
    orderId: v.id("buildOrders"),
    expectedRevision: v.number(),
    idempotencyKey: v.string(),
    confirmation: v.object({
      confirmed: v.literal(true),
      confirmationVersion: v.literal("vanguard-order-submission-v1"),
    }),
  },
  returns: v.object({
    ...submissionReceiptValidator.fields,
    deduplicated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const order = await requireOwnedOrder(ctx, args.orderId, user._id, scope);
    const expectedRevision = requireRevision(args.expectedRevision);
    const idempotencyKey = requireIdempotencyKey(args.idempotencyKey);
    if (args.confirmation.confirmationVersion !== SUBMISSION_CONFIRMATION_VERSION) {
      throw new Error("Unsupported submission confirmation version");
    }
    const fingerprint = requestFingerprint({
      orderId: String(order._id),
      expectedRevision,
      confirmationVersion: args.confirmation.confirmationVersion,
    });
    const replay = await findAuditReplay(ctx, order._id, user._id, idempotencyKey);
    if (replay) {
      requireMatchingReplay(replay, "submit_order", fingerprint);
      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: "submitted" as const,
        revision: replay.orderRevision,
        submittedAt: replay.createdAt,
        deduplicated: true,
      };
    }
    if (order.status !== "draft") {
      throw new Error("Only draft orders can be submitted");
    }
    if (order.revision !== expectedRevision) {
      throw new Error(`Revision conflict: expected ${expectedRevision}, current ${order.revision}`);
    }
    const requiredSections = ["build_goal", "discipline", "constraints", "acceptance"] as const;
    const sectionRows = await Promise.all(
      requiredSections.map((sectionKey) =>
        ctx.db
          .query("orderDraftSections")
          .withIndex("by_order_and_key", (q: any) =>
            q.eq("orderId", order._id).eq("sectionKey", sectionKey),
          )
          .unique(),
      ),
    );
    const missingSections = requiredSections.filter((_, index) => !sectionRows[index]);
    if (missingSections.length > 0) {
      throw new Error(`Order is incomplete; missing sections: ${missingSections.join(", ")}`);
    }
    const timestamp = Date.now();
    const nextRevision = order.revision + 1;
    await ctx.db.patch(order._id, {
      status: "submitted",
      revision: nextRevision,
      updatedAt: timestamp,
      submittedAt: timestamp,
    });
    await ctx.db.insert("orderStatusEvents", {
      tenantId: scope.tenant._id,
      siteId: scope.site._id,
      orderId: order._id,
      eventType: "order_submitted",
      fromStatus: "draft",
      toStatus: "submitted",
      orderRevision: nextRevision,
      actorUserId: user._id,
      idempotencyKey,
      occurredAt: timestamp,
    });
    await ctx.db.insert("orderAuditEvents", {
      tenantId: scope.tenant._id,
      siteId: scope.site._id,
      orderId: order._id,
      operation: "submit_order",
      actorUserId: user._id,
      idempotencyKey,
      requestFingerprint: fingerprint,
      orderRevision: nextRevision,
      createdAt: timestamp,
    });
    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: "submitted" as const,
      revision: nextRevision,
      submittedAt: timestamp,
      deduplicated: false,
    };
  },
});

export const getSubmissionReceipt = query({
  args: { orderId: v.id("buildOrders") },
  returns: v.union(v.null(), submissionReceiptValidator),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const scope = await requireVanguardScope(ctx);
    const order = await requireOwnedOrder(ctx, args.orderId, user._id, scope);
    const event = await ctx.db
      .query("orderStatusEvents")
      .withIndex("by_order_and_to_status_and_occurred_at", (q: any) =>
        q.eq("orderId", order._id).eq("toStatus", "submitted"),
      )
      .order("desc")
      .first();
    if (!event) {
      return null;
    }
    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: "submitted" as const,
      revision: event.orderRevision,
      submittedAt: event.occurredAt,
    };
  },
});
