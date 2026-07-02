# Phase 109: Preview Review Shell Adapter

Phase 109 wires the Site Studio preview review panel to the provider-light shell data contract created in Phase 108.

Command:

```bash
npm run kinflo:validate-preview-review-shell-adapter
```

## Added Surface

- Shell data type: `ShellClientWebsitePreviewReviewPacket`
- Shell data collection: `snapshot.clientWebsiteStudio.previewReviewPackets`
- Admin selection: `selectedClientWebsitePreviewReviewPacket`
- Admin review context source: `selectedClientWebsitePreviewReviewPacket.context`
- Admin evidence source: `selectedClientWebsitePreviewReviewPacket.evidenceChecklist`
- Admin blocked actions source: `selectedClientWebsitePreviewReviewPacket.blockedLiveActions`

## What Changed

The preview review panel no longer builds its review packet from UI-local static arrays. The same visible panel now selects a provider-light packet for the active client website from shell data.

The three current client site examples are represented:

- `julies-family-public`
- `advisor-client-site`
- `campaign-microsite`

Each packet carries preview path, route, persona, journey stage, device, review source, launch decision, context chips, evidence checklist, blocked live actions, client-share requirements, and Convex function references.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No client preview is shared.

No tenant, site, invitation, content, hosted QA, publish, lead, campaign, provider, generated API, or hosted activation write is executed.

No secret values are read or printed.

## Why This Matters

This turns the review packet into adapter-shaped shell data. When generated Convex API bindings are approved, the preview review panel has a clear read-only contract to switch from fixture data to `siteFactory.listClientWebsitePreviewReviewPackets` without redesigning the UI.
