# Phase 24 Live Convex Handoff Checklist

This phase adds the final provider-light handoff checklist before KinFlo can move from fixture contracts to hosted Convex reads and writes.

It does not provision Convex, run codegen, commit generated API files, create DNS records, create Stripe resources, import production data, or run live mutations.

## What Changed

- Added `npm run kinflo:live-handoff`.
- Added `scripts/validate-convex-live-handoff.mjs`.
- Added a `Live Convex handoff checklist` launch gate to the KinFlo OS fixture shell.
- Kept `Convex deployment and generated API` and `Live admin smoke` as pending gates.
- Preserved the fail-closed runtime boundary with `generatedApiAvailable = false`.

## Evidence Required Before Live Switch

The live switch is not approved until every item below has current evidence:

- Hosted Convex project exists and is owned by Vambah.
- `CONVEX_DEPLOYMENT` is configured outside committed source.
- `VITE_CONVEX_URL` is configured outside committed source.
- Convex auth issuer and client ID are configured outside committed source.
- `npm run kinflo:activation-preflight` passes immediately before codegen.
- `npm run kinflo:validate-live-smoke` passes and the ordered live smoke manifest is reviewed.
- `npm run kinflo:dry-run-live-smoke` prints the ordered activation packet and the packet is saved in deployment notes.
- `npm run convex:codegen` is run after hosted setup approval.
- Generated API bindings are reviewed before any fixture adapter is replaced.
- `activation.readiness` runs against the hosted deployment.
- `activation.seedSmokeSite` runs once and proves tenant, site, roles, invitation, published page, resolver, entitlements, and audit events.
- Admin shell smoke proves super admin can see tenants, sites, roles, plans, entitlement usage, launch packets, CRM leads, and audit trail.
- Public renderer smoke proves `publicSite.resolvePublishedSite` returns only published and verified site data.
- Lead capture smoke proves `crm.submitLead` writes a site-scoped lead and audit/timeline event.
- Cross-tenant permission smoke proves client admins cannot read or mutate another tenant's data.
- Rollback plan is ready: switch adapters back to fixtures/REST, keep Convex writes paused, and preserve audit evidence.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed by this phase.

No live Convex query, mutation, or action is executed by this phase.

No production import is performed by this phase.

No DNS, SSL, Vercel domain, Stripe Billing, Stripe Connect, SendGrid, Twilio, Cloudinary, R2, or S3 provider write is performed by this phase.

## Activation Sequence After Approval

1. Confirm `.env.local` remains untracked and secrets are entered only outside chat.
2. Configure hosted Convex and auth.
3. Run `npm run kinflo:activation-preflight`.
4. Run `npm run kinflo:validate-generated-api`.
5. Run `npm run kinflo:validate-live-smoke` and review `docs/convex-live-smoke-manifest.json`.
6. Run `npm run kinflo:dry-run-live-smoke` and save the ordered packet in deployment notes.
7. Run `npm run kinflo:live-handoff` and save the output in the PR or deployment notes.
8. Run `npm run convex:codegen`.
9. Review generated API bindings and update the runtime boundary deliberately.
10. Replace one adapter at a time, starting with activation/readiness and read-only shell data.
11. Run live admin, public renderer, lead capture, entitlement, permission, and audit smokes in manifest order.
12. Only after those smokes pass, move `Convex deployment and generated API` and `Live admin smoke` launch gates from pending to done.
