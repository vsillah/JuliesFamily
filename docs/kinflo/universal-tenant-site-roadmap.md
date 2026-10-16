# KinFlo Universal Tenant/Site Roadmap

Status: architecture and migration plan only  
Source baseline: `origin/main` at `b7c97dd`  
Prepared: 2026-10-15  
Implementation, deployment, hosted execution, provider writes, and production data changes: not authorized

## Objective

Make Julie's Family's strongest capabilities reusable across KinFlo without carrying Julie-specific global state into every customer site.

The target is one product contract:

- a user may belong to more than one tenant and site;
- every private record has an explicit platform, tenant, site, user, or public scope;
- every server read and write enforces that scope before returning or changing data;
- audience personas, content, experiments, and support access are configurable per site;
- public rendering exposes only published records resolved for the requested site;
- Julie's Family becomes the founding tenant and migration proof, not the implicit global default;
- a second tenant proves the architecture is universal before broader rollout.

## Executive Finding

KinFlo has two overlapping systems at different maturity levels.

1. The Julie's Family React/Express/PostgreSQL application has mature persona, content, A/B testing, role-management, and impersonation experiences. Most of those records are global or organization-light.
2. The Convex KinFlo control plane has the stronger reusable boundary: tenants, sites, memberships, roles, invitations, site content, visibility rules, CRM, campaigns, audit events, and server-side permission guards already carry tenant/site scope.

The correct path is not a wholesale rewrite or a direct copy of legacy tables. Preserve the proven Julie workflows, move their durable concepts into site-scoped Convex contracts, and cut over one bounded capability at a time.

## Capability Inventory

### 1. Julie's Family personas and audience context

Implemented in the legacy application:

- Five named personas: student, service provider, parent, donor, and volunteer, plus a default/explorer state.
- Four journey stages: awareness, consideration, decision, and retention.
- Optional passion tags used for content targeting.
- Authenticated users can persist one persona on the global user profile.
- Anonymous visitors use Julie-named session-storage keys.
- Admin preview can override persona, journey stage, and A/B variant in session storage.
- Retention-stage student and volunteer dashboards are conditioned on enrollment state.

Reusable value:

- the persona-selection experience;
- persona + journey-stage targeting;
- passion-aware ordering and filtering;
- previewing an audience context without changing public data;
- enrollment-aware downstream experiences.

Current universalization gaps:

- `users.persona` is global, but one person can have a different relationship to each site;
- persona IDs, labels, descriptions, icons, and journey stages are hardcoded around Julie's Family;
- storage keys and first-visit behavior are Julie-specific;
- Convex visibility rules accept persona and journey strings, but there are no canonical site-scoped persona or journey-definition collections;
- public audience context is not a trusted authorization input and must never grant private access.

### 2. Content and personalization

Implemented in the legacy application:

- content items across services, events, testimonials, sponsors, lead magnets, impact stats, hero, CTA, media, program details, and dashboard cards;
- persona x journey visibility, ordering, title, description, and image overrides;
- passion-tag targeting;
- content usage inspection, matrix editing, reset-to-default behavior, and batch ordering;
- public visible-content and visible-section endpoints;
- admin content management and preview surfaces.

Implemented in Convex:

- tenant/site-scoped `pages`, `pageRevisions`, `contentBlocks`, `contentVisibilityRules`, `navigationItems`, `assets`, `themeTokens`, and `publishEvents`;
- server-guarded content editing and publishing;
- public resolution by verified hostname or subdomain, route, persona, and journey stage;
- published-only projection with private fields removed;
- site-scoped CRM, campaign, and audit foundations;
- an open draft PR, #52, adds a local-only tenant site composer but deliberately leaves persistence gated.

Current universalization gaps:

- legacy content and visibility records have no tenant/site scope;
- Convex block metadata is flexible but lacks a versioned, validated schema per block type;
- persona and journey references are strings rather than validated site definitions;
- asset usage, content provenance, locale, approval, and reusable tenant-vs-site ownership need one explicit contract;
- the draft site composer is not persisted and must not be treated as a live control surface;
- Julie and a second tenant have not yet been proven on one persisted content path.

