# Phase 94: Client Admin Handoff Matrix

Phase 94 adds a provider-light super-admin matrix for comparing client website handoff permissions before any tenant admin invite, membership grant, provider write, generated API import, or live Convex execution is allowed.

Command:

```bash
npm run kinflo:validate-client-admin-handoff-matrix
```

## Added Surface

- Data type: `ShellClientAdminHandoffMatrix`
- Studio field: `clientWebsiteStudio.adminHandoffMatrix`
- Admin route: `/admin/kinflo-os?tab=site-studio`
- Matrix shell: `section-kinflo-client-admin-handoff-matrix`
- Summary: `section-kinflo-client-admin-handoff-matrix-summary`
- Table: `section-kinflo-client-admin-handoff-matrix-table`
- Blocked actions: `section-kinflo-client-admin-handoff-matrix-blocked`
- Gated button: `button-client-admin-handoff-matrix-gated`

## Matrix Counts

- Total sites: 3
- Platform scoped: 1
- Tenant scoped: 1
- Site scoped: 1
- Ready for invite: 0
- Blocked invites: 3

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant admin invite, membership grant, provider write, public publish, campaign send, domain operation, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The selected-site permission strip shows one client handoff posture. The matrix gives the super admin a cross-site view of owner roles, invite roles, permission scope, blocked invite actions, and next human gates so multiple client websites can use the same underlying software without hiding permission risk.
