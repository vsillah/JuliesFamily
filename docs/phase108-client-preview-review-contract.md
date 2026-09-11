# Phase 108: Client Preview Review Contract

Phase 108 moves the client preview review packet from a Site Studio UI-only packet into the read-only Convex site factory contract layer.

Command:

```bash
npm run kinflo:validate-client-preview-review-contract
```

## Added Contract

- Convex query: `siteFactory.listClientWebsitePreviewReviewPackets`
- Runtime key: `siteFactoryListClientWebsitePreviewReviewPackets`
- Generated API binding metadata: `siteFactoryListClientWebsitePreviewReviewPackets`
- Provider-light review posture: `provider-light-preview-review`
- Covered sites:
  - `julies-family-public`
  - `advisor-client-site`
  - `campaign-microsite`

## What The Contract Returns

Each preview review packet records:

- preview path, route, persona, journey stage, device, and review source,
- launch decision posture,
- review context chips,
- evidence checklist status,
- blocked live actions,
- requirements before client sharing,
- related visual QA, launch decision, starter content, and public preview function references.

The query also derives counts for evidence checklist items, accepted evidence, blocked evidence, blocked live actions, and requirements before client sharing.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No preview is shared with a client.

No tenant, site, invite, content, hosted QA, public publish, lead, campaign, provider, generated API, or hosted activation write is executed.

No secret values are read or printed.

## Why This Matters

The Site Studio review packet can now be treated as a real Convex-backed read model when the adapters are ready, while still remaining fixture-backed and safe today. This keeps the client preview workflow reviewable by site, tenant, launch decision, and visual QA posture before any provider activation or client sharing.
