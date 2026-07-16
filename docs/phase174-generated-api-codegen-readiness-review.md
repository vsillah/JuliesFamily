# Phase 174: Generated API Codegen Readiness Review

This lane reviews the current generated API contract against the Convex module exports after Convex Auth setup on `dev:hallowed-manatee-765`.

Codegen is not run in this phase. The committed gate state still blocks the codegen window:

- `docs/convex-hosted-activation-approval-packet.json` keeps `env-and-codegen-window` at `blocked_provider_gate`.
- `docs/convex-generated-api-cutover-owner-review.json` keeps `decisionFlags.canOpenCodegenWindow` as `false`.
- `client/src/lib/kinfloConvexRuntime.ts` keeps `generatedApiAvailable` as `false`.

## Review Result

- Runtime contract functions: 86
- Generated API bindings: 86
- Query bindings: 48
- Mutation bindings: 38
- Convex modules covered: 14
- Missing Convex exports found: 0
- Generated API files tracked: 0
- Generated API imported: no
- Fixture adapter switched: no
- Hosted smoke executed: no

`client/src/lib/kinfloGeneratedApiContract.ts` and `client/src/lib/kinfloConvexRuntime.ts` match the current Convex modules listed below:

- `accessPolicy`
- `activation`
- `aiReview`
- `campaigns`
- `controlPlane`
- `crm`
- `entitlements`
- `integrations`
- `launchReadiness`
- `preferences`
- `publicSite`
- `roleCatalog`
- `siteBuilder`
- `siteFactory`

## Readiness Checklist

- Contract coverage: ready for generated binding diff review.
- Convex TypeScript check: ready.
- Cutover scoreboard: blocked by owner/codegen/smoke gates, as expected.
- Rollback drill matrix: blocked by owner/codegen/smoke gates, as expected.
- 1Password env injection: blocked in this terminal because the 1Password CLI is not signed in.
- Codegen window: blocked until Sundiata or Vambah explicitly opens `env-and-codegen-window`.
- Generated API import: blocked until generated bindings are reviewed and Sundiata approves the adapter-switch lane.

## Validation

```bash
OP_KINFLO_CONVEX_ITEM=uyq6zixp3i4p5iek463hd255qq npm run kinflo:1password-env-check
# blocked: 1Password CLI is not signed in in this terminal

npm run convex:check
# passed

npm run kinflo:validate-generated-api
# passed: 281 checks

npm run kinflo:validate-generated-api-cutover-readiness-scoreboard
# passed: 76 checks

npm run kinflo:validate-generated-api-cutover-rollback-drill-matrix
# passed: 71 checks

git diff --check
# passed
```

## Blockers Before Codegen

1. The integration captain must explicitly open the `env-and-codegen-window`.
2. The terminal that runs the 1Password wrapper must complete `op signin`.
3. The generated diff must be reviewed against `KINFLO_GENERATED_API_BINDINGS`.
4. `generatedApiAvailable` must stay `false` until a separate adapter-switch lane is approved.
5. Fixture adapters must stay active until read-only smoke evidence and rollback owners are accepted.

## Provider Boundary

No hosted Convex query, mutation, or action is executed.

No generated Convex API files are created, committed, or imported.

No secret values are printed or written to source.

No `.env.local` fallback is used.

No production deployment, hosted smoke, provider write, public publish, lead write, invite send, campaign send, or client share is performed.
