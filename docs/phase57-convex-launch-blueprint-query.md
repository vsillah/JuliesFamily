# Phase 57 Convex Launch Blueprint Query

## Validation

```bash
npm run kinflo:validate-convex-launch-blueprint-query
```

## Scope

Phase 57 moves the client website launch blueprint contract into the read-only Convex site factory layer while keeping the admin shell on local fixture data.

- Admin route: `/admin/kinflo-os`.
- Convex function: `siteFactory.listClientWebsiteLaunchBlueprints`.
- Shell data mirror: `clientWebsiteStudio.launchBlueprints`.
- Launch blueprints: 3.
- Factory packet bridges: 2.
- Read-only query: yes.
- Provider posture: local state only.

## Query Contract

`siteFactory.listClientWebsiteLaunchBlueprints` returns each launch blueprint with:

- site key,
- label,
- optional launch packet id,
- template key,
- owner role,
- default pages,
- admin permission gates,
- launch sequence,
- blocked provider actions,
- mapped Convex functions,
- matched starter template metadata,
- starter template quality contract,
- provider boundary evidence.

## Provider Boundary

- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- Provider APIs touched: no.
- Secrets read or printed: no.
- No generated API is imported.
- No live Convex query, mutation, or action is executed.

## Next Activation Gate

The read-only query can be called by a live adapter only after hosted Convex activation is approved, generated API bindings are reviewed, and the first read-only adapter smoke proves the shell can fall back to fixtures without losing launch blueprint parity.
