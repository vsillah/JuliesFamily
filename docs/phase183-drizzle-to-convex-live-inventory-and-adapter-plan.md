# Phase 183: Drizzle-to-Convex Live Inventory and Adapter Plan

## Status

- Scope: KinFlo only. Portfolio remains on Supabase.
- Source: KinFlo Website Supabase project, read-only metadata inspection.
- Snapshot date: 2026-11-06.
- Live connection: verified through the Infisical-bound session pooler.
- Live data reads: none.
- Schema or data writes: none.
- Convex codegen, deployment, import, and runtime cutover: none.

The connection credential is stored in Infisical under the KinFlo development
environment. No credential value is recorded in this document.

## Live Source Inventory

The live public schema contains:

| Measure | Result |
| --- | ---: |
| Base tables | 77 |
| Columns | 1,050 |
| Foreign-key constraints | 133 |
| Indexes | 256 |

The 77 live table names match the local Drizzle migration inventory. This
confirms source presence and connectivity; it does not yet prove row-level
completeness, field-level semantic parity, or safe production cutover.

The local repository validators also pass:

- `npm run kinflo:validate-schema-coverage`
- `npm run kinflo:validate-map`

The current Convex source schema contains 46 collections. The existing map
covers all 77 Drizzle tables, with explicit consolidation or deferral rules.

## Adapter Boundary

The first adapter must be read-only and source-selectable. It should expose a
stable application contract without importing generated Convex bindings or
changing the current fixture behavior.

```ts
type DataSource = "fixture" | "postgres" | "convex";

type Scope = {
  tenantId?: string;
  siteId?: string;
  userId?: string;
};

type ReadResult<T> = {
  source: DataSource;
  records: T[];
  nextCursor?: string;
};

interface KinFloReadAdapter {
  listLeads(scope: Scope, input: { limit: number; cursor?: string }): Promise<ReadResult<Lead>>;
  getLead(scope: Scope, leadId: string): Promise<ReadResult<Lead>>;
  listLeadEvents(scope: Scope, leadId: string, input: { limit: number; cursor?: string }): Promise<ReadResult<LeadEvent>>;
  listPipelineStages(scope: Scope): Promise<ReadResult<PipelineStage>>;
  listTasks(scope: Scope, input: { limit: number; cursor?: string }): Promise<ReadResult<Task>>;
}
```

Rules for the adapter:

1. Resolve tenant and site scope before reading records.
2. Require bounded limits or Convex pagination for every list.
3. Never use client-side filtering as the authorization boundary.
4. Return source metadata so fixture, Postgres, and Convex results cannot be
   presented as interchangeable without an explicit parity check.
5. Keep writes out of this adapter. Write adapters are a later, separately
   approved phase.
6. Keep provider credentials and database credentials outside Convex records.

## Migration Batches

### Batch 1: Identity and Control Plane

Target collections:

- `users`
- `tenants`
- `sites`
- `memberships`
- `roles`
- `invitations`
- `themeTokens`
- `featureFlags`
- `auditEvents`

Source inputs include `users`, `organizations`, `adminPreferences`,
`adminEntitlements`, `auditLogs`, and `sessions`.

`sessions` is not copied as a table. It is replaced by Convex Auth or the
approved provider session model. Identity mapping must preserve the OIDC/Auth
subject and must never use email alone as the ownership key.

### Batch 2: Public Renderer and Site Configuration

Target collections:

- `pages`
- `pageRevisions`
- `contentBlocks`
- `contentVisibilityRules`
- `navigationItems`
- `assets`
- `publishEvents`
- `programs`
- `reviews`

Source inputs include `contentItems`, `contentVisibility`, `imageAssets`,
`programs`, `googleReviews`, `leadMagnets`, and `wishlistItems`.

Binary files remain in the approved object or media provider. Convex stores
metadata, ownership, provenance, approval, and publish state.

### Batch 3: CRM Core

Target collections:

- `leads`
- `leadEvents`
- `pipelineStages`
- `leadAssignments`
- `tasks`
- `pipelineEvents`
- `journeyProgressionRules`
- `journeyProgressionEvents`

Source inputs include `leads`, `interactions`, `pipelineStages`,
`leadAssignments`, `tasks`, `pipelineHistory`, `funnelProgressionRules`, and
`funnelProgressionHistory`.

Every migrated CRM document must carry explicit `tenantId` and `siteId`
ownership. Timeline and pipeline history remain append-only in Convex.

### Batch 4: Optional Modules

These remain behind explicit tenant/site entitlements until the core read
parity is proven:

- campaigns, email, SMS, attribution, segments, experiments, and analytics;
- donations, fundraising, and billing;
- Julie-specific program and volunteer modules;
- chatbot, backup, and operational support records.

High-volume event tables require retention and rollup decisions before they
are imported into Convex. They should not be copied wholesale by default.

## Parity Contract

Each batch must produce a redacted evidence packet containing:

1. Source table and target collection counts.
2. Field mapping, normalization, and intentionally omitted fields.
3. Foreign-key to document-reference mapping.
4. Scope and authorization rule mapping.
5. Read-count and checksum comparisons on synthetic or approved records.
6. Duplicate, orphan, nullability, enum, and timestamp reports.
7. A rollback pointer and an explicit cutover owner.

Parity is not complete when the target schema exists. It is complete only when
the read adapter returns equivalent scoped results for the approved fixture
and sampled live records, with no cross-tenant leakage.

## Execution Gates

The following actions remain outside this source-only phase:

- Convex deployment or project selection.
- Convex codegen or generated API imports.
- Supabase migrations or schema changes.
- Data export, import, backfill, deletion, or dual-write activation.
- CRM, provider, email, SMS, billing, or storage writes.
- Auth or role cutover.
- Switching the rendered application from fixtures or Postgres to Convex.

The next implementation gate is a source-only read adapter contract and test
fixture for Batch 1 and Batch 3. It may add types, parsers, and deterministic
tests, but it must remain unmounted and must not require live credentials to
run.
