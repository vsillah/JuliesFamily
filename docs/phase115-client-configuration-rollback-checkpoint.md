# Phase 115: Client Configuration Rollback Checkpoint

Phase 115 adds a provider-light rollback checkpoint packet to the compact Site Studio configuration lane.

Command:

```bash
npm run kinflo:validate-client-configuration-rollback-checkpoint
```

## What Changed

- `siteFactory.listClientWebsiteConfigurationRollbackCheckpoints` exposes the read-only Convex query contract.
- `siteFactoryListClientWebsiteConfigurationRollbackCheckpoints` is registered in the generated API contract without importing generated files.
- `ShellClientWebsiteConfigurationRollbackCheckpoint` models fixture baselines, rollback owners, rehearsal steps, blocked actions, and provider boundaries.
- `snapshot.clientWebsiteStudio.configurationRollbackCheckpoints` stores local rollback checkpoints for Julie Family, the advisor client site, and the campaign microsite.
- `selectedClientWebsiteConfigurationRollbackCheckpoint` resolves the selected-site checkpoint in the Site Studio configuration lane.
- `tab-kinflo-client-configuration-rollback-checkpoint` adds rollback evidence inside the save request packet instead of adding another long page section.
- `section-kinflo-client-configuration-rollback-checkpoint` keeps the checkpoint list bounded.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No rollback rehearsal, audit event write, save request capture, configuration save, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Client configuration needs a visible rollback path before the system can safely move toward live saves. The checkpoint packet makes the baseline, rollback owner, reversible action, and remaining blockers visible inside the same compact review surface that already holds save, audit, and function evidence.
