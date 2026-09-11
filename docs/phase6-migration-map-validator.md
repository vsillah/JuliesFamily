# Phase 6 Migration Map Validator

This phase makes the Drizzle-to-Convex migration map executable as a local coverage check.

## Added Scope

- Script: `scripts/validate-drizzle-convex-map.mjs`.
- Package command:

```bash
npm run kinflo:validate-map
```

The validator extracts `pgTable` exports from `shared/schema.ts` and verifies that each source table is named in `docs/drizzle-to-convex-migration-map.md`.

It also checks that the migration map still names the required first-wave Convex target collections and preserves the tenant/site scope rules.

## What It Verifies

- Every Drizzle table constant exported with `pgTable(...)` is accounted for in the migration map.
- Required target collections are named, including:
  - `tenants`
  - `sites`
  - `domains`
  - `memberships`
  - `pages`
  - `contentBlocks`
  - `assets`
  - `auditEvents`
- The migration map still includes tenant-scope and site-scope rules.
- The migration map still says Convex function guards enforce access.

## Current Boundary

This validator is local-only. It reads files from the working tree and does not connect to Postgres, Convex, Vercel, GitHub, or any production system.

It proves migration-map coverage, not data correctness. Data export/import contracts still belong to a later phase after the hosted ownership/auth/backup gate is approved.

## Validation

Current validation:

- `npm run kinflo:validate-map`: passes.
- `npm run kinflo:validate-phases`: passes.
- `npm run convex:check`: passes.
- `npm run build`: passes.

Known not run:

- `npm run convex:codegen`: blocked until a Convex deployment is configured.
- Live Convex smoke: blocked until Convex auth/deployment setup is approved.
