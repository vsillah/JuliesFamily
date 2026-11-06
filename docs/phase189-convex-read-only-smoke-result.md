# Phase 189: Convex read-only smoke result

Status: blocked at the authenticated browser gate. The approved development
readiness scope reached the exact local generated-binding harness, but the
read-only query sequence was not started.

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
- No query, mutation, provider action, deployment, import, or data write ran.

## Stop decision

Stop at the user-owned Auth0 gate. Do not enter credentials, invent tenant or
site IDs, or retry the query sequence until the user completes Auth0 sign-in
in the persistent tab and supplies or pastes the approved IDs into the local
harness fields.

## Next gate

After sign-in, paste the approved Vanguard or Julie Convex tenant ID and its
approved site ID into the harness, confirm that the IDs belong to the approved
scope, and run `Run 20 read-only queries`. The harness stops after the first
failure and emits only sanitized counts and statuses; preserve that boundary.
