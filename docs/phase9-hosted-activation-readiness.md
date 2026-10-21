# KinFlo Phase 9 Hosted Activation Readiness

Phase 9 adds a compact, source-only readiness contract to the Hosted Activation tab. It summarizes the existing ledger for the selected tenant/site pair without duplicating its detailed review records or granting permission to execute hosted work.

## Contract

`client/src/lib/kinfloHostedActivationReadiness.ts` resolves only evidence that matches the requested tenant/site scope and the authorized admin scope. It exposes explicit `ready`, `blocked`, `empty`, `unauthorized`, and `scope_mismatch` states. A packet carries the owner, evidence, next action, rollback reference, and the six activation gates: ownership, environment, generated API review, activation preflight, hosted smoke, and fixture rollback.

The Vanguard fixture is intentionally blocked or pending across the hosted gates, with the fixture rollback checkpoint marked ready. A custom scope with no matching records returns an empty packet rather than borrowing Vanguard evidence.

## Action boundary

Convex codegen, hosted deployment, hosted smoke, provider writes, email/SMS, uploads, storage/persistence, and production changes remain disabled. The panel renders a disabled action control and the contract keeps every corresponding capability false, even when a test packet contains all-ready evidence. No generated API, hosted query, provider, storage, analytics, email/SMS, or data mutation is involved.

## Validation

```sh
npm run kinflo:test-phase9-hosted-activation-readiness
npm run kinflo:validate-phase9-hosted-activation-readiness
npm run check
git diff --check
```

This slice is fixture-backed and review-only. The existing Hosted Activation Ledger remains the detailed source of truth; any preflight, codegen, smoke, deployment, provider, persistence, or production action requires its own explicit approval and gate.
