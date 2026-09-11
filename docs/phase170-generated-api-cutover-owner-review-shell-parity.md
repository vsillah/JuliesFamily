# Phase 170: Generated API Cutover Owner Review Shell Parity

Phase 170 adds a provider-light parity gate between the Phase 168 generated API cutover owner-review packet and the Phase 169 Hosted Activation shell surface.

Command:

```bash
npm run kinflo:validate-generated-api-cutover-owner-review-shell-parity
```

## What Changed

- `docs/convex-generated-api-cutover-owner-review.json` remains the source packet for owner-review counts, items, batches, and blocked decisions.
- `hostedActivationRunbook.generatedApiCutoverOwnerReview` remains the shell projection for super-admin review.
- `scripts/validate-kinflo-generated-api-cutover-owner-review-shell-parity.mjs` compares the shell projection back to the packet before any generated API cutover work can be treated as ready.

## Parity Checks

- Packet phase: 168
- Shell phase: 169
- Generated API bindings: 86
- Generated API review surfaces: 14
- Cutover batches: 6
- Cutover mapped functions: 44
- Hosted-smoke evidence gaps: 28
- Review items: 5
- Ready review items: 0
- Pending review items: 5
- Five review item ids, labels, evidence notes, blocked-until notes, statuses, and approval flags match the packet.
- Six cutover batch ids, labels, cutover counts, hosted-smoke evidence gap counts, owner-review statuses, and cutover flags match the packet.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No fixture adapter switch is performed.

No hosted smoke is executed.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The owner-review shell duplicates important cutover data so the super admin can inspect it from KinFlo OS. This phase makes that duplication auditable: if the packet and shell drift, validation fails before codegen, generated API import, hosted smoke, fixture adapter switch, or provider writes can proceed.
