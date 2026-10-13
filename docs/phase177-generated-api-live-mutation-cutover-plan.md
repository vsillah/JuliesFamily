# Phase 177: generated API and limited mutation cutover plan

Production is currently on the Phase 176 read-only Convex adapter. This plan defines the next source, deployment, approval, smoke, rollback, and evidence gates. It does not authorize a mutation smoke or the full live adapter.

## Current production boundary

- The shell reads nine approved Convex queries through `ReadOnlyLiveKinfloShellSnapshotProvider` and keeps fixture fallback available until the entire query batch loads.
- `generatedApiAvailable` and `canUseLiveData` remain `false`; the full `liveKinfloShellAdapter` still throws.
- `controlPlane.upsertCurrentUser` is an identity-projection mutation used only when an authenticated Convex user has no user record. It is not evidence that a KinFlo product mutation batch or full adapter is enabled.
- No product mutation hook is mounted in the live shell snapshot provider.
- `docs/convex-live-smoke-manifest.json` is a historical full-sequence contract. Its publish, invitation, CRM, domain, site-creation, and billing steps are hard no-go actions for the limited mutation window and must not be run as one packet.

## Reusable controls

| Control | Reuse |
| --- | --- |
| `client/src/lib/kinfloGeneratedApiContract.ts` | Diff reviewed generated handles against the 86-function source contract. |
| `client/src/lib/kinfloConvexRuntime.ts` | Keep `canUseLiveData: false`; add a separate fail-closed mutation-smoke gate in the implementation lane. |
| `client/src/contexts/KinfloShellSnapshotContext.tsx` | Preserve the nine-query read-only provider and fixture fallback; do not add general mutation hooks here. |
| `scripts/run-kinflo-with-1password-env.mjs` | Inject Convex deployment and auth values without `.env.local` or secret output. |
| `kinflo:validate-generated-api`, `kinflo:validate-live-smoke`, and `kinflo:dry-run-live-smoke` | Validate contracts and print the historical sequence only; the dry run never authorizes execution. |
| Phase 91 sequencer, Phase 92 evidence ledger, Phase 93 cutover checklist, and Phase 173 rollback matrix | Reuse batch ids, evidence slots, owner labels, and fixture fallback language. |

## Source gap identified before this implementation lane

The first product-mutation candidate remains `preferences.upsertMyPreferences`, because it is current-user scoped and has no provider side effect. It is not ready for a production smoke yet:

1. There is no exact restore/delete path when the smoke user had no prior `adminPreferences` row.
2. The mutation has no smoke marker, approval id, expiry, or audit receipt.
3. Several payload fields use `v.any()`, so a smoke harness needs a deliberately tiny scalar allowlist rather than forwarding the full preferences payload.
4. The client has no independent, default-off mutation-smoke gate; enabling `canUseLiveData` would be too broad.

The next implementation lane should add a dedicated server-side preference smoke operation, not enable the general preferences adapter. The operation must:

- require the authenticated `platform.super_admin` and a server-side, default-off smoke window;
- accept one approval id, one expiry, one request nonce, and one allowlisted scalar sentinel such as `dataDensity`;
- snapshot whether the current user's unscoped preference row exists and its exact prior values;
- write and read back the sentinel inside the bounded operation;
- restore the exact prior row, or delete the newly created row when no prior row existed;
- leave one sanitized audit receipt containing function name, actor id, approval id, nonce hash, timestamps, and cleanup result, but no secret or raw preference payload;
- reject reuse, expiry, tenant/site scope, arbitrary fields, and any provider-facing action;
- expose no persistent product save control and leave `canUseLiveData` false.

Until that source and its validators are merged and deployed with the server gate off, a mutation-smoke request is premature.

## Batches 1-2 source implementation status

The source-only implementation lane now provides the reviewable capability without opening either gate:

- `client/src/lib/kinfloGeneratedApiSeam.ts` resolves reviewed generated handles without importing ignored codegen output. General mutation handles fail closed unless an exact path is allowlisted, and the preference-smoke handle has a separate explicit client gate.
- `client/src/lib/kinfloConvexRuntime.ts` records `preferenceMutationSmokeClientAvailable: false` and `canRequestPreferenceMutationSmoke: false`; no component or provider mounts the smoke mutation.
- `convex/preferences.ts` exports `runPreferenceSmoke` with fixed `dataDensity` field/value validators and three server bindings: enabled flag, approval id, and exact expiry.
- `convex/preferenceSmokeCore.ts` enforces platform-super-admin authorization, expiry, approval matching, SHA-256 nonce replay protection, exact restore/delete cleanup, read-back, and redacted receipt creation.
- `preferenceSmokeReceipts` stores the sanitized receipt and indexed nonce hash. It stores no raw nonce, sentinel value, secret, or raw preference payload.
- `scripts/test-kinflo-preference-smoke.ts` runs the eight focused behavioral cases locally, while `scripts/validate-kinflo-preference-smoke-source.mjs` proves the source boundary remains fail closed.

