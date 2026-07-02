# Phase 82: Configuration Field Affordances

Phase 82 implements the seventh provider-light design item from the Phase 75 design-frame backlog: standardize configuration fields with concise labels, state badges, provenance notes, activation evidence, and disabled live-action controls that explain the hosted gate.

Command:

```bash
npm run kinflo:validate-configuration-field-affordances
```

## Added Surface

- Reusable component: `ConfigurationAffordanceStrip`
- Configuration affordance surfaces:
  - `section-kinflo-configuration-affordance-brand`
  - `section-kinflo-configuration-affordance-navigation`
  - `section-kinflo-configuration-affordance-content`
  - `section-kinflo-configuration-affordance-assets`
  - `section-kinflo-configuration-affordance-domains`
  - `section-kinflo-configuration-affordance-integrations`
  - `section-kinflo-configuration-affordance-campaigns`
  - `section-kinflo-configuration-affordance-ai-review`

## What Changed

The configuration-heavy admin tabs now share one visible affordance strip above their draft controls. Each strip shows:

- the configuration surface and selected object,
- whether the current state is a fixture or local edit,
- provenance notes for the selected field packet,
- activation evidence pulled from the existing provider-light snapshot,
- the specific blocked live action,
- and a disabled gated action button.

This keeps the shell configurable without implying hosted Convex, provider writes, content publish, campaign sends, AI calls, DNS writes, or asset uploads are active.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, asset upload, AI generation, or client sharing is performed.

No secret values are read or printed.

## Validation

```bash
npm run kinflo:validate-configuration-field-affordances
npm run check
git diff --check
```
