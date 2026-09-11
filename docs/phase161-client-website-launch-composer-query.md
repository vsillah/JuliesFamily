# Phase 161: Client Website Launch Composer Query

Phase 161 moves the Site Studio launch composer from UI-only fixture coverage into the read-only Convex site factory contract layer.

Command:

```bash
npm run kinflo:validate-client-website-launch-composer-query
```

## Added Surface

- Convex function: `siteFactory.listClientWebsiteLaunchComposer`
- Runtime key: `siteFactoryListClientWebsiteLaunchComposer`
- Generated API review binding: `siteFactoryListClientWebsiteLaunchComposer`
- Contract type: `ClientWebsiteLaunchComposer`
- Data source: `clientWebsiteLaunchComposer`

## Query Contract

The query returns the provider-light launch composer used by Site Studio:

- Total compositions: 3
- Review ready: 1
- Blocked compositions: 2
- Total steps: 12
- Sites: `julies-family-public`, `advisor-client-site`, `campaign-microsite`
- Scopes: `platform`, `tenant`, `site`

Each composition keeps these live switches off:

- `canCreateTenant: false`
- `canCreateSite: false`
- `canInviteAdmin: false`
- `canPublish: false`
- `providerWrites: false`
- `liveConvexExecution: false`

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed from the shell.

No tenant create, site create, admin invite, public publish, CRM lead write, campaign send, domain attachment, provider call, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The Site Studio launch composer is the future super-admin assembly line for spinning up client websites. This phase gives hosted activation a concrete read model to bind later while preserving the current provider-light gate: the UI can review the tenant, template, admin preset, evidence, and execution order without running any live mutation.
