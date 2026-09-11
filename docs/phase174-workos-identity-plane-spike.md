# Phase 174: WorkOS Identity Plane Spike

Command:

```bash
npm run kinflo:validate-workos-identity-spike
```

## Purpose And Result

This phase evaluates WorkOS as KinFlo's identity plane without a WorkOS-first rewrite. The source roadmap is `docs/kinflo-program-roadmap.md`, the governing decision is `docs/adr-001-workos-identity-plane.md`, and the structured contract is `docs/workos-identity-plane-spike-plan.json`.

Status: `architecture_recommendation_ready`.

Recommendation: WorkOS identity plus Convex product data. WorkOS is a candidate for the identity plane. Convex stays the KinFlo product source of truth. KinFlo still owns site-level permissions, CRM data, launch gates, provider-write approvals, evidence, and rollback.

## Minimum Local And Staging Proof Plan

### Stage 0: static/local contract — allowed now

- Validate the object map, gates, environment variable names, code-surface inventory, and rollback steps.
- Use synthetic claim fixtures only; do not sign tokens or pretend fixture claims prove WorkOS integration.
- Table-test allow-listed role mapping and default denial for missing `sub`, missing `org_id`, unknown role, organization mismatch, inactive membership, unassigned site, and cross-tenant CRM access.
- Keep current adapters and Convex Auth behavior unchanged.

Exit evidence: this phase validator and `npm run check` pass; external writes remain zero.

### Stage 1: local WorkOS staging sign-in — explicit provider-write and approved-secret-store gate required

- Through an approved 1Password-injected child process, configure only staging identifiers/secrets.
- Register only local callback/CORS values and a private spike route.
- Sign in with a synthetic test user and select a synthetic staging organization.
- Confirm the validated Convex identity includes the WorkOS `sub`, `org_id`, and role/permission signal.
- Confirm no token, API key, cookie password, session id, or private profile data appears in logs or committed evidence.

Exit evidence: sanitized claim-name/presence report, callback result, and secret-leak scan. This stage necessarily involves WorkOS staging writes and is not authorized by the present lane.

### Stage 2: identity-to-product mapping — explicit hosted/read-only gate required

- Map the synthetic WorkOS user and organization to additive Convex user/tenant references.
- Project one active organization membership into a KinFlo tenant membership.
- Query `accessPolicy.viewerPermissionSnapshot` for the assigned tenant and site.
- Confirm the snapshot derives permissions from Convex role definitions, not directly from arbitrary JWT permissions.
- Refresh the session after a staging role change and record the bounded propagation behavior.

Exit evidence: sanitized ids/counts only, no raw tokens. Any hosted mutation used to create projections requires a separate hosted Convex mutation-smoke approval.

### Stage 3: isolation and rollback — same explicit hosted gate

Prove this matrix:

| Case | Expected result |
| --- | --- |
| Correct `org_id`, active tenant membership, assigned site | Allowed permissions match Convex role catalog |
| Correct org, site editor, `content:publish` absent | Read/edit allowed; publish denied |
| Correct org, unassigned sibling site | Denied |
| Different `org_id` requesting tenant/site/CRM rows | Denied |
| Missing org claim, unknown role, inactive membership, or stale/deleted mapping | Denied |
| Platform admin | Allowed only through the existing explicit Convex platform role, never a guessed WorkOS role |

Then switch the spike mode back to Convex Auth and rerun current user sync, permission snapshot, tenant/site denial, and invitation-readiness checks.

## Hard Boundaries

This phase does not:

- create a production WorkOS environment,
- set up WorkOS billing,
- create production SSO or Directory Sync connections,
- read or print secrets,
- write `.env.local`,
- execute provider writes,
- publish a public site,
- share a client site,
- import generated Convex API files,
- switch fixture adapters to live generated bindings,
- run hosted Convex mutation smoke,
- merge, deploy, or clean branches.

## Captain Operating Board

- Implementation lane: created and bound to `codex/kinflo-workos-identity-spike`.
- Architecture recommendation, mapping, proof plan, env contract, code-surface inventory, and rollback: complete locally.
- WorkOS staging touched: no.
- Hosted Convex touched by this lane: no.
- External writes: 0.
- Secrets read or printed: no.
- `.env.local` remains absent.
- Production, billing, enterprise connections, provider writes, public/client sharing, generated imports, live adapters, hosted mutation smoke, merge, and deployment remain gated.

## Next Approval

If Vambah wants empirical proof, explicitly authorize a local-only WorkOS staging setup using the approved secret store and synthetic identities. Because creating/configuring the staging application, organization, memberships, roles, redirects, or invitations are provider writes, that approval must name the bounded staging actions. Hosted Convex projection writes remain a separate later approval.
