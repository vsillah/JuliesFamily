# Phase 112: Client Configuration Approval Matrix

Phase 112 adds a provider-light approval matrix to the compact Site Studio configuration lane.

Command:

```bash
npm run kinflo:validate-client-configuration-approval-matrix
```

## What Changed

- `siteFactory.listClientWebsiteConfigurationApprovalMatrices` exposes the read-only Convex query contract.
- `ShellClientWebsiteConfigurationApprovalMatrix` records approver roles, responsibilities, approval evidence, save blockers, blocked live actions, and provider boundaries.
- `snapshot.clientWebsiteStudio.configurationApprovalMatrices` stores local approval matrices for Julie Family, the advisor client site, and the campaign microsite.
- `selectedClientWebsiteConfigurationApprovalMatrix` follows the currently selected Site Studio site.
- `section-kinflo-client-configuration-approval-matrix` renders inside the existing consolidated configuration lane.
- `section-kinflo-client-configuration-approval-rows` keeps approver rows bounded.
- `tabs-kinflo-client-configuration-approval-detail` keeps blockers, evidence, and functions in tabs instead of expanding the page vertically.
- `button-client-configuration-approval-gated` keeps approval capture disabled.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No approval capture, configuration save, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The super-admin shell needs to show who must approve a client site's configuration before any save path exists. This phase makes that approval map inspectable by selected site while preserving the hosted Convex, generated API, and live-write gates.
