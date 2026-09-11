# Phase 22 Entitlement Guard Contracts

This phase turns the Phase 21 plan and entitlement records into reusable Convex guard contracts.

The goal is to make plan limits enforceable before Stripe Billing is connected, while keeping the branch provider-light and dry-run safe.

## What Changed

- Added `convex/entitlements.ts` as the shared entitlement contract layer.
- Moved the default provider-light plan catalog into `entitlements.defaultBillingPlanCatalog`.
- Added reusable helpers for:
  - `loadEffectiveTenantEntitlement`,
  - `loadEntitlementUsageSnapshot`,
  - `requireEntitlementLimit`,
  - `entitlementLimitFor`.
- Added billing-admin queries:
  - `entitlements.entitlementUsageSnapshot`,
  - `entitlements.checkEntitlementLimit`.
- Wired measurable limits into mutations:
  - `controlPlane.createSite` checks the `sites` limit,
  - `siteFactory.createSiteFromTemplate` checks the `sites` limit,
  - `controlPlane.grantMembership` checks the `admins` limit when granting active owner/admin seats,
  - `controlPlane.createInvitation` checks the `admins` limit for new pending owner/admin invites,
  - `crm.submitLead` checks the `contacts` limit before creating a new lead.
- Added entitlement guard function names to the frontend Convex runtime contract list.

## Enforced Now

These limits are measurable against current Convex collections and are enforced by this phase:

- `sites` from active non-archived `sites`,
- `admins` from active owner/admin memberships plus pending owner/admin invitations,
- `contacts` from non-archived `leads`,
- `customDomains` from non-disabled `domains`.

The `customDomains` counter is available in the usage snapshot. Phase 23 wires that counter into the existing `siteBuilder.upsertDomain` mutation.

## Contract Placeholders

These limits remain visible in plan state but are not enforced until their modules migrate:

- `campaigns`,
- `aiCredits`,
- `automations`.

The usage snapshot marks these as `contract_placeholder` so the admin shell can distinguish future gates from active enforcement.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed.

No Stripe customer, subscription, price, invoice, webhook, or checkout session is created.

No live Convex query, mutation, or action is executed.

The entitlement guards are local contracts that become live only after hosted Convex activation, generated bindings, and live admin smoke are approved.

## Activation Sequence After Approval

1. Generate Convex API bindings after hosted Convex setup is approved.
2. Run `controlPlane.syncDefaultBillingPlans`.
3. Confirm `entitlements.entitlementUsageSnapshot` returns plan, override, usage, remaining capacity, and enforcement state.
4. Smoke site creation at, below, and above a plan's `sites` limit.
5. Smoke owner/admin invitation at, below, and above a plan's `admins` limit.
6. Smoke public lead capture at, below, and above a plan's `contacts` limit.
7. Add hard guards to domains, campaigns, AI credits, and automations as those modules migrate to Convex.
