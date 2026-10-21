# KinFlo Phase 8 Release Readiness

Phase 8 adds a bounded, source-only release-readiness contract for the admin dashboard. It is a review surface for the exact active tenant/site scope, not a release, deployment, provider, or persistence mechanism.

## Contract

`client/src/lib/kinfloReleaseReadiness.ts` resolves local readiness fixtures only when the requested tenant/site pair matches the authorized admin scope. It returns explicit `ready`, `blocked`, `empty`, `unauthorized`, and `scope_mismatch` states. Ready and blocked packets carry blockers, next action, owner, evidence, and rollback reference metadata.

The `advisor-client-starter / advisor-client-site` fixture is intentionally blocked by domain, provider, and release-approval gates. The `vanguard-enterprises / vanguard-enterprises` fixture has complete source evidence, while live release remains disabled. A scope with no matching records returns an empty packet instead of borrowing another site's evidence.

## Action boundary

Release, publish, activate, provider writes, sends, uploads, and persistence are represented as blocked actions. The panel renders a disabled action and keeps `canRelease`, `canPublish`, `canActivate`, `providerWrites`, `sends`, `uploads`, and `persistence` false. No generated Convex API, hosted query, provider, storage, analytics, email/SMS, or live task persistence is involved.

## Validation

```sh
npm run kinflo:test-phase8-release-readiness
npm run kinflo:validate-phase8-release-readiness
npm run check
git diff --check
```

This slice remains fixture-backed and preview-only. Hosted activation, deployment, generated bindings, production configuration, provider smoke, and any release decision remain separate gates.