This closes the source gap only. Batch 3 deployment, server environment configuration, and any Batch 4-5 smoke request or execution remain separate captain/user gates.

## Batches 4-5 production smoke result

Status: complete on October 13, 2026.

Approved execution binding:

- Target deployment: `dpl_Ef8huNAEDBEwMBBx6Cr3Q2iwc41x`
- Target source commit: `b1ac03f8ad037908d3e307dab22e4adcb465f0ce`
- Convex deployment: `hallowed-manatee-765`
- Approval id: `phase177-batch4-preference-smoke-2026-10-13`
- Mutation executed: `preferences.runPreferenceSmoke`
- Sentinel: `dataDensity = spacious`
- Actor user id: `q175437qr42jajgpqvwapcn4ys8g69w9`

Sanitized receipt:

- Receipt id: `q573m3wengmf6a8e9hdh29w5658g7hfc`
- Function: `preferences.runPreferenceSmoke`
- Cleanup result: `deleted_new`
- Prior row existed: `false`
- Read-back verified: `true`
- Redaction version: `preference-smoke-v1`

Evidence:

- Before read-only state: `dataDensity=null`, `exists=false`, `updatedAt=null`
- After read-only state: `dataDensity=null`, `exists=false`, `updatedAt=null`
- Replay denial: nonce reuse rejected with `Preference smoke nonce has already been used`
- Gate-off proof: `0` remaining `KINFLO_PREFERENCE_SMOKE_*` environment names
- Temporary grant helper: `phase177Ops` absent from deployed function spec after cleanup
- Deployed smoke function: `preferences.runPreferenceSmoke` present
- Provider-write zero proof: no publish, billing, invitation, email/SMS, CRM lead, site creation, domain/DNS, storage, provider, full-adapter, or broad mutation actions were invoked
- `.env.local`: absent after execution

This evidence closes only the bounded preference-smoke window. It does not authorize the limited preferences adapter, full live adapter, provider writes, public publish, billing, invitations, email/SMS, CRM lead writes, site creation, domain/DNS, or storage actions.

## Ordered cutover batches

### Batch 0 — freeze and bind the read-only baseline

Owner approval: Integration Captain confirms the exact production commit and deployment; Vambah confirms the existing read-only shell remains the accepted baseline.

Actions: capture the exact commit/deployment, nine-query inventory, runtime flag names without values, authenticated route result, fixture fallback, and `canUseLiveData: false`.

Validation: `npm run kinflo:validate-read-only-live-adapter`, `npm run kinflo:validate-live-adapter`, and authenticated query-only production smoke.

Rollback checkpoint: retain the Phase 176 flags and fixture provider. Stop if the deployment cannot be bound to the reviewed commit or any product mutation hook appears.

### Batch 1 — generated binding and adapter-seam review

Owner approval: Integration Captain opens a source-only implementation lane. No production mutation approval is implied.

Actions: run approved codegen through the 1Password wrapper, compare generated handles with `KINFLO_GENERATED_API_BINDINGS`, add a typed binding seam, and keep all product mutations unreachable.

Validation: `npm run convex:check`, `npm run kinflo:validate-generated-api`, `npm run kinflo:validate-generated-api-cutover-readiness-scoreboard`, and a production build/typecheck for the implementation PR.

Rollback checkpoint: discard generated working-tree output and preserve the Phase 176 `makeFunctionReference` read adapter if binding or build parity fails.

### Batch 2 — implement the smoke-only preference transaction

Owner approval: Integration Captain approves the source design and tests. The smoke window remains off in every deployed environment.

Actions: add the server-gated write/read/restore operation described above, replay protection, sanitized audit receipt, and focused validators. Do not mount the full preferences adapter.

Validation: local Convex tests for unauthorized actor, disabled window, expired approval, replayed nonce, forbidden field, exact restoration of an existing row, deletion of a newly created row, and redacted receipt; then `npm run convex:check` and the focused KinFlo validators.

Rollback checkpoint: revert the smoke operation source before deployment if any cleanup, authorization, or redaction test fails.

### Batch 3 — deploy inert capability and re-prove reads

Owner approval: Integration Captain approves merge/deployment of the reviewed source with the server smoke gate off. This still does not authorize a mutation.

