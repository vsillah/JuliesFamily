# Phase 83: Client Handoff Permission Strip

Phase 83 implements the eighth provider-light design item from the Phase 75 design-frame backlog: make the client handoff permission state visible before any tenant admin invite, membership grant, public publish, or provider write can run.

Command:

```bash
npm run kinflo:validate-client-handoff-permission-strip
```

## Added Surface

- Reusable component: `ClientHandoffPermissionStrip`
- Handoff strip: `section-kinflo-client-handoff-permission-strip`
- Permission columns:
  - `section-kinflo-client-handoff-permission-strip-see`
  - `section-kinflo-client-handoff-permission-strip-edit`
  - `section-kinflo-client-handoff-permission-strip-publish`
- Handoff gate cards:
  - `section-kinflo-client-handoff-permission-strip-blocked-invite`
  - `section-kinflo-client-handoff-permission-strip-missing-artifact`
  - `section-kinflo-client-handoff-permission-strip-gated-action`

## What Changed

The Client Website Design Studio now shows a compact permission strip between the workbench contract and the main site workbench. The strip connects the selected site to:

- the admin permission preset,
- who can see, edit, and publish,
- the blocked invite or membership action,
- the missing handoff artifact or open onboarding task,
- launch packet and launch simulation context,
- and the disabled client handoff invite action.

The existing Admin Permission Preset card remains available for the full details. The new strip gives the operator the first-pass handoff posture without forcing a scan through the lower evidence cards.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, membership grant, campaign send, domain verification, production import, asset upload, AI generation, or client sharing is performed.

No secret values are read or printed.

## Validation

```bash
npm run kinflo:validate-client-handoff-permission-strip
npm run check
git diff --check
```
