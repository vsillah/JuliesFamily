# Phase 178: authenticated preview activation control

## Scope

This phase adds the smallest authenticated dev control needed to initialize KinFlo on Convex deployment `hallowed-manatee-765`.

The first signed-in user sees the bootstrap action only when `activation.readiness` reports `bootstrap_platform_admin` and confirms that no platform admin exists. The button calls `controlPlane.bootstrapPlatformAdmin`. Once the user is a platform admin, the hosted activation tab shows a fixed Vanguard seed review. Its confirmation calls `activation.seedSmokeSite` with `vanguard-enterprises` as the tenant, site, and subdomain slug.

## Safety boundary

- The controls are disabled for every Convex hostname except `hallowed-manatee-765.convex.cloud` and `hallowed-manatee-765.convex.site`.
- The bootstrap mutation remains responsible for rejecting a second platform admin.
- The seed uses the existing `advisor-consultant` template and the existing activation audit event.
- Adapter switching, codegen, provider calls, invitations, billing, uploads, and live smoke remain out of scope.
- No generated API bindings or secret files are added.
- No bootstrap or seed was executed in this development lane.

## Validation

```bash
npm run kinflo:validate-preview-activation-control
npm run kinflo:validate-convex-identity-cutover
npm run convex:check
npm run check
npm run build:client
```

Client-facing evidence must include desktop and mobile views of the bootstrap gate plus the post-bootstrap Vanguard seed-ready state. The walkthrough must use synthetic, privacy-safe identity labels and must not execute either mutation.

The local-only `activationEvidence` visual fixture supports that review. It is available only through the development `local_fixture` identity mode, labels itself as a visual fixture, and replaces both live mutations with display-only state changes.
