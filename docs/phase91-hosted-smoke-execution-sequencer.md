# Phase 91: Hosted Smoke Execution Sequencer

Phase 91 turns the hosted smoke gap backlog into an ordered, provider-light execution plan. It does not run hosted Convex, codegen, generated API imports, provider calls, writes, campaigns, AI calls, public publish, or client sharing.

Command:

```bash
npm run kinflo:validate-hosted-smoke-execution-sequencer
```

## Added Surface

- Data type: `ShellHostedSmokeExecutionSequencer`
- Runbook field: `hostedActivationRunbook.hostedSmokeExecutionSequencer`
- Admin route: `/admin/kinflo-os?tab=hosted-activation`
- Shell card: `section-kinflo-hosted-smoke-execution-sequencer`
- Summary: `section-kinflo-hosted-smoke-execution-summary`
- Bounded batch list: `section-kinflo-hosted-smoke-execution-scroll`
- Gated button: `button-hosted-smoke-execution-gated`

## Sequencer Counts

- Total batches: 6
- Total functions: 28
- Blocked batches: 6
- Read-only first: yes

## Batch Order

1. `read-only-core`
2. `user-scoped-preferences`
3. `site-creation-and-admin`
4. `public-crm-loop`
5. `provider-readiness-records`
6. `campaign-and-ai-governance`

Each batch records required approval, evidence target, abort condition, rollback plan, owner, blocked-until state, and explicit `canRun: false` posture.

Phase 164 refreshes this sequencer against the current Phase 90 backlog. The adapter-switch plan maps 42 functions, the live-smoke manifest covers 14 adapter-switch functions, and the remaining 28 gaps are now all represented in the execution order. The `site-creation-and-admin` batch includes the launch composer read contract, `siteFactory.listClientWebsiteLaunchComposer`, alongside the configuration, domain, invitation, blueprint, and permission-preset read smokes.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider metadata write, campaign send, AI provider call, public publish, lead write, invite send, domain operation, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The Phase 90 backlog identifies the gaps. Phase 91 gives the future hosted smoke window a batch order, abort rules, rollback evidence, and owner boundaries so activation can proceed deliberately after Vambah approves the human gates.
