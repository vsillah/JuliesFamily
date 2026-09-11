# Phase 9 Access Policy

This phase turns role labels into a reusable permission evaluation surface for KinFlo.

## Added Scope

Convex module: `convex/accessPolicy.ts`.

Functions:

- `accessPolicy.viewerPermissionSnapshot`
- `accessPolicy.canPerform`

Reusable helper:

- `hasPermission`

The policy layer resolves:

- platform super admin status,
- tenant memberships,
- site memberships,
- default role definitions,
- persisted role rows after `roleCatalog.syncDefaultRoles`,
- and the scoped permissions available to the signed-in viewer.

## Role Coverage

The role catalog now covers every current membership role:

- `platform.super_admin`
- `tenant.owner`
- `tenant.admin`
- `tenant.editor`
- `tenant.viewer`
- `site.admin`
- `site.editor`
- `site.viewer`

Site-scoped `owner` memberships resolve to `site.admin` so older invite/member flows still land on a usable permission bundle.

## Current Boundary

This is still provider-light. It does not run `convex dev`, does not generate Convex runtime files, and does not connect to a hosted Convex deployment.

Phase 10 begins wiring this policy layer into control-plane, site-builder, and site-factory mutations through `requirePermission`.

## First Hosted Smoke

After Convex auth/deployment setup is approved:

1. Bootstrap Vambah as platform admin.
2. Run `roleCatalog.syncDefaultRoles`.
3. Create tenant and site memberships for owner, admin, editor, and viewer cases.
4. Query `accessPolicy.viewerPermissionSnapshot` for tenant and site scopes.
5. Query `accessPolicy.canPerform` for `site:update`, `content:edit`, `content:publish`, and `member:invite`.
6. Confirm editors cannot publish unless their scoped role grants that permission.
7. Confirm viewers can read but cannot mutate.

## Validation

Current validation:

- `npm run convex:check`: passes.
- `npm run kinflo:validate-phases`: passes.
- `npm run kinflo:validate-map`: passes.
- `npm run build`: passes.

Known not run:

- Live permission smoke: blocked until Convex auth/deployment setup is approved.
