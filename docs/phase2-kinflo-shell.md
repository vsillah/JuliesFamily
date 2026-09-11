# Phase 2 KinFlo OS Shell

This phase introduces the first admin-facing SaaS shell for the multi-tenant KinFlo direction.

## Added Scope

- Admin route: `/admin/kinflo-os`.
- Dashboard entry under the existing admin settings menu.
- Operational tabs for:
  - tenants,
  - sites,
  - starter templates,
  - configurable experience controls,
  - scoped permissions,
  - launch gates.
- Admin-only route guard using the existing client auth hooks.
- Typed fixture data adapter in `client/src/lib/kinfloShellData.ts`.

## Current Boundary

The shell is provider-light. It does not call Convex yet because the repo still has no configured Convex deployment or generated API bindings.

The page now consumes a `KinfloShellSnapshot` from `client/src/lib/kinfloShellData.ts` instead of keeping fixture rows inline. That keeps the current UI reviewable while giving the future Convex-backed adapter a stable shape to satisfy.

The UI state mirrors the Convex scaffold added in Phase 1:

- `controlPlane.ts` for tenants, sites, memberships, theme tokens, and audit events.
- `siteBuilder.ts` for pages, navigation, content blocks, visibility rules, domains, assets, and publishing.
- `siteFactory.ts` for starter template creation.
- `publicSite.ts` for public published-site resolution.
- `activation.ts` for readiness checks and the first idempotent live smoke seed.

## Next Activation Gate

After Convex auth and deployment setup are approved:

1. Run `npm run convex:codegen`.
2. Replace the shell fixture rows with Convex queries.
3. Wire tenant/site creation buttons to Convex mutations.
4. Run the activation smoke that proves:
   - Vambah can bootstrap as platform admin,
   - a tenant can be created,
   - a site can be created from a starter template,
   - roles can be granted,
   - a page can be published,
   - the public resolver returns the published route,
   - non-admin access is denied.

## Validation

Current validation:

- `npm run build`: passes.
- `npm run convex:check`: passes.
- Client-only browser smoke with mocked admin auth:
  - desktop `/admin/kinflo-os` renders tenants, sites, and access tabs,
  - mobile `/admin/kinflo-os` renders without horizontal overflow,
  - unauthenticated access redirects to `/`.

Known not run:

- `npm run convex:codegen`: blocked until a Convex deployment is configured.
- Live admin shell smoke: blocked until Convex auth/deployment setup is approved.
