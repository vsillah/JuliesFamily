# Phase 174: Hosted Read-Only Smoke QA Plan

Phase 174 prepares the minimum hosted read-only smoke lane after generated API approval. It does not run hosted Convex, codegen, generated API imports, provider calls, writes, campaigns, AI calls, public publish, transcript capture, adapter switch, or client sharing.

Command:

```bash
npm run kinflo:validate-hosted-read-only-smoke-qa-plan
```

## Current Gate

Generated API cutover is not approved in committed repo truth.

The current owner-review scoreboard keeps:

- Generated API import: blocked
- Hosted smoke execution: blocked
- Fixture adapter switch: blocked
- Provider writes: blocked
- Live Convex execution: blocked

This lane is therefore evidence-readiness only until Sundiata and Vambah approve the generated API review window and the hosted read-only smoke window.

## Minimum Read-Only Sequence

After generated API approval, run only these hosted read-only checks first and stop before any mutation, metadata write, governance write, provider call, adapter switch, tenant/site creation, lead write, invite send, campaign send, domain verification, production import, public publish, or client sharing.

1. `read-only-core`
   - `launchReadiness.getSiteLaunchReadiness`
2. `user-scoped-preferences`
   - `preferences.getMyPreferences`
3. `site-creation-and-admin`
   - `siteFactory.listClientWebsiteAdminPermissionPresets`
   - `siteFactory.listClientWebsiteConfigurationApprovalMatrices`
   - `siteFactory.listClientWebsiteConfigurationAuditTimelines`
   - `siteFactory.listClientWebsiteConfigurationChangeSets`
   - `siteFactory.listClientWebsiteConfigurationReviewPackets`
   - `siteFactory.listClientWebsiteConfigurationProfiles`
   - `siteFactory.listClientWebsiteConfigurationPublishReadiness`
   - `siteFactory.listClientWebsiteConfigurationRollbackCheckpoints`
   - `siteFactory.listClientWebsiteConfigurationSaveRequests`
   - `siteFactory.listClientWebsiteDomainReadinessPackets`
   - `siteFactory.listClientWebsiteAdminInvitationReadinessPackets`
   - `siteFactory.listClientWebsiteExperienceConfigurationPresets`
   - `siteFactory.listClientWebsiteLaunchBlueprints`
   - `siteFactory.listClientWebsiteLaunchComposer`
4. `public-crm-loop`
   - `crm.listJourneyProgressionRules`
5. `provider-readiness-records`
   - `integrations.listIntegrationSettings`
6. `campaign-and-ai-governance`
   - `campaigns.listCampaignDrafts`
   - `aiReview.listAiGenerationRecords`

Minimum read-only total: 20 functions.

## Evidence To Capture Later

- sanitized hosted response excerpts with no secrets, local paths, provider ids, deployment ids, raw stack traces, or account data
- tenant, site, user, and role-scope proof for each read
- disabled state proof for provider actions, save, publish, invite, lead, campaign, domain, adapter-switch, and launch controls
- generated binding names checked against the generated API contract
- abort note if any response leaks scope, enables a blocked action, or diverges from the selected smoke tenant/site

## Explicitly Out Of Scope

These current gaps stay blocked until separate owner approval after the read-only sequence passes:

- Mutation gaps: 3
- Provider-gated metadata gaps: 1
- Governance write gaps: 4

Do not run `npm run kinflo:dry-run-live-smoke` or any mutation-backed hosted smoke from this lane. That later sequence belongs to the broader live-smoke manifest and requires separate mutation order, rollback owner, cleanup, provider pause, and evidence-storage approval.

## Validation Surface

This plan is kept in parity with:

- `client/src/lib/kinfloShellData.ts`
- `docs/phase90-hosted-smoke-gap-backlog.md`
- `docs/phase91-hosted-smoke-execution-sequencer.md`
- `docs/phase92-hosted-smoke-evidence-ledger.md`
- `docs/phase166-hosted-smoke-evidence-deep-link-parity.md`
- `docs/phase172-generated-api-cutover-readiness-scoreboard.md`
- `docs/phase173-generated-api-cutover-rollback-drill-matrix.md`

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No fixture adapter switch is performed.

No hosted smoke is executed.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The current evidence surfaces track six batches and 28 hosted-smoke gaps, but not all 28 are safe for the first hosted smoke window. This plan isolates the 20 read-only checks that can prove scope and generated binding parity before any mutation, provider, governance, or adapter-switch gate is opened.
