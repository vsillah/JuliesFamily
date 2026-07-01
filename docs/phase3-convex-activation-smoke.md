# Phase 3 Convex Activation Smoke

This phase adds the first deterministic live-smoke contract for the Convex-backed KinFlo SaaS path.

## Added Scope

- Convex module: `convex/activation.ts`.
- Readiness query:
  - `activation.readiness`
- Smoke seed mutation:
  - `activation.seedSmokeSite`
- Provider-light type validation through `npm run convex:check`.

## What The Smoke Proves

Once a hosted Convex deployment and auth provider are configured, the activation smoke should prove that:

1. The signed-in account has a Convex identity.
2. The account has been synced into `users`.
3. The account is the platform `super_admin`.
4. A smoke tenant can be created or reused idempotently.
5. The platform admin receives owner membership for that tenant.
6. A smoke site can be created or reused idempotently from a starter template.
7. Theme tokens, navigation, pages, blocks, visibility rules, and feature flags are created for a new smoke site.
8. The homepage is published with a page revision and publish event.
9. The returned `resolverArgs` can be passed to `publicSite.resolvePublishedSite`.
10. Audit events include the activation seed action.

## Current Boundary

No hosted Convex project is created by this branch.

This module is intentionally provider-light until Vambah approves the hosted ownership/auth/backup gate. It gives the live setup a repeatable first test without treating local scaffolding as deployment approval.

## Activation Runbook

After the hosted Convex setup is approved:

1. Configure the Convex deployment and auth provider.
2. Run the provider-light activation preflight:

```bash
npm run kinflo:activation-preflight
```

3. Run:

```bash
npm run convex:codegen
```

4. Sign in as Vambah.
5. Run `controlPlane.upsertCurrentUser`.
6. Run `controlPlane.bootstrapPlatformAdmin`.
7. Run `activation.readiness`.
8. Run `activation.seedSmokeSite` with defaults or explicit args:

```json
{
  "tenantName": "KinFlo Activation Smoke",
  "tenantSlug": "kinflo-activation-smoke",
  "siteName": "KinFlo Smoke Site",
  "siteSlug": "kinflo-smoke-site",
  "subdomain": "kinflo-smoke",
  "templateKey": "nonprofit-learning-center"
}
```

9. Pass the returned `resolverArgs` to `publicSite.resolvePublishedSite`.
10. Confirm the resolver returns tenant, site, theme, navigation, page, and published blocks.
11. Confirm `activation.readiness` reports at least one tenant, one site, and one published site.

## Validation

Current validation:

- `npm run convex:check`: passes.
- `npm run build`: passes.

Known not run:

- `npm run convex:codegen`: blocked until a Convex deployment is configured.
- Live activation smoke: blocked until Convex auth/deployment setup is approved.
