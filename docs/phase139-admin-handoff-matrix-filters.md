# Phase 139: Admin Handoff Matrix Filters

Phase 139 makes the client admin handoff matrix reviewable by filter so a super admin can jump directly to the handoff risk slice that matters before any invitation, membership grant, provider write, or live permission mutation is enabled.

Validation command:

```bash
npm run kinflo:validate-admin-handoff-matrix-filters
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=site-studio&studioLane=handoff&studioHandoff=matrix`
- Matrix query param: `studioMatrix=all|blocked|ready|platform|tenant|site`
- State reader: `readInitialClientAdminHandoffMatrixFilter`
- Route-aware selector: `selectClientAdminHandoffMatrixFilter`
- Matrix filter tabs: `tabs-kinflo-client-admin-handoff-matrix-filter`
- Filter tabs: `tabs-kinflo-client-admin-handoff-matrix-filter-all`, `tabs-kinflo-client-admin-handoff-matrix-filter-blocked`, `tabs-kinflo-client-admin-handoff-matrix-filter-ready`, `tabs-kinflo-client-admin-handoff-matrix-filter-platform`, `tabs-kinflo-client-admin-handoff-matrix-filter-tenant`, and `tabs-kinflo-client-admin-handoff-matrix-filter-site`
- Empty states: `section-kinflo-client-admin-handoff-matrix-table-empty` and `section-kinflo-client-admin-handoff-matrix-blocked-empty`

## What Changed

The matrix workspace now has a compact filter control for all rows, blocked handoffs, ready handoffs, and platform, tenant, or site scopes. The visible table and blocked-action rail use the same filtered row set so a super admin can evaluate the current slice without scanning the whole matrix.

The active filter is controlled by React state seeded from `studioMatrix`. A direct link such as `/admin/kinflo-os?tab=site-studio&studioSite=julies-family-public&studioLane=handoff&studioHandoff=matrix&studioMatrix=tenant` opens the handoff matrix directly to tenant-scoped admin review.

When the operator leaves the matrix workspace, the shell clears `studioMatrix` so stale matrix filters do not leak into selected-site handoff, Workbench, hosted activation, adapter switch, or other review links.

## Provider Boundary

No client admin invitation is sent.

No membership grant or permission write is executed.

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API, tenant/site launch, public publish, lead write, invite, campaign send, domain action, production import, adapter switch, or client sharing action is executed.

No secret values are read or printed.

## Why This Matters

KinFlo needs one underlying software system to support many client websites with different owner, tenant admin, and site editor permissions. Filtered handoff review gives the super admin a fast way to inspect scope risk before approving client-admin access.
