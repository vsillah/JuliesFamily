# Phase 4: Read Parity Harness

Status: complete for deterministic Batch 1 and Batch 3 fixtures. No live source adapter is connected.

## What It Verifies

`shared/kinfloReadParity.ts` evaluates a source-labelled parity report for an
explicit tenant/site scope. It checks:

- tenant and site identity;
- control-plane counts and membership/role digests;
- CRM lead, pipeline-stage, task, and lead-event counts and digests;
- tenant/site ownership on returned records;
- fixture source metadata and `readOnly: true` markers.

The report includes check metadata, counts, and digests only. It intentionally
does not include raw records or lead contact values.

## Validation

- Eight focused tests passed across the adapter and parity harness.
- Vanguard and Julie fixture scopes both pass Batch 1 and Batch 3 parity.
- A tampered adapter test fails parity as expected and confirms raw fixture
  values are absent from the serialized report.
- Strict TypeScript validation passed for the adapter, parity module, and tests.
- `npm run kinflo:validate-map` passed with 77 Drizzle tables and 104 checks.
- `git diff --check` passed.

No Supabase reads, Convex reads, codegen, deployment, migration, import,
backfill, dual-write, CRM write, provider action, or rendered-app cutover was
run in this phase.

## Next Gate

The deterministic parity gate is complete. A later phase may add a read-only
Postgres or Convex source implementation, but it needs a separate approval
that names the source, exact environment, scope, records or metadata allowed,
and the stop conditions. This branch remains unmounted and fixture-only.
