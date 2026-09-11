# Phase 113: Client Configuration Save Request

Phase 113 adds a provider-light configuration save request packet to the compact Site Studio configuration lane.

Command:

```bash
npm run kinflo:validate-client-configuration-save-request
```

## What Changed

- `siteFactory.listClientWebsiteConfigurationSaveRequests` exposes the read-only Convex query contract.
- `ShellClientWebsiteConfigurationSaveRequest` records selected payload values, approval evidence, save blockers, blocked live actions, rollback posture, and provider boundaries.
- `snapshot.clientWebsiteStudio.configurationSaveRequests` stores local save request packets for Julie Family, the advisor client site, and the campaign microsite.
- `selectedClientWebsiteConfigurationSaveRequest` follows the currently selected Site Studio site.
- `section-kinflo-client-configuration-save-request` renders inside the existing consolidated configuration lane.
- `section-kinflo-client-configuration-save-request-payload` keeps proposed payload rows bounded.
- `tabs-kinflo-client-configuration-save-request-detail` keeps blockers, evidence, and functions in tabs instead of expanding the page vertically.
- `button-client-configuration-save-request-gated` keeps request capture and configuration save disabled.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No save request capture, configuration save, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The super-admin shell now has a clear handoff point between reviewing configuration and eventually saving it. The request packet shows exactly what would be submitted, what evidence must exist, what rollback path protects the tenant, and why the real write path remains blocked until hosted Convex, generated API review, and live smoke evidence are approved.
