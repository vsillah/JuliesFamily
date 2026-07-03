# Phase 146: Configuration Admin Permission Preset

Phase 146 brings the selected client site's admin permission preset into the Configure lane so super admin can review owner scope, invite role, permission set, gates, and blocked actions without leaving configuration review.

Command:

```bash
npm run kinflo:validate-configuration-admin-permission-preset
```

## Route Contract

Base route:

`/admin/kinflo-os?tab=site-studio&studioLane=configuration`

Selected site:

`studioSite=julies-family-public|advisor-client-site|campaign-microsite`

Configure workspace:

`studioConfigure=review|change|approval|save`

Existing detail tabs stay preserved by workspace:

`studioConfig=blockers|evidence|functions`

`studioChange=blockers|evidence|functions`

`studioApproval=blockers|evidence|functions`

`studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions`

## What Changed

- `section-kinflo-client-configuration-admin-permission-preset` adds the selected site's permission preset to Configure.
- `text-kinflo-client-configuration-admin-permission-preset` names the active preset.
- `section-kinflo-client-configuration-admin-permission-scope` shows platform, tenant, or site scope.
- `section-kinflo-client-configuration-admin-permission-set` lists the role permission set.
- `section-kinflo-client-configuration-admin-permission-gates` keeps approval gates visible.
- `section-kinflo-client-configuration-admin-permission-blocked` keeps blocked invite, membership, publish, campaign, and provider actions visible.
- `section-kinflo-client-configuration-admin-permission-functions` maps the preset back to provider-light Convex function names.
- `button-client-configuration-admin-permission-gated` keeps permission writes disabled.
- The panel uses the existing `selectedClientWebsiteAdminPermissionPreset` derived from `clientWebsiteStudio.adminPermissionPresets`, so switching the configuration profile also switches the permission evidence.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant create, membership grant, invitation email, permission write, public publish, lead write, campaign send, provider call, domain operation, production import, adapter switch, client sharing, or live handoff is performed.

No secret values are read or printed.

## Why This Matters

The shared-software model depends on different clients receiving different admin scopes without forking the product. This card keeps permission review attached to the selected configuration profile, so super admin can see whether a site is platform-owned, tenant-owned, or site-editor scoped before any hosted mutation path is approved.
