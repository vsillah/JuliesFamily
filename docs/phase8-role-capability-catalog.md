# Phase 8 Role Capability Catalog

This phase makes KinFlo's platform, tenant, and site roles explicit as a provider-light Convex catalog.

## Added Scope

Convex module: `convex/roleCatalog.ts`.

Functions:

- `roleCatalog.listDefaultRoles`
- `roleCatalog.listRoleDefinitions`
- `roleCatalog.syncDefaultRoles`

Default role keys:

- `platform.super_admin`
- `tenant.owner`
- `tenant.admin`
- `site.admin`
- `site.editor`
- `site.viewer`

Each role carries a permission bundle such as:

- `tenant:create`
- `site:create`
- `member:invite`
- `content:edit`
- `content:publish`
- `asset:manage`
- `lead:view`
- `audit:view`

## Current Boundary

The catalog is local/provider-light. It does not run `convex dev`, does not generate Convex runtime files, and does not create hosted roles until a Convex deployment is approved.

`syncDefaultRoles` requires a platform super admin and writes an audit event when the catalog is synced.

## Why This Matters

Invitations and memberships now have a concrete meaning beyond role labels. This is the next step toward Vambah creating many websites where different client admins can safely manage only the surfaces they are allowed to touch.

## First Hosted Smoke

After Convex auth/deployment setup is approved:

1. Bootstrap Vambah as platform admin.
2. Run `roleCatalog.syncDefaultRoles`.
3. Confirm `roleCatalog.listRoleDefinitions` returns platform, tenant, and site scopes.
4. Create a tenant/site invitation for a client admin or editor.
5. Accept the invitation.
6. Confirm the membership role matches one of the catalog definitions.
7. Confirm audit events include `role_catalog_synced`.

## Validation

Current validation:

- `npm run convex:check`: passes.
- `npm run kinflo:validate-phases`: passes.
- `npm run kinflo:validate-map`: passes.
- `npm run build`: passes.

Known not run:

- Live role catalog sync: blocked until Convex auth/deployment setup is approved.
