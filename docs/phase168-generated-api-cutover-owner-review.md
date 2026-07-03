# Phase 168: Generated API Cutover Owner Review

Phase 168 adds a prepare-only owner-review packet for the generated API cutover. It ties the Phase 85 hosted activation approval packet, Phase 88 generated API review board, Phase 92 hosted-smoke evidence ledger, Phase 93 adapter-switch cutover checklist, and Phase 167 cutover/evidence parity into one reviewable artifact before any generated Convex binding can replace fixtures.

Command:

```bash
npm run kinflo:validate-generated-api-cutover-owner-review
```

## Added Artifact

- Packet: `docs/convex-generated-api-cutover-owner-review.json`
- Status: `prepare_only_generated_api_cutover_owner_review`
- Generated API bindings: 86
- Generated API review surfaces: 14
- Cutover batches: 6
- Cutover mapped functions: 44
- Hosted-smoke evidence gaps: 28
- Review items: 5
- Approval recorded in committed source: no

## Owner Review Contract

The packet is not a new approval. It is the evidence envelope the owner can review before deciding whether to open a hosted codegen window later. It requires:

- generated binding totals from the Phase 88 review board,
- the six adapter switch batches from the Phase 93 cutover checklist,
- the six hosted-smoke evidence batches from the Phase 92 evidence ledger,
- the Phase 167 proof that cutover and evidence batch ids match,
- the Phase 85 owner packet as the approval surface.

Every batch remains blocked. Every review item remains pending. The packet keeps `canOpenCodegenWindow`, `canImportGeneratedApi`, `canSwitchFixtureAdapter`, `canExecuteHostedSmoke`, and `canApproveCutover` false.

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

The branch now has generated binding contracts, hosted-smoke evidence, adapter-switch cutover steps, and owner approval gates. This phase turns those separate artifacts into one owner-review packet so the next hosted step can be evaluated from evidence rather than from scattered docs.
