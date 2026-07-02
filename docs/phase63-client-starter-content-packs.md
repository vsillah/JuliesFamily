# Phase 63 Client Starter Content Packs

## Validation

```bash
npm run kinflo:validate-client-starter-content-packs
npm run kinflo:dry-run-client-starter-content-packs
```

## Scope

Phase 63 adds provider-light starter content packs for the Phase 6 site factory and client onboarding milestone.

- Manifest: `docs/convex-client-starter-content-pack-manifest.json`.
- Convex function: `siteFactory.listClientWebsiteStarterContentPacks`.
- Status: `provider-light-read-only-query-contract`.
- Starter content packs: 3.
- Pack pages: 9.
- Starter blocks: 18.
- Live content seeding: gated.

The packs give each client type a repeatable first content outline:

- Julie Family public learning site,
- Advisor proof-led client site,
- Campaign conversion microsite.

## Provider Boundary

- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- Content seed written: no.
- Provider APIs touched: no.
- Secrets read or printed: no.

No page, content block, visibility rule, publish, lead, campaign, AI, email, SMS, storage, domain, billing, provider, generated API, or hosted Convex write is executed by this phase.

## Next Activation Gate

The starter packs can become executable content seeding only after hosted Convex activation, generated API review, source-safe content review, read-only hosted smokes, mutation smoke cleanup, and rollback owner approval.
