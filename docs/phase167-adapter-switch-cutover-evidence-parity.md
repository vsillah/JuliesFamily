# Phase 167: Adapter Switch Cutover Evidence Parity

Phase 167 proves the Phase 93 adapter-switch cutover checklist is aligned with the Phase 92 hosted-smoke evidence ledger before any generated adapter switch can be considered.

Command:

```bash
npm run kinflo:validate-adapter-switch-cutover-evidence-parity
```

## Parity Contract

- Cutover batches: 6
- Evidence batches: 6
- Shared batch ids: 6
- Cutover mapped functions: 44
- Hosted smoke evidence gaps: 28
- Source documents:
  - `docs/phase92-hosted-smoke-evidence-ledger.md`
  - `docs/phase165-hosted-smoke-evidence-ledger-parity.md`
  - `docs/phase166-hosted-smoke-evidence-deep-link-parity.md`

Every cutover step must match a hosted-smoke evidence batch id. Every hosted-smoke evidence batch must have a cutover step. The counts are intentionally different: cutover covers the full 44 per-batch adapter-function mappings, while hosted-smoke evidence covers the remaining 28 hosted-smoke gaps after the live-smoke manifest.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No fixture adapter switch is performed.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The cutover checklist is the last local review surface before generated bindings can replace fixtures. It must prove that owner-review evidence exists for the same batches it would eventually switch, while still failing closed on generated imports, live execution, provider writes, and client launch actions.
