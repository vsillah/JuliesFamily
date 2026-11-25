import { anyApi, type DefaultFunctionArgs, type FunctionReference } from "convex/server";

type QueryReference<Args extends DefaultFunctionArgs = DefaultFunctionArgs, Result = unknown> = FunctionReference<"query", "public", Args, Result>;
type MutationReference<Args extends DefaultFunctionArgs = DefaultFunctionArgs, Result = unknown> = FunctionReference<"mutation", "public", Args, Result>;

type Viewer = { _id: string; platformRole?: string } | null;
type Tenant = { _id: string; slug: string; status: string };
type Site = { _id: string; tenantId: string; slug: string; status: string };

type Lead = { _id: string; email: string; siteId: string; status: string; pipelineStageKey?: string };
type Timeline = { lead: Lead; events: unknown[]; pipelineEvents: unknown[]; journeyProgressionEvents: unknown[]; assignments: unknown[]; tasks: unknown[] };

type Phase175GeneratedApi = {
  controlPlane: {
    viewer: QueryReference<Record<string, never>, Viewer>;
    listTenants: QueryReference<Record<string, never>, Tenant[]>;
    listSitesForTenant: QueryReference<{ tenantId: string }, Site[]>;
  };
  crm: {
    submitLead: MutationReference<{ siteId: string; email: string; firstName?: string; lastName?: string; source?: string; notes?: string; metadata?: unknown }, { leadId: string; status: string }>;
    listLeads: QueryReference<{ siteId: string; status?: string; limit?: number }, Lead[]>;
    getLeadTimeline: QueryReference<{ leadId: string }, Timeline>;
    transitionLeadStage: MutationReference<{ leadId: string; toStageKey: string; reason?: string; metadata?: unknown }, unknown>;
    updateLead: MutationReference<{ leadId: string; notes?: string; tags?: string[]; metadata?: unknown; status?: string }, unknown>;
    assignLead: MutationReference<{ leadId: string; assignedTo: string; assignmentType?: string; notes?: string }, string>;
    createTask: MutationReference<{ siteId: string; leadId?: string; assignedTo?: string; title: string; description?: string; taskType: string; priority?: string; status?: string; metadata?: unknown }, string>;
  };
};

export const api = anyApi as unknown as Phase175GeneratedApi;
