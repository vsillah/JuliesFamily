# Phase 124: Hosted Activation Env And Codegen Review

Phase 124 promotes the `env-and-codegen-window` decision into an owner-visible Hosted Activation review packet. It prepares the local env-entry, activation preflight, Convex codegen, generated-file review, and rollback cleanup checklist that must be accepted before generated API bindings can be created.

Command:

```bash
npm run kinflo:validate-hosted-activation-env-codegen-review
```

## Added Surface

- data object: `hostedActivationRunbook.envCodegenReview`
- type: `ShellHostedActivationEnvCodegenReview`
- decision id: `env-and-codegen-window`
- review packet: `docs/phase124-hosted-activation-env-codegen-review.md`
- admin route: `/admin/kinflo-os?tab=hosted-activation`
- review panel: `section-kinflo-hosted-activation-env-codegen-review`
- summary: `section-kinflo-hosted-activation-env-codegen-summary`
- next gate: `text-hosted-activation-env-codegen-next-gate`
- readiness scroll: `section-kinflo-hosted-activation-env-codegen-items-scroll`
- blocked actions: `section-kinflo-hosted-activation-env-codegen-blocked-actions`
- disabled gate: `button-hosted-activation-env-codegen-gated`

## Review State

- Total env/codegen readiness items: 6
- Blocked until prior gate: 6
- Accepted env/codegen readiness items: 0
- Owner: Vambah
- Status: `prepare_only_env_codegen_review`

## Readiness Items

1. `env-source-policy`: where real Convex, auth, provider, and smoke env values may be entered.
2. `local-env-entry-window`: historical gate identifier; the current policy requires an approved secret-store child-process injection window. `.env.local` must remain absent.
3. `activation-preflight-window`: when `npm run kinflo:activation-preflight` may run against real local env configuration.
4. `codegen-command-window`: when `npm run convex:codegen` may run and who reviews the generated diff.
5. `generated-file-review`: how generated bindings are compared with `KINFLO_GENERATED_API_BINDINGS` before import.
6. `rollback-cleanup`: how to return to fixture mode if env, codegen, or binding review fails.

## Blocked Actions

- enter real hosted Convex or auth env values
- run npm run kinflo:activation-preflight against real hosted env values
- run npm run convex:codegen
- commit generated Convex API files
- import convex/_generated/api
- set generatedApiAvailable true
- execute hosted read or mutation smoke
- switch fixture adapter to generated API
- perform provider writes or client launch

## Provider Boundary

No hosted Convex deployment is created or selected.

No real hosted env values are entered, read, printed, copied, or recorded in committed source.

No activation preflight is run against real hosted env values.

No Convex codegen is run.

No generated Convex API files are created, committed, or imported.

No fixture adapter is switched to generated API bindings.

No live Convex query, mutation, action, smoke execution, production import, or provider write is performed.

## Why This Matters

The codegen moment is the first point where local fixtures can become real generated bindings. That should not happen as a casual command. This packet makes the env source, preflight window, generated diff review, and rollback cleanup explicit before the project crosses that gate.
