# Phase 5 Local Readiness Validator

This phase adds a repo-local validator for the KinFlo Convex migration lane.

## Added Scope

- Script: `scripts/validate-kinflo-phases.mjs`.
- Package command:

```bash
npm run kinflo:validate-phases
```

The validator checks that the local migration packet still has the required docs, Convex scaffold modules, KinFlo OS shell files, provider-light boundaries, and secret-handling guard rails.

## What It Verifies

- `.env.local` is not tracked.
- Convex generated runtime files under `convex/_generated/` are not tracked.
- Phase 0-4 docs exist.
- Required Convex modules exist:
  - `schema.ts`
  - `controlPlane.ts`
  - `siteBuilder.ts`
  - `siteFactory.ts`
  - `publicSite.ts`
  - `activation.ts`
- The KinFlo OS shell and shell data adapter exist.
- The migration map references the core Convex target tables.
- The package `convex:check` command includes the activation module.
- The docs preserve the no-hosted-deployment boundary.
- The Drizzle-to-Convex migration map validator exists and is wired through `npm run kinflo:validate-map`.

## Current Boundary

This validator is local-only. It does not call Convex, Vercel, GitHub, databases, auth providers, or production services.

It is meant to catch migration drift before the hosted ownership/auth/backup gate is approved.

## Validation

Current validation:

- `npm run kinflo:validate-phases`: passes.
- `npm run kinflo:validate-map`: passes.
- `npm run convex:check`: passes.
- `npm run build`: passes.

Known not run:

- `npm run convex:codegen`: blocked until a Convex deployment is configured.
- Live Convex smoke: blocked until Convex auth/deployment setup is approved.
