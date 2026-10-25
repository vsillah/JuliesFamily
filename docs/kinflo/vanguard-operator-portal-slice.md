# Vanguard Operator Portal: fixture vertical slice

## Scope and acceptance

This slice adds a compact Vanguard operator home inside `/admin/kinflo-os`. It uses the existing KinFlo admin route, scope provider, fixture contracts, and canonical workspaces. The entry appears only for the Vanguard tenant and site. A mismatched selected scope renders no Vanguard records.

The home has five sections: Overview, Site Studio, Intelligence, Fulfillment, and Release. It summarizes the existing deterministic Vanguard order, audience, experiment, and fulfillment fixtures. Links carry the selected tenant and site into the existing Studio, audience preview, experiment preview, operations, access, and launch-readiness workspaces. Publish and delivery controls are visibly disabled with reasons and recovery paths. No mutation or network call is added.

## Safety boundary

This is a local fixture demonstration, not a Mark account session. `tenant_admin` for Vanguard is the intended live operator role. Convex must enforce tenant and site authorization for every live read and write. Persona and journey context can change presentation only. The portal does not activate first-party tracking, company intelligence, experiment allocation, content publishing, fulfillment writes, provider calls, invitations, uploads, or hosted activation.

## Finite roadmap

1. **Fixture overview and navigation** — delivered in this slice. Gate: exact-scope rendering, blocked-action explanations, and canonical links.
2. **Scoped live read model** — pending. Gate: verified Vanguard `tenant_admin` read access, cross-tenant and cross-site denial, consented first-party event provenance, and source-to-view evidence.
3. **Revision-aware review and fulfillment actions** — pending. Gate: approved Convex mutations with audit, deterministic idempotency, scoped associate grants, immutable receipts, rollback controls, and human QA.
4. **Hosted activation and release** — pending. Gate: separate ownership, security, migration, provider, deployment, and production approval.

The current implementation completes phase 1 of 4. Three phases remain and require separate authorization and evidence.
