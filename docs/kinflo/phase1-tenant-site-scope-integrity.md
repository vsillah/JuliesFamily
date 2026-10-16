# KinFlo Phase 1 Tenant/Site Scope Integrity

Status: source implementation and local validation only

Source contract: draft PR #53, `docs/kinflo/universal-tenant-site-roadmap.md`

Baseline: `origin/main` at `b7c97dd`

Hosted Convex execution, code generation, provider writes, deployment, production changes, and `.env.local`: not authorized

## Bounded objective

This slice establishes one fail-closed server contract for tenant/site selection without migrating Julie's Family routes or adding Phase 2 persona/content records.

The contract now requires:

1. A supplied `siteId` resolves to one non-archived site.
2. The site's parent tenant exists and is active.
3. A supplied `tenantId` must equal the site's actual `tenantId`.
4. A tenant-level permission uses only an active tenant membership with no `siteId`.
5. A site-level permission may inherit an active tenant membership or use an active membership for that exact site.
6. Foreign-tenant, foreign-site, inactive, and stale memberships contribute no permissions.
7. Platform super admins still resolve and validate any tenant/site scope they request before the platform override applies.
8. Private failures use generic unavailable/permission errors rather than disclosing whether a foreign record exists.

`convex/scopePolicyCore.ts` contains the pure contract. `convex/accessPolicy.ts` resolves database records and applies it to the shared permission path.

## Applied surfaces

### Shared admin and control-plane authorization

All functions that call `requirePermission` or `hasPermission` now inherit active tenant/site resolution. This covers the current control-plane, site builder, CRM, preferences, campaigns, AI review, integrations, entitlements, launch-readiness, and guarded site-factory paths.

Membership and role-catalog reads in the hot authorization path are bounded. Membership reads use the existing compound indexes and stop when the configured defensive ceiling is exceeded.

### Site-builder record containment

The content administration path now validates the tenant/site fields on records after authorization and before returning or mutating them. The checks cover:

- site draft theme, navigation, and page projection;
- page create/update route collisions;
- navigation item and parent references;
- page-to-block references;
- block-to-visibility-rule references;
- domain updates;
- page publishing, revisions, and included blocks.

An ID that exists under a different tenant/site is treated as unavailable.

### Public projection

`publicSite.resolvePublishedSite` remains intentionally unauthenticated, but now resolves the published site into the same active tenant/site contract. Domain, page, theme, navigation, content block, and visibility-rule records must match that resolved scope before they can appear in the public allowlisted projection.

Audience persona and journey strings remain presentation inputs only. They do not enter the authorization contract.

### Invitations

Invitation acceptance now resolves an active tenant/site context and verifies that the invitation belongs to it. Existing pending-token lookup, expiry handling, and email matching remain intact. Revoked, expired, archived-scope, and cross-site invitations fail closed.

## Function inventory and disposition

| Module group | Current authority | Phase 1 disposition |
| --- | --- | --- |
| `accessPolicy`, `controlPlane` | Convex identity, platform role, scoped membership and permission catalog | Hardened shared scope resolution and invitation acceptance |
| `siteBuilder`, `crm`, `preferences`, `campaigns`, `aiReview`, `integrations`, `launchReadiness` | Shared `requirePermission` guard | Inherits active scope resolution; site-builder reference integrity hardened in this slice |
| `publicSite` | Published hostname/subdomain and allowlisted projection | Hardened parent/child scope containment; remains public by design |
| `orders` | Authenticated owner plus fixed Vanguard tenant/site and record ownership | Preserved; adapter-light fixed-target model remains isolated and is not generalized in Phase 1 |
| `activation` | Authenticated platform-admin development controls | Preserved behind its existing development-only and workflow gates; no hosted execution in this lane |
| `roleCatalog` | Authenticated reads and platform-admin synchronization | Preserved; shared authorization now bounds persisted role reads |
| `siteFactory` | Static read-only planning catalogs plus guarded site creation | Static catalogs remain read-only; creation inherits active tenant scope resolution |
| legacy Express/Drizzle Julie routes | Existing OIDC/session and global application model | Unchanged and isolated; no migration or cutover in this lane |

## Pagination and bounded-query rule

New tenant/site reads must start from an index whose leading fields contain the resolved scope. User-facing lists must use a caller-bounded `take` or Convex pagination. Authorization reads must have a fixed defensive ceiling and fail closed if the ceiling is exceeded. A JavaScript filter may refine a small, already scope-bounded result; it must not create the security boundary.

This lane fixes the authorization hot path. The inventory still identifies older list/report queries using scope-indexed `.collect()` calls. Converting each user-facing list to cursor pagination is follow-on work and should be split by product surface so response contracts are not changed accidentally.

## Focused negative coverage

`scripts/test-kinflo-scope-policy.ts` covers:

- valid active tenant/site resolution;
- foreign tenant plus valid site denial;
- archived tenant and archived site denial;
- tenant membership inheritance at a site;
- foreign-site, foreign-tenant, inactive, and wrong-user membership denial;
- cross-tenant and cross-site document denial;
- revoked, expired, and cross-site invitation denial.

`scripts/validate-kinflo-phase1-scope-integrity.mjs` also protects the integration points: resolve-before-platform-override ordering, index-backed bounded membership reads, public filtering, admin record assertions, invitation scope resolution, generic failure text, and package scripts.

## Remaining Phase 1 gates

- Run the focused unit test, source validator, Convex-only TypeScript check, existing import validator, and repository TypeScript baseline check in a dependency-complete checkout.
- Review any pre-existing full-repository TypeScript drift separately from touched-surface results.
- Captain review must decide whether to broaden record-containment assertions into CRM, campaign, AI-review, and integration child-record mutations in additional scoped PRs.
- Hosted Convex push/codegen and same-tenant/cross-tenant integration execution remain separate approval gates.
- No client-facing surface changed, so Human QA and an MP4 are not required for this source/backend phase.

## Preserved behavior

- Julie's Family Express/OIDC/session routes are unchanged.
- Existing public site resolution remains published-only.
- The Vanguard order flow remains fixed-target, authenticated, owner-scoped, and adapter-light.
- No schema table or field was added, so this slice requires no data migration.
- No environment, generated binding, provider, billing, deployment, or production state is changed.
