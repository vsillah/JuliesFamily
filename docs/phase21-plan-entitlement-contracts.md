# Phase 21 Plan Entitlement Contracts

This phase adds the provider-light plan and entitlement control surface for KinFlo.

It gives the super admin a reviewable way to define plan limits, inspect tenant usage, and preserve manual override entitlements before Stripe Billing is connected.

## What Changed

- Added `billingPlans` and `tenantEntitlements` collections to `convex/schema.ts`.
- Added control-plane functions for:
  - `controlPlane.listPlanCatalog`,
  - `controlPlane.syncDefaultBillingPlans`,
  - `controlPlane.entitlementSnapshot`,
  - `controlPlane.setTenantEntitlementOverride`.
- Kept every plan and entitlement function behind the existing `billing:manage` permission.
- Added `ShellBillingPlan` and `ShellTenantEntitlement` fixture contracts to `client/src/lib/kinfloShellData.ts`.
- Added a `Plans` tab to `AdminKinfloShell` with:
  - plan catalog selection,
  - feature gates,
  - tenant usage,
  - Entitlement Overrides,
  - Stripe Billing gated provider state.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed.

No Stripe customer, subscription, price, invoice, webhook, or checkout session is created.

No live Convex query, mutation, or action is executed.

The phase is a local contract for plan limits and manual override entitlements. Stripe Billing remains gated until hosted Convex activation, provider env setup, generated bindings, webhook verification, and live admin smoke are approved.

## Activation Sequence After Approval

1. Provision hosted Convex and generate API bindings.
2. Run `controlPlane.syncDefaultBillingPlans` as a platform super admin.
3. Connect Stripe Billing price IDs to `billingPlans.stripePriceIds`.
4. Route Stripe subscription webhook state into `tenantEntitlements`.
5. Preserve `controlPlane.setTenantEntitlementOverride` for founding customers, pilots, and temporary commercial exceptions.
6. Add hard enforcement in site creation, invitations, CRM, campaign, AI, domain, and automation mutations.
7. Smoke a tenant on a plan, apply a manual override, and confirm the super admin console shows the final entitlement state.
