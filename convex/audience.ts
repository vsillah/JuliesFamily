import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission, resolveActiveScope } from "./accessPolicy";
import {
  assertPresentationComposition,
  assertPreviewReferences,
  definitionMatchesSite,
  MAX_AUDIENCE_DEFINITIONS,
  normalizeAudienceKey,
  normalizePassionTags,
} from "./audiencePolicyCore";
import {
  audienceDefinitionStatus,
  contentProvenance,
} from "./schema";
import {
  assertRecordMatchesResolvedScope,
  recordMatchesResolvedScope,
  type ResolvedScope,
} from "./scopePolicyCore";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

const now = () => Date.now();

function definedFields(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
}

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
    throw new Error("User must be synced before selecting audience context");
  }
  return user;
}

async function requireSitePermission(ctx: AnyCtx, siteId: any, permission: string) {
  const scope = await resolveActiveScope(ctx, { siteId });
  if (scope.scopeType !== "site") {
    throw new Error("Requested scope is unavailable");
  }
  const user = await requirePermission(ctx, { siteId, permission });
  return { user, scope };
}

async function writeAuditEvent(
  ctx: MutationCtx,
  scope: Extract<ResolvedScope, { scopeType: "site" }>,
  actorUserId: any,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: unknown,
) {
  await ctx.db.insert("auditEvents", {
    scopeType: "site",
    tenantId: scope.tenantId,
    siteId: scope.siteId,
    actorUserId,
    action,
    resourceType,
    resourceId,
    metadata,
    createdAt: now(),
  });
}

async function takeBoundedDefinitions(ctx: AnyCtx, table: string, siteId: any) {
  const rows = await ctx.db
    .query(table)
    .withIndex("by_site_and_status_and_order", (q: any) =>
      q.eq("siteId", siteId).eq("status", "active")
    )
    .take(MAX_AUDIENCE_DEFINITIONS + 1);
  if (rows.length > MAX_AUDIENCE_DEFINITIONS) {
    throw new Error("Audience definition count exceeds the bounded site limit");
  }
  return rows;
}

async function loadDefinition(ctx: AnyCtx, definitionId: any, scope: Extract<ResolvedScope, { scopeType: "site" }>) {
  const definition = await ctx.db.get(definitionId);
  if (!definitionMatchesSite(definition, scope.tenantId, scope.siteId, { requireActive: true })) {
    throw new Error("Audience definition is unavailable");
  }
  return definition;
}

export const listSiteDefinitions = query({
  args: { siteId: v.id("sites") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { scope } = await requireSitePermission(ctx, args.siteId, "site:view");
    const [personas, journeyStages] = await Promise.all([
      takeBoundedDefinitions(ctx, "personaDefinitions", args.siteId),
      takeBoundedDefinitions(ctx, "journeyStageDefinitions", args.siteId),
    ]);
    return {
      personas: personas.filter((row) => recordMatchesResolvedScope(row, scope)),
      journeyStages: journeyStages.filter((row) => recordMatchesResolvedScope(row, scope)),
    };
  },
});

export const upsertPersonaDefinition = mutation({
  args: {
    siteId: v.id("sites"),
    definitionId: v.optional(v.id("personaDefinitions")),
    key: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    iconToken: v.optional(v.string()),
    status: audienceDefinitionStatus,
    order: v.number(),
    eligibilityRules: v.optional(v.any()),
  },
  returns: v.id("personaDefinitions"),
  handler: async (ctx, args) => {
    const { user, scope } = await requireSitePermission(ctx, args.siteId, "content:edit");
    const key = normalizeAudienceKey(args.key);
    const existingForKey = await ctx.db
      .query("personaDefinitions")
      .withIndex("by_site_and_key", (q: any) => q.eq("siteId", args.siteId).eq("key", key))
      .unique();
    const timestamp = now();

    if (args.definitionId) {
      const definition = await ctx.db.get(args.definitionId);
      assertRecordMatchesResolvedScope(definition, scope);
      if (existingForKey && existingForKey._id !== definition._id) {
        throw new Error("Persona key is already in use for this site");
      }
      await ctx.db.patch(definition._id, definedFields({
        key,
        label: args.label.trim(),
        description: args.description?.trim(),
        iconToken: args.iconToken?.trim(),
        status: args.status,
        order: args.order,
        eligibilityRules: args.eligibilityRules,
        updatedAt: timestamp,
        archivedAt: args.status === "archived" ? timestamp : undefined,
      }));
      await writeAuditEvent(ctx, scope, user._id, "persona_definition_updated", "personaDefinition", definition._id);
      return definition._id;
    }

    if (existingForKey) {
      throw new Error("Persona key is already in use for this site");
    }
    const definitionId = await ctx.db.insert("personaDefinitions", {
      tenantId: scope.tenantId,
      siteId: scope.siteId,
      key,
      label: args.label.trim(),
      description: args.description?.trim(),
      iconToken: args.iconToken?.trim(),
      status: args.status,
      order: args.order,
      eligibilityRules: args.eligibilityRules,
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: args.status === "archived" ? timestamp : undefined,
    });
    await writeAuditEvent(ctx, scope, user._id, "persona_definition_created", "personaDefinition", definitionId);
    return definitionId;
  },
});

