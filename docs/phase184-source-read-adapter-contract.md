# Phase 3: Source-Only Read Adapter Contract

Status: complete for the unmounted fixture contract. This phase does not connect the application to Postgres or Convex.

## Scope

- KinFlo only.
- Identity/control-plane fixture coverage for Batch 1.
- Lead, lead-event, pipeline-stage, and task fixture coverage for Batch 3.
- Exact tenant/site scope is required for every read.
- The adapter exposes reads only; it has no create, update, delete, publish, send, or migration method.

## Implementation

- Contract and deterministic fixture: `shared/kinfloReadAdapter.ts`
- Focused contract test: `scripts/test-kinflo-read-adapter.ts`
- Package command: `npm run kinflo:test-read-adapter`

The fixture includes separate Vanguard and Julie scopes. A Vanguard read returns only Vanguard records, and a cross-scope lead lookup returns `null` rather than revealing Julie data. Missing or mismatched tenant/site scope throws `KinfloScopeError` before any read is performed. List methods are bounded and return a continuation cursor.

The contract preserves source metadata (`fixture`, `postgres`, or `convex`), the resolved scope, and an explicit `readOnly: true` marker so future source adapters cannot silently lose provenance or write boundaries.

## Validation

- Six focused adapter tests passed.
- Strict TypeScript validation passed for the new contract and test.
- `npm run kinflo:validate-map` passed with 77 Drizzle tables and 104 checks.
- `git diff --check` passed.

No live credentials, Postgres reads, Convex codegen, generated API imports, migrations, imports, deployments, data writes, or cutover actions were run in this phase.

## Next gate

Review the contract and approve a separate source adapter implementation plan before connecting either Postgres or Convex. The next implementation should remain read-only and add parity checks against approved records without changing the rendered app or enabling writes.
