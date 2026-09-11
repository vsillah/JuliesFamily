# Phase 160: Client Website Launch Composer

Phase 160 adds a compact selected-site launch composer to Site Studio. It connects the portfolio registry to the actual super-admin launch sequence for each client website without executing tenant, site, admin invite, publish, lead, domain, provider, generated API, or hosted Convex work.

Command:

```bash
npm run kinflo:validate-client-website-launch-composer
```

## Admin Surface

- Route: `/admin/kinflo-os?tab=site-studio`
- Data object: `clientWebsiteStudio.launchComposer`
- Component: `ClientWebsiteLaunchComposer`
- Panel: `section-kinflo-client-website-launch-composer`
- Selected composition: `section-kinflo-client-website-launch-composer-selected`
- Execution order: `section-kinflo-client-website-launch-composer-steps`
- Approval evidence: `section-kinflo-client-website-launch-composer-evidence`
- Blocked switches: `section-kinflo-client-website-launch-composer-blocked`
- Disabled action: `button-client-website-launch-composer-gated`

## Composer Contract

- Total compositions: 3
- Review ready: 1
- Blocked compositions: 2
- Total steps: 12
- Sites:
  - `julies-family-public`
  - `advisor-client-site`
  - `campaign-microsite`

Each composition keeps live execution disabled:

- `canCreateTenant: false`
- `canCreateSite: false`
- `canInviteAdmin: false`
- `canPublish: false`
- `providerWrites: false`
- `liveConvexExecution: false`

The composer maps platform, tenant, and site-scoped launches:

- `platform.super_admin` / `platform`
- `tenant.admin` / `tenant`
- `site.editor` / `site`

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant is created.

No site is created.

No admin invite is sent.

No public page is published.

No lead is written.

No domain is attached.

No provider API is called.

No secret values are read or printed.

## Next Gate

Use the composer to review the selected site's launch order, evidence, and blocked live actions. Execution remains blocked until hosted Convex activation, generated API review, read-only hosted smokes, mutation smoke order, rollback owner, invite policy, domain readiness, provider setup, and launch signoff pass.
