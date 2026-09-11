# Phase 114: Client Configuration Audit Timeline

Phase 114 adds a provider-light configuration audit timeline to the compact Site Studio configuration lane.

Command:

```bash
npm run kinflo:validate-client-configuration-audit-timeline
```

## What Changed

- `siteFactory.listClientWebsiteConfigurationAuditTimelines` exposes the read-only Convex query contract.
- `ShellClientWebsiteConfigurationAuditTimeline` records evidence events, actor labels, rollback notes, blocked live actions, and provider boundaries.
- `snapshot.clientWebsiteStudio.configurationAuditTimelines` stores local audit timelines for Julie Family, the advisor client site, and the campaign microsite.
- `selectedClientWebsiteConfigurationAuditTimeline` follows the currently selected Site Studio site.
- `tab-kinflo-client-configuration-audit-timeline` adds audit evidence as a fourth tab inside the save request packet instead of adding another long page section.
- `section-kinflo-client-configuration-audit-timeline` keeps the event list bounded.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No audit event write, save request capture, configuration save, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The super-admin shell now has a readable evidence trail for each configurable client site. A reviewer can see which events are accepted, pending, or blocked before any future write path records audit events in hosted Convex.
