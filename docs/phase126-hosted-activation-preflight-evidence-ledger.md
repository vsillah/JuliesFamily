# Phase 126: Hosted Activation Preflight Evidence Ledger

Phase 126 adds a redacted evidence ledger for the future hosted activation preflight window. It defines the only evidence that may be recorded from `npm run kinflo:activation-preflight` before real hosted env values, codegen, generated API imports, or live Convex smokes are approved.

Command:

```bash
npm run kinflo:validate-hosted-activation-preflight-evidence-ledger
```

## Added Surface

- data object: `hostedActivationRunbook.activationPreflightEvidenceLedger`
- type: `ShellHostedActivationPreflightEvidenceLedger`
- entry type: `ShellHostedActivationPreflightEvidenceEntry`
- decision id: `activation-preflight-window`
- review packet: `docs/phase126-hosted-activation-preflight-evidence-ledger.md`
- admin route: `/admin/kinflo-os?tab=hosted-activation`
- review panel: `section-kinflo-hosted-activation-preflight-evidence-ledger`
- summary: `section-kinflo-hosted-activation-preflight-evidence-summary`
- next gate: `text-hosted-activation-preflight-evidence-next-gate`
- entries scroll: `section-kinflo-hosted-activation-preflight-evidence-scroll`
- blocked actions: `section-kinflo-hosted-activation-preflight-evidence-blocked-actions`
- disabled gate: `button-hosted-activation-preflight-evidence-gated`

## Review State

- Total preflight evidence entries: 5
- Pending preflight evidence entries: 5
- Accepted preflight evidence entries: 0
- Owner: Vambah
- Status: `prepare_only_preflight_evidence_ledger`

## Evidence Entries

1. `local-env-presence-summary`: record only `Local .env.local present: yes or no`.
2. `generated-directory-presence-summary`: record only `Generated Convex directory present: yes or no`.
3. `hosted-env-visibility-summary`: record only `Hosted Convex env visible to this process: yes or no`.
4. `external-write-zero-proof`: record only `External writes: 0; Hosted deployment touched: no`.
5. `abort-and-cleanup-note`: record only `Abort path documented; sanitized summary committed only`.

## Storage Policy

- Commit sanitized yes/no summaries only.
- Keep raw command output outside committed source if it includes local paths, private deployment context, provider identifiers, or any secret-bearing text.
- Keep private hosted env evidence in 1Password or owner-held notes, not repo docs.
- Keep `convex/_generated` untracked and uncommitted.
- Keep `generatedApiAvailable` false until generated API review is approved.

## Blocked Actions

- enter real hosted Convex or auth env values
- run npm run kinflo:activation-preflight against real hosted env values
- commit raw activation preflight logs
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

No raw activation preflight logs are committed.

No secret-bearing preflight output is committed.

No Convex codegen is run.

No generated Convex API files are created, committed, or imported.

No fixture adapter is switched to generated API bindings.

No live Convex query, mutation, action, smoke execution, production import, or provider write is performed.

## Why This Matters

The preflight command is only useful if the team can trust its evidence trail. This ledger keeps the approved evidence narrow, redacted, and reviewable so the activation window can move forward later without turning local readiness checks into secret storage or live-provider execution.
