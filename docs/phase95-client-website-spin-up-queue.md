# Phase 95: Client Website Spin-Up Queue

Phase 95 adds a provider-light super-admin queue for spinning up client websites from the same underlying KinFlo software without executing tenant, site, invite, publish, provider, or live Convex writes.

Command:

```bash
npm run kinflo:validate-client-website-spin-up-queue
```

## Added Surface

- Data type: `ShellClientWebsiteSpinUpQueue`
- Fixture field: `clientWebsiteStudio.spinUpQueue`
- UI component: `ClientWebsiteSpinUpQueue`
- Admin route: `/admin/kinflo-os?tab=site-studio`
- Root: `section-kinflo-client-website-spin-up-queue`
- Summary: `section-kinflo-client-website-spin-up-summary`
- Scroll region: `section-kinflo-client-website-spin-up-scroll`
- Site cards:
  - `card-client-website-spin-up-julies-family-public`
  - `card-client-website-spin-up-advisor-client-site`
  - `card-client-website-spin-up-campaign-microsite`
- Gated action: `button-client-website-spin-up-gated`

## Queue Contract

- Total requests: 3
- Ready requests: 1
- Blocked requests: 2
- Total steps: 14
- Founding request: Julie Family founding retrofit
- Client request: Advisor client tenant launch
- Campaign request: Campaign microsite scoped editor

Each request keeps the live execution switches off:

- `canCreateTenant: false`
- `canCreateSite: false`
- `canInviteAdmin: false`
- `canPublish: false`
- `providerWrites: false`
- `liveConvexExecution: false`

The queue maps the intended future functions without importing generated bindings:

- `controlPlane.createTenant`
- `siteFactory.createSiteFromTemplate`
- `controlPlane.createInvitation`
- `siteBuilder.publishPage`
- `crm.submitLead`
- `campaigns.requestCampaignApproval`

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant is created.

No site is created.

No admin invite is sent.

No public page is published.

No provider API is called.

No secret values are read or printed.

## Why This Matters

The super admin needs a compact operating queue for spinning up multiple client websites with different tenant scopes, templates, and admin permissions. This phase makes the run order visible while preserving the hosted Convex, generated API, owner approval, and provider gates.
