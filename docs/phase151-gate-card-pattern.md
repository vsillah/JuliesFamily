# Phase 151: GateCard Pattern

Phase 151 implements the accepted Claude Code `gate-card-pattern` delta as a shared provider-light UI pattern.

Command:

```bash
npm run kinflo:validate-gate-card-pattern
```

## Added Surface

- shared component: `GateCard`
- persistent identity gate: `section-kinflo-persistent-identity-gate`
- persistent identity gate state: `text-kinflo-persistent-identity-gate`
- persistent identity reason: `text-kinflo-persistent-identity-gate-reason`
- persistent identity unblock path: `text-kinflo-persistent-identity-gate-unblock`
- persistent identity owner: `text-kinflo-persistent-identity-gate-owner`
- active object gate: `section-kinflo-active-object-unblock-condition`
- active object state: `text-kinflo-active-object-gate-state`
- active object reason: `text-kinflo-active-object-disabled-reason`
- active object unblock path: `text-kinflo-active-object-unblock-path`
- active object owner: `text-kinflo-active-object-gate-owner`

## What Changed

The header gate and active-object gate now use one shared `GateCard` contract instead of separate disabled button blocks.

Every GateCard shows:

- title,
- state,
- reason blocked,
- unblock path,
- owner,
- disabled gated action.

The first implementation keeps the existing gate test IDs for the persistent identity strip and active-object signal, then adds explicit reason, unblock, owner, and state test IDs. This makes the blocked live action visible and inspectable without hiding the rationale in a tooltip.

The Site Studio identity strip continues to show the selected tenant/site context before any launch, invite, publish, lead, campaign, domain, provider, or hosted Convex action is enabled.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The SaaS shell needs one consistent visual register for blocked actions. GateCard makes the owner, evidence path, and blocked reason visible wherever a user is looking at a disabled action, which is the operating posture needed before live Convex activation.
