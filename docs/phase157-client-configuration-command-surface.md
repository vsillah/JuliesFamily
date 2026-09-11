# Phase 157: Client Configuration Command Surface

Phase 157 adds a compact provider-light command surface at the top of Site Studio so the super admin can see the selected client site's configuration posture before opening any lane-specific panel.

Command:

```bash
npm run kinflo:validate-client-configuration-command-surface
```

## Added Surface

- UI component: `ClientWebsiteConfigurationCommandSurface`
- Admin route: `/admin/kinflo-os?tab=site-studio`
- Root: `section-kinflo-client-configuration-command-surface`
- Selected site: `text-kinflo-client-configuration-command-site`
- Next gate: `text-kinflo-client-configuration-command-gate`
- Summary stats: `section-kinflo-client-configuration-command-stats`
- Editable surfaces: `section-kinflo-client-configuration-editable-surfaces`
- Locked surfaces: `section-kinflo-client-configuration-locked-surfaces`
- Permission summary: `section-kinflo-client-configuration-command-permissions`
- Gated action: `button-client-configuration-command-save-gated`

## Configuration Contract

The surface uses the existing selected Site Studio records:

- `selectedClientWebsiteStudioSite`
- `selectedClientWebsiteConfigurationProfile`
- `selectedClientWebsiteLaunchBlueprint`
- `selectedClientWebsiteAdminPermissionPreset`

It summarizes:

- template,
- brand profile,
- navigation profile,
- CRM pipeline,
- editable surfaces,
- locked surfaces,
- permission scope,
- and the next gate.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No configuration save, invite, publish, domain attach, provider write, lead write, or client sharing action is performed.

No secret values are read or printed.

## Why This Matters

The lane rail solves navigation. This surface solves orientation. It keeps the configurable client website model visible at the top of Site Studio: what the selected site is, how it is configured, which surfaces can be reviewed locally, which surfaces are locked, and why the live action remains gated.