export const upsertJourneyStageDefinition = mutation({
  args: {
    siteId: v.id("sites"),
    definitionId: v.optional(v.id("journeyStageDefinitions")),
    key: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    entryMeaning: v.optional(v.string()),
    exitMeaning: v.optional(v.string()),
    status: audienceDefinitionStatus,
    order: v.number(),
  },
  returns: v.id("journeyStageDefinitions"),
  handler: async (ctx, args) => {
    const { user, scope } = await requireSitePermission(ctx, args.siteId, "content:edit");
    const key = normalizeAudienceKey(args.key);
    const existingForKey = await ctx.db
      .query("journeyStageDefinitions")
      .withIndex("by_site_and_key", (q: any) => q.eq("siteId", args.siteId).eq("key", key))
      .unique();
    const timestamp = now();

    if (args.definitionId) {
      const definition = await ctx.db.get(args.definitionId);
      assertRecordMatchesResolvedScope(definition, scope);
      if (existingForKey && existingForKey._id !== definition._id) {
        throw new Error("Journey stage key is already in use for this site");
      }
      await ctx.db.patch(definition._id, definedFields({
        key,
        label: args.label.trim(),
        description: args.description?.trim(),
        entryMeaning: args.entryMeaning?.trim(),
        exitMeaning: args.exitMeaning?.trim(),
        status: args.status,
        order: args.order,
        updatedAt: timestamp,
        archivedAt: args.status === "archived" ? timestamp : undefined,
      }));
      await writeAuditEvent(ctx, scope, user._id, "journey_stage_definition_updated", "journeyStageDefinition", definition._id);
      return definition._id;
    }

    if (existingForKey) {
      throw new Error("Journey stage key is already in use for this site");
    }
    const definitionId = await ctx.db.insert("journeyStageDefinitions", {
      tenantId: scope.tenantId,
      siteId: scope.siteId,
      key,
      label: args.label.trim(),
      description: args.description?.trim(),
      entryMeaning: args.entryMeaning?.trim(),
      exitMeaning: args.exitMeaning?.trim(),
      status: args.status,
      order: args.order,
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: args.status === "archived" ? timestamp : undefined,
    });
    await writeAuditEvent(ctx, scope, user._id, "journey_stage_definition_created", "journeyStageDefinition", definitionId);
    return definitionId;
  },
});