### 3. A/B testing and optimization

Implemented in the legacy application:

- manual and automated tests;
- test targets for multiple persona x journey combinations;
- presentation, card-order, and layout variants;
- weighted traffic allocation and consistent user/visitor assignment;
- event tracking, analytics, historical results, and baseline configuration;
- metric-weight profiles, safety limits, automation rules and runs;
- AI-generated or AI-assisted variant metadata;
- control selection, winner state, and automated promotion fields.

Current universalization gaps:

- the entire experiment family is globally scoped: tests, targets, variants, assignments, events, metrics, rules, runs, baselines, and safety limits have no `tenantId` or `siteId`;
- visitor/test uniqueness can collide across sites;
- content and variant references are not guaranteed to belong to the same site;
- event ingestion has no site-bound authorization or published-experiment verification contract;
- raw-event retention, aggregation, consent, bot filtering, and privacy boundaries are undefined for multi-tenant use;
- automated winner promotion is not connected to revision-aware content publishing and approval gates;
- Convex has no experiment collections yet.

### 4. User roles and access

Implemented in the legacy application:

- global `client`, `admin`, and `super_admin` roles;
- one optional organization per user for tier access;
- user creation, deletion, role changes, program entitlements, and audit logs;
- Auth0/OIDC session handling.

Implemented in Convex:

- platform users with `user` or `super_admin` platform role;
- tenant and optional site memberships for owner, admin, editor, and viewer;
- persisted role catalog plus server-side permission evaluation;
- tenant/site invitations;
- platform, tenant, and site audit events;
- explicit guards for site creation, membership management, content editing/publishing, asset management, CRM, and other product actions.

Current universalization gaps:

- the legacy global role model and Convex scoped membership model coexist;
- active tenant/site selection is not yet a single trusted server-resolved context across all product surfaces;
- several role and invitation surfaces remain provider-light or activation-gated;
- custom roles, temporary grants, separation of duties, and access-review expiry are not yet first-class;
- every migrated function still needs negative cross-tenant tests, not only a scoped schema field.

### 5. User impersonation and support access

Implemented in the legacy application:

- an admin may start one active impersonation session and view the app as another user;
- session start/end records preserve admin, target, timestamps, optional reason, and optional request metadata;
- a visible banner provides an end-session action;
- admin-only control routes inspect the original administrator.

Security and tenancy gaps:

- any admin can target any user; there is no demonstrated tenant/site containment;
- reason is optional;
- no mandatory expiry, step-up authentication, approval, or emergency-access policy is present;
- middleware errors continue the request, so support context fails open;
- request identity is replaced instead of carrying separate actor and subject identities;
- session lifecycle is recorded, but action-by-action attribution to both the real actor and viewed-as subject is not demonstrated;
- the delete-style end route does not visibly verify that the requested session belongs to the current administrator;
- support access has no Convex tenant/site contract.

The universal feature should be renamed **scoped support access**. It must preserve the real actor, add an explicit viewed-as subject, and never mutate the authentication identity.

## Target Architecture

### Scope hierarchy

| Scope | Examples | Required boundary |
| --- | --- | --- |
| Platform | plans, default role catalog, template packages | platform permission |
| Tenant | billing, shared brand assets, tenant defaults, tenant team | `tenantId` plus tenant permission |
| Site | pages, personas, content, leads, experiments, campaigns | `tenantId` + `siteId` plus site permission |
| User | preferences, saved audience context | authenticated user plus site context |
| Public | published page projection, public experiment assignment | resolved published site only |

Rules:

