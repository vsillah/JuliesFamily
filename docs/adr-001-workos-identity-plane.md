# ADR 001: WorkOS Identity Plane Spike

Date: 2026-09-11
Status: spike recommendation ready; provider proof not run

## Context

KinFlo already has a Convex product spine in `convex/schema.ts`, a role catalog in `convex/roleCatalog.ts`, and scoped permission evaluation in `convex/accessPolicy.ts`. The decision is whether WorkOS should provide identity and organization context while Convex remains the product source of truth.

## Options Reviewed

### Option A: Convex Auth Only

Keep the existing Convex Auth path and build identity, organization membership, invitation, MFA, and future enterprise onboarding inside KinFlo. This preserves control but expands a security-sensitive custom surface.

### Option B: WorkOS Identity Plus Convex Product Data

Use WorkOS AuthKit for authentication, sessions, organization selection, identity-membership lifecycle, invitations, and coarse role claims. Keep KinFlo tenants, sites, product memberships, CRM records, permissions, approvals, launch evidence, and rollback state in Convex.

### Option C: WorkOS-First Auth Rewrite

Replace the current auth and access layers before hosted Convex cutover. This creates unnecessary sequencing and rollback risk while the founding-tenant proof is still being qualified.

## Decision

Proceed with Option B as a bounded spike. WorkOS is evaluated as the identity plane. Convex remains the product data plane. KinFlo OS remains the workflow/control plane. This is not a production activation or migration commitment.

## Final Object Mapping Recommendation

| KinFlo object | WorkOS object/signal | System of record | Recommendation |
| --- | --- | --- | --- |
| `users` | User and JWT `sub` | WorkOS for identity; Convex projection | Add provider-neutral identity linkage. Store `identityProvider: "workos"`, `workosUserId`, and the verified subject; never credentials or tokens. |
| `tenants` | Organization and JWT `org_id` | Convex | Keep the KinFlo tenant separate and add unique `workosOrganizationId`. Start with one WorkOS organization mapped to one KinFlo tenant; do not make WorkOS the tenant record. |
| `sites` | No required WorkOS object | Convex | Keep sites below the tenant. Site access never comes solely from WorkOS claims. |
| `memberships` | Organization membership | WorkOS for identity membership; Convex for product authorization | Link an active Convex tenant membership to `workosOrganizationMembershipId`. Require both a matching active WorkOS org context and active Convex membership. Keep site grants only in Convex. |
| `roles` | Role/roles and permissions claims | Hybrid | Use a small allow-listed WorkOS role vocabulary as coarse identity grants. Map it to KinFlo role keys; compute final permissions from the Convex catalog. Never treat arbitrary token permission strings as KinFlo authorization. |
| `invitations` | Organization invitation or User Management widget | Hybrid | KinFlo creates an approval/readiness record first. Only an explicitly approved provider action may create/send the WorkOS invitation. Acceptance is projected back into Convex. |
| `auditEvents` | WorkOS events/Audit Logs | Hybrid | Keep KinFlo evidence and rollback events in Convex. WorkOS events may later add identity lifecycle evidence but cannot replace product audit records. |
| CRM, launch gates, provider approvals | None | Convex/KinFlo OS | No WorkOS ownership. |

Keeping tenant and organization records separate avoids a vendor-shaped product model and supports a future umbrella customer with multiple sites or KinFlo-specific lifecycle state. The initial one-to-one mapping is an invariant for the spike, not a permanent database identity.

## Authorization Rule

WorkOS claims are necessary identity context, not sufficient product authority.

For a tenant/site request, the future resolver must:

1. Validate the WorkOS JWT through Convex auth configuration.
2. Read `sub`, `org_id`, `role`/`roles`, and `permissions` from the validated identity.
3. Resolve exactly one Convex user projection by WorkOS subject/user id.
4. Resolve exactly one active KinFlo tenant by `workosOrganizationId === org_id`.
5. Require an active Convex tenant membership for that user and tenant.
6. For site scope, require either that tenant membership or an active site membership, following the current KinFlo policy.
7. Map only allow-listed WorkOS role slugs to KinFlo role keys.
8. Calculate final product permissions through the Convex role catalog and membership rows.
9. Deny on a missing/ambiguous mapping, organization mismatch, inactive membership, unknown role, or unassigned site.

The existing `viewerPermissionSnapshot` should later expose sanitized identity provenance (`provider`, `organizationMatched`, and mapped coarse roles) for QA, but it must never return tokens, session ids, or raw secrets.

## Claim Freshness And Size

