# Phase 111: Client Configuration Change Set

Phase 111 adds a provider-light selected-site configuration change set to Site Studio's Configure lane.

Command:

```bash
npm run kinflo:validate-client-configuration-change-set
```

## What Changed

The configuration lane now shows what a future save would attempt before any live write is enabled:

- `siteFactory.listClientWebsiteConfigurationChangeSets` exposes the read-only Convex query contract.
- `ShellClientWebsiteConfigurationChangeSet` records draft changes, locked changes, approval evidence, save blockers, blocked live actions, and provider boundaries.
- `snapshot.clientWebsiteStudio.configurationChangeSets` stores local change sets for Julie Family, the advisor client site, and the campaign microsite.
- `selectedClientWebsiteConfigurationChangeSet` follows the currently selected Site Studio site.
- `section-kinflo-client-configuration-change-set` keeps the chosen site's draft-save plan visible.
- `section-kinflo-client-configuration-change-set-draft` bounds the proposed local changes.
- `section-kinflo-client-configuration-change-blockers`, `section-kinflo-client-configuration-change-evidence`, and `section-kinflo-client-configuration-change-functions` keep blockers, evidence, and generated API functions in tabs.
- `button-client-configuration-change-set-gated` keeps the draft save disabled.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No configuration save, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Configurable client websites need more than a static profile. The shell must show the proposed save plan, the affected surfaces, and the reason each live action remains gated. This phase gives Vambah a compact cockpit for reviewing what would change before the future Convex-backed save path is allowed.
