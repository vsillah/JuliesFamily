import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

const now = () => Date.now();

type RoleScope = "platform" | "tenant" | "site";

type RoleDefinition = {
  key: string;
  label: string;
  scope: RoleScope;
  permissions: string[];
};

export const defaultRoleDefinitions: RoleDefinition[] = [
  {
    key: "platform.super_admin",
    label: "Super Admin",
    scope: "platform",
    permissions: [
      "platform:manage",
      "tenant:create",
      "tenant:archive",
      "site:create",
      "site:archive",
      "member:manage",
      "role:sync",
      "billing:manage",
      "audit:view",
    ],
  },
  {
    key: "tenant.owner",
    label: "Tenant Owner",
    scope: "tenant",
    permissions: [
      "tenant:view",
      "tenant:update",
      "site:create",
      "site:update",
      "member:invite",
      "member:manage",
      "content:publish",
      "audit:view",
    ],
  },
  {
    key: "tenant.admin",
    label: "Tenant Admin",
    scope: "tenant",
    permissions: [
      "tenant:view",
      "site:update",
      "member:invite",
      "content:edit",
      "content:publish",
      "audit:view",
    ],
  },
  {
    key: "tenant.editor",
    label: "Tenant Editor",
    scope: "tenant",
    permissions: [
      "tenant:view",
      "site:view",
      "content:edit",
      "asset:manage",
      "lead:view",
    ],
  },
  {
    key: "tenant.viewer",
    label: "Tenant Viewer",
    scope: "tenant",
    permissions: [
      "tenant:view",
      "site:view",
      "content:view",
      "lead:view",
    ],
  },
  {
    key: "site.admin",
    label: "Site Admin",
    scope: "site",
    permissions: [
      "site:view",
      "site:update",
      "content:edit",
      "content:publish",
      "asset:manage",
      "lead:view",
      "audit:view",
    ],
  },
  {
    key: "site.editor",
    label: "Site Editor",
    scope: "site",
    permissions: [
      "site:view",
      "content:edit",
      "asset:manage",
      "lead:view",
    ],
  },
  {
    key: "site.viewer",
    label: "Site Viewer",
    scope: "site",
    permissions: [
      "site:view",
      "content:view",
      "lead:view",
    ],
  },
];

async function getCurrentUser(ctx: AnyCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User must be synced before using role catalog");
  }

  return user;
}

async function requirePlatformAdmin(ctx: AnyCtx) {
  const user = await getCurrentUser(ctx);
  if (user.platformRole !== "super_admin") {
    throw new Error("Platform admin access required");
  }
  return user;
}

export const listDefaultRoles = query({
  args: {
    scope: v.optional(v.union(v.literal("platform"), v.literal("tenant"), v.literal("site"))),
  },
  handler: async (_ctx, args) =>
    defaultRoleDefinitions.filter((definition) => !args.scope || definition.scope === args.scope),
});

export const listRoleDefinitions = query({
  args: {
    scope: v.optional(v.union(v.literal("platform"), v.literal("tenant"), v.literal("site"))),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const roles = await ctx.db.query("roles").collect();
    return roles.filter((role) => !args.scope || role.scope === args.scope);
  },
});

export const syncDefaultRoles = mutation({
  args: {},
  handler: async (ctx) => {
    const actor = await requirePlatformAdmin(ctx);
    const timestamp = now();
    const syncedRoleIds = [];

    for (const definition of defaultRoleDefinitions) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_key", (q) => q.eq("key", definition.key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          label: definition.label,
          scope: definition.scope,
          permissions: definition.permissions,
          updatedAt: timestamp,
        });
        syncedRoleIds.push(existing._id);
      } else {
        const roleId = await ctx.db.insert("roles", {
          key: definition.key,
          label: definition.label,
          scope: definition.scope,
          permissions: definition.permissions,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        syncedRoleIds.push(roleId);
      }
    }

    await ctx.db.insert("auditEvents", {
      scopeType: "platform",
      actorUserId: actor._id,
      action: "role_catalog_synced",
      resourceType: "role",
      metadata: {
        roleKeys: defaultRoleDefinitions.map((definition) => definition.key),
      },
      createdAt: timestamp,
    });

    return {
      syncedCount: syncedRoleIds.length,
      roleIds: syncedRoleIds,
    };
  },
});