WorkOS session JWTs can include organization, role(s), and permissions. Role or membership changes may not be visible until a token is refreshed. KinFlo should refresh the session after organization/role changes and still enforce the current Convex projection. Keep claims coarse because browser session cookies commonly have a 4 KB ceiling. Site lists, CRM scopes, launch grants, and client-specific permissions belong in Convex rather than the JWT.

## Environment Contract

No `.env.local` file is permitted. A future approved proof should extend the existing 1Password child-process injection pattern with a dedicated staging item or field group:

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `WORKOS_CLIENT_ID` | Server/config; identifier, not secret | JWT issuer/JWKS configuration |
| `WORKOS_API_KEY` | Server only, secret | Staging AuthKit management/API calls when separately approved |
| `WORKOS_COOKIE_PASSWORD` | Server only, secret | Session-cookie sealing where the chosen AuthKit SDK requires it |
| `VITE_WORKOS_CLIENT_ID` | Browser-safe identifier | Vite AuthKit provider configuration |
| `VITE_WORKOS_REDIRECT_URI` | Browser-safe URL | Local/staging callback URI |
| `VITE_CONVEX_URL` | Browser-safe URL | Existing Convex client endpoint |

The runner may print presence/missing status only, inject values into one child process, and scrub them on exit. It must reject live-key formats, production redirect hosts, missing values, and any request to persist values. The Vite bundle must never receive `WORKOS_API_KEY` or `WORKOS_COOKIE_PASSWORD`.

## Exact Likely Implementation Surfaces

No implementation change is authorized by this ADR. If approved later, the first bounded PR would likely touch:

- `package.json` and lockfile: AuthKit/Convex bridge dependencies and local-only scripts.
- `convex/auth.config.ts`: WorkOS custom-JWT issuers/JWKS, behind the selected auth-mode contract.
- `convex/auth.ts`: preserve or isolate the Convex Auth fallback; do not delete it during the spike.
- `convex/schema.ts`: optional WorkOS identity/org/membership reference fields and indexes.
- `convex/controlPlane.ts`: idempotent identity projection/sync without secrets.
- `convex/accessPolicy.ts`: claim-org binding and fail-closed snapshot provenance.
- `convex/roleCatalog.ts`: explicit allow-listed WorkOS-to-KinFlo coarse role mapping.
- `client/src/main.tsx`: compose AuthKit and Convex providers only in spike mode.
- `client/src/App.tsx`: local/staging callback and guarded spike route.
- `client/src/hooks/useAuth.ts`: adapter boundary so legacy Express auth remains available for rollback.
- `client/src/lib/kinfloConvexRuntime.ts`: report auth mode and retain fixture/live gates.
- `scripts/run-kinflo-with-1password-env.mjs`: separate WorkOS staging contract after approval.
- New focused tests/validator and an isolated local spike route; no change to public routes or live adapters.

## Rollback To Convex Auth Only

1. Keep WorkOS integration behind an explicit `convex_auth` versus `workos_spike` mode; default remains `convex_auth` until adoption is approved.
2. Do not delete `convex/auth.ts`, current provider configuration, subject lookup, or legacy client auth during the spike.
3. Make new linkage fields optional and additive. Do not rewrite existing user, tenant, membership, or invitation ids.
4. Stop the spike by switching the mode to `convex_auth`, removing the AuthKit client provider/callback from the spike route, and restoring the original `convex/auth.config.ts` provider list.
5. Leave WorkOS reference fields dormant; no data migration is required to read existing Convex records.
6. Remove unneeded WorkOS dependencies and approved secret-store fields only after confirming Convex Auth sign-in, `syncCurrentUser`, permission snapshots, tenant/site denial tests, and invitation readiness still pass.
7. Record the rollback in KinFlo's audit/evidence package. Do not delete external staging resources without separate approval.

## Acceptance Decision After The Proof

Adopt only if the staging proof passes all isolation cases, the role vocabulary stays small, token refresh behavior is acceptable, the invitation gate remains KinFlo-owned, and rollback succeeds. Otherwise remain on Convex Auth and revisit WorkOS only when an enterprise customer creates concrete SSO or Directory Sync demand.

## Sources

- https://workos.com/docs/authkit/sessions
- https://workos.com/docs/authkit/roles-and-permissions
- https://workos.com/docs/authkit/users-organizations
- https://workos.com/docs/authkit/invitations
- https://workos.com/docs/authkit/environments
- https://workos.com/docs/widgets
- https://docs.convex.dev/auth/authkit/add-to-app
