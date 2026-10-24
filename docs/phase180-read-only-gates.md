# Phase 180: Read-Only Activation and Cross-Tenant Gates

This development-only harness extends the Phase 174 generated read-only lane with three bounded checks for the Vanguard smoke:

1. `accessPolicy.viewerPermissionSnapshot` resolves the approved Vanguard tenant/site pair without exposing permission payloads.
2. `activation.readiness` returns sanitized authenticated/platform-admin readiness counts.
3. `accessPolicy.viewerPermissionSnapshot` is called with the approved Vanguard tenant ID and a site ID confirmed to belong to another tenant. The expected result is a rejected scope before permission evaluation.

## Safety contract

- The route requires `import.meta.env.DEV` and `devHarness=phase180-cross-tenant-deny-readiness`.
- The existing authenticated KinFlo admin route remains the outer gate.
- All three references are generated query bindings and are called once, sequentially.
- The harness stops after readiness fails or is unknown, and treats a successful mismatched-scope query as a scope leak.
- Only sanitized statuses and readiness counts are rendered. IDs, raw responses, raw errors, deployment identifiers, provider identifiers, tokens, and local paths are excluded.
- The harness contains no mutation, action, upload, provider, adapter, production, or retry path. It does not run codegen or deployment.

## Focused validation

```bash
npm run kinflo:validate-phase180-read-only-gates
npm run kinflo:validate-phase174-generated-read-only-harness
npm run check
git diff --check
```

## Local run

Use the existing approved no-file environment path and open:

```text
http://127.0.0.1:5000/admin/kinflo-os?tab=hosted-activation&devHarness=phase180-cross-tenant-deny-readiness
```

Enter the approved Vanguard tenant and site IDs, then a site ID from a different tenant. Confirm the scope checkbox and run the three gates once. Stop if the approved scope fails, readiness is not authenticated/platform-admin, the mismatched scope succeeds, the error is unknown, or any provider/mutation control appears.
