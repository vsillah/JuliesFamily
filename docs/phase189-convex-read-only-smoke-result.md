# Phase 189: Convex read-only smoke result

Status: blocked at the approved scope-ID entry gate. The authenticated
development-admin repair succeeded and the exact local generated-binding
harness is available, but the approved Convex tenant and site IDs were not
available in the current task context. The read-only query sequence was not
started; no IDs were guessed or substituted with URL slugs.

## Boundaries

- Convex development deployment: `hallowed-manatee-765`
- Infisical environment: `dev`, path `/`
- Harness: `phase174-generated-read-only`
- Requested scopes: approved Vanguard and Julie tenant/site scopes
- Allowed action: 20 generated Convex queries, sequentially, read-only
- Exclusions: Supabase changes, imports, seeds, writes, deployment, adapter
  cutover, provider actions, data modifications, guessed identifiers, and
  credential entry by automation

## Checks completed

- The persistent in-app browser tab was navigated to the local Vite harness:
  `/admin/kinflo-os?tab=hosted-activation&devHarness=phase174-generated-read-only`
- The page loaded the expected Convex Auth sign-in gate.
- The harness requires an authenticated Convex Auth session before rendering
  the query runner.
- The harness requires separately approved Convex `tenants` and `sites` IDs;
  URL slugs such as `vanguard-enterprises` are not accepted as substitutes.
- The one-time dev-only platform-role repair completed successfully for the
  authenticated identity. No tenant, site, production, provider, CRM, data,
  deployment, or adapter change was made.
- The approved Infisical `dev:/SITE_URL` value was aligned to the available
  local harness port `http://127.0.0.1:5001`; activation preflight passed all
  114 checks and injected eight secrets without creating `.env.local`.
- The matching `SITE_URL` was aligned on the `hallowed-manatee-765` development
  Convex deployment. The attempted `CONVEX_SITE_URL` override was rejected by
  Convex as a protected built-in and made no change.
- Starting Auth0 sign-in from the local harness now returns to `127.0.0.1:5001`
  and establishes a valid identity. The local page then stops at `KinFlo admin
  access required` because the development platform role is missing.
- Source inspection confirms the mismatch: `convex/auth.config.ts` reads
  `CONVEX_SITE_URL` for the Convex Auth provider domain, while the browser
  client starts Auth0 through the Convex deployment selected by
  `VITE_CONVEX_URL`. The app does not read `SITE_URL` for this callback.
- A direct unauthenticated CLI lookup was rejected by the server, preserving
  the authenticated boundary. No query, mutation, provider action, deployment,
  import, or data write ran.

## Stop decision

Stop at the scope-ID entry gate. Do not invent tenant or site IDs, use URL
slugs as substitutes, or retry the query sequence until the approved Convex
tenant and site IDs for the Vanguard and Julie scopes are entered directly in
the harness. No additional role, tenant, site, production, provider, CRM,
data, deployment, or adapter change was made in this phase.

## Next gate

With the repaired session retained, paste the approved Vanguard or Julie
Convex tenant ID and its approved site ID directly into the harness, confirm
that the IDs belong to the approved scope, and run `Run 20 read-only queries`.
The harness stops after the first failure and emits only sanitized counts and
statuses; preserve that boundary.