1. A site ID is never accepted without verifying that it belongs to the supplied or resolved tenant.
2. Client-supplied `tenantId`, `siteId`, role, actor, and publish state are untrusted until resolved server-side.
3. Authorization is evaluated inside every Convex function before data access or mutation.
4. Public functions return allowlisted projections, not private records with fields removed ad hoc.
5. Cross-tenant identifiers return the same fail-closed result as nonexistent records where disclosure would be unsafe.
6. Audit records carry scope, actor, action, resource, outcome, and correlation ID.
7. Audience persona affects presentation only; it never grants permissions.

### Canonical records

Keep and harden the existing Convex records:

- `users`, `tenants`, `sites`, `memberships`, `roles`, `invitations`;
- `pages`, `pageRevisions`, `contentBlocks`, `contentVisibilityRules`;
- `navigationItems`, `assets`, `themeTokens`, `publishEvents`;
- `featureFlags`, `tenantEntitlements`, `integrationSettings`, `auditEvents`;
- site-scoped CRM, campaign, automation-safety, and AI-generation records already present.

Add or formalize these records:

| Record | Scope | Purpose |
| --- | --- | --- |
| `personaDefinitions` | site | Stable key, label, description, icon token, status, order, optional eligibility rules |
| `journeyStageDefinitions` | site | Stable key, label, order, entry/exit meaning, active status |
| `userAudienceContexts` | user + site | A user's selected persona, stage, passions, source, and update time for one site |
| `presentationProfiles` | site | Revision-aware section, navigation, hero/media, motion, and contrast composition |
| `experiments` | site | Type, status, allocation, dates, owner, approval, winner, revision binding |
| `experimentTargets` | site | Persona, journey, route, block, and eligibility targeting |
| `experimentVariants` | site | Control/treatment configuration and immutable content-revision reference |
| `experimentAssignments` | site + visitor/user | Sticky assignment with consent and eligibility snapshot |
| `experimentEvents` | site + visitor/user | Bounded event ingestion with dedupe and retention policy |
| `experimentRollups` | site | Aggregated metrics used for decisions and reporting |
| `metricProfiles` | tenant/site | Metric definitions, weights, sample thresholds, and direction |
| `experimentAutomationPolicies` | site | Cadence, limits, approval policy, rollback and promotion constraints |
| `supportAccessSessions` | tenant/site | Real actor, viewed-as subject, scope, reason, approval, expiry, permissions, status |
| `supportAccessEvents` | tenant/site | Start, use, denied action, extension, termination, and expiry records |

### Scoped support access contract

Support access must meet all of these conditions:

- platform support permission or a same-tenant delegated support permission;
- required tenant and site selection;
- required reason and ticket/reference string;
- short server-enforced expiry;
- step-up authentication before start;
- read-only default with individually enumerated temporary actions;
- no support access to secrets, payment credentials, raw provider tokens, or protected identity settings;
- a persistent banner showing tenant, site, subject, scope, and expiry;
- a kill switch available to the actor, tenant owner, and platform super admin;
- every request carries `actorUserId`, optional `subjectUserId`, `supportSessionId`, and resolved scope;
- every action writes a dual-attribution audit record;
- any scope-resolution or session-validation error fails closed.

### Experiment contract

Experiment evaluation order:

1. Resolve the published site from hostname/subdomain.
2. Resolve route and published page revision.
3. Resolve audience context for presentation only.
4. Select active experiments for that site, route, and immutable content revision.
5. Enforce consent, allocation, exclusions, dates, and mutual-exclusion group.
6. Reuse a site-bound sticky assignment or create one idempotently.
7. Return an allowlisted presentation override.
8. Ingest deduplicated allowlisted events.
9. Aggregate metrics without unbounded raw-event reads.
10. Require human approval for winner promotion until a separate automation policy is explicitly accepted.

An experiment can never reference a page, block, asset, metric profile, or variant from another site.

## Seven-Phase Delivery Roadmap

### Phase 0 — Architecture contract and source register

Objective: establish one verified inventory, boundary model, and migration sequence.

Deliverables:

- this roadmap;
- source-to-target record map;
- explicit classification of implemented, provider-light, preview-only, and missing capability;
- documented exclusions for live execution and deployment.

