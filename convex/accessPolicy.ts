import {
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { defaultRoleDefinitions } from "./roleCatalog";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

type PermissionScope = {
  tenantId?: any;
  siteId?: any;
};

type MembershipLike = {
  _id: any;
  tenantId: any;
  siteId?: any;
  role: string;
  status: string;
};

function roleKeyForMembership(membership: MembershipLike) {
  if (membership.siteId) {
    if (membership.role === "owner" || membership.role === "admin") {
      return "site.admin";
    }
    return `site.${membership.role}`;
  }
  return `tenant.${membership.role}`;
}

function uniqueById(memberships: MembershipLike[]) {
  const seen = new Set<any>();
  return memberships.filter((membership) => {
    if (seen.has(membership._id)) {
      return false;
    }
    seen.add(membership._id);
    return true;
  });
}

function activeOnly(memberships: Array<MembershipLike | null>) {
  return memberships.filter(
    (membership): membership is MembershipLike =>
      Boolean(membership) && membership?.status === "active",
  );
}

async function getCurrentUser(ctx: AnyCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();
}

async function loadRoleDefinitions(ctx: AnyCtx) {
  const persistedRoles = await ctx.db.query("roles").collect();
  const definitions = new Map(
    defaultRoleDefinitions.map((definition) => [definition.key, definition]),
  );

  for (const role of persistedRoles) {
    definitions.set(role.key, {
      key: role.key,
      label: role.label,
      scope: role.scope,
      permissions: role.permissions,
    });
  }

  return definitions;
}

async function collectScopedMemberships(
  ctx: AnyCtx,
  userId: any,
  scope: PermissionScope,
) {
  if (scope.siteId) {
    const site = await ctx.db.get(scope.siteId);
    if (!site) {
      return [];
    }

    const tenantMembership = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", site.tenantId),
      )
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    const siteMembership = await ctx.db
      .query("memberships")
      .withIndex("by_site_user", (q) =>
        q.eq("siteId", scope.siteId),
      )
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    return uniqueById(activeOnly([tenantMembership, siteMembership]));
  }

  if (scope.tenantId) {
    const tenantMembership = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", scope.tenantId),
      )
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    return activeOnly([tenantMembership]);
  }

  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return activeOnly(memberships);
}

async function buildPermissionSnapshot(
  ctx: AnyCtx,
  user: any,
  scope: PermissionScope,
) {
  const roleDefinitions = await loadRoleDefinitions(ctx);
  const memberships = await collectScopedMemberships(ctx, user._id, scope);
  const roleKeys = memberships.map(roleKeyForMembership);

  if (user.platformRole === "super_admin") {
    roleKeys.unshift("platform.super_admin");
  }

  const permissions = new Set<string>();
  for (const roleKey of roleKeys) {
    const definition = roleDefinitions.get(roleKey);
    for (const permission of definition?.permissions ?? []) {
      permissions.add(permission);
    }
  }

  return {
    isPlatformAdmin: user.platformRole === "super_admin",
    permissions: Array.from(permissions).sort(),
    roleKeys: Array.from(new Set(roleKeys)).sort(),
    memberships: memberships.map((membership) => ({
      membershipId: membership._id,
      tenantId: membership.tenantId,
      siteId: membership.siteId,
      role: membership.role,
      roleKey: roleKeyForMembership(membership),
    })),
  };
}

export async function hasPermission(
  ctx: AnyCtx,
  args: PermissionScope & { permission: string },
) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    return false;
  }
  if (user.platformRole === "super_admin") {
    return true;
  }

  const snapshot = await buildPermissionSnapshot(ctx, user, args);
  return snapshot.permissions.includes(args.permission);
}

export async function requirePermission(
  ctx: AnyCtx,
  args: PermissionScope & { permission: string },
) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Authentication required");
  }

  if (user.platformRole === "super_admin") {
    return user;
  }

  const snapshot = await buildPermissionSnapshot(ctx, user, args);
  if (!snapshot.permissions.includes(args.permission)) {
    throw new Error(`Permission required: ${args.permission}`);
  }

  return user;
}

export const viewerPermissionSnapshot = query({
  args: {
    tenantId: v.optional(v.id("tenants")),
    siteId: v.optional(v.id("sites")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      platformRole: user.platformRole,
      ...(await buildPermissionSnapshot(ctx, user, args)),
    };
  },
});

export const canPerform = query({
  args: {
    permission: v.string(),
    tenantId: v.optional(v.id("tenants")),
    siteId: v.optional(v.id("sites")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { allowed: false, reason: "not_authenticated" };
    }

    const snapshot = await buildPermissionSnapshot(ctx, user, args);
    return {
      allowed: snapshot.isPlatformAdmin || snapshot.permissions.includes(args.permission),
      reason: snapshot.isPlatformAdmin || snapshot.permissions.includes(args.permission)
        ? "allowed"
        : "missing_permission",
      permission: args.permission,
      roleKeys: snapshot.roleKeys,
    };
  },
});
