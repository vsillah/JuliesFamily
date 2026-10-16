import {
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { defaultRoleDefinitions } from "./roleCatalog";
import {
  MAX_ROLE_DEFINITIONS,
  MAX_SCOPE_MEMBERSHIPS,
  evaluateScopeIntegrity,
  membershipMatchesResolvedScope,
  type RequestedScope,
  type ResolvedScope,
} from "./scopePolicyCore";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

type PermissionScope = RequestedScope & {
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
  const persistedRoles = await ctx.db.query("roles").take(MAX_ROLE_DEFINITIONS + 1);
  if (persistedRoles.length > MAX_ROLE_DEFINITIONS) {
    throw new Error("Role catalog exceeds the bounded authorization limit");
  }
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

export async function resolveActiveScope(
  ctx: AnyCtx,
  requested: PermissionScope,
) {
  const site = requested.siteId ? await ctx.db.get(requested.siteId) : null;
  const tenantId = requested.tenantId ?? site?.tenantId;
  const tenant = tenantId ? await ctx.db.get(tenantId) : null;
  const result = evaluateScopeIntegrity({ requested, tenant, site });
  if (!result.ok) {
    throw new Error("Requested scope is unavailable");
  }
  return result.scope;
}

async function collectScopedMemberships(
  ctx: AnyCtx,
  userId: any,
  scope: ResolvedScope,
) {
  if (scope.scopeType === "platform") {
    return [];
  }

  const tenantMemberships = await ctx.db
    .query("memberships")
    .withIndex("by_tenant_user", (q: any) =>
      q.eq("tenantId", scope.tenantId).eq("userId", userId),
    )
    .take(MAX_SCOPE_MEMBERSHIPS + 1);
  if (tenantMemberships.length > MAX_SCOPE_MEMBERSHIPS) {
    throw new Error("Membership scope exceeds the bounded authorization limit");
  }

  if (scope.scopeType === "site") {
    const siteMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_site_user", (q: any) =>
        q.eq("siteId", scope.siteId).eq("userId", userId),
      )
      .take(MAX_SCOPE_MEMBERSHIPS + 1);
    if (siteMemberships.length > MAX_SCOPE_MEMBERSHIPS) {
      throw new Error("Membership scope exceeds the bounded authorization limit");
    }

    return uniqueById([...tenantMemberships, ...siteMemberships].filter(
      (membership) => membershipMatchesResolvedScope(membership, userId, scope),
    ));
  }

  return tenantMemberships.filter(
    (membership) => membershipMatchesResolvedScope(membership, userId, scope),
  );
}

async function buildPermissionSnapshot(
  ctx: AnyCtx,
  user: any,
  scope: ResolvedScope,
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
    scope,
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
  let scope: ResolvedScope;
  try {
    scope = await resolveActiveScope(ctx, args);
  } catch {
    return false;
  }
  if (user.platformRole === "super_admin") {
    return true;
  }

  const snapshot = await buildPermissionSnapshot(ctx, user, scope);
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

  const scope = await resolveActiveScope(ctx, args);
  if (user.platformRole === "super_admin") {
    return user;
  }

  const snapshot = await buildPermissionSnapshot(ctx, user, scope);
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

    const scope = await resolveActiveScope(ctx, args);
    return {
      userId: user._id,
      platformRole: user.platformRole,
      ...(await buildPermissionSnapshot(ctx, user, scope)),
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

    let scope: ResolvedScope;
    try {
      scope = await resolveActiveScope(ctx, args);
    } catch {
      return { allowed: false, reason: "invalid_scope" };
    }
    const snapshot = await buildPermissionSnapshot(ctx, user, scope);
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