Actions: deploy the exact merge commit, verify both the client gate and server gate are off, repeat the authenticated nine-query smoke, and prove a smoke request is rejected while disabled.

Evidence: commit, deployment id, disabled-gate rejection, query transcript, no product mutation receipt, and unchanged provider-write counters.

Rollback checkpoint: roll back to the Phase 176 deployment if read parity, auth isolation, or disabled-gate behavior changes.

### Batch 4 — request one bounded production mutation smoke

Required approval: Vambah must approve the exact deployment id, authenticated smoke actor, unscoped preference target, allowlisted sentinel field/value, approval id, nonce, start/expiry window, executor, rollback owner, evidence location, and stop conditions. The Integration Captain must confirm Batch 3 evidence first.

The request must explicitly exclude publish, billing, invitations, email/SMS, CRM lead writes, site creation, domain/DNS, storage, provider calls, generated full-adapter cutover, and retries. A failed or unknown result stops the window; it does not authorize a retry.

Rollback checkpoint: keep both gates off until the fully bound approval exists.

### Batch 5 — execute once, clean up, and close the window

Executor: named platform super admin. Rollback owner: named Integration Captain or platform super admin who can disable the server gate and restore the prior deployment.

Sequence: capture baseline read and row-existence state; open only the timeboxed server gate; execute the approved nonce once; capture the sanitized receipt; confirm exact restore/delete cleanup; repeat the baseline read; close the gate; verify nonce replay and a fresh unauthorized request both fail.

Evidence: approval binding, timestamps, function name, actor id, hashed nonce, before/after row-existence and permitted-field parity, cleanup result, audit event id, gate-off proof, replay denial, and zero provider actions. Never capture secrets or raw private preference payloads.

Rollback checkpoint: on any mismatch or unknown outcome, close the gate immediately, keep the product preferences adapter disabled, restore the Phase 176 deployment if needed, preserve the sanitized evidence, and stop without retry.

### Batch 6 — limited preferences adapter review

Owner approval: a new captain decision after Batch 5 passes. Mutation-smoke approval alone does not authorize this cutover.

Actions: separately review `preferences.getMyPreferences` plus `preferences.upsertMyPreferences`, client UX, default-off flags, fixture fallback, and per-user/tenant/site isolation. Only the preferences surface may move; `canUseLiveData` stays false for every other batch.

Validation: desktop and mobile UI behavior, blocked/error/recovery states, cross-user and cross-tenant denial, exact persisted preference behavior, and fixture restoration. Client-facing changes require an MP4 Human-QA handoff before closeout.

Rollback checkpoint: disable the preferences-specific flag and restore fixture preferences without changing the nine-query read-only adapter.

### Batch 7 — later full-adapter sequence

After a separately approved Batch 6, continue the existing adapter-switch order one batch at a time: `site-creation-and-admin`, `public-crm-loop`, `provider-readiness-records`, then `campaign-and-ai-governance`. Each needs a new approval, its own evidence and cleanup proof, and its own rollback drill. Provider writes, invitations, publish, billing, storage, email/SMS, and DNS remain separate no-go gates.

## Source-only validation for this plan

```bash
npm run convex:check
npm run kinflo:validate-generated-api
npm run kinflo:validate-live-adapter
npm run kinflo:validate-read-only-live-adapter
npm run kinflo:test-preference-smoke
npm run kinflo:validate-preference-smoke-source
npm run kinflo:validate-live-smoke
npm run kinflo:dry-run-live-smoke
npm run kinflo:validate-adapter-switch-cutover-checklist
npm run kinflo:validate-generated-api-cutover-readiness-scoreboard
npm run kinflo:validate-generated-api-cutover-rollback-drill-matrix
npm run kinflo:validate-generated-api-live-mutation-cutover-plan
```

These commands are local contract checks. None opens a smoke window, imports production data, deploys, or runs a live mutation.

## Captain decision needed next

Batch 6 is the next reviewable phase: limited preferences adapter review. The bounded Batch 4-5 mutation smoke passed and the server gate is closed, but mutation-smoke approval alone does not authorize a client adapter cutover.

Before Batch 6 can open, the captain should create or route a dedicated implementation lane for the limited preferences adapter and require:

- default-off feature gating,
- fixture fallback preservation,
- desktop and mobile UI behavior review,
- blocked/error/recovery states,
- cross-user and cross-tenant denial,
- exact persisted preference behavior,
- post-change MP4 and image evidence before any client-facing Human QA request.

Provider writes, invitations, publish, billing, storage, email/SMS, DNS, and the full live adapter remain separate no-go gates.
