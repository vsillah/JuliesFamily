# KinFlo Phase 3: Website Configuration Studio

## Purpose

Phase 3 gives every KinFlo tenant/site a single, reviewable configuration boundary for its public website. It composes the existing hero, navigation, ordered content, brand, theme, and preview controls without importing generated Convex bindings or enabling live persistence.

## Scoped contract

- Every studio route carries `studioTenant` and `studioSite`.
- A missing or mismatched pair is blocked before the studio surface renders.
- An unknown tenant/site never falls back to Julie's Family fixture.
- Ordered sections and header navigation are deterministic and tenant/site scoped.
- Hero media, palette, navigation contrast, motion preference, and fixture brand provenance are visible in one local draft boundary.
- Desktop, tablet, and mobile preview state is local to the studio session.
- The state machine exposes `draft`, `review`, and `blocked` states.
- Save, publish, upload, and storage actions remain disabled.

## Validation

```text
npm run kinflo:test-website-configuration-studio
npm run kinflo:validate-client-website-studio
npm run check
git diff --check
```

This phase intentionally does not run Convex codegen, hosted smoke, environment changes, provider calls, uploads, data mutations, or production deployment.

## Follow-on gates

The next gate is captain review of the draft PR. Live persistence, publish, uploads, and provider activation require separate approvals after the source contract and tenant/site isolation are accepted.
