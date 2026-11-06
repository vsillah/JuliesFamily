# Phase 189: Convex read-only smoke result

Status: blocked at the authenticated browser callback gate. The approved
development-readiness scope reached the exact local generated-binding harness,
and the user completed the hosted dev-role repair, but the read-only query
sequence was not started.

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
- The user completed the hosted dev-admin role repair successfully.
- The approved Infisical `dev:/SITE_URL` value was set to
  `http://127.0.0.1:5000`; activation preflight then passed all 114 checks and
  injected eight secrets without creating `.env.local`.
- Starting Auth0 sign-in from `127.0.0.1:5000` redirected back to the hosted
  Vercel URL despite the approved local `SITE_URL` being present and injected,
  so the local browser did not receive a localhost Convex Auth session. This
  confirms the current callback path does not consume that Infisical key. The
  hosted preview then showed the repaired admin shell, not the development-only
  harness.
- Source inspection confirms the mismatch: `convex/auth.config.ts` reads
  `CONVEX_SITE_URL` for the Convex Auth provider domain, while the browser
  client starts Auth0 through the Convex deployment selected by
  `VITE_CONVEX_URL`. The app does not read `SITE_URL` for this callback.
- No query, mutation, provider action, deployment, import, or data write ran.

## Stop decision

Stop at the callback-binding mismatch. Do not enter credentials again, invent
tenant or site IDs, or retry the query sequence until the development Convex
site URL and Auth0 callback are explicitly aligned with the local harness or
the smoke is explicitly moved to a hosted development route that exposes the
same generated harness. No additional Infisical key or hosted configuration
was changed in this phase.

## Next gate

After the callback binding is corrected, sign in once, paste the approved
Vanguard or Julie Convex tenant ID and its approved site ID into the harness,
confirm that the IDs belong to the approved scope, and run `Run 20 read-only
queries`. The harness stops after the first failure and emits only sanitized
counts and statuses; preserve that boundary.