Gate:

- documentation review confirms that legacy Julie capability is not mistaken for tenant-safe KinFlo capability.

Status: complete in this architecture lane.

### Phase 1 — Tenant/site context and authorization integrity

Objective: make the existing Convex scope model the only authority for new KinFlo functionality.

Work:

- define a server-resolved active tenant/site context;
- inventory every Convex query, mutation, and action for scope guard coverage;
- close any mismatch between document `tenantId`, `siteId`, and requested scope;
- add negative tests for cross-tenant IDs, cross-site references, stale memberships, revoked invitations, and removed roles;
- define tenant-safe pagination and bounded query requirements;
- keep legacy Julie routes isolated during migration.

Gate:

- all targeted functions pass same-tenant positive tests and cross-tenant denial tests;
- no migrated surface relies on client filtering for authorization;
- audit events record resolved scope and actor.

### Phase 2 — Universal personas, journeys, and content

Objective: move Julie's audience and content behavior into reusable site definitions.

Work:

- add `personaDefinitions`, `journeyStageDefinitions`, and `userAudienceContexts`;
- replace hardcoded labels and Julie-named storage keys with site-resolved configuration;
- validate visibility rules against active definitions from the same site;
- formalize block-type schemas and content provenance;
- persist a revision-aware `presentationProfiles` record for the site composer after separate implementation approval;
- keep anonymous audience state presentation-only and consent-aware;
- preserve a default/explorer experience when no persona is chosen.

Gate:

- Julie and a synthetic second site define different personas and journey stages without code changes;
- both render from the same page/block/visibility pipeline;
- cross-site persona, block, asset, and page references fail;
- preview never changes published state.

### Phase 3 — Tenant-safe experimentation

Objective: reproduce the useful legacy A/B system without global IDs or unsafe automation.

Work:

- create the site-scoped experiment record family;
- migrate manual test creation, targeting, variants, sticky assignment, events, rollups, and analytics first;
- bind variants to immutable page/block revisions;
- establish event allowlists, idempotency keys, consent fields, bot filtering, retention, and aggregation limits;
- migrate metric profiles and historical baselines;
- move AI generation metadata into the existing provenance/review model;
- keep auto-promotion disabled until approval, sample-size, confidence, rollback, and audit policies pass.

Gate:

- simultaneous Julie and second-site experiments cannot read, assign, ingest, or report against each other's records;
- assignment is sticky within one site and independent across sites;
- event replay is deduplicated;
- winner promotion creates a reviewable content revision and never directly mutates published content.

### Phase 4 — Scoped support access

Objective: replace global identity-swapping impersonation with bounded, attributable support sessions.

Work:

- create `supportAccessSessions` and `supportAccessEvents`;
- carry actor and subject separately through request context;
- require scope, reason, reference, expiry, and step-up authentication;
- ship read-only mode first;
- add tenant-owner visibility and revocation;
- migrate the banner and end-session experience;
- prohibit nested support sessions and cross-tenant target selection.

Gate:

- middleware and function failures deny support-context access;
- every read and attempted write has dual attribution;
- expiry and revocation take effect server-side without browser cooperation;
- another tenant's users never appear as selectable targets.

### Phase 5 — Julie's Family founding-tenant migration

Objective: migrate Julie's configuration and behavior as data while preserving rollback.

Work:

- create a versioned Julie source manifest;
- map legacy users to KinFlo identities and scoped memberships;
- import persona/journey definitions, pages, blocks, visibility, assets, and content revisions;
- migrate experiments only after Phase 3 is accepted;
- migrate support access only after Phase 4 is accepted;
- run read-only comparison reports before any cutover;
- keep legacy routes and data available for rollback until acceptance.

Gate:

- record counts, referential integrity, visibility results, rendered routes, and experiment history reconcile within documented tolerances;
- no private record appears in the public projection;
- Julie administrators see only Julie scope;
- rollback rehearsal succeeds.

