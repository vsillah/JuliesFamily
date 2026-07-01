# Phase 0 Baseline Report

Date: June 30, 2026

Workspace: `/Users/vambahsillah/Documents/KinFlo CRM`

Source repo: `https://github.com/vsillah/JuliesFamily`

Branch: `codex/kinflo-phase-0-convex-plan`

## Phase 0 Objective

Create a real KinFlo working tree from the Julie's Family GitHub source, harden secret and environment handling, run baseline validation, and produce the Drizzle-to-Convex migration map before implementation phases proceed.

## Source Checkout

The placeholder KinFlo repo has been bound to `vsillah/JuliesFamily` as `origin`, fetched from `origin/main`, and checked out into the current workspace.

Local planning artifacts were preserved:

- `docs/kinflo-saas-adoption-plan.md`
- `excalidraw.log`

## Secret And Env Handling

The source repository included a tracked `.env.local` file. It was not opened or printed.

Action taken:

- `.env.local` was removed from the git index.
- `.env.local` was removed from the local working tree.
- `.env.example` remains available as the non-secret configuration template.
- The existing `.gitignore` already ignores `.env`, `.env.local`, and `.env.*.local`.

Required next security action before any production connection:

- Treat any credential ever committed to `.env.local` as exposed.
- Rotate database, Stripe, SendGrid, Twilio, Google, Cloudinary, OpenAI/Gemini, object-storage, OAuth/OIDC, and webhook secrets if they were ever present in that file.
- Consider a git history purge before making the new KinFlo repo public or sharing it with clients.

## Dependency Baseline

Command run:

```bash
npm install
```

Result:

- Install completed.
- `node_modules` was created locally and remains ignored.
- npm reported 65 vulnerabilities: 4 low, 37 moderate, 23 high, and 1 critical.
- `npm audit --audit-level=critical` failed as expected due the audit baseline.
- Automatic audit fixes were not applied because several fixes are breaking changes and Phase 0 is a source-truth gate, not a dependency migration.

High-priority audit themes:

- `fast-xml-parser` critical vulnerability via transitive storage dependencies.
- `drizzle-orm` SQL identifier escaping advisory; fixed version requires a breaking update.
- `xlsx` high vulnerabilities with no fix available from npm audit.
- `multer`, `axios`, `express-rate-limit`, `undici`, `ws`, `rollup`, `preact`, and `lodash` advisories.

## Validation Baseline

Command run:

```bash
npm run build
```

Result: pass.

Notes:

- Vite production build completed.
- Browserlist data is stale.
- Main JS bundle is large at roughly 3 MB minified, 749 KB gzip.

Command run:

```bash
npm run check
```

Result: fail.

Failure type:

- Existing TypeScript drift across client components, shared defaults, and server storage interfaces.
- The build passes because Vite/esbuild does not enforce the same full typecheck gate.

Representative failure areas:

- Persona/default typing mismatch in `AdminPersonaSwitcher`, `useAdminPreviewState`, `contentDefaults`, and `valueEquation`.
- Query result typing issues in React Query components such as `CampaignTimeSeriesChart`.
- `useViewportTracking` API drift in `DonationCTA`, `EventCard`, and `ServiceCard`.
- Missing or mismatched storage interface imports in `server/storage.ts`.
- Cac/LTGP storage interface mismatches in `server/storage/cacLtgpStorage.ts`.
- Admin provisioning `ProgramType` mismatches in `server/storage/adminProvisioningStorage.ts`.
- Missing generated/type exports for several storage models, including campaign/channel/economics/SMS bulk related types.

## Current Repo State

Expected Phase 0 changes:

- `.env.local` removed from tracking.
- `docs/kinflo-saas-adoption-plan.md` added.
- `docs/phase0-baseline.md` added.
- `docs/drizzle-to-convex-migration-map.md` added.

Known local artifacts not intended for commit:

- `node_modules/`
- `dist/`

Known unrelated or preexisting local artifact:

- `excalidraw.log`

Known generated noise:

- `npm install` normalized `package-lock.json` in the local working tree. Do not include that change in a Phase 0 commit unless intentionally accepting npm lockfile normalization.

## Phase 0 Gate Status

Completed:

- Real source checkout created in the KinFlo workspace.
- Work moved to a scoped `codex/` branch.
- Tracked `.env.local` risk quarantined without reading secrets.
- Install baseline established.
- Build baseline established.
- Typecheck baseline established.
- Migration map produced.

Not completed:

- No credentials were rotated.
- No git history purge was performed.
- TypeScript failures were not fixed.
- Audit vulnerabilities were not fixed.
- No Convex code was added yet.

Recommendation:

Proceed to implementation only after deciding whether Phase 1 should first fix the type/audit baseline or isolate the new Convex shell behind fresh modules that do not depend on the broken Postgres storage layer.
