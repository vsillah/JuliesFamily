# Phase 125: Hosted Activation Preflight Review

Phase 125 promotes the `activation-preflight-window` decision into an owner-visible Hosted Activation preflight review packet. It prepares the evidence, redaction, abort, and rollback checks for `npm run kinflo:activation-preflight` before that command is ever run against real hosted Convex env values.

Command:

```bash
npm run kinflo:validate-hosted-activation-preflight-review
```

## Added Surface

- data object: `hostedActivationRunbook.activationPreflightReview`
- type: `ShellHostedActivationPreflightReview`
- decision id: `activation-preflight-window`
- review packet: `docs/phase125-hosted-activation-preflight-review.md`
- command under review: `npm run kinflo:activation-preflight`
- admin route: `/admin/kinflo-os?tab=hosted-activation`
- review panel: `section-kinflo-hosted-activation-preflight-review`
- summary: `section-kinflo-hosted-activation-preflight-summary`
- next gate: `text-hosted-activation-preflight-next-gate`
- checks scroll: `section-kinflo-hosted-activation-preflight-checks-scroll`
- expected output: `section-kinflo-hosted-activation-preflight-expected-output`
- blocked actions: `section-kinflo-hosted-activation-preflight-blocked-actions`
- disabled gate: `button-hosted-activation-preflight-gated`

## Review State

- Total activation preflight checks: 6
- Blocked until prior gate: 6
- Accepted activation preflight checks: 0
- Owner: Vambah
- Status: `prepare_only_activation_preflight_review`

## Preflight Checks

1. `tracked-secret-check`: confirm `.env.local` and `convex/_generated` remain untracked.
2. `env-placeholder-check`: verify hosted Convex and auth env placeholders are documented without real values.
3. `hosted-env-visibility-check`: review yes/no hosted env visibility output without printing secret values.
4. `activation-command-scope`: confirm preflight validates local readiness only and performs no external writes.
5. `post-preflight-order`: keep codegen, generated API import, hosted smoke, and adapter switch behind later approval.
6. `evidence-capture-check`: define where preflight output and abort notes live without committing secrets.

## Expected Output

- `Local .env.local present: yes or no`
- `Generated Convex directory present: yes or no`
- `Hosted Convex env visible to this process: yes or no`
- `External writes: 0`
- `Hosted deployment touched: no`
- `Convex activation preflight passed only after local contract checks pass`

## Blocked Actions

- enter real hosted Convex or auth env values
- run npm run kinflo:activation-preflight against real hosted env values
- print or commit secret-bearing preflight output
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

No secret-bearing preflight output is committed.

No Convex codegen is run.

No generated Convex API files are created, committed, or imported.

No fixture adapter is switched to generated API bindings.

No live Convex query, mutation, action, smoke execution, production import, or provider write is performed.

## Why This Matters

`npm run kinflo:activation-preflight` is intentionally safer than codegen or live smoke, but it becomes sensitive once real hosted env values are present. This packet makes the allowed output, abort conditions, redaction boundary, and cleanup path explicit before the command is run in a real activation window.
