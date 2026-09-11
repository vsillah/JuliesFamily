# Phase 19 Template Quality Contracts

This phase turns starter templates into configurable quality contracts instead of simple page/block seeds.

It remains provider-light. It does not run `convex dev`, does not run codegen, does not create a hosted Convex deployment, and does not write live site data.

## What Changed

- Added `qualityContract` metadata to `convex/siteFactory.ts` starter templates.
- Returned the quality contract from `siteFactory.listStarterTemplates`.
- Included the quality contract in the `site_created_from_template` audit metadata.
- Extended `ShellTemplate` fixture data with:
  - configurable fields,
  - image direction,
  - QA checks,
  - launch criteria.
- Upgraded the admin shell Templates tab to show those contracts before a site is launched.

## Why This Matters

KinFlo needs repeatable client-site creation, not only reusable code.

Each starter template now carries the practical judgment a launch process needs:

- what the client must configure,
- what kind of imagery belongs on the site,
- what visual and content checks must pass,
- and what criteria must be true before publishing.

That moves the product closer to the target milestone: Vambah can create a client website, assign an admin, configure the look and core content, preview it, and capture leads into the site CRM.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed.

No live Convex query, mutation, or action is executed.

No production import is performed.

## Activation Sequence After Approval

1. Run `siteFactory.listStarterTemplates`.
2. Confirm each returned template includes `qualityContract`.
3. Use the contract to drive the site creation wizard fields.
4. Run `siteFactory.createSiteFromTemplate`.
5. Confirm the audit event includes the selected template quality contract.
6. Run public preview QA against the template checks before publish.
