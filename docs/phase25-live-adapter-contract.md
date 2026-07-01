# Phase 25 Live Adapter Contract

This phase adds the client-side contract for replacing the KinFlo OS fixture shell with generated Convex API calls after hosted Convex activation is approved.

It does not import `convex/_generated/api`, mount a `ConvexProvider`, run codegen, provision Convex, or execute live queries and mutations.

## What Changed

- Added `ShellLiveAdapterBinding` to the KinFlo shell snapshot.
- Added a visible Live adapter readiness table to the KinFlo OS Data Mode panel.
- Added `fixtureLiveAdapterBindings` to map every fixture-backed shell surface to the Convex functions and smoke evidence required before replacement.
- Added `liveKinfloShellAdapter` as a fail-closed adapter that throws until `runtime.canUseLiveData` is true and generated API bindings are wired.
- Added `selectKinfloShellDataAdapter` so the shell has one future switching point instead of scattered fixture reads.
- Added `npm run kinflo:validate-live-adapter`.

## Adapter Surfaces

- Activation readiness: `activation.readiness`, `activation.seedSmokeSite`.
- Tenant control plane: `controlPlane.listTenants`, `controlPlane.listSitesForTenant`, `controlPlane.listAuditEvents`.
- Site factory: `siteFactory.listStarterTemplates`, `siteFactory.createSiteFromTemplate`.
- Domain metadata: `siteBuilder.upsertDomain`, `entitlements.checkEntitlementLimit`.
- Public renderer: `publicSite.resolvePublishedSite`.
- CRM lead workspace: `crm.submitLead`, `crm.listLeads`, `crm.getLeadTimeline`.
- Plans and entitlements: `entitlements.entitlementUsageSnapshot`, `entitlements.checkEntitlementLimit`.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed by this phase.

No live Convex query, mutation, or action is executed by this phase.

No production import is performed by this phase.

No DNS, SSL, Vercel domain, Stripe, SendGrid, Twilio, Cloudinary, R2, or S3 provider write is performed by this phase.

## Activation Sequence After Approval

1. Run `npm run kinflo:live-handoff`.
2. Run `npm run convex:codegen`.
3. Review generated Convex API bindings.
4. Replace one adapter surface at a time behind `selectKinfloShellDataAdapter`.
5. Keep fixture fallback available until the replacement surface passes its smoke evidence.
6. Start with read-only surfaces: activation readiness, tenant list, site list, plan catalog, entitlement usage, and public resolver.
7. Move to mutation surfaces only after read-only smoke passes: site factory, invitation creation, domain metadata, lead capture, and entitlement overrides.
8. Keep the live adapter fail-closed until admin, public renderer, lead capture, entitlement, permission, and audit smokes all pass.
