# Phase 137: Hosted Activation Sanitized Preflight Repository Record Approval

Phase 137 adds a prepare-only owner approval checklist for the eventual sanitized hosted activation preflight repository record.

Validation command:

```bash
npm run kinflo:validate-hosted-activation-sanitized-preflight-repository-record-approval
```

## Added Surface

- `sanitizedPreflightRepositoryRecordApproval` in the hosted activation runbook fixture.
- `ShellHostedActivationSanitizedPreflightRepositoryRecordApproval` and `ShellHostedActivationSanitizedPreflightRepositoryRecordApprovalItem` types.
- Admin shell card:
  - `section-kinflo-hosted-sanitized-preflight-repository-record-approval`
  - `section-kinflo-hosted-sanitized-preflight-repository-record-approval-summary`
  - `text-kinflo-hosted-sanitized-preflight-repository-record-approval`
  - `section-kinflo-hosted-sanitized-preflight-repository-record-approval-items`
  - `section-kinflo-hosted-sanitized-preflight-repository-record-approval-rules`
  - `button-hosted-sanitized-preflight-repository-record-approval-gated`
- Proposed record path remains `docs/convex-activation-preflight-sanitized-result.json`.

## Approval Items

The owner approval checklist has five items:

1. `prior-phase-acceptance`
2. `six-field-record-shape`
3. `private-evidence-boundary`
4. `repo-safe-stop-conditions`
5. `post-record-next-gate`

## Approval Rules

The proposed record path is not created in this phase. The eventual repository record may be approved only after Phase 132 private raw-output storage, Phase 133 redaction, Phase 134 sanitized capture, Phase 135 commit review, and Phase 136 repository record packet are owner-accepted.

The eventual record may include only:

- the six sanitized fields,
- the decision id,
- the approved owner posture,
- and one short non-secret note.

The repo-safe record path requires `external-writes` to equal `0` and `hosted-deployment-touched` to equal `false`.

## Provider Boundary

No sanitized hosted preflight repository record is approved, created, or committed.

No raw preflight output, command log, stack trace, private evidence location, provider identifier, hosted deployment identifier, dashboard URL, local path, secret, masked secret fragment, or generated Convex API content is committed.

No activation preflight is run against real hosted env values.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API, tenant/site launch, public publish, lead write, invite, campaign send, domain action, production import, adapter switch, or client sharing action is executed.

## Next Gate

After Vambah accepts the Phase 137 approval checklist, the repo may create the sanitized result record at `docs/convex-activation-preflight-sanitized-result.json` with only the approved sanitized fields and note. Codegen, generated API import, live smoke, adapter switch, and provider writes remain separately gated after that record.
