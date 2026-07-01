# Phase 58 Client Admin Permission Presets

## Validation

```bash
npm run kinflo:validate-client-admin-permission-presets
```

## Scope

Phase 58 makes the super-admin client website handoff model explicit without enabling live permission writes.

- Admin route: `/admin/kinflo-os?tab=site-studio`.
- Convex function: `siteFactory.listClientWebsiteAdminPermissionPresets`.
- Shell data: `clientWebsiteStudio.adminPermissionPresets`.
- Permission presets: 3.
- Permission preset surface: `Admin Permission Preset`.
- Admin handoff action: gated.
- Provider posture: local state only.

## Preset Coverage

- `julies-family-public`: founding platform steward, platform scope.
- `advisor-client-site`: tenant admin launch owner, tenant scope.
- `campaign-microsite`: site editor campaign operator, site scope.

## Super Admin Handoff Contract

Each preset names:

- owner role,
- invite role,
- permission scope,
- permission set,
- approval gates,
- blocked permission actions,
- mapped Convex functions.

## Provider Boundary

- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- Provider APIs touched: no.
- Secrets read or printed: no.
- No generated API is imported.
- No live Convex query, mutation, or action is executed.
- No tenant, membership, invitation, email, content, lead, or campaign write is executed.

## Next Activation Gate

The permission preset query can move into a live adapter only after hosted Convex activation, role catalog sync, access-policy smoke, invitation smoke, email-provider readiness, and rollback evidence are approved.
