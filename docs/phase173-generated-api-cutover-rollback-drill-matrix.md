# Phase 173: Generated API Cutover Rollback Drill Matrix

Phase 173 adds a provider-light rollback drill matrix to the Generated API Cutover Owner Review shell.

Command:

```bash
npm run kinflo:validate-generated-api-cutover-rollback-drill-matrix
```

## Added Surface

- Shell data field: `rollbackDrillMatrix`
- Rollback status: `provider_light_generated_api_cutover_rollback_drill_matrix`
- Rollback matrix card: `section-kinflo-generated-api-cutover-rollback-drill-matrix`
- Rollback matrix summary text: `text-kinflo-generated-api-cutover-rollback-drill-matrix`
- Rollback drill list: `section-kinflo-generated-api-cutover-rollback-drills`
- Rollback evidence chips: `section-kinflo-generated-api-cutover-rollback-evidence`
- Gated action button: `button-generated-api-cutover-rollback-drill-gated`

## Drill Coverage

The matrix keeps six rollback drills visible before any generated API cutover work can move:

- `read-only-core`
- `user-scoped-preferences`
- `site-creation-and-admin`
- `public-crm-loop`
- `provider-readiness-records`
- `campaign-and-ai-governance`

Current posture:

- Total drills: 6
- Blocked drills: 6
- Ready drills: 0
- Rollback owner: `platform.super_admin`

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No rollback drill is executed against hosted infrastructure.

No fixture adapter switch is performed.

No hosted smoke is executed.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The generated API cutover path now has a visible fixture-restore plan for every batch before the owner can consider a codegen window, generated API import, adapter switch, or hosted smoke. This keeps rollback ownership explicit while the implementation remains local, typed, and provider-light.
