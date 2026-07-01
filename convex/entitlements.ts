import {
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

export type EntitlementLimitKey =
  | "sites"
  | "admins"
  | "contacts"
  | "campaigns"
  | "aiCredits"
  | "customDomains"
  | "automations";

export const entitlementLimitKeys: EntitlementLimitKey[] = [
  "sites",
  "admins",
  "contacts",
  "campaigns",
  "aiCredits",
  "customDomains",
  "automations",
];

export const defaultBillingPlanCatalog = [
  {
    key: "pilot",
    label: "Pilot",
    status: "active",
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    limits: {
      sites: 2,
      admins: 3,
      contacts: 500,
      campaigns: 2,
      aiCredits: 100,
      customDomains: 0,
      automations: 2,
    },
    features: ["site factory", "CRM lead capture", "manual override entitlements"],
    notes: "Early client and proof-of-concept plan before Stripe Billing is connected.",
  },
  {
    key: "growth",
    label: "Growth",
    status: "active",
    monthlyPriceCents: 9700,
    annualPriceCents: 97000,
    limits: {
      sites: 5,
      admins: 8,
      contacts: 5000,
      campaigns: 10,
      aiCredits: 1000,
      customDomains: 3,
      automations: 10,
    },
    features: ["multi-site management", "campaign microsites", "custom domains", "automation safety limits"],
    notes: "Default commercial plan once Stripe Billing is approved.",
  },
  {
    key: "scale",
    label: "Scale",
    status: "active",
    monthlyPriceCents: 29700,
    annualPriceCents: 297000,
    limits: {
      sites: 20,
      admins: 25,
      contacts: 25000,
      campaigns: 50,
      aiCredits: 5000,
      customDomains: 10,
      automations: 50,
    },
    features: ["expanded site factory", "advanced CRM", "AI review workflows", "priority launch support"],
    notes: "Higher-volume client plan; Stripe price IDs stay gated until provider setup.",
  },
];

export function defaultPlanForKey(planKey: string) {
  return defaultBillingPlanCatalog.find((plan) => plan.key === planKey);
}

function isAdminRole(role: string) {
  return role === "owner" || role === "admin";
}

function numericLimit(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function readLimit(source: unknown, key: EntitlementLimitKey) {
  if (!source || typeof source !== "object") {
    return undefined;
  }
  return numericLimit((source as Record<string, unknown>)[key]);
}

async function countActiveSites(ctx: AnyCtx, tenantId: any) {
  const sites = await ctx.db
    .query("sites")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
    .collect();
  return sites.filter((site) => site.status !== "archived").length;
}

async function countAdminSeats(ctx: AnyCtx, tenantId: any) {
  const memberships = await ctx.db.query("memberships").collect();
  const activeAdminMembers = memberships.filter(
    (membership) =>
      membership.tenantId === tenantId &&
      membership.status === "active" &&
      isAdminRole(membership.role),
  );
  const pendingInvitations = await ctx.db
    .query("invitations")
    .withIndex("by_tenant_status", (q) => q.eq("tenantId", tenantId))
    .filter((q) => q.eq(q.field("status"), "pending"))
    .collect();
  return activeAdminMembers.length + pendingInvitations.filter((invite) => isAdminRole(invite.role)).length;
}

async function countContacts(ctx: AnyCtx, tenantId: any) {
  const leads = await ctx.db.query("leads").collect();
  return leads.filter((lead) => lead.tenantId === tenantId && lead.status !== "archived").length;
}

async function countCustomDomains(ctx: AnyCtx, tenantId: any) {
  const domains = await ctx.db.query("domains").collect();
  return domains.filter((domain) => domain.tenantId === tenantId && domain.status !== "disabled").length;
}

async function usageForLimit(ctx: AnyCtx, tenantId: any, key: EntitlementLimitKey) {
  if (key === "sites") {
    return { current: await countActiveSites(ctx, tenantId), source: "sites" };
  }
  if (key === "admins") {
    return { current: await countAdminSeats(ctx, tenantId), source: "memberships+pendingInvitations" };
  }
  if (key === "contacts") {
    return { current: await countContacts(ctx, tenantId), source: "leads" };
  }
  if (key === "customDomains") {
    return { current: await countCustomDomains(ctx, tenantId), source: "domains" };
  }
  return { current: 0, source: "contract_placeholder" };
}

export async function loadEffectiveTenantEntitlement(ctx: AnyCtx, tenantId: any) {
  const tenant = await ctx.db.get(tenantId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const entitlement = await ctx.db
    .query("tenantEntitlements")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
    .first();
  const planKey = entitlement?.planKey ?? tenant.planKey ?? "pilot";
  const persistedPlan = await ctx.db
    .query("billingPlans")
    .withIndex("by_key", (q) => q.eq("key", planKey))
    .first();
  const plan = persistedPlan ?? defaultPlanForKey(planKey) ?? defaultBillingPlanCatalog[0];

  return {
    tenant,
    plan,
    entitlement,
    planKey,
    providerBoundary: "Stripe Billing gated; manual override entitlements remain active for early customers and pilots.",
  };
}

export function entitlementLimitFor(
  snapshot: Awaited<ReturnType<typeof loadEffectiveTenantEntitlement>>,
  key: EntitlementLimitKey,
) {
  const overrideLimit = readLimit(snapshot.entitlement?.limits, key);
  if (overrideLimit !== undefined) {
    return overrideLimit;
  }
  return readLimit(snapshot.plan.limits, key);
}

export async function loadEntitlementUsageSnapshot(ctx: AnyCtx, tenantId: any) {
  const snapshot = await loadEffectiveTenantEntitlement(ctx, tenantId);
  const usage = [];

  for (const key of entitlementLimitKeys) {
    const { current, source } = await usageForLimit(ctx, tenantId, key);
    const limit = entitlementLimitFor(snapshot, key);
    usage.push({
      key,
      current,
      limit,
      remaining: limit === undefined || limit < 0 ? null : Math.max(limit - current, 0),
      source,
      enforced: source !== "contract_placeholder",
    });
  }

  return {
    ...snapshot,
    usage,
  };
}

export async function requireEntitlementLimit(
  ctx: AnyCtx,
  args: {
    tenantId: any;
    key: EntitlementLimitKey;
    increment?: number;
  },
) {
  const snapshot = await loadEffectiveTenantEntitlement(ctx, args.tenantId);
  const limit = entitlementLimitFor(snapshot, args.key);
  const { current, source } = await usageForLimit(ctx, args.tenantId, args.key);
  const increment = args.increment ?? 1;

  if (limit !== undefined && limit >= 0 && current + increment > limit) {
    throw new Error(`Entitlement limit exceeded: ${args.key}`);
  }

  return {
    key: args.key,
    current,
    increment,
    limit,
    source,
    planKey: snapshot.planKey,
    entitlementId: snapshot.entitlement?._id,
  };
}

export const entitlementUsageSnapshot = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, { permission: "billing:manage" });
    return await loadEntitlementUsageSnapshot(ctx, args.tenantId);
  },
});

export const checkEntitlementLimit = query({
  args: {
    tenantId: v.id("tenants"),
    key: v.union(
      v.literal("sites"),
      v.literal("admins"),
      v.literal("contacts"),
      v.literal("campaigns"),
      v.literal("aiCredits"),
      v.literal("customDomains"),
      v.literal("automations"),
    ),
    increment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, { permission: "billing:manage" });
    const snapshot = await loadEffectiveTenantEntitlement(ctx, args.tenantId);
    const limit = entitlementLimitFor(snapshot, args.key);
    const { current, source } = await usageForLimit(ctx, args.tenantId, args.key);
    const increment = args.increment ?? 1;

    return {
      allowed: limit === undefined || limit < 0 || current + increment <= limit,
      key: args.key,
      current,
      increment,
      limit,
      source,
      planKey: snapshot.planKey,
      providerBoundary: snapshot.providerBoundary,
    };
  },
});