export const saveMyAudienceContext = mutation({
  args: {
    siteId: v.id("sites"),
    personaDefinitionId: v.optional(v.id("personaDefinitions")),
    journeyStageDefinitionId: v.optional(v.id("journeyStageDefinitions")),
    passionTags: v.optional(v.array(v.string())),
    personalizationConsent: v.boolean(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const scope = await resolveActiveScope(ctx, { siteId: args.siteId });
    if (scope.scopeType !== "site") {
      throw new Error("Requested scope is unavailable");
    }
    const existing = await ctx.db
      .query("userAudienceContexts")
      .withIndex("by_user_and_site", (q: any) => q.eq("userId", user._id).eq("siteId", args.siteId))
      .unique();

    if (!args.personalizationConsent) {
      if (existing) {
        assertRecordMatchesResolvedScope(existing, scope);
        await ctx.db.delete(existing._id);
      }
      return null;
    }

    const persona = args.personaDefinitionId
      ? await loadDefinition(ctx, args.personaDefinitionId, scope)
      : null;
    const journeyStage = args.journeyStageDefinitionId
      ? await loadDefinition(ctx, args.journeyStageDefinitionId, scope)
      : null;
    const timestamp = now();
    const value = {
      tenantId: scope.tenantId,
      siteId: scope.siteId,
      userId: user._id,
      personaDefinitionId: persona?._id,
      journeyStageDefinitionId: journeyStage?._id,
      passionTags: normalizePassionTags(args.passionTags ?? []),
      source: "user_selected" as const,
      personalizationConsent: true,
      updatedAt: timestamp,
    };
    if (existing) {
      assertRecordMatchesResolvedScope(existing, scope);
      await ctx.db.patch(existing._id, value);
      return existing._id;
    }
    return await ctx.db.insert("userAudienceContexts", {
      ...value,
      createdAt: timestamp,
    });
  },
});

export const getMyAudienceContext = query({
  args: { siteId: v.id("sites") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const scope = await resolveActiveScope(ctx, { siteId: args.siteId });
    if (scope.scopeType !== "site") {
      throw new Error("Requested scope is unavailable");
    }
    const context = await ctx.db
      .query("userAudienceContexts")
      .withIndex("by_user_and_site", (q: any) => q.eq("userId", user._id).eq("siteId", args.siteId))
      .unique();
    if (!context || !recordMatchesResolvedScope(context, scope) || !context.personalizationConsent) {
      return null;
    }
    const [persona, journeyStage] = await Promise.all([
      context.personaDefinitionId ? ctx.db.get(context.personaDefinitionId) : null,
      context.journeyStageDefinitionId ? ctx.db.get(context.journeyStageDefinitionId) : null,
    ]);
    assertPreviewReferences({
      tenantId: scope.tenantId,
      siteId: scope.siteId,
      persona,
      journeyStage,
    });
    return {
      persona: persona?.key ?? null,
      journeyStage: journeyStage?.key ?? null,
      passionTags: context.passionTags,
      source: context.source,
      updatedAt: context.updatedAt,
    };
  },
});

export const createDraftPresentationProfileRevision = mutation({
  args: {
    siteId: v.id("sites"),
    key: v.string(),
    label: v.string(),
    composition: v.any(),
    provenance: contentProvenance,
    basedOnProfileId: v.optional(v.id("presentationProfiles")),
  },
  returns: v.id("presentationProfiles"),
  handler: async (ctx, args) => {
    const { user, scope } = await requireSitePermission(ctx, args.siteId, "content:edit");
    const key = normalizeAudienceKey(args.key);
    const composition = assertPresentationComposition(args.composition);
    if (args.basedOnProfileId) {
      const basedOn = await ctx.db.get(args.basedOnProfileId);
      assertRecordMatchesResolvedScope(basedOn, scope);
    }
    const latest = await ctx.db
      .query("presentationProfiles")
      .withIndex("by_site_and_key_and_revision", (q: any) => q.eq("siteId", args.siteId).eq("key", key))
      .order("desc")
      .first();
    const timestamp = now();
    const profileId = await ctx.db.insert("presentationProfiles", {
      tenantId: scope.tenantId,
      siteId: scope.siteId,
      key,
      label: args.label.trim(),
      revisionNumber: (latest?.revisionNumber ?? 0) + 1,
      status: "draft",
      composition,
      provenance: args.provenance,
      basedOnProfileId: args.basedOnProfileId,
      createdBy: user._id,
      createdAt: timestamp,
    });
    await writeAuditEvent(ctx, scope, user._id, "presentation_profile_draft_created", "presentationProfile", profileId, {
      key,
      revisionNumber: (latest?.revisionNumber ?? 0) + 1,
    });
    return profileId;
  },
});

export const resolveAdminPreviewContext = query({
  args: {
    siteId: v.id("sites"),
    personaDefinitionId: v.optional(v.id("personaDefinitions")),
    journeyStageDefinitionId: v.optional(v.id("journeyStageDefinitions")),
    presentationProfileId: v.optional(v.id("presentationProfiles")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { scope } = await requireSitePermission(ctx, args.siteId, "site:view");
    const [persona, journeyStage, profile] = await Promise.all([
      args.personaDefinitionId ? ctx.db.get(args.personaDefinitionId) : null,
      args.journeyStageDefinitionId ? ctx.db.get(args.journeyStageDefinitionId) : null,
      args.presentationProfileId ? ctx.db.get(args.presentationProfileId) : null,
    ]);
    assertPreviewReferences({
      tenantId: scope.tenantId,
      siteId: scope.siteId,
      persona,
      journeyStage,
    });
    if (profile) {
      assertRecordMatchesResolvedScope(profile, scope);
      if (profile.status === "archived") {
        throw new Error("Presentation profile is unavailable");
      }
    }
    return {
      siteId: scope.siteId,
      tenantId: scope.tenantId,
      persona: persona ? { id: persona._id, key: persona.key, label: persona.label } : null,
      journeyStage: journeyStage
        ? { id: journeyStage._id, key: journeyStage.key, label: journeyStage.label }
        : null,
      presentationProfile: profile
        ? {
            id: profile._id,
            key: profile.key,
            label: profile.label,
            revisionNumber: profile.revisionNumber,
            status: profile.status,
            composition: profile.composition,
          }
        : null,
      mode: "read_only_preview",
      changesPublishedState: false,
    };
  },
});
