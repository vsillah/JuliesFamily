# Phase 98: Configuration Profile Generated API Coverage

Phase 98 closes the contract gap between the Phase 97 configuration-profile shell and the hosted activation review path.

Command:

```bash
npm run kinflo:validate-configuration-profile-generated-api-coverage
```

## What Changed

- Runtime function key: `siteFactoryListClientWebsiteConfigurationReviewPackets`
- Runtime function key: `siteFactoryListClientWebsiteConfigurationApprovalMatrices`
- Runtime function key: `siteFactoryListClientWebsiteConfigurationAuditTimelines`
- Runtime function key: `siteFactoryListClientWebsiteConfigurationChangeSets`
- Runtime function key: `siteFactoryListClientWebsiteConfigurationProfiles`
- Runtime function key: `siteFactoryListClientWebsiteConfigurationSaveRequests`
- Convex function path: `siteFactory.listClientWebsiteConfigurationReviewPackets`
- Convex function path: `siteFactory.listClientWebsiteConfigurationApprovalMatrices`
- Convex function path: `siteFactory.listClientWebsiteConfigurationAuditTimelines`
- Convex function path: `siteFactory.listClientWebsiteConfigurationChangeSets`
- Convex function path: `siteFactory.listClientWebsiteConfigurationProfiles`
- Convex function path: `siteFactory.listClientWebsiteConfigurationSaveRequests`
- Generated API binding surface: `site factory`
- Adapter-switch surface: `site-factory`
- Required switch evidence: `configuration review packet read`
- Required switch evidence: `configuration approval matrix read`
- Required switch evidence: `configuration audit timeline read`
- Required switch evidence: `configuration change set read`
- Required switch evidence: `configuration profile read`
- Required switch evidence: `configuration save request read`

The Site Factory adapter-switch surface now requires configuration review packet, configuration approval matrix, configuration audit timeline, configuration change set, configuration profile, and configuration save request read evidence before the fixture adapter can move toward generated Convex bindings.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant/site launch, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Client websites are becoming configurable products, not one-off pages. The generated API review path must include each site's template, brand, navigation, CRM pipeline, editable surfaces, locked surfaces, approval matrix, audit timeline, draft change set, save request packet, and provider boundary before hosted activation can safely replace local fixtures.
