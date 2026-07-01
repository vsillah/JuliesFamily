# Phase 4 KinFlo Shell Data Adapter

This phase separates the KinFlo OS admin shell from inline fixture rows so the page can move to live Convex data without another UI rewrite.

## Added Scope

- Typed shell snapshot model in `client/src/lib/kinfloShellData.ts`.
- Fixture adapter:
  - `fixtureKinfloShellAdapter`
  - `getKinfloShellSnapshot`
- Data-mode panel in `/admin/kinflo-os` showing:
  - current source: fixture data,
  - activation gate,
  - Convex functions the shell is expected to consume after generated bindings exist.

## Current Boundary

The shell still uses fixture data because the repo does not have a configured Convex deployment or generated `_generated/api` bindings.

This keeps the UI reviewable while preserving the hosted boundary:

- no hosted Convex project is created,
- no `convex dev` deployment is run,
- no generated Convex runtime files are committed,
- no production data is read or written.

## Convex Cutover Contract

After Convex setup is approved and `npm run convex:codegen` succeeds, replace the fixture adapter with a Convex-backed adapter that reads:

- `activation.readiness`
- `controlPlane.listTenants`
- `controlPlane.listSitesForTenant`
- `siteFactory.listStarterTemplates`
- `siteBuilder.getSiteDraft`
- `controlPlane.listAuditEvents`

The page should continue consuming the same `KinfloShellSnapshot` shape so the UI remains stable while the data source changes.

## Validation

Current validation:

- `npm run build`: passes.
- `npm run convex:check`: passes.
- Client-only browser smoke with mocked admin auth:
  - desktop `/admin/kinflo-os` renders the data-mode panel and access tab,
  - mobile `/admin/kinflo-os` renders the data-mode panel without horizontal overflow,
  - unauthenticated access redirects to `/`.

Known not run:

- `npm run convex:codegen`: blocked until a Convex deployment is configured.
- Live shell adapter smoke: blocked until Convex auth/deployment setup is approved.