### Phase 6 — Second-tenant proof and controlled rollout

Objective: prove KinFlo is a reusable product rather than a Julie-specific migration.

Work:

- seed or onboard one synthetic/non-sensitive second tenant through the same factory;
- configure distinct roles, personas, journeys, presentation, content, and one manual experiment;
- run desktop/mobile visual QA plus API isolation tests;
- verify support access containment;
- exercise export, archive, and tenant-offboarding paths;
- produce a launch decision packet with exact remaining provider and deployment gates.

Gate:

- both tenants work on the same code paths with no tenant-specific conditionals;
- automated isolation tests cover reads, writes, public rendering, experiments, analytics, and support access;
- Human QA is requested only for the client-facing experience and is accompanied by a current-build privacy-safe MP4;
- deployment, provider activation, billing, and production cutover remain separately approved actions.

## Migration Order by Capability

| Order | Capability | Source | Target | Cutover posture |
| --- | --- | --- | --- | --- |
| 1 | Identity and scoped access | Auth0/OIDC + global roles | Convex identity + memberships + role catalog | isolate, do not replace Julie auth early |
| 2 | Persona/journey definitions | hardcoded client constants | site-scoped definitions | dual-read, compare, then site-resolved |
| 3 | Content and visibility | global Drizzle records | site-scoped blocks/rules/revisions | import, read-only compare, bounded switch |
| 4 | Presentation composition | local draft/open PR #52 | revision-aware site profile | persist only after separate approval |
| 5 | Experiments | global Drizzle A/B family | site-scoped experiment family | manual/read-only analytics first |
| 6 | Support access | global identity swap | scoped dual-attribution session | read-only first, legacy off after proof |
| 7 | Julie cutover | legacy routes and data | founding KinFlo tenant | reversible per-surface adapters |
| 8 | Product proof | Julie only | Julie + second tenant | release decision after isolation proof |

## Validation Matrix

Every implementation phase must cover these cases where applicable:

| Case | Expected result |
| --- | --- |
| Valid tenant member, valid site | permitted according to role |
| Valid tenant member, foreign site ID | denied without disclosing foreign data |
| Revoked membership | denied immediately |
| Site editor attempts publish | denied unless permission bundle explicitly grants it |
| Public request for draft page/block | not returned |
| Public request with foreign persona key | default/public-safe experience |
| Experiment variant references foreign block | rejected |
| Replayed experiment event | idempotent/no duplicate metric |
| Support actor selects foreign tenant user | target absent and request denied |
| Expired/revoked support session | denied server-side |
| Support-session action audit | records actor, subject, scope, session, outcome |
| Tenant archive/offboarding | public resolution disabled; private export/retention policy followed |

## Explicit Non-Goals for This Roadmap Lane

- No schema edits or migrations.
- No UI implementation.
- No Convex code generation.
- No hosted Convex query, mutation, action, seed, or smoke.
- No secret access and no `.env.local` creation.
- No provider calls, external messages, billing, deployment, merge, or production activation.
- No assumption that open PR #52 is merged or that its local composer is persistent.
- No claim that legacy Julie impersonation is safe for multi-tenant use.

## Decision Register

The following decisions should be made before implementation, in order:

1. Accept Convex as the canonical product data and authorization plane for all new universal features.
2. Accept site-scoped persona and journey definitions rather than one global taxonomy.
3. Accept presentation-only audience context as separate from authorization identity.
4. Accept manual-first, revision-bound experimentation with auto-promotion disabled initially.
5. Replace identity swapping with scoped support access and dual attribution.
6. Select the synthetic/non-sensitive second tenant fixture used for isolation proof.
7. Approve each live migration or activation step separately after local/source validation.

## Next Gate

Architecture review should approve or amend the seven-phase sequence and the six decisions above. The first implementation lane should then be limited to **Phase 1 tenant/site context and authorization integrity**. It should not bundle personas, experiments, impersonation migration, provider activation, or deployment.
