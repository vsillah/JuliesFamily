# Phase 16 Site Factory Launch Packets

This phase turns the shell's disabled New Tenant and New Site affordances into a provider-light launch-packet workflow.

## What Changed

- Added typed `ShellSiteLaunchPacket` fixture data to `client/src/lib/kinfloShellData.ts`.
- Added a Site Factory tab to `/admin/kinflo-os`.
- Updated the New Tenant and New Site buttons to open the Site Factory workflow.
- Each launch packet records:
  - tenant and site name,
  - starter template,
  - subdomain,
  - owner invite target,
  - owner role,
  - preview route,
  - configuration summary,
  - permission gates,
  - Convex mutations,
  - and launch checklist state.

## Contract

The launch packets map directly to existing Convex functions:

- `controlPlane.createTenant`
- `siteFactory.createSiteFromTemplate`
- `controlPlane.createInvitation`
- `controlPlane.listAuditEvents`
- `crm.submitLead`
- `crm.listLeads`

The permission gates mirror the Phase 10 access-policy model:

- `tenant:create`
- `site:create`
- `member:invite`
- `content:edit`
- `content:publish`
- `lead:view`

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No invitation token is generated or stored in this phase. The shell only names the token-hash-only invitation contract.

No production tenant, site, or membership is created.

## Activation Gate

Before these packets can mutate live state:

1. Provision the hosted Convex project.
2. Run approved Convex codegen.
3. Replace fixture launch packets with live calls to `controlPlane.createTenant` and `siteFactory.createSiteFromTemplate`.
4. Generate invitation token hashes outside chat and store only hashes.
5. Run live admin smoke for tenant creation, site creation, invitation creation, role scoping, preview rendering, and audit events.

## Validation

Run:

```bash
npm run kinflo:validate-phases
npm run build
```

Rendered smoke should verify `/admin/kinflo-os` can switch to the Factory tab and prepare a launch packet without console errors.
