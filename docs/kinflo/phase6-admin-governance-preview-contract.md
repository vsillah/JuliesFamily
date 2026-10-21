# Phase 6: Tenant-Safe Admin Governance Preview Contract

Status: source-only contract and preview surface

This phase defines the universal KinFlo governance shape for a user who may belong to several tenants or sites. It is deliberately fail-closed and preview-only. The browser can simulate a capability for review, but it cannot change authorization or impersonate a user.

## Contract

- `KinfloGovernanceUser` is the identity record shown to an admin.
- `KinfloGovernanceMember` binds a user to a role, active status, and platform, tenant, or site scope.
- `KinfloGovernancePermission` is an allowlisted capability such as `content:edit`, `experiment:manage`, or `preview:simulate`.
- `kinfloGovernanceRoleMatrix` is the least-privilege role-to-permission matrix. A role never gains a permission by being selected in the UI.
- `evaluateKinfloCapability` requires an active membership that covers the exact requested scope and grants the requested permission.

Missing membership, inactive membership, cross-tenant or cross-site scope mismatch, unknown permission, invalid scope, and role mismatch all return a denied result. Denied scope never falls back to Julie's Family or another tenant.

## Admin simulation

The admin Preview QA Studio can select a preview user, role, and permission. It evaluates those values against an explicit fixture membership and labels the result `read_only` and `preview_only`. Generated links carry `capabilityMode=preview_only`, `authorizationChange=none`, and `impersonation=false`.

The simulation is a display and review aid only. No impersonation occurs: it does not alter a session, grant a capability, persist a role, or change an Auth0 identity.

## Public preview boundary

Public preview may display the requested capability marker for evidence, but the marker has `displayOnly: true` and `accessGranted: false`. Public rendering never treats persona, role, capability, or query-string state as authorization. Private reads remain server-side responsibilities.

## Deferred live work

Real Auth0/Convex role persistence, membership provisioning, invitations, access reviews, scoped support access, and live audit events remain separate implementation and approval gates. This phase does not change `convex/`, generated bindings, Auth0 configuration, environment files, deployment, hosted smoke, providers, email/SMS, uploads, or data.

## Validation

```text
npm run kinflo:test-phase6-admin-governance
npm run kinflo:validate-phase6-admin-governance
```
