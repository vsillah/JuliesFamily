# Phase 1 Convex Control Plane Scaffold

This phase introduces the Convex-backed SaaS spine without creating a hosted Convex deployment.

## Added Scope

- Convex dependency and local codegen scripts.
- Convex schema for:
  - users,
  - tenants,
  - sites,
  - memberships,
  - roles,
  - invitations,
  - theme tokens,
  - feature flags,
  - audit events.
- Control-plane functions for:
  - syncing the current authenticated user,
  - bootstrapping the first platform super admin,
  - listing and creating tenants,
  - creating and listing sites,
  - updating site status,
  - updating site theme tokens,
  - granting memberships,
  - listing audit events.

## Explicit Boundaries

No hosted Convex project has been provisioned.

This scaffold does not yet replace the existing Express/Postgres runtime. The legacy app can still build independently while the Convex spine is developed behind a separate module boundary.

`npm run convex:check` validates the provider-light Convex files without requiring `CONVEX_DEPLOYMENT`. `npm run convex:codegen` is intentionally left as the real generated-bindings command and will require a configured Convex deployment.

Phase 1 intentionally avoids:

- CRM lead migration,
- public site rendering,
- Stripe billing,
- email/SMS delivery,
- custom domains,
- automated A/B test promotion,
- client-facing onboarding wizard.

## First Smoke Target

After Convex auth/deployment setup is approved, the first smoke should prove:

1. A signed-in Vambah account runs `bootstrapPlatformAdmin`.
2. The platform admin creates a tenant.
3. The platform admin creates a site under that tenant.
4. A default theme token record is created for the site.
5. Audit events exist for the tenant and site creation.
6. A non-admin user cannot list all tenants.

## Implementation Notes

The control-plane guard strategy starts with:

- `requirePlatformAdmin`
- `requireTenantAdmin`

Those are the minimum guard rails needed before the super admin shell is built. Future slices should add:

- `requireSiteAdmin`
- `requireSiteMember`
- `requireFeature`
- `requirePublishedSiteRead`

The Convex data model uses `tenantId` and `siteId` as explicit scope markers instead of trying to carry Postgres session or organization assumptions forward.

## Validation

Current validation:

- `npm run convex:check`: passes.
- `npm run build`: passes.

Known not run:

- `npm run convex:codegen`: blocked until a Convex deployment is configured.
- Live Convex function smoke: blocked until auth/deployment setup is approved.
