# Phase 10 Permission Guard Migration

This phase begins replacing hard-coded owner/admin checks with named permission guards.

## Added Scope

Updated Convex modules:

- `convex/accessPolicy.ts`
- `convex/controlPlane.ts`
- `convex/siteBuilder.ts`
- `convex/siteFactory.ts`

`accessPolicy.requirePermission` now supports both queries and mutations and returns the signed-in actor after checking the requested permission.

## Migrated Guards

Control-plane operations now check named permissions:

- tenant creation: `tenant:create`
- site creation: `site:create`
- site listing: `tenant:view`
- site status and theme updates: `site:update`
- membership grants: `member:manage`
- invitations: `member:invite`
- audit views: `audit:view`

Site-builder and factory operations now check named permissions:

- site draft read: `site:view`
- page/block/visibility editing: `content:edit`
- page/block publishing: `content:publish`
- navigation/domain changes: `site:update`
- asset records: `asset:manage`
- starter-template site creation: `site:create`

## Current Boundary

This phase remains provider-light. It does not run `convex dev`, does not generate Convex runtime files, and does not provision a hosted Convex deployment.

Bootstrap-only paths still keep direct platform-admin checks where they are part of first-admin setup or role-catalog sync. That avoids circular dependencies between the role catalog and access policy.

## First Hosted Smoke

After Convex auth/deployment setup is approved:

1. Bootstrap Vambah as platform admin.
2. Run `roleCatalog.syncDefaultRoles`.
3. Seed or create a tenant and site.
4. Create owner, admin, editor, and viewer memberships.
5. Confirm editors can create draft content but cannot publish unless their role includes `content:publish`.
6. Confirm viewers can read site drafts only when granted `site:view` or `content:view` through their scope.
7. Confirm tenant admins can invite members but cannot perform platform-only tenant creation.
8. Confirm audit events still write for successful mutations.

## Validation

Current validation:

- `npm run convex:check`: passes.
- `npm run kinflo:validate-phases`: passes.
- `npm run kinflo:validate-map`: passes.
- `npm run build`: passes.

Known not run:

- Live permission smoke: blocked until Convex auth/deployment setup is approved.
