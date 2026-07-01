# Phase 23 Custom Domain Entitlement Contracts

This phase wires custom-domain preparation into the entitlement system.

KinFlo already had a provider-light `siteBuilder.upsertDomain` mutation for domain metadata. This phase makes that mutation commercially bounded by the `customDomains` plan limit without touching DNS, SSL, Vercel, or Stripe.

## What Changed

- Added `requireEntitlementLimit` to `siteBuilder.upsertDomain`.
- Enforced the `customDomains` limit when:
  - creating a non-disabled domain,
  - re-enabling a disabled domain.
- Kept disabled domains out of active entitlement usage.
- Added duplicate hostname protection on both domain creation and domain update.
- Added audit events for both domain creation and domain updates.
- Updated `site.primaryDomain` when a verified domain is marked primary.
- Added `siteBuilder.upsertDomain` to the frontend Convex runtime contract list.
- Added a `Custom domain entitlement guard` launch gate to the KinFlo OS fixture shell.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed.

No DNS records are created.

No SSL certificates are provisioned.

No Vercel domain API call is made.

No Stripe customer, subscription, price, invoice, webhook, or checkout session is created.

No live Convex query, mutation, or action is executed.

`siteBuilder.upsertDomain` remains a metadata and readiness contract until hosted Convex activation and domain-provider setup are approved.

## Activation Sequence After Approval

1. Generate Convex API bindings after hosted Convex setup is approved.
2. Confirm `entitlements.entitlementUsageSnapshot` reports `customDomains` usage from non-disabled domain records.
3. Smoke `siteBuilder.upsertDomain` below and above the active plan's `customDomains` limit.
4. Verify `publicSite.resolvePublishedSite` resolves only verified hostnames.
5. Add a DNS/provider checklist for TXT verification, SSL status, Vercel domain attachment, and rollback.
6. Keep automated DNS and SSL provisioning gated until provider ownership is explicitly approved.
