# KinFlo Phase 2 Universal Audience and Content Foundation

Status: source implementation and local validation only

Contracts: `docs/kinflo/universal-tenant-site-roadmap.md` and `docs/kinflo/phase1-tenant-site-scope-integrity.md`

Hosted Convex execution, code generation, seed/import execution, provider writes, deployment, production changes, experiments, communications, analytics, and `.env.local`: not authorized

## Bounded objective

This slice makes personas, journey stages, saved audience context, content targeting, and presentation drafts site-scoped without migrating Julie's Family or generalizing the Vanguard order system.

The durable records are:

- `personaDefinitions`: site-owned stable keys, labels, descriptions, icon tokens, ordering, status, and optional eligibility metadata;
- `journeyStageDefinitions`: site-owned stable keys, labels, ordering, status, and optional entry/exit meaning;
- `userAudienceContexts`: one consented, owner-only selection per user and site, with definition IDs and normalized passion tags;
- `presentationProfiles`: immutable, numbered draft revisions for presentation composition and source provenance.

Existing `contentVisibilityRules` retain their legacy string fields for rollback compatibility and gain optional definition IDs. New or updated rules validate active definitions against the block's resolved tenant/site before storing canonical keys.

## Authorization and presentation boundary

- Persona and journey administration requires `content:edit` through the Phase 1 `requirePermission` path.
- Listing definitions and resolving admin preview context requires `site:view`.
- A signed-in user may read or write only their own site context. The client cannot supply a user ID, source, role, tenant ID, or authorization claim.
- Every supplied site resolves through `resolveActiveScope`; every referenced definition or profile must match that tenant/site.
- Audience context is passed only to visibility and presentation resolution. It is never passed to permission evaluation.
- Withdrawing personalization consent deletes the saved context instead of retaining a dormant preference.

## Public and preview behavior

`publicSite.resolvePublishedSite` now returns an allowlisted set of active persona and journey definitions and resolves requested keys before applying visibility rules.

- A configured site accepts only active keys from its own definitions.
- Unknown, inactive, or foreign values collapse to the explorer presentation.
- A site with no definitions keeps the legacy string-targeting behavior so Julie's current rollout is not cut over implicitly.
- `audience.resolveAdminPreviewContext` may read a same-site draft presentation revision, but it performs no mutation and reports `changesPublishedState: false`.
- `audience.createDraftPresentationProfileRevision` always creates a `draft`; this slice contains no publish mutation.

## Content contract

New or updated Convex content blocks carry `schemaVersion: kinflo-content-block-v1` and structured provenance. Metadata and presentation composition must be JSON objects and are rejected above the bounded source-review limit. Existing records remain valid because the added fields are optional in the schema.

This is the first version marker and provenance boundary, not a complete per-block-type migration. Tightening hero, form, campaign, and custom-block payloads should happen in separate compatibility-reviewed slices.

## Focused validation

- `npm run kinflo:test-audience-policy` covers two sites with different definitions, explorer fallback, legacy compatibility, cross-site denial, normalization, passion-tag bounds, and presentation composition limits.
- `npm run kinflo:validate-phase2-audience-foundation` protects schema presence, scoped writes, owner-only consented context, read-only preview, draft-only presentation revisions, definition-backed visibility, bounded reads, and package scripts.
- `npm run convex:check` includes the new Convex modules.
- Phase 1 scope tests and validators remain required regression checks.

## Preserved behavior and remaining gates

- Julie's Express/OIDC/session routes and existing global persona behavior are unchanged.
- Sites without canonical definitions keep legacy visibility-string behavior.
- Vanguard's public fixture, fixed-target order routes, ownership checks, and adapter gates are unchanged.
- No client UI, generated binding, seed, migration runner, hosted function, provider, deployment, or production state changed.
- A later compatibility slice must define initial Julie and synthetic second-site data packets, execute approved data migration, wire generated bindings, and prove both sites through the same hosted page/block pipeline.
- A/B experimentation, email/SMS delivery, Kanban routing, and analytics remain later roadmap phases.
