# Phase 76: Active Object Signal

Phase 76 implements the first provider-light design item from the Phase 75 design-frame backlog: make the active tenant/site object visible in the first Kinflo OS viewport.

Command:

```bash
npm run kinflo:validate-active-object-signal
```

## Added Surface

- Data contract: `ShellActiveObjectSignal`
- Snapshot field: `activeObjectSignal`
- Admin surface: `section-kinflo-active-object-signal`
- Disabled live gate: `button-active-object-live-gated`
- Unblock surface: `section-kinflo-active-object-unblock-condition`

## Operating Frame

The active object is the Julie Family founding public site. The shell shows the object type, tenant slug, site key, fixture environment, readiness posture, owner, next decision, required evidence, blocked live actions, and unblock condition in the first viewport.

This turns the super-admin shell from a generic dashboard into an object-oriented operating surface: Vambah can see what is selected, why it is not live, who owns the decision, and what proof must be accepted before public launch or adapter switch.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant/site launch, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Validation

```bash
npm run kinflo:validate-active-object-signal
npm run kinflo:validate-design-frame-backlog
npm run kinflo:validate-saas-execution-ledger
npm run kinflo:validate-phases
npm run kinflo:check-baseline
npm run convex:check
npm run build
git diff --check
```
