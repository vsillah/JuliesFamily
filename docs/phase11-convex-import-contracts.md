# Phase 11 Convex Import Contracts

This phase adds a provider-light import contract layer for moving legacy Drizzle data into the implemented Convex collections.

## Added Scope

Artifacts:

- `docs/convex-import-contracts/import-manifest.json`
- `scripts/validate-convex-import-contracts.mjs`
- `scripts/dry-run-convex-import-contracts.mjs`

Package scripts:

- `npm run kinflo:validate-imports`
- `npm run kinflo:dry-run-imports`

## Contract Rules

The manifest is deterministic and reviewable:

- every contract has a stable `id`,
- contract ids are sorted,
- every contract has a deterministic `idempotencyKey`,
- every implemented Convex collection has a contract,
- every Drizzle source table reference must exist in `shared/schema.ts`,
- every target collection must exist in `convex/schema.ts`,
- `externalWrites` must remain `false`,
- hosted Convex deployment state is not referenced,
- local `/Users/` paths and email-shaped references are rejected.

## Current Boundary

This phase does not run `convex dev`, does not generate Convex runtime files, does not import production data, and does not create a hosted Convex deployment.

The dry run prints the contract plan only. It validates shape, source table names, target collection names, and no-external-write boundaries.

## First Hosted Smoke

After Convex auth/deployment setup is approved:

1. Run `npm run kinflo:validate-imports`.
2. Run `npm run kinflo:dry-run-imports`.
3. Generate a sanitized sample export from a non-production fixture or approved staging source.
4. Apply one collection at a time in the hosted dev deployment.
5. Confirm idempotent reruns do not duplicate users, tenants, sites, roles, or content records.
6. Confirm migrated records preserve tenant/site scope.
7. Confirm audit events distinguish imported records from live user actions.

## Validation

Current validation:

- `npm run kinflo:validate-imports`: passes.
- `npm run kinflo:dry-run-imports`: passes.
- `npm run convex:check`: passes.
- `npm run kinflo:validate-phases`: passes.
- `npm run kinflo:validate-map`: passes.
- `npm run build`: passes.

Known not run:

- Live import: blocked until Convex auth/deployment setup and approved source export are available.
