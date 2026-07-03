# Phase 116: Client Configuration Publish Readiness

Phase 116 adds a provider-light publish readiness packet to the compact Site Studio configuration lane.

Command:

```bash
npm run kinflo:validate-client-configuration-publish-readiness
```

## What Changed

- `siteFactory.listClientWebsiteConfigurationPublishReadiness` exposes the read-only Convex query contract.
- `siteFactoryListClientWebsiteConfigurationPublishReadiness` is registered in the generated API contract without importing generated files.
- `ShellClientWebsiteConfigurationPublishReadiness` models publish criteria, readiness scores, publish blockers, rollback requirements, blocked live actions, and provider boundaries.
- `snapshot.clientWebsiteStudio.configurationPublishReadiness` stores local publish readiness packets for Julie Family, the advisor client site, and the campaign microsite.
- `selectedClientWebsiteConfigurationPublishReadiness` resolves the selected-site readiness packet in the Site Studio configuration lane.
- `tab-kinflo-client-configuration-publish-readiness` adds publish readiness inside the save request packet instead of adding another long page section.
- `section-kinflo-client-configuration-publish-readiness` keeps the publish criteria list bounded.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No publish request, configuration save, audit event write, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Client configuration needs a visible publish-readiness gate before the system can safely move toward live public sites. The readiness packet shows which publish criteria are already locally proven, which gates remain blocked, and which rollback requirements must stay in force before any hosted publish path is approved.
