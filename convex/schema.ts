import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const platformRole = v.union(
  v.literal("user"),
  v.literal("super_admin"),
);

export const tenantRole = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("editor"),
  v.literal("viewer"),
);

export const recordStatus = v.union(
  v.literal("active"),
  v.literal("inactive"),
  v.literal("archived"),
);

export const siteStatus = v.union(
  v.literal("draft"),
  v.literal("preview"),
  v.literal("published"),
  v.literal("archived"),
);

export const invitationStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("revoked"),
  v.literal("expired"),
);

export default defineSchema({
  users: defineTable({
    subject: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    platformRole,
    persona: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_subject", ["subject"])
    .index("by_email", ["email"])
    .index("by_platform_role", ["platformRole"]),

  tenants: defineTable({
    name: v.string(),
    slug: v.string(),
    status: recordStatus,
    planKey: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  sites: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    slug: v.string(),
    status: siteStatus,
    templateKey: v.optional(v.string()),
    subdomain: v.optional(v.string()),
    primaryDomain: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_slug", ["tenantId", "slug"])
    .index("by_subdomain", ["subdomain"])
    .index("by_status", ["status"]),

  memberships: defineTable({
    userId: v.id("users"),
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    role: tenantRole,
    status: recordStatus,
    invitedEmail: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tenant_user", ["tenantId", "userId"])
    .index("by_site_user", ["siteId", "userId"])
    .index("by_tenant_role", ["tenantId", "role"]),

  roles: defineTable({
    key: v.string(),
    label: v.string(),
    scope: v.union(v.literal("platform"), v.literal("tenant"), v.literal("site")),
    permissions: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  invitations: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    email: v.string(),
    role: tenantRole,
    status: invitationStatus,
    tokenHash: v.optional(v.string()),
    invitedBy: v.id("users"),
    acceptedBy: v.optional(v.id("users")),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_site_status", ["siteId", "status"]),

  themeTokens: defineTable({
    siteId: v.id("sites"),
    palette: v.optional(v.any()),
    typography: v.optional(v.any()),
    radii: v.optional(v.any()),
    spacing: v.optional(v.any()),
    buttons: v.optional(v.any()),
    media: v.optional(v.any()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_site", ["siteId"]),

  featureFlags: defineTable({
    tenantId: v.optional(v.id("tenants")),
    siteId: v.optional(v.id("sites")),
    key: v.string(),
    enabled: v.boolean(),
    planGate: v.optional(v.string()),
    reason: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_key", ["tenantId", "key"])
    .index("by_site_key", ["siteId", "key"]),

  auditEvents: defineTable({
    scopeType: v.union(v.literal("platform"), v.literal("tenant"), v.literal("site")),
    tenantId: v.optional(v.id("tenants")),
    siteId: v.optional(v.id("sites")),
    actorUserId: v.optional(v.id("users")),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_scope_createdAt", ["scopeType", "tenantId", "siteId", "createdAt"])
    .index("by_actor_createdAt", ["actorUserId", "createdAt"]),
});
