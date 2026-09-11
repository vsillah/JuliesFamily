# Phase 92: Hosted Smoke Evidence Ledger

Phase 92 prepares the evidence ledger for the hosted smoke execution window. It does not run hosted Convex, codegen, generated API imports, provider calls, writes, campaigns, AI calls, public publish, transcript capture, or client sharing.

Command:

```bash
npm run kinflo:validate-hosted-smoke-evidence-ledger
```

## Added Surface

- Data type: `ShellHostedSmokeEvidenceLedger`
- Runbook field: `hostedActivationRunbook.hostedSmokeEvidenceLedger`
- Admin route: `/admin/kinflo-os?tab=hosted-activation`
- Shell card: `section-kinflo-hosted-smoke-evidence-ledger`
- Summary: `section-kinflo-hosted-smoke-evidence-summary`
- Bounded evidence list: `section-kinflo-hosted-smoke-evidence-scroll`
- Gated button: `button-hosted-smoke-evidence-gated`

## Ledger Counts

- Total evidence entries: 6
- Pending entries: 6
- Total functions: 28
- Blocked entries: 6

## Evidence Order

1. `read-only-core`
2. `user-scoped-preferences`
3. `site-creation-and-admin`
4. `public-crm-loop`
5. `provider-readiness-records`
6. `campaign-and-ai-governance`

Each entry records expected transcript shape, evidence slots, acceptance criteria, abort condition, rollback reference, owner, blocked-until state, and explicit `canRecord: false` posture.

Phase 165 refreshes this evidence ledger against the current Phase 91 sequencer. The adapter-switch plan maps 42 functions, the live-smoke manifest covers 14 adapter-switch functions, and the six evidence entries now cover the remaining 28 gaps. The `site-creation-and-admin` evidence entry covers `siteFactory.listClientWebsiteLaunchComposer` plus configuration, domain, invitation, blueprint, experience preset, and permission-preset reads.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No hosted smoke transcript is recorded.

No provider metadata write, campaign send, AI provider call, public publish, lead write, invite send, domain operation, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The Phase 91 sequencer defines the order. Phase 92 defines what evidence must be captured for each batch before adapter switch can be considered. That keeps the eventual hosted smoke run auditable, reversible, and bounded to owner-approved proof.
