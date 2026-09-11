# KinFlo Program Roadmap

Updated: 2026-09-11

KinFlo is a reusable multi-tenant operating system for client websites, CRM intake, permissions, launch readiness, provider integrations, and governed public activation. Julie's Family is the founding proof tenant.

## Architecture Principle

| Layer | Primary owner | Posture | Owns |
| --- | --- | --- | --- |
| Identity plane | WorkOS candidate | Buy-first spike | Sign-in, sessions, MFA, organizations, identity memberships, invitations, coarse role claims |
| Product data plane | Convex | Build | Tenants, sites, product memberships, site grants, CRM, launch evidence, rollback state, feature flags, product permissions |
| Workflow/control plane | KinFlo OS | Build | Operator review, approval packets, adapter sequencing, provider-write gates, client handoff, public-launch readiness |

Shorthand: WorkOS = identity plane; Convex = product data plane; KinFlo OS = workflow/control plane.

The recommended posture is hybrid. WorkOS may establish who the viewer is and which customer organization is active. Convex decides which KinFlo tenant and sites that identity may access and which product actions are allowed. KinFlo OS preserves every approval and activation gate.

## Executive Phase Map

| Phase | Outcome | Gate |
| --- | --- | --- |
| 0. Program map | Canonical architecture, owners, and launch definition | Roadmap accepted |
| 1. Identity and tenant boundary | WorkOS/Convex mapping decision and staging proof | ADR and bounded proof accepted |
| 2. SaaS spine | Product model and server-side permission checks stable | Local checks pass without hosted writes |
| 3. Operator shell | Reviewable KinFlo OS control surface | Local visual and interaction QA |
| 4. Founding tenant proof | Julie's Family content, CRM, permissions, and launch packet | Human review accepted |
| 5. Hosted activation | Fixture truth becomes hosted Convex truth | Env, codegen, read-only, then separately approved mutation smoke |
| 6. Fixture-to-live cutover | Adapters switch one bounded surface at a time | Isolation and rollback proven |
| 7. Public launch | Founding tenant launches safely | Production launch packet accepted |
| 8. Repeatable client factory | A second client follows the same path | Pilot selected |
| 9. Growth and integrations | Enterprise identity, providers, campaigns, AI, and billing mature | Per-provider and per-customer approvals |

## Phase 1 Decision

Run a bounded identity architecture spike now. The detailed recommendation is in `docs/adr-001-workos-identity-plane.md`, the execution proof is in `docs/phase174-workos-identity-plane-spike.md`, and the machine-readable contract is `docs/workos-identity-plane-spike-plan.json`.

The spike does not authorize production WorkOS, billing, SSO, Directory Sync, secret access, provider writes, generated Convex bindings, hosted mutation smoke, adapter cutover, deployment, or public/client sharing.

## Current Decision Gate

Should KinFlo run a bounded Phase 1 identity spike that tests WorkOS as the identity plane while preserving Convex as the product data and workflow-control plane?

Recommendation: yes. Begin with static/local contract tests. A later WorkOS staging proof requires an explicit provider-write and approved-secret-store gate.
